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

// Global variables
let currentUser = null;
let currentUserData = null;
let userLinks = [];
let linkOrderChanged = false;

// Social media platforms for the form
const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram' },
    { id: 'twitter', name: 'Twitter', icon: 'fab fa-twitter' },
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
            updatePreviewFrame(user.uid);

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
            const isPremiumUser = currentUserData.subscriptionTier === 'premium' ||
                                 currentUserData.subscriptionTier === 'creator' ||
                                 currentUserData.isPremium;

            if (isPremiumUser) {
                console.log("User has premium access - enabling all templates");
                // No need to show premium labels for premium users
                document.querySelectorAll('.template-label.premium').forEach(label => {
                    label.style.display = 'none';
                });
            }

            // Update token balance display
            const userTokens = currentUserData.tokens || 0;
            if (headerTokenCount) {
                headerTokenCount.textContent = userTokens;
            }
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

    // Truncate URL if it's too long
    let displayUrl = linkData.url;
    if (displayUrl.length > 40) {
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
        'twitter': 'fab fa-twitter',
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
        'soundcloud': 'fab fa-soundcloud',
        'behance': 'fab fa-behance',
        'dribbble': 'fab fa-dribbble',
        'website': 'fas fa-globe',
        'email': 'fas fa-envelope',
        'phone': 'fas fa-phone',
        'other': 'fas fa-link'
    };

    return icons[platform] || icons.other;
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

    // Build the preview URL with the template parameter
    let previewUrl = `bio.html?u=${username}&t=${template}`;

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

    // Include the template parameter in the preview URL
    const previewUrl = `bio.html?u=${username}&t=${template}`;

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
        const isPremiumUser = currentUserData?.subscriptionTier === 'premium' ||
                             currentUserData?.subscriptionTier === 'creator' ||
                             currentUserData?.isPremium;

        // Check if user has already purchased this template
        const usedTemplates = currentUserData?.usedTemplates || [];
        const hasUsedTemplate = usedTemplates.includes(templateId);

        if (!isPremiumUser && !hasUsedTemplate) {
            // Show premium template modal
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

    // Use only the username parameter - no template parameter
    // This way the link will always show the user's current template
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
    const prevButton = document.querySelector('.carousel-control.prev');
    const nextButton = document.querySelector('.carousel-control.next');
    const templatesScroll = document.querySelector('.templates-scroll');

    if (!prevButton || !nextButton || !templatesScroll) return;

    // Scroll amount (width of one template card + gap)
    const scrollAmount = 240; // 220px card width + 20px gap

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
});

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
        const isPremiumUser = currentUserData?.subscriptionTier === 'premium' ||
                             currentUserData?.subscriptionTier === 'creator' ||
                             currentUserData?.isPremium;

        if (template.isPremium && !isPremiumUser) {
            // Show premium template modal
            window.BINK.templates.showPremiumTemplateModal(templateId);
            return;
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

    // Add template param to preview URL
    const previewUrl = `bio.html?u=${username}&t=${templateId}`;

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
