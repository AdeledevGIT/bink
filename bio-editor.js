// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    alert("Error: Firebase not loaded. Please try refreshing.");
}

// DOM Elements
const profileForm = document.getElementById('profile-form');
const usernameDisplay = document.getElementById('username-display');
const displayNameInput = document.getElementById('displayName');
const bioInput = document.getElementById('bio');
const profilePicUrlInput = document.getElementById('profilePicUrl');
const profilePicUpload = document.getElementById('profilePicUpload');
const profilePicPreview = document.getElementById('profilePicPreview');
const profilePicImage = document.getElementById('profilePicImage');
const saveProfileButton = document.getElementById('save-profile-button');
const copyLinkButton = document.getElementById('copy-link-button');
const copyPreviewLinkButton = document.getElementById('copy-preview-link-button');
const saveBioLinkButton = document.getElementById('save-link-button');
const sidebarLogoutButton = document.getElementById('sidebar-logout');
const profileMessage = document.getElementById('profile-message');
const profileError = document.getElementById('profile-error');
const headerTokenCount = document.getElementById('header-token-count');
const linksContainer = document.getElementById('links-container');
const addLinkButton = document.getElementById('add-link-button');
const linkEditorModal = document.getElementById('link-editor-modal');
const linkForm = document.getElementById('link-form');
const linkIdInput = document.getElementById('link-id');
const linkTitleInput = document.getElementById('link-title');
const linkUrlInput = document.getElementById('link-url');
const linkPlatformInput = document.getElementById('link-platform');
const saveLinkButton = document.getElementById('save-link-button');
const deleteLinkButton = document.getElementById('delete-link-button');
const modalTitle = document.getElementById('modal-title');
const closeModal = document.querySelector('.close-modal');
const socialLinksForm = document.getElementById('social-links-form');
const saveSocialLinksButton = document.getElementById('save-social-links-button');
const previewFrame = document.getElementById('preview-frame');
const openPreviewButton = document.getElementById('open-preview-button');

// Media Tab DOM Elements
const mediaTypeButtons = document.querySelectorAll('.media-type-btn');
const mediaSections = document.querySelectorAll('.media-section');
const addYouTubeButton = document.getElementById('add-youtube-button');
const addImageButton = document.getElementById('add-image-button');
const addMusicButton = document.getElementById('add-music-button');
const saveMediaButton = document.getElementById('save-media-button');
const youtubeContainer = document.getElementById('youtube-container');
const imagesContainer = document.getElementById('images-container');
const musicContainer = document.getElementById('music-container');

// Media Modals
const youtubeModal = document.getElementById('youtube-modal');
const imageModal = document.getElementById('image-modal');
const musicModal = document.getElementById('music-modal');
const youtubeForm = document.getElementById('youtube-form');
const imageForm = document.getElementById('image-form');
const musicForm = document.getElementById('music-form');

// Catalog Tab DOM Elements
const productsContainer = document.getElementById('products-container');
const addProductButton = document.getElementById('add-product-button');
const saveCatalogButton = document.getElementById('save-catalog-button');
const productEditorModal = document.getElementById('product-editor-modal');
const productForm = document.getElementById('product-form');

// Global variables
let currentUser = null;
let currentUserData = null;
let userLinks = [];
let linkOrderChanged = false;
let userMedia = {
    youtube: [],
    images: [],
    music: []
};
let currentMediaType = 'youtube';
let editingMediaId = null;
let userCatalog = [];
let editingProductId = null;

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

// Function to display messages
function showMessage(message, isError = false) {
    const element = isError ? profileError : profileMessage;
    const otherElement = isError ? profileMessage : profileError;
    element.textContent = message;
    element.style.display = 'block';
    otherElement.style.display = 'none';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Function to clear messages
function clearMessages() {
    profileMessage.style.display = 'none';
    profileError.style.display = 'none';
}

// Template parameter handling removed

// Check authentication state
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('User authenticated:', user.uid);
            loadUserProfile(user.uid);
            loadUserLinks(user.uid);
            generateSocialLinksForm();
            loadUserMedia(user.uid);
            loadUserCatalog(user.uid);
            initializeMediaTab();
            initializeCatalogTab();
            initializeMediaCatalogToggle();
            initializeMobileEnhancements();
            updatePreviewFrame(user.uid);
            initializeProfilePictureUpload();

            // Template highlighting code removed
        } else {
            console.log('User is signed out. Redirecting to login.');
            window.location.href = 'login.html';
        }
    });
} else {
    console.error("Cannot check auth state because Firebase Auth is not loaded.");
    showMessage("Error loading user status.", true);
}

// Load user profile data
function loadUserProfile(userId) {
    const userDocRef = db.collection('users').doc(userId);
    userDocRef.get().then((doc) => {
        if (doc.exists) {
            currentUserData = doc.data();
            // Make currentUserData available globally
            window.currentUserData = currentUserData;
            console.log("Loaded user data:", currentUserData);

            // Check if user has completed onboarding
            if (!currentUserData.onboardingCompleted) {
                window.location.href = 'onboarding.html';
                return;
            }

            // Populate the form
            usernameDisplay.textContent = currentUserData.username || '';
            displayNameInput.value = currentUserData.displayName || '';
            bioInput.value = currentUserData.bio || '';
            profilePicUrlInput.value = currentUserData.profilePicUrl || '';

            // Update profile picture preview
            if (currentUserData.profilePicUrl) {
                profilePicImage.src = currentUserData.profilePicUrl;
            }

            // Update preview link
            updatePreviewLink(currentUserData.username);

            // Load bio page data
            loadBioPageData(userId);

            // Highlight template in picker
            if (currentUserData && currentUserData.template) {
                highlightSelectedTemplate(currentUserData.template);
            }

            // Check if user is premium or creator and update UI accordingly
            const isPremiumUser = checkPremiumStatus(currentUserData);

            if (isPremiumUser) {
                console.log("User has premium access - enabling all templates");
                // No need to show premium labels for premium users
                document.querySelectorAll('.template-label.premium').forEach(label => {
                    label.style.display = 'none';
                });
            } else {
                // Show premium labels for non-premium users
                updatePremiumLabels();

                // Check if user is currently using a premium template they shouldn't have access to
                enforceTemplateAccess(currentUserData);
            }

            // Update token balance display
            const userTokens = currentUserData.tokens || 0;
            if (headerTokenCount) {
                headerTokenCount.textContent = userTokens;
            }

            // Check media catalog lock
            enforceMediaCatalogLock(currentUserData);
        } else {
            console.log("No such user document!");
            showMessage("Could not load profile data.", true);
        }
    }).catch((error) => {
        console.error("Error getting user document:", error);
        showMessage(`Error loading profile: ${error.message}`, true);
    });
}

// Load bio page data (template functionality removed)
function loadBioPageData(userId) {
    const bioPageRef = db.collection('bioPages').doc(userId);
    bioPageRef.get().then((doc) => {
        if (!doc.exists) {
            // Create a new bio page document with default settings
            bioPageRef.set({
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("Created new bio page document");
            })
            .catch(error => {
                console.error("Error creating bio page document:", error);
            });
        }
    }).catch((error) => {
        console.error("Error getting bio page document:", error);
    });
}

// Load user links
function loadUserLinks(userId) {
    const linksRef = db.collection('users').doc(userId).collection('links');
    linksRef.orderBy('order').get().then((querySnapshot) => {
        // Clear links container
        linksContainer.innerHTML = '';
        userLinks = [];

        if (querySnapshot.empty) {
            linksContainer.innerHTML = '<div class="links-placeholder">No links yet. Add your first link!</div>';
            return;
        }

        // Process each link
        querySnapshot.forEach((doc) => {
            const linkData = doc.data();
            userLinks.push({
                id: doc.id,
                ...linkData
            });

            // Add link to UI
            addLinkToUI(doc.id, linkData);
        });
    }).catch((error) => {
        console.error("Error loading links:", error);
        linksContainer.innerHTML = '<div class="links-placeholder">Error loading links. Please try again.</div>';
        showMessage("Error loading links.", true);
    });
}

// Add link to UI
function addLinkToUI(linkId, linkData) {
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';
    linkItem.dataset.id = linkId;

    // Get icon for platform
    const platformIcon = getPlatformIcon(linkData.platform || 'other');

    // Format URL display - show shortened format for bio links
    let displayUrl = formatBioLinkForDisplay(linkData, currentUserData?.username);
    if (!linkData.isBioLink && displayUrl.length > 40) {
        displayUrl = displayUrl.substring(0, 37) + '...';
    }

    linkItem.innerHTML = `
        <i class="fas fa-grip-lines drag-handle"></i>
        <i class="${platformIcon} link-icon"></i>
        <div class="link-details">
            <div class="link-title">${linkData.title}</div>
            <div class="link-url" title="${linkData.url}">${displayUrl}</div>
        </div>
        <div class="link-actions">
            <button class="edit-button" title="Edit Link">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-button" title="Delete Link">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Add event listeners
    const editButton = linkItem.querySelector('.edit-button');
    const deleteButton = linkItem.querySelector('.delete-button');

    editButton.addEventListener('click', () => openLinkEditor(linkId));
    deleteButton.addEventListener('click', () => confirmDeleteLink(linkId, linkData.title));

    // Add drag and drop functionality
    linkItem.setAttribute('draggable', 'true');
    linkItem.addEventListener('dragstart', handleDragStart);
    linkItem.addEventListener('dragover', handleDragOver);
    linkItem.addEventListener('dragenter', handleDragEnter);
    linkItem.addEventListener('dragleave', handleDragLeave);
    linkItem.addEventListener('drop', handleDrop);
    linkItem.addEventListener('dragend', handleDragEnd);

    linksContainer.appendChild(linkItem);
}

// Get platform icon
function getPlatformIcon(platform) {
    const icons = {
        'instagram': 'fab fa-instagram',
        'twitter': 'fab fa-x-twitter',
        'facebook': 'fab fa-facebook',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'linkedin': 'fab fa-linkedin',
        'github': 'fab fa-github',
        'pinterest': 'fab fa-pinterest',
        'snapchat': 'fab fa-snapchat',
        'reddit': 'fab fa-reddit',
        'twitch': 'fab fa-twitch',
        'discord': 'fab fa-discord',
        'whatsapp': 'fab fa-whatsapp',
        'telegram': 'fab fa-telegram',
        'medium': 'fab fa-medium',
        'spotify': 'fab fa-spotify',
        'apple-music': 'fab fa-apple',
        'youtube-music': 'fab fa-youtube',
        'audiomack': 'fas fa-music',
        'soundcloud': 'fab fa-soundcloud',
        'bandcamp': 'fab fa-bandcamp',
        'tidal': 'fas fa-music',
        'deezer': 'fas fa-music',
        'amazon-music': 'fab fa-amazon',
        'behance': 'fab fa-behance',
        'dribbble': 'fab fa-dribbble',
        'website': 'fas fa-globe',
        'email': 'fas fa-envelope',
        'phone': 'fas fa-phone',
        'other': 'fas fa-link'
    };

    return icons[platform] || icons.other;
}

// Format bio link URL for display
function formatBioLinkForDisplay(linkData, username) {
    if (linkData.isBioLink) {
        // Use provided username, or fallback to currentUserData username, or email prefix
        const displayUsername = username ||
                               currentUserData?.username ||
                               (currentUser?.email ? currentUser.email.split('@')[0] : 'user');

        return `bink/${displayUsername}`;
    }

    return linkData.url;
}

// Open link editor modal
function openLinkEditor(linkId = null) {
    // Reset form
    linkForm.reset();

    if (linkId) {
        // Edit existing link
        const link = userLinks.find(link => link.id === linkId);
        if (link) {
            modalTitle.textContent = 'Edit Link';
            linkIdInput.value = linkId;
            linkTitleInput.value = link.title || '';
            linkUrlInput.value = link.url || '';
            linkPlatformInput.value = link.platform || 'other';
            deleteLinkButton.style.display = 'block';
        } else {
            console.error("Link not found:", linkId);
            return;
        }
    } else {
        // Add new link
        modalTitle.textContent = 'Add New Link';
        linkIdInput.value = '';
        deleteLinkButton.style.display = 'none';
    }

    // Show modal
    linkEditorModal.style.display = 'block';
}

// Close link editor modal
function closeLinkEditor() {
    linkEditorModal.style.display = 'none';
}

// Confirm delete link
function confirmDeleteLink(linkId, linkTitle) {
    if (confirm(`Are you sure you want to delete "${linkTitle}"?`)) {
        deleteLink(linkId);
    }
}

// Delete link
function deleteLink(linkId) {
    if (!currentUser) return;

    const linkRef = db.collection('users').doc(currentUser.uid).collection('links').doc(linkId);
    linkRef.delete().then(() => {
        console.log("Link deleted successfully");

        // Remove from UI
        const linkElement = document.querySelector(`.link-item[data-id="${linkId}"]`);
        if (linkElement) linkElement.remove();

        // Remove from array
        userLinks = userLinks.filter(link => link.id !== linkId);

        // Update order if needed
        if (userLinks.length > 0) {
            updateLinkOrder();
        }

        showMessage("Link deleted successfully");
        updatePreviewFrame(currentUser.uid);
    }).catch((error) => {
        console.error("Error deleting link:", error);
        showMessage(`Error deleting link: ${error.message}`, true);
    });
}

// Generate social links form
function generateSocialLinksForm() {
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

// Update preview frame
function updatePreviewFrame(userId) {
    if (!userId) return;
    const username = currentUserData?.username;
    if (!username) return;

    // Get the template from user data
    const template = currentUserData?.template || 'classic'; // Default to classic if no template is set

    // Build the preview URL with the template parameter and preview flag
    // The preview flag will be used in bio.js to prevent tracking views
    let previewUrl = `bio.html?u=${username}&t=${template}&preview=true`;

    // Update the iframe src and the open preview button href if they exist
    if (previewFrame) {
        previewFrame.src = previewUrl;
    }

    if (openPreviewButton) {
        openPreviewButton.href = previewUrl;
    }

    console.log(`Preview updated with template: ${template}`);

    // Highlight the selected template in the carousel
    highlightSelectedTemplate(template);
}

// Update preview link
function updatePreviewLink(username) {
    if (!username) return;

    // Get the template from user data or use classic as default
    const template = currentUserData?.template || 'classic';

    // Include the template parameter and preview flag in the preview URL
    const previewUrl = `bio.html?u=${username}&t=${template}&preview=true`;

    // Check if openPreviewButton exists before setting href
    if (openPreviewButton) {
        openPreviewButton.href = previewUrl;
    }

    // Update the preview frame with the same URL
    if (previewFrame) {
        previewFrame.src = previewUrl;
    }
}

// Handle template selection
function handleTemplateSelection(templateId) {
    if (!currentUser) {
        showMessage("Not authenticated. Cannot save template.", true);
        return;
    }

    // Get the template object
    const template = window.BINK.templates.getTemplateById(templateId);
    if (!template) return;

    // Check if template is premium
    if (template.isPremium) {
        // Check if user has premium access
        const isPremiumUser = checkPremiumStatus(currentUserData);

        // Check if user has already purchased this template
        const usedTemplates = currentUserData?.usedTemplates || [];
        const hasUsedTemplate = usedTemplates.includes(templateId);

        if (!isPremiumUser && !hasUsedTemplate) {
            // User doesn't have access to this premium template
            console.log(`User attempted to select premium template ${templateId} without access`);
            showMessage(`This is a premium template. You need an active premium subscription or purchase it with tokens.`, true);
            window.BINK.templates.showPremiumTemplateModal(templateId);
            return;
        }
    }

    // User has access to this template
    console.log("Template selected:", templateId);
    selectTemplate(templateId);
}

// Use tokens to unlock a premium template
function useTokenForTemplate(templateId, tokenPrice = 1) {
    if (!currentUser) return;

    // Get current token count
    const currentTokens = currentUserData?.tokens || 0;

    console.log("Current tokens:", currentTokens, "Token price:", tokenPrice);

    if (currentTokens < tokenPrice) {
        showMessage(`You don't have enough tokens. This template costs ${tokenPrice} token${tokenPrice > 1 ? 's' : ''}.`, true);
        return;
    }

    // Get used templates array
    const usedTemplates = currentUserData?.usedTemplates || [];

    // Check if template is already used
    if (usedTemplates.includes(templateId)) {
        // Already used, no need to spend tokens
        console.log("Template already used, no need to spend tokens");
        selectTemplate(templateId);
        return;
    }

    // Get template name for better messaging
    const template = window.BINK.templates.getTemplateById(templateId);
    const templateName = template ? template.name : 'premium template';

    // Calculate new token balance
    const newTokenBalance = currentTokens - tokenPrice;
    console.log("New token balance will be:", newTokenBalance);

    // Update user document
    db.collection('users').doc(currentUser.uid).update({
        tokens: newTokenBalance,
        usedTemplates: firebase.firestore.FieldValue.arrayUnion(templateId),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log(`Used ${tokenPrice} token(s) for template ${templateId}`);
        showMessage(`Successfully unlocked ${templateName}!`);

        // Update local data
        currentUserData.tokens = newTokenBalance;
        currentUserData.usedTemplates = [...usedTemplates, templateId];

        // Update token balance display
        if (headerTokenCount) {
            headerTokenCount.textContent = newTokenBalance;
        }

        // Record token usage
        recordTokenUsage(templateId, tokenPrice, templateName);

        // Select the template
        selectTemplate(templateId);
    })
    .catch(error => {
        console.error("Error using tokens:", error);
        showMessage(`Error unlocking template: ${error.message}`, true);
    });
}

// Make the function available globally so it can be called from the premium template modal
window.useTokenForTemplate = useTokenForTemplate;

// Record token usage for analytics
function recordTokenUsage(templateId, tokenAmount, templateName) {
    try {
        db.collection('tokenUsage').add({
            userId: currentUser.uid,
            templateId: templateId,
            templateName: templateName,
            tokenAmount: tokenAmount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error recording token usage:', error);
    }
}

// Make the function available to iframe content
window.handleTemplateSelection = handleTemplateSelection;

// Check if user has valid premium status (use global enforcement)
function checkPremiumStatus(userData) {
    if (!window.PremiumEnforcement) return false;

    const isPremium = window.PremiumEnforcement.checkPremiumStatus(userData);

    // If premium has expired, trigger revert to free tier
    if (!isPremium && userData && (userData.subscriptionTier === 'premium' || userData.subscriptionTier === 'creator' || userData.isPremium)) {
        revertToFreeTier(userData);
    }

    return isPremium;
}

// Revert user to free tier when premium expires (legacy function - now uses PremiumEnforcement)
function revertToFreeTier(userData) {
    if (!currentUser) return;

    console.log("Reverting user to free tier due to expired premium (legacy function)");

    // Use the new premium enforcement system if available
    if (window.PremiumEnforcement && typeof window.PremiumEnforcement.autoDowngradeExpiredSubscription === 'function') {
        window.PremiumEnforcement.autoDowngradeExpiredSubscription(currentUser.uid, userData);
        return;
    }

    // Fallback to legacy implementation
    const currentTemplate = userData.template || 'classic';
    const template = window.BINK.templates.getTemplateById(currentTemplate);
    const usedTemplates = userData.usedTemplates || [];
    const hasUsedCurrentTemplate = usedTemplates.includes(currentTemplate);

    let updateData = {
        subscriptionTier: 'free',
        isPremium: false,
        subscriptionExpired: true,
        lastSubscriptionTier: userData.subscriptionTier,
        lastSubscriptionExpiration: userData.subscriptionExpiration,
        premiumExpiredAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // If user is using a premium template they haven't purchased, revert to classic
    if (template && template.isPremium && !hasUsedCurrentTemplate) {
        updateData.template = 'classic';
        console.log("Reverting template to classic due to expired premium");
    }

    // Update user document
    db.collection('users').doc(currentUser.uid).update(updateData).then(() => {
        console.log("User reverted to free tier");
        // Update local data
        currentUserData.subscriptionTier = 'free';
        currentUserData.isPremium = false;

        // If template was changed, update local data and UI
        if (updateData.template) {
            currentUserData.template = updateData.template;
            // Highlight the new template
            highlightSelectedTemplate('classic');
            // Update preview
            updatePreviewFrameWithTemplate('classic');
        }

        // Update premium labels
        updatePremiumLabels();

        // Show message to user
        if (updateData.template) {
            showMessage("Your premium subscription has expired. Template reverted to Classic. You can still use previously unlocked premium templates.", false);
        } else {
            showMessage("Your premium subscription has expired. You can still use previously unlocked templates.", false);
        }
    }).catch(error => {
        console.error("Error reverting to free tier:", error);
    });
}

// Enforce template access - check if user should have access to their current template
function enforceTemplateAccess(userData) {
    if (!userData || !currentUser) return;

    const currentTemplate = userData.template || 'classic';
    const template = window.BINK.templates.getTemplateById(currentTemplate);

    // If current template is free, no enforcement needed
    if (!template || !template.isPremium) {
        return;
    }

    // Check if user has premium access
    const isPremiumUser = checkPremiumStatus(userData);

    // Check if user has purchased this template
    const usedTemplates = userData.usedTemplates || [];
    const hasUsedTemplate = usedTemplates.includes(currentTemplate);

    // If user doesn't have premium and hasn't purchased the template, revert to classic
    if (!isPremiumUser && !hasUsedTemplate) {
        console.log(`User doesn't have access to premium template ${currentTemplate}, reverting to classic`);

        // Update user document to revert to classic
        db.collection('users').doc(currentUser.uid).update({
            template: 'classic',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log("Template reverted to classic due to lack of access");

            // Update local data
            currentUserData.template = 'classic';

            // Update UI
            highlightSelectedTemplate('classic');
            updatePreviewFrameWithTemplate('classic');

            // Show message to user
            showMessage(`Access to ${template.name} template expired. Reverted to Classic template. You can purchase premium templates with tokens.`, true);
        }).catch(error => {
            console.error("Error reverting template:", error);
        });
    }
}

// Update premium labels on templates
function updatePremiumLabels() {
    // Get all templates and add premium labels where needed
    Object.values(window.BINK.templates.templates).forEach(template => {
        const templateCard = document.querySelector(`[data-template="${template.id}"]`)?.closest('.template-card');
        if (templateCard) {
            const labelContainer = templateCard.querySelector(`#${template.id}-label`);
            if (labelContainer) {
                if (template.isPremium) {
                    // Check if user has already used this template
                    const usedTemplates = currentUserData?.usedTemplates || [];
                    const hasUsedTemplate = usedTemplates.includes(template.id);

                    if (!hasUsedTemplate) {
                        // Show premium label with token price
                        labelContainer.innerHTML = `
                            <div class="template-label premium">
                                <i class="fas fa-crown"></i>
                                <span>PREMIUM</span>
                            </div>
                        `;
                        labelContainer.style.display = 'block';
                    } else {
                        // User has already unlocked this template
                        labelContainer.innerHTML = `
                            <div class="template-label unlocked">
                                <i class="fas fa-check"></i>
                                <span>Unlocked</span>
                            </div>
                        `;
                        labelContainer.style.display = 'block';
                    }
                } else {
                    // Show free label for free templates
                    labelContainer.innerHTML = `
                        <div class="template-label free">
                            <i class="fas fa-check-circle"></i>
                            <span>FREE</span>
                        </div>
                    `;
                    labelContainer.style.display = 'block';
                }
            }
        }
    });
}

// Save template selection to database
function saveTemplateSelection(templateId) {
    if (!currentUser) return;

    // Update both bioPages and users collections to ensure template is saved
    const bioPageRef = db.collection('bioPages').doc(currentUser.uid);
    const userRef = db.collection('users').doc(currentUser.uid);

    // Use a batch to update both documents
    const batch = db.batch();

    batch.update(bioPageRef, {
        template: templateId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.update(userRef, {
        template: templateId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.commit()
    .then(() => {
        console.log(`Template updated to ${templateId}`);
        showMessage(`Template updated successfully!`);

        // Update local data
        if (currentUserData) {
            currentUserData.template = templateId;
        }

        // Update preview
        updatePreviewFrame(currentUser.uid);

        // Update any saved bio link with the new template
        updateSavedBioLink(templateId);
    })
    .catch(error => {
        console.error("Error updating template:", error);
        showMessage(`Error saving template: ${error.message}`, true);
    });
}

// Function to update any saved bio link with the new template
function updateSavedBioLink(templateId) {
    if (!currentUser || !currentUserData || !currentUserData.username) return;

    const username = currentUserData.username;
    // Remove template parameter from URL - use only username
    const newBioUrl = `bio.html?u=${username}`;

    // Find and update any saved bio links
    const linksRef = db.collection('users').doc(currentUser.uid).collection('links');
    linksRef.where('isBioLink', '==', true).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                // Bio link exists, update it
                const bioLinkDoc = querySnapshot.docs[0];
                return linksRef.doc(bioLinkDoc.id).update({
                    url: newBioUrl,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        })
        .then(() => {
            console.log("Bio link updated");
            // Reload links to show the updated bio link
            loadUserLinks(currentUser.uid);
        })
        .catch((error) => {
            console.error("Error updating bio link:", error);
        });
}

// Handle profile picture upload
function handleProfilePicUpload(file) {
    if (!file) return Promise.resolve(null);
    if (!currentUser) return Promise.reject(new Error("Not authenticated"));

    // Check file type
    if (!file.type.match('image.*')) {
        showMessage("Please select an image file", true);
        return Promise.reject(new Error("Invalid file type"));
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage("Image file size must be less than 5MB", true);
        return Promise.reject(new Error("File too large"));
    }

    // Show loading state
    profilePicImage.src = 'profile.png';

    // Create a storage reference
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`profile-pics/${currentUser.uid}/${Date.now()}_${file.name}`);

    // Upload the file
    return fileRef.put(file)
        .then(snapshot => {
            console.log('Uploaded profile picture:', snapshot);
            return fileRef.getDownloadURL();
        })
        .then(downloadURL => {
            console.log('Profile picture URL:', downloadURL);
            profilePicUrlInput.value = downloadURL;
            profilePicImage.src = downloadURL;
            return downloadURL;
        })
        .catch(error => {
            console.error('Error uploading profile picture:', error);
            profilePicImage.src = currentUserData?.profilePicUrl || 'profile.png';
            showMessage(`Error uploading image: ${error.message}`, true);
            throw error;
        });
}

// Handle profile form submission
function handleProfileSubmit(e) {
    e.preventDefault();
    clearMessages();

    if (!currentUser) {
        showMessage("Not authenticated. Cannot save.", true);
        return;
    }

    saveProfileButton.disabled = true;
    saveProfileButton.textContent = 'Saving...';

    // Check if there's a file to upload
    const file = profilePicUpload.files[0];
    let savePromise;

    if (file) {
        // Upload the file first
        savePromise = handleProfilePicUpload(file)
            .then(downloadURL => {
                const updatedData = {
                    displayName: displayNameInput.value.trim(),
                    bio: bioInput.value.trim(),
                    profilePicUrl: downloadURL || profilePicUrlInput.value.trim(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Update Firestore document
                return db.collection('users').doc(currentUser.uid).update(updatedData)
                    .then(() => updatedData);
            });
    } else {
        // No file to upload, just save the form data
        const updatedData = {
            displayName: displayNameInput.value.trim(),
            bio: bioInput.value.trim(),
            profilePicUrl: profilePicUrlInput.value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Update Firestore document
        savePromise = db.collection('users').doc(currentUser.uid).update(updatedData)
            .then(() => updatedData);
    }

    savePromise
        .then((updatedData) => {
            console.log("Profile updated successfully!");
            showMessage("Profile saved successfully!");

            // Update local data
            currentUserData = { ...currentUserData, ...updatedData };
            // Update global variable
            window.currentUserData = currentUserData;

            // Update preview
            updatePreviewFrame(currentUser.uid);

            saveProfileButton.disabled = false;
            saveProfileButton.textContent = 'Save Profile';
        })
        .catch((error) => {
            console.error("Error updating profile: ", error);
            showMessage(`Error saving profile: ${error.message}`, true);
            saveProfileButton.disabled = false;
            saveProfileButton.textContent = 'Save Profile';
        });
}

// Handle link form submission
function handleLinkSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        alert("Not authenticated. Cannot save.");
        return;
    }

    const linkId = linkIdInput.value;
    const linkData = {
        title: linkTitleInput.value.trim(),
        url: linkUrlInput.value.trim(),
        platform: linkPlatformInput.value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Validate URL
    try {
        new URL(linkData.url);
    } catch (error) {
        alert("Please enter a valid URL including http:// or https://");
        return;
    }

    saveLinkButton.disabled = true;
    saveLinkButton.textContent = 'Saving...';

    const linksRef = db.collection('users').doc(currentUser.uid).collection('links');

    if (linkId) {
        // Update existing link
        linksRef.doc(linkId).update(linkData)
            .then(() => {
                console.log("Link updated successfully");

                // Update in array
                const index = userLinks.findIndex(link => link.id === linkId);
                if (index !== -1) {
                    userLinks[index] = { ...userLinks[index], ...linkData };
                }

                // Update UI
                loadUserLinks(currentUser.uid);

                closeLinkEditor();
                showMessage("Link updated successfully");
                updatePreviewFrame(currentUser.uid);
            })
            .catch((error) => {
                console.error("Error updating link:", error);
                alert(`Error updating link: ${error.message}`);
            })
            .finally(() => {
                saveLinkButton.disabled = false;
                saveLinkButton.textContent = 'Save Link';
            });
    } else {
        // Add new link
        linkData.order = userLinks.length;
        linkData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        linkData.clickCount = 0;

        linksRef.add(linkData)
            .then((docRef) => {
                console.log("Link added successfully with ID:", docRef.id);

                // Add to array
                userLinks.push({
                    id: docRef.id,
                    ...linkData
                });

                // Update UI
                loadUserLinks(currentUser.uid);

                closeLinkEditor();
                showMessage("Link added successfully");
                updatePreviewFrame(currentUser.uid);
            })
            .catch((error) => {
                console.error("Error adding link:", error);
                alert(`Error adding link: ${error.message}`);
            })
            .finally(() => {
                saveLinkButton.disabled = false;
                saveLinkButton.textContent = 'Save Link';
            });
    }
}

// Handle social links submission
function handleSocialLinksSubmit() {
    if (!currentUser) {
        showMessage("Not authenticated. Cannot save.", true);
        return;
    }

    saveSocialLinksButton.disabled = true;
    saveSocialLinksButton.textContent = 'Saving...';

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
        showMessage("Social links saved successfully!");

        // Update local data
        currentUserData = { ...currentUserData, socialLinks };

        // Update preview
        updatePreviewFrame(currentUser.uid);

        saveSocialLinksButton.disabled = false;
        saveSocialLinksButton.textContent = 'Save Social Links';
    })
    .catch((error) => {
        console.error("Error updating social links: ", error);
        showMessage(`Error saving social links: ${error.message}`, true);
        saveSocialLinksButton.disabled = false;
        saveSocialLinksButton.textContent = 'Save Social Links';
    });
}

// Media Tab Functions
function initializeMediaTab() {
    // Initialize media type selector
    if (mediaTypeButtons.length > 0) {
        mediaTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mediaType = button.getAttribute('data-type');
                switchMediaType(mediaType);
            });
        });
    }

    // Initialize add buttons
    if (addYouTubeButton) {
        addYouTubeButton.addEventListener('click', () => openYouTubeModal());
    }
    if (addImageButton) {
        addImageButton.addEventListener('click', () => openImageModal());
    }
    if (addMusicButton) {
        addMusicButton.addEventListener('click', () => openMusicModal());
    }
    if (saveMediaButton) {
        saveMediaButton.addEventListener('click', handleMediaSave);
    }

    // Initialize modal close buttons
    document.querySelectorAll('#youtube-modal .close-modal, #image-modal .close-modal, #music-modal .close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeMediaModals);
    });

    // Initialize forms
    if (youtubeForm) {
        youtubeForm.addEventListener('submit', handleYouTubeSubmit);
    }
    if (imageForm) {
        imageForm.addEventListener('submit', handleImageSubmit);
    }
    if (musicForm) {
        musicForm.addEventListener('submit', handleMusicSubmit);
    }

    // Initialize image preview
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImagePreview);
    }
}

function switchMediaType(mediaType) {
    currentMediaType = mediaType;

    // Update buttons
    mediaTypeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === mediaType) {
            btn.classList.add('active');
        }
    });

    // Update sections
    mediaSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${mediaType}-section`) {
            section.classList.add('active');
        }
    });
}

function loadUserMedia(userId) {
    if (!userId) return;

    const mediaRef = db.collection('users').doc(userId).collection('media');
    mediaRef.get().then((querySnapshot) => {
        // Reset media data
        userMedia = {
            youtube: [],
            images: [],
            music: []
        };

        querySnapshot.forEach((doc) => {
            const mediaData = { id: doc.id, ...doc.data() };
            const type = mediaData.type;
            if (userMedia[type]) {
                userMedia[type].push(mediaData);
            }
        });

        // Update UI
        updateMediaUI();
    }).catch((error) => {
        console.error("Error loading media:", error);
        showMessage("Error loading media content.", true);
    });
}

function updateMediaUI() {
    updateYouTubeUI();
    updateImagesUI();
    updateMusicUI();
}

function updateYouTubeUI() {
    if (!youtubeContainer) return;

    if (userMedia.youtube.length === 0) {
        youtubeContainer.innerHTML = `
            <div class="media-placeholder">
                <i class="fab fa-youtube"></i>
                <h4>No YouTube videos yet</h4>
                <p>Add your first YouTube video to get started</p>
            </div>
        `;
        return;
    }

    youtubeContainer.innerHTML = userMedia.youtube.map(video => `
        <div class="media-item" data-id="${video.id}">
            <div class="media-item-header">
                <h5 class="media-item-title">${video.title}</h5>
                <div class="media-item-actions">
                    <button class="media-item-btn edit" onclick="editYouTubeVideo('${video.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="media-item-btn delete" onclick="deleteMediaItem('${video.id}', 'youtube')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <iframe class="youtube-embed" src="https://www.youtube.com/embed/${getYouTubeVideoId(video.url)}" frameborder="0" allowfullscreen></iframe>
            ${video.description ? `<p class="media-description">${video.description}</p>` : ''}
        </div>
    `).join('');
}

function updateImagesUI() {
    if (!imagesContainer) return;

    if (userMedia.images.length === 0) {
        imagesContainer.innerHTML = `
            <div class="media-placeholder">
                <i class="fas fa-images"></i>
                <h4>No pictures yet</h4>
                <p>Add your first picture to get started</p>
            </div>
        `;
        return;
    }

    imagesContainer.innerHTML = userMedia.images.map(image => `
        <div class="media-item" data-id="${image.id}">
            <div class="media-item-header">
                <h5 class="media-item-title">${image.title}</h5>
                <div class="media-item-actions">
                    <button class="media-item-btn edit" onclick="editImage('${image.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="media-item-btn delete" onclick="deleteMediaItem('${image.id}', 'images')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <img class="image-preview" src="${image.url}" alt="${image.title}">
            ${image.description ? `<p class="media-description">${image.description}</p>` : ''}
        </div>
    `).join('');
}

function updateMusicUI() {
    if (!musicContainer) return;

    if (userMedia.music.length === 0) {
        musicContainer.innerHTML = `
            <div class="media-placeholder">
                <i class="fas fa-music"></i>
                <h4>No music links yet</h4>
                <p>Add your first music link to get started</p>
            </div>
        `;
        return;
    }

    musicContainer.innerHTML = userMedia.music.map(music => `
        <div class="media-item" data-id="${music.id}">
            <div class="media-item-header">
                <h5 class="media-item-title">${music.title}</h5>
                <div class="media-item-actions">
                    <button class="media-item-btn edit" onclick="editMusic('${music.id}')" title="Edit">
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
                    ${music.artist ? `<div class="music-artist">by ${music.artist}</div>` : ''}
                </div>
                <a href="${music.url}" target="_blank" class="media-item-btn">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    `).join('');
}

// Helper Functions
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function getMusicPlatformIcon(platform) {
    const icons = {
        'spotify': 'fab fa-spotify',
        'apple-music': 'fab fa-apple',
        'youtube-music': 'fab fa-youtube',
        'audiomack': 'fas fa-music',
        'soundcloud': 'fab fa-soundcloud',
        'bandcamp': 'fab fa-bandcamp',
        'tidal': 'fas fa-music',
        'deezer': 'fas fa-music',
        'amazon-music': 'fab fa-amazon',
        'other': 'fas fa-music'
    };
    return icons[platform] || icons.other;
}

// Modal Functions
function openYouTubeModal(videoId = null) {
    if (youtubeModal) {
        youtubeForm.reset();
        editingMediaId = videoId;

        if (videoId) {
            const video = userMedia.youtube.find(v => v.id === videoId);
            if (video) {
                document.getElementById('youtube-modal-title').textContent = 'Edit YouTube Video';
                document.getElementById('youtube-title').value = video.title;
                document.getElementById('youtube-url').value = video.url;
                document.getElementById('youtube-description').value = video.description || '';
                document.getElementById('delete-youtube-button').style.display = 'block';
            }
        } else {
            document.getElementById('youtube-modal-title').textContent = 'Add YouTube Video';
            document.getElementById('delete-youtube-button').style.display = 'none';
        }

        youtubeModal.style.display = 'block';
    }
}

function openImageModal(imageId = null) {
    if (imageModal) {
        imageForm.reset();
        editingMediaId = imageId;

        if (imageId) {
            const image = userMedia.images.find(img => img.id === imageId);
            if (image) {
                document.getElementById('image-modal-title').textContent = 'Edit Picture';
                document.getElementById('image-title').value = image.title;
                document.getElementById('image-description').value = image.description || '';
                document.getElementById('delete-image-button').style.display = 'block';
                // Remove required attribute for editing
                document.getElementById('image-upload').removeAttribute('required');
            }
        } else {
            document.getElementById('image-modal-title').textContent = 'Add Picture';
            document.getElementById('delete-image-button').style.display = 'none';
            // Add required attribute for new images
            document.getElementById('image-upload').setAttribute('required', 'required');
        }

        imageModal.style.display = 'block';
    }
}

function openMusicModal(musicId = null) {
    if (musicModal) {
        musicForm.reset();
        editingMediaId = musicId;

        if (musicId) {
            const music = userMedia.music.find(m => m.id === musicId);
            if (music) {
                document.getElementById('music-modal-title').textContent = 'Edit Music Link';
                document.getElementById('music-title').value = music.title;
                document.getElementById('music-artist').value = music.artist || '';
                document.getElementById('music-platform').value = music.platform;
                document.getElementById('music-url').value = music.url;
                document.getElementById('delete-music-button').style.display = 'block';
            }
        } else {
            document.getElementById('music-modal-title').textContent = 'Add Music Link';
            document.getElementById('delete-music-button').style.display = 'none';
        }

        musicModal.style.display = 'block';
    }
}

function closeMediaModals() {
    if (youtubeModal) youtubeModal.style.display = 'none';
    if (imageModal) imageModal.style.display = 'none';
    if (musicModal) musicModal.style.display = 'none';
    editingMediaId = null;
}

// Global functions for onclick handlers
window.editYouTubeVideo = function(videoId) {
    openYouTubeModal(videoId);
};

window.editImage = function(imageId) {
    openImageModal(imageId);
};

window.editMusic = function(musicId) {
    openMusicModal(musicId);
};

window.deleteMediaItem = function(mediaId, mediaType) {
    const item = userMedia[mediaType].find(item => item.id === mediaId);
    if (item && confirm(`Are you sure you want to delete "${item.title}"?`)) {
        deleteMedia(mediaId, mediaType);
    }
};

// Form Submission Handlers
function handleYouTubeSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('youtube-title').value.trim();
    const url = document.getElementById('youtube-url').value.trim();
    const description = document.getElementById('youtube-description').value.trim();

    if (!title || !url) {
        showMessage("Please fill in all required fields.", true);
        return;
    }

    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        showMessage("Please enter a valid YouTube URL.", true);
        return;
    }

    const videoData = {
        type: 'youtube',
        title,
        url,
        description,
        videoId,
        createdAt: editingMediaId ? undefined : firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    saveMediaItem(videoData, 'youtube');
}

function handleImageSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('image-title').value.trim();
    const description = document.getElementById('image-description').value.trim();
    const fileInput = document.getElementById('image-upload');

    if (!title) {
        showMessage("Please enter a title for the image.", true);
        return;
    }

    if (!editingMediaId && !fileInput.files[0]) {
        showMessage("Please select an image file.", true);
        return;
    }

    if (fileInput.files[0]) {
        // Upload new image
        uploadImageAndSave(fileInput.files[0], title, description);
    } else {
        // Update existing image without changing the file
        const imageData = {
            type: 'images',
            title,
            description,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        saveMediaItem(imageData, 'images');
    }
}

function handleMusicSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('music-title').value.trim();
    const artist = document.getElementById('music-artist').value.trim();
    const platform = document.getElementById('music-platform').value;
    const url = document.getElementById('music-url').value.trim();

    if (!title || !platform || !url) {
        showMessage("Please fill in all required fields.", true);
        return;
    }

    const musicData = {
        type: 'music',
        title,
        artist,
        platform,
        url,
        createdAt: editingMediaId ? undefined : firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    saveMediaItem(musicData, 'music');
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = 'none';
    }
}

function uploadImageAndSave(file, title, description) {
    if (!currentUser) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showMessage("Image file size must be less than 5MB.", true);
        return;
    }

    const saveButton = document.getElementById('save-image-button');
    saveButton.disabled = true;
    saveButton.textContent = 'Uploading...';

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `images/${currentUser.uid}/${timestamp}_${file.name}`;

    // Upload to Firebase Storage
    const storageRef = storage.ref(filename);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
        (snapshot) => {
            // Progress function
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            saveButton.textContent = `Uploading... ${Math.round(progress)}%`;
        },
        (error) => {
            // Error function
            console.error('Upload error:', error);
            showMessage(`Upload failed: ${error.message}`, true);
            saveButton.disabled = false;
            saveButton.textContent = 'Save Picture';
        },
        () => {
            // Complete function
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                const imageData = {
                    type: 'images',
                    title,
                    description,
                    url: downloadURL,
                    filename,
                    createdAt: editingMediaId ? undefined : firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                saveMediaItem(imageData, 'images');
            });
        }
    );
}

function saveMediaItem(mediaData, mediaType) {
    if (!currentUser) return;

    const mediaRef = db.collection('users').doc(currentUser.uid).collection('media');

    let savePromise;
    if (editingMediaId) {
        // Update existing item
        savePromise = mediaRef.doc(editingMediaId).update(mediaData);
    } else {
        // Add new item
        savePromise = mediaRef.add(mediaData);
    }

    savePromise.then((docRef) => {
        console.log("Media item saved successfully");
        showMessage(`${mediaType === 'youtube' ? 'Video' : mediaType === 'images' ? 'Picture' : 'Music'} saved successfully!`);

        // Update local data
        if (editingMediaId) {
            const index = userMedia[mediaType].findIndex(item => item.id === editingMediaId);
            if (index !== -1) {
                userMedia[mediaType][index] = { id: editingMediaId, ...mediaData };
            }
        } else {
            const newId = docRef ? docRef.id : editingMediaId;
            userMedia[mediaType].push({ id: newId, ...mediaData });
        }

        // Update UI
        updateMediaUI();
        closeMediaModals();

        // Reset save button
        const saveButtons = document.querySelectorAll('#save-youtube-button, #save-image-button, #save-music-button');
        saveButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = btn.id.includes('youtube') ? 'Save Video' :
                             btn.id.includes('image') ? 'Save Picture' : 'Save Music Link';
        });

    }).catch((error) => {
        console.error("Error saving media item:", error);
        showMessage(`Error saving ${mediaType}: ${error.message}`, true);

        // Reset save button
        const saveButtons = document.querySelectorAll('#save-youtube-button, #save-image-button, #save-music-button');
        saveButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = btn.id.includes('youtube') ? 'Save Video' :
                             btn.id.includes('image') ? 'Save Picture' : 'Save Music Link';
        });
    });
}

function deleteMedia(mediaId, mediaType) {
    if (!currentUser) return;

    const mediaRef = db.collection('users').doc(currentUser.uid).collection('media').doc(mediaId);

    // Get the media item to check if it's an image (for storage cleanup)
    const mediaItem = userMedia[mediaType].find(item => item.id === mediaId);

    mediaRef.delete().then(() => {
        console.log("Media item deleted successfully");
        showMessage(`${mediaType === 'youtube' ? 'Video' : mediaType === 'images' ? 'Picture' : 'Music'} deleted successfully!`);

        // If it's an image, also delete from storage
        if (mediaType === 'images' && mediaItem && mediaItem.filename) {
            storage.ref(mediaItem.filename).delete().catch((error) => {
                console.warn("Could not delete image file from storage:", error);
            });
        }

        // Remove from local data
        userMedia[mediaType] = userMedia[mediaType].filter(item => item.id !== mediaId);

        // Update UI
        updateMediaUI();

    }).catch((error) => {
        console.error("Error deleting media item:", error);
        showMessage(`Error deleting ${mediaType}: ${error.message}`, true);
    });
}

function handleMediaSave() {
    if (!currentUser) {
        showMessage("Not authenticated. Cannot save.", true);
        return;
    }

    // This function could be used for bulk operations or just show a success message
    showMessage("All media content is automatically saved!");
}

// Create a hidden textarea element for clipboard operations
const hiddenTextarea = document.createElement('textarea');
hiddenTextarea.style.position = 'fixed';
hiddenTextarea.style.opacity = '0';
hiddenTextarea.style.pointerEvents = 'none';
hiddenTextarea.style.left = '-9999px';
document.body.appendChild(hiddenTextarea);

// Function to copy text to clipboard that works on mobile
function copyTextToClipboard(text) {
    return new Promise((resolve, reject) => {
        // Try the modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(resolve)
                .catch(error => {
                    console.warn('Clipboard API failed, trying fallback method', error);
                    // Fallback for mobile devices
                    try {
                        // Set the textarea value to the text we want to copy
                        hiddenTextarea.value = text;
                        // Make the textarea visible and selectable
                        hiddenTextarea.style.position = 'fixed';
                        hiddenTextarea.style.top = '0';
                        hiddenTextarea.style.left = '0';
                        hiddenTextarea.style.opacity = '0';
                        hiddenTextarea.style.zIndex = '-1';

                        // Select the text
                        hiddenTextarea.focus();
                        hiddenTextarea.select();

                        // Execute the copy command
                        const successful = document.execCommand('copy');

                        // Reset the textarea position
                        hiddenTextarea.style.position = 'fixed';
                        hiddenTextarea.style.top = '-9999px';

                        if (successful) {
                            resolve();
                        } else {
                            reject(new Error('execCommand copy failed'));
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
        } else {
            // Fallback for browsers that don't support Clipboard API
            try {
                // Set the textarea value to the text we want to copy
                hiddenTextarea.value = text;
                // Make the textarea visible and selectable
                hiddenTextarea.style.position = 'fixed';
                hiddenTextarea.style.top = '0';
                hiddenTextarea.style.left = '0';
                hiddenTextarea.style.opacity = '0';
                hiddenTextarea.style.zIndex = '-1';

                // Select the text
                hiddenTextarea.focus();
                hiddenTextarea.select();

                // Execute the copy command
                const successful = document.execCommand('copy');

                // Reset the textarea position
                hiddenTextarea.style.position = 'fixed';
                hiddenTextarea.style.top = '-9999px';

                if (successful) {
                    resolve();
                } else {
                    reject(new Error('execCommand copy failed'));
                }
            } catch (err) {
                reject(err);
            }
        }
    });
}

// Copy link to clipboard
function copyLinkToClipboard() {
    const username = usernameDisplay.textContent;
    if (!username) return;

    const bioUrl = `bio.html?u=${username}`;

    // Get the full URL including the domain
    const fullUrl = new URL(bioUrl, window.location.origin).href;

    // Use the enhanced copy function
    copyTextToClipboard(fullUrl)
        .then(() => {
            copyLinkButton.innerHTML = '<i class="fas fa-check"></i>';
            showMessage("Bio link copied to clipboard!");
            setTimeout(() => {
                copyLinkButton.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showMessage("Failed to copy link to clipboard", true);
        });
}

// Save bio link to dashboard
function saveBioLinkToDashboard() {
    if (!currentUser) {
        showMessage("Not authenticated. Cannot save.", true);
        return;
    }

    const username = usernameDisplay.textContent;
    if (!username) {
        showMessage("Username not found. Cannot save link.", true);
        return;
    }

    // Disable button to prevent multiple clicks
    saveBioLinkButton.disabled = true;
    saveBioLinkButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    // Create link data without the template parameter
    // This way the link will always show the user's current template
    const bioLinkData = {
        title: `My BINK Profile: ${username}`,
        url: `bio.html?u=${username}`,
        platform: 'website',
        isBioLink: true,
        order: userLinks.length,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        clicks: 0
    };

    // Check if bio link already exists
    const linksRef = db.collection('users').doc(currentUser.uid).collection('links');
    linksRef.where('isBioLink', '==', true).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                // Bio link already exists, update it
                const bioLinkDoc = querySnapshot.docs[0];
                return linksRef.doc(bioLinkDoc.id).update({
                    title: bioLinkData.title,
                    url: bioLinkData.url,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Bio link doesn't exist, create it
                return linksRef.add(bioLinkData);
            }
        })
        .then(() => {
            console.log("Bio link saved successfully");
            showMessage("Bio link saved to dashboard successfully!");

            // Reload links to show the new/updated bio link
            loadUserLinks(currentUser.uid);

            // Reset button
            saveBioLinkButton.disabled = false;
            saveBioLinkButton.innerHTML = '<i class="fas fa-bookmark"></i>';
        })
        .catch((error) => {
            console.error("Error saving bio link:", error);
            showMessage(`Error saving bio link: ${error.message}`, true);

            // Reset button
            saveBioLinkButton.disabled = false;
            saveBioLinkButton.innerHTML = '<i class="fas fa-bookmark"></i>';
        });
}

// Drag and Drop Functionality
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();

    if (draggedItem !== this) {
        // Get all link items
        const items = Array.from(linksContainer.querySelectorAll('.link-item'));
        const fromIndex = items.indexOf(draggedItem);
        const toIndex = items.indexOf(this);

        // Reorder in DOM
        if (fromIndex < toIndex) {
            linksContainer.insertBefore(draggedItem, this.nextSibling);
        } else {
            linksContainer.insertBefore(draggedItem, this);
        }

        // Mark as changed
        linkOrderChanged = true;

        // Update order in database after a delay
        clearTimeout(window.updateOrderTimeout);
        window.updateOrderTimeout = setTimeout(updateLinkOrder, 1000);
    }

    this.classList.remove('drag-over');
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

// Update link order in database
function updateLinkOrder() {
    if (!currentUser || !linkOrderChanged) return;

    const items = Array.from(linksContainer.querySelectorAll('.link-item'));
    const batch = db.batch();

    items.forEach((item, index) => {
        const linkId = item.dataset.id;
        const linkRef = db.collection('users').doc(currentUser.uid).collection('links').doc(linkId);
        batch.update(linkRef, { order: index });

        // Update in array
        const linkIndex = userLinks.findIndex(link => link.id === linkId);
        if (linkIndex !== -1) {
            userLinks[linkIndex].order = index;
        }
    });

    batch.commit()
        .then(() => {
            console.log("Link order updated successfully");
            linkOrderChanged = false;
            updatePreviewFrame(currentUser.uid);
        })
        .catch((error) => {
            console.error("Error updating link order:", error);
            showMessage("Error updating link order. Please try again.", true);
        });
}

// Templates Carousel Navigation
function initTemplatesCarousel() {
    const prevButton = document.querySelector('.template-control.prev');
    const nextButton = document.querySelector('.template-control.next');
    const templatesScroll = document.querySelector('.templates-scroll');

    if (!prevButton || !nextButton || !templatesScroll) return;

    // Scroll amount (width of one template card + gap)
    const scrollAmount = 300; // 280px card width + 20px gap

    prevButton.addEventListener('click', () => {
        templatesScroll.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    nextButton.addEventListener('click', () => {
        templatesScroll.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Add keyboard navigation
    templatesScroll.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            templatesScroll.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowRight') {
            templatesScroll.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    });
}

// Profile picture preview event
if (profilePicUpload) {
    profilePicUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePicImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Allow clicking on the preview to trigger file upload
    profilePicPreview.addEventListener('click', function() {
        profilePicUpload.click();
    });
}

// Copy preview link to clipboard
function copyPreviewLinkToClipboard() {
    // Since we removed the open preview button from the UI, we'll generate the URL directly
    const username = usernameDisplay?.textContent;
    if (!username) {
        showMessage("Username not available yet", true);
        return;
    }

    // Generate the preview URL without template parameter
    // This way the link will always show the user's current template
    const previewUrl = new URL(`bio.html?u=${username}`, window.location.origin).href;

    // Use the enhanced copy function
    copyTextToClipboard(previewUrl)
        .then(() => {
            if (copyPreviewLinkButton) {
                copyPreviewLinkButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyPreviewLinkButton.innerHTML = '<i class="fas fa-copy"></i> Copy Link';
                }, 2000);
            }
            showMessage("Bio preview link copied to clipboard!");
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showMessage("Failed to copy preview link to clipboard", true);
        });
}

// Event Listeners
if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
}

if (linkForm) {
    linkForm.addEventListener('submit', handleLinkSubmit);
}

if (addLinkButton) {
    addLinkButton.addEventListener('click', () => openLinkEditor());
}

if (closeModal) {
    closeModal.addEventListener('click', closeLinkEditor);
}

if (copyLinkButton) {
    copyLinkButton.addEventListener('click', copyLinkToClipboard);
}

if (copyPreviewLinkButton) {
    copyPreviewLinkButton.addEventListener('click', copyPreviewLinkToClipboard);
}

if (saveBioLinkButton) {
    saveBioLinkButton.addEventListener('click', saveBioLinkToDashboard);
}

if (saveSocialLinksButton) {
    saveSocialLinksButton.addEventListener('click', handleSocialLinksSubmit);
}

// Initialize templates carousel
document.addEventListener('DOMContentLoaded', () => {
    initTemplatesCarousel();
    initTemplateLabels();
    initializeTabNavigation();
    initializeCharacterCounter();
    initializeMessageSystem();

    // Initialize premium labels for non-logged in users
    setTimeout(() => {
        updatePremiumLabels();
    }, 500);

    // Set up periodic check for premium access (every 30 seconds)
    setInterval(() => {
        if (currentUser && currentUserData) {
            const isPremiumUser = checkPremiumStatus(currentUserData);
            if (!isPremiumUser) {
                enforceTemplateAccess(currentUserData);
            }
        }
    }, 30000);
});

// Tab Navigation System
function initializeTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Prevent access to Media/Catalog for non-premium users
            if (targetTab === 'media') {
                const isPremiumUser = checkPremiumStatus(currentUserData);
                if (!isPremiumUser) {
                    showMessage("Media & Catalog is a premium feature. Please upgrade to Pro to add media and sell on your bio.", true);
                    return; // Stop the function here
                }
            }

            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Special handling for templates tab
            if (targetTab === 'templates') {
                setTimeout(() => {
                    initTemplatesCarousel();
                }, 100);
            }
        });
    });
}

// Character Counter for Bio
function initializeCharacterCounter() {
    const bioTextarea = document.getElementById('bio');
    const charCounter = document.getElementById('bio-char-count');

    if (bioTextarea && charCounter) {
        bioTextarea.addEventListener('input', () => {
            const currentLength = bioTextarea.value.length;
            charCounter.textContent = currentLength;

            // Change color based on character count
            if (currentLength > 450) {
                charCounter.style.color = '#ef4444';
            } else if (currentLength > 400) {
                charCounter.style.color = '#f59e0b';
            } else {
                charCounter.style.color = 'var(--text-muted)';
            }
        });

        // Initialize counter
        charCounter.textContent = bioTextarea.value.length;
    }
}

// Message System
function initializeMessageSystem() {
    // Override the existing showMessage function to use the new message system
    window.showMessage = function(message, isError = false) {
        const messageContainer = document.getElementById('message-container');
        const successMessage = document.getElementById('success-message');
        const errorMessage = document.getElementById('error-message');

        if (!messageContainer || !successMessage || !errorMessage) return;

        // Hide any existing messages
        successMessage.classList.remove('show');
        errorMessage.classList.remove('show');

        setTimeout(() => {
            const targetMessage = isError ? errorMessage : successMessage;
            const messageText = targetMessage.querySelector('.message-text');

            messageText.textContent = message;
            targetMessage.style.display = 'flex';

            setTimeout(() => {
                targetMessage.classList.add('show');
            }, 10);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                targetMessage.classList.remove('show');
                setTimeout(() => {
                    targetMessage.style.display = 'none';
                }, 300);
            }, 5000);
        }, 100);
    };
}

// Enhanced Profile Picture Upload
function initializeProfilePictureUpload() {
    const profilePicPreview = document.getElementById('profilePicPreview');
    const profilePicUpload = document.getElementById('profilePicUpload');
    const profilePicImage = document.getElementById('profilePicImage');

    if (profilePicPreview && profilePicUpload && profilePicImage) {
        profilePicPreview.addEventListener('click', () => {
            profilePicUpload.click();
        });

        profilePicUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Show loading state
                profilePicPreview.style.opacity = '0.7';

                try {
                    const imageUrl = await uploadProfilePicture(file);
                    profilePicImage.src = imageUrl;
                    document.getElementById('profilePicUrl').value = imageUrl;
                    showMessage('Profile picture updated successfully!');
                } catch (error) {
                    console.error('Error uploading profile picture:', error);
                    showMessage('Error uploading profile picture. Please try again.', true);
                } finally {
                    profilePicPreview.style.opacity = '1';
                }
            }
        });
    }
}



// Template selection buttons (now just for preview)
const templateButtons = document.querySelectorAll('.template-select-btn');
templateButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const templateId = button.getAttribute('data-template');

        // Get the template object
        const template = window.BINK.templates.getTemplateById(templateId);
        if (!template) return;

        // Highlight the selected template in the carousel
        highlightSelectedTemplate(templateId);

        // Update the preview with the selected template
        updatePreviewFrameWithTemplate(templateId);

        // Show message
        showMessage(`Template "${template.name}" is now in preview. Click "Use This Template" to apply it.`);
    });
});

// Use Template button
const useTemplateButton = document.getElementById('use-template-button');
if (useTemplateButton) {
    useTemplateButton.addEventListener('click', () => {
        // Get the current template ID from the preview frame URL
        const previewUrl = new URL(previewFrame.src);
        const templateId = previewUrl.searchParams.get('t');

        if (!templateId) {
            showMessage("No template selected for preview.", true);
            return;
        }

        // Get the template object
        const template = window.BINK.templates.getTemplateById(templateId);
        if (!template) {
            showMessage("Invalid template selected.", true);
            return;
        }

        // Check if it's a premium template and user is not premium or creator
        const isPremiumUser = checkPremiumStatus(currentUserData);

        if (template.isPremium && !isPremiumUser) {
            // For premium templates, user must either be premium or have purchased the template
            const usedTemplates = currentUserData?.usedTemplates || [];
            const hasUsedTemplate = usedTemplates.includes(templateId);

            if (!hasUsedTemplate) {
                // User doesn't have access to this premium template
                console.log(`User attempted to save premium template ${templateId} without access`);
                showMessage(`You don't have access to this premium template. Please purchase it with tokens or upgrade to premium.`, true);
                window.BINK.templates.showPremiumTemplateModal(templateId);
                return;
            }
            // If user has purchased the template, they can still use it even after premium expires
        }

        // Save the template selection to the database
        saveTemplateSelection(templateId);

        // Show success message
        showMessage(`Template "${template.name}" has been applied to your bio page!`);
    });
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === linkEditorModal) {
        closeLinkEditor();
    }
});

// Sidebar Logout Button Logic
if (sidebarLogoutButton && auth) {
    sidebarLogoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out successfully.');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error:', error);
            showMessage(`Failed to log out: ${error.message}`, true);
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load social links when user data is loaded
    if (currentUserData) {
        loadSocialLinks();
    }
});

// Highlight selected template in the picker
function highlightSelectedTemplate(templateId) {
    if (!templateId) return;

    console.log(`Highlighting template: ${templateId}`);

    // Remove 'selected' class from all template cards
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Find the button for the selected template
    const btn = document.querySelector(`.template-select-btn[data-template="${templateId}"]`);
    if (btn) {
        // Add 'selected' class to the parent card
        const card = btn.closest('.template-card');
        if (card) {
            card.classList.add('selected');

            // Scroll the template into view if it's not visible
            const templatesScroll = document.querySelector('.templates-scroll');
            if (templatesScroll) {
                const cardRect = card.getBoundingClientRect();
                const scrollRect = templatesScroll.getBoundingClientRect();

                if (cardRect.left < scrollRect.left || cardRect.right > scrollRect.right) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        }
    } else {
        console.warn(`Template button for ${templateId} not found`);
    }
}

// Make highlightSelectedTemplate available globally
window.highlightSelectedTemplate = highlightSelectedTemplate;

function updatePreviewFrameWithTemplate(templateId) {
    const username = usernameDisplay?.textContent;
    if (!username) return;

    // Add template param to preview URL with preview flag to prevent view tracking
    const previewUrl = `bio.html?u=${username}&t=${templateId}&preview=true`;

    // Check if elements exist before setting properties
    if (previewFrame) {
        previewFrame.src = previewUrl;
    }

    if (openPreviewButton) {
        openPreviewButton.href = previewUrl;
    }
}

// Make updatePreviewFrameWithTemplate available globally
window.updatePreviewFrameWithTemplate = updatePreviewFrameWithTemplate;

// Initialize template labels
function initTemplateLabels() {
    // Get all template IDs
    const templateIds = Object.keys(window.BINK.templates.templates);

    // For each template, create and insert its label
    templateIds.forEach(templateId => {
        const labelContainer = document.getElementById(`${templateId}-label`);
        if (labelContainer) {
            const template = window.BINK.templates.getTemplateById(templateId);
            if (template) {
                const labelHtml = window.BINK.templates.createTemplateLabel(template);
                labelContainer.innerHTML = labelHtml;
            }
        }
    });
}

// Select template and save to database
function selectTemplate(templateId) {
    if (!currentUser) return;

    // Highlight the selected template
    highlightSelectedTemplate(templateId);

    // Update preview with the selected template
    updatePreviewFrameWithTemplate(templateId);

    // Save the template selection to database
    saveTemplateSelection(templateId);
}

// Catalog Tab Functions
function initializeCatalogTab() {
    // Initialize add product button
    if (addProductButton) {
        addProductButton.addEventListener('click', () => openProductEditor());
    }
    if (saveCatalogButton) {
        saveCatalogButton.addEventListener('click', handleCatalogSave);
    }

    // Initialize product form
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Initialize modal close functionality
    const productModalCloseBtn = productEditorModal?.querySelector('.close-modal');
    if (productModalCloseBtn) {
        productModalCloseBtn.addEventListener('click', closeProductEditor);
    }

    // Initialize image preview for product form
    const productImageUpload = document.getElementById('product-image-upload');
    const productImageUrl = document.getElementById('product-image-url');
    const productPreview = document.getElementById('product-preview');
    const productPreviewContainer = document.getElementById('product-preview-container');

    if (productImageUpload) {
        productImageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    productPreview.src = e.target.result;
                    productPreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (productImageUrl) {
        productImageUrl.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                productPreview.src = url;
                productPreviewContainer.style.display = 'block';
            } else {
                productPreviewContainer.style.display = 'none';
            }
        });
    }
}

function loadUserCatalog(userId) {
    if (!userId) return;

    const catalogRef = db.collection('users').doc(userId).collection('catalog');
    catalogRef.orderBy('createdAt', 'desc').get().then((querySnapshot) => {
        userCatalog = [];

        querySnapshot.forEach((doc) => {
            const productData = { id: doc.id, ...doc.data() };
            userCatalog.push(productData);
        });

        // Update UI
        updateCatalogUI();
    }).catch((error) => {
        console.error("Error loading catalog:", error);
        showMessage("Error loading catalog content.", true);
    });
}

function updateCatalogUI() {
    if (!productsContainer) return;

    if (userCatalog.length === 0) {
        productsContainer.innerHTML = `
            <div class="products-placeholder">
                <i class="fas fa-shopping-bag"></i>
                <h4>No products yet</h4>
                <p>Add your first product to get started</p>
            </div>
        `;
        return;
    }

    productsContainer.innerHTML = userCatalog.map(product => {
        // Display price with currency if available
        let displayPrice = '';
        if (product.price) {
            displayPrice = product.price;
        } else if (product.priceAmount) {
            // For backward compatibility, construct price from separate fields
            if (product.currency && product.priceAmount.toLowerCase() !== 'free') {
                displayPrice = product.currency + product.priceAmount;
            } else {
                displayPrice = product.priceAmount;
            }
        }

        return `
            <div class="product-item" data-id="${product.id}">
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" class="product-image">` : ''}
                <div class="product-details">
                    <h4 class="product-title">${product.title}</h4>
                    ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                    ${displayPrice ? `<div class="product-price">${displayPrice}</div>` : ''}
                    <div class="product-category">${product.category || 'Other'}</div>
                </div>
                <div class="product-actions">
                    <button class="edit-button" onclick="editProduct('${product.id}')" title="Edit Product">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-button" onclick="deleteProduct('${product.id}', '${product.title}')" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function openProductEditor(productId = null) {
    // Reset form
    if (productForm) productForm.reset();

    const modalTitle = productEditorModal?.querySelector('#product-modal-title');
    const deleteButton = document.getElementById('delete-product-button');

    if (productId) {
        // Edit existing product
        const product = userCatalog.find(p => p.id === productId);
        if (product) {
            if (modalTitle) modalTitle.textContent = 'Edit Product';
            document.getElementById('product-id').value = productId;
            document.getElementById('product-title').value = product.title || '';
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-price').value = product.priceAmount || '';
            document.getElementById('product-currency').value = product.currency || '$';
            document.getElementById('product-image-url').value = product.imageUrl || '';
            document.getElementById('product-buy-link').value = product.buyLink || '';
            document.getElementById('product-category').value = product.category || 'other';

            if (deleteButton) deleteButton.style.display = 'block';

            // Show image preview if URL exists
            if (product.imageUrl) {
                const productPreview = document.getElementById('product-preview');
                const productPreviewContainer = document.getElementById('product-preview-container');
                if (productPreview && productPreviewContainer) {
                    productPreview.src = product.imageUrl;
                    productPreviewContainer.style.display = 'block';
                }
            }
        }
        editingProductId = productId;
    } else {
        // Add new product
        if (modalTitle) modalTitle.textContent = 'Add New Product';
        if (deleteButton) deleteButton.style.display = 'none';
        editingProductId = null;
    }

    // Show modal
    if (productEditorModal) {
        productEditorModal.style.display = 'block';
    }
}

function closeProductEditor() {
    if (productEditorModal) {
        productEditorModal.style.display = 'none';
    }
    editingProductId = null;
}

function handleProductSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        showMessage("Not authenticated. Cannot save.", true);
        return;
    }

    const saveButton = document.getElementById('save-product-button');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
    }

    const priceAmount = document.getElementById('product-price').value.trim();
    const currency = document.getElementById('product-currency').value;

    // Combine currency and price amount
    let displayPrice = '';
    if (priceAmount) {
        if (currency && priceAmount.toLowerCase() !== 'free') {
            displayPrice = currency + priceAmount;
        } else {
            displayPrice = priceAmount;
        }
    }

    const productData = {
        title: document.getElementById('product-title').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        price: displayPrice,
        priceAmount: priceAmount,
        currency: currency,
        buyLink: document.getElementById('product-buy-link').value.trim(),
        category: document.getElementById('product-category').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Validate required fields
    if (!productData.title || !productData.buyLink) {
        showMessage("Product name and buy link are required.", true);
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Product';
        }
        return;
    }

    // Validate URL
    try {
        new URL(productData.buyLink);
    } catch (error) {
        showMessage("Please enter a valid buy link URL including http:// or https://", true);
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Product';
        }
        return;
    }

    // Handle image upload or URL
    const imageFile = document.getElementById('product-image-upload').files[0];
    const imageUrl = document.getElementById('product-image-url').value.trim();

    if (imageFile) {
        // Upload image file
        handleProductImageUpload(imageFile, productData, saveButton);
    } else if (imageUrl) {
        // Use provided URL
        productData.imageUrl = imageUrl;
        saveProductData(productData, saveButton);
    } else {
        // No image
        saveProductData(productData, saveButton);
    }
}

function handleProductImageUpload(file, productData, saveButton) {
    if (!storage) {
        showMessage("Storage not available. Please try again.", true);
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Product';
        }
        return;
    }

    const fileName = `products/${currentUser.uid}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref().child(fileName);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
        (snapshot) => {
            // Progress function
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (saveButton) {
                saveButton.textContent = `Uploading... ${Math.round(progress)}%`;
            }
        },
        (error) => {
            // Error function
            console.error("Upload error:", error);
            showMessage(`Upload failed: ${error.message}`, true);
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Save Product';
            }
        },
        () => {
            // Complete function
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                productData.imageUrl = downloadURL;
                saveProductData(productData, saveButton);
            });
        }
    );
}

function saveProductData(productData, saveButton) {
    const catalogRef = db.collection('users').doc(currentUser.uid).collection('catalog');

    let savePromise;
    if (editingProductId) {
        // Update existing product
        savePromise = catalogRef.doc(editingProductId).update(productData);
    } else {
        // Add new product
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        savePromise = catalogRef.add(productData);
    }

    savePromise.then((docRef) => {
        console.log("Product saved successfully");
        showMessage(`Product ${editingProductId ? 'updated' : 'added'} successfully!`);

        // Update local data
        if (editingProductId) {
            const index = userCatalog.findIndex(p => p.id === editingProductId);
            if (index !== -1) {
                userCatalog[index] = { id: editingProductId, ...productData };
            }
        } else {
            const newId = docRef ? docRef.id : editingProductId;
            userCatalog.push({ id: newId, ...productData });
        }

        // Update UI
        updateCatalogUI();
        updatePreviewFrame(currentUser.uid);
        closeProductEditor();
    }).catch((error) => {
        console.error("Error saving product:", error);
        showMessage(`Error saving product: ${error.message}`, true);
    }).finally(() => {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Product';
        }
    });
}

function handleCatalogSave() {
    // This function can be used for any additional catalog-level operations
    // For now, individual products are saved automatically
    showMessage("Catalog is up to date!");
    updatePreviewFrame(currentUser.uid);
}

// Global functions for onclick handlers
window.editProduct = function(productId) {
    openProductEditor(productId);
};

window.deleteProduct = function(productId, productTitle) {
    if (confirm(`Are you sure you want to delete "${productTitle}"?`)) {
        deleteProductFromFirebase(productId);
    }
};

function deleteProductFromFirebase(productId) {
    if (!currentUser) return;

    const productRef = db.collection('users').doc(currentUser.uid).collection('catalog').doc(productId);
    productRef.delete().then(() => {
        console.log("Product deleted successfully");
        showMessage("Product deleted successfully");

        // Remove from local array
        userCatalog = userCatalog.filter(p => p.id !== productId);

        // Update UI
        updateCatalogUI();
        updatePreviewFrame(currentUser.uid);
    }).catch((error) => {
        console.error("Error deleting product:", error);
        showMessage(`Error deleting product: ${error.message}`, true);
    });
}

// Initialize Media-Catalog Toggle Functionality
function initializeMediaCatalogToggle() {
    const mediaToggleBtn = document.getElementById('media-toggle-btn');
    const catalogToggleBtn = document.getElementById('catalog-toggle-btn');
    const mediaContentSection = document.getElementById('media-content-section');
    const catalogContentSection = document.getElementById('catalog-content-section');
    const mediaHeaderContent = document.getElementById('media-header-content');
    const catalogHeaderContent = document.getElementById('catalog-header-content');

    if (!mediaToggleBtn || !catalogToggleBtn || !mediaContentSection || !catalogContentSection) {
        console.error('Media-Catalog toggle elements not found');
        return;
    }

    // Media toggle button click handler
    mediaToggleBtn.addEventListener('click', () => {
        // Update button states
        mediaToggleBtn.classList.add('active');
        catalogToggleBtn.classList.remove('active');

        // Show/hide content sections
        mediaContentSection.style.display = 'block';
        catalogContentSection.style.display = 'none';

        // Show/hide header content
        if (mediaHeaderContent) mediaHeaderContent.style.display = 'block';
        if (catalogHeaderContent) catalogHeaderContent.style.display = 'none';
    });

    // Catalog toggle button click handler
    catalogToggleBtn.addEventListener('click', () => {
        // Update button states
        catalogToggleBtn.classList.add('active');
        mediaToggleBtn.classList.remove('active');

        // Show/hide content sections
        catalogContentSection.style.display = 'block';
        mediaContentSection.style.display = 'none';

        // Show/hide header content
        if (catalogHeaderContent) catalogHeaderContent.style.display = 'block';
        if (mediaHeaderContent) mediaHeaderContent.style.display = 'none';
    });
}

// Initialize Mobile Enhancements
function initializeMobileEnhancements() {
    // Add touch-friendly interactions
    addTouchSupport();

    // Improve navigation for mobile
    improveMobileNavigation();

    // Add mobile-specific event listeners
    addMobileEventListeners();
}

// Add touch support for better mobile interaction
function addTouchSupport() {
    // Add touch class to body for CSS targeting
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }

    // Improve button tap targets
    const buttons = document.querySelectorAll('button, .nav-tab, .toggle-btn');
    buttons.forEach(button => {
        button.style.minHeight = '44px'; // iOS recommended minimum
        button.style.minWidth = '44px';
    });
}

// Improve mobile navigation
function improveMobileNavigation() {
    const navTabs = document.querySelector('.nav-tabs');
    if (!navTabs) return;

    // Add scroll indicators for mobile nav
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'nav-scroll-indicator';
    scrollIndicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
    navTabs.parentNode.appendChild(scrollIndicator);

    // Show/hide scroll indicator based on scroll position
    navTabs.addEventListener('scroll', () => {
        const isScrollable = navTabs.scrollWidth > navTabs.clientWidth;
        const isAtEnd = navTabs.scrollLeft >= (navTabs.scrollWidth - navTabs.clientWidth - 10);

        if (isScrollable && !isAtEnd) {
            scrollIndicator.style.display = 'block';
        } else {
            scrollIndicator.style.display = 'none';
        }
    });

    // Initial check
    setTimeout(() => {
        navTabs.dispatchEvent(new Event('scroll'));
    }, 100);
}

// Add mobile-specific event listeners
function addMobileEventListeners() {
    // Prevent zoom on double tap for form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('touchend', (e) => {
            e.preventDefault();
            input.focus();
        });
    });

    // Add swipe support for toggle buttons
    addSwipeSupport();

    // Improve modal handling on mobile
    improveMobileModals();
}

// Add swipe support for media-catalog toggle
function addSwipeSupport() {
    const mediaContentSection = document.getElementById('media-content-section');
    const catalogContentSection = document.getElementById('catalog-content-section');

    if (!mediaContentSection || !catalogContentSection) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (!startX || !startY) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;

        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // Only trigger if horizontal swipe is more significant than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const mediaToggleBtn = document.getElementById('media-toggle-btn');
            const catalogToggleBtn = document.getElementById('catalog-toggle-btn');

            if (deltaX > 0) {
                // Swipe right - go to media
                if (mediaToggleBtn && !mediaToggleBtn.classList.contains('active')) {
                    mediaToggleBtn.click();
                }
            } else {
                // Swipe left - go to catalog
                if (catalogToggleBtn && !catalogToggleBtn.classList.contains('active')) {
                    catalogToggleBtn.click();
                }
            }
        }

        startX = 0;
        startY = 0;
    };

    // Add touch events to both sections
    [mediaContentSection, catalogContentSection].forEach(section => {
        section.addEventListener('touchstart', handleTouchStart, { passive: true });
        section.addEventListener('touchend', handleTouchEnd, { passive: true });
    });
}

// Improve modal handling on mobile
function improveMobileModals() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        // Prevent background scroll when modal is open
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    const isVisible = modal.style.display === 'block';
                    if (isVisible) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            });
        });

        observer.observe(modal, { attributes: true });

        // Close modal on background tap (mobile-friendly)
        modal.addEventListener('touchstart', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// ... existing code ...
function enforceMediaCatalogLock(userData) {
    const isPremium = userData?.isPremium || false;
    const isCreator = userData?.isCreator || false;
    const lockOverlay = document.getElementById('media-catalog-lock-overlay');
    if (!isPremium && !isCreator && lockOverlay) {
        lockOverlay.style.display = 'flex';
    } else if (lockOverlay) {
        lockOverlay.style.display = 'none';
    }
}
function enforceSectionLocks(userData) {
    const isPremium = userData?.isPremium || false;
    const isCreator = userData?.isCreator || false;
    // Media section
    const mediaLock = document.getElementById('media-lock-message');
    const mediaSection = document.getElementById('media-content-section');
    if (mediaLock && mediaSection) {
        if (!isPremium && !isCreator) {
            mediaLock.style.display = 'flex';
            // Optionally hide or disable media controls
            Array.from(mediaSection.querySelectorAll('.media-manager, .media-actions, .media-type-selector, .media-section')).forEach(el => el.style.display = 'none');
        } else {
            mediaLock.style.display = 'none';
            Array.from(mediaSection.querySelectorAll('.media-manager, .media-actions, .media-type-selector, .media-section')).forEach(el => el.style.display = '');
        }
    }
    // Catalog section
    const catalogLock = document.getElementById('catalog-lock-message');
    const catalogSection = document.getElementById('catalog-content-section');
    if (catalogLock && catalogSection) {
        if (!isPremium && !isCreator) {
            catalogLock.style.display = 'flex';
            Array.from(catalogSection.querySelectorAll('.catalog-manager, .catalog-actions')).forEach(el => el.style.display = 'none');
        } else {
            catalogLock.style.display = 'none';
            Array.from(catalogSection.querySelectorAll('.catalog-manager, .catalog-actions')).forEach(el => el.style.display = '');
        }
    }
}
function isProUser(userData) {
    return userData?.isPremium || userData?.isCreator;
}
async function saveMediaItem(mediaData, mediaType) {
    if (!isProUser(currentUserData)) {
        showMessage('Upgrade to Pro to use Media features.', true);
        return;
    }
}
async function saveProductData(productData, saveButton) {
    if (!isProUser(currentUserData)) {
        showMessage('Upgrade to Pro to use Catalog features.', true);
        return;
    }
}




