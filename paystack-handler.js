// Paystack Payment Handler for BINK platform
// This file contains functions for handling Paystack payments

// Global variables
let currentUser = null;
let currentUserData = null;

// Initialize the handler
function initPaystackHandler() {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            
            // Get user data
            firebase.firestore().collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        currentUserData = doc.data();
                    }
                })
                .catch((error) => {
                    console.error("Error getting user data:", error);
                });
        } else {
            currentUser = null;
            currentUserData = null;
        }
    });
}

// Generate a unique reference for Paystack
function generatePaystackReference() {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `BINK-${timestamp}-${randomStr}`;
}

// Process premium subscription payment
function processPremiumPayment(plan, duration, amount) {
    if (!currentUser) {
        return Promise.reject(new Error('User not logged in'));
    }
    
    // Generate reference
    const reference = generatePaystackReference();
    
    // Create metadata
    const metadata = {
        [window.BINK.paystack.config.metadataKeys.userId]: currentUser.uid,
        [window.BINK.paystack.config.metadataKeys.planType]: plan,
        [window.BINK.paystack.config.metadataKeys.planDuration]: duration
    };
    
    // Create payment record in Firestore
    const paymentData = {
        userId: currentUser.uid,
        email: currentUser.email,
        amount: amount,
        currency: window.BINK.paystack.config.currency,
        reference: reference,
        plan: plan,
        duration: duration,
        paymentMethod: 'paystack',
        status: 'pending',
        metadata: metadata,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    return firebase.firestore().collection('payments').add(paymentData)
        .then((docRef) => {
            // Update payment record with ID
            return firebase.firestore().collection('payments').doc(docRef.id).update({
                paymentId: docRef.id
            }).then(() => {
                // Return payment ID and reference
                return {
                    paymentId: docRef.id,
                    reference: reference
                };
            });
        })
        .then((paymentInfo) => {
            // Create Paystack popup
            return window.BINK.paystack.createPopup({
                email: currentUser.email,
                amount: amount,
                reference: reference,
                metadata: metadata
            }).then((response) => {
                // Return payment info and Paystack response
                return {
                    ...paymentInfo,
                    paystackResponse: response
                };
            });
        });
}

// Process token purchase payment
function processTokenPayment(tokenAmount, price, purchaseRequestId) {
    if (!currentUser) {
        return Promise.reject(new Error('User not logged in'));
    }
    
    // Generate reference
    const reference = generatePaystackReference();
    
    // Check if this is the user's first token purchase
    const isFirstPurchase = !(currentUserData && currentUserData.hasPurchasedTokens);
    
    // Create metadata
    const metadata = {
        [window.BINK.paystack.config.metadataKeys.userId]: currentUser.uid,
        [window.BINK.paystack.config.metadataKeys.tokenAmount]: tokenAmount,
        [window.BINK.paystack.config.metadataKeys.isFirstPurchase]: isFirstPurchase,
        [window.BINK.paystack.config.metadataKeys.purchaseRequestId]: purchaseRequestId
    };
    
    // Update token purchase request with Paystack reference
    return firebase.firestore().collection('tokenPurchaseRequests').doc(purchaseRequestId).update({
        paystackReference: reference,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Create payment record in Firestore
        const paymentData = {
            userId: currentUser.uid,
            email: currentUser.email,
            amount: price,
            currency: window.BINK.paystack.config.currency,
            reference: reference,
            tokenAmount: tokenAmount,
            tokenPurchaseId: purchaseRequestId,
            isFirstPurchase: isFirstPurchase,
            paymentMethod: 'paystack',
            status: 'pending',
            metadata: metadata,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        return firebase.firestore().collection('payments').add(paymentData);
    })
    .then((docRef) => {
        // Update payment record with ID
        return firebase.firestore().collection('payments').doc(docRef.id).update({
            paymentId: docRef.id
        }).then(() => {
            // Return payment ID and reference
            return {
                paymentId: docRef.id,
                reference: reference
            };
        });
    })
    .then((paymentInfo) => {
        // Create Paystack popup
        return window.BINK.paystack.createPopup({
            email: currentUser.email,
            amount: price,
            reference: reference,
            metadata: metadata
        }).then((response) => {
            // Return payment info and Paystack response
            return {
                ...paymentInfo,
                paystackResponse: response
            };
        });
    });
}

// Handle successful payment callback
function handlePaymentCallback(reference) {
    // Find payment by reference
    return firebase.firestore().collection('payments')
        .where('reference', '==', reference)
        .limit(1)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                throw new Error('Payment not found');
            }
            
            const paymentDoc = snapshot.docs[0];
            const payment = paymentDoc.data();
            
            // Check if payment is already processed
            if (payment.status === 'completed') {
                console.log('Payment already processed');
                return payment;
            }
            
            // Update payment status
            return firebase.firestore().collection('payments').doc(paymentDoc.id).update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // Process based on payment type
                if (payment.tokenPurchaseId) {
                    // Token purchase
                    return processTokenPurchaseCompletion(payment);
                } else {
                    // Subscription payment
                    return processSubscriptionCompletion(payment);
                }
            });
        });
}

// Process token purchase completion
function processTokenPurchaseCompletion(payment) {
    // Get user document
    return firebase.firestore().collection('users').doc(payment.userId).get()
        .then((userDoc) => {
            if (!userDoc.exists) {
                throw new Error('User not found');
            }
            
            const userData = userDoc.data();
            
            // Calculate token amount
            const isFirstPurchase = payment.isFirstPurchase;
            const bonusTokens = isFirstPurchase ? 200 : 0;
            const currentTokens = userData.tokens || 0;
            const totalTokens = currentTokens + payment.tokenAmount + bonusTokens;
            
            // Update token purchase request
            return firebase.firestore().collection('tokenPurchaseRequests').doc(payment.tokenPurchaseId).update({
                status: 'approved',
                paymentId: payment.paymentId,
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // Update user tokens
                return firebase.firestore().collection('users').doc(payment.userId).update({
                    tokens: totalTokens,
                    hasPurchasedTokens: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                // Record income
                return recordIncome(payment);
            })
            .then(() => {
                return {
                    success: true,
                    type: 'token',
                    tokenAmount: payment.tokenAmount,
                    bonusTokens: bonusTokens,
                    totalTokens: totalTokens
                };
            });
        });
}

// Process subscription completion
function processSubscriptionCompletion(payment) {
    // Calculate subscription expiration date
    let expirationDate = new Date();
    
    switch (payment.duration) {
        case 'monthly':
            expirationDate.setMonth(expirationDate.getMonth() + 1);
            break;
        case 'yearly':
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            break;
        case 'quarterly':
            expirationDate.setMonth(expirationDate.getMonth() + 3);
            break;
        case 'lifetime':
            // Set to a far future date for lifetime
            expirationDate.setFullYear(expirationDate.getFullYear() + 100);
            break;
        default:
            expirationDate.setMonth(expirationDate.getMonth() + 1);
    }
    
    // Update user subscription
    return firebase.firestore().collection('users').doc(payment.userId).update({
        subscriptionTier: payment.plan,
        subscriptionStart: firebase.firestore.FieldValue.serverTimestamp(),
        subscriptionExpiration: firebase.firestore.Timestamp.fromDate(expirationDate),
        lastPaymentId: payment.paymentId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Record income
        return recordIncome(payment);
    })
    .then(() => {
        return {
            success: true,
            type: 'subscription',
            plan: payment.plan,
            duration: payment.duration,
            expirationDate: expirationDate
        };
    });
}

// Record income for admin dashboard
function recordIncome(payment) {
    // Create income record
    const incomeData = {
        paymentId: payment.paymentId,
        userId: payment.userId,
        email: payment.email,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.tokenPurchaseId ? 'token' : 'subscription',
        details: payment.tokenPurchaseId 
            ? `${payment.tokenAmount} tokens` 
            : `${payment.plan} (${payment.duration})`,
        date: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    return firebase.firestore().collection('income').add(incomeData);
}

// Export the functions
window.BINK = window.BINK || {};
window.BINK.paystackHandler = {
    init: initPaystackHandler,
    processPremiumPayment: processPremiumPayment,
    processTokenPayment: processTokenPayment,
    handlePaymentCallback: handlePaymentCallback
};

// Initialize when the script loads
initPaystackHandler();
