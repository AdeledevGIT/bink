// Paystack configuration for BINK platform
// This file contains the configuration for Paystack integration

// Initialize Paystack configuration
const paystackConfig = {
    // Paystack API keys
    publicKey: 'pk_test_d1f07786d161314aa4dbb7f29d9d49d3aa029571',
    testMode: false, // Set to false in production

    // Callback URLs
    callbackUrl: window.location.origin + '/payment-callback.html',

    // Webhook settings (for server-side verification)
    webhookUrl: window.location.origin + '/paystack-webhook.php',

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
                const handler = PaystackPop.setup({
                    key: paystackConfig.publicKey,
                    email: options.email,
                    amount: options.amount * 100, // Convert to kobo
                    currency: paystackConfig.currency,
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
                });

                handler.openIframe();
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Verify Paystack transaction (client-side)
function verifyPaystackTransaction(reference) {
    // This is a client-side verification, but the actual verification should be done server-side
    // for security reasons. This is just for demonstration purposes.
    return fetch(`${paystackEndpoints.verify}${reference}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${paystackConfig.secretKey}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status && data.data.status === 'success') {
            return data.data;
        } else {
            throw new Error('Transaction verification failed');
        }
    });
}

// Save Paystack configuration to Firestore
function savePaystackConfigToFirestore() {
    // Only admin users should be able to call this function
    if (!currentUser || !currentUserData || !currentUserData.isAdmin) {
        console.error('Only admin users can save Paystack configuration');
        return Promise.reject(new Error('Unauthorized'));
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
        updatedBy: currentUser.uid
    };

    return db.collection('settings').doc('paystack').set(configForFirestore, { merge: true })
        .then(() => {
            console.log('Paystack configuration saved to Firestore');
            return true;
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
