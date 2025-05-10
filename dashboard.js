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
            await db.collection('users').doc(currentUser.uid).set({
                email: currentUser.email,
                username: currentUser.displayName || currentUser.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isPremium: false,
                linkCount: 0
            });
        }

        // Load bio page data
        await loadBioPage();

        // Load links
        await loadLinks();

        // Load analytics
        loadAnalytics();

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

            html += `
                <div class="link-item bio-link-item" data-id="${link.id}">
                    <div class="link-info">
                        <div class="link-icon" style="background-color: ${platformColor};">
                            <i class="${platformIcon}"></i>
                        </div>
                        <div class="link-details">
                            <h3>${link.title}</h3>
                            <div class="link-url">${link.url}</div>
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
        soundcloud: 'fab fa-soundcloud',
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
        soundcloud: '#ff7700',
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

    // Copy bio link
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
            const bioUrl = new URL(`bio.html?u=${userData.username}`, window.location.href).href;
            console.log("Copying URL:", bioUrl); // Debug log

            // Use the enhanced copy function
            copyTextToClipboard(bioUrl)
                .then(() => {
                    // Show success message with visual feedback
                    copyBioLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyBioLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Bio Link';
                    }, 2000);

                    // Alert is less user-friendly, use a toast or notification instead
                    const notification = document.createElement('div');
                    notification.className = 'notification success';
                    notification.innerHTML = '<i class="fas fa-check-circle"></i> Bio link copied to clipboard!';
                    document.body.appendChild(notification);

                    // Remove notification after 3 seconds
                    setTimeout(() => {
                        notification.remove();
                    }, 3000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    alert('Could not copy text. Please try again.');
                });
        } catch (error) {
            console.error('Error getting user data:', error);
            // Fallback to ID-based URL
            const bioLink = new URL(`bio.html?id=${currentUser.uid}`, window.location.href).href;
            console.log("Fallback URL:", bioLink); // Debug log

            // Use the enhanced copy function for the fallback URL too
            copyTextToClipboard(bioLink)
                .then(() => {
                    // Show success message with visual feedback
                    copyBioLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyBioLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Bio Link';
                    }, 2000);

                    // Alert is less user-friendly, use a toast or notification instead
                    const notification = document.createElement('div');
                    notification.className = 'notification success';
                    notification.innerHTML = '<i class="fas fa-check-circle"></i> Bio link copied to clipboard!';
                    document.body.appendChild(notification);

                    // Remove notification after 3 seconds
                    setTimeout(() => {
                        notification.remove();
                    }, 3000);
                })
                .catch(err => {
                    console.error('Could not copy fallback text: ', err);
                    alert('Could not copy text. Please try again.');
                });
        }
    });

    // Preview bio page
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
            const bioUrl = new URL(`bio.html?u=${userData.username}`, window.location.href).href;
            console.log("Opening URL:", bioUrl); // Debug log

            // Open the URL in a new tab
            window.open(bioUrl, '_blank');
        } catch (error) {
            console.error('Error getting user data:', error);
            // Fallback to ID-based URL
            const fallbackUrl = new URL(`bio.html?id=${currentUser.uid}`, window.location.href).href;
            console.log("Fallback preview URL:", fallbackUrl); // Debug log
            window.open(fallbackUrl, '_blank');
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

// Initialize dashboard when the page loads
initDashboard();