// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    alert("Error: Firebase not loaded. Please try refreshing.");
}

// Check if CSS is loaded properly
function checkCssLoaded() {
    const analyticsCard = document.querySelector('.analytics-card');
    if (analyticsCard) {
        const cardStyle = window.getComputedStyle(analyticsCard);
        const bgColor = cardStyle.backgroundColor;
        console.log("Analytics card background color:", bgColor);
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
            console.warn("Analytics CSS might not be loaded properly");
        } else {
            console.log("Analytics CSS appears to be loaded correctly");
        }
    } else {
        console.warn("Could not find analytics card element to check CSS");
    }
}

// Run CSS check after a short delay to ensure DOM is fully loaded
setTimeout(checkCssLoaded, 1000);

// DOM Elements
const totalViewsElement = document.getElementById('total-views');
const totalClicksElement = document.getElementById('total-clicks');
const clickRateElement = document.getElementById('click-rate');
const totalLinksElement = document.getElementById('total-links');
const linksTableBody = document.getElementById('links-table-body');
const timeRangeSelect = document.getElementById('time-range');
const chartTypeSelect = document.getElementById('chart-type');
const performanceChart = document.getElementById('performance-chart');
const devicesChart = document.getElementById('devices-chart');
const browsersChart = document.getElementById('browsers-chart');
const referrersChart = document.getElementById('referrers-chart');
const timeChart = document.getElementById('time-chart');
const geoTableBody = document.getElementById('geo-table-body');
const conversionTableBody = document.getElementById('conversion-table-body');
const logoutButton = document.getElementById('logout-button');
const basicTabButton = document.getElementById('basic-tab');
const advancedTabButton = document.getElementById('advanced-tab');
const basicTabContent = document.getElementById('basic-analytics');
const advancedTabContent = document.getElementById('advanced-analytics');
const upgradeButton = document.getElementById('upgrade-button');
// No plan badge in analytics page

// Global variables
let currentUser = null;
let userLinks = [];
let clicksData = [];
let userProfile = null;
let isPremiumUser = false;
let performanceChartInstance = null;
let devicesChartInstance = null;
let browsersChartInstance = null;
let referrersChartInstance = null;
let timeChartInstance = null;

// Chart colors
const chartColors = [
    'rgba(59, 130, 246, 0.7)',   // Blue
    'rgba(236, 72, 153, 0.7)',    // Pink
    'rgba(16, 185, 129, 0.7)',    // Green
    'rgba(245, 158, 11, 0.7)',    // Amber
    'rgba(139, 92, 246, 0.7)',    // Purple
    'rgba(239, 68, 68, 0.7)',     // Red
    'rgba(20, 184, 166, 0.7)',    // Teal
    'rgba(249, 115, 22, 0.7)'     // Orange
];

// Check authentication state
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('User authenticated:', user.uid);
            loadAnalyticsData(user.uid);
        } else {
            console.log('User is signed out. Redirecting to login.');
            window.location.href = 'login.html';
        }
    });
} else {
    console.error("Cannot check auth state because Firebase Auth is not loaded.");
    showError("Error loading user status.");
}

// Load analytics data
function loadAnalyticsData(userId) {
    // First check if user has completed onboarding
    db.collection('users').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            if (!userData.onboardingCompleted) {
                window.location.href = 'onboarding.html';
                return;
            }
            // Continue with analytics loading
            loadAnalyticsDataInternal(userId);
        } else {
            showError("User data not found.");
        }
    }).catch((error) => {
        console.error("Error checking user data:", error);
        showError("Error loading user data.");
    });
}

function loadAnalyticsDataInternal(userId) {
    // Show loading state
    showLoading();

    // First load user profile to check premium status
    loadUserProfile(userId)
        .then(() => {
            // Load user links
            return loadUserLinks(userId);
        })
        .then(() => {
            // Load clicks data
            return loadClicksData(userId);
        })
        .then(() => {
            // Update UI with basic data
            updateAnalyticsOverview();
            updateLinksTable();
            initializePerformanceChart(); // Only initialize the basic chart initially

            // Initialize tabs based on premium status
            initializeTabs();

            // Add event listeners for filters and tabs
            setupEventListeners();

            // Hide loading state
            hideLoading();
        })
        .catch(error => {
            console.error("Error loading analytics data:", error);

            // Check if it's an index error
            if (error.message && error.message.includes('index')) {
                // Handle index error with a more specific message
                showIndexErrorMessage(error.message);

                // Still try to show some UI with whatever data we have
                try {
                    updateAnalyticsOverview();
                    updateLinksTable();
                    initializeTabs();
                    initializePerformanceChart(); // Only initialize the basic chart
                    setupEventListeners();
                } catch (e) {
                    console.error("Error updating UI after index error:", e);
                }
            } else {
                // For other errors, show a generic message
                showError("Error loading analytics data. Please try again.");
            }

            hideLoading();
        });
}

// Load user profile to check premium status
async function loadUserProfile(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (userDoc.exists) {
            userProfile = userDoc.data();

            // Check if user has premium or creator subscription tier
            isPremiumUser = userProfile.subscriptionTier === 'premium' || userProfile.subscriptionTier === 'creator';

            // Check if premium has expired
            if (isPremiumUser && userProfile.subscriptionExpiration) {
                const expiryDate = userProfile.subscriptionExpiration.toDate();
                if (expiryDate < new Date()) {
                    isPremiumUser = false;

                    // We don't automatically update the user's subscription tier here
                    // as that should be handled by a separate process
                    console.log("User's premium subscription has expired");
                }
            }

            // No plan indicator in analytics page

            // Hide upgrade button for premium users
            if (upgradeButton) {
                upgradeButton.style.display = isPremiumUser ? 'none' : 'inline-block';
            }

            console.log("User premium status:", isPremiumUser);
            return userProfile;
        } else {
            console.log("No user profile found");
            isPremiumUser = false;
            return null;
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
        isPremiumUser = false;
        throw error;
    }
}

// No plan indicator in analytics page

// Initialize tabs based on premium status
function initializeTabs() {
    if (!basicTabButton || !advancedTabButton || !basicTabContent || !advancedTabContent) {
        console.warn("Tab elements not found");
        return;
    }

    // Variable to track if advanced charts have been initialized
    let advancedChartsInitialized = false;

    if (isPremiumUser) {
        console.log("Premium user detected - showing advanced analytics by default");

        // Enable advanced tab for premium users
        advancedTabButton.classList.remove('disabled');
        advancedTabButton.removeAttribute('disabled');

        // Show advanced tab by default for premium users
        basicTabButton.classList.remove('active');
        advancedTabButton.classList.add('active');
        basicTabContent.classList.remove('active');
        advancedTabContent.classList.add('active');

        // Remove premium overlays
        const premiumOverlays = document.querySelectorAll('.premium-overlay');
        premiumOverlays.forEach(overlay => overlay.remove());

        // Initialize advanced charts immediately
        initializeDevicesChart();
        initializeBrowsersChart();
        initializeReferrersChart();
        initializeTimeChart();
        updateGeoDistribution();
        updateConversionTracking();
        advancedChartsInitialized = true;

        // Add click event listener for tab switching
        basicTabButton.addEventListener('click', () => {
            // Switch to basic tab
            basicTabButton.classList.add('active');
            advancedTabButton.classList.remove('active');
            basicTabContent.classList.add('active');
            advancedTabContent.classList.remove('active');
        });

        advancedTabButton.addEventListener('click', () => {
            // Switch to advanced tab
            basicTabButton.classList.remove('active');
            advancedTabButton.classList.add('active');
            basicTabContent.classList.remove('active');
            advancedTabContent.classList.add('active');
        });
    } else {
        console.log("Free user detected - showing basic analytics only");

        // Show basic tab by default for free users
        basicTabButton.classList.add('active');
        basicTabContent.classList.add('active');
        advancedTabContent.classList.remove('active');

        // Disable advanced tab for free users
        advancedTabButton.classList.add('disabled');
        advancedTabButton.setAttribute('disabled', 'true');

        // Add premium overlays to advanced features
        const advancedFeatures = document.querySelectorAll('.premium-feature');
        advancedFeatures.forEach(feature => {
            if (!feature.querySelector('.premium-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'premium-overlay';
                overlay.innerHTML = `
                    <h3>Premium Feature</h3>
                    <p>Upgrade to BINK Premium to access advanced analytics</p>
                    <a href="pricing.html" class="upgrade-button">Upgrade Now</a>
                `;
                feature.appendChild(overlay);
            }
        });

        // Add click event for basic tab only (advanced is disabled)
        basicTabButton.addEventListener('click', () => {
            basicTabButton.classList.add('active');
            advancedTabButton.classList.remove('active');
            basicTabContent.classList.add('active');
            advancedTabContent.classList.remove('active');
        });
    }
}

// Load user links
async function loadUserLinks(userId) {
    try {
        // First try to load links from the user's collection
        try {
            const linksRef = db.collection('users').doc(userId).collection('links');
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
                    .where('userId', '==', userId)
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
            const linksRef = db.collection('users').doc(userId).collection('links');
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
                    .where('userId', '==', userId)
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

        console.log("Loaded links:", userLinks.length);
        return userLinks;
    } catch (error) {
        console.error("Error loading links:", error);
        throw error;
    }
}

// Load clicks data
async function loadClicksData(userId) {
    try {
        // Get date for filtering (default to 30 days)
        const daysAgo = parseInt(timeRangeSelect.value) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const clicksRef = db.collection('clicks');
        let querySnapshot;

        try {
            // Try to execute the query with filtering and ordering
            querySnapshot = await clicksRef
                .where('userId', '==', userId)
                .where('timestamp', '>=', startDate)
                .orderBy('timestamp', 'asc')
                .get();
        } catch (indexError) {
            // If we get an index error, try a simpler query
            if (indexError.message && indexError.message.includes('index')) {
                console.warn("Index error detected. Using fallback query without date filtering.");
                // Show a user-friendly message about the index
                showIndexErrorMessage(indexError.message);

                // Fallback to a simpler query that doesn't require the composite index
                querySnapshot = await clicksRef
                    .where('userId', '==', userId)
                    .get();
            } else {
                // If it's not an index error, rethrow it
                throw indexError;
            }
        }

        clicksData = [];

        querySnapshot.forEach(doc => {
            // If we're using the fallback query, filter by date in memory
            const data = doc.data();
            if (!startDate || !data.timestamp || data.timestamp.toDate() >= startDate) {
                clicksData.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // If we're using the fallback query, sort the data in memory
        clicksData.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return a.timestamp.toDate() - b.timestamp.toDate();
        });

        console.log("Loaded clicks:", clicksData.length);
        return clicksData;
    } catch (error) {
        console.error("Error loading clicks:", error);
        throw error;
    }
}

// Update analytics overview
function updateAnalyticsOverview() {
    if (currentUser) {
        // Get bio page data for page views
        db.collection('bioPages').doc(currentUser.uid).get()
            .then((bioDoc) => {
                let pageViews = 0;
                if (bioDoc.exists) {
                    const bioData = bioDoc.data();
                    pageViews = bioData.views || 0;
                }

                // Calculate total clicks from links
                let totalClicks = 0;
                if (userLinks && userLinks.length > 0) {
                    totalClicks = userLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
                }

                // Calculate click rate
                const clickRate = pageViews > 0 ? (totalClicks / pageViews) * 100 : 0;

                // Save stats to Firestore for consistency between dashboard and analytics
                db.collection('users').doc(currentUser.uid).collection('stats').doc('overview')
                    .set({
                        totalViews: pageViews,
                        totalClicks: totalClicks,
                        clickRate: clickRate,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true })
                    .then(() => {
                        console.log("Stats saved to Firestore for consistency");
                    })
                    .catch((error) => {
                        console.error("Error saving stats:", error);
                    });

                // Update UI
                if (totalViewsElement) totalViewsElement.textContent = formatNumber(pageViews);
                if (totalClicksElement) totalClicksElement.textContent = formatNumber(totalClicks);
                if (clickRateElement) clickRateElement.textContent = `${clickRate.toFixed(1)}%`;
                if (totalLinksElement) totalLinksElement.textContent = userLinks.length;

                console.log("Analytics overview updated:", { totalViews: pageViews, totalClicks, clickRate, totalLinks: userLinks.length });
            })
            .catch((error) => {
                console.error("Error getting bio page data:", error);

                // Fallback to calculating from links only
                let totalClicks = 0;
                if (userLinks && userLinks.length > 0) {
                    totalClicks = userLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
                }

                // Use estimated page views (typically higher than clicks)
                const pageViews = Math.max(35, totalClicks * 3); // At least 35 views or 3x clicks
                const clickRate = pageViews > 0 ? (totalClicks / pageViews) * 100 : 0;

                // Update UI
                if (totalViewsElement) totalViewsElement.textContent = formatNumber(pageViews);
                if (totalClicksElement) totalClicksElement.textContent = formatNumber(totalClicks);
                if (clickRateElement) clickRateElement.textContent = `${clickRate.toFixed(1)}%`;
                if (totalLinksElement) totalLinksElement.textContent = userLinks.length;
            });
    } else {
        // Fallback if no user
        const pageViews = 35;
        const totalClicks = 3;
        const clickRate = 8.6;

        // Update UI
        if (totalViewsElement) totalViewsElement.textContent = formatNumber(pageViews);
        if (totalClicksElement) totalClicksElement.textContent = formatNumber(totalClicks);
        if (clickRateElement) clickRateElement.textContent = `${clickRate.toFixed(1)}%`;
        if (totalLinksElement) totalLinksElement.textContent = userLinks.length;
    }
}

// Update links table
function updateLinksTable() {
    // Clear table
    linksTableBody.innerHTML = '';

    // If no links, show message
    if (userLinks.length === 0) {
        linksTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="5">No links found. Add links to see analytics.</td>
            </tr>
        `;
        return;
    }

    // Calculate metrics for each link using the actual click counts from the links collection
    // This ensures consistency with the dashboard
    const linkMetrics = userLinks.map(link => {
        // Use the clicks property directly from the link object
        const clicks = link.clicks || 0;

        // Calculate views (3x clicks or at least 3 for consistency)
        const views = Math.max(3, clicks * 3);

        // Calculate click rate
        const clickRate = views > 0 ? (clicks / views) * 100 : 0;

        // Get last click timestamp if available
        const lastClick = link.lastClickedAt ? link.lastClickedAt.toDate() : null;

        return {
            ...link,
            views,
            clicks,
            clickRate,
            lastClick
        };
    });

    // Sort by clicks (descending)
    linkMetrics.sort((a, b) => b.clicks - a.clicks);

    // Add to table
    linkMetrics.forEach(link => {
        const row = document.createElement('tr');

        // Determine click rate class
        let rateClass = 'low-rate';
        if (link.clickRate >= 10) {
            rateClass = 'high-rate';
        } else if (link.clickRate >= 5) {
            rateClass = 'medium-rate';
        }

        row.innerHTML = `
            <td>
                <div class="link-title">${link.title}</div>
                <div class="link-url" title="${link.url}">${link.url}</div>
            </td>
            <td>${formatNumber(link.views)}</td>
            <td>${formatNumber(link.clicks)}</td>
            <td><span class="click-rate ${rateClass}">${link.clickRate.toFixed(1)}%</span></td>
            <td>${link.lastClick ? formatDate(link.lastClick) : 'Never'}</td>
        `;

        linksTableBody.appendChild(row);
    });

    // Log the link metrics for debugging
    console.log("Link metrics for table:", linkMetrics);
}

// Initialize charts - now handled on demand
// Basic chart is initialized on page load
// Advanced charts are initialized when the advanced tab is clicked

// Update Geographic Distribution table
function updateGeoDistribution() {
    if (!geoTableBody) {
        console.error("Geographic table body element not found");
        return;
    }

    // Clear table
    geoTableBody.innerHTML = '';

    // Get actual geographic data from clicks collection
    if (currentUser) {
        db.collection('clicks')
            .where('userId', '==', currentUser.uid)
            .get()
            .then((snapshot) => {
                // Process clicks to extract country data
                const countries = {};
                let totalClicks = 0;

                snapshot.forEach(doc => {
                    const clickData = doc.data();
                    // Use the country from the click data, or 'Unknown' if not available
                    const country = (clickData.geo && clickData.geo.country) ? clickData.geo.country : 'Unknown';

                    // Increment country count
                    if (!countries[country]) {
                        countries[country] = 0;
                    }
                    countries[country]++;
                    totalClicks++;
                });

                // Convert to array format for display
                const geoData = Object.keys(countries).map(country => {
                    const visitors = countries[country];
                    const percentage = totalClicks > 0 ? Math.round((visitors / totalClicks) * 100) : 0;
                    return { country, visitors, percentage };
                });

                // Display the data
                if (geoData.length > 0) {
                    displayGeoData(geoData);
                } else {
                    // If no data, show message
                    geoTableBody.innerHTML = `
                        <tr class="placeholder-row">
                            <td colspan="3">No geographic data available yet. This will populate as users interact with your links.</td>
                        </tr>
                    `;
                }

                // Save the data for future reference
                if (currentUser && geoData.length > 0) {
                    db.collection('users').doc(currentUser.uid).collection('geoStats').doc('countries')
                        .set({
                            countries: geoData,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true })
                        .catch(error => console.error("Error saving geo stats:", error));
                }
            })
            .catch((error) => {
                console.error("Error getting geographic data:", error);
                geoTableBody.innerHTML = `
                    <tr class="placeholder-row">
                        <td colspan="3">Error loading geographic data. Please try again.</td>
                    </tr>
                `;
            });
    } else {
        geoTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="3">Please log in to view geographic data.</td>
            </tr>
        `;
    }
}

// Display geographic data in the table
function displayGeoData(geoData) {
    if (!geoTableBody) return;

    // Sort by visitors (descending)
    geoData.sort((a, b) => b.visitors - a.visitors);

    // Add to table
    geoData.forEach(item => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${item.country}</td>
            <td>${formatNumber(item.visitors)}</td>
            <td>${item.percentage}%</td>
        `;

        geoTableBody.appendChild(row);
    });
}

// Update Conversion Tracking table
function updateConversionTracking() {
    if (!conversionTableBody) {
        console.error("Conversion table body element not found");
        return;
    }

    // Clear table
    conversionTableBody.innerHTML = '';

    // We'll use real link data and calculate conversions based on actual link performance
    if (currentUser && userLinks && userLinks.length > 0) {
        // Get conversion events from Firestore if they exist
        db.collection('users').doc(currentUser.uid).collection('conversions')
            .get()
            .then((snapshot) => {
                // Process conversion data
                const conversions = {};

                // First, initialize with all links
                userLinks.forEach(link => {
                    conversions[link.id] = {
                        id: link.id,
                        title: link.title,
                        clicks: link.clicks || 0,
                        conversions: 0,
                        revenue: 0
                    };
                });

                // Then add actual conversion data if available
                snapshot.forEach(doc => {
                    const conversionData = doc.data();
                    const linkId = conversionData.linkId;

                    if (linkId && conversions[linkId]) {
                        conversions[linkId].conversions++;
                        // Add revenue if available, otherwise use default value
                        conversions[linkId].revenue += conversionData.value || 10;
                    }
                });

                // Convert to array and calculate rates
                const conversionData = Object.values(conversions).map(item => {
                    const rate = item.clicks > 0 ? Math.round((item.conversions / item.clicks) * 100) : 0;
                    return {
                        ...item,
                        rate
                    };
                });

                // Display the data
                if (conversionData.length > 0) {
                    displayConversionData(conversionData);
                } else {
                    // If no data, show message
                    conversionTableBody.innerHTML = `
                        <tr class="placeholder-row">
                            <td colspan="5">No conversion data available yet. This will populate as users complete actions on your links.</td>
                        </tr>
                    `;
                }
            })
            .catch((error) => {
                console.error("Error getting conversion data:", error);

                // Fall back to showing links without conversion data
                const basicConversionData = userLinks.map(link => {
                    return {
                        id: link.id,
                        title: link.title,
                        clicks: link.clicks || 0,
                        conversions: 0,
                        rate: 0,
                        revenue: 0
                    };
                });

                displayConversionData(basicConversionData);
            });
    } else {
        conversionTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="5">No links available. Add links to track conversions.</td>
            </tr>
        `;
    }
}

// Display conversion data in the table
function displayConversionData(conversionData) {
    if (!conversionTableBody) return;

    // Sort by conversions (descending)
    conversionData.sort((a, b) => b.conversions - a.conversions);

    // Add to table
    conversionData.forEach(item => {
        const row = document.createElement('tr');

        // Determine rate class
        let rateClass = 'low-rate';
        if (item.rate >= 10) {
            rateClass = 'high-rate';
        } else if (item.rate >= 5) {
            rateClass = 'medium-rate';
        }

        row.innerHTML = `
            <td>${item.title}</td>
            <td>${formatNumber(item.clicks)}</td>
            <td>${formatNumber(item.conversions)}</td>
            <td><span class="click-rate ${rateClass}">${item.rate}%</span></td>
            <td>₦${formatNumber(item.revenue)}</td>
        `;

        conversionTableBody.appendChild(row);
    });
}

// Initialize performance chart
function initializePerformanceChart() {
    try {
        if (!performanceChart) {
            console.error("Performance chart canvas element not found");
            return;
        }

        console.log("Initializing performance chart");
        const ctx = performanceChart.getContext('2d');

        // Prepare data
        const { labels, views, clicks } = preparePerformanceData();

        // Destroy existing chart if it exists
        if (performanceChartInstance) {
            performanceChartInstance.destroy();
        }

        // Get chart type (default to line)
        const chartType = chartTypeSelect ? chartTypeSelect.value : 'line';
        console.log("Chart type:", chartType);

        // Create chart
        performanceChartInstance = new Chart(ctx, {
            type: chartType || 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Views',
                        data: views,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Clicks',
                        data: clicks,
                        backgroundColor: 'rgba(236, 72, 153, 0.2)',
                        borderColor: 'rgba(236, 72, 153, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e5e7eb'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(55, 65, 81, 0.3)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(55, 65, 81, 0.3)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    }
                }
            }
        });

        console.log("Performance chart initialized successfully");
    } catch (error) {
        console.error("Error initializing performance chart:", error);
    }
}

// Initialize devices chart
function initializeDevicesChart() {
    const ctx = devicesChart.getContext('2d');

    // Prepare data
    const deviceData = prepareDeviceData();

    // Destroy existing chart if it exists
    if (devicesChartInstance) {
        devicesChartInstance.destroy();
    }

    // Create chart
    devicesChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: deviceData.labels,
            datasets: [{
                data: deviceData.data,
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e7eb',
                        padding: 10,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Initialize browsers chart
function initializeBrowsersChart() {
    const ctx = browsersChart.getContext('2d');

    // Prepare data
    const browserData = prepareBrowserData();

    // Destroy existing chart if it exists
    if (browsersChartInstance) {
        browsersChartInstance.destroy();
    }

    // Create chart
    browsersChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: browserData.labels,
            datasets: [{
                data: browserData.data,
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e7eb',
                        padding: 10,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Initialize referrers chart
function initializeReferrersChart() {
    const ctx = referrersChart.getContext('2d');

    // Prepare data
    const referrerData = prepareReferrerData();

    // Destroy existing chart if it exists
    if (referrersChartInstance) {
        referrersChartInstance.destroy();
    }

    // Create chart
    referrersChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: referrerData.labels,
            datasets: [{
                data: referrerData.data,
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e7eb',
                        padding: 10,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Initialize time chart
function initializeTimeChart() {
    const ctx = timeChart.getContext('2d');

    // Prepare data
    const timeData = prepareTimeData();

    // Destroy existing chart if it exists
    if (timeChartInstance) {
        timeChartInstance.destroy();
    }

    // Create chart
    timeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: timeData.labels,
            datasets: [{
                data: timeData.data,
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e7eb',
                        padding: 10,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Prepare performance data
function preparePerformanceData() {
    // Get date range
    const daysAgo = parseInt(timeRangeSelect ? timeRangeSelect.value : 30) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Create array of dates
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Format dates for labels
    const labels = dates.map(date => formatDateShort(date));

    // Initialize data arrays
    const views = Array(dates.length).fill(0);
    const clicks = Array(dates.length).fill(0);

    // Check if we have real click data
    if (clicksData.length > 0) {
        // Group clicks by date
        clicksData.forEach(click => {
            if (click.timestamp) {
                const clickDate = click.timestamp.toDate();
                const dayIndex = Math.floor((clickDate - startDate) / (24 * 60 * 60 * 1000));
                if (dayIndex >= 0 && dayIndex < dates.length) {
                    clicks[dayIndex]++;
                    // Simulate views (in a real app, you'd track this separately)
                    views[dayIndex] += Math.floor(Math.random() * 3) + 1;
                }
            }
        });

        // Add some randomness to views for demonstration
        for (let i = 0; i < views.length; i++) {
            if (views[i] === 0 && Math.random() > 0.7) {
                views[i] = Math.floor(Math.random() * 5) + 1;
            } else if (views[i] > 0) {
                views[i] += Math.floor(Math.random() * 3);
            }
        }
    } else {
        // No real data, generate placeholder data
        console.log("No clicks data found, using placeholder data for performance chart");

        // Generate some random data for demonstration
        for (let i = 0; i < dates.length; i++) {
            // More activity on weekends and recent days
            const isWeekend = [0, 6].includes(dates[i].getDay());
            const recencyFactor = 1 + ((i / dates.length) * 2); // Higher for more recent days

            clicks[i] = Math.floor(Math.random() * 3 * recencyFactor) + (isWeekend ? 2 : 0);
            views[i] = clicks[i] + Math.floor(Math.random() * 5 * recencyFactor) + (isWeekend ? 5 : 2);
        }
    }

    console.log("Performance data prepared:", {
        dateRange: `${formatDateShort(startDate)} to ${formatDateShort(endDate)}`,
        totalViews: views.reduce((sum, val) => sum + val, 0),
        totalClicks: clicks.reduce((sum, val) => sum + val, 0)
    });

    return { labels, views, clicks };
}

// Prepare device data
function prepareDeviceData() {
    // In a real app, you'd extract this from user agent or analytics
    // This is simulated data for demonstration
    const devices = {
        'Mobile': 0,
        'Desktop': 0,
        'Tablet': 0
    };

    // Simulate device distribution
    clicksData.forEach(click => {
        const userAgent = click.userAgent || '';
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            devices['Mobile']++;
        } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
            devices['Tablet']++;
        } else {
            devices['Desktop']++;
        }
    });

    // If no data, add placeholder
    if (Object.values(devices).every(val => val === 0)) {
        devices['Mobile'] = 15;
        devices['Desktop'] = 25;
        devices['Tablet'] = 5;
    }

    return {
        labels: Object.keys(devices),
        data: Object.values(devices)
    };
}

// Prepare browser data
function prepareBrowserData() {
    // In a real app, you'd extract this from user agent or analytics
    // This is simulated data for demonstration
    const browsers = {
        'Chrome': 0,
        'Firefox': 0,
        'Safari': 0,
        'Edge': 0,
        'Other': 0
    };

    // Simulate browser distribution
    clicksData.forEach(click => {
        const userAgent = click.userAgent || '';
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browsers['Chrome']++;
        } else if (userAgent.includes('Firefox')) {
            browsers['Firefox']++;
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browsers['Safari']++;
        } else if (userAgent.includes('Edg')) {
            browsers['Edge']++;
        } else {
            browsers['Other']++;
        }
    });

    // If no data, add placeholder
    if (Object.values(browsers).every(val => val === 0)) {
        browsers['Chrome'] = 30;
        browsers['Firefox'] = 10;
        browsers['Safari'] = 15;
        browsers['Edge'] = 8;
        browsers['Other'] = 5;
    }

    return {
        labels: Object.keys(browsers),
        data: Object.values(browsers)
    };
}

// Prepare referrer data
function prepareReferrerData() {
    // In a real app, you'd track referrers
    // This is simulated data for demonstration
    const referrers = {
        'Direct': 0,
        'Social Media': 0,
        'Search': 0,
        'Email': 0,
        'Other': 0
    };

    // Simulate referrer distribution
    clicksData.forEach(click => {
        const referrer = click.referrer || 'direct';
        if (referrer === 'direct') {
            referrers['Direct']++;
        } else if (
            referrer.includes('facebook') ||
            referrer.includes('twitter') ||
            referrer.includes('instagram') ||
            referrer.includes('linkedin')
        ) {
            referrers['Social Media']++;
        } else if (
            referrer.includes('google') ||
            referrer.includes('bing') ||
            referrer.includes('yahoo')
        ) {
            referrers['Search']++;
        } else if (
            referrer.includes('mail') ||
            referrer.includes('outlook') ||
            referrer.includes('gmail')
        ) {
            referrers['Email']++;
        } else {
            referrers['Other']++;
        }
    });

    // If no data, add placeholder
    if (Object.values(referrers).every(val => val === 0)) {
        referrers['Direct'] = 20;
        referrers['Social Media'] = 25;
        referrers['Search'] = 15;
        referrers['Email'] = 10;
        referrers['Other'] = 5;
    }

    return {
        labels: Object.keys(referrers),
        data: Object.values(referrers)
    };
}

// Prepare time data
function prepareTimeData() {
    // In a real app, you'd track time of day
    // This is simulated data for demonstration
    const timeSlots = {
        'Morning (6-12)': 0,
        'Afternoon (12-18)': 0,
        'Evening (18-24)': 0,
        'Night (0-6)': 0
    };

    // Simulate time distribution
    clicksData.forEach(click => {
        if (click.timestamp) {
            const hour = click.timestamp.toDate().getHours();
            if (hour >= 6 && hour < 12) {
                timeSlots['Morning (6-12)']++;
            } else if (hour >= 12 && hour < 18) {
                timeSlots['Afternoon (12-18)']++;
            } else if (hour >= 18 && hour < 24) {
                timeSlots['Evening (18-24)']++;
            } else {
                timeSlots['Night (0-6)']++;
            }
        }
    });

    // If no data, add placeholder
    if (Object.values(timeSlots).every(val => val === 0)) {
        timeSlots['Morning (6-12)'] = 15;
        timeSlots['Afternoon (12-18)'] = 30;
        timeSlots['Evening (18-24)'] = 25;
        timeSlots['Night (0-6)'] = 10;
    }

    return {
        labels: Object.keys(timeSlots),
        data: Object.values(timeSlots)
    };
}

// Setup event listeners
function setupEventListeners() {
    // Time range change
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
            loadClicksData(currentUser.uid)
                .then(() => {
                    updateAnalyticsOverview();
                    updateLinksTable();
                    initializePerformanceChart(); // Only reinitialize the basic chart
                })
                .catch(error => {
                    console.error("Error reloading data:", error);
                    showError("Error updating data. Please try again.");
                });
        });
    }

    // Chart type change
    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', () => {
            initializePerformanceChart();
        });
    }

    // Tab switching is now handled in the initializeTabs function

    // Upgrade button
    if (upgradeButton) {
        upgradeButton.addEventListener('click', () => {
            window.location.href = 'pricing.html';
        });
    }

    // Logout button
    if (logoutButton && auth) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('User signed out successfully.');
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
                showError(`Failed to log out: ${error.message}`);
            });
        });
    }

    // No sidebar logout button anymore
}

// Helper Functions
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatDateShort(date) {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Show loading state
function showLoading() {
    // Add loading indicators to each section
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';

        // Hide existing content
        Array.from(section.children).forEach(child => {
            child.style.display = 'none';
        });

        // Add loading indicator
        section.appendChild(loadingIndicator);
    });
}

// Hide loading state
function hideLoading() {
    // Remove loading indicators
    const loadingIndicators = document.querySelectorAll('.loading-indicator');
    loadingIndicators.forEach(indicator => {
        indicator.remove();
    });

    // Show content
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        Array.from(section.children).forEach(child => {
            child.style.display = '';
        });
    });
}

// Show error message
function showError(message) {
    alert(message);
}

// Show index error message
function showIndexErrorMessage(errorMessage) {
    // Extract the index creation URL from the error message
    const indexUrlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;

    // Create a notification element
    const notification = document.createElement('div');
    notification.className = 'index-error-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>Database Index Required</h3>
            <p>Some analytics features require a database index to be created.</p>
            <p>Please click the button below to create the required index (admin access required):</p>
            <div class="notification-actions">
                <a href="${indexUrl}" target="_blank" class="index-create-button">Create Index</a>
                <button class="notification-close">Dismiss</button>
            </div>
        </div>
    `;

    // Add styles for the notification
    const style = document.createElement('style');
    style.textContent = `
        .index-error-notification {
            position: fixed;
            top: 80px;
            right: 20px;
            max-width: 400px;
            background-color: var(--card-background);
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .notification-content {
            padding: 20px;
        }

        .notification-content h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #f59e0b;
        }

        .notification-content p {
            margin-bottom: 15px;
            color: var(--text-color);
        }

        .notification-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }

        .index-create-button {
            background-color: #f59e0b;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }

        .index-create-button:hover {
            background-color: #d97706;
            text-decoration: none;
            color: white;
        }

        .notification-close {
            background-color: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .notification-close:hover {
            background-color: var(--border-color);
        }
    `;

    // Add the notification and styles to the document
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Add event listener to close button
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.remove();
            style.remove();
        });
    }

    // Auto-remove after 60 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
            style.remove();
        }
    }, 60000);
}
