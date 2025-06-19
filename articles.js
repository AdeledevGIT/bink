// BINK Help Articles JavaScript
// This file handles the functionality for the help articles page

// DOM Elements
const articleSearchInput = document.getElementById('article-search');
const articleCategoryButtons = document.querySelectorAll('.article-category-btn');
const articleListContainer = document.getElementById('article-list');
const articleDetailContainer = document.getElementById('article-detail');
const welcomeMessage = document.getElementById('welcome-message');

// Global variables
let currentUser = null;
let articles = [];
let filteredArticles = [];
let currentCategory = 'all';

// Initialize the page
document.addEventListener('DOMContentLoaded', initArticlesPage);

// Initialize the articles page
async function initArticlesPage() {
    try {
        // Check if user is logged in (optional for articles page)
        checkAuth(false);

        // Load articles data
        loadArticles();

        // Set up event listeners
        setupEventListeners();

        // Check URL parameters for direct article access
        checkUrlParameters();

    } catch (error) {
        console.error('Error initializing articles page:', error);
    }
}

// Check URL parameters for direct article access
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    const section = urlParams.get('section');

    if (articleId) {
        // Show the specified article
        showArticleDetail(articleId);

        // If a specific section is specified, scroll to it
        if (section) {
            setTimeout(() => {
                scrollToSection(section);
            }, 300);
        }
    }
}

// Scroll to a specific section within an article
function scrollToSection(section) {
    // Find headings that might match the section
    const headings = document.querySelectorAll('.article-detail-content h3');

    for (const heading of headings) {
        const headingText = heading.textContent.toLowerCase();

        // Check if heading contains the section name
        if (headingText.includes(section.toLowerCase()) ||
            headingText.includes(getSectionTitle(section))) {

            // Scroll to this heading
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Highlight the section temporarily
            const originalBackground = heading.style.background;
            heading.style.background = 'rgba(59, 130, 246, 0.2)';
            heading.style.padding = '5px';
            heading.style.borderRadius = '5px';

            // Remove highlight after a few seconds
            setTimeout(() => {
                heading.style.background = originalBackground;
                heading.style.padding = '';
                heading.style.borderRadius = '';
            }, 3000);

            return;
        }
    }
}

// Get a readable section title from the section parameter
function getSectionTitle(section) {
    // Map of section parameters to possible heading texts
    const sectionMap = {
        'adding': 'adding new links',
        'organizing': 'organizing your links',
        'sharing': 'sharing your bio link',
        'free': 'free templates',
        'premium': 'premium templates',
        'customizing': 'customizing your template',
        'switching': 'switching templates',
        'earning': 'how to get tokens',
        'subscription': 'subscription plans',
        'payment': 'payment methods',
        'accessing': 'accessing analytics',
        'metrics': 'understanding key metrics',
        'location': 'geographic data',
        'advanced': 'advanced analytics',
        'profile': 'setting up your profile',
        'password': 'changing your password',
        'privacy': 'privacy settings',
        'data': 'data protection',
        'terms': 'terms of service'
    };

    return sectionMap[section] || section;
}

// Check authentication status
function checkAuth(requireAuth = false) {
    return new Promise((resolve, reject) => {
        // Check if Firebase is defined
        if (typeof firebase === 'undefined') {
            console.log('Firebase not loaded or not available');
            if (requireAuth) {
                window.location.href = 'login.html';
                reject('Firebase not available');
            } else {
                resolve(null);
            }
            return;
        }

        // Check authentication state
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                currentUser = user;
                if (welcomeMessage) {
                    db.collection('users').doc(user.uid).get()
                        .then((doc) => {
                            if (doc.exists) {
                                const userData = doc.data();
                                welcomeMessage.textContent = `Welcome, ${userData.displayName || userData.username || 'User'}!`;
                            }
                        })
                        .catch((error) => {
                            console.error('Error getting user data:', error);
                        });
                }
                resolve(user);
            } else {
                // No user is signed in
                currentUser = null;
                if (welcomeMessage) {
                    welcomeMessage.textContent = 'Welcome!';
                }
                if (requireAuth) {
                    window.location.href = 'login.html';
                    reject('User not authenticated');
                } else {
                    resolve(null);
                }
            }
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    articleSearchInput.addEventListener('input', handleSearch);

    // Category buttons
    articleCategoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            articleCategoryButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Filter articles by category
            currentCategory = button.dataset.category;
            filterArticles();
        });
    });
}

// Handle search input
function handleSearch() {
    const searchTerm = articleSearchInput.value.toLowerCase().trim();
    filterArticles(searchTerm);
}

// Filter articles by search term and category
function filterArticles(searchTerm = '') {
    // Get current search term if not provided
    if (!searchTerm && articleSearchInput) {
        searchTerm = articleSearchInput.value.toLowerCase().trim();
    }

    // Filter articles by category and search term
    filteredArticles = articles.filter(article => {
        // Check category
        const categoryMatch = currentCategory === 'all' || article.category === currentCategory;

        // Check search term
        const searchMatch = !searchTerm ||
            article.title.toLowerCase().includes(searchTerm) ||
            article.description.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm);

        return categoryMatch && searchMatch;
    });

    // Render filtered articles
    renderArticleList();
}

// Load articles data
function loadArticles() {
    // In a real application, this would fetch from a database
    // For now, we'll use hardcoded articles data
    articles = [
        {
            id: 'account-setup',
            title: 'Setting Up Your BINK Account',
            description: 'Learn how to create and set up your BINK account for the first time.',
            category: 'account',
            icon: 'user-plus',
            content: `
                <h2>Setting Up Your BINK Account</h2>

                <h3>Creating Your Account</h3>
                <p>To get started with BINK, you'll need to create an account. Follow these simple steps:</p>
                <ol>
                    <li>Visit the BINK homepage and click on "Sign Up"</li>
                    <li>Enter your email address and create a secure password</li>
                    <li>Choose a unique username for your bio link</li>
                    <li>Complete the verification process via email</li>
                    <li>Log in to access your new BINK dashboard</li>
                </ol>

                <h3>Setting Up Your Profile</h3>
                <p>Once you've created your account, you should set up your profile:</p>
                <ul>
                    <li>Upload a profile picture</li>
                    <li>Add a bio description</li>
                    <li>Choose your preferred template</li>
                    <li>Add your social media links and other important URLs</li>
                </ul>

                <h3>Changing Your Password</h3>
                <p>To change your password:</p>
                <ol>
                    <li>Go to your account settings</li>
                    <li>Click on "Security"</li>
                    <li>Select "Change Password"</li>
                    <li>Enter your current password</li>
                    <li>Enter and confirm your new password</li>
                    <li>Click "Save Changes"</li>
                </ol>

                <div class="tip">
                    <strong>Pro Tip:</strong> Choose a high-quality, clear profile picture to make your bio link more professional and recognizable.
                </div>
            `
        },
        {
            id: 'managing-links',
            title: 'Managing Your Bio Links',
            description: 'Learn how to add, edit, and organize links on your bio page.',
            category: 'links',
            icon: 'link',
            content: `
                <h2>Managing Your Bio Links</h2>

                <h3>Adding New Links</h3>
                <p>Adding links to your bio page is simple:</p>
                <ol>
                    <li>From your dashboard, navigate to the Bio Editor</li>
                    <li>Click the "Add Link" button</li>
                    <li>Enter the title and URL for your link</li>
                    <li>Choose an icon (optional)</li>
                    <li>Click "Save" to add the link to your bio page</li>
                </ol>

                <h3>Organizing Your Links</h3>
                <p>You can easily rearrange your links by dragging and dropping them in the Bio Editor. This allows you to prioritize your most important links by placing them at the top of your bio page.</p>

                <h3>Editing and Removing Links</h3>
                <p>To edit a link, click the edit icon next to the link in your Bio Editor. To remove a link, click the delete icon. Remember to save your changes after editing.</p>

                <div class="tip">
                    <strong>Pro Tip:</strong> Use descriptive titles for your links to increase click-through rates. Instead of "My YouTube," try something like "Watch My Latest Video."
                </div>
            `
        },
        {
            id: 'using-templates',
            title: 'Using BINK Templates',
            description: 'Discover how to use and customize different templates for your bio page.',
            category: 'templates',
            icon: 'palette',
            content: `
                <h2>Using BINK Templates</h2>

                <h3>Choosing a Template</h3>
                <p>BINK offers a variety of templates to customize the look and feel of your bio page:</p>
                <ol>
                    <li>From your dashboard, go to the Templates section</li>
                    <li>Browse through available templates (both free and premium)</li>
                    <li>Click on a template to preview how your bio page will look</li>
                    <li>Select "Use This Template" to apply it to your bio page</li>
                </ol>

                <h3>Free vs. Premium Templates</h3>
                <p>BINK offers both free and premium templates:</p>
                <ul>
                    <li><strong>Free Templates:</strong> Available to all users</li>
                    <li><strong>Premium Templates:</strong> Available to premium subscribers or can be purchased with tokens</li>
                </ul>

                <h3>Customizing Your Template</h3>
                <p>Each template has different customization options. Generally, you can customize:</p>
                <ul>
                    <li>Profile picture display</li>
                    <li>Bio text formatting</li>
                    <li>Link button styles</li>
                    <li>Background colors or images</li>
                </ul>

                <div class="tip">
                    <strong>Pro Tip:</strong> Choose a template that matches your personal brand or content style for a more cohesive online presence.
                </div>
            `
        },
        {
            id: 'tokens-system',
            title: 'Understanding the Tokens System',
            description: 'Learn how tokens work and how to use them to unlock premium features.',
            category: 'tokens',
            icon: 'coins',
            content: `
                <h2>Understanding the Tokens System</h2>

                <h3>What Are BINK Tokens?</h3>
                <p>BINK tokens are a virtual currency within the platform that allow you to purchase premium templates and features without a subscription.</p>

                <h3>How to Get Tokens</h3>
                <p>There are several ways to acquire tokens:</p>
                <ul>
                    <li><strong>Purchasing Tokens:</strong> Buy token packages directly through the platform</li>
                    <li><strong>Completing Tasks:</strong> Earn tokens by completing specific tasks in the Tasks section</li>
                    <li><strong>First Purchase Bonus:</strong> Free users get 200 free tokens on their first purchase</li>
                </ul>

                <h3>Using Tokens</h3>
                <p>Tokens can be used to:</p>
                <ul>
                    <li>Purchase premium templates (100-200 tokens each)</li>
                    <li>Access certain premium features</li>
                </ul>

                <h3>Token Balance</h3>
                <p>Your token balance is displayed in the dashboard sidebar and on the Tokens page. Click on it to view your transaction history and purchase more tokens.</p>

                <div class="tip">
                    <strong>Pro Tip:</strong> Complete tasks regularly to earn free tokens and save money on premium features.
                </div>
            `
        },
        {
            id: 'viewing-analytics',
            title: 'Viewing Your Bio Page Analytics',
            description: 'Learn how to access and interpret your bio page analytics.',
            category: 'analytics',
            icon: 'chart-line',
            content: `
                <h2>Viewing Your Bio Page Analytics</h2>

                <h3>Accessing Analytics</h3>
                <p>To view your bio page analytics:</p>
                <ol>
                    <li>Log in to your BINK dashboard</li>
                    <li>Click on the "Analytics" section in the sidebar</li>
                    <li>View your analytics dashboard with various metrics</li>
                </ol>

                <h3>Understanding Key Metrics</h3>
                <p>BINK analytics provide several important metrics:</p>
                <ul>
                    <li><strong>Page Views:</strong> Total number of visits to your bio page</li>
                    <li><strong>Link Clicks:</strong> Number of clicks on each of your links</li>
                    <li><strong>Click-through Rate (CTR):</strong> Percentage of visitors who click on your links</li>
                    <li><strong>Geographic Data:</strong> Locations of your visitors</li>
                    <li><strong>Device Types:</strong> What devices your visitors are using</li>
                </ul>

                <h3>Advanced Analytics</h3>
                <p>Premium and Creator users have access to advanced analytics including:</p>
                <ul>
                    <li>Detailed visitor demographics</li>
                    <li>Time-based analytics (hourly, daily, weekly trends)</li>
                    <li>Referral sources</li>
                    <li>Export capabilities for data analysis</li>
                </ul>

                <div class="tip">
                    <strong>Pro Tip:</strong> Check your analytics regularly to identify which links perform best and optimize your bio page accordingly.
                </div>
            `
        },
        {
            id: 'security',
            title: 'Security & Privacy',
            description: 'Learn how to keep your BINK account secure and manage your privacy settings.',
            category: 'security',
            icon: 'shield-alt',
            content: `
                <h2>Security & Privacy</h2>

                <h3>Account Security</h3>
                <p>Keeping your BINK account secure is important. Here are some best practices:</p>
                <ul>
                    <li>Use a strong, unique password for your BINK account</li>
                    <li>Never share your login credentials with anyone</li>
                    <li>Log out when using shared or public computers</li>
                    <li>Regularly check your account for any suspicious activity</li>
                    <li>Update your password periodically</li>
                </ul>

                <h3>Privacy Settings</h3>
                <p>BINK offers several privacy settings to control who can see your bio page and what information is visible:</p>
                <ul>
                    <li><strong>Public Profile:</strong> Anyone can view your bio page (default)</li>
                    <li><strong>Private Profile:</strong> Only people with the link can view your bio page</li>
                    <li><strong>Hide Analytics:</strong> Prevent others from seeing your view count</li>
                    <li><strong>Hide Location:</strong> Disable location tracking for your visitors</li>
                </ul>

                <h3>Data Protection</h3>
                <p>BINK takes data protection seriously. Here's how we protect your data:</p>
                <ul>
                    <li>All data is encrypted in transit and at rest</li>
                    <li>We never sell your personal information to third parties</li>
                    <li>You can request a copy of your data at any time</li>
                    <li>You can delete your account and all associated data permanently</li>
                </ul>

                <h3>Terms of Service</h3>
                <p>Our Terms of Service outline the rules and guidelines for using BINK:</p>
                <ul>
                    <li>You must be at least 13 years old to use BINK</li>
                    <li>You are responsible for all content you share through BINK</li>
                    <li>Prohibited content includes illegal material, spam, and harmful content</li>
                    <li>Violation of our terms may result in account suspension or termination</li>
                </ul>

                <div class="tip">
                    <strong>Pro Tip:</strong> Regularly review your privacy settings to ensure they match your preferences, especially after platform updates.
                </div>
            `
        }
    ];

    // Set filtered articles initially to all articles
    filteredArticles = [...articles];

    // Render the article list
    renderArticleList();
}

// Render the article list
function renderArticleList() {
    // Clear the article list container
    articleListContainer.innerHTML = '';

    if (filteredArticles.length === 0) {
        // No articles found
        articleListContainer.innerHTML = `
            <div class="no-articles">
                <i class="fas fa-search"></i>
                <h3>No articles found</h3>
                <p>Try adjusting your search or category filter.</p>
            </div>
        `;
        return;
    }

    // Create article cards
    filteredArticles.forEach(article => {
        const articleCard = document.createElement('div');
        articleCard.className = 'article-card';
        articleCard.innerHTML = `
            <div class="article-icon">
                <i class="fas fa-${article.icon}"></i>
            </div>
            <div class="article-content">
                <h3>${article.title}</h3>
                <p>${article.description}</p>
                <a href="#" class="article-link" data-article-id="${article.id}">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
        `;

        // Add click event to the "Read More" link
        const readMoreLink = articleCard.querySelector('.article-link');
        readMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            showArticleDetail(article.id);
        });

        // Add the card to the container
        articleListContainer.appendChild(articleCard);
    });
}

// Show article detail
function showArticleDetail(articleId) {
    // Find the article
    const article = articles.find(a => a.id === articleId);

    if (!article) {
        console.error(`Article with ID ${articleId} not found`);
        return;
    }

    // Hide article list
    articleListContainer.style.display = 'none';

    // Show article detail
    articleDetailContainer.classList.add('active');

    // Populate article detail
    articleDetailContainer.innerHTML = `
        <div class="article-detail-header">
            <button class="back-btn" onclick="hideArticleDetail()">
                <i class="fas fa-arrow-left"></i> Back to Articles
            </button>
            <h2>${article.title}</h2>
            <div class="article-category">
                <span class="category-tag">${article.category.charAt(0).toUpperCase() + article.category.slice(1)}</span>
            </div>
        </div>
        <div class="article-detail-content">
            ${article.content}
        </div>
        <div class="article-detail-footer">
            <div class="article-helpful">
                <p>Was this article helpful?</p>
                <div class="helpful-buttons">
                    <button class="helpful-btn" onclick="rateArticle('${article.id}', true)">
                        <i class="fas fa-thumbs-up"></i> Yes
                    </button>
                    <button class="helpful-btn" onclick="rateArticle('${article.id}', false)">
                        <i class="fas fa-thumbs-down"></i> No
                    </button>
                </div>
            </div>
            <div class="article-support">
                <p>Still need help?</p>
                <a href="#" onclick="openContactForm('', 'Article Support: ' + article.title, 'I need help with the following article: ' + article.title); return false;" class="support-link">
                    <i class="fas fa-envelope"></i> Contact Support
                </a>
            </div>
        </div>
    `;

    // Update URL without reloading the page
    const urlParams = new URLSearchParams(window.location.search);
    const currentSection = urlParams.get('section');

    // Create new URL with article ID
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('article', articleId);

    // Keep section parameter if it exists
    if (currentSection) {
        newUrl.searchParams.set('section', currentSection);
    } else {
        newUrl.searchParams.delete('section');
    }

    // Update browser history
    window.history.pushState({ articleId, section: currentSection }, '', newUrl);

    // Scroll to top
    window.scrollTo(0, 0);
}

// Hide article detail
function hideArticleDetail() {
    // Show article list
    articleListContainer.style.display = 'grid';

    // Hide article detail
    articleDetailContainer.classList.remove('active');

    // Update URL to remove article and section parameters
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('article');
    newUrl.searchParams.delete('section');

    // Update browser history
    window.history.pushState({}, '', newUrl);
}

// Rate article
function rateArticle(articleId, isHelpful) {
    // In a real application, this would send the rating to the server
    console.log(`Article ${articleId} rated ${isHelpful ? 'helpful' : 'not helpful'}`);

    // Show feedback message
    const helpfulButtons = document.querySelector('.helpful-buttons');
    helpfulButtons.innerHTML = `
        <div class="feedback-message">
            <i class="fas fa-check-circle"></i>
            Thank you for your feedback!
        </div>
    `;
}

// Function to open contact form with pre-filled data
function openContactForm(email, subject, message) {
    const url = `contact-support.html?email=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
    window.location.href = url;
}

// Make functions available globally
window.hideArticleDetail = hideArticleDetail;
window.rateArticle = rateArticle;
window.openContactForm = openContactForm;
