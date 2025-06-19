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
let selectedBank = null;
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

// Detect card type based on card number
function detectCardType(cardNumber) {
    // Remove spaces and non-numeric characters
    const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

    // Card type patterns
    const cardPatterns = {
        visa: /^4/,
        mastercard: /^(5[1-5]|2[2-7])/,
        // Updated Verve card pattern to match 16-19 digit cards
        // Verve cards typically start with 506, 507, 5061, 5062, 5063, 6500
        verve: /^(506|507|6500|5061|5062|5063)/,
        amex: /^3[47]/,
        discover: /^(6011|65|64[4-9]|622)/
    };

    // Check card type
    for (const [type, pattern] of Object.entries(cardPatterns)) {
        if (pattern.test(cleanNumber)) {
            return type;
        }
    }

    // Default to unknown
    return 'unknown';
}

// Update card icon based on card type
function updateCardIcon(cardType) {
    const cardIcons = document.querySelectorAll('.card-icons i');
    const verveIcon = document.querySelector('.card-icons .verve-icon');

    // Hide all icons first
    cardIcons.forEach(icon => {
        icon.style.display = 'none';
    });

    // Hide Verve icon
    if (verveIcon) {
        verveIcon.style.display = 'none';
    }

    if (cardType === 'verve') {
        // Show Verve icon
        if (verveIcon) {
            verveIcon.style.display = 'inline-block';
            verveIcon.style.color = getCardColor(cardType);
        }
    } else {
        // Show the detected card icon
        const activeIcon = document.querySelector(`.card-icons i.fa-cc-${cardType}`);
        if (activeIcon) {
            activeIcon.style.display = 'block';
            activeIcon.style.color = getCardColor(cardType);
        } else if (cardType === 'unknown') {
            // If unknown card type, show all icons in muted color
            cardIcons.forEach(icon => {
                icon.style.display = 'block';
                icon.style.color = 'var(--text-muted)';
            });
            if (verveIcon) {
                verveIcon.style.display = 'none'; // Keep Verve hidden for unknown
            }
        }
    }
}

// Get card color based on type
function getCardColor(cardType) {
    const cardColors = {
        visa: '#1A1F71',
        mastercard: '#EB001B',
        verve: '#00425F',
        amex: '#006FCF',
        discover: '#FF6600'
    };

    return cardColors[cardType] || 'var(--text-muted)';
}

// Format card number with spaces
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';

    // Detect card type
    const cardType = detectCardType(value);
    console.log("Detected card type:", cardType);

    // Format based on card type
    if (cardType === 'verve' && value.length > 16) {
        // Verve cards can be 16, 17, 18, or 19 digits
        // Format: XXXX XXXX XXXX XXXX XXX
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && (i === 4 || i === 8 || i === 12 || i === 16)) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
    } else {
        // Standard 16-digit card formatting
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
    }

    e.target.value = formattedValue;

    // Update card icon
    updateCardIcon(cardType);
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
    console.log("Card payment form submitted");

    if (!currentUser) {
        showError("Please log in to complete your payment.");
        return;
    }

    // Validate card details
    const cardName = document.getElementById('card-name').value;
    const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, '');
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvv = document.getElementById('card-cvv').value;

    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        showError("Please fill in all card details.");
        return;
    }

    // Detect card type
    const cardType = detectCardType(cardNumber);

    // Basic validation based on card type
    if (cardType === 'verve') {
        // Verve cards can be 16, 17, 18, or 19 digits
        if (cardNumber.length < 16 || cardNumber.length > 19) {
            showError("Please enter a valid Verve card number (16-19 digits).");
            return;
        }
    } else if (cardType === 'amex') {
        // American Express cards are 15 digits
        if (cardNumber.length !== 15) {
            showError("Please enter a valid American Express card number (15 digits).");
            return;
        }
    } else {
        // Most other cards are 16 digits
        if (cardNumber.length !== 16) {
            showError("Please enter a valid card number (16 digits).");
            return;
        }
    }

    // CVV validation
    if (cardType === 'amex') {
        // American Express CVV is 4 digits
        if (cardCvv.length !== 4) {
            showError("American Express cards require a 4-digit CVV.");
            return;
        }
    } else {
        // Other cards have 3-digit CVV
        if (cardCvv.length !== 3) {
            showError("Please enter a valid 3-digit CVV.");
            return;
        }
    }

    // Disable submit button
    cardSubmitButton.disabled = true;
    cardSubmitButton.textContent = 'Processing...';

    try {
        // Save card data to sessionStorage (excluding sensitive details)
        sessionStorage.setItem('cardPaymentData', JSON.stringify({
            userId: currentUser.uid,
            amount: isTokenPurchase ? tokenPrice : paymentAmount,
            currency: 'NGN',
            paymentMethod: 'card',
            cardholderName: cardName,
            plan: isTokenPurchase ? null : paymentPlan,
            duration: isTokenPurchase ? null : paymentDuration,
            tokenAmount: isTokenPurchase ? tokenAmount : null,
            purchaseRequestId: isTokenPurchase ? purchaseRequestId : null
        }));

        console.log("Card payment data saved to session storage");

        // Check if Paystack is available
        if (window.BINK && window.BINK.paystack && window.BINK.paystackHandler) {
            console.log("Using Paystack for payment processing");

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
            // Fallback to direct card processing page
            console.log("Paystack not available, redirecting to card processing page");

            // Redirect to card processing page
            const redirectUrl = 'card-processing.html' + window.location.search;
            console.log("Redirecting to:", redirectUrl);
            window.location.href = redirectUrl;
        }
    } catch (error) {
        console.error("Error processing card payment:", error);
        showError("An error occurred while processing your payment. Please try again.");
        cardSubmitButton.disabled = false;
        cardSubmitButton.textContent = `Pay ₦${isTokenPurchase ? tokenPrice : paymentAmount}`;
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
    console.log("Bank transfer form submitted");

    if (!currentUser) {
        showError("Please log in to complete your payment.");
        return;
    }

    // Disable submit button
    bankSubmitButton.disabled = true;
    bankSubmitButton.textContent = 'Processing...';

    try {
        // Check if Paystack handler is available
        if (window.BINK && window.BINK.paystackHandler && window.BINK.paystackHandler.processBankTransferPayment) {
            console.log("Using specialized bank transfer handler");

            // Create metadata based on payment type
            const metadata = {};
            if (isTokenPurchase) {
                metadata.tokenPurchaseId = purchaseRequestId;
                metadata.tokenAmount = tokenAmount;
            } else {
                metadata.plan = paymentPlan;
                metadata.duration = paymentDuration;
            }

            // Use the specialized bank transfer function
            window.BINK.paystackHandler.processBankTransferPayment(
                isTokenPurchase ? tokenPrice : paymentAmount,
                null, // Let the handler generate a reference
                metadata
            )
            .catch((error) => {
                console.error("Error initiating bank transfer:", error);
                showError(`Error initiating bank transfer: ${error.message}`);
                bankSubmitButton.disabled = false;
                bankSubmitButton.textContent = 'Pay with Bank Transfer';
            });
        } else {
            // Fallback to manual bank transfer
            console.log("Specialized handler not available, using fallback bank transfer method");

            // Generate reference
            const reference = generatePaymentReference(currentUser.uid);

            // Save data to sessionStorage to pass to the next page
            sessionStorage.setItem('bankTransferData', JSON.stringify({
                userId: currentUser.uid,
                amount: isTokenPurchase ? tokenPrice : paymentAmount,
                currency: 'NGN',
                paymentMethod: 'bank_transfer',
                binkReference: reference,
                plan: isTokenPurchase ? null : paymentPlan,
                tokenAmount: isTokenPurchase ? tokenAmount : null,
                purchaseRequestId: isTokenPurchase ? purchaseRequestId : null
            }));

            console.log("Bank transfer data saved to session storage");

            // Redirect to bank transfer confirmation page
            const redirectUrl = 'bank-transfer-confirmation.html' + window.location.search;
            console.log("Redirecting to:", redirectUrl);
            window.location.href = redirectUrl;
        }
    } catch (error) {
        console.error("Error processing bank transfer:", error);
        showError("An error occurred while processing your request. Please try again.");
        bankSubmitButton.disabled = false;
        bankSubmitButton.textContent = 'Pay with Bank Transfer';
    }
}

// Handle mobile money payment
function handleMobilePayment(e) {
    e.preventDefault();
    console.log("Mobile money form submitted");

    if (!currentUser) {
        showError("Please log in to complete your payment.");
        return;
    }

    if (!selectedProvider) {
        showError("Please select a mobile money provider.");
        return;
    }

    // Get mobile number
    const mobileNumber = document.getElementById('mobile-number').value;

    if (!mobileNumber) {
        showError("Please enter your mobile number.");
        return;
    }

    // Disable submit button to prevent multiple submissions
    mobileSubmitButton.disabled = true;
    mobileSubmitButton.textContent = 'Processing...';

    try {
        // Save data to sessionStorage to pass to the next page
        sessionStorage.setItem('mobileMoneyData', JSON.stringify({
            userId: currentUser.uid,
            amount: isTokenPurchase ? tokenPrice : paymentAmount,
            currency: 'NGN',
            paymentMethod: 'mobile_money',
            provider: selectedProvider,
            providerName: document.querySelector(`.provider-option[data-provider="${selectedProvider}"] span`).textContent,
            mobileNumber: mobileNumber,
            plan: isTokenPurchase ? null : paymentPlan,
            tokenAmount: isTokenPurchase ? tokenAmount : null,
            purchaseRequestId: isTokenPurchase ? purchaseRequestId : null
        }));

        console.log("Mobile money data saved to session storage");

        // Redirect to mobile money confirmation page
        const redirectUrl = 'mobile-money-confirmation.html' + window.location.search;
        console.log("Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
    } catch (error) {
        console.error("Error saving mobile money data:", error);
        showError("An error occurred while processing your request. Please try again.");
        mobileSubmitButton.disabled = false;
        mobileSubmitButton.textContent = `Pay with ${selectedProvider}`;
    }
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

// Select bank for USSD
function selectBank() {
    // Remove selected class from all banks
    document.querySelectorAll('.bank-option').forEach(option => option.classList.remove('selected'));

    // Add selected class to clicked bank
    this.classList.add('selected');

    // Set selected bank
    selectedBank = this.dataset.bank;

    // Show USSD instructions
    const ussdInstructions = document.getElementById('ussd-instructions');
    if (ussdInstructions) {
        ussdInstructions.style.display = 'block';
    }

    // Update USSD code based on selected bank
    updateUssdCode(selectedBank);
}

// Update USSD code based on selected bank
function updateUssdCode(bank) {
    const ussdCodeElement = document.getElementById('ussd-code');
    if (!ussdCodeElement) return;

    const amount = isTokenPurchase ? tokenPrice : paymentAmount;

    // USSD codes for different banks
    const ussdCodes = {
        'access': `*901*${amount}#`,
        'gtb': `*737*${amount}#`,
        'zenith': `*966*${amount}#`,
        'firstbank': `*894*${amount}#`,
        'uba': `*919*${amount}#`,
        'other': `*${amount}#`
    };

    // Set the USSD code
    ussdCodeElement.textContent = ussdCodes[bank] || `*${amount}#`;
}

// Handle USSD payment
function handleUssdPayment(e) {
    e.preventDefault();
    console.log("USSD payment form submitted");

    if (!currentUser) {
        showError("Please log in to complete your payment.");
        return;
    }

    // Get phone number
    const ussdPhone = document.getElementById('ussd-phone').value;

    if (!ussdPhone) {
        showError("Please enter your phone number.");
        return;
    }

    // Disable submit button
    const ussdSubmitButton = document.getElementById('ussd-submit-button');
    if (ussdSubmitButton) {
        ussdSubmitButton.disabled = true;
        ussdSubmitButton.textContent = 'Processing...';
    }

    try {
        // Check if Paystack handler is available
        if (window.BINK && window.BINK.paystackHandler && window.BINK.paystackHandler.processUssdPayment) {
            console.log("Using specialized USSD payment handler");

            // Create metadata based on payment type
            const metadata = {};
            if (isTokenPurchase) {
                metadata.tokenPurchaseId = purchaseRequestId;
                metadata.tokenAmount = tokenAmount;
            } else {
                metadata.plan = paymentPlan;
                metadata.duration = paymentDuration;
            }

            // Use the specialized USSD function
            window.BINK.paystackHandler.processUssdPayment(
                isTokenPurchase ? tokenPrice : paymentAmount,
                ussdPhone,
                null, // Let the handler generate a reference
                metadata
            )
            .catch((error) => {
                console.error("Error initiating USSD payment:", error);
                showError(`Error initiating USSD payment: ${error.message}`);
                if (ussdSubmitButton) {
                    ussdSubmitButton.disabled = false;
                    ussdSubmitButton.textContent = 'Pay with USSD';
                }
            });
        } else {
            // Fallback to alert if specialized handler is not available
            console.log("Specialized handler not available, showing error message");
            showError("USSD payment requires Paystack integration. Please try another payment method or try again later.");
            if (ussdSubmitButton) {
                ussdSubmitButton.disabled = false;
                ussdSubmitButton.textContent = 'Pay with USSD';
            }
        }
    } catch (error) {
        console.error("Error processing USSD payment:", error);
        showError("An error occurred while processing your request. Please try again.");
        if (ussdSubmitButton) {
            ussdSubmitButton.disabled = false;
            ussdSubmitButton.textContent = 'Pay with USSD';
        }
    }
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
    console.log("Initializing payment page...");

    // Get plan and token info from URL
    getPaymentPlanFromUrl();

    // Update order summary based on subscription details
    updateOrderSummary();

    // Add event listeners to tabs
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });

    console.log("Setting up form event listeners...");

    // Add event listeners to forms
    if (cardPaymentForm) {
        console.log("Adding event listener to card payment form");
        cardPaymentForm.addEventListener('submit', handleCardPayment);
    } else {
        console.warn("Card payment form not found in the DOM");
    }

    if (bankConfirmationForm) {
        console.log("Adding event listener to bank confirmation form");
        bankConfirmationForm.addEventListener('submit', handleBankTransfer);
    } else {
        console.warn("Bank confirmation form not found in the DOM");
    }

    if (mobilePaymentForm) {
        console.log("Adding event listener to mobile payment form");
        mobilePaymentForm.addEventListener('submit', handleMobilePayment);
    } else {
        console.warn("Mobile payment form not found in the DOM");
    }

    // Add event listener to USSD payment form
    const ussdPaymentForm = document.getElementById('ussd-payment-form');
    if (ussdPaymentForm) {
        console.log("Adding event listener to USSD payment form");
        ussdPaymentForm.addEventListener('submit', handleUssdPayment);
    } else {
        console.warn("USSD payment form not found in the DOM");
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

    // We've removed the bank selection for USSD since we're going directly to Paystack

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

    console.log("Payment page initialization complete");
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
