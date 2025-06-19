// Scheduled function to check and downgrade expired subscriptions
// This can be called by external cron services or manually

const admin = require('firebase-admin');

// Initialize Firebase Admin (using service account or environment variables)
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    // For production, you should set the FIREBASE_SERVICE_ACCOUNT environment variable in Vercel
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
      });
    } else {
      // For testing/development - this won't work in production
      console.warn('FIREBASE_SERVICE_ACCOUNT not set, using default initialization');
      admin.initializeApp();
    }
    
    firebaseInitialized = true;
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Log function for debugging
function logEvent(type, data) {
  console.log(`[${new Date().toISOString()}] ${type}:`, JSON.stringify(data, null, 2));
}

// Main function to check and downgrade expired subscriptions
async function checkExpiredSubscriptions() {
  try {
    initializeFirebase();
    
    const db = admin.firestore();
    const now = new Date();
    
    logEvent('info', {
      message: 'Starting expired subscription check',
      timestamp: now.toISOString()
    });

    // Query users with premium or creator subscriptions
    const usersSnapshot = await db.collection('users')
      .where('subscriptionTier', 'in', ['premium', 'creator'])
      .get();

    let processedCount = 0;
    let expiredCount = 0;
    let errorCount = 0;

    const batch = db.batch();
    const batchUpdates = [];

    for (const doc of usersSnapshot.docs) {
      try {
        const userData = doc.data();
        const userId = doc.id;
        processedCount++;

        // Skip lifetime subscriptions
        if (userData.subscriptionDuration === 'lifetime') {
          logEvent('skip', {
            userId,
            reason: 'lifetime_subscription'
          });
          continue;
        }

        // Check if subscription has expired
        if (userData.subscriptionExpiration) {
          const expiryDate = userData.subscriptionExpiration.toDate();
          
          if (expiryDate < now) {
            logEvent('expired', {
              userId,
              subscriptionTier: userData.subscriptionTier,
              expiryDate: expiryDate.toISOString(),
              currentTime: now.toISOString()
            });

            // Check if user is currently using a premium template
            const currentTemplate = userData.template || 'classic';
            const usedTemplates = userData.usedTemplates || [];
            const hasUsedCurrentTemplate = usedTemplates.includes(currentTemplate);
            
            let updateData = {
              subscriptionTier: 'free',
              isPremium: false,
              subscriptionExpired: true,
              lastSubscriptionTier: userData.subscriptionTier,
              lastSubscriptionExpiration: userData.subscriptionExpiration,
              premiumExpiredAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Check if current template is premium and user hasn't purchased it
            // Note: We don't have access to template data here, so we'll be conservative
            // and only revert known premium templates that user hasn't used
            const knownPremiumTemplates = [
              'corporate', 'creative', 'glassmorphism', 'gradientcard', 'gradientflow',
              'herobanner', 'landingprofile', 'magazine', 'minimalzen', 'nature',
              'neoncard', 'neonglow', 'neonminimal', 'portfolio', 'purplecard',
              'retrowave', 'softpastel', 'splitscreen', 'techwave', 'auroraglow',
              'blacklanding', 'coverstory', 'darkelegance'
            ];

            if (knownPremiumTemplates.includes(currentTemplate) && !hasUsedCurrentTemplate) {
              updateData.template = 'classic';
              logEvent('template_reverted', {
                userId,
                fromTemplate: currentTemplate,
                toTemplate: 'classic'
              });
            }

            // Add to batch update
            const userRef = db.collection('users').doc(userId);
            batch.update(userRef, updateData);
            batchUpdates.push({ userId, updateData });
            
            expiredCount++;
          }
        } else {
          logEvent('warning', {
            userId,
            message: 'Premium user without expiration date',
            subscriptionTier: userData.subscriptionTier
          });
        }
      } catch (error) {
        errorCount++;
        logEvent('error', {
          userId: doc.id,
          message: 'Error processing user',
          error: error.message
        });
      }
    }

    // Execute batch updates if there are any
    if (batchUpdates.length > 0) {
      await batch.commit();
      
      logEvent('batch_committed', {
        updatesCount: batchUpdates.length,
        updates: batchUpdates.map(u => ({ userId: u.userId, tier: u.updateData.subscriptionTier }))
      });
    }

    const summary = {
      processedCount,
      expiredCount,
      errorCount,
      timestamp: now.toISOString(),
      success: true
    };

    logEvent('summary', summary);
    
    return summary;

  } catch (error) {
    const errorSummary = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    logEvent('fatal_error', errorSummary);
    throw error;
  }
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Optional: Add authentication/authorization here
    // For example, check for a secret key in headers or query params
    const authKey = req.headers['x-api-key'] || req.query.key;
    if (process.env.CRON_SECRET && authKey !== process.env.CRON_SECRET) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await checkExpiredSubscriptions();
    
    res.status(200).json({
      success: true,
      message: 'Expired subscription check completed',
      data: result
    });

  } catch (error) {
    console.error('Error in check-expired-subscriptions function:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
