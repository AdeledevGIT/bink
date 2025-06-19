// BINK Contact Support JavaScript
// This file handles the functionality for the contact support page

// DOM Elements
const supportForm = document.getElementById('support-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const subjectInput = document.getElementById('subject');
const categorySelect = document.getElementById('category');
const messageInput = document.getElementById('message');
const startChatBtn = document.getElementById('start-chat-btn');
const welcomeMessage = document.getElementById('welcome-message');

// Global variables
let currentUser = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', initContactPage);

// Initialize the contact page
async function initContactPage() {
    try {
        // Check if user is logged in (optional for contact page)
        checkAuth(false);

        // Set up event listeners
        setupEventListeners();

        // Check URL parameters for pre-filled form
        checkUrlParameters();

    } catch (error) {
        console.error('Error initializing contact page:', error);
    }
}

// Check authentication status
function checkAuth(requireAuth = false) {
    return new Promise((resolve, reject) => {
        // Check if Firebase is defined
        if (typeof firebase === 'undefined') {
            console.log('Firebase not loaded or not available');
            if (requireAuth) {
                window.location.href = 'login.html';
                reject('Firebase not available');
            } else {
                resolve(null);
            }
            return;
        }

        // Check authentication state
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                currentUser = user;
                if (welcomeMessage) {
                    db.collection('users').doc(user.uid).get()
                        .then((doc) => {
                            if (doc.exists) {
                                const userData = doc.data();
                                welcomeMessage.textContent = `Welcome, ${userData.displayName || userData.username || 'User'}!`;

                                // Pre-fill form with user data if available
                                if (nameInput && !nameInput.value) {
                                    nameInput.value = userData.displayName || userData.username || '';
                                }

                                if (emailInput && !emailInput.value) {
                                    emailInput.value = userData.email || '';
                                }
                            }
                        })
                        .catch((error) => {
                            console.error('Error getting user data:', error);
                        });
                }
                resolve(user);
            } else {
                // No user is signed in
                currentUser = null;
                if (welcomeMessage) {
                    welcomeMessage.textContent = 'Welcome!';
                }
                if (requireAuth) {
                    window.location.href = 'login.html';
                    reject('User not authenticated');
                } else {
                    resolve(null);
                }
            }
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Set up form submission backup to Firebase
    setupFormSubmission();

    // Live chat button
    if (startChatBtn) {
        startChatBtn.addEventListener('click', handleChatButtonClick);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('.smooth-scroll').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Scroll to the target element
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Focus on the first input field after scrolling
                setTimeout(() => {
                    const firstInput = targetElement.querySelector('input, textarea');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 800);
            }
        });
    });
}

// Set up form for direct submission
function setupFormSubmission() {
    if (supportForm) {
        // Store message in Firebase for backup when form is submitted
        supportForm.addEventListener('submit', function() {
            // Get form values
            const name = nameInput.value;
            const email = emailInput.value;
            const subject = subjectInput.value;
            const category = categorySelect.value;
            const message = messageInput.value;

            // Store in Firebase if available
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                db.collection('supportMessages').add({
                    name,
                    email,
                    subject,
                    category,
                    message,
                    timestamp: new Date().toISOString()
                }).then(() => {
                    console.log('Support message stored in Firebase');
                }).catch(error => {
                    console.error('Error storing message in Firebase:', error);
                    // Continue with form submission even if Firebase storage fails
                });
            }

            // FormSubmit.co will handle the actual form submission
            // No need to prevent default or handle the email sending ourselves
        });
    }
}

// Handle chat button click
function handleChatButtonClick(e) {
    e.preventDefault();
    alert('Live chat is coming soon! For now, please email us at binksuppot@gmail.com');
}

// Check URL parameters for pre-filled form
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const subject = urlParams.get('subject');
    const message = urlParams.get('message');

    // Pre-fill form fields if parameters exist
    if (email && emailInput) {
        emailInput.value = email;
    }

    if (subject && subjectInput) {
        subjectInput.value = subject;
    }

    if (message && messageInput) {
        messageInput.value = message;
    }

    // If all parameters are present, focus on the message field
    if (email && subject && message) {
        if (messageInput) {
            messageInput.focus();
        }
    }
}

// Function to open contact form with pre-filled data
// This can be called from other pages
function openContactForm(email, subject, message) {
    // If we're already on the contact-support page
    if (window.location.pathname.includes('contact-support.html')) {
        // Pre-fill the form fields
        if (email && emailInput) emailInput.value = email;
        if (subject && subjectInput) subjectInput.value = subject;
        if (message && messageInput) messageInput.value = message;

        // Scroll to the form
        const formContainer = document.getElementById('contact-form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Focus on the first empty input field
            setTimeout(() => {
                if (!nameInput.value) {
                    nameInput.focus();
                } else if (!emailInput.value) {
                    emailInput.focus();
                } else if (!subjectInput.value) {
                    subjectInput.focus();
                } else if (!messageInput.value) {
                    messageInput.focus();
                } else {
                    messageInput.focus();
                }
            }, 800);
        }
    } else {
        // Navigate to the contact-support page with query parameters
        const url = `contact-support.html?email=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
        window.location.href = url;
    }
}

// Make the function available globally
window.openContactForm = openContactForm;
