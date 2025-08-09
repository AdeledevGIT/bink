// Tokens page functionality for BINK

// DOM Elements
const tokenCount = document.getElementById('tokenCount');
const premiumUserNote = document.getElementById('premiumUserNote');
const tokenButtons = document.querySelectorAll('.token-btn');
const welcomeMessage = document.getElementById('welcome-message');

// Global variables
let currentUser = null;
let userProfile = null;
let selectedTokenAmount = 0;
let selectedTokenPrice = 0;

// Initialize tokens page
async function initTokensPage() {
    try {
        // Check authentication
        currentUser = await checkAuth(true);
        if (!currentUser) return;

        // Load user profile
        await loadUserProfile();

        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing tokens page:', error);
    }
}

// Helper function to check authentication
function checkAuth(redirect = false) {
    return new Promise((resolve, reject) => {
        if (!auth) {
            console.error("Firebase Auth is not initialized.");
            if (redirect) window.location.href = 'login.html';
            resolve(null);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); // Stop listening immediately

            if (!user) {
                if (redirect) window.location.href = 'login.html';
                resolve(null);
                return;
            }

            // Check email verification for authenticated users
            if (redirect) {
                try {
                    await user.reload();
                    if (!user.emailVerified) {
                        console.log('Email not verified, redirecting to verification page');
                        window.location.href = 'verify-email.html';
                        resolve(null);
                        return;
                    }
                } catch (error) {
                    console.error('Error checking email verification:', error);
                    // Continue with normal flow if verification check fails
                }
            }

            resolve(user);
        }, (error) => {
            console.error("Auth state check error:", error);
            if (redirect) window.location.href = 'login.html';
            reject(error);
        });
    });
}

// Load user profile
async function loadUserProfile() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();

        if (userDoc.exists) {
            userProfile = userDoc.data();

            // Update welcome message
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${userProfile.username || currentUser.email}!`;
            }

            // Check if user is premium or creator
            const isPremiumUser = userProfile.subscriptionTier === 'premium' ||
                                 userProfile.subscriptionTier === 'creator' ||
                                 userProfile.isPremium;

            if (isPremiumUser) {
                // Show premium user note
                if (premiumUserNote) {
                    premiumUserNote.style.display = 'block';
                }

                // Disable token purchase buttons for premium users
                tokenButtons.forEach(button => {
                    button.disabled = true;
                    button.textContent = 'No Need - Premium Access';
                    button.style.backgroundColor = '#6B7280'; // Gray color
                    button.style.cursor = 'default';
                });
            }

            // Update token count
            updateTokenCount();

        } else {
            console.log('User document not found');
            // Create a user document if it doesn't exist
            await db.collection('users').doc(currentUser.uid).set({
                email: currentUser.email,
                username: currentUser.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                tokens: 0
            });

            userProfile = {
                email: currentUser.email,
                username: currentUser.email.split('@')[0],
                tokens: 0
            };

            updateTokenCount();
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Update token count display
function updateTokenCount() {
    if (tokenCount) {
        const tokens = userProfile.tokens || 0;
        tokenCount.textContent = tokens;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Token purchase buttons - direct redirect to payment page
    tokenButtons.forEach(button => {
        button.addEventListener('click', async () => {
            try {
                // Get token amount and price
                selectedTokenAmount = parseInt(button.getAttribute('data-amount'));
                selectedTokenPrice = parseFloat(button.getAttribute('data-price'));

                // Disable button to prevent multiple clicks
                button.disabled = true;
                button.textContent = 'Processing...';

                // Record token purchase request directly
                const purchaseRequestRef = await db.collection('tokenPurchaseRequests').add({
                    userId: currentUser.uid,
                    username: userProfile.username || '',
                    email: currentUser.email,
                    fullName: userProfile.fullName || userProfile.username || '',
                    phoneNumber: userProfile.phoneNumber || '',
                    tokenAmount: selectedTokenAmount,
                    price: selectedTokenPrice,
                    currency: 'NGN',
                    status: 'pending',
                    isFirstPurchase: !(userProfile.hasPurchasedTokens || false),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Redirect directly to payment page with purchase ID and token information
                window.location.href = `payment.html?purchase=${purchaseRequestRef.id}&amount=${selectedTokenAmount}&price=${selectedTokenPrice}&type=token`;

            } catch (error) {
                console.error('Error processing token purchase:', error);
                alert('Error initiating purchase. Please try again.');

                // Re-enable button
                button.disabled = false;
                button.textContent = `Buy ${selectedTokenAmount} Tokens`;
            }
        });
    });
}

// Validate payment form function removed as it's no longer needed

// Record token transaction
async function recordTokenTransaction(amount, price) {
    try {
        await db.collection('tokenTransactions').add({
            userId: currentUser.uid,
            amount: amount,
            price: price,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error recording token transaction:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initTokensPage);
