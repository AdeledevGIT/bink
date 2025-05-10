// Ensure Firebase config is loaded
if (typeof firebase === 'undefined' || firebase === null) {
    console.error("Firebase is not initialized. Make sure firebase-config.js is loaded correctly.");
}

// Initialize Firebase Analytics if available
let analytics = null;
if (typeof firebase !== 'undefined' && firebase.analytics) {
    analytics = firebase.analytics();
    console.log("Firebase Analytics initialized");
}

// Get username from URL
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('u');
const templateOverride = urlParams.get('t');

// DOM elements
const bioRoot = document.getElementById('bio-root');

// Social media platform icons mapping
const socialMediaIcons = {
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

// Function to load user profile and links
async function loadUserProfile() {
    if (!username) {
        displayError("No username specified");
        return;
    }

    if (!db) {
        displayError("Database connection not available");
        return;
    }

    try {
        // Find user by username
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('username', '==', username).get();

        if (querySnapshot.empty) {
            displayError("User not found");
            return;
        }

        // Get user data
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        userData.id = userDoc.id; // Add id for later use

        // Update profile information (now dynamic)
        updateProfileInfo(userData);

        // Track page view in Firestore and analytics
        try {
            // Get visitor's location
            const geoData = await getVisitorLocation();
            console.log("Visitor location data:", geoData);

            // Update the bioPage document to increment views
            const bioPageRef = db.collection('bioPages').doc(userDoc.id);
            await bioPageRef.update({
                views: firebase.firestore.FieldValue.increment(1),
                lastViewedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log("Page view tracked in Firestore");

            // Record click with location data
            const clickData = {
                userId: userDoc.id,
                bioUsername: username,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                referrer: document.referrer || 'direct',
                userAgent: navigator.userAgent,
                geo: geoData
            };

            // Add to clicks collection
            await db.collection('clicks').add(clickData);
            console.log("Click with location data recorded");

            // Also track in Firebase Analytics if available
            if (analytics) {
                analytics.logEvent('bio_page_view', {
                    username: username,
                    userId: userDoc.id,
                    country: geoData.country || 'unknown',
                    city: geoData.city || 'unknown'
                });
            }
        } catch (error) {
            console.error("Error tracking page view:", error);
            // Create bioPage document if it doesn't exist
            try {
                const bioPageRef = db.collection('bioPages').doc(userDoc.id);
                await bioPageRef.set({
                    views: 1,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastViewedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log("Created bioPage document and tracked view");

                // Still try to record click without location data
                const clickData = {
                    userId: userDoc.id,
                    bioUsername: username,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    referrer: document.referrer || 'direct',
                    userAgent: navigator.userAgent
                };

                await db.collection('clicks').add(clickData);
                console.log("Click recorded without location data");
            } catch (setError) {
                console.error("Error creating bioPage document:", setError);
            }
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        displayError("Error loading profile");
    }
}

// Function to update profile information
function updateProfileInfo(userData) {
    // Use override if present, but make it optional
    // If templateOverride is provided, use it (for preview purposes)
    // Otherwise, use the user's stored template from their profile
    let templateToUse = templateOverride || userData.template;
    if (templateToUse && window.BINK && window.BINK.templates) {
        userData.template = templateToUse;
        renderTemplate(userData);
    } else {
        renderClassicTemplate(userData);
    }
}

// Function to render the selected template
function renderTemplate(userData) {
    const templateId = userData.template;
    const templateObj = window.BINK.templates.templates[templateId];
    if (!templateObj) {
        renderClassicTemplate(userData);
        return;
    }

    // Check if template is premium and if user has access
    // Only check if not in preview mode (templateOverride)
    if (templateObj.isPremium && !templateOverride) {
        // Check if user has premium access or has purchased this template
        const userHasPremiumAccess = userData.plan === 'premium' || userData.plan === 'creator';
        const userHasPurchasedTemplate = Array.isArray(userData.usedTemplates) && userData.usedTemplates.includes(templateId);

        if (!userHasPremiumAccess && !userHasPurchasedTemplate) {
            console.log("User doesn't have access to premium template. Using classic template instead.");
            renderClassicTemplate(userData);
            return;
        }
    }

    // Load template CSS if not already loaded
    if (!document.getElementById('template-css-' + templateId)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = templateObj.css;
        link.id = 'template-css-' + templateId;
        document.head.appendChild(link);
    }

    // Gather links and socialLinks
    // We'll load links after userData is set, so pass empty for now
    bioRoot.innerHTML = templateObj.render({
        displayName: userData.displayName || userData.username,
        username: userData.username,
        bio: userData.bio,
        profilePicUrl: userData.profilePicUrl,
        links: [], // will be filled after loadUserLinks
        socialLinks: userData.socialLinks || {}
    });

    // After links are loaded, update the template
    loadUserLinks(userData.id, templateObj, userData);
}

// Function to render the classic template (fallback)
function renderClassicTemplate(userData) {
    bioRoot.innerHTML = `
        <div class="bio-page">
            <div class="bio-container">
                <div class="bio-header">
                    <div class="profile-image-container">
                        <img id="profile-image" src="${userData.profilePicUrl || 'profile.png'}" alt="Profile Image">
                    </div>
                    <div class="bio-header-content">
                        <h1 id="display-name">${userData.displayName || userData.username}</h1>
                        <p id="bio-text" class="bio-description">${userData.bio || ''}</p>
                    </div>
                </div>
                <div class="links-container" id="links-container"></div>
                <div class="social-icons" id="social-icons"></div>
                <footer class="bio-footer">
                    <p>Powered by <a href="index.html" target="_blank">BINK</a></p>
                </footer>
            </div>
        </div>
    `;
    // After links are loaded, update the classic template
    loadUserLinks(userData.id, null, userData);
}

// Function to load user links
async function loadUserLinks(userId, templateObj = null, userData = null) {
    try {
        const linksRef = db.collection('users').doc(userId).collection('links');
        const querySnapshot = await linksRef.orderBy('order').get();

        const links = [];
        querySnapshot.forEach((doc) => {
            links.push({ ...doc.data(), id: doc.id });
        });

        if (templateObj && userData) {
            // Re-render the template with links
            bioRoot.innerHTML = templateObj.render({
                displayName: userData.displayName || userData.username,
                username: userData.username,
                bio: userData.bio,
                profilePicUrl: userData.profilePicUrl,
                links: links,
                socialLinks: userData.socialLinks || {}
            });
        } else {
            // Classic fallback
            const linksContainer = document.getElementById('links-container');
            if (links.length === 0) {
                linksContainer.innerHTML = '<div class="link-placeholder">No links available</div>';
            } else {
                linksContainer.innerHTML = '';
                links.forEach(linkData => {
                    const linkElement = document.createElement('a');
                    linkElement.href = "javascript:void(0);"; // Use JavaScript handler instead of direct link
                    linkElement.className = 'bio-link';
                    linkElement.rel = 'noopener noreferrer';
                    const platform = linkData.platform?.toLowerCase() || 'other';
                    const iconClass = socialMediaIcons[platform] || socialMediaIcons.other;
                    linkElement.innerHTML = `<i class="${iconClass}"></i><span>${linkData.title}</span>`;
                    // Add click event to track clicks with location data
                    linkElement.addEventListener('click', function(e) {
                        e.preventDefault();
                        trackLinkClick(linkData.id, linkData.url, userId);
                    });
                    linksContainer.appendChild(linkElement);
                });
            }
            // Social icons
            if (userData && userData.socialLinks) {
                const socialIcons = document.getElementById('social-icons');
                socialIcons.innerHTML = '';
                for (const [platform, url] of Object.entries(userData.socialLinks)) {
                    if (!url) continue;
                    const iconClass = socialMediaIcons[platform.toLowerCase()] || socialMediaIcons.other;
                    const iconElement = document.createElement('a');
                    iconElement.href = "javascript:void(0);"; // Use JavaScript handler instead of direct link
                    iconElement.className = 'social-icon';
                    iconElement.rel = 'noopener noreferrer';
                    iconElement.innerHTML = `<i class="${iconClass}"></i>`;
                    // Add click event to track clicks with location data
                    iconElement.addEventListener('click', function(e) {
                        e.preventDefault();
                        // Create a virtual link ID for social links
                        const virtualLinkId = `social_${platform}_${userId}`;
                        trackLinkClick(virtualLinkId, url, userId);
                    });
                    socialIcons.appendChild(iconElement);
                }
            }
        }
    } catch (error) {
        if (templateObj && userData) {
            bioRoot.innerHTML += `<div class="link-placeholder">Error loading links</div>`;
        } else {
            const linksContainer = document.getElementById('links-container');
            linksContainer.innerHTML = '<div class="link-placeholder">Error loading links</div>';
        }
    }
}

// Function to display error message
function displayError(message) {
    bioRoot.innerHTML = `<div class="link-placeholder">${message}</div>`;
}

// Function to get visitor's location using IP geolocation API
async function getVisitorLocation() {
    try {
        // Use a free IP geolocation API
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }

        const data = await response.json();

        // Extract relevant location data
        return {
            country: data.country_name,
            countryCode: data.country_code,
            region: data.region,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone,
            isp: data.org
        };
    } catch (error) {
        console.error("Error getting visitor location:", error);
        // Return a default object with unknown values
        return {
            country: "Unknown",
            countryCode: "XX",
            region: "Unknown",
            city: "Unknown"
        };
    }
}

// Function to track link clicks
function trackLinkClick(linkId, url, userId) {
    // Only track if we have the necessary data
    if (!linkId || !url) return;

    // Get location data and record the click
    getVisitorLocation().then(geoData => {
        // Create click data object
        const clickData = {
            linkId: linkId,
            userId: userId,
            url: url,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent,
            geo: geoData
        };

        // Add to clicks collection
        db.collection('clicks').add(clickData)
            .then(() => {
                console.log("Link click tracked with location data");

                // Update link click count
                db.collection('links').doc(linkId).update({
                    clicks: firebase.firestore.FieldValue.increment(1),
                    lastClickedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.error("Error updating link click count:", error);
                });
            })
            .catch(error => {
                console.error("Error tracking link click:", error);
            });
    });

    // Open the URL
    window.open(url, '_blank');
}

// Load user profile when page loads
document.addEventListener('DOMContentLoaded', loadUserProfile);
