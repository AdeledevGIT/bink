// Onboarding JavaScript
let currentUser = null;
let currentUserData = null;
let currentStep = 1;
const totalSteps = 6;

// Template selection
let selectedTemplate = null;

// DOM Elements
const progressFill = document.getElementById('progressFill');
const steps = document.querySelectorAll('.step');
const stepContents = document.querySelectorAll('.step-content');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const skipButton = document.getElementById('skip-button');
const skipAllButton = document.getElementById('skip-all-button');
const finishButton = document.getElementById('finish-button');
const profileForm = document.getElementById('profile-form');
const profilePicPreview = document.getElementById('profilePicPreview');
const profilePicUpload = document.getElementById('profilePicUpload');
const profilePicImage = document.getElementById('profilePicImage');
const displayName = document.getElementById('displayName');
const bio = document.getElementById('bio');
const bioCharCount = document.getElementById('bio-char-count');
const usernameDisplay = document.getElementById('username-display');
const addLinkButton = document.getElementById('add-link-button');
const linksContainer = document.getElementById('links-container');
const socialLinksForm = document.getElementById('social-links-form');
const mediaToggleBtn = document.getElementById('media-toggle-btn');
const catalogToggleBtn = document.getElementById('catalog-toggle-btn');
const mediaContentSection = document.getElementById('media-content-section');
const catalogContentSection = document.getElementById('catalog-content-section');
const mediaTypeBtns = document.querySelectorAll('.media-type-btn');
const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const templatesContainer = document.getElementById('templates-container');
const bioPreviewFrame = document.getElementById('bio-preview-frame');
const publishBtn = document.getElementById('publish-btn');
const linkModal = document.getElementById('linkModal');
const closeModal = document.querySelector('.close-modal');
const cancelLinkButton = document.getElementById('cancel-link-button');
const linkForm = document.getElementById('linkForm');

// User data storage
let userLinks = [];
let userSocialLinks = {};
let userMedia = {};

// State
let userData = {
    profile: {},
    links: [],
    media: {},
    catalog: {},
    template: null
};

// Social media platforms for the form
const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram' },
    { id: 'twitter', name: 'X (Twitter)', icon: 'fab fa-x-twitter' },
    { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook' },
    { id: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' },
    { id: 'tiktok', name: 'TikTok', icon: 'fab fa-tiktok' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin' },
    { id: 'github', name: 'GitHub', icon: 'fab fa-github' },
    { id: 'website', name: 'Website', icon: 'fas fa-globe' }
];

// Mobile-friendly initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeOnboarding();
    setupMobileEnhancements();
});

// Check authentication and initialize
function initializeOnboarding() {
    if (!auth) {
        console.error('Firebase Auth not initialized');
        window.location.href = 'login.html';
        return;
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData();
        } else {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'login.html';
        }
    });
}

// Load user data
async function loadUserData() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            
            // Check if user has already completed onboarding
            if (currentUserData.onboardingCompleted) {
                window.location.href = 'dashboard.html';
                return;
            }
            
            // Populate form with existing data
            if (usernameDisplay) {
                usernameDisplay.textContent = currentUserData.username || 'username';
            }

            // Update welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome to BINK, ${currentUserData.username}!`;
            }
            
            if (currentUserData.displayName && displayName) {
                displayName.value = currentUserData.displayName;
            }
            
            if (currentUserData.bio && bio) {
                bio.value = currentUserData.bio;
                updateCharCount();
            }
            
            if (currentUserData.profilePicUrl && profilePicImage) {
                profilePicImage.src = currentUserData.profilePicUrl;
                profilePicImage.style.display = 'block';
                // Set the hidden input field
                const profilePicUrl = document.getElementById('profilePicUrl');
                if (profilePicUrl) {
                    profilePicUrl.value = currentUserData.profilePicUrl;
                }
                if (profilePicInitials) {
                    profilePicInitials.style.display = 'none';
                }
            } else {
                // Show "Add Profile Picture" text when no profile picture is set
                if (profilePicImage) {
                    profilePicImage.style.display = 'none';
                }
                if (profilePicInitials) {
                    profilePicInitials.textContent = 'Add Profile Picture';
                    profilePicInitials.style.display = 'flex';
                }
            }
            
            // Load selected template if it exists
            if (currentUserData.template) {
                selectedTemplate = currentUserData.template;
            }
        }
        
        // Social links are now loaded directly from the user document
        // No need for separate collection loading
        
        setupEventListeners();
        generateSocialLinksForm();
        loadTemplates();
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Navigation buttons
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        
        if (nextBtn) nextBtn.addEventListener('click', goToNextStep);
        if (prevBtn) prevBtn.addEventListener('click', goToPreviousStep);

        // Profile form events
        const displayNameInput = document.getElementById('displayName');
        const bioTextarea = document.getElementById('bio');
        const profilePicUpload = document.getElementById('profilePicUpload');
        const profilePicPreview = document.getElementById('profilePicPreview');

        if (displayNameInput) {
            displayNameInput.addEventListener('input', handleDisplayNameChange);
            displayNameInput.addEventListener('blur', updateUsername);
        }

        if (bioTextarea) {
            bioTextarea.addEventListener('input', handleBioChange);
        }

        if (profilePicUpload) {
            profilePicUpload.addEventListener('change', handleProfilePicUpload);
        }

        if (profilePicPreview) {
            setupDragAndDrop();
        }

        // Mobile enhancements
        setupMobileEnhancements();

        // Publish and copy buttons
        if (publishBtn) publishBtn.addEventListener('click', completeOnboarding);
        
        const copyPreviewLinkBtn = document.getElementById('copy-preview-link');
        if (copyPreviewLinkBtn) copyPreviewLinkBtn.addEventListener('click', copyPreviewLink);

    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Custom Select Dropdown Functionality - REMOVED
// Now using standard HTML select element for better compatibility

// Enhanced Navigation functions
function goToNextStep() {
    if (currentStep < totalSteps) {
        // Validate current step before proceeding
        if (validateCurrentStep()) {
            // Show loading state
            showStepTransition();

            // Save current step data
            saveCurrentStepData().then(() => {
                currentStep++;
                updateStepDisplay();

                // Load step-specific content
                loadStepContent();

                // Show success feedback
                showStepSuccess();
            }).catch(error => {
                console.error('Error saving step data:', error);
                showError('Failed to save your progress. Please try again.');
            });
        }
    } else {
        // Complete onboarding
        completeOnboarding();
    }
}

function goToPreviousStep() {
    if (currentStep > 1) {
        showStepTransition();
        currentStep--;
        updateStepDisplay();
        loadStepContent();
    }
}

function skipCurrentStep() {
    if (currentStep < totalSteps) {
        showStepTransition();
        currentStep++;
        updateStepDisplay();
        loadStepContent();
    } else {
        completeOnboarding();
    }
}

function skipAllSteps() {
    // Show enhanced confirmation dialog
    if (confirm('⚠️ Skip entire setup?\n\nYou can always complete your profile later from your dashboard, but having a complete profile helps visitors connect with you better.\n\nAre you sure you want to skip?')) {
        completeOnboarding();
    }
}

function showStepTransition() {
    try {
        const container = document.querySelector('.step-content-container');
        if (container) {
            container.style.opacity = '0.7';
            container.style.transform = 'translateY(10px)';

            setTimeout(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 300);
        }
    } catch (error) {
        console.error('Error showing step transition:', error);
    }
}

function loadStepContent() {
    try {
        // Load step-specific content based on current step
        switch (currentStep) {
            case 2:
                loadLinksContent();
                break;
            case 3:
                loadSocialContent();
                break;
            case 4:
                // Lock media & catalog for free users
                const isPremiumUser = currentUserData?.isPremium || false;
                const isCreator = currentUserData?.isCreator || false;
                if (!isPremiumUser && !isCreator) {
                    document.getElementById('media-lock-overlay').style.display = 'flex';
                    document.getElementById('catalog-lock-overlay').style.display = 'flex';
                } else {
                    document.getElementById('media-lock-overlay').style.display = 'none';
                    document.getElementById('catalog-lock-overlay').style.display = 'none';
                loadMediaContent();
                }
                break;
            case 5:
                loadTemplates();
                break;
            case 6:
                loadPreview();
                break;
        }
    } catch (error) {
        console.error('Error loading step content:', error);
    }
}

function showStepSuccess() {
    try {
        // Show subtle success animation
        const activeStep = document.querySelector('.step.active');
        if (activeStep) {
            activeStep.style.transform = 'scale(1.1)';
            setTimeout(() => {
                activeStep.style.transform = 'scale(1.05)';
            }, 200);
        }
    } catch (error) {
        console.error('Error showing step success:', error);
    }
}

function updateStepDisplay() {
    try {
        // Update step content visibility
        stepContents.forEach((content, index) => {
            if (!content) return;

            if (index + 1 === currentStep) {
                content.classList.add('active');
                content.style.display = 'block';
            } else {
                content.classList.remove('active');
                content.style.display = 'none';
            }
        });

        // Update progress bar
        updateProgressBar();

        // Update step indicators
        updateStepIndicators();

        // Update navigation buttons
        updateNavigationButtons();

        // Update step counter in navigation
        updateStepCounter();

    } catch (error) {
        console.error('Error updating step display:', error);
    }
}

function updateProgressBar() {
    try {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            const progressPercentage = (currentStep / totalSteps) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        }
    } catch (error) {
        console.error('Error updating progress bar:', error);
    }
}

function updateStepIndicators() {
    try {
        steps.forEach((step, index) => {
            if (!step) return;

            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');

            if (stepNumber < currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === currentStep) {
                step.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error updating step indicators:', error);
    }
}

function updateNavigationButtons() {
    try {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) {
            if (currentStep > 1) {
                prevBtn.style.display = 'flex';
            } else {
                prevBtn.style.display = 'none';
            }
        }

        if (nextBtn) {
            if (currentStep === totalSteps) {
                nextBtn.innerHTML = `
                    <i class="fas fa-rocket"></i>
                    Complete Setup
                `;
            } else {
                nextBtn.innerHTML = `
                    Continue
                    <i class="fas fa-arrow-right"></i>
                `;
            }
        }
    } catch (error) {
        console.error('Error updating navigation buttons:', error);
    }
}

function updateStepCounter() {
    try {
        const stepNumberElement = document.getElementById('current-step-number');
        const navCenterInfo = document.getElementById('nav-center-info');

        if (stepNumberElement) {
            stepNumberElement.textContent = currentStep;
        }

        if (navCenterInfo) {
            if (currentStep > 1) {
                navCenterInfo.style.display = 'block';
            } else {
                navCenterInfo.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating step counter:', error);
    }
}

// Enhanced Validation functions
function validateCurrentStep() {
    switch (currentStep) {
        case 1: // Profile validation
            return validateProfileStep();
        case 2: // Links - optional but validate if any exist
            return validateLinksStep();
        case 3: // Social - optional but validate if any exist
            return validateSocialStep();
        case 4: // Media - optional
            return validateMediaStep();
        case 5: // Template - ensure one is selected
            return validateTemplateStep();
        case 6: // Preview - no validation needed
            return true;
        default:
            return true;
    }
}

function validateProfileStep() {
    try {
        const displayNameInput = document.getElementById('displayName');
        const bioInput = document.getElementById('bio');

        // Clear previous error states
        clearFieldError(displayNameInput);
        clearFieldError(bioInput);

        // Validate display name
        if (!displayNameInput.value.trim()) {
            showFieldError(displayNameInput, 'Display name is required to continue');
            displayNameInput.focus();
            return false;
        }

        if (displayNameInput.value.trim().length < 2) {
            showFieldError(displayNameInput, 'Display name must be at least 2 characters long');
            displayNameInput.focus();
            return false;
        }

        // Validate bio length if provided
        if (bioInput.value.length > 500) {
            showFieldError(bioInput, 'Bio must be 500 characters or less');
            bioInput.focus();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating profile step:', error);
        return false;
    }
}

function validateLinksStep() {
    // Links are optional, so always return true
    // Individual link validation happens in the modal
    return true;
}

function validateSocialStep() {
    // Social links are optional, so always return true
    return true;
}

function validateMediaStep() {
    // Media is optional, so always return true
    return true;
}

function validateTemplateStep() {
    try {
        if (!selectedTemplate) {
            showError('Please select a template to continue');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error validating template step:', error);
        return false;
    }
}

function showFieldError(field, message) {
    try {
        // Add error class to field
        field.classList.add('error');

        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = '#f87171';
        errorElement.style.fontSize = '0.75rem';
        errorElement.style.marginTop = '0.25rem';

        field.parentNode.appendChild(errorElement);

        // Shake animation
        field.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            field.style.animation = '';
        }, 500);

    } catch (error) {
        console.error('Error showing field error:', error);
    }
}

function clearFieldError(field) {
    try {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    } catch (error) {
        console.error('Error clearing field error:', error);
    }
}

// Save current step data
async function saveCurrentStepData() {
    try {
        switch (currentStep) {
            case 1: // Profile
                await saveProfileData();
                break;
            case 2: // Links
                // Links are saved individually when added
                break;
            case 3: // Social
                await saveSocialData();
                break;
            case 4: // Media
                // Media is saved individually when added
                break;
            case 5: // Template
                await saveTemplateSelection();
                break;
            case 6: // Preview
                // No data to save on preview step
                break;
        }
    } catch (error) {
        console.error('Error saving step data:', error);
    }
}

// Profile functions
async function saveProfileData() {
    const profileData = {
        displayName: displayName.value.trim(),
        bio: bio.value.trim(),
    };
    
    if (document.getElementById('profilePicUrl').value) {
        profileData.profilePicUrl = document.getElementById('profilePicUrl').value;
    }
    
    await db.collection('users').doc(currentUser.uid).update(profileData);
}

// Profile Handlers
function handleDisplayNameChange(event) {
    try {
        if (!event || !event.target) return;
        
        const name = event.target.value.trim();
        userData.profile.displayName = name;
        updateUsername();
    } catch (error) {
        console.error('Error handling display name change:', error);
    }
}

function handleBioChange(event) {
    try {
        if (!event || !event.target || !bioCharCount) return;

        const text = event.target.value;
        const charCount = text.length;
        const maxChars = 500;

        userData.profile.bio = text;
        bioCharCount.textContent = charCount;

        // Update character counter styling based on usage
        const counterContainer = bioCharCount.parentElement;
        counterContainer.classList.remove('warning', 'error');

        if (charCount > maxChars) {
            showFieldError(bioInput, 'Bio must be 500 characters or less');
            bioInput.focus();
            return false;
        } else if (charCount > maxChars * 0.8) {
            counterContainer.classList.add('warning');
            bioCharCount.style.color = '#fbbf24';
        } else {
            bioCharCount.style.color = 'var(--text-muted)';
        }

        // Update progress indicator
        const progressPercentage = (charCount / maxChars) * 100;
        updateCharCountProgress(progressPercentage);

    } catch (error) {
        console.error('Error handling bio change:', error);
    }
}

function updateCharCountProgress(percentage) {
    try {
        // Create or update progress bar for character count
        let progressBar = document.querySelector('.char-count-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'char-count-progress';
            progressBar.style.cssText = `
                width: 100%;
                height: 2px;
                background: var(--border-secondary);
                border-radius: var(--radius-full);
                margin-top: var(--space-xs);
                overflow: hidden;
            `;

            const progressFill = document.createElement('div');
            progressFill.className = 'char-count-fill';
            progressFill.style.cssText = `
                height: 100%;
                background: var(--accent-gradient);
                border-radius: var(--radius-full);
                transition: all var(--transition-normal);
                width: 0%;
            `;

            progressBar.appendChild(progressFill);

            const bioContainer = document.getElementById('bio').parentElement;
            bioContainer.appendChild(progressBar);
        }

        const progressFill = progressBar.querySelector('.char-count-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(percentage, 100)}%`;

            // Change color based on usage
            if (percentage > 100) {
                progressFill.style.background = '#f87171';
            } else if (percentage > 80) {
                progressFill.style.background = '#fbbf24';
            } else {
                progressFill.style.background = 'var(--accent-gradient)';
            }
        }
    } catch (error) {
        console.error('Error updating char count progress:', error);
    }
}

function handleProfilePicUpload(event) {
    try {
        if (!event || !event.target || !event.target.files || !event.target.files[0]) return;

        const file = event.target.files[0];
        processProfileImage(file);
    } catch (error) {
        console.error('Error handling profile picture upload:', error);
    }
}

function processProfileImage(file) {
    try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file (JPG, PNG, GIF, etc.)');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showError('Image file is too large. Please choose an image smaller than 5MB.');
            return;
        }

        // Show loading state
        showImageProcessing();

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Resize image if needed
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set maximum dimensions
                const maxWidth = 400;
                const maxHeight = 400;

                let { width, height } = img;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

                // Update UI
                updateProfileImage(compressedDataUrl);
                hideImageProcessing();
                showSuccess('Profile picture updated successfully!');
            };
            img.src = e.target.result;
        };

        reader.onerror = () => {
            hideImageProcessing();
            showError('Failed to read the image file. Please try again.');
        };

        reader.readAsDataURL(file);

    } catch (error) {
        console.error('Error processing profile image:', error);
        hideImageProcessing();
        showError('Failed to process the image. Please try again.');
    }
}

function updateProfileImage(dataUrl) {
    try {
        const profilePicImage = document.getElementById('profilePicImage');
        const profilePicUrl = document.getElementById('profilePicUrl');
        const profilePicPreview = document.getElementById('profilePicPreview');
        const profilePicInitials = document.getElementById('profilePicInitials');

        if (dataUrl) {
            if (profilePicImage) {
                profilePicImage.src = dataUrl;
                profilePicImage.style.display = '';
            }
            if (profilePicInitials) {
                profilePicInitials.style.display = 'none';
            }
        } else {
            // No image, show placeholder
            if (profilePicImage) {
                profilePicImage.style.display = 'none';
            }
            if (profilePicInitials) {
                profilePicInitials.textContent = 'Add Profile Picture';
                profilePicInitials.style.display = 'flex';
            }
        }
        if (profilePicUrl) {
            profilePicUrl.value = dataUrl || '';
        }
        // Store in user data
        userData.profile.profilePic = dataUrl;
        // Add success animation
        if (profilePicPreview) {
            profilePicPreview.style.transform = 'scale(1.1)';
            setTimeout(() => {
                profilePicPreview.style.transform = 'scale(1)';
            }, 300);
        }
    } catch (error) {
        console.error('Error updating profile image:', error);
    }
}

// On load, show placeholder if no profilePicUrl
window.addEventListener('DOMContentLoaded', function() {
    const profilePicImage = document.getElementById('profilePicImage');
    const profilePicInitials = document.getElementById('profilePicInitials');
    const profilePicUrl = document.getElementById('profilePicUrl');
    if (profilePicUrl && !profilePicUrl.value) {
        if (profilePicImage) profilePicImage.style.display = 'none';
        if (profilePicInitials) {
            profilePicInitials.textContent = 'Add Profile Picture';
            profilePicInitials.style.display = 'flex';
        }
    }
    
    // Initialize social links form
    generateSocialLinksForm();
});

// Update placeholder live as user types display name (no longer needed, but keep for future logic)
const displayNameInput = document.getElementById('displayName');
if (displayNameInput) {
    displayNameInput.addEventListener('input', function() {
        const profilePicInitials = document.getElementById('profilePicInitials');
        if (profilePicInitials) {
            profilePicInitials.textContent = 'Add Profile Picture';
        }
    });
}

function showImageProcessing() {
    try {
        const profilePicPreview = document.getElementById('profilePicPreview');
        if (profilePicPreview) {
            // Add processing overlay
            let processingOverlay = profilePicPreview.querySelector('.processing-overlay');
            if (!processingOverlay) {
                processingOverlay = document.createElement('div');
                processingOverlay.className = 'processing-overlay';
                processingOverlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    z-index: 10;
                `;
                processingOverlay.innerHTML = `
                    <div style="text-align: center; color: white;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <div style="font-size: 0.75rem;">Processing...</div>
                    </div>
                `;
                profilePicPreview.appendChild(processingOverlay);
            }
        }
    } catch (error) {
        console.error('Error showing image processing:', error);
    }
}

function hideImageProcessing() {
    try {
        const processingOverlay = document.querySelector('.processing-overlay');
        if (processingOverlay) {
            processingOverlay.remove();
        }
    } catch (error) {
        console.error('Error hiding image processing:', error);
    }
}

function setupDragAndDrop() {
    try {
        const profilePicPreview = document.getElementById('profilePicPreview');
        const profilePicUpload = document.getElementById('profilePicUpload');
        if (!profilePicPreview || !profilePicUpload) return;

        // Add click functionality to trigger file upload
        profilePicPreview.addEventListener('click', function() {
            profilePicUpload.click();
        });

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            profilePicPreview.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            profilePicPreview.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            profilePicPreview.addEventListener(eventName, unhighlight, false);
        });

        // Handle dropped files
        profilePicPreview.addEventListener('drop', handleDrop, false);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight(e) {
            profilePicPreview.classList.add('drag-over');
        }

        function unhighlight(e) {
            profilePicPreview.classList.remove('drag-over');
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length > 0) {
                const file = files[0];
                processProfileImage(file);
            }
        }

    } catch (error) {
        console.error('Error setting up drag and drop:', error);
    }
}

function updateUsername() {
    try {
        const displayNameInput = document.getElementById('displayName');
        const usernameDisplay = document.getElementById('username-display');

        if (!displayNameInput || !usernameDisplay) return;

        const displayName = displayNameInput.value.trim();
        if (!displayName) {
            usernameDisplay.textContent = 'username';
            return;
        }

        // Generate username from display name
        let username = displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);

        // Ensure username is not empty
        if (!username) {
            username = 'user' + Math.floor(Math.random() * 1000);
        }

        // Store in user data
        userData.profile.username = username;
        usernameDisplay.textContent = username;

        // Add typing animation
        animateUsernameUpdate(usernameDisplay);

        // Check availability (debounced)
        clearTimeout(window.usernameCheckTimeout);
        window.usernameCheckTimeout = setTimeout(() => {
            checkUsernameAvailability(username);
        }, 500);

    } catch (error) {
        console.error('Error updating username:', error);
    }
}

function animateUsernameUpdate(element) {
    try {
        element.style.transform = 'scale(1.1)';
        element.style.color = 'var(--text-primary)';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    } catch (error) {
        console.error('Error animating username update:', error);
    }
}

async function checkUsernameAvailability(username) {
    try {
        if (!username || !db) return;

        // Show checking state
        showUsernameCheckingState();

        // Check if username exists
        const usernameQuery = await db.collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();

        const isAvailable = usernameQuery.empty;

        // Update UI based on availability
        updateUsernameAvailabilityUI(isAvailable, username);

    } catch (error) {
        console.error('Error checking username availability:', error);
        hideUsernameCheckingState();
    }
}

function showUsernameCheckingState() {
    try {
        const linkPreview = document.querySelector('.link-preview');
        if (linkPreview) {
            linkPreview.style.opacity = '0.7';

            // Add checking indicator
            let checkingIndicator = linkPreview.querySelector('.checking-indicator');
            if (!checkingIndicator) {
                checkingIndicator = document.createElement('div');
                checkingIndicator.className = 'checking-indicator';
                checkingIndicator.style.cssText = `
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                `;
                checkingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                linkPreview.style.position = 'relative';
                linkPreview.appendChild(checkingIndicator);
            }
        }
    } catch (error) {
        console.error('Error showing username checking state:', error);
    }
}

function hideUsernameCheckingState() {
    try {
        const linkPreview = document.querySelector('.link-preview');
        const checkingIndicator = document.querySelector('.checking-indicator');

        if (linkPreview) {
            linkPreview.style.opacity = '1';
        }

        if (checkingIndicator) {
            checkingIndicator.remove();
        }
    } catch (error) {
        console.error('Error hiding username checking state:', error);
    }
}

function updateUsernameAvailabilityUI(isAvailable, username) {
    try {
        hideUsernameCheckingState();

        const linkPreview = document.querySelector('.link-preview');
        if (!linkPreview) return;

        // Remove existing availability indicator
        const existingIndicator = linkPreview.querySelector('.availability-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Add availability indicator
        const indicator = document.createElement('div');
        indicator.className = 'availability-indicator';
        indicator.style.cssText = `
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1rem;
        `;

        if (isAvailable) {
            indicator.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
            linkPreview.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        } else {
            indicator.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #f87171;"></i>';
            linkPreview.style.borderColor = 'rgba(248, 113, 113, 0.3)';

            // Show suggestion for alternative username
            showUsernameAlternatives(username);
        }

        linkPreview.style.position = 'relative';
        linkPreview.appendChild(indicator);

    } catch (error) {
        console.error('Error updating username availability UI:', error);
    }
}

function showUsernameAlternatives(username) {
    try {
        // Generate alternative usernames
        const alternatives = [
            username + Math.floor(Math.random() * 100),
            username + '_' + Math.floor(Math.random() * 100),
            username + new Date().getFullYear().toString().slice(-2)
        ];

        showInfo(`Username "${username}" is taken. Try: ${alternatives.join(', ')}`);
    } catch (error) {
        console.error('Error showing username alternatives:', error);
    }
}

function updateCharCount() {
    try {
        if (!bio || !bioCharCount) return;
        
        const count = bio.value.length;
        bioCharCount.textContent = count;
        
        if (count > 500) {
            bioCharCount.style.color = '#ef4444';
            bio.value = bio.value.substring(0, 500);
            bioCharCount.textContent = '500';
        } else {
            bioCharCount.style.color = '#6b7280';
        }
    } catch (error) {
        console.error('Error updating character count:', error);
    }
}

// Links functions
function showAddLinkModal(type = 'regular') {
    try {
        const modal = document.getElementById('linkModal');
        if (!modal) return;
        
        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        const form = document.getElementById('linkForm');
        if (form) {
            form.reset();
            clearFormErrors(form);
        }
        
        // Update modal title based on type
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = type === 'social' ? '✨ Add Social Media Link' : '✨ Add New Link';
        }
        
        // Reset platform select to default state
        const platformSelect = document.getElementById('platform');
        if (platformSelect) {
            platformSelect.value = '';
        }
        
    } catch (error) {
        console.error('Error showing add link modal:', error);
    }
}

function closeLinkModal() {
    try {
        const modal = document.getElementById('linkModal');
        if (modal) {
            modal.classList.remove('show');
        }

        // Restore body scroll
        document.body.style.overflow = 'auto';

        // Reset form
        const form = document.getElementById('linkForm');
        if (form) {
            form.reset();
            clearFormErrors(form);
        }

        // Reset custom select to default state
        const selectedElement = document.getElementById('platform-selected');
        const hiddenInput = document.getElementById('platform');
        if (selectedElement && hiddenInput) {
            selectedElement.innerHTML = '<i class="fas fa-globe"></i><span>Choose a platform</span>';
            hiddenInput.value = '';
            
            // Remove selected state from all options
            const options = document.querySelectorAll('.select-option');
            options.forEach(opt => opt.classList.remove('selected'));
        }

        // Reset submit handler to default
        if (form) {
            form.onsubmit = handleLinkSubmit;
        }

    } catch (error) {
        console.error('Error closing link modal:', error);
    }
}

function clearFormErrors(form) {
    try {
        // Remove error classes and messages
        const errorElements = form.querySelectorAll('.error');
        errorElements.forEach(element => {
            element.classList.remove('error');
        });

        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(message => {
            message.remove();
        });
    } catch (error) {
        console.error('Error clearing form errors:', error);
    }
}

function handleLinkSubmit(event) {
    event.preventDefault();

    try {
        // Get form elements
        const form = event.target;
        const titleInput = form.querySelector('#title');
        const urlInput = form.querySelector('#url');
        const platformSelect = form.querySelector('#platform');
        const descriptionInput = form.querySelector('#description');

        // Clear previous errors
        clearFormErrors(form);

        // Get values
        const title = titleInput?.value.trim();
        const url = urlInput?.value.trim();
        const platform = platformSelect?.value;
        const description = descriptionInput?.value.trim();

        // Validate required fields
        let hasErrors = false;

        if (!platform) {
            showFieldError(platformSelect, 'Please select a platform');
            hasErrors = true;
        }

        if (!title) {
            showFieldError(titleInput, 'Title is required');
            hasErrors = true;
        } else if (title.length < 2) {
            showFieldError(titleInput, 'Title must be at least 2 characters long');
            hasErrors = true;
        }

        if (!url) {
            showFieldError(urlInput, 'URL is required');
            hasErrors = true;
        } else {
            // Enhanced URL validation
            const urlValidation = validateUrl(url);
            if (!urlValidation.isValid) {
                showFieldError(urlInput, urlValidation.error);
                hasErrors = true;
            }
        }

        if (hasErrors) {
            return;
        }

        // Check if this is a social link
        const modal = document.getElementById('linkModal');
        const isSocialLink = modal?.dataset?.linkType === 'social';

        if (isSocialLink) {
            // Handle social link
            const normalizedUrl = normalizeUrl(url);
            
            // Check for duplicates in social links
            const currentSocialLinks = currentUserData?.socialLinks || {};
            if (currentSocialLinks[platform]) {
                showFieldError(urlInput, 'This social platform already has a link');
                return;
            }

            // Add to social links (will be saved via saveSocialData)
            
            // Save social data
            saveSocialData();
            
            // Update social display
            generateSocialLinksForm();
            
            // Close modal and show success
            closeLinkModal();
            showSuccess(`✅ ${platform} link added successfully!`);
            
        } else {
            // Handle regular link
            // Initialize userData if it doesn't exist
            if (!window.userData) {
                window.userData = { links: [] };
            }
            if (!window.userData.links) {
                window.userData.links = [];
            }

            // Sync with global userData
            if (!userData.links) {
                userData.links = [];
            }

            // Check for duplicates
            const normalizedUrl = normalizeUrl(url);
            const linkExists = window.userData.links.some(link =>
                normalizeUrl(link.url) === normalizedUrl ||
                link.title.toLowerCase() === title.toLowerCase()
            );

            if (linkExists) {
                showFieldError(urlInput, 'This link or title already exists');
                return;
            }

            // Create link data
            const linkData = {
                title,
                url: normalizedUrl,
                platform,
                description: description || '',
                timestamp: Date.now(),
                id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            // Add to UI and data
            addLinkToUI(linkData.id, linkData);
            window.userData.links.push(linkData);
            userLinks.push(linkData); // Also add to userLinks for consistency

            // Save data
            saveUserData();

            // Close modal and show success
            closeLinkModal();
            showSuccess(`✅ "${title}" link added successfully!`);

            // Update links count if we're on the links step
            if (currentStep === 2) {
                updateLinksDisplay();
            }
        }

    } catch (error) {
        console.error('Error handling link submit:', error);
        showError('Failed to add link. Please try again.');
    }
}

function validateUrl(url) {
    try {
        // Add protocol if missing
        let normalizedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            normalizedUrl = 'https://' + url;
        }

        // Validate URL format
        const urlObj = new URL(normalizedUrl);

        // Check for valid domain
        if (!urlObj.hostname || urlObj.hostname.length < 3) {
            return { isValid: false, error: 'Please enter a valid domain name' };
        }

        // Check for common issues
        if (urlObj.hostname === 'localhost' || urlObj.hostname.startsWith('127.')) {
            return { isValid: false, error: 'Local URLs are not allowed' };
        }

        return { isValid: true, url: normalizedUrl };

    } catch (e) {
        return { isValid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
    }
}

function normalizeUrl(url) {
    try {
        let normalized = url.trim().toLowerCase();

        // Add protocol if missing
        if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
            normalized = 'https://' + normalized;
        }

        // Remove trailing slash
        if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    } catch (error) {
        return url;
    }
}

function updateLinksDisplay() {
    try {
        // Remove empty state if links exist
        const emptyState = document.querySelector('.empty-state');
        if (emptyState && window.userData.links && window.userData.links.length > 0) {
            emptyState.remove();
        }

        // Re-render links
        renderLinks();
    } catch (error) {
        console.error('Error updating links display:', error);
    }
}

// Save user data to Firestore
async function saveUserData() {
    try {
        if (!currentUser) {
            console.error('No user logged in');
            return;
        }

        // Save links to Firestore
        const linksToSave = window.userData?.links || userData.links || [];
        if (linksToSave && linksToSave.length > 0) {
            const linksRef = db.collection('users').doc(currentUser.uid).collection('links');

            // Use a batch write to save all links
            const batch = db.batch();

            linksToSave.forEach(link => {
                const linkRef = linksRef.doc(link.id);
                batch.set(linkRef, {
                    title: link.title,
                    url: link.url,
                    platform: link.platform,
                    timestamp: link.timestamp,
                    order: linksToSave.indexOf(link)
                });
            });
            
            await batch.commit();
            console.log('Links saved successfully');
        }
    } catch (error) {
        console.error('Error saving user data:', error);
        showError('Error saving your data. Please try again.');
    }
}

// Enhanced notification system
function showSuccess(message, duration = 4000) {
    showNotification(message, 'success', duration);
}

function showError(message, duration = 5000) {
    showNotification(message, 'error', duration);
}

function showInfo(message, duration = 3000) {
    showNotification(message, 'info', duration);
}

function showNotification(message, type = 'info', duration = 3000) {
    try {
        // Remove existing notifications of the same type
        const existingNotifications = document.querySelectorAll(`.notification.${type}`);
        existingNotifications.forEach(notification => {
            notification.style.animation = 'notificationSlideOut 0.3s ease-in-out forwards';
            setTimeout(() => notification.remove(), 300);
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        // Set icon based on type
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-triangle';

        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close button styling
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 4px;
                margin-left: auto;
                opacity: 0.7;
                transition: opacity 0.2s;
            `;
            closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
            closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');
        }

        document.body.appendChild(notification);

        // Auto-remove notification
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'notificationSlideOut 0.3s ease-in-out forwards';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            if (notification.parentElement) {
                notification.remove();
            }
        });

    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback to alert
        alert(message);
    }
}

// Add link to UI
function addLinkToUI(linkId, linkData) {
    // Get or create links container
    let linksContainer = document.getElementById('linksContainer');
    if (!linksContainer) {
        linksContainer = document.createElement('div');
        linksContainer.id = 'linksContainer';
        linksContainer.className = 'links-container';
        const linksSection = document.querySelector('.links-section');
        if (linksSection) {
            linksSection.appendChild(linksContainer);
        } else {
            console.error('Links section not found');
            return;
        }
    }

    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';
    linkItem.dataset.id = linkId;

    // Get icon for platform
    const platformIcon = getPlatformIcon(linkData.platform || 'other');

    // Format URL display
    let displayUrl = linkData.url;
    if (displayUrl.length > 40) {
        displayUrl = displayUrl.substring(0, 37) + '...';
    }

    linkItem.innerHTML = `
        <div class="link-content">
            <div class="link-platform">
                <i class="${platformIcon}"></i>
                <span>${linkData.platform || 'Other'}</span>
            </div>
            <h4>${linkData.title}</h4>
            <a href="${linkData.url}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>
        </div>
        <div class="link-actions">
            <button class="edit-link" title="Edit Link">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-link" title="Delete Link">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Add event listeners
    const editButton = linkItem.querySelector('.edit-link');
    const deleteButton = linkItem.querySelector('.delete-link');

    editButton.addEventListener('click', () => openLinkEditor(linkId));
    deleteButton.addEventListener('click', () => confirmDeleteLink(linkId, linkData.title));

    linksContainer.appendChild(linkItem);
}

// Get platform icon
function getPlatformIcon(platform) {
    const platformIcons = {
        'youtube': 'fab fa-youtube',
        'instagram': 'fab fa-instagram',
        'twitter': 'fab fa-twitter',
        'facebook': 'fab fa-facebook',
        'linkedin': 'fab fa-linkedin',
        'tiktok': 'fab fa-tiktok',
        'github': 'fab fa-github',
        'spotify': 'fab fa-spotify',
        'twitch': 'fab fa-twitch',
        'discord': 'fab fa-discord',
        'telegram': 'fab fa-telegram',
        'whatsapp': 'fab fa-whatsapp',
        'other': 'fas fa-link'
    };

    return platformIcons[platform.toLowerCase()] || platformIcons.other;
}

// Update platform select color based on selection
function updatePlatformSelectColor(platformValue) {
    const platformColors = {
        'website': '#6b7280',
        'youtube': '#ff0000',
        'instagram': '#e4405f',
        'twitter': '#1da1f2',
        'facebook': '#1877f2',
        'linkedin': '#0a66c2',
        'tiktok': '#000000',
        'github': '#333333',
        'spotify': '#1db954',
        'soundcloud': '#ff5500',
        'twitch': '#9146ff',
        'discord': '#5865f2',
        'telegram': '#0088cc',
        'whatsapp': '#25d366',
        'medium': '#000000',
        'behance': '#0057ff',
        'dribbble': '#ea4c89',
        'pinterest': '#e60023',
        'reddit': '#ff4500',
        'snapchat': '#fffc00',
        'tumblr': '#36465d',
        'vimeo': '#1ab7ea',
        'other': '#6b7280'
    };

    const platformSelect = document.getElementById('platform-select');
    const selectedElement = document.getElementById('platform-selected');
    const hiddenInput = document.getElementById('platform');
    
    if (!platformSelect || !selectedElement || !hiddenInput) return;

    // Update the hidden input value
    hiddenInput.value = platformValue;

    // Find the corresponding option to get icon and text
    const optionElement = document.querySelector(`[data-value="${platformValue}"]`);
    if (optionElement) {
        const icon = optionElement.querySelector('i').cloneNode(true);
        const text = optionElement.querySelector('span').textContent;
        
        // Update selected display
        selectedElement.innerHTML = '';
        selectedElement.appendChild(icon);
        selectedElement.appendChild(document.createElement('span')).textContent = text;
        
        // Update visual state of options
        const options = document.querySelectorAll('.select-option');
        options.forEach(opt => opt.classList.remove('selected'));
        optionElement.classList.add('selected');
    }
}

function loadLinksContent() {
    try {
        renderLinks();
        showInfo('💡 Tip: Add links to your website, portfolio, or other important pages');
    } catch (error) {
        console.error('Error loading links content:', error);
    }
}

function renderLinks() {
    try {
        const linksContainer = document.getElementById('linksContainer');
        if (!linksContainer) return;

        // Use window.userData.links as the primary source
        const links = window.userData?.links || userLinks || [];

        if (!links || links.length === 0) {
            linksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-link"></i>
                    <h3>No Links Added Yet</h3>
                    <p>Add your first link to get started. You can include websites, portfolios, social profiles, or any other important links.</p>
                </div>
            `;
            return;
        }

        linksContainer.innerHTML = links.map(link => `
            <div class="link-item" data-id="${link.id}">
                <div class="link-content">
                    <div class="link-platform">
                        <i class="${getPlatformIcon(link.platform)}"></i>
                        <span>${capitalizeFirst(link.platform)}</span>
                    </div>
                    <h4>${link.title}</h4>
                    <a href="${link.url}" target="_blank" rel="noopener noreferrer">${truncateUrl(link.url)}</a>
                    ${link.description ? `<p class="link-description">${link.description}</p>` : ''}
                </div>
                <div class="link-actions">
                    <button class="edit-link" onclick="editLink('${link.id}')" title="Edit Link">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-link" onclick="deleteLink('${link.id}')" title="Delete Link">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error rendering links:', error);
    }
}

function truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function editLink(linkId) {
    try {
        const links = window.userData?.links || userLinks || [];
        const link = links.find(l => l.id === linkId);
        if (!link) return;
        
        // Populate modal with link data
        const titleInput = linkModal.querySelector('#title');
        const urlInput = linkModal.querySelector('#url');
        const descriptionInput = linkModal.querySelector('#description');
        
        // Update platform select
        updatePlatformSelectColor(link.platform);
        
        if (titleInput) titleInput.value = link.title;
        if (urlInput) urlInput.value = link.url;
        if (descriptionInput) descriptionInput.value = link.description || '';
        
        // Show modal
        showAddLinkModal();
        
        // Update submit handler to handle edit
        const form = linkModal.querySelector('form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                updateLink(linkId);
            };
        }
        
    } catch (error) {
        console.error('Error editing link:', error);
    }
}

function updateLink(linkId) {
    try {
        const form = linkModal.querySelector('form');
        if (!form) return;
        
        const platform = form.querySelector('#platform')?.value.trim();
        const title = form.querySelector('#title')?.value.trim();
        const url = form.querySelector('#url')?.value.trim();
        const description = form.querySelector('#description')?.value.trim();
        
        if (!platform || !title || !url) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Update link in both arrays
        const linkIndex = userLinks.findIndex(l => l.id === linkId);
        const formDataIndex = window.userData?.links?.findIndex(l => l.id === linkId) ?? -1;

        const updatedLink = {
            id: linkId,
            platform,
            title,
            url,
            description,
            updatedAt: new Date().toISOString()
        };

        if (linkIndex !== -1) {
            userLinks[linkIndex] = { ...userLinks[linkIndex], ...updatedLink };
        }

        if (formDataIndex !== -1 && window.userData?.links) {
            window.userData.links[formDataIndex] = { ...window.userData.links[formDataIndex], ...updatedLink };
        }
        
        // Update UI
        renderLinks();
        closeLinkModal();
        
    } catch (error) {
        console.error('Error updating link:', error);
    }
}

function deleteLink(linkId) {
    try {
        if (!confirm('Are you sure you want to delete this link?')) return;

        // Remove from both arrays
        userLinks = userLinks.filter(l => l.id !== linkId);
        if (window.userData?.links) {
            window.userData.links = window.userData.links.filter(l => l.id !== linkId);
        }
        
        // Update UI
        renderLinks();
        
    } catch (error) {
        console.error('Error deleting link:', error);
    }
}

// Enhanced Social functions
function loadSocialContent() {
    try {
        const socialContent = document.getElementById('social-content');
        if (!socialContent) return;

        // Generate the social links form
        generateSocialLinksForm();
        
        // Load existing social links data
        loadSocialLinks();
        
        // Add save button event listener
        const saveSocialBtn = document.getElementById('save-social-button');
        if (saveSocialBtn) {
            saveSocialBtn.addEventListener('click', handleSocialLinksSubmit);
        }
        
    } catch (error) {
        console.error('Error loading social content:', error);
    }
}

// Generate social links form
function generateSocialLinksForm() {
    const socialLinksForm = document.getElementById('social-links-form');
    if (!socialLinksForm) return;
    
    socialLinksForm.innerHTML = '';

    socialPlatforms.forEach(platform => {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'social-link-input';

        inputContainer.innerHTML = `
            <i class="${platform.icon}"></i>
            <input type="url" id="social-${platform.id}" name="social-${platform.id}"
                   placeholder="${platform.name} URL">
        `;

        socialLinksForm.appendChild(inputContainer);
    });
}

// Load social links
function loadSocialLinks() {
    if (!currentUserData || !currentUserData.socialLinks) return;

    const socialLinks = currentUserData.socialLinks;

    socialPlatforms.forEach(platform => {
        const input = document.getElementById(`social-${platform.id}`);
        if (input && socialLinks[platform.id]) {
            input.value = socialLinks[platform.id];
        }
    });
}

// Handle social links submission
function handleSocialLinksSubmit() {
    if (!currentUser) {
        showNotification("Not authenticated. Cannot save.", 'error');
        return;
    }

    const socialLinks = {};

    socialPlatforms.forEach(platform => {
        const input = document.getElementById(`social-${platform.id}`);
        if (input && input.value.trim()) {
            socialLinks[platform.id] = input.value.trim();
        }
    });

    // Update Firestore document
    const userDocRef = db.collection('users').doc(currentUser.uid);
    userDocRef.update({
        socialLinks: socialLinks,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Social links updated successfully!");
        showNotification("Social links saved successfully!", 'success');

        // Update local data
        currentUserData = { ...currentUserData, socialLinks };
    })
    .catch((error) => {
        console.error("Error updating social links: ", error);
        showNotification(`Error saving social links: ${error.message}`, 'error');
    });
}

async function saveSocialData() {
    try {
        // Use the new handleSocialLinksSubmit function
        handleSocialLinksSubmit();
    } catch (error) {
        console.error('Error saving social data:', error);
        showError('Failed to save social links');
    }
}

// Enhanced Media functions
function loadMediaContent() {
    try {
        // Initialize media-catalog toggle
        const mediaToggleBtn = document.getElementById('media-toggle-btn');
        const catalogToggleBtn = document.getElementById('catalog-toggle-btn');
        const mediaContentSection = document.getElementById('media-content-section');
        const catalogContentSection = document.getElementById('catalog-content-section');

        if (mediaToggleBtn && catalogToggleBtn) {
            mediaToggleBtn.addEventListener('click', () => {
                mediaToggleBtn.classList.add('active');
                catalogToggleBtn.classList.remove('active');
                mediaContentSection.style.display = 'block';
                catalogContentSection.style.display = 'none';
                
                // Update header content
                const mediaHeader = document.getElementById('media-header-content');
                const catalogHeader = document.getElementById('catalog-header-content');
                if (mediaHeader) mediaHeader.style.display = 'block';
                if (catalogHeader) catalogHeader.style.display = 'none';
            });

            catalogToggleBtn.addEventListener('click', () => {
                catalogToggleBtn.classList.add('active');
                mediaToggleBtn.classList.remove('active');
                catalogContentSection.style.display = 'block';
                mediaContentSection.style.display = 'none';
                
                // Update header content
                const mediaHeader = document.getElementById('media-header-content');
                const catalogHeader = document.getElementById('catalog-header-content');
                if (mediaHeader) mediaHeader.style.display = 'none';
                if (catalogHeader) catalogHeader.style.display = 'block';
            });
        }

        // Initialize media type selector
        const mediaTypeBtns = document.querySelectorAll('.media-type-btn');
        const mediaSections = document.querySelectorAll('.media-section');

        mediaTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                
                // Update active button
                mediaTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding section
                mediaSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === `${type}-section`) {
                        section.classList.add('active');
                    }
                });
            });
        });

        // Initialize action buttons
        const addYouTubeBtn = document.getElementById('add-youtube-button');
        const addImageBtn = document.getElementById('add-image-button');
        const addMusicBtn = document.getElementById('add-music-button');
        const addProductBtn = document.getElementById('add-product-button');
        const saveMediaBtn = document.getElementById('save-media-button');
        const saveCatalogBtn = document.getElementById('save-catalog-button');

        if (addYouTubeBtn) {
            addYouTubeBtn.addEventListener('click', () => {
                showYouTubeModal();
            });
        }

        if (addImageBtn) {
            addImageBtn.addEventListener('click', () => {
                showImageModal();
            });
        }

        if (addMusicBtn) {
            addMusicBtn.addEventListener('click', () => {
                showMusicModal();
            });
        }

        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                showProductModal();
            });
        }

        if (saveMediaBtn) {
            saveMediaBtn.addEventListener('click', () => {
                handleMediaSave();
            });
        }

        if (saveCatalogBtn) {
            saveCatalogBtn.addEventListener('click', () => {
                handleCatalogSave();
            });
        }

        // Load existing media and catalog data
        loadUserMedia();
        loadUserCatalog();

        // Setup file upload previews
        setupFileUploadPreviews();

    } catch (error) {
        console.error('Error loading media content:', error);
    }
}

// Setup file upload previews
function setupFileUploadPreviews() {
    try {
        // Image upload preview
        const imageUpload = document.getElementById('image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', handleImagePreview);
        }

        // Product image upload preview
        const productImageUpload = document.getElementById('product-image-upload');
        if (productImageUpload) {
            productImageUpload.addEventListener('change', handleProductImagePreview);
        }

    } catch (error) {
        console.error('Error setting up file upload previews:', error);
    }
}

// Handle image preview
function handleImagePreview(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('Image file is too large. Please choose an image smaller than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = document.getElementById('image-preview-container');
            const previewImg = document.getElementById('image-preview');
            
            if (previewContainer && previewImg) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);

    } catch (error) {
        console.error('Error handling image preview:', error);
    }
}

// Handle product image preview
function handleProductImagePreview(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('Image file is too large. Please choose an image smaller than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = document.getElementById('product-preview-container');
            const previewImg = document.getElementById('product-preview');
            
            if (previewContainer && previewImg) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);

    } catch (error) {
        console.error('Error handling product image preview:', error);
    }
}

// Media Modal Functions
function showYouTubeModal(videoId = null) {
    try {
        const modal = document.getElementById('youtubeModal');
        const form = document.getElementById('youtubeForm');
        const modalTitle = modal.querySelector('h3');
        
        if (videoId) {
            // Edit mode
            modalTitle.textContent = '🎬 Edit YouTube Video';
            const video = userMedia.youtube?.find(v => v.id === videoId);
            if (video) {
                document.getElementById('youtube-id').value = videoId;
                document.getElementById('youtube-title').value = video.title;
                document.getElementById('youtube-url').value = video.url;
                document.getElementById('youtube-description').value = video.description || '';
            }
        } else {
            // Add mode
            modalTitle.textContent = '🎬 Add YouTube Video';
            form.reset();
            document.getElementById('youtube-id').value = '';
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error showing YouTube modal:', error);
    }
}

function closeYouTubeModal() {
    try {
        const modal = document.getElementById('youtubeModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('youtubeForm');
        form.reset();
        document.getElementById('youtube-id').value = '';
        
    } catch (error) {
        console.error('Error closing YouTube modal:', error);
    }
}

function showImageModal(imageId = null) {
    try {
        const modal = document.getElementById('imageModal');
        const form = document.getElementById('imageForm');
        const modalTitle = modal.querySelector('h3');
        
        if (imageId) {
            // Edit mode
            modalTitle.textContent = '🖼️ Edit Picture';
            const image = userMedia.images?.find(img => img.id === imageId);
            if (image) {
                document.getElementById('image-id').value = imageId;
                document.getElementById('image-title').value = image.title;
                document.getElementById('image-description').value = image.description || '';
                // Note: Can't pre-fill file input for security reasons
            }
        } else {
            // Add mode
            modalTitle.textContent = '🖼️ Add Picture';
            form.reset();
            document.getElementById('image-id').value = '';
            document.getElementById('image-preview-container').style.display = 'none';
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error showing image modal:', error);
    }
}

function closeImageModal() {
    try {
        const modal = document.getElementById('imageModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('imageForm');
        form.reset();
        document.getElementById('image-id').value = '';
        document.getElementById('image-preview-container').style.display = 'none';
        
    } catch (error) {
        console.error('Error closing image modal:', error);
    }
}

function showMusicModal(musicId = null) {
    try {
        const modal = document.getElementById('musicModal');
        const form = document.getElementById('musicForm');
        const modalTitle = modal.querySelector('h3');
        
        if (musicId) {
            // Edit mode
            modalTitle.textContent = '🎵 Edit Music Link';
            const music = userMedia.music?.find(m => m.id === musicId);
            if (music) {
                document.getElementById('music-id').value = musicId;
                document.getElementById('music-title').value = music.title;
                document.getElementById('music-artist').value = music.artist || '';
                document.getElementById('music-platform').value = music.platform;
                document.getElementById('music-url').value = music.url;
            }
        } else {
            // Add mode
            modalTitle.textContent = '🎵 Add Music Link';
            form.reset();
            document.getElementById('music-id').value = '';
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error showing music modal:', error);
    }
}

function closeMusicModal() {
    try {
        const modal = document.getElementById('musicModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('musicForm');
        form.reset();
        document.getElementById('music-id').value = '';
        
    } catch (error) {
        console.error('Error closing music modal:', error);
    }
}

function showProductModal(productId = null) {
    try {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const modalTitle = modal.querySelector('h3');
        
        if (productId) {
            // Edit mode
            modalTitle.textContent = '🛍️ Edit Product';
            const product = userCatalog.find(p => p.id === productId);
            if (product) {
                document.getElementById('product-id').value = productId;
                document.getElementById('product-title').value = product.title;
                document.getElementById('product-description').value = product.description || '';
                document.getElementById('product-currency').value = product.currency || '$';
                document.getElementById('product-price').value = product.price || '';
                document.getElementById('product-image-url').value = product.imageUrl || '';
                document.getElementById('product-buy-link').value = product.buyLink;
                document.getElementById('product-category').value = product.category || 'other';
            }
        } else {
            // Add mode
            modalTitle.textContent = '🛍️ Add New Product';
            form.reset();
            document.getElementById('product-id').value = '';
            document.getElementById('product-preview-container').style.display = 'none';
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error showing product modal:', error);
    }
}

function closeProductModal() {
    try {
        const modal = document.getElementById('productModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('productForm');
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-preview-container').style.display = 'none';
        
    } catch (error) {
        console.error('Error closing product modal:', error);
    }
}

// Media Form Handlers
function handleYouTubeSubmit(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const videoId = document.getElementById('youtube-id').value;
        const title = document.getElementById('youtube-title').value.trim();
        const url = document.getElementById('youtube-url').value.trim();
        const description = document.getElementById('youtube-description').value.trim();
        
        if (!title || !url) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Validate YouTube URL
        const videoIdFromUrl = getYouTubeVideoId(url);
        if (!videoIdFromUrl) {
            showError('Please enter a valid YouTube URL');
            return;
        }
        
        const videoData = {
            id: videoId || `youtube_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            url,
            videoId: videoIdFromUrl,
            description,
            timestamp: Date.now()
        };
        
        // Initialize userMedia if it doesn't exist
        if (!userMedia) userMedia = {};
        if (!userMedia.youtube) userMedia.youtube = [];
        
        if (videoId) {
            // Update existing video
            const index = userMedia.youtube.findIndex(v => v.id === videoId);
            if (index !== -1) {
                userMedia.youtube[index] = { ...userMedia.youtube[index], ...videoData };
            }
        } else {
            // Add new video
            userMedia.youtube.push(videoData);
        }
        
        // Update UI
        updateYouTubeUI();
        closeYouTubeModal();
        showSuccess(`✅ YouTube video "${title}" ${videoId ? 'updated' : 'added'} successfully!`);
        
    } catch (error) {
        console.error('Error handling YouTube submit:', error);
        showError('Failed to save YouTube video. Please try again.');
    }
}

function handleImageSubmit(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const imageId = document.getElementById('image-id').value;
        const title = document.getElementById('image-title').value.trim();
        const fileInput = document.getElementById('image-upload');
        const description = document.getElementById('image-description').value.trim();
        
        if (!title || !fileInput.files[0]) {
            showError('Please fill in all required fields and select an image');
            return;
        }
        
        const file = fileInput.files[0];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showError('Image file is too large. Please choose an image smaller than 5MB.');
            return;
        }
        
        // Process image
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: imageId || `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title,
                imageUrl: e.target.result,
                description,
                timestamp: Date.now()
            };
            
            // Initialize userMedia if it doesn't exist
            if (!userMedia) userMedia = {};
            if (!userMedia.images) userMedia.images = [];
            
            if (imageId) {
                // Update existing image
                const index = userMedia.images.findIndex(img => img.id === imageId);
                if (index !== -1) {
                    userMedia.images[index] = { ...userMedia.images[index], ...imageData };
                }
            } else {
                // Add new image
                userMedia.images.push(imageData);
            }
            
            // Update UI
            updateImagesUI();
            closeImageModal();
            showSuccess(`✅ Image "${title}" ${imageId ? 'updated' : 'added'} successfully!`);
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error handling image submit:', error);
        showError('Failed to save image. Please try again.');
    }
}

function handleMusicSubmit(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const musicId = document.getElementById('music-id').value;
        const title = document.getElementById('music-title').value.trim();
        const artist = document.getElementById('music-artist').value.trim();
        const platform = document.getElementById('music-platform').value;
        const url = document.getElementById('music-url').value.trim();
        
        if (!title || !platform || !url) {
            showError('Please fill in all required fields');
            return;
        }
        
        const musicData = {
            id: musicId || `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            artist,
            platform,
            url,
            timestamp: Date.now()
        };
        
        // Initialize userMedia if it doesn't exist
        if (!userMedia) userMedia = {};
        if (!userMedia.music) userMedia.music = [];
        
        if (musicId) {
            // Update existing music
            const index = userMedia.music.findIndex(m => m.id === musicId);
            if (index !== -1) {
                userMedia.music[index] = { ...userMedia.music[index], ...musicData };
            }
        } else {
            // Add new music
            userMedia.music.push(musicData);
        }
        
        // Update UI
        updateMusicUI();
        closeMusicModal();
        showSuccess(`✅ Music "${title}" ${musicId ? 'updated' : 'added'} successfully!`);
        
    } catch (error) {
        console.error('Error handling music submit:', error);
        showError('Failed to save music link. Please try again.');
    }
}

function handleProductSubmit(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const productId = document.getElementById('product-id').value;
        const title = document.getElementById('product-title').value.trim();
        const description = document.getElementById('product-description').value.trim();
        const currency = document.getElementById('product-currency').value;
        const price = document.getElementById('product-price').value.trim();
        const imageUrl = document.getElementById('product-image-url').value.trim();
        const buyLink = document.getElementById('product-buy-link').value.trim();
        const category = document.getElementById('product-category').value;
        const fileInput = document.getElementById('product-image-upload');
        
        if (!title || !buyLink) {
            showError('Please fill in all required fields');
            return;
        }
        
        let finalImageUrl = imageUrl;
        
        // Handle file upload if provided
        if (fileInput.files[0]) {
            const file = fileInput.files[0];
            
            if (!file.type.startsWith('image/')) {
                showError('Please select a valid image file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showError('Image file is too large. Please choose an image smaller than 5MB.');
                return;
            }
            
            // Process image
            const reader = new FileReader();
            reader.onload = (e) => {
                finalImageUrl = e.target.result;
                saveProductData();
            };
            reader.readAsDataURL(file);
        } else {
            saveProductData();
        }
        
        function saveProductData() {
            const productData = {
                id: productId || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title,
                description,
                currency,
                price,
                imageUrl: finalImageUrl,
                buyLink,
                category,
                timestamp: Date.now()
            };
            
            // Initialize userCatalog if it doesn't exist
            if (!userCatalog) userCatalog = [];
            
            if (productId) {
                // Update existing product
                const index = userCatalog.findIndex(p => p.id === productId);
                if (index !== -1) {
                    userCatalog[index] = { ...userCatalog[index], ...productData };
                }
            } else {
                // Add new product
                userCatalog.push(productData);
            }
            
            // Update UI
            updateCatalogUI();
            closeProductModal();
            showSuccess(`✅ Product "${title}" ${productId ? 'updated' : 'added'} successfully!`);
        }
        
    } catch (error) {
        console.error('Error handling product submit:', error);
        showError('Failed to save product. Please try again.');
    }
}

// Utility Functions
function getYouTubeVideoId(url) {
    try {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (error) {
        return null;
    }
}

function getMusicPlatformIcon(platform) {
    const platformIcons = {
        'spotify': 'fab fa-spotify',
        'apple-music': 'fab fa-apple',
        'youtube-music': 'fab fa-youtube',
        'audiomack': 'fas fa-music',
        'soundcloud': 'fab fa-soundcloud',
        'bandcamp': 'fab fa-bandcamp',
        'tidal': 'fas fa-music',
        'deezer': 'fab fa-deezer',
        'amazon-music': 'fab fa-amazon',
        'other': 'fas fa-music'
    };
    return platformIcons[platform] || platformIcons.other;
}

// Data Loading Functions
async function loadUserMedia() {
    try {
        if (!currentUser) return;
        
        const mediaDoc = await db.collection('users').doc(currentUser.uid).collection('media').doc('content').get();
        if (mediaDoc.exists) {
            userMedia = mediaDoc.data();
        } else {
            userMedia = { youtube: [], images: [], music: [] };
        }
        
        updateMediaUI();
        
    } catch (error) {
        console.error('Error loading user media:', error);
        userMedia = { youtube: [], images: [], music: [] };
    }
}

async function loadUserCatalog() {
    try {
        if (!currentUser) return;
        
        const catalogSnapshot = await db.collection('users').doc(currentUser.uid).collection('catalog').get();
        userCatalog = [];
        
        catalogSnapshot.forEach(doc => {
            userCatalog.push({ id: doc.id, ...doc.data() });
        });
        
        updateCatalogUI();
        
    } catch (error) {
        console.error('Error loading user catalog:', error);
        userCatalog = [];
    }
}

// UI Update Functions
function updateMediaUI() {
    updateYouTubeUI();
    updateImagesUI();
    updateMusicUI();
}

function updateYouTubeUI() {
    try {
        const container = document.getElementById('youtube-container');
        if (!container) return;
        
        const videos = userMedia?.youtube || [];
        
        if (videos.length === 0) {
            container.innerHTML = `
                <div class="media-placeholder">
                    <i class="fab fa-youtube"></i>
                    <h4>No YouTube videos yet</h4>
                    <p>Add your first YouTube video to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = videos.map(video => `
            <div class="media-item" data-id="${video.id}">
                <div class="media-item-header">
                    <div class="media-item-title">${video.title}</div>
                    <div class="media-item-actions">
                        <button class="media-item-btn edit" onclick="showYouTubeModal('${video.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="media-item-btn delete" onclick="deleteMediaItem('${video.id}', 'youtube')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="youtube-embed">
                    <iframe src="https://www.youtube.com/embed/${video.videoId}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                </div>
                ${video.description ? `<p class="media-description">${video.description}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error updating YouTube UI:', error);
    }
}

function updateImagesUI() {
    try {
        const container = document.getElementById('images-container');
        if (!container) return;
        
        const images = userMedia?.images || [];
        
        if (images.length === 0) {
            container.innerHTML = `
                <div class="media-placeholder">
                    <i class="fas fa-images"></i>
                    <h4>No pictures yet</h4>
                    <p>Add your first picture to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = images.map(image => `
            <div class="media-item" data-id="${image.id}">
                <div class="media-item-header">
                    <div class="media-item-title">${image.title}</div>
                    <div class="media-item-actions">
                        <button class="media-item-btn edit" onclick="showImageModal('${image.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="media-item-btn delete" onclick="deleteMediaItem('${image.id}', 'images')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="image-preview">
                    <img src="${image.imageUrl}" alt="${image.title}">
                </div>
                ${image.description ? `<p class="media-description">${image.description}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error updating images UI:', error);
    }
}

function updateMusicUI() {
    try {
        const container = document.getElementById('music-container');
        if (!container) return;
        
        const musicItems = userMedia?.music || [];
        
        if (musicItems.length === 0) {
            container.innerHTML = `
                <div class="media-placeholder">
                    <i class="fas fa-music"></i>
                    <h4>No music links yet</h4>
                    <p>Add your first music link to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = musicItems.map(music => `
            <div class="media-item" data-id="${music.id}">
                <div class="media-item-header">
                    <div class="media-item-title">${music.title}</div>
                    <div class="media-item-actions">
                        <button class="media-item-btn edit" onclick="showMusicModal('${music.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="media-item-btn delete" onclick="deleteMediaItem('${music.id}', 'music')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="music-item">
                    <div class="music-platform-icon ${music.platform}">
                        <i class="${getMusicPlatformIcon(music.platform)}"></i>
                    </div>
                    <div class="music-info">
                        <div class="music-title">${music.title}</div>
                        ${music.artist ? `<div class="music-artist">${music.artist}</div>` : ''}
                    </div>
                </div>
                <a href="${music.url}" target="_blank" class="music-link">
                    <i class="fas fa-external-link-alt"></i> Listen
                </a>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error updating music UI:', error);
    }
}

function updateCatalogUI() {
    try {
        const container = document.getElementById('products-container');
        if (!container) return;
        
        if (!userCatalog || userCatalog.length === 0) {
            container.innerHTML = `
                <div class="products-placeholder">
                    <i class="fas fa-shopping-bag"></i>
                    <h4>No products yet</h4>
                    <p>Add your first product to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = userCatalog.map(product => `
            <div class="product-item" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.imageUrl || './profile-placeholder.svg'}" alt="${product.title}">
                </div>
                <div class="product-details">
                    <div class="product-title">${product.title}</div>
                    ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                    <div class="product-price">
                        ${product.price ? `${product.currency || '$'}${product.price}` : 'Free'}
                    </div>
                    <div class="product-category">${product.category || 'Other'}</div>
                </div>
                <div class="product-actions">
                    <button class="edit-button" onclick="showProductModal('${product.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-button" onclick="deleteProduct('${product.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error updating catalog UI:', error);
    }
}

// Delete Functions
function deleteMediaItem(mediaId, mediaType) {
    try {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        if (userMedia && userMedia[mediaType]) {
            userMedia[mediaType] = userMedia[mediaType].filter(item => item.id !== mediaId);
            updateMediaUI();
            showSuccess('Item deleted successfully!');
        }
        
    } catch (error) {
        console.error('Error deleting media item:', error);
        showError('Failed to delete item');
    }
}

function deleteProduct(productId) {
    try {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        if (userCatalog) {
            userCatalog = userCatalog.filter(product => product.id !== productId);
            updateCatalogUI();
            showSuccess('Product deleted successfully!');
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product');
    }
}

// Save Functions
async function handleMediaSave() {
    try {
        if (!currentUser) {
            showError('User not authenticated');
            return;
        }
        
        await db.collection('users').doc(currentUser.uid).collection('media').doc('content').set(userMedia || {});
        showSuccess('Media content saved successfully!');
        
    } catch (error) {
        console.error('Error saving media:', error);
        showError('Failed to save media content');
    }
}

async function handleCatalogSave() {
    try {
        if (!currentUser) {
            showError('User not authenticated');
            return;
        }
        
        const batch = db.batch();
        const catalogRef = db.collection('users').doc(currentUser.uid).collection('catalog');
        
        // Clear existing catalog
        const existingDocs = await catalogRef.get();
        existingDocs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Add new catalog items
        if (userCatalog && userCatalog.length > 0) {
            userCatalog.forEach(product => {
                const docRef = catalogRef.doc(product.id);
                batch.set(docRef, product);
            });
        }
        
        await batch.commit();
        showSuccess('Catalog saved successfully!');
        
    } catch (error) {
        console.error('Error saving catalog:', error);
        showError('Failed to save catalog');
    }
}

function setupMobileEnhancements() {
    // TODO: Implement mobile enhancements if needed
}

function loadTemplates() {
    try {
        console.log('Loading templates...');
        
        const templatesContainer = document.getElementById('templates-container');
        if (!templatesContainer) {
            console.error('Templates container not found');
            return;
        }

        // Clear existing content
        templatesContainer.innerHTML = '';

        // Load templates from templates.js
        if (window.BINK && window.BINK.templates && window.BINK.templates.templates) {
            const templates = window.BINK.templates.templates;
            
            Object.values(templates).forEach(template => {
                const templateCard = document.createElement('div');
                templateCard.className = 'template-card';
                templateCard.dataset.templateId = template.id;
                
                // Create preview URL for the template
                const previewUrl = `templates/${template.id}-preview.html`;
                
                // Add pro/free label
                const isPro = template.isPremium || template.tokenPrice;
                const labelClass = isPro ? 'template-label pro' : 'template-label free';
                const labelText = isPro ? 'PRO' : 'FREE';
                
                templateCard.innerHTML = `
                    <div class="${labelClass}">${labelText}</div>
                    <iframe class="template-preview" src="${previewUrl}" title="${template.name}"></iframe>
                    <div class="template-info">
                        <div class="template-title">${template.name}</div>
                        <div class="template-description">${template.description}</div>
                        <button class="template-select-btn" data-template-id="${template.id}">
                            ${selectedTemplate === template.id ? '<i class="fas fa-check"></i> Selected' : 'Select Template'}
                        </button>
                    </div>
                `;
                
                // Mark as selected if this is the user's selected template
                if (selectedTemplate === template.id) {
                    templateCard.classList.add('selected');
                    const selectBtn = templateCard.querySelector('.template-select-btn');
                    if (selectBtn) {
                        selectBtn.classList.add('selected');
                    }
                }
                
                templatesContainer.appendChild(templateCard);
            });
        } else {
            templatesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-palette"></i>
                    <h3>No Templates Available</h3>
                    <p>Please check back later for template options.</p>
                </div>
            `;
        }

        // Add event listeners after rendering all templates
        addTemplateSelectionHandlers();
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

function addTemplateSelectionHandlers() {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
        const templateId = card.dataset.templateId;
        const selectBtn = card.querySelector('.template-select-btn');
        
        // Card click handler
        card.addEventListener('click', () => {
            handleTemplateSelection(templateId);
        });
        
        // Button click handler
        if(selectBtn) {
             selectBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent card click from firing too
                handleTemplateSelection(templateId);
            });
        }
    });
}

function handleTemplateSelection(templateId) {
    try {
        const template = window.BINK.templates.templates[templateId];
        if (!template) {
            showError('Sorry, this template could not be found.');
            return;
        }

        const isPremiumTemplate = template.isPremium || (template.tokenPrice && template.tokenPrice > 0);
        const isPremiumUser = currentUserData?.isPremium || false;
        const isCreator = currentUserData?.isCreator || false;
        const usedTemplates = currentUserData?.usedTemplates || [];
        const hasUsedTemplate = usedTemplates.includes(templateId);

        if (isPremiumTemplate && !isPremiumUser && !isCreator && !hasUsedTemplate) {
            showPremiumTemplateModal(templateId);
            return;
        }

        selectTemplate(templateId);

    } catch (error) {
        console.error('Error handling template selection:', error);
    }
}

function showPremiumTemplateModal(templateId) {
    const modal = document.getElementById('premiumTemplateModal');
    const template = window.BINK.templates.templates[templateId];
    if (!modal || !template) return;

    document.getElementById('premium-template-name').textContent = template.name;
    document.getElementById('template-token-price').textContent = template.tokenPrice || 1;
    document.getElementById('user-token-balance').textContent = currentUserData?.tokens || 0;

    const useTokensButton = document.getElementById('use-tokens-button');
    useTokensButton.onclick = () => useTokenForTemplate(templateId, template.tokenPrice || 1);

    const upgradeButton = document.querySelector('#premium-modal-body .option a');
    upgradeButton.onclick = (e) => {
        e.preventDefault();
        closePremiumTemplateModal();
        showPricingModal();
    };

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closePremiumTemplateModal() {
    const modal = document.getElementById('premiumTemplateModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.body.style.overflow = 'auto';
}

function showPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.body.style.overflow = 'auto';
}

function showTokensModal() {
    const modal = document.getElementById('tokensModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeTokensModal() {
    const modal = document.getElementById('tokensModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.body.style.overflow = 'auto';
}

function selectPlan(plan, duration, price) {
    window.location.href = `payment.html?plan=${plan}&duration=${duration}&price=${price}`;
}

async function selectTokens(amount, price) {
    try {
        const purchaseRequestRef = await db.collection('tokenPurchaseRequests').add({
            userId: currentUser.uid,
            username: currentUserData.username || '',
            email: currentUser.email,
            tokenAmount: amount,
            price: price,
            currency: 'NGN',
            status: 'pending',
            isFirstPurchase: !(currentUserData.hasPurchasedTokens || false),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        window.location.href = `payment.html?purchase=${purchaseRequestRef.id}&amount=${amount}&price=${price}&type=token`;
    } catch (error) {
        console.error('Error processing token purchase:', error);
        showError('Error initiating purchase. Please try again.');
    }
}

async function useTokenForTemplate(templateId, tokenPrice = 1) {
    if (!currentUser) {
        showError("You must be logged in to use tokens.");
        return;
    }

    const currentTokens = currentUserData?.tokens || 0;

    if (currentTokens < tokenPrice) {
        showError(`You don't have enough tokens. Please buy more.`);
        closePremiumTemplateModal();
        showTokensModal();
        return;
    }

    const usedTemplates = currentUserData?.usedTemplates || [];
    if (usedTemplates.includes(templateId)) {
        selectTemplate(templateId);
        closePremiumTemplateModal();
        return;
    }
    
    const newTokenBalance = currentTokens - tokenPrice;

    try {
        await db.collection('users').doc(currentUser.uid).update({
            tokens: newTokenBalance,
            usedTemplates: firebase.firestore.FieldValue.arrayUnion(templateId)
        });

        currentUserData.tokens = newTokenBalance;
        if (currentUserData.usedTemplates) {
            currentUserData.usedTemplates.push(templateId);
        } else {
            currentUserData.usedTemplates = [templateId];
        }

        showSuccess(`Template unlocked! You have ${newTokenBalance} tokens remaining.`);
        selectTemplate(templateId, true); // Select the template visually
        closePremiumTemplateModal();

    } catch (error) {
        console.error("Error using tokens:", error);
        showError(`Error unlocking template: ${error.message}`);
    }
}

// This function just handles the visual selection part
function selectTemplate(templateId, isPurchase = false) {
        // Remove previous selection
        const previouslySelected = document.querySelector('.template-card.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
            const prevBtn = previouslySelected.querySelector('.template-select-btn');
            if (prevBtn) {
                prevBtn.textContent = 'Select Template';
                prevBtn.classList.remove('selected');
            }
        }
        
        // Select new template
        const selectedCard = document.querySelector(`[data-template-id="${templateId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            selectedTemplate = templateId;
            
            const selectedBtn = selectedCard.querySelector('.template-select-btn');
            if (selectedBtn) {
                selectedBtn.classList.add('selected');
                selectedBtn.innerHTML = '<i class="fas fa-check"></i> Selected';
            }
        }
    if(isPurchase){
        saveTemplateSelection();
    }
}

async function saveTemplateSelection() {
    try {
        if (!selectedTemplate) {
            throw new Error('No template selected');
        }
        
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        // Use Firebase v8 syntax consistently and save as 'template' to match bio.js expectations
        await db.collection('users').doc(currentUser.uid).update({
            template: selectedTemplate,
            updatedAt: new Date()
        });
        
        // Update local data
        if (currentUserData) {
            currentUserData.template = selectedTemplate;
        }
        
        console.log('Template selection saved successfully');
    } catch (error) {
        console.error('Error saving template selection:', error);
        throw error;
    }
}

function loadPreview() {
    try {
        // Load preview content for step 6
        console.log('Loading preview content...');
        console.log('Selected template:', selectedTemplate);
        console.log('Current user data:', currentUserData);
        
        // Update preview stats
        const linksCount = document.getElementById('links-count');
        const socialCount = document.getElementById('social-count');
        const mediaCount = document.getElementById('media-count');
        
        if (linksCount) {
            const links = currentUserData?.links || [];
            linksCount.textContent = links.length;
        }
        
        if (socialCount) {
            // Use currentUserData.socialLinks for consistency
            const socialCountValue = Object.keys(currentUserData?.socialLinks || {}).length;
            socialCount.textContent = socialCountValue;
        }
        
        if (mediaCount) {
            const media = currentUserData?.media || [];
            const products = currentUserData?.products || [];
            const totalMedia = media.length + products.length;
            mediaCount.textContent = totalMedia;
        }
        
        // Load bio preview iframe with template parameter
        const bioPreviewFrame = document.getElementById('bio-preview-frame');
        if (bioPreviewFrame && currentUserData?.username) {
            const templateParam = selectedTemplate ? `&t=${selectedTemplate}` : '';
            const previewUrl = `bio.html?u=${currentUserData.username}&preview=true${templateParam}`;
            console.log('Selected template:', selectedTemplate);
            console.log('Preview URL:', previewUrl);
            bioPreviewFrame.src = previewUrl;
        } else {
            console.error('Bio preview frame or username not found:', {
                bioPreviewFrame: !!bioPreviewFrame,
                username: currentUserData?.username
            });
        }
        
    } catch (error) {
        console.error('Error loading preview content:', error);
    }
}

// Complete onboarding and redirect to dashboard
async function completeOnboarding() {
    try {
        // Mark onboarding as completed
        await db.collection('users').doc(currentUser.uid).update({
            onboardingCompleted: true,
            updatedAt: new Date()
        });
        
        showSuccess('Your bio page is now live! 🎉');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error completing onboarding:', error);
        showError('Failed to complete onboarding. Please try again.');
    }
}

// Copy preview link to clipboard
function copyPreviewLink() {
    try {
        if (!currentUserData?.username) {
            showError('Username not available');
            return;
        }
        
        const bioUrl = `${window.location.origin}/bio.html?u=${currentUserData.username}`;
        
        navigator.clipboard.writeText(bioUrl).then(() => {
            showSuccess('Bio link copied to clipboard! 📋');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bioUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess('Bio link copied to clipboard! 📋');
        });
        
    } catch (error) {
        console.error('Error copying link:', error);
        showError('Failed to copy link');
    }
}

// Initialize onboarding when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeOnboarding();
    setupMobileEnhancements();
});