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
        console.log('🔧 Initializing verification page for user:', user.email);
        console.log('🔧 User UID:', user.uid);
        console.log('🔧 Email verified:', user.emailVerified);
        console.log('🔧 Firebase config domain:', auth?.app?.options?.authDomain);

        // Display user email
        const emailDisplay = document.getElementById('user-email');
        if (emailDisplay) {
            emailDisplay.textContent = user.email;
        }

        // Check if signup was rate limited
        if (sessionStorage.getItem('signupRateLimited') === 'true') {
            displayError('Email sending was temporarily limited during signup. Please check your inbox, or wait a few minutes before requesting a new verification email.');
            sessionStorage.removeItem('signupRateLimited');
            // Start with a longer initial cooldown
            startResendCooldown(180); // 3 minutes
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

        console.log('Attempting to send verification email to:', targetUser.email);
        console.log('User email verified status:', targetUser.emailVerified);
        console.log('Current domain:', window.location.origin);

        // Send verification email using Firebase Auth (without custom continue URL to avoid auth/invalid-continue-uri)
        // Firebase will use the default email template and redirect behavior
        await targetUser.sendEmailVerification();

        console.log('✅ Verification email API call successful for:', targetUser.email);
        console.log('📧 Email should be sent to:', targetUser.email);
        console.log('🔗 Verification link will redirect to:', window.location.origin + '/onboarding.html');

        return true;
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific Firebase errors
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many verification emails sent. Please wait a few minutes before requesting another one.');
        } else if (error.code === 'auth/user-disabled') {
            throw new Error('Your account has been disabled. Please contact support.');
        } else if (error.code === 'auth/user-not-found') {
            throw new Error('User account not found. Please try logging in again.');
        } else if (error.code === 'auth/invalid-continue-uri') {
            console.error('Invalid continue URI. Trying with simpler configuration...');
            // Try again with simpler config (no custom URL)
            try {
                await targetUser.sendEmailVerification();
                console.log('✅ Verification email sent with default configuration');
                return true;
            } catch (retryError) {
                console.error('❌ Retry also failed:', retryError);
                throw new Error(`Failed to send verification email: ${retryError.message}`);
            }
        } else {
            throw new Error(`Failed to send verification email: ${error.message}`);
        }
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

        // Handle rate limiting specifically
        if (error.message.includes('Too many verification emails')) {
            displayError('Too many requests detected. Please wait 5-10 minutes before trying again. In the meantime, check your email inbox and spam folder - the verification email may have already been sent.');
            // Set a longer cooldown for rate limiting
            startResendCooldown(300); // 5 minutes

            // Show additional help
            showRateLimitHelp();
        } else {
            displayError(error.message || 'Failed to send verification email. Please try again later.');
            // Start normal cooldown even on error to prevent spam
            startResendCooldown(120); // 2 minutes
        }

        // Re-enable button
        const resendButton = document.getElementById('resend-button');
        if (resendButton) {
            resendButton.disabled = false;
            resendButton.textContent = 'Resend Verification Email';
        }
    }
}

// Start cooldown timer for resend button
function startResendCooldown(seconds = 60) {
    resendCooldown = seconds;
    const resendButton = document.getElementById('resend-button');
    const countdownText = document.getElementById('countdown-text');
    const countdownSpan = document.getElementById('countdown');

    if (resendButton) {
        resendButton.style.display = 'none';
    }

    if (countdownText) {
        countdownText.style.display = 'block';
    }

    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
        resendCooldown--;

        if (countdownSpan) {
            // Show minutes and seconds for longer cooldowns
            if (resendCooldown >= 60) {
                const minutes = Math.floor(resendCooldown / 60);
                const remainingSeconds = resendCooldown % 60;
                countdownSpan.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            } else {
                countdownSpan.textContent = resendCooldown;
            }
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

// Show additional help when rate limited
function showRateLimitHelp() {
    // Create or update help message
    let helpElement = document.getElementById('rate-limit-help');
    if (!helpElement) {
        helpElement = document.createElement('div');
        helpElement.id = 'rate-limit-help';
        helpElement.style.cssText = `
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 0.9rem;
            line-height: 1.4;
        `;

        // Insert after error message
        const errorElement = document.getElementById('error-message');
        if (errorElement && errorElement.parentNode) {
            errorElement.parentNode.insertBefore(helpElement, errorElement.nextSibling);
        }
    }

    helpElement.innerHTML = `
        <strong>🔄 What you can do now:</strong>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>Check your email inbox and spam folder thoroughly</li>
            <li>Wait 5-10 minutes before requesting another email</li>
            <li>Try logging out and back in to refresh your session</li>
            <li>Contact support if you continue having issues</li>
        </ul>
    `;

    helpElement.style.display = 'block';
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
