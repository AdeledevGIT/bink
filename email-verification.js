// Email Verification Logic for BINK
// Handles email verification flow, resend functionality, and verification status

// Note: currentUser is declared in the main page's JavaScript file
let resendCooldown = 0;
let countdownInterval = null;

// Utility function to safely get current user
function getCurrentUser() {
    return (typeof currentUser !== 'undefined' && currentUser) ||
           (auth && auth.currentUser) ||
           null;
}

// Initialize email verification page
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the verification page
    if (window.location.pathname.includes('verify-email.html')) {
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    // Set currentUser if it exists in global scope
                    if (typeof currentUser !== 'undefined') {
                        currentUser = user;
                    }
                    console.log('User authenticated:', user.uid);
                    initializeVerificationPage(user);
                } else {
                    console.log('User not authenticated, redirecting to login');
                    window.location.href = 'login.html';
                }
            });
        } else {
            console.error('Firebase Auth not initialized');
            displayError('Firebase authentication not available');
        }
    }
});

// Initialize the verification page with user data
async function initializeVerificationPage(user) {
    try {
        // Display user email
        const emailDisplay = document.getElementById('user-email');
        if (emailDisplay) {
            emailDisplay.textContent = user.email;
        }

        // Check if user is already verified
        await checkVerificationStatus(user);

        // Set up automatic verification check
        startVerificationPolling();

    } catch (error) {
        console.error('Error initializing verification page:', error);
        displayError('Failed to initialize verification page');
    }
}

// Check if user's email is already verified
async function checkVerificationStatus(user) {
    try {
        // Reload user to get latest verification status
        await user.reload();
        
        if (user.emailVerified) {
            console.log('Email already verified, updating database and redirecting');
            await updateUserVerificationStatus(user.uid, true);
            
            // Show success message and redirect
            displaySuccess('Email verified successfully! Redirecting to setup your profile...');
            setTimeout(() => {
                window.location.href = 'onboarding.html';
            }, 2000);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking verification status:', error);
        return false;
    }
}

// Update user verification status in Firestore
async function updateUserVerificationStatus(userId, isVerified) {
    try {
        if (!db) {
            console.error('Firestore not initialized');
            return false;
        }

        await db.collection('users').doc(userId).update({
            emailVerified: isVerified,
            emailVerifiedAt: isVerified ? firebase.firestore.FieldValue.serverTimestamp() : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('User verification status updated:', isVerified);
        return true;
    } catch (error) {
        console.error('Error updating verification status:', error);
        return false;
    }
}

// Send verification email
async function sendVerificationEmail(user = null) {
    try {
        const targetUser = user || getCurrentUser();

        if (!targetUser) {
            throw new Error('No user available for verification');
        }

        // Send verification email using Firebase Auth
        await targetUser.sendEmailVerification({
            url: window.location.origin + '/onboarding.html', // Redirect URL after verification
            handleCodeInApp: false
        });

        console.log('Verification email sent to:', targetUser.email);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

// Resend verification email with cooldown
async function resendVerificationEmail() {
    try {
        if (resendCooldown > 0) {
            displayError(`Please wait ${resendCooldown} seconds before requesting another email`);
            return;
        }

        const user = getCurrentUser();
        if (!user) {
            displayError('No user session found');
            return;
        }

        // Disable button and show loading
        const resendButton = document.getElementById('resend-button');
        if (resendButton) {
            resendButton.disabled = true;
            resendButton.textContent = 'Sending...';
        }

        // Send verification email
        await sendVerificationEmail(user);
        
        // Show success message
        displaySuccess('Verification email sent successfully!');
        
        // Start cooldown
        startResendCooldown();

    } catch (error) {
        console.error('Error resending verification email:', error);
        displayError('Failed to send verification email. Please try again.');
        
        // Re-enable button
        const resendButton = document.getElementById('resend-button');
        if (resendButton) {
            resendButton.disabled = false;
            resendButton.textContent = 'Resend Verification Email';
        }
    }
}

// Start cooldown timer for resend button
function startResendCooldown() {
    resendCooldown = 60; // 60 seconds cooldown
    const resendButton = document.getElementById('resend-button');
    const countdownText = document.getElementById('countdown-text');
    const countdownSpan = document.getElementById('countdown');

    if (resendButton) {
        resendButton.style.display = 'none';
    }
    
    if (countdownText) {
        countdownText.style.display = 'block';
    }

    countdownInterval = setInterval(() => {
        resendCooldown--;
        
        if (countdownSpan) {
            countdownSpan.textContent = resendCooldown;
        }

        if (resendCooldown <= 0) {
            clearInterval(countdownInterval);
            
            // Re-enable resend button
            if (resendButton) {
                resendButton.disabled = false;
                resendButton.textContent = 'Resend Verification Email';
                resendButton.style.display = 'inline-block';
            }
            
            if (countdownText) {
                countdownText.style.display = 'none';
            }
        }
    }, 1000);
}

// Start polling to check verification status
function startVerificationPolling() {
    // Check every 5 seconds if email has been verified
    const pollInterval = setInterval(async () => {
        const user = getCurrentUser();
        if (user) {
            const isVerified = await checkVerificationStatus(user);
            if (isVerified) {
                clearInterval(pollInterval);
            }
        }
    }, 5000);

    // Stop polling after 10 minutes to avoid excessive requests
    setTimeout(() => {
        clearInterval(pollInterval);
    }, 600000); // 10 minutes
}

// Display success message
function displaySuccess(message) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // Hide error message if visible
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

// Display error message
function displayError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide success message if visible
        const successElement = document.getElementById('success-message');
        if (successElement) {
            successElement.style.display = 'none';
        }
    }
}

// Clear all messages
function clearMessages() {
    const successElement = document.getElementById('success-message');
    const errorElement = document.getElementById('error-message');
    
    if (successElement) {
        successElement.style.display = 'none';
    }
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Check if user needs email verification (utility function for other pages)
async function requireEmailVerification(user) {
    try {
        if (!user) {
            return false;
        }

        // Reload user to get latest verification status
        await user.reload();
        
        if (!user.emailVerified) {
            // Redirect to verification page
            window.location.href = 'verify-email.html';
            return false;
        }

        // Update database if not already updated
        if (db) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && !userDoc.data().emailVerified) {
                await updateUserVerificationStatus(user.uid, true);
            }
        }

        return true;
    } catch (error) {
        console.error('Error checking email verification requirement:', error);
        return false;
    }
}

// Export functions for use in other files
window.BINK = window.BINK || {};
window.BINK.emailVerification = {
    sendVerificationEmail,
    requireEmailVerification,
    updateUserVerificationStatus,
    checkVerificationStatus
};
