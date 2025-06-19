// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    alert("Error: Firebase not loaded. Please try refreshing.");
}

// DOM Elements
const lifetimePromoToggle = document.getElementById('lifetime-promo-toggle');
const lifetimePromoType = document.getElementById('lifetime-promo-type');
const lifetimePromoMessage = document.getElementById('lifetime-promo-message');
const lifetimePromoDescription = document.getElementById('lifetime-promo-description');
const lifetimePromoDurationType = document.getElementById('lifetime-promo-duration-type');
const lifetimePromoDays = document.getElementById('lifetime-promo-days');
const lifetimePromoEndDate = document.getElementById('lifetime-promo-end-date');
const daysDurationContainer = document.getElementById('days-duration-container');
const dateDurationContainer = document.getElementById('date-duration-container');
const lifetimePromoColor = document.getElementById('lifetime-promo-color');
const colorHex = document.getElementById('color-hex');
const colorPreview = document.getElementById('color-preview');
const previewBadge = document.getElementById('preview-badge');
const previewDescription = document.getElementById('preview-description');
const saveButton = document.getElementById('save-promotions');
const logoutButton = document.getElementById('logout-button');
const logoutLink = document.getElementById('logoutLink');

// Global variables
let currentUser = null;
let currentUserData = null;
let isAdmin = false;

// Check authentication state
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('User authenticated:', user.uid);
            checkAdminStatus(user.uid);
        } else {
            console.log('User is signed out. Redirecting to login.');
            window.location.href = 'login.html';
        }
    });
} else {
    console.error("Cannot check auth state because Firebase Auth is not loaded.");
    alert("Error loading user status.");
}

// Check if user is admin
function checkAdminStatus(userId) {
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                currentUserData = doc.data();
                isAdmin = currentUserData.isAdmin || false;

                if (isAdmin) {
                    console.log('Admin user confirmed');
                    loadPromotionSettings();
                    updateUserInfo();
                } else {
                    console.log('Not an admin user. Redirecting to dashboard.');
                    window.location.href = 'dashboard.html';
                }
            } else {
                console.log('User document not found. Redirecting to login.');
                window.location.href = 'login.html';
            }
        })
        .catch((error) => {
            console.error('Error checking admin status:', error);
            alert('Error checking admin status. Please try again.');
        });
}

// Update user info in sidebar
function updateUserInfo() {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');

    if (userName && currentUserData) {
        userName.textContent = currentUserData.username || currentUser.email.split('@')[0];
    }

    if (userEmail && currentUser) {
        userEmail.textContent = currentUser.email;
    }

    if (userAvatar && currentUserData && currentUserData.profilePicUrl) {
        userAvatar.innerHTML = `<img src="${currentUserData.profilePicUrl}" alt="Profile">`;
    }
}

// Load promotion settings
function loadPromotionSettings() {
    db.collection('settings').doc('promotions').get()
        .then((doc) => {
            if (doc.exists) {
                const promoData = doc.data();

                // Update form fields
                lifetimePromoToggle.checked = promoData.lifetimePromoEnabled || false;
                lifetimePromoType.value = promoData.lifetimePromoType || 'limited';
                lifetimePromoMessage.value = promoData.lifetimePromoMessage || 'Limited Time Offer';
                lifetimePromoDescription.value = promoData.lifetimePromoDescription || 'Special launch price - Get lifetime access!';
                lifetimePromoColor.value = promoData.lifetimePromoColor || '#FF6B6B';

                // Set duration type
                lifetimePromoDurationType.value = promoData.lifetimePromoDurationType || 'days';

                // Handle duration based on type
                if (promoData.lifetimePromoDurationType === 'date' && promoData.lifetimePromoEndDate) {
                    // Convert timestamp to date string
                    let endDate;
                    if (promoData.lifetimePromoEndDate instanceof firebase.firestore.Timestamp) {
                        endDate = promoData.lifetimePromoEndDate.toDate();
                    } else if (promoData.lifetimePromoEndDate.seconds) {
                        endDate = new Date(promoData.lifetimePromoEndDate.seconds * 1000);
                    } else {
                        endDate = new Date();
                    }

                    // Format date as YYYY-MM-DD for input
                    const year = endDate.getFullYear();
                    const month = String(endDate.getMonth() + 1).padStart(2, '0');
                    const day = String(endDate.getDate()).padStart(2, '0');
                    lifetimePromoEndDate.value = `${year}-${month}-${day}`;

                    // Show date container, hide days container
                    daysDurationContainer.style.display = 'none';
                    dateDurationContainer.style.display = 'block';
                } else if (promoData.lifetimePromoDurationType === 'days') {
                    lifetimePromoDays.value = promoData.lifetimePromoDays || 30;

                    // Show days container, hide date container
                    daysDurationContainer.style.display = 'flex';
                    dateDurationContainer.style.display = 'none';
                } else {
                    // Unlimited duration
                    daysDurationContainer.style.display = 'none';
                    dateDurationContainer.style.display = 'none';
                }

                // Update preview
                updatePreview();
            } else {
                console.log('No promotion settings found. Creating default settings.');
                createDefaultPromotionSettings();
            }
        })
        .catch((error) => {
            console.error('Error loading promotion settings:', error);
            alert('Error loading promotion settings. Please try again.');
        });
}

// Create default promotion settings
function createDefaultPromotionSettings() {
    // Calculate end date 30 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    db.collection('settings').doc('promotions').set({
        lifetimePromoEnabled: true,
        lifetimePromoType: 'limited',
        lifetimePromoMessage: 'Limited Time Offer',
        lifetimePromoDescription: 'Special launch price - Get lifetime access!',
        lifetimePromoColor: '#FF6B6B',
        lifetimePromoDurationType: 'days',
        lifetimePromoDays: 30,
        lifetimePromoEndDate: firebase.firestore.Timestamp.fromDate(endDate),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Default promotion settings created');
        loadPromotionSettings();
    })
    .catch((error) => {
        console.error('Error creating default promotion settings:', error);
        alert('Error creating default settings. Please try again.');
    });
}

// Update preview
function updatePreview() {
    const message = lifetimePromoMessage.value || 'Limited Time Offer';
    const description = lifetimePromoDescription.value || 'Special launch price - Get lifetime access!';
    const color = lifetimePromoColor.value || '#FF6B6B';
    const durationType = lifetimePromoDurationType.value || 'days';

    // Update badge text with duration if applicable
    let badgeText = message;

    if (durationType === 'days') {
        const days = lifetimePromoDays.value || 30;
        if (days > 0) {
            badgeText = `${message} (${days} days)`;
        }
    } else if (durationType === 'date') {
        const endDateValue = lifetimePromoEndDate.value;
        if (endDateValue) {
            const endDate = new Date(endDateValue);
            const today = new Date();
            const diffTime = Math.abs(endDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                const formattedDate = endDate.toLocaleDateString();
                badgeText = `${message} (Until ${formattedDate})`;
            }
        }
    }

    previewBadge.textContent = badgeText;
    previewBadge.style.backgroundColor = color;
    previewDescription.textContent = description;

    colorHex.textContent = color;
    colorPreview.style.backgroundColor = color;
}

// Save promotion settings
function savePromotionSettings() {
    if (!isAdmin) {
        alert('You do not have permission to save promotion settings.');
        return;
    }

    // Disable save button
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    // Get form values
    const enabled = lifetimePromoToggle.checked;
    const type = lifetimePromoType.value;
    const message = lifetimePromoMessage.value;
    const description = lifetimePromoDescription.value;
    const durationType = lifetimePromoDurationType.value;
    const days = parseInt(lifetimePromoDays.value) || 30;
    const color = lifetimePromoColor.value;

    // Prepare data object
    const promoData = {
        lifetimePromoEnabled: enabled,
        lifetimePromoType: type,
        lifetimePromoMessage: message,
        lifetimePromoDescription: description,
        lifetimePromoDurationType: durationType,
        lifetimePromoColor: color,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add duration-specific fields
    if (durationType === 'days') {
        promoData.lifetimePromoDays = days;

        // Calculate end date based on days
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        promoData.lifetimePromoEndDate = firebase.firestore.Timestamp.fromDate(endDate);
    } else if (durationType === 'date') {
        const endDateValue = lifetimePromoEndDate.value;
        if (endDateValue) {
            const endDate = new Date(endDateValue);
            promoData.lifetimePromoEndDate = firebase.firestore.Timestamp.fromDate(endDate);
        }
    }

    // Save to Firestore
    db.collection('settings').doc('promotions').set(promoData, { merge: true })
    .then(() => {
        console.log('Promotion settings saved');

        // Also ensure the lifetime plan is enabled in platform settings
        return db.collection('settings').doc('platform').set({
            lifetimePlanEnabled: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    })
    .then(() => {
        alert('Promotion settings saved successfully!');

        // Re-enable save button
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    })
    .catch((error) => {
        console.error('Error saving promotion settings:', error);
        alert('Error saving promotion settings. Please try again.');

        // Re-enable save button
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    });
}

// Event Listeners
if (lifetimePromoType) {
    lifetimePromoType.addEventListener('change', updatePreview);
}

if (lifetimePromoMessage) {
    lifetimePromoMessage.addEventListener('input', updatePreview);
}

if (lifetimePromoDescription) {
    lifetimePromoDescription.addEventListener('input', updatePreview);
}

if (lifetimePromoDurationType) {
    lifetimePromoDurationType.addEventListener('change', function() {
        const durationType = this.value;

        if (durationType === 'days') {
            daysDurationContainer.style.display = 'flex';
            dateDurationContainer.style.display = 'none';
        } else if (durationType === 'date') {
            daysDurationContainer.style.display = 'none';
            dateDurationContainer.style.display = 'block';

            // Set default date to 30 days from now if not already set
            if (!lifetimePromoEndDate.value) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);
                const year = endDate.getFullYear();
                const month = String(endDate.getMonth() + 1).padStart(2, '0');
                const day = String(endDate.getDate()).padStart(2, '0');
                lifetimePromoEndDate.value = `${year}-${month}-${day}`;
            }
        } else {
            // Unlimited
            daysDurationContainer.style.display = 'none';
            dateDurationContainer.style.display = 'none';
        }

        updatePreview();
    });
}

if (lifetimePromoDays) {
    lifetimePromoDays.addEventListener('input', updatePreview);
}

if (lifetimePromoEndDate) {
    lifetimePromoEndDate.addEventListener('input', updatePreview);
}

if (lifetimePromoColor) {
    lifetimePromoColor.addEventListener('input', updatePreview);
}

if (saveButton) {
    saveButton.addEventListener('click', savePromotionSettings);
}

// Logout Button Logic
if (logoutButton && auth) {
    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out successfully.');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error:', error);
            alert(`Failed to log out: ${error.message}`);
        });
    });
}

if (logoutLink && auth) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            console.log('User signed out successfully.');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error:', error);
            alert(`Failed to log out: ${error.message}`);
        });
    });
}
