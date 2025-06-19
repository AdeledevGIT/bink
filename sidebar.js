// Sidebar functionality for BINK
// This file provides the sidebar functionality for all pages

// Function to initialize sidebar
function initSidebar() {
    // Create sidebar toggle button if it doesn't exist
    if (!document.getElementById('menu-toggle')) {
        const logoContainer = document.querySelector('.logo-container-header');
        if (logoContainer) {
            const menuToggle = document.createElement('button');
            menuToggle.id = 'menu-toggle';
            menuToggle.className = 'menu-toggle-btn';
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            logoContainer.prepend(menuToggle);
        }
    }

    // Create sidebar overlay if it doesn't exist
    if (!document.getElementById('sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Create sidebar if it doesn't exist
    if (!document.getElementById('sidebar')) {
        // Create container if it doesn't exist
        let container = document.querySelector('.dashboard-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'dashboard-container';

            // Find the main content
            const main = document.querySelector('main') || document.querySelector('.dashboard-main');
            if (main) {
                // Insert container before main
                main.parentNode.insertBefore(container, main);
                // Move main inside container
                container.appendChild(main);
            } else {
                // Insert after header
                const header = document.querySelector('header');
                if (header) {
                    header.after(container);
                } else {
                    document.body.appendChild(container);
                }
            }
        }

        // Create sidebar
        const sidebar = document.createElement('div');
        sidebar.id = 'sidebar';
        sidebar.className = 'dashboard-sidebar';

        // Add user profile section
        sidebar.innerHTML = `
            <div class="user-profile">
                <div class="user-avatar" id="userAvatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-name" id="userName">User Name</div>
                <div class="user-email" id="userEmail">user@example.com</div>
                <div id="planBadge" class="plan-badge">
                    <i class="fas fa-user"></i>
                    <span>Free Plan</span>
                </div>
                <div id="tokenBalanceSidebar" class="token-balance-sidebar">
                    <i class="fas fa-coins"></i>
                    <span id="sidebarTokenCount">0</span> tokens
                </div>
            </div>

            <ul class="nav-menu">
                <li class="nav-item">
                    <a href="dashboard.html" class="nav-link" id="dashboardLink">
                        <span class="nav-icon"><i class="fas fa-home"></i></span>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="bio-editor.html" class="nav-link" id="bioEditorLink">
                        <span class="nav-icon"><i class="fas fa-edit"></i></span>
                        <span>Edit Bio</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="profile.html" class="nav-link" id="profileLink">
                        <span class="nav-icon"><i class="fas fa-user-circle"></i></span>
                        <span>Profile</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="analytics.html" class="nav-link" id="analyticsLink">
                        <span class="nav-icon"><i class="fas fa-chart-bar"></i></span>
                        <span>Analytics</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="tokens.html" class="nav-link" id="tokensLink">
                        <span class="nav-icon"><i class="fas fa-coins"></i></span>
                        <span>Tokens</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="tasks.html" class="nav-link" id="tasksLink">
                        <span class="nav-icon"><i class="fas fa-tasks"></i></span>
                        <span>Tasks</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="pricing.html" class="nav-link" id="pricingLink">
                        <span class="nav-icon"><i class="fas fa-tag"></i></span>
                        <span>Pricing</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link" id="logoutLink">
                        <span class="nav-icon"><i class="fas fa-sign-out-alt"></i></span>
                        <span>Logout</span>
                    </a>
                </li>
            </ul>
        `;

        // Add sidebar to container
        container.prepend(sidebar);
    }

    // Set active link based on current page
    setActiveLink();

    // Add event listeners for sidebar toggle
    setupSidebarEventListeners();
}

// Function to set the active link in the sidebar
function setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });

    // Set dashboard as active if on index page
    if (currentPage === '' || currentPage === 'index.html') {
        const dashboardLink = document.getElementById('dashboardLink');
        if (dashboardLink) dashboardLink.classList.add('active');
    }
}

// Function to setup sidebar event listeners
function setupSidebarEventListeners() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const body = document.body;

    // Function to toggle sidebar
    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            // Mobile behavior
            body.classList.toggle('sidebar-active');
        } else {
            // Desktop behavior
            body.classList.toggle('sidebar-collapsed');
        }
    }

    // Add event listeners for sidebar toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    // Close sidebar when clicking on overlay (mobile)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            body.classList.remove('sidebar-active');
        });
    }

    // Close sidebar when clicking on a link (mobile)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                body.classList.remove('sidebar-active');
            }
        });
    });

    // Set initial sidebar state based on screen size
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            body.classList.remove('sidebar-collapsed');
        } else {
            body.classList.remove('sidebar-active');
        }
    });

    // Add logout functionality
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();

            // Check if Firebase auth is available
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().then(() => {
                    console.log('User signed out successfully.');
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error('Sign out error:', error);
                    alert('Failed to log out. Please try again.');
                });
            } else if (window.auth) {
                // Fallback to window.auth if available
                window.auth.signOut().then(() => {
                    console.log('User signed out successfully.');
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error('Sign out error:', error);
                    alert('Failed to log out. Please try again.');
                });
            } else {
                console.error('Firebase Auth not available for logout');
                alert('Error: Authentication service not available. Please try refreshing the page.');
            }
        });
    }
}

// Function to update user profile in sidebar
function updateSidebarUserProfile() {
    // Check if Firebase and auth are available
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
        console.warn("Firebase not available for sidebar user profile update");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Get DOM elements
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const planBadge = document.getElementById('planBadge');
    const sidebarTokenCount = document.getElementById('sidebarTokenCount');
    const tokenBalanceSidebar = document.getElementById('tokenBalanceSidebar');

    // If elements don't exist, return
    if (!userAvatar || !userName || !userEmail || !planBadge) {
        console.warn("Sidebar user profile elements not found");
        return;
    }

    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            // Update email immediately
            userEmail.textContent = user.email;

            // Get user data from Firestore
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();

                        // Update username
                        userName.textContent = userData.displayName || userData.username || user.email.split('@')[0];

                        // Update avatar
                        if (userData.profilePicUrl) {
                            userAvatar.innerHTML = `<img src="${userData.profilePicUrl}" alt="User Avatar">`;
                        } else {
                            // Use first letter of name as avatar
                            const initials = (userData.displayName || userData.username || user.email.split('@')[0]).charAt(0).toUpperCase();
                            userAvatar.innerHTML = `<div class="avatar-initials">${initials}</div>`;
                        }

                        // Update plan badge
                        // Check for subscription tier (premium, creator, or free)
                        const subscriptionTier = userData.subscriptionTier || (userData.isPremium ? 'premium' : 'free');
                        const capitalizedType = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);

                        // Set appropriate class based on subscription tier
                        planBadge.className = `plan-badge ${subscriptionTier.toLowerCase()}`;
                        planBadge.style.display = 'inline-flex'; // Make sure badge is visible

                        if (subscriptionTier === 'free') {
                            // Free plan
                            planBadge.innerHTML = `<i class="fas fa-user"></i> Free Plan`;
                        } else {
                            // Premium or Creator plan
                            const icon = subscriptionTier === 'creator' ? 'fa-star' : 'fa-crown';

                            // Get subscription duration
                            const subscriptionDuration = userData.subscriptionDuration || 'monthly';

                            // Check if this is a lifetime subscription
                            if (subscriptionDuration === 'lifetime') {
                                // Lifetime subscription never expires
                                planBadge.innerHTML = `<i class="fas ${icon}"></i> ${capitalizedType} (Lifetime)`;
                            }
                            // Check if subscription is about to expire for non-lifetime subscriptions
                            else if (userData.subscriptionExpiration || userData.premiumExpiry) {
                                const expiryDate = (userData.subscriptionExpiration ?
                                    userData.subscriptionExpiration.toDate() :
                                    userData.premiumExpiry.toDate());
                                const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

                                if (daysUntilExpiry <= 0) {
                                    // Expired subscription
                                    planBadge.className = 'plan-badge expired';
                                    planBadge.innerHTML = `<i class="fas fa-exclamation-circle"></i> Expired`;
                                } else if (daysUntilExpiry <= 7) {
                                    // About to expire
                                    planBadge.innerHTML = `<i class="fas ${icon}"></i> ${capitalizedType} (${daysUntilExpiry}d)`;
                                } else {
                                    // Active subscription with duration
                                    const durationLabel = subscriptionDuration === 'yearly' ? 'Yearly' : 'Monthly';
                                    planBadge.innerHTML = `<i class="fas ${icon}"></i> ${capitalizedType} (${durationLabel})`;
                                }
                            } else {
                                // No expiry date (unknown)
                                planBadge.innerHTML = `<i class="fas ${icon}"></i> ${capitalizedType}`;
                            }
                        }
                    } else {
                        // No user document found
                        userName.textContent = user.email.split('@')[0];
                        userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
                        planBadge.className = 'plan-badge free';
                        planBadge.innerHTML = `<i class="fas fa-user"></i> Free Plan`;
                    }
                })
                .catch(error => {
                    console.error("Error getting user data for sidebar:", error);
                    // Set defaults on error
                    userName.textContent = user.email.split('@')[0];
                    userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
                    planBadge.className = 'plan-badge free';
                    planBadge.innerHTML = `<i class="fas fa-user"></i> Free Plan`;
                });
        } else {
            // User is signed out, set defaults
            userName.textContent = 'Guest User';
            userEmail.textContent = 'Not signed in';
            userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
            planBadge.className = 'plan-badge free';
            planBadge.innerHTML = `<i class="fas fa-user"></i> Free Plan`;
        }
    });
}

// Function to update token balance in sidebar
function updateTokenBalance() {
    // Check if Firebase and auth are available
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
        console.warn("Firebase not available for token balance update");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const sidebarTokenCount = document.getElementById('sidebarTokenCount');
    const tokenBalanceSidebar = document.getElementById('tokenBalanceSidebar');

    if (!sidebarTokenCount || !tokenBalanceSidebar) {
        return;
    }

    // Make token balance clickable
    tokenBalanceSidebar.onclick = () => {
        window.location.href = 'tokens.html';
    };

    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // Get user data from Firestore
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        // Update token balance (check both possible field names)
                        sidebarTokenCount.textContent = userData.tokens || userData.tokenBalance || 0;
                    } else {
                        sidebarTokenCount.textContent = '0';
                    }
                })
                .catch(error => {
                    console.error("Error getting token balance:", error);
                    sidebarTokenCount.textContent = '0';
                });
        } else {
            // User is signed out
            sidebarTokenCount.textContent = '0';
        }
    });
}

// Initialize sidebar and user profile when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    updateSidebarUserProfile();
    updateTokenBalance();
});
