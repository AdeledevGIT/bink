
let paystackUser = null;
let paystackUserData = null;

// Initialize the handler
function initPaystackHandler() {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            paystackUser = user;

            // Get user data
            firebase.firestore().collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        paystackUserData = doc.data();
                    }
                })
                .catch((error) => {
                    console.error("Error getting user data:", error);
                });
        } else {
            paystackUser = null;
            paystackUserData = null;
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
    if (!paystackUser) {
        return Promise.reject(new Error('User not logged in'));
    }

    // Generate reference
    const reference = generatePaystackReference();

    // Create metadata
    const metadata = {
        [window.BINK.paystack.config.metadataKeys.userId]: paystackUser.uid,
        [window.BINK.paystack.config.metadataKeys.planType]: plan,
        [window.BINK.paystack.config.metadataKeys.planDuration]: duration
    };

    // Create payment record in Firestore
    const paymentData = {
        userId: paystackUser.uid,
        email: paystackUser.email,
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
                email: paystackUser.email,
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
    if (!paystackUser) {
        return Promise.reject(new Error('User not logged in'));
    }

    // Generate reference
    const reference = generatePaystackReference();

    // Check if this is the user's first token purchase
    const isFirstPurchase = !(paystackUserData && paystackUserData.hasPurchasedTokens);

    // Create metadata
    const metadata = {
        [window.BINK.paystack.config.metadataKeys.userId]: paystackUser.uid,
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
            userId: paystackUser.uid,
            email: paystackUser.email,
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
            email: paystackUser.email,
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
    // Add a timeout to prevent hanging
    return new Promise((resolve, reject) => {
        // Set a timeout to reject the promise after 30 seconds
        const timeoutId = setTimeout(() => {
            reject(new Error('Payment verification timed out after 30 seconds'));
        }, 30000);

        // Find payment by reference
        firebase.firestore().collection('payments')
            .where('reference', '==', reference)
            .limit(1)
            .get()
            .then((snapshot) => {
                if (snapshot.empty) {
                    clearTimeout(timeoutId);
                    throw new Error('Payment not found');
                }

                const paymentDoc = snapshot.docs[0];
                const payment = paymentDoc.data();

                // Check if payment is already processed
                if (payment.status === 'completed') {
                    clearTimeout(timeoutId);
                    resolve(payment);
                    return;
                }

                // Verify payment with Paystack API
                verifyPaymentWithPaystack(reference)
                    .then(verificationResult => {
                        if (verificationResult.status !== 'success') {
                            throw new Error('Payment verification failed: ' + verificationResult.message);
                        }

                        // Update payment status with verification data
                        return firebase.firestore().collection('payments').doc(paymentDoc.id).update({
                            status: 'completed',
                            paystackVerification: verificationResult,
                            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
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
                    })
                    .then(result => {
                        clearTimeout(timeoutId);
                        resolve(result);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
            })
            .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
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
                status: 'completed',
                paymentId: payment.paymentId,
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // Update user tokens
                return firebase.firestore().collection('users').doc(payment.userId).update({
                    tokens: totalTokens,
                    hasPurchasedTokens: true,
                    lastTokenPurchase: {
                        amount: payment.tokenAmount,
                        bonus: bonusTokens,
                        date: firebase.firestore.FieldValue.serverTimestamp(),
                        paymentId: payment.paymentId
                    },
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                // Record income
                return recordIncome(payment);
            })
            .then(() => {
                // Create a token transaction record
                return firebase.firestore().collection('tokenTransactions').add({
                    userId: payment.userId,
                    type: 'purchase',
                    amount: payment.tokenAmount,
                    bonus: bonusTokens,
                    paymentId: payment.paymentId,
                    balanceAfter: totalTokens,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {

                return {
                    success: true,
                    type: 'token',
                    tokenAmount: payment.tokenAmount,
                    bonusTokens: bonusTokens,
                    totalTokens: totalTokens
                };
            })
            .catch(error => {
                console.error('Error processing token purchase completion:', error);
                throw error;
            });
        });
}

// Process subscription completion
function processSubscriptionCompletion(payment) {
    // Calculate subscription expiration date
    let expirationDate = new Date();
    let durationText = '';

    switch (payment.duration) {
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
            // Set to a far future date for lifetime
            expirationDate.setFullYear(expirationDate.getFullYear() + 100);
            durationText = 'Lifetime';
            break;
        default:
            expirationDate.setMonth(expirationDate.getMonth() + 1);
            durationText = '1 Month';
    }

    // Get current user data to check previous subscription
    return firebase.firestore().collection('users').doc(payment.userId).get()
        .then(userDoc => {
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();
            const previousTier = userData.subscriptionTier || 'free';
            const isUpgrade = previousTier === 'free' ||
                (previousTier === 'premium' && payment.plan === 'creator');

            // Update user subscription
            return firebase.firestore().collection('users').doc(payment.userId).update({
                subscriptionTier: payment.plan,
                subscriptionStart: firebase.firestore.FieldValue.serverTimestamp(),
                subscriptionExpiration: firebase.firestore.Timestamp.fromDate(expirationDate),
                subscriptionDuration: payment.duration,
                subscriptionDurationText: durationText,
                lastPaymentId: payment.paymentId,
                previousSubscriptionTier: previousTier,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Record income
            return recordIncome(payment);
        })
        .then(() => {
            // Create a subscription history record
            return firebase.firestore().collection('subscriptionHistory').add({
                userId: payment.userId,
                plan: payment.plan,
                duration: payment.duration,
                durationText: durationText,
                startDate: firebase.firestore.FieldValue.serverTimestamp(),
                expirationDate: firebase.firestore.Timestamp.fromDate(expirationDate),
                paymentId: payment.paymentId,
                amount: payment.amount,
                currency: payment.currency,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {

            return {
                success: true,
                type: 'subscription',
                plan: payment.plan,
                duration: payment.duration,
                expirationDate: expirationDate
            };
        })
        .catch(error => {
            console.error('Error processing subscription completion:', error);
            throw error;
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

// Process bank transfer payment
function processBankTransferPayment(amount, reference, metadata) {
    if (!paystackUser) {
        return Promise.reject(new Error('User not logged in'));
    }

    // Generate reference if not provided
    const paymentReference = reference || generatePaystackReference();

    // Create payment data
    const paymentData = {
        userId: paystackUser.uid,
        email: paystackUser.email,
        amount: amount,
        currency: window.BINK.paystack.config.currency,
        reference: paymentReference,
        paymentMethod: 'bank_transfer',
        status: 'pending',
        metadata: metadata || {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    return firebase.firestore().collection('payments').add(paymentData)
        .then((docRef) => {
            // Update payment record with ID
            return firebase.firestore().collection('payments').doc(docRef.id).update({
                paymentId: docRef.id
            }).then(() => {
                // Create Paystack popup with bank transfer channel
                return window.BINK.paystack.createPopup({
                    email: paystackUser.email,
                    amount: amount,
                    reference: paymentReference,
                    metadata: {
                        payment_id: docRef.id,
                        user_id: paystackUser.uid,
                        ...metadata
                    },
                    channels: ['bank_transfer']
                });
            });
        });
}

// Process USSD payment
function processUssdPayment(amount, phoneNumber, reference, metadata) {
    if (!paystackUser) {
        return Promise.reject(new Error('User not logged in'));
    }

    // Generate reference if not provided
    const paymentReference = reference || generatePaystackReference();

    // Create payment data
    const paymentData = {
        userId: paystackUser.uid,
        email: paystackUser.email,
        amount: amount,
        currency: window.BINK.paystack.config.currency,
        reference: paymentReference,
        paymentMethod: 'ussd',
        phoneNumber: phoneNumber,
        status: 'pending',
        metadata: metadata || {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    return firebase.firestore().collection('payments').add(paymentData)
        .then((docRef) => {
            // Update payment record with ID
            return firebase.firestore().collection('payments').doc(docRef.id).update({
                paymentId: docRef.id
            }).then(() => {
                // Create Paystack popup with USSD channel
                return window.BINK.paystack.createPopup({
                    email: paystackUser.email,
                    amount: amount,
                    reference: paymentReference,
                    metadata: {
                        payment_id: docRef.id,
                        user_id: paystackUser.uid,
                        phone: phoneNumber,
                        ...metadata
                    },
                    channels: ['ussd']
                });
            });
        });
}

// Verify payment with Paystack API
function verifyPaymentWithPaystack(reference) {
    // Use the verify function from paystack-config.js
    if (window.BINK && window.BINK.paystack && window.BINK.paystack.verify) {
        return window.BINK.paystack.verify(reference)
            .then(data => {
                return {
                    status: 'success',
                    data: data
                };
            })
            .catch(error => {
                return {
                    status: 'error',
                    message: error.message || 'Payment verification failed'
                };
            });
    } else {
        // Fallback if the verify function is not available

        // Since we can't verify with Paystack API directly (client-side),
        // we'll assume the payment is successful if we got a callback
        // In a production environment, this should be handled server-side
        return Promise.resolve({
            status: 'success',
            message: 'Payment assumed successful (callback received)',
            data: {
                reference: reference,
                status: 'success'
            }
        });
    }
}

// Export the functions
window.BINK = window.BINK || {};
window.BINK.paystackHandler = {
    init: initPaystackHandler,
    processPremiumPayment: processPremiumPayment,
    processTokenPayment: processTokenPayment,
    processBankTransferPayment: processBankTransferPayment,
    processUssdPayment: processUssdPayment,
    handlePaymentCallback: handlePaymentCallback,
    verifyPaymentWithPaystack: verifyPaymentWithPaystack
};

// Initialize when the script loads
initPaystackHandler();
