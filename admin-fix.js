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
let currentUserPage = 1;
let usersPerPage = 10;
let currentSubscriptionPage = 1;
let subscriptionsPerPage = 10;
let selectedUserId = null;
let selectedApplicationId = null;

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

// Check if user is an admin - MODIFIED VERSION
function checkAdminStatus(userId) {
    const userDocRef = db.collection('users').doc(userId);
    userDocRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            
            // Debug output to see what's in the userData
            console.log("User data:", userData);
            console.log("isAdmin value:", userData.isAdmin);
            console.log("isAdmin type:", typeof userData.isAdmin);
            
            // More lenient check - accept any truthy value
            isAdmin = Boolean(userData.isAdmin);
            
            console.log("Final isAdmin value:", isAdmin);

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
}

// Show error message
function showError(message) {
    console.error(message);
    alert(message);
}

// Format number with commas
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

// Event Listeners
// Tab navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        
        // Update active tab
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        // Show selected tab
        adminTabs.forEach(tab => {
            if (tab.id === `${tabId}-tab`) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    });
});

// Close modals
closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
});

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

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === userModal) {
        userModal.style.display = 'none';
    } else if (event.target === applicationModal) {
        applicationModal.style.display = 'none';
    }
});
