// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    alert("Error: Firebase not loaded. Please try refreshing.");
}

// DOM Elements
const paymentTabs = document.querySelectorAll('.payment-tab');
const tabContents = document.querySelectorAll('.payment-tab-content');
const cardPaymentForm = document.getElementById('card-payment-form');
const cardNumberInput = document.getElementById('card-number');
const cardExpiryInput = document.getElementById('card-expiry');
const cardCvvInput = document.getElementById('card-cvv');
const cardSubmitButton = document.getElementById('card-submit-button');
const bankConfirmationForm = document.getElementById('bank-confirmation-form');
const bankSubmitButton = document.getElementById('bank-submit-button');
const paymentReference = document.getElementById('payment-reference');
const copyButtons = document.querySelectorAll('.copy-button');
const providerOptions = document.querySelectorAll('.provider-option');
const mobilePaymentForm = document.getElementById('mobile-payment-form');
const providerNameSpan = document.getElementById('provider-name');
const mobileSubmitButton = document.getElementById('mobile-submit-button');
const logoutButton = document.getElementById('logout-button');
const paymentProofInput = document.getElementById('payment-proof');
const filePreview = document.getElementById('file-preview');

// Global variables
let currentUser = null;
let currentUserData = null;
let selectedProvider = null;
let paymentPlan = 'premium'; // Default plan
let paymentDuration = 'monthly'; // Default duration
let paymentAmount = 2500; // Default amount (monthly)
let paymentProofFile = null; // Store the payment proof file
let isTokenPurchase = false; // Flag for token purchase
let tokenAmount = 0; // Amount of tokens being purchased
let tokenPrice = 0; // Price of tokens being purchased
let purchaseRequestId = null; // Token purchase request ID

// Check authentication state
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('User authenticated:', user.uid);
            loadUserData(user.uid);
            generatePaymentReference(user.uid);
        } else {
            console.log('User is signed out. Redirecting to login.');
            window.location.href = 'login.html';
        }
    });
} else {
    console.error("Cannot check auth state because Firebase Auth is not loaded.");
    showError("Error loading user status.");
}

// Get plan and token info from URL
function getPaymentPlanFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for plan parameter (subscription purchase)
    const plan = urlParams.get('plan');
    if (plan) {
        paymentPlan = plan;

        // Check for duration parameter
        const duration = urlParams.get('duration');
        if (duration) {
            paymentDuration = duration;

            // Check for price parameter or calculate based on duration
            const price = urlParams.get('price');
            if (price) {
                paymentAmount = parseInt(price);
            } else {
                // Calculate price based on duration
                if (duration === 'yearly') {
                    paymentAmount = 25000;
                } else if (duration === 'lifetime') {
                    paymentAmount = 60000;
                } else {
                    paymentAmount = 2500; // monthly
                }
            }
        }

        console.log('Subscription purchase detected:', { paymentPlan, paymentDuration, paymentAmount });
    }

    // Check for token purchase parameters
    const type = urlParams.get('type');
    if (type === 'token') {
        isTokenPurchase = true;
        tokenAmount = parseInt(urlParams.get('amount') || '0');
        tokenPrice = parseInt(urlParams.get('price') || '0');
        purchaseRequestId = urlParams.get('purchase');

        console.log('Token purchase detected:', { tokenAmount, tokenPrice, purchaseRequestId });
    }
}

// Load user data
function loadUserData(userId) {
    const userDocRef = db.collection('users').doc(userId);
    userDocRef.get().then((doc) => {
        if (doc.exists) {
            currentUserData = doc.data();
            console.log("Loaded user data:", currentUserData);

            // For subscription purchases, check if already subscribed
            if (!isTokenPurchase && (currentUserData.subscriptionTier === 'premium' || currentUserData.subscriptionTier === 'creator')) {
                showError("You are already subscribed to a premium plan.");
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                return;
            }

            // For token purchases, check if user is premium (they don't need tokens)
            if (isTokenPurchase && (currentUserData.subscriptionTier === 'premium' || currentUserData.subscriptionTier === 'creator')) {
                showError("As a Premium/Creator subscriber, you already have access to all templates without needing tokens!");
                setTimeout(() => {
                    window.location.href = 'bio-editor.html';
                }, 2000);
                return;
            }

            // For token purchases, load the purchase request
            if (isTokenPurchase && purchaseRequestId) {
                loadTokenPurchaseRequest();
            }
        } else {
            console.log("No such user document!");
            showError("Could not load user data.");
        }
    }).catch((error) => {
        console.error("Error getting user document:", error);
        showError(`Error loading user data: ${error.message}`);
    });
}

// Load token purchase request details
function loadTokenPurchaseRequest() {
    if (!purchaseRequestId) return;

    db.collection('tokenPurchaseRequests').doc(purchaseRequestId).get()
        .then((doc) => {
            if (doc.exists) {
                const requestData = doc.data();

                // Verify this request belongs to the current user
                if (requestData.userId !== currentUser.uid) {
                    showError("This purchase request doesn't belong to your account.");
                    setTimeout(() => {
                        window.location.href = 'tokens.html';
                    }, 2000);
                    return;
                }

                // Check if request is already processed
                if (requestData.status !== 'pending') {
                    if (requestData.status === 'approved') {
                        alert("This token purchase has already been approved. Your tokens have been added to your account.");
                    } else {
                        alert("This token purchase request has been rejected.");
                    }
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                    return;
                }

                // Update UI for token purchase
                updateUIForTokenPurchase(requestData);
            } else {
                showError("Purchase request not found.");
                setTimeout(() => {
                    window.location.href = 'tokens.html';
                }, 2000);
            }
        })
        .catch((error) => {
            console.error("Error loading purchase request:", error);
            showError(`Error loading purchase request: ${error.message}`);
        });
}

// Generate payment reference
function generatePaymentReference(userId) {
    const timestamp = Date.now().toString().slice(-6);
    const userIdShort = userId.slice(-4);
    const reference = `BINK-${timestamp}${userIdShort}`;

    if (paymentReference) {
        paymentReference.textContent = reference;
    }

    return reference;
}

// Tab switching
function switchTab() {
    const tabId = this.dataset.tab;

    // Remove active class from all tabs and contents
    paymentTabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    this.classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Format card number with spaces
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';

    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }

    e.target.value = formattedValue;
}

// Format card expiry date
function formatCardExpiry(e) {
    let value = e.target.value.replace(/[^0-9]/gi, '');

    if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }

    e.target.value = value;
}

// Handle card payment submission
function handleCardPayment(e) {
    e.preventDefault();

    if (!currentUser) {
        showError("Please log in to complete your payment.");
        return;
    }

    // Disable submit button
    cardSubmitButton.disabled = true;
    cardSubmitButton.textContent = 'Processing...';

    // Check if Paystack is available
    if (window.BINK && window.BINK.paystack && window.BINK.paystackHandler) {
        // Use Paystack for payment processing
        if (isTokenPurchase) {
            // Process token purchase with Paystack
            window.BINK.paystackHandler.processTokenPayment(tokenAmount, tokenPrice, purchaseRequestId)
                .then((result) => {
                    console.log("Paystack payment initiated:", result);
                    // The user will be redirected to Paystack's payment page
                    // After payment, they will be redirected to the callback URL
                })
                .catch((error) => {
                    console.error("Error initiating Paystack payment:", error);
                    showError(`Error initiating payment: ${error.message}`);
                    cardSubmitButton.disabled = false;
                    cardSubmitButton.textContent = `Pay ₦${tokenPrice}`;
                });
        } else {
            // Process subscription payment with Paystack
            window.BINK.paystackHandler.processPremiumPayment(paymentPlan, paymentDuration, paymentAmount)
                .then((result) => {
                    console.log("Paystack payment initiated:", result);
                    // The user will be redirected to Paystack's payment page
                    // After payment, they will be redirected to the callback URL
                })
                .catch((error) => {
                    console.error("Error initiating Paystack payment:", error);
                    showError(`Error initiating payment: ${error.message}`);
                    cardSubmitButton.disabled = false;
                    cardSubmitButton.textContent = `Pay ₦${paymentAmount}`;
                });
        }
    } else {
        // Fallback to manual payment processing if Paystack is not available
        console.log("Paystack not available, using fallback payment method");

        // Simulate payment processing
        setTimeout(() => {
            // In a real app, you would integrate with a payment gateway here

            // For demo purposes, we'll simulate a successful payment
            if (isTokenPurchase) {
                // Handle token purchase payment
                const paymentData = {
                    userId: currentUser.uid,
                    amount: tokenPrice,
                    currency: 'NGN',
                    paymentMethod: 'card',
                    tokenPurchaseId: purchaseRequestId,
                    tokenAmount: tokenAmount,
                    status: 'completed',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Save payment to Firestore
                db.collection('payments').add(paymentData)
                    .then((docRef) => {
                        console.log("Token payment recorded with ID:", docRef.id);

                        // Update token purchase request status
                        return db.collection('tokenPurchaseRequests').doc(purchaseRequestId).update({
                            status: 'approved',
                            paymentId: docRef.id,
                            paymentMethod: 'card',
                            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .then(() => {
                        // Add tokens to user account
                        const isFirstPurchase = currentUserData.hasPurchasedTokens !== true;
                        const bonusTokens = isFirstPurchase ? 200 : 0;
                        const currentTokens = currentUserData.tokens || 0;
                        const totalTokens = currentTokens + tokenAmount + bonusTokens;

                        return db.collection('users').doc(currentUser.uid).update({
                            tokens: totalTokens,
                            hasPurchasedTokens: true,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .then(() => {
                        // Record income for admin dashboard
                        return recordIncome({
                            userId: currentUser.uid,
                            email: currentUser.email,
                            amount: tokenPrice,
                            type: 'token',
                            details: `${tokenAmount} tokens`,
                            paymentMethod: 'card'
                        });
                    })
                    .then(() => {
                        // Show success message and redirect
                        alert("Payment successful! Tokens have been added to your account.");
                        window.location.href = 'dashboard.html';
                    })
                    .catch((error) => {
                        console.error("Error processing token payment:", error);
                        showError(`Error processing payment: ${error.message}`);
                        cardSubmitButton.disabled = false;
                        cardSubmitButton.textContent = `Pay ₦${tokenPrice}`;
                    });
            } else {
                // Handle subscription payment
                const paymentData = {
                    userId: currentUser.uid,
                    amount: paymentAmount,
                    currency: 'NGN',
                    paymentMethod: 'card',
                    plan: paymentPlan,
                    duration: paymentDuration,
                    status: 'completed',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Save payment to Firestore
                db.collection('payments').add(paymentData)
                    .then((docRef) => {
                        console.log("Payment recorded with ID:", docRef.id);

                        // Update user subscription
                        return updateUserSubscription(paymentPlan, docRef.id);
                    })
                    .then(() => {
                        // Record income for admin dashboard
                        return recordIncome({
                            userId: currentUser.uid,
                            email: currentUser.email,
                            amount: paymentAmount,
                            type: 'subscription',
                            details: `${paymentPlan} (${paymentDuration})`,
                            paymentMethod: 'card'
                        });
                    })
                    .then(() => {
                        // Show success message and redirect
                        alert("Payment successful! Your account has been upgraded.");
                        window.location.href = 'dashboard.html';
                    })
                    .catch((error) => {
                        console.error("Error processing payment:", error);
                        showError(`Error processing payment: ${error.message}`);
                        cardSubmitButton.disabled = false;
                        cardSubmitButton.textContent = `Pay ₦${paymentAmount}`;
                    });
            }
        }, 2000);
    }
}

// Handle payment proof file selection
function handlePaymentProofChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Store the file for later upload
    paymentProofFile = file;

    // Clear previous preview
    if (filePreview) {
        filePreview.innerHTML = '';
    }

    // Check file type
    if (file.type.startsWith('image/')) {
        // Create image preview
        const img = document.createElement('img');
        img.classList.add('payment-proof-preview');
        img.file = file;
        filePreview.appendChild(img);

        // Read the file and set the image source
        const reader = new FileReader();
        reader.onload = (function(aImg) {
            return function(e) {
                aImg.src = e.target.result;
            };
        })(img);
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        // Create PDF icon preview
        const pdfPreview = document.createElement('div');
        pdfPreview.classList.add('pdf-preview');
        pdfPreview.innerHTML = `
            <i class="fas fa-file-pdf"></i>
            <span>${file.name}</span>
        `;
        filePreview.appendChild(pdfPreview);
    }
}

// Handle bank transfer confirmation
function handleBankTransfer(e) {
    e.preventDefault();

    if (!currentUser) {
        showError("Please log in to complete your payment.");
        return;
    }

    if (!paymentProofFile) {
        showError("Please upload a payment proof (screenshot or PDF of your payment receipt).");
        return;
    }

    // Disable submit button
    bankSubmitButton.disabled = true;
    bankSubmitButton.textContent = 'Processing...';

    // Get form data
    const transferDate = document.getElementById('transfer-date').value;

    // Check if storage is available from firebase-config.js
    if (!storage) {
        console.error("Firebase Storage is not initialized");

        // Fallback: proceed without file upload
        if (confirm("File upload is not available. Would you like to proceed without uploading a payment proof? You can email your proof to support@bink.com instead.")) {
            // Create payment data without file
            const paymentData = {
                userId: currentUser.uid,
                amount: isTokenPurchase ? tokenPrice : paymentAmount,
                currency: 'NGN',
                paymentMethod: 'bank_transfer',
                status: 'pending',
                transferDate: transferDate,
                binkReference: paymentReference.textContent,
                noProofReason: "Storage unavailable",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add specific fields based on payment type
            if (isTokenPurchase) {
                paymentData.tokenPurchaseId = purchaseRequestId;
                paymentData.tokenAmount = tokenAmount;
            } else {
                paymentData.plan = paymentPlan;
            }

            // Save payment to Firestore
            db.collection('payments').add(paymentData)
                .then((docRef) => {
                    console.log("Transfer confirmation recorded with ID:", docRef.id);

                    if (isTokenPurchase) {
                        // Update token purchase request
                        return db.collection('tokenPurchaseRequests').doc(purchaseRequestId).update({
                            paymentId: docRef.id,
                            paymentMethod: 'bank_transfer',
                            receiptSubmittedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // Update user with pending subscription status
                        return db.collection('users').doc(currentUser.uid).update({
                            pendingPayment: {
                                paymentId: docRef.id,
                                plan: paymentPlan,
                                amount: paymentAmount,
                                status: 'pending',
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            },
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                })
                .then(() => {
                    // Show success message and redirect
                    const message = isTokenPurchase
                        ? "Token purchase confirmation received! Please email your payment proof to support@bink.com with reference: " + paymentReference.textContent
                        : "Transfer confirmation received! Please email your payment proof to support@bink.com with reference: " + paymentReference.textContent;

                    alert(message);
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    console.error("Error recording transfer:", error);
                    showError(`Error recording transfer: ${error.message}`);
                    bankSubmitButton.disabled = false;
                    bankSubmitButton.textContent = 'Confirm Transfer';
                });
            return;
        } else {
            // User chose not to proceed
            bankSubmitButton.disabled = false;
            bankSubmitButton.textContent = 'Confirm Transfer';
            return;
        }
    }

    // Create a storage reference
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`payment-proofs/${currentUser.uid}/${Date.now()}_${paymentProofFile.name}`);

    // Upload the file
    fileRef.put(paymentProofFile)
        .then(snapshot => {
            console.log('Uploaded payment proof:', snapshot);
            return fileRef.getDownloadURL();
        })
        .then(downloadURL => {
            console.log('Payment proof URL:', downloadURL);

            // Create payment data
            const paymentData = {
                userId: currentUser.uid,
                amount: isTokenPurchase ? tokenPrice : paymentAmount,
                currency: 'NGN',
                paymentMethod: 'bank_transfer',
                status: 'pending',
                transferDate: transferDate,
                paymentProofUrl: downloadURL,
                paymentProofType: paymentProofFile.type,
                binkReference: paymentReference.textContent,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add specific fields based on payment type
            if (isTokenPurchase) {
                paymentData.tokenPurchaseId = purchaseRequestId;
                paymentData.tokenAmount = tokenAmount;
            } else {
                paymentData.plan = paymentPlan;
            }

            // Save payment to Firestore
            return db.collection('payments').add(paymentData);
        })
        .then((docRef) => {
            console.log("Transfer confirmation recorded with ID:", docRef.id);

            if (isTokenPurchase) {
                // Update token purchase request
                return db.collection('tokenPurchaseRequests').doc(purchaseRequestId).update({
                    paymentId: docRef.id,
                    paymentMethod: 'bank_transfer',
                    receiptSubmittedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Update user with pending subscription status
                return db.collection('users').doc(currentUser.uid).update({
                    pendingPayment: {
                        paymentId: docRef.id,
                        plan: paymentPlan,
                        amount: paymentAmount,
                        status: 'pending',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        })
        .then(() => {
            // Show success message and redirect
            const message = isTokenPurchase
                ? "Token purchase confirmation received! Your tokens will be added to your account once the payment is verified."
                : "Payment proof received! Your account will be upgraded once the payment is verified.";

            alert(message);
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error("Error recording transfer:", error);
            showError(`Error recording transfer: ${error.message}`);
            bankSubmitButton.disabled = false;
            bankSubmitButton.textContent = 'Confirm Transfer';
        });
}

// Handle mobile money payment
function handleMobilePayment(e) {
    e.preventDefault();

    if (!currentUser) {
        showError("Please log in to complete your payment.");
        return;
    }

    if (!selectedProvider) {
        showError("Please select a mobile money provider.");
        return;
    }

    // Disable submit button
    mobileSubmitButton.disabled = true;
    mobileSubmitButton.textContent = 'Processing...';

    // Get mobile number
    const mobileNumber = document.getElementById('mobile-number').value;

    // Create payment data
    const paymentData = {
        userId: currentUser.uid,
        amount: isTokenPurchase ? tokenPrice : paymentAmount,
        currency: 'NGN',
        paymentMethod: 'mobile_money',
        provider: selectedProvider,
        mobileNumber: mobileNumber,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add specific fields based on payment type
    if (isTokenPurchase) {
        paymentData.tokenPurchaseId = purchaseRequestId;
        paymentData.tokenAmount = tokenAmount;
    } else {
        paymentData.plan = paymentPlan;
    }

    // Save payment to Firestore
    db.collection('payments').add(paymentData)
        .then((docRef) => {
            console.log("Mobile payment initiated with ID:", docRef.id);

            // In a real app, you would integrate with a mobile money API here

            // For demo purposes, we'll simulate a successful payment
            setTimeout(() => {
                // Update payment status
                db.collection('payments').doc(docRef.id).update({
                    status: 'completed',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    if (isTokenPurchase) {
                        // Update token purchase request status
                        return db.collection('tokenPurchaseRequests').doc(purchaseRequestId).update({
                            status: 'approved',
                            paymentId: docRef.id,
                            paymentMethod: 'mobile_money',
                            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(() => {
                            // Add tokens to user account
                            const isFirstPurchase = currentUserData.hasPurchasedTokens !== true;
                            const bonusTokens = isFirstPurchase ? 200 : 0;
                            const currentTokens = currentUserData.tokens || 0;
                            const totalTokens = currentTokens + tokenAmount + bonusTokens;

                            return db.collection('users').doc(currentUser.uid).update({
                                tokens: totalTokens,
                                hasPurchasedTokens: true,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        });
                    } else {
                        // Update user subscription
                        return updateUserSubscription(paymentPlan, docRef.id);
                    }
                })
                .then(() => {
                    // Show success message and redirect
                    const message = isTokenPurchase
                        ? "Payment successful! Tokens have been added to your account."
                        : "Payment successful! Your account has been upgraded.";

                    alert(message);
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    console.error("Error updating payment:", error);
                    showError(`Error updating payment: ${error.message}`);
                    mobileSubmitButton.disabled = false;
                    mobileSubmitButton.textContent = `Pay with ${selectedProvider}`;
                });
            }, 3000);
        })
        .catch((error) => {
            console.error("Error initiating payment:", error);
            showError(`Error initiating payment: ${error.message}`);
            mobileSubmitButton.disabled = false;
            mobileSubmitButton.textContent = `Pay with ${selectedProvider}`;
        });
}

// Record income for admin dashboard
function recordIncome(data) {
    // Create income record
    const incomeData = {
        userId: data.userId,
        email: data.email,
        amount: data.amount,
        currency: 'NGN',
        type: data.type,
        details: data.details,
        paymentMethod: data.paymentMethod,
        date: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save to income collection
    return db.collection('income').add(incomeData)
        .then((docRef) => {
            console.log("Income recorded with ID:", docRef.id);
            return docRef.id;
        })
        .catch((error) => {
            console.error("Error recording income:", error);
            // Don't throw error to prevent breaking the payment flow
            return null;
        });
}

// Update user subscription
function updateUserSubscription(plan, paymentId) {
    // Calculate expiration date based on subscription duration
    const expirationDate = new Date();

    if (paymentDuration === 'yearly') {
        // Set expiration to 1 year from now
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else if (paymentDuration === 'lifetime') {
        // Set a very far future date for lifetime (e.g., 100 years)
        expirationDate.setFullYear(expirationDate.getFullYear() + 100);
    } else if (paymentDuration === 'quarterly') {
        // Set expiration to 3 months from now (for Content Creator plan)
        expirationDate.setMonth(expirationDate.getMonth() + 3);
    } else {
        // Default monthly - 30 days from now
        expirationDate.setDate(expirationDate.getDate() + 30);
    }

    // Create update object
    const updateData = {
        subscriptionTier: plan,
        subscriptionDuration: paymentDuration,
        subscriptionStart: firebase.firestore.FieldValue.serverTimestamp(),
        lastPaymentId: paymentId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Only set expiration for non-lifetime subscriptions
    if (paymentDuration !== 'lifetime') {
        updateData.subscriptionExpiration = firebase.firestore.Timestamp.fromDate(expirationDate);
    }

    // Update user document
    return db.collection('users').doc(currentUser.uid).update(updateData);
}

// Copy text to clipboard
function copyToClipboard() {
    let textToCopy;

    if (this.dataset.copyRef === 'true') {
        textToCopy = paymentReference.textContent;
    } else {
        textToCopy = this.dataset.copy;
    }

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            // Change icon to checkmark
            const originalIcon = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i>';

            // Revert back after 2 seconds
            setTimeout(() => {
                this.innerHTML = originalIcon;
            }, 2000);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showError("Failed to copy to clipboard");
        });
}

// Select mobile money provider
function selectProvider() {
    // Remove selected class from all providers
    providerOptions.forEach(option => option.classList.remove('selected'));

    // Add selected class to clicked provider
    this.classList.add('selected');

    // Set selected provider
    selectedProvider = this.dataset.provider;

    // Update button text
    providerNameSpan.textContent = this.querySelector('span').textContent;

    // Show payment form
    mobilePaymentForm.style.display = 'block';
}

// Show error message
function showError(message) {
    alert(message);
}

// Update UI for token purchase
function updateUIForTokenPurchase(requestData) {
    // Update page title and welcome message
    document.title = 'BINK - Complete Token Purchase';
    const welcomeMessageContainer = document.querySelector('.welcome-message-container');
    if (welcomeMessageContainer) {
        welcomeMessageContainer.innerHTML = `
            <h2>Complete Your Token Purchase</h2>
            <p>You're just one step away from getting ${requestData.tokenAmount} tokens for your BINK account.</p>
        `;
    }

    // Update order summary
    const orderDetails = document.querySelector('.order-details');
    if (orderDetails) {
        // Calculate bonus tokens for first-time purchasers
        const bonusTokens = requestData.isFirstPurchase ? 200 : 0;
        const totalTokens = requestData.tokenAmount + bonusTokens;

        orderDetails.innerHTML = `
            <div class="order-item">
                <span class="item-name">BINK Tokens</span>
                <span class="item-price">${requestData.tokenAmount} tokens</span>
            </div>
            ${bonusTokens > 0 ? `
            <div class="order-item">
                <span class="item-name">First Purchase Bonus</span>
                <span class="item-value">+${bonusTokens} tokens</span>
            </div>` : ''}
            <div class="order-item">
                <span class="item-name">Total Tokens</span>
                <span class="item-value">${totalTokens} tokens</span>
            </div>
            <div class="order-total">
                <span class="total-label">Total</span>
                <span class="total-price">₦${requestData.price}</span>
            </div>
        `;
    }

    // Update features section
    const orderFeatures = document.querySelector('.order-features');
    if (orderFeatures) {
        orderFeatures.innerHTML = `
            <h4>What You'll Get</h4>
            <ul>
                <li><i class="fas fa-check"></i> Access to premium templates</li>
                <li><i class="fas fa-check"></i> Use multiple premium templates</li>
                <li><i class="fas fa-check"></i> Valid for 30-120 days (depending on package)</li>
                ${requestData.isFirstPurchase ? '<li><i class="fas fa-check"></i> 200 bonus tokens on first purchase</li>' : ''}
            </ul>
        `;
    }

    // Update payment button amounts
    if (cardSubmitButton) {
        cardSubmitButton.textContent = `Pay ₦${requestData.price}`;
    }

    // Update bank transfer amount
    const bankDetailAmount = document.querySelector('.bank-detail-item .detail-value');
    if (bankDetailAmount && bankDetailAmount.previousElementSibling.textContent === 'Amount:') {
        bankDetailAmount.textContent = `₦${requestData.price}`;
    }
}

// Update order summary based on subscription details
function updateOrderSummary() {
    if (isTokenPurchase) {
        // Token purchase is handled separately
        return;
    }

    // Get order details elements
    const orderDetails = document.querySelector('.order-details');
    if (!orderDetails) return;

    // Format subscription period and billing cycle based on duration
    let subscriptionPeriod = '1 Month';
    let billingCycle = 'Monthly';
    let planName = 'BINK Premium Plan';

    if (paymentDuration === 'yearly') {
        subscriptionPeriod = '1 Year';
        billingCycle = 'Yearly';
        planName = 'BINK Premium Yearly Plan';
    } else if (paymentDuration === 'lifetime') {
        subscriptionPeriod = 'Lifetime';
        billingCycle = 'One-time payment';
        planName = 'BINK Premium Lifetime Plan';
    }

    // Update order details
    orderDetails.innerHTML = `
        <div class="order-item">
            <span class="item-name">${planName}</span>
            <span class="item-price">₦${paymentAmount.toLocaleString()}</span>
        </div>
        <div class="order-item">
            <span class="item-name">Subscription Period</span>
            <span class="item-value">${subscriptionPeriod}</span>
        </div>
        <div class="order-item">
            <span class="item-name">Billing Cycle</span>
            <span class="item-value">${billingCycle}</span>
        </div>
        <div class="order-total">
            <span class="total-label">Total</span>
            <span class="total-price">₦${paymentAmount.toLocaleString()}</span>
        </div>
    `;

    // Update card submit button
    if (cardSubmitButton) {
        cardSubmitButton.textContent = `Pay ₦${paymentAmount.toLocaleString()}`;
    }

    // Update bank transfer amount
    const bankDetailAmount = document.querySelector('.bank-detail-item .detail-value');
    if (bankDetailAmount && bankDetailAmount.previousElementSibling.textContent === 'Amount:') {
        bankDetailAmount.textContent = `₦${paymentAmount.toLocaleString()}`;
    }
}

// Initialize
function init() {
    // Get plan and token info from URL
    getPaymentPlanFromUrl();

    // Update order summary based on subscription details
    updateOrderSummary();

    // Add event listeners to tabs
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });

    // Add event listeners to forms
    if (cardPaymentForm) {
        cardPaymentForm.addEventListener('submit', handleCardPayment);
    }

    if (bankConfirmationForm) {
        bankConfirmationForm.addEventListener('submit', handleBankTransfer);
    }

    if (mobilePaymentForm) {
        mobilePaymentForm.addEventListener('submit', handleMobilePayment);
    }

    // Add event listeners to inputs
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', formatCardExpiry);
    }

    if (paymentProofInput) {
        paymentProofInput.addEventListener('change', handlePaymentProofChange);
    }

    // Add event listeners to copy buttons
    copyButtons.forEach(button => {
        button.addEventListener('click', copyToClipboard);
    });

    // Add event listeners to provider options
    providerOptions.forEach(option => {
        option.addEventListener('click', selectProvider);
    });

    // Logout Button Logic
    if (logoutButton && auth) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('User signed out successfully.');
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
                showError(`Failed to log out: ${error.message}`);
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
