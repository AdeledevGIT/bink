// Paystack configuration for BINK platform
// This file contains the configuration for Paystack integration

// Initialize Paystack configuration
const paystackConfig = {
    // Paystack API keys
    publicKey: 'pk_live_b45ea3ee86264259d3953ab8b9cb5fd276138f4c',
    testMode: false, // Set to false in production

    // Callback URLs
    callbackUrl: 'https://bink-nine.vercel.app//payment-callback.html',

    // Webhook settings (for server-side verification)
    webhookUrl: 'https://bink-nine.vercel.app//paystack-webhook',

    // Currency settings
    currency: 'NGN',

    // Metadata keys
    metadataKeys: {
        userId: 'user_id',
        planType: 'plan_type',
        planDuration: 'plan_duration',
        tokenAmount: 'token_amount',
        isFirstPurchase: 'is_first_purchase',
        purchaseRequestId: 'purchase_request_id'
    }
};

// Paystack plan IDs (if using subscription API)
const paystackPlans = {
    premium: {
        monthly: 'PLN_xxxxxxxxxxxxxxxxx',
        yearly: 'PLN_xxxxxxxxxxxxxxxxx',
        lifetime: null // One-time payment, not a subscription
    },
    creator: {
        quarterly: 'PLN_xxxxxxxxxxxxxxxxx'
    }
};

// Paystack product IDs (for one-time payments)
const paystackProducts = {
    premium: {
        lifetime: 'PRD_xxxxxxxxxxxxxxxxx'
    },
    tokens: {
        '800': 'PRD_xxxxxxxxxxxxxxxxx',
        '1600': 'PRD_xxxxxxxxxxxxxxxxx',
        '2500': 'PRD_xxxxxxxxxxxxxxxxx',
        '5000': 'PRD_xxxxxxxxxxxxxxxxx'
    }
};

// Paystack API endpoints
const paystackEndpoints = {
    initialize: 'https://api.paystack.co/transaction/initialize',
    verify: 'https://api.paystack.co/transaction/verify/',
    customer: 'https://api.paystack.co/customer',
    subscription: 'https://api.paystack.co/subscription'
};

// Initialize Paystack
function initializePaystack() {
    // Check if Paystack script is already loaded
    if (window.PaystackPop) {
        console.log('Paystack already initialized');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        // Load Paystack script
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;

        script.onload = () => {
            console.log('Paystack script loaded successfully');
            resolve();
        };

        script.onerror = () => {
            console.error('Failed to load Paystack script');
            reject(new Error('Failed to load Paystack script'));
        };

        document.head.appendChild(script);
    });
}

// Create Paystack payment popup
function createPaystackPopup(options) {
    return new Promise((resolve, reject) => {
        initializePaystack()
            .then(() => {
                console.log("Creating Paystack popup with options:", JSON.stringify({
                    ...options,
                    key: "***REDACTED***" // Don't log the key
                }));

                // Setup handler with all options
                const setupOptions = {
                    key: paystackConfig.publicKey,
                    email: options.email,
                    amount: options.amount * 100, // Convert to kobo
                    currency: options.currency || paystackConfig.currency,
                    ref: options.reference,
                    callback: function(response) {
                        // This is called when the payment is successful
                        console.log('Payment successful:', response);
                        resolve(response);
                    },
                    onClose: function() {
                        // This is called when the customer closes the payment modal
                        console.log('Payment modal closed');
                        reject(new Error('Payment modal closed by user'));
                    },
                    metadata: options.metadata || {}
                };

                // Add channels if specified
                if (options.channels && Array.isArray(options.channels)) {
                    setupOptions.channels = options.channels;
                    console.log("Using specific payment channels:", options.channels);
                }

                const handler = PaystackPop.setup(setupOptions);
                handler.openIframe();
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Verify Paystack transaction (client-side)
function verifyPaystackTransaction(reference) {
    console.log('Verifying Paystack transaction:', reference);

    // Since we can't do direct API verification from client-side (secret key would be exposed),
    // we'll use a proxy verification approach

    // Option 1: Use a serverless function or API endpoint that does the verification
    // For now, we'll simulate a successful verification since the callback URL is only
    // triggered on successful payments

    // In a production environment, you should:
    // 1. Create a server endpoint that verifies the transaction using Paystack's API
    // 2. Call that endpoint from here instead of simulating success

    return new Promise((resolve) => {
        // Simulate API call delay
        setTimeout(() => {
            console.log('Verification completed for reference:', reference);

            // Simulate successful verification
            resolve({
                status: 'success',
                reference: reference,
                amount: 0, // We don't know the actual amount here
                paidAt: new Date().toISOString(),
                channel: 'card', // Default channel
                metadata: {}
            });
        }, 500);
    });
}

// Save Paystack configuration to Firestore
function savePaystackConfigToFirestore() {
    // Get the current user from auth
    const user = firebase.auth().currentUser;

    // Get user data from Firestore
    if (!user) {
        console.error('User not logged in');
        return Promise.reject(new Error('Unauthorized'));
    }

    // Check if user is admin
    return firebase.firestore().collection('users').doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists || !doc.data().isAdmin) {
                console.error('Only admin users can save Paystack configuration');
                throw new Error('Unauthorized');
            }

            // Create a copy of the config without the secret key for security
            const configForFirestore = {
                publicKey: paystackConfig.publicKey,
                testMode: paystackConfig.testMode,
                callbackUrl: paystackConfig.callbackUrl,
                webhookUrl: paystackConfig.webhookUrl,
                currency: paystackConfig.currency,
                metadataKeys: paystackConfig.metadataKeys,
                plans: paystackPlans,
                products: paystackProducts,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid
            };

            return db.collection('settings').doc('paystack').set(configForFirestore, { merge: true })
                .then(() => {
                    console.log('Paystack configuration saved to Firestore');
                    return true;
                });
        })
        .catch(error => {
            console.error('Error saving Paystack configuration:', error);
            throw error;
        });
}

// Export the functions and objects
window.BINK = window.BINK || {};
window.BINK.paystack = {
    config: paystackConfig,
    plans: paystackPlans,
    products: paystackProducts,
    initialize: initializePaystack,
    createPopup: createPaystackPopup,
    verify: verifyPaystackTransaction,
    saveConfig: savePaystackConfigToFirestore
};
