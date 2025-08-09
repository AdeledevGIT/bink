// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    alert("Error: Firebase not loaded. Please try refreshing.");
}

// DOM Elements
const freePlanButton = document.getElementById('free-plan-button');
const premiumMonthlyButton = document.getElementById('premium-monthly-button');
const premiumYearlyButton = document.getElementById('premium-yearly-button');
const premiumLifetimeButton = document.getElementById('premium-lifetime-button');
const creatorPlanButton = document.getElementById('creator-plan-button');
const creatorModal = document.getElementById('creator-modal');
const closeModal = document.querySelector('.close-modal');
const creatorApplicationForm = document.getElementById('creator-application-form');
const submitApplicationButton = document.getElementById('submit-application-button');
const logoutButton = document.getElementById('logout-button');
const faqItems = document.querySelectorAll('.faq-item');

// Token Purchase Elements
const tokenPurchaseSection = document.getElementById('token-purchase-section');
const pricingPlansContainer = document.getElementById('pricing-plans-container');
const tokenAmountDisplay = document.getElementById('token-amount-display');
const tokenPriceDisplay = document.getElementById('token-price-display');
const tokenBonusDisplay = document.getElementById('token-bonus-display');
const tokenTotalDisplay = document.getElementById('token-total-display');
const paymentReference = document.getElementById('payment-reference');
const confirmPaymentButton = document.getElementById('confirm-payment-button');
const cancelPaymentButton = document.getElementById('cancel-payment-button');
const paymentScreenshot = document.getElementById('payment-screenshot');
const paymentNotes = document.getElementById('payment-notes');

// Global variables
let currentUser = null;
let currentUserData = null;
let purchaseRequestId = null;
let tokenAmount = 0;
let tokenPrice = 0;
let isFirstPurchase = false;

// Check authentication state
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('User authenticated:', user.uid);
            loadUserSubscription(user.uid);

            // Check if this is a token purchase confirmation
            checkForTokenPurchase();
        } else {
            console.log('User is signed out. Redirecting to login.');
            window.location.href = 'login.html';
        }
    });
} else {
    console.error("Cannot check auth state because Firebase Auth is not loaded.");
    showError("Error loading user status.");
}

// Load user subscription data
function loadUserSubscription(userId) {
    const userDocRef = db.collection('users').doc(userId);
    userDocRef.get().then((doc) => {
        if (doc.exists) {
            currentUserData = doc.data();
            console.log("Loaded user data:", currentUserData);

            // Update UI based on subscription
            updateSubscriptionUI(currentUserData.subscriptionTier || 'free');

            // Check and show trial card if eligible
            checkAndShowTrialCard();
        } else {
            console.log("No such user document!");
            showError("Could not load user data.");
        }
    }).catch((error) => {
        console.error("Error getting user document:", error);
        showError(`Error loading user data: ${error.message}`);
    });
}

// Update UI based on subscription tier
function updateSubscriptionUI(subscriptionTier) {
    // Reset all buttons
    freePlanButton.textContent = 'Select Plan';
    freePlanButton.classList.remove('current-plan');

    premiumMonthlyButton.textContent = 'Upgrade Now';
    premiumMonthlyButton.classList.add('premium-button');
    premiumMonthlyButton.classList.remove('current-plan');

    premiumYearlyButton.textContent = 'Upgrade Now';
    premiumYearlyButton.classList.add('premium-button');
    premiumYearlyButton.classList.remove('current-plan');

    premiumLifetimeButton.textContent = 'Upgrade Now';
    premiumLifetimeButton.classList.add('premium-button');
    premiumLifetimeButton.classList.remove('current-plan');

    creatorPlanButton.textContent = 'Apply Now';
    creatorPlanButton.classList.remove('current-plan');

    // Update based on current subscription
    switch (subscriptionTier) {
        case 'free':
            freePlanButton.textContent = 'Current Plan';
            freePlanButton.classList.add('current-plan');
            break;
        case 'premium':
            // Check subscription duration
            const duration = currentUserData?.subscriptionDuration || 'monthly';

            if (duration === 'monthly') {
                premiumMonthlyButton.textContent = 'Current Plan';
                premiumMonthlyButton.classList.remove('premium-button');
                premiumMonthlyButton.classList.add('current-plan');
            } else if (duration === 'yearly') {
                premiumYearlyButton.textContent = 'Current Plan';
                premiumYearlyButton.classList.remove('premium-button');
                premiumYearlyButton.classList.add('current-plan');
            } else if (duration === 'lifetime') {
                premiumLifetimeButton.textContent = 'Current Plan';
                premiumLifetimeButton.classList.remove('premium-button');
                premiumLifetimeButton.classList.add('current-plan');
            }
            break;
        case 'trial':
            // For trial users, show they have premium access but encourage upgrade
            const trialButton = document.getElementById('start-trial-button');
            if (trialButton) {
                const daysRemaining = window.TrialManager ?
                    window.TrialManager.getTrialDaysRemaining(currentUserData) : 0;
                trialButton.innerHTML = `<i class="fas fa-crown"></i> Trial Active (${daysRemaining} days left)`;
                trialButton.classList.add('current-plan');
            }
            break;
        case 'creator':
            creatorPlanButton.textContent = 'Current Plan';
            creatorPlanButton.classList.add('current-plan');
            break;
    }
}

// Handle premium plan selection
function handlePremiumPlanSelection(event) {
    if (!currentUser) {
        showError("Please log in to upgrade your plan.");
        return;
    }

    // Get plan and duration from button data attributes
    const button = event.currentTarget;
    const plan = button.getAttribute('data-plan');
    const duration = button.getAttribute('data-duration');

    // Check if already on this plan and duration
    if (currentUserData?.subscriptionTier === plan && currentUserData?.subscriptionDuration === duration) {
        showError(`You are already on the ${plan} ${duration} plan.`);
        return;
    }

    // Calculate price based on duration
    let price = 2500; // Default monthly price

    if (duration === 'yearly') {
        price = 25000;
    } else if (duration === 'lifetime') {
        price = 60000;
    }

    // Redirect to payment page
    window.location.href = `payment.html?plan=${plan}&duration=${duration}&price=${price}`;
}

// Open creator application modal
function openCreatorModal() {
    if (!currentUser) {
        showError("Please log in to apply for the Content Creator plan.");
        return;
    }

    // Check if already on creator plan
    if (currentUserData?.subscriptionTier === 'creator') {
        showError("You are already on the Content Creator plan.");
        return;
    }

    // Show modal
    creatorModal.style.display = 'block';
}

// Close creator application modal
function closeCreatorModal() {
    creatorModal.style.display = 'none';
}

// Handle creator application submission
function handleCreatorApplication(e) {
    e.preventDefault();

    if (!currentUser) {
        showError("Please log in to apply for the Content Creator plan.");
        return;
    }

    // Disable submit button
    submitApplicationButton.disabled = true;
    submitApplicationButton.textContent = 'Submitting...';

    // Get form data
    const socialPlatform = document.getElementById('social-platform').value;
    const followerCount = parseInt(document.getElementById('follower-count').value);
    const profileUrl = document.getElementById('profile-url').value;
    const videoUrl = document.getElementById('video-url').value;
    const videoViews = parseInt(document.getElementById('video-views').value);
    const applicationNotes = document.getElementById('application-notes').value;

    // Validate requirements
    if (followerCount < 10000) {
        showError("You need at least 10,000 followers to qualify.");
        submitApplicationButton.disabled = false;
        submitApplicationButton.textContent = 'Submit Application';
        return;
    }

    if (videoViews < 20000) {
        showError("Your promotional video needs at least 20,000 views to qualify.");
        submitApplicationButton.disabled = false;
        submitApplicationButton.textContent = 'Submit Application';
        return;
    }

    // Create application data
    const applicationData = {
        userId: currentUser.uid,
        username: currentUserData?.username || '',
        email: currentUser.email,
        socialPlatform,
        followerCount,
        profileUrl,
        videoUrl,
        videoViews,
        applicationNotes,
        status: 'pending',
        plan: 'creator',
        duration: 'quarterly', // 3-month duration for creator plan
        price: 6000, // Price for 3 months
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    db.collection('creatorApplications').add(applicationData)
        .then(() => {
            console.log("Application submitted successfully");

            // Update user document with application status
            return db.collection('users').doc(currentUser.uid).update({
                creatorApplicationStatus: 'pending',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Show success message
            alert("Your application has been submitted successfully! We'll review it and get back to you soon.");

            // Close modal
            closeCreatorModal();

            // Reset form
            creatorApplicationForm.reset();
        })
        .catch((error) => {
            console.error("Error submitting application:", error);
            showError(`Error submitting application: ${error.message}`);
        })
        .finally(() => {
            submitApplicationButton.disabled = false;
            submitApplicationButton.textContent = 'Submit Application';
        });
}

// Toggle FAQ item
function toggleFaqItem() {
    // Remove active class from all items
    faqItems.forEach(item => {
        if (item !== this.parentElement && item.classList.contains('active')) {
            item.classList.remove('active');
        }
    });

    // Toggle active class on clicked item
    this.parentElement.classList.toggle('active');
}

// Show error message
function showError(message) {
    alert(message);
}

// Check for token purchase
function checkForTokenPurchase() {
    const urlParams = new URLSearchParams(window.location.search);
    purchaseRequestId = urlParams.get('purchase');

    if (purchaseRequestId) {
        // Get token amount and price from URL
        tokenAmount = parseInt(urlParams.get('amount') || '0');
        tokenPrice = parseInt(urlParams.get('price') || '0');

        // Load purchase request details
        loadPurchaseRequest(purchaseRequestId);
    }
}

// Load purchase request details
function loadPurchaseRequest(requestId) {
    db.collection('tokenPurchaseRequests').doc(requestId).get()
        .then((doc) => {
            if (doc.exists) {
                const requestData = doc.data();

                // Check if this request belongs to the current user
                if (requestData.userId !== currentUser.uid) {
                    showError("This purchase request doesn't belong to your account.");
                    return;
                }

                // Check if request is already processed
                if (requestData.status !== 'pending') {
                    if (requestData.status === 'approved') {
                        alert("This token purchase has already been approved. Your tokens have been added to your account.");
                    } else {
                        alert("This token purchase request has been rejected.");
                    }
                    return;
                }

                // Update UI with request details
                tokenAmount = requestData.tokenAmount;
                tokenPrice = requestData.price;
                isFirstPurchase = requestData.isFirstPurchase;

                // Show token purchase section
                showTokenPurchaseSection();
            } else {
                showError("Purchase request not found.");
            }
        })
        .catch((error) => {
            console.error("Error loading purchase request:", error);
            showError(`Error loading purchase request: ${error.message}`);
        });
}

// Show token purchase section
function showTokenPurchaseSection() {
    // Update token details
    tokenAmountDisplay.textContent = `${tokenAmount} tokens`;
    tokenPriceDisplay.textContent = `₦${tokenPrice}`;

    // Update bonus display
    if (isFirstPurchase) {
        tokenBonusDisplay.textContent = '+200 tokens';
        tokenTotalDisplay.textContent = `${tokenAmount + 200} tokens`;
    } else {
        tokenBonusDisplay.textContent = '0 tokens';
        tokenTotalDisplay.textContent = `${tokenAmount} tokens`;
    }

    // Generate payment reference
    const reference = `BINK-${currentUser.uid.substring(0, 6)}-${Date.now().toString().substring(7)}`;
    paymentReference.textContent = reference;

    // Show token purchase section and hide pricing plans
    tokenPurchaseSection.style.display = 'block';
    pricingPlansContainer.style.display = 'none';
    document.querySelector('.pricing-faq').style.display = 'none';
}

// Handle payment confirmation
function handlePaymentConfirmation() {
    if (!purchaseRequestId) {
        showError("No purchase request found.");
        return;
    }

    // Check if screenshot is uploaded
    if (!paymentScreenshot.files || paymentScreenshot.files.length === 0) {
        showError("Please upload a screenshot of your payment.");
        return;
    }

    // Disable button
    confirmPaymentButton.disabled = true;
    confirmPaymentButton.textContent = 'Processing...';

    // Upload screenshot to Firebase Storage
    const file = paymentScreenshot.files[0];
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`payment_receipts/${purchaseRequestId}_${file.name}`);

    fileRef.put(file).then((snapshot) => {
        return snapshot.ref.getDownloadURL();
    }).then((downloadURL) => {
        // Update purchase request with receipt URL and notes
        return db.collection('tokenPurchaseRequests').doc(purchaseRequestId).update({
            receiptUrl: downloadURL,
            notes: paymentNotes.value || '',
            receiptSubmittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(() => {
        alert("Your payment receipt has been submitted successfully! We'll verify your payment and add the tokens to your account soon.");
        window.location.href = 'dashboard.html';
    }).catch((error) => {
        console.error("Error confirming payment:", error);
        showError(`Error confirming payment: ${error.message}`);
        confirmPaymentButton.disabled = false;
        confirmPaymentButton.textContent = 'Confirm Payment';
    });
}

// Handle cancel payment
function handleCancelPayment() {
    if (confirm("Are you sure you want to cancel this token purchase?")) {
        window.location.href = 'dashboard.html';
    }
}

// Event Listeners
if (premiumMonthlyButton) {
    premiumMonthlyButton.addEventListener('click', handlePremiumPlanSelection);
}

if (premiumYearlyButton) {
    premiumYearlyButton.addEventListener('click', handlePremiumPlanSelection);
}

if (premiumLifetimeButton) {
    premiumLifetimeButton.addEventListener('click', handlePremiumPlanSelection);
}

if (creatorPlanButton) {
    creatorPlanButton.addEventListener('click', openCreatorModal);
}

if (closeModal) {
    closeModal.addEventListener('click', closeCreatorModal);
}

if (creatorApplicationForm) {
    creatorApplicationForm.addEventListener('submit', handleCreatorApplication);
}

if (confirmPaymentButton) {
    confirmPaymentButton.addEventListener('click', handlePaymentConfirmation);
}

if (cancelPaymentButton) {
    cancelPaymentButton.addEventListener('click', handleCancelPayment);
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === creatorModal) {
        closeCreatorModal();
    }
});

// Add click event to FAQ questions
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', toggleFaqItem);
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

// Initialize platform settings if they don't exist
function initializePlatformSettings() {
    const platformRef = db.collection('settings').doc('platform');

    // Check if platform document exists
    return platformRef.get().then((doc) => {
        if (!doc.exists) {
            // Create default platform settings with lifetime plan enabled
            return platformRef.set({
                lifetimePlanEnabled: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("Default platform settings created with lifetime plan enabled");
                return true; // Return true to indicate lifetime plan is enabled
            })
            .catch((error) => {
                console.error("Error creating platform settings:", error);
                return false;
            });
        } else {
            // Document exists, return the lifetimePlanEnabled value
            const settings = doc.data();
            return settings.lifetimePlanEnabled || false;
        }
    }).catch((error) => {
        console.error("Error checking platform settings:", error);
        return false;
    });
}

// Check if lifetime plan is enabled
function checkLifetimePlanAvailability() {
    return db.collection('settings').doc('platform').get()
        .then((doc) => {
            if (doc.exists) {
                const settings = doc.data();
                return settings.lifetimePlanEnabled || false;
            } else {
                // If document doesn't exist, initialize it
                return initializePlatformSettings();
            }
        })
        .catch((error) => {
            console.error("Error checking lifetime plan availability:", error);
            return false;
        });
}

// Update lifetime plan visibility and promo message
function updateLifetimePlanVisibility(isEnabled) {
    // Find the lifetime plan card specifically by its button ID
    const lifetimePlanCard = document.querySelector('#premium-lifetime-button').closest('.pricing-card');

    if (lifetimePlanCard) {
        if (isEnabled) {
            lifetimePlanCard.style.display = 'block';

            // Add promo badge
            const badge = lifetimePlanCard.querySelector('.pricing-badge');
            if (badge) {
                // Get current promo message from Firestore if available
                db.collection('settings').doc('promotions').get()
                    .then((doc) => {
                        if (doc.exists) {
                            const promoData = doc.data();
                            if (promoData.lifetimePromoEnabled && promoData.lifetimePromoMessage) {
                                // Format badge text with duration if applicable
                                let badgeText = promoData.lifetimePromoMessage;

                                if (promoData.lifetimePromoDurationType === 'days' && promoData.lifetimePromoDays) {
                                    badgeText = `${promoData.lifetimePromoMessage} (${promoData.lifetimePromoDays} days)`;
                                } else if (promoData.lifetimePromoDurationType === 'date' && promoData.lifetimePromoEndDate) {
                                    // Convert timestamp to date
                                    let endDate;
                                    if (promoData.lifetimePromoEndDate instanceof firebase.firestore.Timestamp) {
                                        endDate = promoData.lifetimePromoEndDate.toDate();
                                    } else if (promoData.lifetimePromoEndDate.seconds) {
                                        endDate = new Date(promoData.lifetimePromoEndDate.seconds * 1000);
                                    }

                                    if (endDate) {
                                        const formattedDate = endDate.toLocaleDateString();
                                        badgeText = `${promoData.lifetimePromoMessage} (Until ${formattedDate})`;
                                    }
                                }

                                badge.textContent = badgeText;
                                badge.style.backgroundColor = promoData.lifetimePromoColor || '#FF6B6B';

                                // Add promo description if available
                                if (promoData.lifetimePromoDescription) {
                                    // Check if promo description element exists, if not create it
                                    let promoDesc = lifetimePlanCard.querySelector('.promo-description');
                                    if (!promoDesc) {
                                        promoDesc = document.createElement('div');
                                        promoDesc.className = 'promo-description';
                                        const priceElement = lifetimePlanCard.querySelector('.pricing-price');
                                        priceElement.insertAdjacentElement('afterend', promoDesc);
                                    }

                                    // Add promotion type to description if available
                                    let descriptionText = promoData.lifetimePromoDescription;
                                    if (promoData.lifetimePromoType && promoData.lifetimePromoType !== 'custom') {
                                        const typeLabels = {
                                            'discount': 'Discount',
                                            'launch': 'Launch Special',
                                            'holiday': 'Holiday Special',
                                            'limited': 'Limited Time'
                                        };

                                        const typeLabel = typeLabels[promoData.lifetimePromoType] || '';
                                        if (typeLabel) {
                                            descriptionText = `${typeLabel}: ${descriptionText}`;
                                        }
                                    }

                                    promoDesc.textContent = descriptionText;
                                    promoDesc.style.color = promoData.lifetimePromoColor || '#FF6B6B';
                                    promoDesc.style.fontWeight = 'bold';
                                    promoDesc.style.marginTop = '5px';
                                }
                            } else {
                                // Default promo message if none specified
                                badge.textContent = 'Limited Time Offer';
                                badge.style.backgroundColor = '#FF6B6B';
                            }
                        } else {
                            // Default promo message if document doesn't exist
                            badge.textContent = 'Limited Time Offer';
                            badge.style.backgroundColor = '#FF6B6B';
                        }
                    })
                    .catch((error) => {
                        console.error("Error getting promotion settings:", error);
                        // Default promo message on error
                        badge.textContent = 'Limited Time Offer';
                        badge.style.backgroundColor = '#FF6B6B';
                    });
            }
        } else {
            lifetimePlanCard.style.display = 'none';
        }
    }
}

// Initialize promotions settings if they don't exist
function initializePromotionsSettings() {
    const promotionsRef = db.collection('settings').doc('promotions');

    // Check if promotions document exists
    promotionsRef.get().then((doc) => {
        if (!doc.exists) {
            // Create default promotions settings
            promotionsRef.set({
                lifetimePromoEnabled: true,
                lifetimePromoMessage: 'Limited Time Offer',
                lifetimePromoDescription: 'Special launch price - Get lifetime access!',
                lifetimePromoColor: '#FF6B6B',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("Default promotions settings created");
            })
            .catch((error) => {
                console.error("Error creating promotions settings:", error);
            });
        }
    }).catch((error) => {
        console.error("Error checking promotions settings:", error);
    });
}

// Initialize
function init() {
    // Check if user is logged in
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            // Get user data
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        currentUserData = doc.data();
                        updateSubscriptionUI(currentUserData.subscriptionTier || 'free');

                        // Check if user is admin and initialize promotions settings
                        if (currentUserData.isAdmin) {
                            initializePromotionsSettings();
                        }
                    } else {
                        console.log("No user data found");
                        updateSubscriptionUI('free');
                    }
                })
                .catch((error) => {
                    console.error("Error getting user data:", error);
                    updateSubscriptionUI('free');
                });
        } else {
            updateSubscriptionUI('free');
        }
    });

    // Check lifetime plan availability
    checkLifetimePlanAvailability().then(isEnabled => {
        updateLifetimePlanVisibility(isEnabled);
    });

    // Check for token purchase
    checkForTokenPurchase();
}

// Trial Card Functionality
function checkAndShowTrialCard() {
    const trialCard = document.getElementById('trial-pricing-card');
    const startTrialButton = document.getElementById('start-trial-button');

    if (!trialCard || !currentUserData || !window.TrialManager) {
        return;
    }

    // Show trial card if user is eligible
    if (window.TrialManager.isEligibleForTrial(currentUserData)) {
        trialCard.style.display = 'block';

        // Set up trial button click handler
        if (startTrialButton && !startTrialButton.hasAttribute('data-handler-attached')) {
            startTrialButton.setAttribute('data-handler-attached', 'true');
            startTrialButton.addEventListener('click', handleStartTrial);
        }
    } else if (window.TrialManager.hasActiveTrial(currentUserData)) {
        // Show trial card with different content for active trial users
        showActiveTrialCard();
    } else {
        // Hide trial card for ineligible users
        trialCard.style.display = 'none';
    }
}

function showActiveTrialCard() {
    const trialCard = document.getElementById('trial-pricing-card');
    const startTrialButton = document.getElementById('start-trial-button');

    if (!trialCard || !currentUserData || !window.TrialManager) {
        return;
    }

    const daysRemaining = window.TrialManager.getTrialDaysRemaining(currentUserData);

    // Update card content for active trial
    const priceElement = trialCard.querySelector('.price');
    const periodElement = trialCard.querySelector('.period');
    const saveElement = trialCard.querySelector('.pricing-save');

    if (priceElement) priceElement.textContent = `${daysRemaining}`;
    if (periodElement) periodElement.textContent = 'days left';
    if (saveElement) saveElement.textContent = 'Premium trial active!';

    // Update button
    if (startTrialButton) {
        startTrialButton.innerHTML = '<i class="fas fa-crown"></i> Upgrade to Keep Premium';
        startTrialButton.onclick = () => {
            // Scroll to premium plans
            document.querySelector('.pricing-card:not(.trial-card)').scrollIntoView({
                behavior: 'smooth'
            });
        };
    }

    trialCard.style.display = 'block';
}

async function handleStartTrial() {
    const startTrialButton = document.getElementById('start-trial-button');

    if (!currentUser || !startTrialButton) {
        return;
    }

    // Disable button and show loading
    startTrialButton.disabled = true;
    startTrialButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting Trial...';

    try {
        const success = await window.TrialManager.startTrial(currentUser.uid);

        if (success) {
            // Show success message
            showSuccess('🎉 Trial started! You now have 14 days of premium access!');

            // Reload user data to reflect changes
            setTimeout(() => {
                loadUserSubscription(currentUser.uid);
            }, 1000);

            // Redirect to dashboard after a moment
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } else {
            throw new Error('Failed to start trial');
        }

    } catch (error) {
        console.error('Error starting trial:', error);
        showError('Failed to start trial. Please try again.');

        // Re-enable button
        startTrialButton.disabled = false;
        startTrialButton.innerHTML = '<i class="fas fa-rocket"></i> Start Free Trial';
    }
}

// Add trial button to the DOM elements at the top
const startTrialButton = document.getElementById('start-trial-button');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
