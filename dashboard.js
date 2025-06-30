// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    // Optionally redirect to login or show an error message on the page
    // document.body.innerHTML = '<h1>Error: Firebase not loaded. Please try again later.</h1>';
}

// DOM Elements
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const logoutLink = document.getElementById('logoutLink');
const dashboardLink = document.getElementById('dashboardLink');
const linksTab = document.getElementById('linksTab');
const addLinkModal = document.getElementById('addLinkModal');
const closeLinkModal = document.getElementById('closeLinkModal');
const cancelLinkBtn = document.getElementById('cancelLinkBtn');
const saveLinkBtn = document.getElementById('saveLinkBtn');
const socialOptions = document.querySelectorAll('.social-option');
const linksList = document.getElementById('linksList');
const copyBioLinkBtn = document.getElementById('copyBioLinkBtn');
const previewBioBtn = document.getElementById('previewBioBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const editLinkModal = document.getElementById('editLinkModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');

// Global variables
let currentUser = null;
let userLinks = [];
let bioPageData = null;
let userProfile = null;
let currentTemplate = "classic"; // Default template

// Helper function to check authentication
function checkAuth(redirect = false) {
    return new Promise((resolve, reject) => {
        if (!auth) {
            console.error("Firebase Auth is not initialized.");
            if (redirect) window.location.href = 'login.html';
            resolve(null);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe(); // Stop listening immediately
            if (!user && redirect) {
                window.location.href = 'login.html';
            }
            resolve(user);
        }, (error) => {
            console.error("Auth state check error:", error);
            if (redirect) window.location.href = 'login.html';
            reject(error);
        });
    });
}

// Initialize dashboard
async function initDashboard() {
    try {
        currentUser = await checkAuth(true);
        if (!currentUser) return;

        // Fetch user data from Firestore
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();

        if (doc.exists) {
            const userData = doc.data();
            userProfile = userData;

            // Check if user has completed onboarding
            if (!userData.onboardingCompleted) {
                window.location.href = 'onboarding.html';
                return;
            }

            // Update welcome message
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${userData.username || currentUser.email}!`;
            }

            // Update sidebar user profile
            if (userName) {
                userName.textContent = userData.username || currentUser.email.split('@')[0];
            }

            if (userEmail) {
                userEmail.textContent = currentUser.email;
            }

            // We'll use the sidebar.js to handle the plan badge display
            // This ensures consistent badge display across all pages

            // Initialize the sidebar which will handle the plan badge
            if (typeof updateSidebarUserProfile === 'function') {
                updateSidebarUserProfile();
            }

            // Initialize token balance
            if (typeof updateTokenBalance === 'function') {
                updateTokenBalance();
            }

            // Make token balance clickable and update it directly
            const tokenBalanceSidebar = document.getElementById('tokenBalanceSidebar');
            const sidebarTokenCount = document.getElementById('sidebarTokenCount');
            if (tokenBalanceSidebar) {
                tokenBalanceSidebar.addEventListener('click', () => {
                    window.location.href = 'tokens.html';
                });
            }

            // Update token count directly from user profile
            if (sidebarTokenCount && userData) {
                sidebarTokenCount.textContent = userData.tokens || userData.tokenBalance || 0;
            }
        } else {
            // Update welcome message
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${currentUser.email}!`;
            }

            // Update sidebar user profile
            if (userName) {
                userName.textContent = currentUser.displayName || currentUser.email.split('@')[0];
            }

            if (userEmail) {
                userEmail.textContent = currentUser.email;
            }

            // Create a user profile if it doesn't exist
            const newUserProfile = {
                email: currentUser.email,
                username: currentUser.displayName || currentUser.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isPremium: false,
                linkCount: 0
            };

            await db.collection('users').doc(currentUser.uid).set(newUserProfile);

            // Set userProfile for immediate use
            userProfile = {
                ...newUserProfile,
                username: currentUser.displayName || currentUser.email.split('@')[0]
            };
        }

        // Load bio page data
        await loadBioPage();

        // Load links
        await loadLinks();

        // Load analytics
        loadAnalytics();

        // Check subscription status and auto-downgrade if expired
        if (userProfile) {
            checkAndHandleSubscriptionStatus(userProfile);
        }

        // Update UI based on premium status
        updatePremiumUI();

        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

// Load bio page data
async function loadBioPage() {
    try {
        const doc = await db.collection('bioPages').doc(currentUser.uid).get();
        if (doc.exists) {
            bioPageData = doc.data();

            // Update bio settings form if elements exist
            const bioTitleEl = document.getElementById('bioTitle');
            const bioDescriptionEl = document.getElementById('bioDescription');

            if (bioTitleEl) bioTitleEl.value = bioPageData.title || '';
            if (bioDescriptionEl) bioDescriptionEl.value = bioPageData.description || '';

            // Set theme if elements exist
            const themeLightEl = document.getElementById('themeLight');
            const themeCustomEl = document.getElementById('themeCustom');
            const themeDarkEl = document.getElementById('themeDark');
            const customThemeOptionsEl = document.getElementById('customThemeOptions');

            if (bioPageData.theme === 'light' && themeLightEl) {
                themeLightEl.checked = true;
            } else if (bioPageData.theme === 'custom' && userProfile && userProfile.isPremium && themeCustomEl) {
                themeCustomEl.checked = true;
                if (customThemeOptionsEl) customThemeOptionsEl.style.display = 'block';

                // Set custom colors if elements exist
                if (bioPageData.customColors) {
                    const primaryColorEl = document.getElementById('primaryColor');
                    const backgroundColorEl = document.getElementById('backgroundColor');
                    const textColorEl = document.getElementById('textColor');

                    if (primaryColorEl) primaryColorEl.value = bioPageData.customColors.primary || '#6c5ce7';
                    if (backgroundColorEl) backgroundColorEl.value = bioPageData.customColors.background || '#1a1a2e';
                    if (textColorEl) textColorEl.value = bioPageData.customColors.text || '#f1f1f1';
                }
            } else if (themeDarkEl) {
                themeDarkEl.checked = true;
            }

            // Load profile data if available and elements exist
            const displayNameEl = document.getElementById('displayName');
            const bioEl = document.getElementById('bio');
            const locationEl = document.getElementById('location');
            const usernameEl = document.getElementById('username');

            if (bioPageData.displayName && displayNameEl) {
                displayNameEl.value = bioPageData.displayName;
            }

            if (bioPageData.bio && bioEl) {
                bioEl.value = bioPageData.bio;
            }

            if (bioPageData.location && locationEl) {
                locationEl.value = bioPageData.location;
            }

            // Set username if element exists
            if (userProfile && userProfile.username && usernameEl) {
                usernameEl.value = userProfile.username;
            }
        } else {
            // Create a default bio page if it doesn't exist
            const defaultBioPage = {
                title: `${userProfile?.username || currentUser.email.split('@')[0]}'s Links`,
                description: 'Welcome to my bio page!',
                theme: 'dark',
                // Template code removed
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('bioPages').doc(currentUser.uid).set(defaultBioPage);
            bioPageData = defaultBioPage;

            // Update form if elements exist
            const bioTitleEl = document.getElementById('bioTitle');
            const bioDescriptionEl = document.getElementById('bioDescription');

            if (bioTitleEl) bioTitleEl.value = defaultBioPage.title;
            if (bioDescriptionEl) bioDescriptionEl.value = defaultBioPage.description;
        }
    } catch (error) {
        console.error('Error loading bio page:', error);
    }
}

// Template-related function removed

// Update UI based on premium status
function updatePremiumUI() {
    const premiumThemeOption = document.getElementById('premiumThemeOption');

    if (userProfile && userProfile.isPremium) {
        premiumThemeOption.style.display = 'flex';

        // If theme is custom, show custom options
        if (bioPageData && bioPageData.theme === 'custom') {
            document.getElementById('themeCustom').checked = true;
            document.getElementById('customThemeOptions').style.display = 'block';
        }
    }
}

// Load links
async function loadLinks() {
    try {
        // First try to load links from the user's collection
        try {
            const linksRef = db.collection('users').doc(currentUser.uid).collection('links');
            const snapshot = await linksRef.orderBy('order').get();

            userLinks = [];
            snapshot.forEach(doc => {
                userLinks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // If no links found in user's collection, try the global links collection
            if (userLinks.length === 0) {
                const globalSnapshot = await db.collection('links')
                    .where('userId', '==', currentUser.uid)
                    .orderBy('createdAt', 'desc')
                    .get();

                globalSnapshot.forEach(doc => {
                    userLinks.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }
        } catch (indexError) {
            // If index error occurs, fall back to unordered query
            console.warn('Index error, falling back to unordered query:', indexError);

            // Try user's collection first
            const linksRef = db.collection('users').doc(currentUser.uid).collection('links');
            const snapshot = await linksRef.get();

            userLinks = [];
            snapshot.forEach(doc => {
                userLinks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // If no links found, try global collection
            if (userLinks.length === 0) {
                const globalSnapshot = await db.collection('links')
                    .where('userId', '==', currentUser.uid)
                    .get();

                globalSnapshot.forEach(doc => {
                    userLinks.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }

            // Sort manually in memory
            userLinks.sort((a, b) => {
                // Bio links should always come first
                if (a.isBioLink && !b.isBioLink) return -1;
                if (!a.isBioLink && b.isBioLink) return 1;

                // Then sort by order if available
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }

                // Finally sort by creation date
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.seconds - a.createdAt.seconds;
            });
        }

        renderLinks();
        updateStats();
    } catch (error) {
        console.error('Error loading links:', error);
        // Initialize empty array to prevent null reference errors
        userLinks = [];
        renderLinks();
    }
}

// Format bio link URL for display
function formatBioLinkForDisplay(linkData, username) {
    if (linkData.isBioLink) {
        // Use provided username, or fallback to userProfile username, or email prefix
        const displayUsername = username ||
                               userProfile?.username ||
                               (currentUser?.email ? currentUser.email.split('@')[0] : 'user');

        return `bink.bio/${displayUsername}`;
    }

    return linkData.url;
}

// Render links
function renderLinks() {
    try {
        const linksList = document.getElementById('linksList');
        if (!linksList) {
            console.error("Links list element not found");
            return;
        }

        if (!userLinks || userLinks.length === 0) {
            linksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-link"></i>
                    </div>
                    <h3>No Links Yet</h3>
                    <p>Add your first link to get started</p>
                    <a href="bio-editor.html" class="btn btn-primary mt-4">
                        Add Your First Link
                    </a>
                </div>
            `;
            return;
        }

        let html = '';

        // First render bio links at the top if they exist
        const bioLinks = userLinks.filter(link => link.isBioLink);
        const regularLinks = userLinks.filter(link => !link.isBioLink);

        // Render bio links with special styling
        bioLinks.forEach(link => {
            const platformIcon = getPlatformIcon(link.platform);
            const platformColor = getPlatformColor(link.platform);

            // Format bio link URL to show as bink/username
            const displayUrl = formatBioLinkForDisplay(link, userProfile?.username);

            html += `
                <div class="link-item bio-link-item" data-id="${link.id}">
                    <div class="link-info">
                        <div class="link-icon" style="background-color: ${platformColor};">
                            <i class="${platformIcon}"></i>
                        </div>
                        <div class="link-details">
                            <h3>${link.title}</h3>
                            <div class="link-url">${displayUrl}</div>
                            <div class="bio-link-badge">
                                <i class="fas fa-star"></i> Your Bio Link
                            </div>
                        </div>
                    </div>

                    <div class="link-stats">
                        <div class="link-stat">
                            <i class="fas fa-mouse-pointer"></i>
                            <span>${link.clicks || 0} clicks</span>
                        </div>
                        <div class="link-actions">
                            <button class="btn-icon view" onclick="trackLinkClick('${link.id}', '${link.url}')">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                            <button class="btn-icon edit" onclick="editLink('${link.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteLink('${link.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Add a separator if there are both bio links and regular links
        if (bioLinks.length > 0 && regularLinks.length > 0) {
            html += `<div class="links-separator">Other Links</div>`;
        }

        // Render regular links
        regularLinks.forEach(link => {
            const platformIcon = getPlatformIcon(link.platform);
            const platformColor = getPlatformColor(link.platform);

            html += `
                <div class="link-item" data-id="${link.id}">
                    <div class="link-info">
                        <div class="link-icon" style="background-color: ${platformColor};">
                            <i class="${platformIcon}"></i>
                        </div>
                        <div class="link-details">
                            <h3>${link.title}</h3>
                            <div class="link-url">${link.url}</div>
                        </div>
                    </div>

                    <div class="link-stats">
                        <div class="link-stat">
                            <i class="fas fa-mouse-pointer"></i>
                            <span>${link.clicks || 0} clicks</span>
                        </div>
                        <div class="link-actions">
                            <button class="btn-icon view" onclick="trackLinkClick('${link.id}', '${link.url}')">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                            <button class="btn-icon edit" onclick="editLink('${link.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteLink('${link.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        linksList.innerHTML = html;

        // Add special styling for bio links
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .bio-link-item {
                    border-left: 4px solid var(--primary-color);
                    background-color: rgba(59, 130, 246, 0.05);
                }

                .bio-link-badge {
                    display: inline-block;
                    background-color: var(--primary-color);
                    color: white;
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 12px;
                    margin-top: 5px;
                }

                .links-separator {
                    margin: 20px 0;
                    text-align: center;
                    position: relative;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }

                .links-separator:before, .links-separator:after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    width: calc(50% - 50px);
                    height: 1px;
                    background-color: var(--border-color);
                }

                .links-separator:before {
                    left: 0;
                }

                .links-separator:after {
                    right: 0;
                }

                .btn-icon.view:hover {
                    background-color: var(--primary-color);
                    color: white;
                }
            </style>
        `);
    } catch (error) {
        console.error("Error rendering links:", error);
    }
}

// Update stats
function updateStats() {
    try {
        // Calculate total clicks
        const totalClicksEl = document.getElementById('totalClicks');
        if (totalClicksEl) {
            const totalClicks = userLinks ? userLinks.reduce((sum, link) => sum + (link.clicks || 0), 0) : 0;
            totalClicksEl.textContent = totalClicks;
        }

        // Active links
        const activeLinksEl = document.getElementById('activeLinks');
        if (activeLinksEl) {
            activeLinksEl.textContent = userLinks ? userLinks.length : 0;
        }

        // Most popular link
        const popularLinkEl = document.getElementById('popularLink');
        const popularLinkClicksEl = document.getElementById('popularLinkClicks');

        if (popularLinkEl && popularLinkClicksEl && userLinks && userLinks.length > 0) {
            const popularLink = [...userLinks].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
            popularLinkEl.textContent = popularLink.title;
            popularLinkClicksEl.innerHTML = `
                <i class="fas fa-chart-line"></i>
                <span>${popularLink.clicks || 0}</span> clicks
            `;
        }

        // Page views - get actual data from bioPage
        const pageViewsEl = document.getElementById('pageViews');
        if (pageViewsEl && bioPageData) {
            const pageViews = bioPageData.views || 0;
            pageViewsEl.textContent = pageViews;

            // Store the current views count for comparison next time
            if (!window.previousPageViews) {
                window.previousPageViews = pageViews;
            }
        }

        // Calculate real changes based on stored data
        const clicksChangeEl = document.getElementById('clicksChange');
        if (clicksChangeEl) {
            // Use stored previous total clicks if available, otherwise show 0%
            if (window.previousTotalClicks) {
                const currentTotalClicks = userLinks ? userLinks.reduce((sum, link) => sum + (link.clicks || 0), 0) : 0;
                const clicksChange = window.previousTotalClicks > 0 ?
                    Math.round(((currentTotalClicks - window.previousTotalClicks) / window.previousTotalClicks) * 100) : 0;

                clicksChangeEl.textContent = `${Math.abs(clicksChange)}%`;

                // Update the parent element class based on the change
                const parentEl = clicksChangeEl.parentElement;
                if (parentEl) {
                    parentEl.className = `stat-change ${clicksChange >= 0 ? 'positive' : 'negative'}`;
                    parentEl.querySelector('i').className = `fas fa-${clicksChange >= 0 ? 'arrow-up' : 'arrow-down'}`;
                }

                // Store current value for next comparison
                window.previousTotalClicks = currentTotalClicks;
            } else {
                // First time, just store the current value
                const currentTotalClicks = userLinks ? userLinks.reduce((sum, link) => sum + (link.clicks || 0), 0) : 0;
                window.previousTotalClicks = currentTotalClicks;
                clicksChangeEl.textContent = `0%`;
            }
        }

        const viewsChangeEl = document.getElementById('viewsChange');
        if (viewsChangeEl && bioPageData) {
            // Use stored previous views if available, otherwise show 0%
            if (window.previousPageViews) {
                const currentPageViews = bioPageData.views || 0;
                const viewsChange = window.previousPageViews > 0 ?
                    Math.round(((currentPageViews - window.previousPageViews) / window.previousPageViews) * 100) : 0;

                viewsChangeEl.textContent = `${Math.abs(viewsChange)}%`;

                // Update the parent element class based on the change
                const parentEl = viewsChangeEl.parentElement;
                if (parentEl) {
                    parentEl.className = `stat-change ${viewsChange >= 0 ? 'positive' : 'negative'}`;
                    parentEl.querySelector('i').className = `fas fa-${viewsChange >= 0 ? 'arrow-up' : 'arrow-down'}`;
                }

                // Store current value for next comparison
                window.previousPageViews = currentPageViews;
            } else {
                // First time, just store the current value
                window.previousPageViews = bioPageData.views || 0;
                viewsChangeEl.textContent = `0%`;
            }
        }

        const linksChangeEl = document.getElementById('linksChange');
        if (linksChangeEl) {
            // Use stored previous link count if available, otherwise show 0%
            if (window.previousLinkCount) {
                const currentLinkCount = userLinks ? userLinks.length : 0;
                const linksChange = window.previousLinkCount > 0 ?
                    Math.round(((currentLinkCount - window.previousLinkCount) / window.previousLinkCount) * 100) : 0;

                linksChangeEl.innerHTML = `
                    <i class="fas fa-${linksChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    <span>${Math.abs(linksChange)}%</span> vs last week
                `;
                linksChangeEl.className = `stat-change ${linksChange >= 0 ? 'positive' : 'negative'}`;

                // Store current value for next comparison
                window.previousLinkCount = currentLinkCount;
            } else {
                // First time, just store the current value
                window.previousLinkCount = userLinks ? userLinks.length : 0;
                linksChangeEl.innerHTML = `
                    <i class="fas fa-minus"></i>
                    <span>0%</span> vs last week
                `;
            }
        }
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

// Load analytics
function loadAnalytics() {
    try {
        // Clicks chart
        const clicksChartElement = document.getElementById('clicksChart');
        if (clicksChartElement) {
            const clicksCtx = clicksChartElement.getContext('2d');
            if (clicksCtx) {
                const clicksChart = new Chart(clicksCtx, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Clicks',
                            data: [12, 19, 15, 25, 22, 30, 35],
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 2,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#a0a0a0'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#a0a0a0'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    color: '#f1f1f1'
                                }
                            }
                        }
                    }
                });
            }
        }

        // Sources chart
        const sourcesChartElement = document.getElementById('sourcesChart');
        if (sourcesChartElement) {
            const sourcesCtx = sourcesChartElement.getContext('2d');
            if (sourcesCtx) {
                const sourcesChart = new Chart(sourcesCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Direct', 'Social Media', 'Search', 'Referral'],
                        datasets: [{
                            data: [45, 25, 20, 10],
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(236, 72, 153, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(245, 158, 11, 0.8)'
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    color: '#f1f1f1',
                                    padding: 20,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error loading analytics charts:", error);
    }

    try {
        // Top links
        const topLinksList = document.getElementById('topLinksList');
        if (!topLinksList) return;

        if (!userLinks || userLinks.length === 0) {
            topLinksList.innerHTML = `
                <div class="empty-state">
                    <p>No links data available yet</p>
                </div>
            `;
            return;
        }

        const sortedLinks = [...userLinks].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        let html = '';

        sortedLinks.slice(0, 5).forEach((link, index) => {
            const platformIcon = getPlatformIcon(link.platform);
            const platformColor = getPlatformColor(link.platform);

            html += `
                <div class="link-item">
                    <div class="link-info">
                        <div class="link-icon" style="background-color: ${platformColor};">
                            <i class="${platformIcon}"></i>
                        </div>
                        <div class="link-details">
                            <h3>${link.title}</h3>
                            <div class="link-url">${link.url}</div>
                        </div>
                    </div>

                    <div class="link-stats">
                        <div class="link-stat">
                            <i class="fas fa-mouse-pointer"></i>
                            <span>${link.clicks || 0} clicks</span>
                        </div>
                    </div>
                </div>
            `;
        });

        topLinksList.innerHTML = html;
    } catch (error) {
        console.error("Error loading top links:", error);
    }
}

// Get platform icon
function getPlatformIcon(platform) {
    const icons = {
        website: 'fas fa-globe',
        instagram: 'fab fa-instagram',
        twitter: 'fab fa-twitter',
        facebook: 'fab fa-facebook',
        youtube: 'fab fa-youtube',
        tiktok: 'fab fa-tiktok',
        linkedin: 'fab fa-linkedin',
        github: 'fab fa-github',
        pinterest: 'fab fa-pinterest',
        snapchat: 'fab fa-snapchat',
        reddit: 'fab fa-reddit',
        twitch: 'fab fa-twitch',
        discord: 'fab fa-discord',
        whatsapp: 'fab fa-whatsapp',
        telegram: 'fab fa-telegram',
        medium: 'fab fa-medium',
        spotify: 'fab fa-spotify',
        'apple-music': 'fab fa-apple',
        'youtube-music': 'fab fa-youtube',
        audiomack: 'fas fa-music',
        soundcloud: 'fab fa-soundcloud',
        bandcamp: 'fab fa-bandcamp',
        tidal: 'fas fa-music',
        deezer: 'fas fa-music',
        'amazon-music': 'fab fa-amazon',
        behance: 'fab fa-behance',
        dribbble: 'fab fa-dribbble'
    };

    return icons[platform] || 'fas fa-link';
}

// Get platform color
function getPlatformColor(platform) {
    const colors = {
        website: '#4a5568',
        instagram: '#e1306c',
        twitter: '#1da1f2',
        facebook: '#1877f2',
        youtube: '#ff0000',
        tiktok: '#000000',
        linkedin: '#0077b5',
        github: '#333333',
        pinterest: '#e60023',
        snapchat: '#fffc00',
        reddit: '#ff4500',
        twitch: '#6441a5',
        discord: '#7289da',
        whatsapp: '#25d366',
        telegram: '#0088cc',
        medium: '#00ab6c',
        spotify: '#1db954',
        'apple-music': '#fa243c',
        'youtube-music': '#ff0000',
        audiomack: '#ff6600',
        soundcloud: '#ff7700',
        bandcamp: '#629aa0',
        tidal: '#000000',
        deezer: '#feaa2d',
        'amazon-music': '#ff9900',
        behance: '#1769ff',
        dribbble: '#ea4c89'
    };

    return colors[platform] || '#4a5568';
}

// Setup event listeners
function setupEventListeners() {
    // Dashboard link (show links tab)
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();

            // Show links tab
            if (linksTab) linksTab.style.display = 'block';
        });
    }

    // Templates link code removed

    // Logout link
    if (logoutLink && auth) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                console.log('User signed out successfully.');
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
                alert('Failed to log out. Please try again.');
            });
        });
    }

    // Template selection code removed

    // Add New Link button was removed from header and replaced with a link to bio-editor.html

    // Close add link modal
    closeLinkModal.addEventListener('click', () => {
        addLinkModal.style.display = 'none';
    });

    cancelLinkBtn.addEventListener('click', () => {
        addLinkModal.style.display = 'none';
    });

    // Select social platform
    socialOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            socialOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            option.classList.add('selected');

            // Set platform value
            const platform = option.getAttribute('data-platform');
            document.getElementById('linkPlatform').value = platform;
        });
    });

    // Save new link
    saveLinkBtn.addEventListener('click', async () => {
        const title = document.getElementById('linkTitle').value;
        const url = document.getElementById('linkUrl').value;
        const description = document.getElementById('linkDescription').value;
        const platform = document.getElementById('linkPlatform').value;

        if (!title || !url) {
            alert('Please fill in all required fields');
            return;
        }

        if (!platform) {
            alert('Please select a platform');
            return;
        }

        try {
            // Add http:// if missing
            let formattedUrl = url;
            if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                formattedUrl = 'https://' + formattedUrl;
            }

            // Check if user has reached the free plan limit (5 links)
            if (userProfile && !userProfile.isPremium) {
                const currentLinkCount = userLinks.length;
                if (currentLinkCount >= 5) {
                    alert('You have reached the maximum number of links for the free plan. Please upgrade to add more links.');
                    return;
                }
            }

            // Add new link to Firestore
            const newLink = {
                userId: currentUser.uid,
                title,
                url: formattedUrl,
                description,
                platform,
                clicks: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('links').add(newLink);

            // Update link count in user profile
            await db.collection('users').doc(currentUser.uid).update({
                linkCount: firebase.firestore.FieldValue.increment(1)
            });

            // Close modal
            addLinkModal.style.display = 'none';

            // Reload links
            await loadLinks();
        } catch (error) {
            console.error('Error adding link:', error);
            alert('Error adding link. Please try again.');
        }
    });

    // Close edit modal
    closeEditModal.addEventListener('click', () => {
        editLinkModal.style.display = 'none';
    });

    cancelEditBtn.addEventListener('click', () => {
        editLinkModal.style.display = 'none';
    });

    // Save edited link
    saveEditBtn.addEventListener('click', async () => {
        const linkId = document.getElementById('editLinkId').value;
        const title = document.getElementById('editLinkTitle').value;
        const url = document.getElementById('editLinkUrl').value;
        const description = document.getElementById('editLinkDescription').value;

        if (!title || !url) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            // Add http:// if missing
            let formattedUrl = url;
            if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                formattedUrl = 'https://' + formattedUrl;
            }

            // Update link in Firestore
            await db.collection('links').doc(linkId).update({
                title,
                url: formattedUrl,
                description,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Close modal
            editLinkModal.style.display = 'none';

            // Reload links
            await loadLinks();
        } catch (error) {
            console.error('Error updating link:', error);
            alert('Error updating link. Please try again.');
        }
    });

    // Create a hidden textarea element for clipboard operations
    const hiddenTextarea = document.createElement('textarea');
    hiddenTextarea.style.position = 'fixed';
    hiddenTextarea.style.opacity = '0';
    hiddenTextarea.style.pointerEvents = 'none';
    hiddenTextarea.style.left = '-9999px';
    document.body.appendChild(hiddenTextarea);

    // Enhanced function to copy text to clipboard that works on mobile
    function copyTextToClipboard(text) {
        return new Promise((resolve, reject) => {
            // Try the modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(resolve)
                    .catch(error => {
                        console.warn('Clipboard API failed, trying fallback method', error);
                        // Fallback for mobile devices
                        tryFallbackCopy(text, resolve, reject);
                    });
            } else {
                // Fallback for browsers that don't support Clipboard API
                tryFallbackCopy(text, resolve, reject);
            }
        });
    }

    // Separate fallback function for better readability
    function tryFallbackCopy(text, resolve, reject) {
        try {
            // Make sure the textarea is properly set up for mobile
            hiddenTextarea.value = text;
            hiddenTextarea.style.position = 'fixed';
            hiddenTextarea.style.top = '0';
            hiddenTextarea.style.left = '0';
            hiddenTextarea.style.width = '100%';
            hiddenTextarea.style.height = '100px';
            hiddenTextarea.style.opacity = '0';
            hiddenTextarea.style.zIndex = '9999'; // Higher z-index to ensure it's on top
            hiddenTextarea.style.userSelect = 'text'; // Ensure text is selectable
            hiddenTextarea.style.webkitUserSelect = 'text';
            hiddenTextarea.style.MozUserSelect = 'text';
            hiddenTextarea.style.msUserSelect = 'text';
            hiddenTextarea.readOnly = false; // Ensure it's not read-only

            // For iOS devices
            hiddenTextarea.contentEditable = true;
            hiddenTextarea.readOnly = false;

            // Make sure it's in the viewport
            document.body.appendChild(hiddenTextarea);

            // Select the text - crucial for mobile
            hiddenTextarea.focus();
            hiddenTextarea.select();

            // For iOS
            const range = document.createRange();
            range.selectNodeContents(hiddenTextarea);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            hiddenTextarea.setSelectionRange(0, text.length);

            // Execute the copy command
            const successful = document.execCommand('copy');

            // Reset the textarea position
            hiddenTextarea.style.position = 'fixed';
            hiddenTextarea.style.top = '-9999px';
            hiddenTextarea.blur();

            if (successful) {
                resolve();
            } else {
                // If execCommand fails, try a different approach for mobile
                // Show a message to the user with the link to manually copy
                const manualCopyMessage = `Copy this link manually: ${text}`;
                console.log(manualCopyMessage);
                alert(manualCopyMessage);
                resolve(); // Resolve anyway to prevent UI from getting stuck
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            // Show the text for manual copying as a last resort
            alert(`Please copy this link manually: ${text}`);
            resolve(); // Resolve anyway to prevent UI from getting stuck
        }
    }

    // Show custom share modal
    function showShareModal(url, title) {
        const modal = document.getElementById('shareModal');
        const shareUrl = document.getElementById('shareUrl');
        const shareTitle = document.getElementById('shareTitle');

        shareUrl.textContent = url;
        shareTitle.textContent = title;

        modal.style.display = 'flex';

        // Set up share buttons
        setupShareButtons(url, title);
    }

    // Setup share buttons functionality
    function setupShareButtons(url, title) {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        const encodedText = encodeURIComponent('Check out my bio page!');

        // Social media share URLs
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
            telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
            email: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`
        };

        // Add click handlers to share buttons
        Object.keys(shareUrls).forEach(platform => {
            const button = document.getElementById(`share-${platform}`);
            if (button) {
                button.onclick = () => {
                    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
                    document.getElementById('shareModal').style.display = 'none';
                };
            }
        });

        // Copy link button
        const copyButton = document.getElementById('share-copy');
        if (copyButton) {
            copyButton.onclick = () => {
                copyTextToClipboard(url)
                    .then(() => {
                        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy Link';
                        }, 2000);
                        showNotification('success', 'Link copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                        showNotification('error', 'Could not copy link. Please try again.');
                    });
            };
        }
    }

    // Share bio link
    copyBioLinkBtn.addEventListener('click', async () => {
        try {
            // Get the user's data to access username
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();

            if (!userData || !userData.username) {
                throw new Error('Username not found');
            }

            // Create URL without template parameter
            // This way the link will always show the user's current template
            const bioUrl = new URL(userData.username, window.location.origin).href;
            console.log("Sharing URL:", bioUrl); // Debug log

            // Try to use native Web Share API first
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${userData.displayName || userData.username}'s Bio`,
                        text: `Check out my bio page!`,
                        url: bioUrl
                    });

                    // Show success message
                    copyBioLinkBtn.innerHTML = '<i class="fas fa-check"></i> Shared!';
                    setTimeout(() => {
                        copyBioLinkBtn.innerHTML = '<i class="fas fa-share"></i> Share Bio Link';
                    }, 2000);

                    showNotification('success', 'Bio link shared successfully!');
                    return;
                } catch (shareError) {
                    console.log('Native share cancelled or failed:', shareError);
                    // Fall through to custom share options
                }
            }

            // Fallback: Show custom share modal
            showShareModal(bioUrl, userData.displayName || userData.username);

        } catch (error) {
            console.error('Error getting user data:', error);
            // Fallback to ID-based URL
            const bioLink = new URL(`bio.html?id=${currentUser.uid}`, window.location.href).href;
            console.log("Fallback URL:", bioLink); // Debug log

            // Try native share with fallback URL
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'My Bio Page',
                        text: 'Check out my bio page!',
                        url: bioLink
                    });

                    copyBioLinkBtn.innerHTML = '<i class="fas fa-check"></i> Shared!';
                    setTimeout(() => {
                        copyBioLinkBtn.innerHTML = '<i class="fas fa-share"></i> Share Bio Link';
                    }, 2000);

                    showNotification('success', 'Bio link shared successfully!');
                    return;
                } catch (shareError) {
                    console.log('Native share cancelled or failed:', shareError);
                }
            }

            // Fallback: Show custom share modal with fallback URL
            showShareModal(bioLink, 'My Bio Page');
        }
    });

    // Preview bio page - enhanced for mobile
    previewBioBtn.addEventListener('click', async () => {
        try {
            // Get the user's data to access username
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();

            if (!userData || !userData.username) {
                throw new Error('Username not found');
            }

            // Create URL without template parameter
            // This way the link will always show the user's current template
            const bioUrl = new URL(userData.username, window.location.origin).href;
            console.log("Opening URL:", bioUrl); // Debug log

            // Show loading indicator on the button
            const originalButtonText = previewBioBtn.innerHTML;
            previewBioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

            // Use setTimeout to ensure the button state change is visible
            setTimeout(() => {
                try {
                    // Try to open in a new tab - this might be blocked on some mobile browsers
                    const newWindow = window.open(bioUrl, '_blank');

                    // Check if popup was blocked
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                        console.warn('Popup blocked or not supported on this device');
                        // Fallback: navigate directly if popup is blocked (common on mobile)
                        // But first, show a confirmation to the user
                        if (confirm('Preview will open in the current tab. Continue?')) {
                            // Save current page to history before navigating away
                            window.location.href = bioUrl;
                        }
                    }
                } catch (openError) {
                    console.error('Error opening window:', openError);
                    // Fallback: offer to navigate directly
                    if (confirm('Cannot open in new tab. Open in current tab instead?')) {
                        window.location.href = bioUrl;
                    }
                } finally {
                    // Reset button state
                    previewBioBtn.innerHTML = originalButtonText;
                }
            }, 300); // Short delay for visual feedback

        } catch (error) {
            console.error('Error getting user data:', error);
            // Fallback to ID-based URL
            const fallbackUrl = new URL(`bio.html?id=${currentUser.uid}`, window.location.href).href;
            console.log("Fallback preview URL:", fallbackUrl); // Debug log

            // Show a confirmation dialog before navigating
            if (confirm('Preview will open in the current tab. Continue?')) {
                window.location.href = fallbackUrl;
            } else {
                // Reset button if user cancels
                previewBioBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
            }
        }
    });

    // Save bio settings (if form exists)
    const bioSettingsForm = document.getElementById('bioSettingsForm');
    if (bioSettingsForm) {
        bioSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const bioTitleEl = document.getElementById('bioTitle');
            const bioDescriptionEl = document.getElementById('bioDescription');
            const themeEl = document.querySelector('input[name="theme"]:checked');

            if (!bioTitleEl || !bioDescriptionEl || !themeEl) {
                console.error('Bio settings form elements not found');
                return;
            }

            const title = bioTitleEl.value;
            const description = bioDescriptionEl.value;
            const theme = themeEl.value;

            try {
                const updateData = {
                    title,
                    description,
                    theme,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Add custom colors if theme is custom
                if (theme === 'custom') {
                    const primaryColorEl = document.getElementById('primaryColor');
                    const backgroundColorEl = document.getElementById('backgroundColor');
                    const textColorEl = document.getElementById('textColor');

                    if (primaryColorEl && backgroundColorEl && textColorEl) {
                        updateData.customColors = {
                            primary: primaryColorEl.value,
                            background: backgroundColorEl.value,
                            text: textColorEl.value
                        };
                    }
                }

                await db.collection('bioPages').doc(currentUser.uid).update(updateData);

                alert('Bio page settings saved successfully!');
                await loadBioPage();
            } catch (error) {
                console.error('Error saving bio settings:', error);
                alert('Error saving settings. Please try again.');
            }
        });
    }

    // Show/hide custom theme options
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customThemeOptions = document.getElementById('customThemeOptions');
            if (this.value === 'custom') {
                customThemeOptions.style.display = 'block';
            } else {
                customThemeOptions.style.display = 'none';
            }
        });
    });

    // Logout Button Logic
    if (logoutButton && auth) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                // Sign-out successful.
                console.log('User signed out successfully.');
                window.location.href = 'login.html'; // Redirect to login page
            }).catch((error) => {
                // An error happened.
                console.error('Sign out error:', error);
                alert('Failed to log out. Please try again.');
            });
        });
    } else if (logoutButton) {
        logoutButton.style.display = 'none'; // Hide logout if auth isn't loaded
    }
}

// Edit link function (needs to be global for onclick handler)
window.editLink = function(linkId) {
    try {
        const link = userLinks.find(link => link.id === linkId);
        if (!link) return;

        // Populate edit form
        document.getElementById('editLinkTitle').value = link.title;
        document.getElementById('editLinkUrl').value = link.url;
        document.getElementById('editLinkDescription').value = link.description || '';
        document.getElementById('editLinkId').value = link.id;
        document.getElementById('editLinkPlatform').value = link.platform;

        // Show edit modal
        editLinkModal.style.display = 'flex';
    } catch (error) {
        console.error('Error editing link:', error);
    }
};

// Delete link function (needs to be global for onclick handler)
window.deleteLink = function(linkId) {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
        // Try to delete from user's collection first
        const userLinkRef = db.collection('users').doc(currentUser.uid).collection('links').doc(linkId);
        userLinkRef.get().then(doc => {
            if (doc.exists) {
                // Link exists in user's collection
                return userLinkRef.delete();
            } else {
                // Try global links collection
                return db.collection('links').doc(linkId).delete();
            }
        })
        .then(() => {
            loadLinks();
        })
        .catch(error => {
            console.error('Error deleting link:', error);
            alert('Error deleting link. Please try again.');
        });
    } catch (error) {
        console.error('Error deleting link:', error);
        alert('Error deleting link. Please try again.');
    }
};

// Track link click function (needs to be global for onclick handler)
window.trackLinkClick = function(linkId, url) {
    try {
        // First try to update in user's collection
        const userLinkRef = db.collection('users').doc(currentUser.uid).collection('links').doc(linkId);
        userLinkRef.get().then(doc => {
            if (doc.exists) {
                // Link exists in user's collection
                return userLinkRef.update({
                    clicks: firebase.firestore.FieldValue.increment(1),
                    lastClickedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Try global links collection
                return db.collection('links').doc(linkId).update({
                    clicks: firebase.firestore.FieldValue.increment(1),
                    lastClickedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        })
        .then(() => {
            // Open the URL after updating the click count
            window.open(url, '_blank');

            // Reload links to update the UI
            setTimeout(() => {
                loadLinks();
            }, 1000);
        })
        .catch(error => {
            console.error('Error tracking link click:', error);
            // Still open the URL even if tracking fails
            window.open(url, '_blank');
        });
    } catch (error) {
        console.error('Error tracking link click:', error);
        // Still open the URL even if tracking fails
        window.open(url, '_blank');
    }
};

// Template-related functions removed

// Save profile form
async function saveProfile(e) {
    e.preventDefault();

    const displayName = document.getElementById('displayName').value.trim();
    const username = document.getElementById('username').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const location = document.getElementById('location').value.trim();

    if (!displayName) {
        alert('Please enter a display name');
        return;
    }

    try {
        // Update bio page
        await db.collection('bioPages').doc(currentUser.uid).update({
            displayName,
            bio,
            location,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update username if changed
        if (username && (!userProfile.username || username !== userProfile.username)) {
            // Check if username is available
            const usernameQuery = await db.collection('users')
                .where('username', '==', username)
                .where('uid', '!=', currentUser.uid)
                .get();

            if (!usernameQuery.empty) {
                alert('Username is already taken. Please choose another.');
                return;
            }

            // Update username
            await db.collection('users').doc(currentUser.uid).update({
                username,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        alert('Profile saved successfully!');
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
    }
}

// Add profile form event listener
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', saveProfile);
}

// Sidebar functionality is now in sidebar.js

// Show notification function for better mobile experience
function showNotification(type, message) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;

    // Add to container
    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300); // Wait for fade out animation
    }, 3000);
}

// Check and handle subscription status
function checkAndHandleSubscriptionStatus(userData) {
    if (!userData || !currentUser) return;

    // Use premium enforcement system if available
    if (window.PremiumEnforcement && typeof window.PremiumEnforcement.checkPremiumStatus === 'function') {
        const isValid = window.PremiumEnforcement.checkPremiumStatus(userData, currentUser.uid);

        if (!isValid && (userData.subscriptionTier === 'premium' || userData.subscriptionTier === 'creator')) {
            console.log("Dashboard detected expired subscription");

            // Update local user profile to reflect the change
            if (userProfile) {
                userProfile.subscriptionTier = 'free';
                userProfile.isPremium = false;
            }

            // Update sidebar if function is available
            if (typeof updateSidebarUserProfile === 'function') {
                setTimeout(updateSidebarUserProfile, 1000);
            }
        }
        return;
    }

    // Fallback manual check if premium enforcement is not available
    if (userData && userData.subscriptionTier &&
        userData.subscriptionTier !== 'free' &&
        userData.subscriptionDuration !== 'lifetime' &&
        userData.subscriptionExpiration) {

        const expiryDate = userData.subscriptionExpiration.toDate();
        const now = new Date();

        if (expiryDate < now) {
            console.log("Dashboard detected expired subscription (fallback check)");

            // Update user document to free plan
            db.collection('users').doc(currentUser.uid).update({
                subscriptionTier: 'free',
                subscriptionExpired: true,
                lastSubscriptionTier: userData.subscriptionTier,
                lastSubscriptionExpiration: userData.subscriptionExpiration,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log("User subscription downgraded to free");

                // Update local data
                if (userProfile) {
                    userProfile.subscriptionTier = 'free';
                    userProfile.isPremium = false;
                }

                // Update sidebar
                if (typeof updateSidebarUserProfile === 'function') {
                    updateSidebarUserProfile();
                }

                // Show notification if function exists
                if (typeof showNotification === 'function') {
                    showNotification("Your premium subscription has expired and you've been moved to the free tier.", "warning");
                }
            }).catch(error => {
                console.error("Error downgrading subscription:", error);
            });
        }
    }
}

// Initialize dashboard when the page loads
initDashboard();