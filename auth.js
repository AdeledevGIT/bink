// Ensure Firebase config is loaded and auth is available
if (typeof auth === 'undefined' || auth === null) {
    console.error("Firebase Auth is not initialized. Make sure firebase-config.js is loaded correctly and SDKs are included.");
}

// --- Login Page Logic ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError('error-message'); // Clear previous errors
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const loginButton = document.getElementById('login-button');

        loginButton.disabled = true;
        loginButton.textContent = 'Logging In...';

        console.log('Attempting login with:', email);

        // --- Firebase Login ---
        if (auth) {
             auth.signInWithEmailAndPassword(email, password)
                .then(async (userCredential) => {
                    // Signed in
                    const user = userCredential.user;
                    console.log('Login successful:', user.uid);

                    // Reload user to get latest verification status
                    await user.reload();

                    // Check email verification first
                    if (!user.emailVerified) {
                        console.log('Email not verified, redirecting to verification page');
                        window.location.href = 'verify-email.html';
                        return;
                    }

                    // Check if user has completed onboarding
                    try {
                        const userDoc = await db.collection('users').doc(user.uid).get();

                        // Update email verification status in database if needed
                        if (userDoc.exists && !userDoc.data().emailVerified) {
                            await db.collection('users').doc(user.uid).update({
                                emailVerified: true,
                                emailVerifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }

                        if (userDoc.exists && userDoc.data().onboardingCompleted) {
                            window.location.href = 'dashboard.html';
                        } else {
                            window.location.href = 'onboarding.html';
                        }
                    } catch (error) {
                        console.error('Error checking onboarding status:', error);
                        window.location.href = 'dashboard.html'; // Fallback to dashboard
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error('Login failed:', errorCode, errorMessage);
                    displayError('error-message', `Login failed: ${errorMessage}`);
                    loginButton.disabled = false;
                    loginButton.textContent = 'Log In';
                });
        } else {
             displayError('error-message', 'Firebase Auth not available.');
             loginButton.disabled = false;
             loginButton.textContent = 'Log In';
        }
    });
}

// --- Forgot Password Logic ---
const forgotPasswordLink = document.getElementById('forgot-password-link');
if (forgotPasswordLink && loginForm) { // Check if on login page
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearError('error-message'); // Clear previous errors

        const emailInput = loginForm.email; // Reuse the email input from login form
        const email = emailInput.value;

        if (!email) {
            displayError('error-message', 'Please enter your email address first.');
            emailInput.focus();
            return;
        }

        if (auth) {
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    // Password reset email sent.
                    console.log('Password reset email sent to:', email);
                    // Display a success message (using the error display for simplicity, maybe add a success class later)
                    displayError('error-message', `Password reset instructions sent to ${email}. Check your inbox.`);
                    // Optionally clear the form or disable button after success
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error('Password reset failed:', errorCode, errorMessage);
                    displayError('error-message', `Password reset failed: ${errorMessage}`);
                });
        } else {
            displayError('error-message', 'Firebase Auth not available.');
        }
    });
}


// --- Signup Page Logic ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError('error-message');
        const username = signupForm.username.value.toLowerCase(); // Store lowercase
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        const confirmPassword = signupForm['confirm-password'].value;
        const signupButton = document.getElementById('signup-button');

        if (password !== confirmPassword) {
            displayError('error-message', 'Passwords do not match.');
            return;
        }
         if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            displayError('error-message', 'Username must be 3+ characters (letters, numbers, _).');
            return;
        }

        signupButton.disabled = true;
        signupButton.textContent = 'Signing Up...';

        console.log('Attempting signup for:', email, 'with username:', username);

        // --- Firebase Signup ---
        // Step 1: Check if username is already taken (Requires Firestore read)
        if (auth && db) {
            const usersRef = db.collection('users');
            usersRef.where('username', '==', username).get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        // Username already exists
                        displayError('error-message', 'Username is already taken. Please choose another.');
                        signupButton.disabled = false;
                        signupButton.textContent = 'Sign Up';
                    } else {
                        // Step 2: Username is available, create the user in Auth
                        auth.createUserWithEmailAndPassword(email, password)
                            .then((userCredential) => {
                                // Signed in
                                const user = userCredential.user;
                                console.log('Signup successful:', user.uid);

                                // Step 3: Create user document in Firestore
                                const userDocRef = db.collection('users').doc(user.uid);
                                userDocRef.set({
                                    username: username,
                                    email: user.email,
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    subscriptionTier: 'free', // Default tier
                                    uniqueLinkSlug: username, // Use username as initial slug
                                    onboardingCompleted: false, // New users need to complete onboarding
                                    emailVerified: false, // Email verification required
                                    emailVerifiedAt: null, // Will be set when verified
                                    // Add other default fields if needed
                                })
                                .then(async () => {
                                    console.log("User document created in Firestore");

                                    // Step 4: Send email verification
                                    try {
                                        // Use default Firebase email verification (no custom continue URL)
                                        await user.sendEmailVerification();
                                        console.log("Verification email sent");

                                        // Redirect to email verification page
                                        window.location.href = 'verify-email.html';
                                    } catch (emailError) {
                                        console.error("Error sending verification email:", emailError);

                                        // Handle specific errors during signup
                                        if (emailError.code === 'auth/too-many-requests') {
                                            sessionStorage.setItem('signupRateLimited', 'true');
                                        } else if (emailError.code === 'auth/invalid-continue-uri') {
                                            sessionStorage.setItem('signupContinueUriError', 'true');
                                        }

                                        // Always redirect to verification page, user can resend or wait
                                        window.location.href = 'verify-email.html';
                                    }
                                })
                                .catch((error) => {
                                    console.error("Error creating user document: ", error);
                                    // Handle this error - maybe delete the auth user or prompt user
                                    displayError('error-message', `Account created, but failed to save profile: ${error.message}`);
                                    signupButton.disabled = false;
                                    signupButton.textContent = 'Sign Up';
                                });
                            })
                            .catch((error) => {
                                const errorCode = error.code;
                                const errorMessage = error.message;
                                console.error('Signup failed:', errorCode, errorMessage);
                                displayError('error-message', `Signup failed: ${errorMessage}`);
                                signupButton.disabled = false;
                                signupButton.textContent = 'Sign Up';
                            });
                    }
                })
                .catch((error) => {
                     console.error("Error checking username: ", error);
                     displayError('error-message', `Error checking username: ${error.message}`);
                     signupButton.disabled = false;
                     signupButton.textContent = 'Sign Up';
                });

        } else {
            displayError('error-message', 'Firebase Auth or Firestore not available.');
            signupButton.disabled = false;
            signupButton.textContent = 'Sign Up';
        }
    });
}

// --- Auth State Listener with Subscription Checking ---
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User authenticated:', user.uid);

            // Start periodic subscription checking if premium enforcement is available
            if (window.PremiumEnforcement && typeof window.PremiumEnforcement.startPeriodicSubscriptionCheck === 'function') {
                // Small delay to ensure other scripts are loaded
                setTimeout(() => {
                    window.PremiumEnforcement.startPeriodicSubscriptionCheck(user.uid);
                }, 1000);
            }

            // Check subscription status immediately on auth
            if (db && window.PremiumEnforcement) {
                db.collection('users').doc(user.uid).get()
                    .then(doc => {
                        if (doc.exists) {
                            const userData = doc.data();

                            // Check if subscription has expired and auto-downgrade
                            window.PremiumEnforcement.checkPremiumStatus(userData, user.uid);
                        }
                    })
                    .catch(error => {
                        console.error("Error checking user subscription on auth:", error);
                    });
            }
        } else {
            console.log('User not authenticated');
        }
    });
}