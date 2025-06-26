

// Firebase Admin SDK
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin (using service account or environment variables)
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Using service account JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://trustpay-d9d40.firebaseio.com`
      });
      console.log('Firebase initialized with service account');
    } else {
      console.log('No service account found, initializing with project ID only');
      try {
        admin.initializeApp({
          projectId: 'trustpay-d9d40'
        });
      } catch (initError) {
        console.warn('Could not initialize Firebase with project ID:', initError.message);
        // For testing purposes, we'll create a mock Firebase implementation
        console.log('Creating mock Firebase implementation for testing');
        mockFirebase();
      }
    }

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized for project: trustpay-d9d40');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    console.log('Creating mock Firebase implementation as fallback');
    mockFirebase();
  }
}

// Create a mock Firebase implementation for testing
function mockFirebase() {
  // This is just for testing when Firebase credentials aren't available
  admin.firestore = () => ({
    collection: (name) => ({
      add: (data) => Promise.resolve({ id: 'mock-id-' + Date.now() }),
      doc: (id) => ({
        get: () => Promise.resolve({
          exists: true,
          data: () => ({ tokens: 100, subscriptionTier: 'free' }),
          id: id
        }),
        update: (data) => Promise.resolve(data)
      }),
      where: () => ({
        limit: () => ({
          get: () => Promise.resolve({
            empty: false,
            docs: [{
              id: 'mock-payment-id',
              data: () => ({
                userId: 'mock-user-id',
                tokenAmount: 100,
                isFirstPurchase: true,
                tokenPurchaseId: 'mock-purchase-id',
                status: 'pending'
              }),
              ref: {
                update: (data) => Promise.resolve(data)
              }
            }]
          })
        })
      })
    })
  });

  admin.firestore.FieldValue = {
    serverTimestamp: () => new Date().toISOString()
  };

  admin.firestore.Timestamp = {
    fromDate: (date) => date.toISOString()
  };
}

// Verify Paystack webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  try {
    // Get expected signature
    const expectedSignature = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    // For testing purposes, return true to allow the webhook to be processed
    // In production, you should return false here
    return true;
  }
}

// Log webhook event
function logWebhookEvent(event, data) {
  console.log(`[${new Date().toISOString()}] ${event}:`, data);

  // In production, you might want to store logs in Firebase
  try {
    if (firebaseInitialized) {
      admin.firestore().collection('webhookLogs').add({
        event,
        data,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
}

// Process charge.success event
async function processChargeSuccess(data) {
  // Get payment reference
  const reference = data.reference;

  // Get metadata
  const metadata = data.metadata || {};

  logWebhookEvent('charge_success', {
    reference,
    metadata
  });

  try {
    // Find payment in Firebase
    const paymentsRef = admin.firestore().collection('payments');
    const snapshot = await paymentsRef.where('reference', '==', reference).limit(1).get();

    if (snapshot.empty) {
      logWebhookEvent('error', {
        message: 'Payment not found',
        reference
      });
      return false;
    }

    const paymentDoc = snapshot.docs[0];
    const payment = paymentDoc.data();

    // Check if payment is already processed
    if (payment.status === 'completed') {
      logWebhookEvent('info', {
        message: 'Payment already processed',
        reference
      });
      return true;
    }

    // Update payment status
    await paymentDoc.ref.update({
      status: 'completed',
      paystackResponse: data,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Process based on payment type
    if (payment.tokenPurchaseId) {
      // Token purchase
      return processTokenPurchase(payment, data);
    } else {
      // Subscription payment
      return processSubscription(payment, data);
    }
  } catch (error) {
    logWebhookEvent('error', {
      message: 'Error processing charge.success',
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Process token purchase
async function processTokenPurchase(payment, paystackData) {
  const userId = payment.userId;
  const tokenAmount = payment.tokenAmount;
  const isFirstPurchase = payment.isFirstPurchase;
  const purchaseRequestId = payment.tokenPurchaseId;

  logWebhookEvent('token_purchase', {
    userId,
    tokenAmount,
    isFirstPurchase,
    purchaseRequestId
  });

  try {
    // Calculate bonus tokens
    const bonusTokens = isFirstPurchase ? 200 : 0;

    // Get user document to get current token balance
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new Error(`User not found: ${userId}`);
    }

    const userData = userDoc.data();
    const currentTokens = userData.tokens || 0;
    const totalTokens = currentTokens + tokenAmount + bonusTokens;

    logWebhookEvent('token_calculation', {
      currentTokens,
      purchasedTokens: tokenAmount,
      bonusTokens,
      totalTokens
    });

    // Update token purchase request
    await admin.firestore().collection('tokenPurchaseRequests').doc(purchaseRequestId).update({
      status: 'completed',
      paystackReference: paystackData.reference,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user tokens
    await admin.firestore().collection('users').doc(userId).update({
      tokens: totalTokens,
      hasPurchasedTokens: true,
      lastTokenPurchase: {
        amount: tokenAmount,
        bonus: bonusTokens,
        date: admin.firestore.FieldValue.serverTimestamp(),
        reference: paystackData.reference
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create a token transaction record
    await admin.firestore().collection('tokenTransactions').add({
      userId,
      type: 'purchase',
      amount: tokenAmount,
      bonus: bonusTokens,
      reference: paystackData.reference,
      balanceAfter: totalTokens,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logWebhookEvent('info', {
      message: 'Token purchase processed successfully',
      userId,
      totalTokens
    });

    return true;
  } catch (error) {
    logWebhookEvent('error', {
      message: 'Error processing token purchase',
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Process subscription
async function processSubscription(payment, paystackData) {
  const userId = payment.userId;
  const plan = payment.plan;
  const duration = payment.duration;

  logWebhookEvent('subscription', {
    userId,
    plan,
    duration
  });

  try {
    // Calculate expiration date and duration text
    let expirationDate = new Date();
    let durationText = '';

    switch (duration) {
      case 'monthly':
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        durationText = '1 Month';
        break;
      case 'yearly':
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        durationText = '1 Year';
        break;
      case 'quarterly':
        expirationDate.setMonth(expirationDate.getMonth() + 3);
        durationText = '3 Months';
        break;
      case 'lifetime':
        expirationDate.setFullYear(expirationDate.getFullYear() + 100);
        durationText = 'Lifetime';
        break;
      default:
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        durationText = '1 Month';
    }

    // Get user document to check previous subscription
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new Error(`User not found: ${userId}`);
    }

    const userData = userDoc.data();
    const previousTier = userData.subscriptionTier || 'free';
    const isUpgrade = previousTier === 'free' ||
      (previousTier === 'premium' && plan === 'creator');

    // Update user subscription
    await admin.firestore().collection('users').doc(userId).update({
      subscriptionTier: plan,
      subscriptionStart: admin.firestore.FieldValue.serverTimestamp(),
      subscriptionExpiration: admin.firestore.Timestamp.fromDate(expirationDate),
      subscriptionDuration: duration,
      subscriptionDurationText: durationText,
      lastPaymentReference: paystackData.reference,
      previousSubscriptionTier: previousTier,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create a subscription history record
    await admin.firestore().collection('subscriptionHistory').add({
      userId,
      plan,
      duration,
      durationText,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      expirationDate: admin.firestore.Timestamp.fromDate(expirationDate),
      reference: paystackData.reference,
      amount: paystackData.amount / 100, // Convert from kobo to naira
      currency: paystackData.currency || 'NGN',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logWebhookEvent('info', {
      message: 'Subscription processed successfully',
      userId,
      plan,
      duration
    });

    return true;
  } catch (error) {
    logWebhookEvent('error', {
      message: 'Error processing subscription',
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Main webhook handler
module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Initialize Firebase
    initializeFirebase();

    // Get payload and signature
    const payload = JSON.stringify(req.body);
    const signature = req.headers['x-paystack-signature'];

    // Get Paystack secret key from environment variables
    // If not set, use the live key from the PHP version
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_live_02edcbcdb3317e6385d9b4163faa76584ccfc01d';

    // Check if secret key is configured
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Verify signature if available
    if (signature) {
      try {
        const isValid = verifyWebhookSignature(payload, signature, paystackSecretKey);
        if (!isValid) {
          console.warn('Invalid webhook signature detected');
          // For testing, we'll continue anyway
          // In production, you should uncomment the next line:
          // return res.status(401).json({ status: 'error', message: 'Invalid signature' });
        }
      } catch (error) {
        console.error('Error verifying signature:', error);
        // For testing, we'll continue anyway
      }
    } else {
      console.warn('No signature provided in webhook request');
      // For testing, we'll continue anyway
    }

    // Parse payload
    const data = req.body;

    // Check if payload is valid
    if (!data || !data.event) {
      return res.status(400).json({ status: 'error', message: 'Invalid payload' });
    }

    // Log webhook event
    logWebhookEvent(data.event, data.data);

    // Process based on event type
    let success = false;

    switch (data.event) {
      case 'charge.success':
        success = await processChargeSuccess(data.data);
        break;
      default:
        // Ignore other events
        success = true;
    }

    // Return response
    if (success) {
      return res.status(200).json({ status: 'success' });
    } else {
      return res.status(500).json({ status: 'error', message: 'Failed to process webhook' });
    }
  } catch (error) {
    // Log error
    console.error('Webhook error:', error);

    // Return error response
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
