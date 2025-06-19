// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    alert("Error: Firebase not loaded. Please try refreshing.");
    // Redirect to login if critical components are missing
    // window.location.href = 'login.html';
}

// Storage is already initialized in firebase-config.js
// We'll use the global storage variable

const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username');
const usernameDisplay = document.getElementById('username-display');
const displayNameInput = document.getElementById('displayName');
const bioInput = document.getElementById('bio');
const profilePicUrlInput = document.getElementById('profilePicUrl');
const profilePicPreview = document.getElementById('profilePicPreview');
const profilePicImage = document.getElementById('profilePicImage');
const profilePicUpload = document.getElementById('profilePicUpload');
const saveButton = document.getElementById('save-profile-button');
const logoutButton = document.getElementById('logout-button'); // Logout button on profile page
const profileMessage = document.getElementById('profile-message');
const profileError = document.getElementById('profile-error');

let currentUser = null;
let currentUserData = null;

// Function to display messages
function showProfileMessage(message, isError = false) {
    const element = isError ? profileError : profileMessage;
    const otherElement = isError ? profileMessage : profileError;
    element.textContent = message;
    element.style.display = 'block';
    otherElement.style.display = 'none'; // Hide the other message type
}

// Function to clear messages
function clearProfileMessages() {
    profileMessage.style.display = 'none';
    profileError.style.display = 'none';
}

// Load profile data when user is authenticated
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('User authenticated for profile page:', user.uid);
            loadUserProfile(user.uid);
        } else {
            // User is signed out. Redirect to login.
            console.log('User is signed out. Redirecting to login.');
            window.location.href = 'login.html';
        }
    });
} else {
     console.error("Cannot check auth state because Firebase Auth is not loaded.");
     showProfileMessage("Error loading user status.", true);
}

// Function to load user profile data from Firestore
function loadUserProfile(userId) {
    const userDocRef = db.collection('users').doc(userId);
    userDocRef.get().then((doc) => {
        if (doc.exists) {
            currentUserData = doc.data();
            console.log("Loaded user data:", currentUserData);

            // Check if user has completed onboarding
            if (!currentUserData.onboardingCompleted) {
                window.location.href = 'onboarding.html';
                return;
            }

            // Populate the form
            usernameInput.value = currentUserData.username || '';
            usernameDisplay.textContent = currentUserData.username || '...';
            displayNameInput.value = currentUserData.displayName || '';
            bioInput.value = currentUserData.bio || '';
            profilePicUrlInput.value = currentUserData.profilePicUrl || '';

            // Set profile picture if available
            if (currentUserData.profilePicUrl) {
                profilePicImage.src = currentUserData.profilePicUrl;
            } else {
                profilePicImage.src = 'profile.png';
            }

            // Populate other fields if added
        } else {
            console.log("No such user document!");
            showProfileMessage("Could not load profile data.", true);
        }
    }).catch((error) => {
        console.error("Error getting user document:", error);
        showProfileMessage(`Error loading profile: ${error.message}`, true);
    });
}

// Handle profile picture click to trigger file upload
if (profilePicPreview) {
    profilePicPreview.addEventListener('click', () => {
        profilePicUpload.click();
    });
}

// Handle file selection for profile picture
if (profilePicUpload) {
    profilePicUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleProfilePicUpload(file);
        }
    });
}

// Function to handle profile picture upload
function handleProfilePicUpload(file) {
    if (!file) return;
    if (!currentUser) {
        showProfileMessage("Not authenticated. Cannot upload image.", true);
        return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
        showProfileMessage("Please select an image file", true);
        return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showProfileMessage("Image file size must be less than 5MB", true);
        return;
    }

    // Show loading state
    profilePicImage.src = 'profile.png';
    saveButton.disabled = true;

    // If Firebase Storage is not available, show error
    if (!storage) {
        showProfileMessage("Image upload is not available. Storage not initialized.", true);
        profilePicImage.src = currentUserData?.profilePicUrl || 'profile.png';
        saveButton.disabled = false;
        return;
    }

    // Create a storage reference
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`profile-pics/${currentUser.uid}/${Date.now()}_${file.name}`);

    // Upload the file
    fileRef.put(file)
        .then(snapshot => {
            console.log('Uploaded profile picture:', snapshot);
            return fileRef.getDownloadURL();
        })
        .then(downloadURL => {
            console.log('Profile picture URL:', downloadURL);
            profilePicUrlInput.value = downloadURL;
            profilePicImage.src = downloadURL;
            showProfileMessage("Profile picture uploaded successfully! Click 'Save Profile' to update your profile.");
            saveButton.disabled = false;
        })
        .catch(error => {
            console.error('Error uploading profile picture:', error);
            profilePicImage.src = currentUserData?.profilePicUrl || 'profile.png';
            showProfileMessage(`Error uploading image: ${error.message}`, true);
            saveButton.disabled = false;
        });
}

// Handle profile form submission
if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearProfileMessages();
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        if (!currentUser) {
            showProfileMessage("Not authenticated. Cannot save.", true);
            saveButton.disabled = false;
            saveButton.textContent = 'Save Profile';
            return;
        }

        const updatedData = {
            displayName: displayNameInput.value.trim(),
            bio: bioInput.value.trim(),
            profilePicUrl: profilePicUrlInput.value.trim(),
            // Add other fields here
            updatedAt: firebase.firestore.FieldValue.serverTimestamp() // Track updates
        };

        // Update Firestore document
        const userDocRef = db.collection('users').doc(currentUser.uid);
        userDocRef.update(updatedData)
            .then(() => {
                console.log("Profile updated successfully!");
                showProfileMessage("Profile saved successfully!");
                saveButton.disabled = false;
                saveButton.textContent = 'Save Profile';
                // Optionally update currentUserData locally if needed elsewhere on the page
                currentUserData = { ...currentUserData, ...updatedData };
            })
            .catch((error) => {
                console.error("Error updating profile: ", error);
                showProfileMessage(`Error saving profile: ${error.message}`, true);
                saveButton.disabled = false;
                saveButton.textContent = 'Save Profile';
            });
    });
}

// Logout Button Logic (copied from dashboard.js for consistency)
if (logoutButton && auth) {
    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out successfully from profile page.');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error:', error);
            showProfileMessage(`Failed to log out: ${error.message}`, true);
        });
    });
} else if (logoutButton) {
    logoutButton.style.display = 'none'; // Hide logout if auth isn't loaded
}