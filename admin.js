// Ensure Firebase config is loaded and auth/db are available
if (typeof auth === 'undefined' || auth === null || typeof db === 'undefined' || db === null) {
    console.error("Firebase Auth/Firestore is not initialized.");
    alert("Error: Firebase not loaded. Please try refreshing.");
}

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const adminTabs = document.querySelectorAll('.admin-tab');
const totalUsersElement = document.getElementById('total-users');
const premiumUsersElement = document.getElementById('premium-users');
const creatorUsersElement = document.getElementById('creator-users');
const monthlyRevenueElement = document.getElementById('monthly-revenue');
const activityListElement = document.getElementById('activity-list');
const userGrowthChart = document.getElementById('user-growth-chart');
const revenueChart = document.getElementById('revenue-chart');
const usersTableBody = document.getElementById('users-table-body');
const userSearchInput = document.getElementById('user-search');
const userFilterSelect = document.getElementById('user-filter');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfoElement = document.getElementById('page-info');
const subscriptionsTableBody = document.getElementById('subscriptions-table-body');
const subscriptionSearchInput = document.getElementById('subscription-search');
const subscriptionFilterSelect = document.getElementById('subscription-filter');
const subscriptionPrevPageButton = document.getElementById('subscription-prev-page');
const subscriptionNextPageButton = document.getElementById('subscription-next-page');
const subscriptionPageInfoElement = document.getElementById('subscription-page-info');
const applicationsTableBody = document.getElementById('applications-table-body');
const applicationFilterSelect = document.getElementById('application-filter');
const paymentsTableBody = document.getElementById('payments-table-body');
const paymentSearchInput = document.getElementById('payment-search');
const paymentFilterSelect = document.getElementById('payment-filter');
const paymentPrevPageButton = document.getElementById('payment-prev-page');
const paymentNextPageButton = document.getElementById('payment-next-page');
const paymentPageInfoElement = document.getElementById('payment-page-info');
const userModal = document.getElementById('user-modal');
const userDetailsContainer = document.getElementById('user-details-container');
const editUserButton = document.getElementById('edit-user-button');
const deleteUserButton = document.getElementById('delete-user-button');
const applicationModal = document.getElementById('application-modal');
const applicationDetailsContainer = document.getElementById('application-details-container');
const approveApplicationButton = document.getElementById('approve-application-button');
const rejectApplicationButton = document.getElementById('reject-application-button');
const closeModalButtons = document.querySelectorAll('.close-modal');
const logoutButton = document.getElementById('logout-button');
const adminWelcome = document.getElementById('admin-welcome');

// Global variables
let currentUser = null;
let isAdmin = false;
let userGrowthChartInstance = null;
let revenueChartInstance = null;
let users = [];
let subscriptions = [];
let applications = [];
let payments = [];
let currentUserPage = 1;
let usersPerPage = 10;
let currentSubscriptionPage = 1;
let subscriptionsPerPage = 10;
let currentPaymentPage = 1;
let paymentsPerPage = 10;
let selectedUserId = null;
let selectedApplicationId = null;
let selectedPaymentId = null;

// Chart colors
const chartColors = {
    blue: 'rgba(59, 130, 246, 0.7)',
    blueLight: 'rgba(59, 130, 246, 0.2)',
    pink: 'rgba(236, 72, 153, 0.7)',
    pinkLight: 'rgba(236, 72, 153, 0.2)',
    green: 'rgba(16, 185, 129, 0.7)',
    greenLight: 'rgba(16, 185, 129, 0.2)'
};

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
    showError("Error loading user status.");
}

// Check if user is an admin
function checkAdminStatus(userId) {
    const userDocRef = db.collection('users').doc(userId);
    userDocRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            isAdmin = userData.isAdmin === true;

            if (isAdmin) {
                console.log("Admin access granted");
                adminWelcome.textContent = `Welcome, ${userData.displayName || userData.username || 'Admin'}`;
                loadAdminData();
            } else {
                console.log("Not an admin. Redirecting to dashboard.");
                alert("You do not have admin privileges.");
                window.location.href = 'dashboard.html';
            }
        } else {
            console.log("No such user document!");
            alert("User data not found.");
            auth.signOut();
        }
    }).catch((error) => {
        console.error("Error checking admin status:", error);
        showError(`Error checking admin status: ${error.message}`);
    });
}

// Load admin data
function loadAdminData() {
    loadOverviewData();
    loadUsers();
    loadSubscriptions();
    loadApplications();
    loadPayments();
    loadPlatformSettings();

    // Token requests are handled in admin-token-requests.js
}

// Load platform settings
function loadPlatformSettings() {
    db.collection('settings').doc('platform').get()
        .then((doc) => {
            if (doc.exists) {
                const settings = doc.data();

                // Update form fields with settings
                document.getElementById('site-name').value = settings.siteName || 'BINK';
                document.getElementById('contact-email').value = settings.contactEmail || 'support@bink.com';
                document.getElementById('premium-price').value = settings.premiumPrice || 2500;
                document.getElementById('creator-price').value = settings.creatorPrice || 6000;
                document.getElementById('lifetime-plan-price').value = settings.lifetimePlanPrice || 60000;

                // Set lifetime plan toggle
                const lifetimePlanEnabled = settings.lifetimePlanEnabled || false;
                document.getElementById('lifetime-plan-enabled').checked = lifetimePlanEnabled;

                console.log('Platform settings loaded:', settings);
            } else {
                console.log('No platform settings found, using defaults');
                // Create default settings
                savePlatformSettings();
            }
        })
        .catch((error) => {
            console.error('Error loading platform settings:', error);
        });
}

// Save platform settings
function savePlatformSettings() {
    const siteName = document.getElementById('site-name').value;
    const contactEmail = document.getElementById('contact-email').value;
    const premiumPrice = parseInt(document.getElementById('premium-price').value);
    const creatorPrice = parseInt(document.getElementById('creator-price').value);
    const lifetimePlanEnabled = document.getElementById('lifetime-plan-enabled').checked;
    const lifetimePlanPrice = parseInt(document.getElementById('lifetime-plan-price').value);

    const settings = {
        siteName,
        contactEmail,
        premiumPrice,
        creatorPrice,
        lifetimePlanEnabled,
        lifetimePlanPrice,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser.uid
    };

    db.collection('settings').doc('platform').set(settings, { merge: true })
        .then(() => {
            console.log('Platform settings saved successfully');
            alert('Platform settings saved successfully');
        })
        .catch((error) => {
            console.error('Error saving platform settings:', error);
            showError(`Error saving platform settings: ${error.message}`);
        });
}

// Load overview data
function loadOverviewData() {
    // Load user counts
    db.collection('users').get().then((snapshot) => {
        const totalUsers = snapshot.size;
        let premiumUsers = 0;
        let creatorUsers = 0;

        snapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.subscriptionTier === 'premium') {
                premiumUsers++;
            } else if (userData.subscriptionTier === 'creator') {
                creatorUsers++;
            }
        });

        totalUsersElement.textContent = totalUsers;
        premiumUsersElement.textContent = premiumUsers;
        creatorUsersElement.textContent = creatorUsers;
    }).catch((error) => {
        console.error("Error loading user counts:", error);
    });

    // Load monthly revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Use a simpler query to avoid needing a composite index
    db.collection('payments')
        .get()
        .then((snapshot) => {
            let revenue = 0;

            snapshot.forEach((doc) => {
                const paymentData = doc.data();

                // Filter in code instead of in the query
                if (paymentData.status === 'completed' &&
                    paymentData.createdAt &&
                    paymentData.createdAt.toDate() >= startOfMonth) {
                    revenue += paymentData.amount || 0;
                }
            });

            monthlyRevenueElement.textContent = `₦${formatNumber(revenue)}`;
        })
        .catch((error) => {
            console.error("Error loading revenue:", error);
        });

    // Load recent activity
    loadRecentActivity();

    // Initialize charts
    initializeUserGrowthChart();
    initializeRevenueChart();
}

// Load recent activity
function loadRecentActivity() {
    // Clear activity list
    activityListElement.innerHTML = '';

    // Get recent activities (users, payments, applications)
    const activities = [];

    // Get recent users
    db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const userData = doc.data();
                activities.push({
                    type: 'user',
                    title: 'New User Registered',
                    name: userData.username || userData.email,
                    timestamp: userData.createdAt,
                    icon: 'user-plus'
                });
            });

            // Get recent payments
            return db.collection('payments')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
        })
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const paymentData = doc.data();
                // Add null check for plan property
                const planName = paymentData.plan
                    ? `${paymentData.plan.charAt(0).toUpperCase() + paymentData.plan.slice(1)}`
                    : 'Token';
                activities.push({
                    type: 'payment',
                    title: `New ${planName} Subscription`,
                    name: paymentData.userId,
                    timestamp: paymentData.createdAt,
                    icon: 'credit-card'
                });
            });

            // Get recent applications
            return db.collection('creatorApplications')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
        })
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const applicationData = doc.data();
                activities.push({
                    type: 'application',
                    title: 'Creator Application Received',
                    name: applicationData.username || applicationData.email,
                    timestamp: applicationData.createdAt,
                    icon: 'user-check'
                });
            });

            // Sort activities by timestamp
            activities.sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return b.timestamp.toDate() - a.timestamp.toDate();
            });

            // Display activities
            activities.slice(0, 10).forEach((activity) => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';

                const timeAgo = activity.timestamp ? formatTimeAgo(activity.timestamp.toDate()) : 'recently';

                activityItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas fa-${activity.icon}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-meta">${activity.name} - ${timeAgo}</div>
                    </div>
                `;

                activityListElement.appendChild(activityItem);
            });
        })
        .catch((error) => {
            console.error("Error loading activities:", error);
            activityListElement.innerHTML = '<div class="activity-item">Error loading activities</div>';
        });
}

// Initialize user growth chart
function initializeUserGrowthChart() {
    const ctx = userGrowthChart.getContext('2d');

    // Get last 6 months
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(month);
    }

    // Prepare data arrays
    const labels = months.map(month => month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    const totalUsers = Array(months.length).fill(0);
    const premiumUsers = Array(months.length).fill(0);
    const creatorUsers = Array(months.length).fill(0);

    // Get user data
    db.collection('users').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData.createdAt) {
                    const createdAt = userData.createdAt.toDate();

                    // Find which month this user belongs to
                    for (let i = 0; i < months.length; i++) {
                        if (createdAt < months[i]) continue;

                        // If this is the last month or the user was created before the next month
                        if (i === months.length - 1 || createdAt < months[i + 1]) {
                            totalUsers[i]++;

                            if (userData.subscriptionTier === 'premium') {
                                premiumUsers[i]++;
                            } else if (userData.subscriptionTier === 'creator') {
                                creatorUsers[i]++;
                            }

                            break;
                        }
                    }
                }
            });

            // Make the data cumulative
            for (let i = 1; i < months.length; i++) {
                totalUsers[i] += totalUsers[i - 1];
                premiumUsers[i] += premiumUsers[i - 1];
                creatorUsers[i] += creatorUsers[i - 1];
            }

            // Create chart
            if (userGrowthChartInstance) {
                userGrowthChartInstance.destroy();
            }

            userGrowthChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total Users',
                            data: totalUsers,
                            backgroundColor: chartColors.blueLight,
                            borderColor: chartColors.blue,
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Premium Users',
                            data: premiumUsers,
                            backgroundColor: chartColors.pinkLight,
                            borderColor: chartColors.pink,
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Content Creators',
                            data: creatorUsers,
                            backgroundColor: chartColors.greenLight,
                            borderColor: chartColors.green,
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
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
        })
        .catch((error) => {
            console.error("Error loading user growth data:", error);
        });
}

// Initialize revenue chart
function initializeRevenueChart() {
    const ctx = revenueChart.getContext('2d');

    // Get last 6 months
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(month);
    }

    // Prepare data arrays
    const labels = months.map(month => month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    const revenue = Array(months.length).fill(0);

    // Get payment data
    db.collection('payments')
        .where('status', '==', 'completed')
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const paymentData = doc.data();
                if (paymentData.createdAt) {
                    const createdAt = paymentData.createdAt.toDate();

                    // Find which month this payment belongs to
                    for (let i = 0; i < months.length; i++) {
                        if (createdAt < months[i]) continue;

                        // If this is the last month or the payment was created before the next month
                        if (i === months.length - 1 || createdAt < months[i + 1]) {
                            revenue[i] += paymentData.amount || 0;
                            break;
                        }
                    }
                }
            });

            // Create chart
            if (revenueChartInstance) {
                revenueChartInstance.destroy();
            }

            revenueChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Revenue (₦)',
                            data: revenue,
                            backgroundColor: chartColors.green,
                            borderColor: chartColors.green,
                            borderWidth: 1
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
                            callbacks: {
                                label: function(context) {
                                    return '₦' + formatNumber(context.raw);
                                }
                            }
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
                                color: '#9ca3af',
                                callback: function(value) {
                                    return '₦' + formatNumber(value);
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch((error) => {
            console.error("Error loading revenue data:", error);
        });
}

// Load users
function loadUsers() {
    db.collection('users')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            users = [];
            snapshot.forEach((doc) => {
                const userData = doc.data();

                // Check for expired subscriptions using premium enforcement if available
                if (window.PremiumEnforcement && typeof window.PremiumEnforcement.checkPremiumStatus === 'function') {
                    const isValid = window.PremiumEnforcement.checkPremiumStatus(userData, doc.id);
                    if (!isValid && (userData.subscriptionTier === 'premium' || userData.subscriptionTier === 'creator')) {
                        // Update local data to reflect the change
                        userData.subscriptionTier = 'free';
                        userData.subscriptionExpired = true;
                    }
                } else {
                    // Fallback to legacy check for expired subscriptions (except lifetime)
                    if (userData.subscriptionTier &&
                        userData.subscriptionTier !== 'free' &&
                        userData.subscriptionDuration !== 'lifetime' &&
                        userData.subscriptionExpiration) {

                        const expiryDate = userData.subscriptionExpiration.toDate();
                        const now = new Date();

                        // If subscription has expired, revert to free plan
                        if (expiryDate < now) {
                            console.log(`User ${doc.id} subscription has expired. Reverting to free plan.`);

                            // Update user document to free plan
                            db.collection('users').doc(doc.id).update({
                                subscriptionTier: 'free',
                                subscriptionExpired: true,
                                lastSubscriptionTier: userData.subscriptionTier,
                                lastSubscriptionExpiration: userData.subscriptionExpiration,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            }).then(() => {
                                console.log(`User ${doc.id} reverted to free plan.`);
                            }).catch(error => {
                                console.error(`Error reverting user ${doc.id} to free plan:`, error);
                            });

                            // Update local data to reflect the change
                            userData.subscriptionTier = 'free';
                            userData.subscriptionExpired = true;
                            userData.lastSubscriptionTier = userData.subscriptionTier;
                            userData.lastSubscriptionExpiration = userData.subscriptionExpiration;
                        }
                    }
                }

                users.push({
                    id: doc.id,
                    ...userData
                });
            });

            updateUsersTable();
        })
        .catch((error) => {
            console.error("Error loading users:", error);
            usersTableBody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="6">Error loading users: ${error.message}</td>
                </tr>
            `;
        });
}

// Update users table
function updateUsersTable() {
    // Clear table
    usersTableBody.innerHTML = '';

    // Filter users
    let filteredUsers = [...users];

    // Apply search filter
    const searchTerm = userSearchInput.value.toLowerCase();
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(user =>
            (user.username && user.username.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
        );
    }

    // Apply subscription filter
    const filterValue = userFilterSelect.value;
    if (filterValue !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.subscriptionTier === filterValue);
    }

    // If no users, show message
    if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="6">No users found</td>
            </tr>
        `;
        return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (currentUserPage > totalPages) {
        currentUserPage = totalPages;
    }

    const startIndex = (currentUserPage - 1) * usersPerPage;
    const endIndex = Math.min(startIndex + usersPerPage, filteredUsers.length);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Update pagination info
    pageInfoElement.textContent = `Page ${currentUserPage} of ${totalPages}`;

    // Enable/disable pagination buttons
    prevPageButton.disabled = currentUserPage === 1;
    nextPageButton.disabled = currentUserPage === totalPages;

    // Add users to table
    paginatedUsers.forEach(user => {
        const row = document.createElement('tr');

        // Determine status class
        let statusClass = 'status-active';
        let statusText = 'Active';

        if (user.disabled) {
            statusClass = 'status-expired';
            statusText = 'Disabled';
        }

        const joinedDate = user.createdAt ? formatDate(user.createdAt.toDate()) : 'N/A';
        const subscriptionTier = user.subscriptionTier ?
            user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1) :
            'Free';

        row.innerHTML = `
            <td>${user.username || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${subscriptionTier}</td>
            <td>${joinedDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-button view-user-button" data-id="${user.id}">View</button>
            </td>
        `;

        // Add event listener to view button
        row.querySelector('.view-user-button').addEventListener('click', () => {
            openUserModal(user.id);
        });

        usersTableBody.appendChild(row);
    });
}

// Load subscriptions
function loadSubscriptions() {
    db.collection('users')
        .where('subscriptionTier', 'in', ['premium', 'creator'])
        .get()
        .then((snapshot) => {
            subscriptions = [];
            snapshot.forEach((doc) => {
                subscriptions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            updateSubscriptionsTable();
        })
        .catch((error) => {
            console.error("Error loading subscriptions:", error);
            subscriptionsTableBody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="6">Error loading subscriptions: ${error.message}</td>
                </tr>
            `;
        });
}

// Update subscriptions table
function updateSubscriptionsTable() {
    // Clear table
    subscriptionsTableBody.innerHTML = '';

    // Filter subscriptions
    let filteredSubscriptions = [...subscriptions];

    // Apply search filter
    const searchTerm = subscriptionSearchInput.value.toLowerCase();
    if (searchTerm) {
        filteredSubscriptions = filteredSubscriptions.filter(subscription =>
            (subscription.username && subscription.username.toLowerCase().includes(searchTerm)) ||
            (subscription.email && subscription.email.toLowerCase().includes(searchTerm))
        );
    }

    // Apply status filter
    const filterValue = subscriptionFilterSelect.value;
    if (filterValue !== 'all') {
        if (filterValue === 'active' || filterValue === 'expired') {
            const now = new Date();
            filteredSubscriptions = filteredSubscriptions.filter(subscription => {
                const isExpired = subscription.subscriptionExpiration &&
                    subscription.subscriptionExpiration.toDate() < now;
                return filterValue === 'active' ? !isExpired : isExpired;
            });
        } else {
            filteredSubscriptions = filteredSubscriptions.filter(subscription =>
                subscription.subscriptionTier === filterValue
            );
        }
    }

    // If no subscriptions, show message
    if (filteredSubscriptions.length === 0) {
        subscriptionsTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="6">No subscriptions found</td>
            </tr>
        `;
        return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredSubscriptions.length / subscriptionsPerPage);
    if (currentSubscriptionPage > totalPages) {
        currentSubscriptionPage = totalPages;
    }

    const startIndex = (currentSubscriptionPage - 1) * subscriptionsPerPage;
    const endIndex = Math.min(startIndex + subscriptionsPerPage, filteredSubscriptions.length);
    const paginatedSubscriptions = filteredSubscriptions.slice(startIndex, endIndex);

    // Update pagination info
    subscriptionPageInfoElement.textContent = `Page ${currentSubscriptionPage} of ${totalPages}`;

    // Enable/disable pagination buttons
    subscriptionPrevPageButton.disabled = currentSubscriptionPage === 1;
    subscriptionNextPageButton.disabled = currentSubscriptionPage === totalPages;

    // Add subscriptions to table
    paginatedSubscriptions.forEach(subscription => {
        const row = document.createElement('tr');

        // Determine status
        const now = new Date();
        const isExpired = subscription.subscriptionExpiration &&
            subscription.subscriptionExpiration.toDate() < now;

        const statusClass = isExpired ? 'status-expired' : 'status-active';
        const statusText = isExpired ? 'Expired' : 'Active';

        const startDate = subscription.subscriptionStart ?
            formatDate(subscription.subscriptionStart.toDate()) : 'N/A';
        const expiryDate = subscription.subscriptionExpiration ?
            formatDate(subscription.subscriptionExpiration.toDate()) : 'N/A';

        // Get subscription duration and format it
        const subscriptionDuration = subscription.subscriptionDuration || 'monthly';
        let durationText = 'Monthly';

        if (subscriptionDuration === 'yearly') {
            durationText = 'Yearly';
        } else if (subscriptionDuration === 'lifetime') {
            durationText = 'Lifetime';
        }

        // For lifetime subscriptions, show "Never" as expiry date
        const displayExpiryDate = (subscriptionDuration === 'lifetime') ? 'Never' : expiryDate;

        row.innerHTML = `
            <td>${subscription.username || 'N/A'}</td>
            <td>${subscription.subscriptionTier.charAt(0).toUpperCase() + subscription.subscriptionTier.slice(1)}</td>
            <td>${durationText}</td>
            <td>${startDate}</td>
            <td>${displayExpiryDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-button extend-subscription-button" data-id="${subscription.id}" ${subscriptionDuration === 'lifetime' ? 'disabled' : ''}>
                    ${subscriptionDuration === 'lifetime' ? 'Lifetime' : 'Extend'}
                </button>
            </td>
        `;

        // Add event listener to extend button
        row.querySelector('.extend-subscription-button').addEventListener('click', () => {
            extendSubscription(subscription.id);
        });

        subscriptionsTableBody.appendChild(row);
    });
}

// Load creator applications
function loadApplications() {
    db.collection('creatorApplications')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            applications = [];
            snapshot.forEach((doc) => {
                applications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            updateApplicationsTable();
        })
        .catch((error) => {
            console.error("Error loading applications:", error);
            applicationsTableBody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="7">Error loading applications: ${error.message}</td>
                </tr>
            `;
        });
}

// Update applications table
function updateApplicationsTable() {
    // Clear table
    applicationsTableBody.innerHTML = '';

    // Filter applications
    let filteredApplications = [...applications];

    // Apply status filter
    const filterValue = applicationFilterSelect.value;
    if (filterValue !== 'all') {
        filteredApplications = filteredApplications.filter(application =>
            application.status === filterValue
        );
    }

    // If no applications, show message
    if (filteredApplications.length === 0) {
        applicationsTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="7">No applications found</td>
            </tr>
        `;
        return;
    }

    // Add applications to table
    filteredApplications.forEach(application => {
        const row = document.createElement('tr');

        // Determine status class
        let statusClass = 'status-pending';
        if (application.status === 'approved') {
            statusClass = 'status-active';
        } else if (application.status === 'rejected') {
            statusClass = 'status-expired';
        }

        const submittedDate = application.createdAt ?
            formatDate(application.createdAt.toDate()) : 'N/A';

        row.innerHTML = `
            <td>${application.username || 'N/A'}</td>
            <td>${application.socialPlatform || 'N/A'}</td>
            <td>${formatNumber(application.followerCount) || 'N/A'}</td>
            <td>${formatNumber(application.videoViews) || 'N/A'}</td>
            <td>${submittedDate}</td>
            <td><span class="status-badge ${statusClass}">${application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span></td>
            <td>
                <button class="action-button view-application-button" data-id="${application.id}">View</button>
            </td>
        `;

        // Add event listener to view button
        row.querySelector('.view-application-button').addEventListener('click', () => {
            openApplicationModal(application.id);
        });

        applicationsTableBody.appendChild(row);
    });
}

// Open user modal
function openUserModal(userId) {
    selectedUserId = userId;

    // Find user
    const user = users.find(u => u.id === userId);
    if (!user) {
        showError("User not found");
        return;
    }

    // Determine if user is premium
    const isPremium = user.subscriptionTier === 'premium' || user.subscriptionTier === 'creator';

    // Populate user details
    userDetailsContainer.innerHTML = `
        <div class="user-details">
            <div class="detail-group">
                <span class="detail-label">Username:</span>
                <span class="detail-value">${user.username || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${user.email || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${user.subscriptionTier ? user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1) : 'Free'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Joined:</span>
                <span class="detail-value">${user.createdAt ? formatDate(user.createdAt.toDate()) : 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${user.disabled ? 'Disabled' : 'Active'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Bio:</span>
                <span class="detail-value">${user.bio || 'No bio available'}</span>
            </div>
        </div>
        <div class="admin-actions" style="margin-top: 20px;">
            <button id="upgrade-premium-button" class="action-button" ${isPremium ? 'disabled' : ''}>
                ${isPremium ? 'Already Premium' : 'Upgrade to Premium'}
            </button>
            <button id="extend-subscription-button" class="action-button" ${!isPremium ? 'disabled' : ''}>
                ${!isPremium ? 'Not Premium' : 'Extend Subscription'}
            </button>
        </div>
    `;

    // Add event listeners to the new buttons
    const upgradePremiumButton = document.getElementById('upgrade-premium-button');
    if (upgradePremiumButton && !isPremium) {
        upgradePremiumButton.addEventListener('click', () => upgradeUserToPremium(userId));
    }

    const extendSubscriptionButton = document.getElementById('extend-subscription-button');
    if (extendSubscriptionButton && isPremium) {
        extendSubscriptionButton.addEventListener('click', () => extendSubscription(userId));
    }

    // Show modal
    userModal.style.display = 'block';
}

// Open application modal
function openApplicationModal(applicationId) {
    selectedApplicationId = applicationId;

    // Find application
    const application = applications.find(a => a.id === applicationId);
    if (!application) {
        showError("Application not found");
        return;
    }

    // Populate application details
    applicationDetailsContainer.innerHTML = `
        <div class="application-details">
            <div class="detail-group">
                <span class="detail-label">Username:</span>
                <span class="detail-value">${application.username || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${application.email || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Platform:</span>
                <span class="detail-value">${application.socialPlatform || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Followers:</span>
                <span class="detail-value">${formatNumber(application.followerCount) || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Profile URL:</span>
                <a href="${application.profileUrl}" target="_blank" class="detail-link">${application.profileUrl || 'N/A'}</a>
            </div>
            <div class="detail-group">
                <span class="detail-label">Video URL:</span>
                <a href="${application.videoUrl}" target="_blank" class="detail-link">${application.videoUrl || 'N/A'}</a>
            </div>
            <div class="detail-group">
                <span class="detail-label">Video Views:</span>
                <span class="detail-value">${formatNumber(application.videoViews) || 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Submitted:</span>
                <span class="detail-value">${application.createdAt ? formatDate(application.createdAt.toDate()) : 'N/A'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Notes:</span>
                <span class="detail-value">${application.applicationNotes || 'No notes provided'}</span>
            </div>
        </div>
    `;

    // Update button visibility based on status
    if (application.status === 'pending') {
        approveApplicationButton.style.display = 'block';
        rejectApplicationButton.style.display = 'block';
    } else {
        approveApplicationButton.style.display = 'none';
        rejectApplicationButton.style.display = 'none';
    }

    // Show modal
    applicationModal.style.display = 'block';
}

// Extend subscription
function extendSubscription(userId) {
    if (!confirm("Extend this subscription by 30 days?")) {
        return;
    }

    // Find subscription
    const subscription = subscriptions.find(s => s.id === userId);
    if (!subscription) {
        showError("Subscription not found");
        return;
    }

    // Calculate new expiration date
    let newExpirationDate;
    if (subscription.subscriptionExpiration) {
        const currentExpiration = subscription.subscriptionExpiration.toDate();
        const now = new Date();

        // If already expired, extend from now
        if (currentExpiration < now) {
            newExpirationDate = new Date();
        } else {
            // If not expired, extend from current expiration
            newExpirationDate = new Date(currentExpiration);
        }
    } else {
        // If no expiration date, set from now
        newExpirationDate = new Date();
    }

    // Add 30 days
    newExpirationDate.setDate(newExpirationDate.getDate() + 30);

    // Update in Firestore
    db.collection('users').doc(userId).update({
        subscriptionExpiration: firebase.firestore.Timestamp.fromDate(newExpirationDate),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Subscription extended successfully");

        // Update local data
        const index = subscriptions.findIndex(s => s.id === userId);
        if (index !== -1) {
            subscriptions[index].subscriptionExpiration = firebase.firestore.Timestamp.fromDate(newExpirationDate);
        }

        // Update UI
        updateSubscriptionsTable();

        // Show success message
        alert("Subscription extended successfully");
    })
    .catch((error) => {
        console.error("Error extending subscription:", error);
        showError(`Error extending subscription: ${error.message}`);
    });
}

// Approve application
function approveApplication() {
    if (!selectedApplicationId) return;

    if (!confirm("Approve this creator application?")) {
        return;
    }

    // Find application
    const application = applications.find(a => a.id === selectedApplicationId);
    if (!application) {
        showError("Application not found");
        return;
    }

    // Disable buttons
    approveApplicationButton.disabled = true;
    rejectApplicationButton.disabled = true;

    // Update application status
    db.collection('creatorApplications').doc(selectedApplicationId).update({
        status: 'approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedBy: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Application approved successfully");

        // Calculate expiration date (3 months from now)
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 3);

        // Update user subscription
        return db.collection('users').doc(application.userId).update({
            subscriptionTier: 'creator',
            subscriptionDuration: 'quarterly', // 3-month duration
            subscriptionStart: firebase.firestore.FieldValue.serverTimestamp(),
            subscriptionExpiration: firebase.firestore.Timestamp.fromDate(expirationDate),
            creatorApplicationStatus: 'approved',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    })
    .then(() => {
        // Update local data
        const index = applications.findIndex(a => a.id === selectedApplicationId);
        if (index !== -1) {
            applications[index].status = 'approved';
            applications[index].approvedAt = firebase.firestore.FieldValue.serverTimestamp();
            applications[index].approvedBy = currentUser.uid;
        }

        // Update UI
        updateApplicationsTable();

        // Close modal
        applicationModal.style.display = 'none';

        // Show success message
        alert("Application approved successfully");
    })
    .catch((error) => {
        console.error("Error approving application:", error);
        showError(`Error approving application: ${error.message}`);

        // Re-enable buttons
        approveApplicationButton.disabled = false;
        rejectApplicationButton.disabled = false;
    });
}

// Reject application
function rejectApplication() {
    if (!selectedApplicationId) return;

    if (!confirm("Reject this creator application?")) {
        return;
    }

    // Find application
    const application = applications.find(a => a.id === selectedApplicationId);
    if (!application) {
        showError("Application not found");
        return;
    }

    // Disable buttons
    approveApplicationButton.disabled = true;
    rejectApplicationButton.disabled = true;

    // Update application status
    db.collection('creatorApplications').doc(selectedApplicationId).update({
        status: 'rejected',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectedBy: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Application rejected successfully");

        // Update user application status
        return db.collection('users').doc(application.userId).update({
            creatorApplicationStatus: 'rejected',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    })
    .then(() => {
        // Update local data
        const index = applications.findIndex(a => a.id === selectedApplicationId);
        if (index !== -1) {
            applications[index].status = 'rejected';
            applications[index].rejectedAt = firebase.firestore.FieldValue.serverTimestamp();
            applications[index].rejectedBy = currentUser.uid;
        }

        // Update UI
        updateApplicationsTable();

        // Close modal
        applicationModal.style.display = 'none';

        // Show success message
        alert("Application rejected successfully");
    })
    .catch((error) => {
        console.error("Error rejecting application:", error);
        showError(`Error rejecting application: ${error.message}`);

        // Re-enable buttons
        approveApplicationButton.disabled = false;
        rejectApplicationButton.disabled = false;
    });
}

// Helper Functions
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatTimeAgo(date) {
    if (!date) return 'N/A';

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 30) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(date);
    }
}

function showError(message) {
    alert(message);
}

// Event Listeners
// Tab switching
if (navItems && navItems.length > 0 && adminTabs && adminTabs.length > 0) {
    navItems.forEach(item => {
        if (item) {
            item.addEventListener('click', () => {
                // Remove active class from all items and tabs
                navItems.forEach(navItem => {
                    if (navItem) navItem.classList.remove('active');
                });
                adminTabs.forEach(tab => {
                    if (tab) tab.classList.remove('active');
                });

                // Add active class to clicked item and corresponding tab
                item.classList.add('active');
                const tabId = item.dataset.tab;
                const tabElement = document.getElementById(`${tabId}-tab`);
                if (tabElement) {
                    tabElement.classList.add('active');
                } else {
                    console.warn(`Tab element with ID "${tabId}-tab" not found`);
                }
            });
        }
    });
} else {
    console.warn("Navigation items or admin tabs not found");
}

// User search and filter
if (userSearchInput) {
    userSearchInput.addEventListener('input', () => {
        currentUserPage = 1;
        updateUsersTable();
    });
}

if (userFilterSelect) {
    userFilterSelect.addEventListener('change', () => {
        currentUserPage = 1;
        updateUsersTable();
    });
}

// User pagination
if (prevPageButton) {
    prevPageButton.addEventListener('click', () => {
        if (currentUserPage > 1) {
            currentUserPage--;
            updateUsersTable();
        }
    });
}

if (nextPageButton) {
    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(users.length / usersPerPage);
        if (currentUserPage < totalPages) {
            currentUserPage++;
            updateUsersTable();
        }
    });
}

// Subscription search and filter
if (subscriptionSearchInput) {
    subscriptionSearchInput.addEventListener('input', () => {
        currentSubscriptionPage = 1;
        updateSubscriptionsTable();
    });
}

if (subscriptionFilterSelect) {
    subscriptionFilterSelect.addEventListener('change', () => {
        currentSubscriptionPage = 1;
        updateSubscriptionsTable();
    });
}

// Subscription pagination
if (subscriptionPrevPageButton) {
    subscriptionPrevPageButton.addEventListener('click', () => {
        if (currentSubscriptionPage > 1) {
            currentSubscriptionPage--;
            updateSubscriptionsTable();
        }
    });
}

if (subscriptionNextPageButton) {
    subscriptionNextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(subscriptions.length / subscriptionsPerPage);
        if (currentSubscriptionPage < totalPages) {
            currentSubscriptionPage++;
            updateSubscriptionsTable();
        }
    });
}

// Application filter
if (applicationFilterSelect) {
    applicationFilterSelect.addEventListener('change', () => {
        updateApplicationsTable();
    });
}

// Payment search and filter
if (paymentSearchInput) {
    paymentSearchInput.addEventListener('input', () => {
        currentPaymentPage = 1;
        updatePaymentsTable();
    });
}

if (paymentFilterSelect) {
    paymentFilterSelect.addEventListener('change', () => {
        currentPaymentPage = 1;
        updatePaymentsTable();
    });
}

// Payment pagination
if (paymentPrevPageButton) {
    paymentPrevPageButton.addEventListener('click', () => {
        if (currentPaymentPage > 1) {
            currentPaymentPage--;
            updatePaymentsTable();
        }
    });
}

if (paymentNextPageButton) {
    paymentNextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(payments.length / paymentsPerPage);
        if (currentPaymentPage < totalPages) {
            currentPaymentPage++;
            updatePaymentsTable();
        }
    });
}

// Modal close buttons
if (closeModalButtons && closeModalButtons.length > 0) {
    closeModalButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                if (userModal) userModal.style.display = 'none';
                if (applicationModal) applicationModal.style.display = 'none';
            });
        }
    });
}

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (userModal && event.target === userModal) {
        userModal.style.display = 'none';
    }
    if (applicationModal && event.target === applicationModal) {
        applicationModal.style.display = 'none';
    }
});

// Application approval/rejection
if (approveApplicationButton) {
    approveApplicationButton.addEventListener('click', approveApplication);
}

if (rejectApplicationButton) {
    rejectApplicationButton.addEventListener('click', rejectApplication);
}

// Platform settings form
const platformSettingsForm = document.getElementById('platform-settings-form');
if (platformSettingsForm) {
    platformSettingsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        savePlatformSettings();
    });
}

// Logout Button
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

// Utility Functions

// Format number with commas
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    if (interval === 1) return "1 year ago";

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";
    if (interval === 1) return "1 month ago";

    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    if (interval === 1) return "1 day ago";

    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    if (interval === 1) return "1 hour ago";

    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    if (interval === 1) return "1 minute ago";

    return "just now";
}

// Extend subscription
function extendSubscription(userId) {
    // Find user
    const user = users.find(u => u.id === userId);
    if (!user) {
        showError("User not found");
        return;
    }

    // Get subscription duration
    const subscriptionDuration = user.subscriptionDuration || 'monthly';

    // Don't extend lifetime subscriptions
    if (subscriptionDuration === 'lifetime') {
        alert("This user has a lifetime subscription which doesn't need to be extended.");
        return;
    }

    // Confirm extension based on duration
    let extensionPeriod = '30 days';
    if (subscriptionDuration === 'yearly') {
        extensionPeriod = '1 year';
    }

    if (!confirm(`Are you sure you want to extend this user's Premium subscription by ${extensionPeriod}?`)) {
        return;
    }

    // Calculate new expiration date based on subscription duration
    let expirationDate;
    if (user.subscriptionExpiration) {
        expirationDate = user.subscriptionExpiration.toDate();
    } else {
        expirationDate = new Date();
    }

    // Add appropriate time based on subscription duration
    if (subscriptionDuration === 'yearly') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
        // Default monthly - 30 days
        expirationDate.setDate(expirationDate.getDate() + 30);
    }

    // Create admin payment record
    const paymentData = {
        userId: userId,
        amount: 0, // Free extension by admin
        currency: 'NGN',
        paymentMethod: 'admin_extension',
        plan: 'premium',
        duration: subscriptionDuration,
        status: 'completed',
        notes: `Subscription extended by admin (${subscriptionDuration})`,
        adminId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save payment to Firestore
    db.collection('payments').add(paymentData)
        .then((docRef) => {
            console.log("Admin extension payment recorded with ID:", docRef.id);

            // Update user subscription
            return db.collection('users').doc(userId).update({
                subscriptionExpiration: firebase.firestore.Timestamp.fromDate(expirationDate),
                lastPaymentId: docRef.id,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Update local data
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].subscriptionExpiration = firebase.firestore.Timestamp.fromDate(expirationDate);
            }

            // Update subscriptions array
            const subscriptionIndex = subscriptions.findIndex(s => s.id === userId);
            if (subscriptionIndex !== -1) {
                subscriptions[subscriptionIndex].subscriptionExpiration = firebase.firestore.Timestamp.fromDate(expirationDate);
            }

            // Update UI
            updateUsersTable();
            updateSubscriptionsTable();

            // Close modal
            userModal.style.display = 'none';

            // Show success message
            alert("User's subscription has been extended by 30 days successfully!");
        })
        .catch((error) => {
            console.error("Error extending subscription:", error);
            showError(`Error extending subscription: ${error.message}`);
        });
}

// Load payments
function loadPayments() {
    // Show loading message
    if (paymentsTableBody) {
        paymentsTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="7">Loading payments...</td>
            </tr>
        `;
    }

    // Fetch payments from Firestore
    db.collection('payments')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            payments = [];

            // Process each payment document
            const userPromises = [];

            snapshot.forEach((doc) => {
                const payment = {
                    id: doc.id,
                    ...doc.data()
                };

                // Add to payments array
                payments.push(payment);

                // Get user details for each payment
                if (payment.userId) {
                    const userPromise = db.collection('users').doc(payment.userId).get()
                        .then((userDoc) => {
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                payment.username = userData.username || 'Unknown';
                                payment.email = userData.email || 'Unknown';
                            } else {
                                payment.username = 'User not found';
                                payment.email = 'User not found';
                            }
                        })
                        .catch((error) => {
                            console.error(`Error fetching user for payment ${payment.id}:`, error);
                            payment.username = 'Error';
                            payment.email = 'Error';
                        });

                    userPromises.push(userPromise);
                } else {
                    payment.username = 'No user ID';
                    payment.email = 'No user ID';
                }
            });

            // Wait for all user details to be fetched
            return Promise.all(userPromises);
        })
        .then(() => {
            // Update the payments table
            updatePaymentsTable();
        })
        .catch((error) => {
            console.error("Error loading payments:", error);
            if (paymentsTableBody) {
                paymentsTableBody.innerHTML = `
                    <tr class="placeholder-row">
                        <td colspan="7">Error loading payments: ${error.message}</td>
                    </tr>
                `;
            }
        });
}

// Update payments table
function updatePaymentsTable() {
    // Check if payments table body exists
    if (!paymentsTableBody) {
        console.error("Payments table body element not found");
        return;
    }

    // Clear table
    paymentsTableBody.innerHTML = '';

    // Filter payments
    let filteredPayments = [...payments];

    // Apply search filter
    const searchTerm = paymentSearchInput ? paymentSearchInput.value.toLowerCase() : '';
    if (searchTerm) {
        filteredPayments = filteredPayments.filter(payment =>
            (payment.username && payment.username.toLowerCase().includes(searchTerm)) ||
            (payment.email && payment.email.toLowerCase().includes(searchTerm)) ||
            (payment.plan && payment.plan.toLowerCase().includes(searchTerm)) ||
            (payment.paymentMethod && payment.paymentMethod.toLowerCase().includes(searchTerm))
        );
    }

    // Apply status filter
    const filterValue = paymentFilterSelect ? paymentFilterSelect.value : 'all';
    if (filterValue !== 'all') {
        filteredPayments = filteredPayments.filter(payment => payment.status === filterValue);
    }

    // If no payments, show message
    if (filteredPayments.length === 0) {
        paymentsTableBody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="7">No payments found</td>
            </tr>
        `;
        return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);
    if (currentPaymentPage > totalPages) {
        currentPaymentPage = totalPages;
    }

    const startIndex = (currentPaymentPage - 1) * paymentsPerPage;
    const endIndex = Math.min(startIndex + paymentsPerPage, filteredPayments.length);
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    // Update pagination info
    if (paymentPageInfoElement) {
        paymentPageInfoElement.textContent = `Page ${currentPaymentPage} of ${totalPages}`;
    }

    // Enable/disable pagination buttons
    if (paymentPrevPageButton) {
        paymentPrevPageButton.disabled = currentPaymentPage === 1;
    }
    if (paymentNextPageButton) {
        paymentNextPageButton.disabled = currentPaymentPage === totalPages;
    }

    // Add payments to table
    paginatedPayments.forEach(payment => {
        const row = document.createElement('tr');

        // Determine status class
        let statusClass = 'status-pending';
        if (payment.status === 'completed') {
            statusClass = 'status-active';
        } else if (payment.status === 'failed') {
            statusClass = 'status-expired';
        }

        // Format date
        const paymentDate = payment.createdAt ? formatDate(payment.createdAt.toDate()) : 'N/A';

        // Format amount
        const amount = payment.amount ? `₦${formatNumber(payment.amount)}` : 'N/A';

        // Format payment method
        let paymentMethod = payment.paymentMethod || 'N/A';
        if (paymentMethod !== 'N/A') {
            if (paymentMethod.includes('_')) {
                paymentMethod = paymentMethod.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
            } else {
                paymentMethod = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
            }
        }

        // Format plan
        const plan = payment.plan ?
            payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1) : 'N/A';

        // Create row HTML
        row.innerHTML = `
            <td>${payment.username || 'N/A'}</td>
            <td>${amount}</td>
            <td>${paymentMethod}</td>
            <td>${plan}</td>
            <td>${paymentDate}</td>
            <td><span class="status-badge ${statusClass}">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span></td>
            <td>
                <button class="action-button view-payment-button" data-id="${payment.id}">View</button>
                ${payment.status === 'pending' ? `<button class="approve-button approve-payment-button" data-id="${payment.id}">Approve</button>` : ''}
            </td>
        `;

        // Add event listeners to buttons
        const viewButton = row.querySelector('.view-payment-button');
        if (viewButton) {
            viewButton.addEventListener('click', () => {
                // Open payment details (to be implemented)
                alert(`Payment details for ID: ${payment.id}\nUser: ${payment.username}\nAmount: ${amount}\nMethod: ${paymentMethod}\nStatus: ${payment.status}\nDate: ${paymentDate}`);
            });
        }

        const approveButton = row.querySelector('.approve-payment-button');
        if (approveButton) {
            approveButton.addEventListener('click', () => {
                approvePayment(payment.id);
            });
        }

        paymentsTableBody.appendChild(row);
    });
}

// Approve payment
function approvePayment(paymentId) {
    if (!confirm("Are you sure you want to approve this payment?")) {
        return;
    }

    // Find payment
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
        showError("Payment not found");
        return;
    }

    // Update payment status
    db.collection('payments').doc(paymentId).update({
        status: 'completed',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedBy: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Payment approved successfully");

        // Check if this is a token purchase or a subscription payment
        if (payment.tokenPurchaseId) {
            // This is a token purchase - get the token purchase request
            return db.collection('tokenPurchaseRequests').doc(payment.tokenPurchaseId).get()
                .then(doc => {
                    if (!doc.exists) {
                        throw new Error('Token purchase request not found');
                    }

                    const tokenRequest = doc.data();

                    // Get the user document to check current tokens
                    return db.collection('users').doc(payment.userId).get()
                        .then(userDoc => {
                            if (!userDoc.exists) {
                                throw new Error('User not found');
                            }

                            const userData = userDoc.data();
                            const currentTokens = userData.tokens || 0;
                            const isFirstPurchase = tokenRequest.isFirstPurchase && !(userData.hasPurchasedTokens || false);
                            const bonusTokens = isFirstPurchase ? 200 : 0;
                            const totalTokens = currentTokens + tokenRequest.tokenAmount + bonusTokens;

                            // Update token purchase request status
                            return db.collection('tokenPurchaseRequests').doc(payment.tokenPurchaseId).update({
                                status: 'approved',
                                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                approvedBy: currentUser.uid
                            }).then(() => {
                                // Add tokens to user account
                                return db.collection('users').doc(payment.userId).update({
                                    tokens: totalTokens,
                                    hasPurchasedTokens: true,
                                    pendingPayment: firebase.firestore.FieldValue.delete(),
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                            }).then(() => {
                                // Record token transaction
                                return db.collection('tokenTransactions').add({
                                    userId: payment.userId,
                                    requestId: payment.tokenPurchaseId,
                                    amount: tokenRequest.tokenAmount,
                                    bonusAmount: bonusTokens,
                                    price: tokenRequest.price,
                                    currency: tokenRequest.currency || 'NGN',
                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                });
                            });
                        });
                });
        } else {
            // This is a subscription payment - update user subscription
            // Calculate expiration date (30 days from now)
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);

            return db.collection('users').doc(payment.userId).update({
                subscriptionTier: payment.plan || 'premium',
                subscriptionStart: firebase.firestore.FieldValue.serverTimestamp(),
                subscriptionExpiration: firebase.firestore.Timestamp.fromDate(expirationDate),
                lastPaymentId: paymentId,
                pendingPayment: firebase.firestore.FieldValue.delete(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    })
    .then(() => {
        // Update local data
        const index = payments.findIndex(p => p.id === paymentId);
        if (index !== -1) {
            payments[index].status = 'completed';
            payments[index].approvedAt = firebase.firestore.Timestamp.now();
            payments[index].approvedBy = currentUser.uid;
        }

        // Reload subscriptions
        loadSubscriptions();

        // Update UI
        updatePaymentsTable();

        // Show success message
        if (payment.tokenPurchaseId) {
            alert("Token purchase approved successfully! Tokens have been added to the user's account.");
        } else {
            alert("Payment approved successfully! User has been upgraded to premium.");
        }
    })
    .catch((error) => {
        console.error("Error approving payment:", error);
        showError(`Error approving payment: ${error.message}`);
    });
}

// Upgrade user to premium
function upgradeUserToPremium(userId) {
    if (!confirm("Are you sure you want to upgrade this user to Premium status?")) {
        return;
    }

    // Calculate expiration date (30 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    // Create admin payment record
    const paymentData = {
        userId: userId,
        amount: 0, // Free upgrade by admin
        currency: 'NGN',
        paymentMethod: 'admin_upgrade',
        plan: 'premium',
        status: 'completed',
        notes: 'Upgraded by admin',
        adminId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save payment to Firestore
    db.collection('payments').add(paymentData)
        .then((docRef) => {
            console.log("Admin upgrade payment recorded with ID:", docRef.id);

            // Update user subscription
            return db.collection('users').doc(userId).update({
                subscriptionTier: 'premium',
                subscriptionStart: firebase.firestore.FieldValue.serverTimestamp(),
                subscriptionExpiration: firebase.firestore.Timestamp.fromDate(expirationDate),
                lastPaymentId: docRef.id,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Update local data
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].subscriptionTier = 'premium';
                users[userIndex].subscriptionStart = firebase.firestore.Timestamp.now();
                users[userIndex].subscriptionExpiration = firebase.firestore.Timestamp.fromDate(expirationDate);
            }

            // Add to subscriptions array if not already there
            const subscriptionIndex = subscriptions.findIndex(s => s.id === userId);
            if (subscriptionIndex === -1) {
                const user = users.find(u => u.id === userId);
                if (user) {
                    subscriptions.push({
                        ...user,
                        subscriptionTier: 'premium',
                        subscriptionStart: firebase.firestore.Timestamp.now(),
                        subscriptionExpiration: firebase.firestore.Timestamp.fromDate(expirationDate)
                    });
                }
            } else {
                subscriptions[subscriptionIndex].subscriptionTier = 'premium';
                subscriptions[subscriptionIndex].subscriptionStart = firebase.firestore.Timestamp.now();
                subscriptions[subscriptionIndex].subscriptionExpiration = firebase.firestore.Timestamp.fromDate(expirationDate);
            }

            // Update UI
            updateUsersTable();
            updateSubscriptionsTable();

            // Close modal
            userModal.style.display = 'none';

            // Show success message
            alert("User has been upgraded to Premium status successfully!");
        })
        .catch((error) => {
            console.error("Error upgrading user:", error);
            showError(`Error upgrading user: ${error.message}`);
        });
}

// Bulk check expired subscriptions
function bulkCheckExpiredSubscriptions() {
    if (window.PremiumEnforcement && typeof window.PremiumEnforcement.checkAllExpiredSubscriptions === 'function') {
        console.log("Triggering bulk subscription check...");
        window.PremiumEnforcement.checkAllExpiredSubscriptions();

        // Reload data after a short delay
        setTimeout(() => {
            loadUsers();
            loadSubscriptions();
        }, 3000);

        alert("Bulk subscription check initiated. Data will refresh in a few seconds.");
    } else {
        alert("Premium enforcement system not available. Please refresh the page and try again.");
    }
}

// Add bulk check button to admin interface if it doesn't exist
document.addEventListener('DOMContentLoaded', function() {
    // Add bulk check button to subscriptions section
    const subscriptionsSection = document.querySelector('.subscriptions-section');
    if (subscriptionsSection && !document.getElementById('bulk-check-btn')) {
        const bulkCheckButton = document.createElement('button');
        bulkCheckButton.id = 'bulk-check-btn';
        bulkCheckButton.className = 'action-button';
        bulkCheckButton.innerHTML = '<i class="fas fa-sync-alt"></i> Check All Expired Subscriptions';
        bulkCheckButton.style.marginLeft = '10px';
        bulkCheckButton.addEventListener('click', bulkCheckExpiredSubscriptions);

        // Find the subscriptions header and add the button
        const subscriptionsHeader = subscriptionsSection.querySelector('h2');
        if (subscriptionsHeader) {
            subscriptionsHeader.appendChild(bulkCheckButton);
        }
    }
});
