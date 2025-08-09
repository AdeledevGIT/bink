// Global Premium Enforcement Script
// This script ensures premium access is properly enforced across all pages

// Premium enforcement configuration
const PREMIUM_ENFORCEMENT = {
    enabled: true,
    checkInterval: 60000, // Check every minute
    maxRetries: 3,
    retryDelay: 5000,
    autoDowngradeEnabled: true
};

// Global premium enforcement functions
window.PremiumEnforcement = {
    // Check if user has valid premium status and auto-downgrade if expired
    checkPremiumStatus: function(userData, userId = null) {
        if (!userData) return false;

        // Check subscription tier (including trial)
        const hasSubscription = userData.subscriptionTier === 'premium' ||
                               userData.subscriptionTier === 'creator' ||
                               userData.subscriptionTier === 'trial' ||
                               userData.isPremium;

        // Check if premium has expired using subscriptionExpiration or trialExpiration
        if (hasSubscription) {
            let expirationDate = null;

            // Check trial expiration first
            if (userData.subscriptionTier === 'trial' && userData.trialExpiration) {
                expirationDate = userData.trialExpiration.toDate ?
                               userData.trialExpiration.toDate() :
                               new Date(userData.trialExpiration);
            } else if (userData.subscriptionExpiration) {
                expirationDate = userData.subscriptionExpiration.toDate ?
                               userData.subscriptionExpiration.toDate() :
                               new Date(userData.subscriptionExpiration);
            }

            if (expirationDate) {
                const now = new Date();

                if (expirationDate < now) {
                    console.log("Premium subscription/trial has expired, auto-downgrading to free");

                    // Auto-downgrade if enabled and we have user ID
                    if (PREMIUM_ENFORCEMENT.autoDowngradeEnabled && userId) {
                        if (userData.subscriptionTier === 'trial') {
                            this.autoDowngradeExpiredTrial(userId, userData);
                        } else {
                            this.autoDowngradeExpiredSubscription(userId, userData);
                        }
                    }

                    return false;
                }
            }
        }

        // Legacy check for premiumExpiresAt field
        if (userData.premiumExpiresAt) {
            const expirationDate = userData.premiumExpiresAt.toDate ?
                                  userData.premiumExpiresAt.toDate() :
                                  new Date(userData.premiumExpiresAt);
            const now = new Date();

            if (expirationDate < now) {
                console.log("Premium subscription has expired (legacy field)");

                // Auto-downgrade if enabled and we have user ID
                if (PREMIUM_ENFORCEMENT.autoDowngradeEnabled && userId) {
                    this.autoDowngradeExpiredSubscription(userId, userData);
                }

                return false;
            }
        }

        return hasSubscription;
    },

    // Automatically downgrade expired subscription to free tier
    autoDowngradeExpiredSubscription: function(userId, userData) {
        if (!window.firebase || !window.firebase.firestore) {
            console.error("Firebase not available for auto-downgrade");
            return;
        }

        const db = window.firebase.firestore();

        // Check if user is currently using a premium template
        const currentTemplate = userData.template || 'classic';
        const usedTemplates = userData.usedTemplates || [];
        const hasUsedCurrentTemplate = usedTemplates.includes(currentTemplate);

        let updateData = {
            subscriptionTier: 'free',
            isPremium: false,
            subscriptionExpired: true,
            lastSubscriptionTier: userData.subscriptionTier,
            lastSubscriptionExpiration: userData.subscriptionExpiration,
            premiumExpiredAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        // Check if current template is premium and user hasn't purchased it
        if (window.BINK && window.BINK.templates) {
            const template = window.BINK.templates.getTemplateById(currentTemplate);
            if (template && template.isPremium && !hasUsedCurrentTemplate) {
                updateData.template = 'classic';
                console.log("Reverting template to classic due to expired premium");
            }
        }

        // Update user document
        db.collection('users').doc(userId).update(updateData)
            .then(() => {
                console.log("User automatically downgraded to free tier");

                // Trigger UI updates if on relevant pages
                this.handlePostDowngradeActions(updateData);
            })
            .catch(error => {
                console.error("Error auto-downgrading user:", error);
            });
    },

    // Handle actions after successful downgrade
    handlePostDowngradeActions: function(updateData) {
        // Update local user data if available
        if (window.currentUserData) {
            window.currentUserData.subscriptionTier = 'free';
            window.currentUserData.isPremium = false;

            if (updateData.template) {
                window.currentUserData.template = updateData.template;
            }
        }

        // Trigger template update if on bio editor page
        if (typeof highlightSelectedTemplate === 'function' && updateData.template) {
            highlightSelectedTemplate('classic');
        }

        if (typeof updatePreviewFrameWithTemplate === 'function' && updateData.template) {
            updatePreviewFrameWithTemplate('classic');
        }

        // Show notification to user
        this.showExpirationNotification();
    },

    // Show notification about subscription expiration
    showExpirationNotification: function() {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('subscription-expired-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'subscription-expired-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b6b;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            `;
            document.body.appendChild(notification);
        }

        notification.innerHTML = `
            <strong>Subscription Expired</strong><br>
            Your premium subscription has expired and you've been moved to the free tier.
            <div style="margin-top: 10px;">
                <button onclick="window.location.href='pricing.html'" style="background: white; color: #ff6b6b; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Renew Subscription
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 5px;">
                    Dismiss
                </button>
            </div>
        `;

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification && notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    },

    // Check if user has access to a specific template
    hasTemplateAccess: function(userData, templateId) {
        if (!userData || !templateId) return false;
        
        // Get template info
        const template = window.BINK?.templates?.templates?.[templateId];
        if (!template) return false;
        
        // Free templates are always accessible
        if (!template.isPremium) return true;
        
        // Check premium status
        const isPremiumUser = this.checkPremiumStatus(userData);
        if (isPremiumUser) return true;
        
        // Check if user has purchased this template
        const usedTemplates = userData.usedTemplates || [];
        return usedTemplates.includes(templateId);
    },

    // Enforce template access for a user
    enforceTemplateAccess: function(userData, currentTemplate) {
        if (!userData || !currentTemplate || !window.db) return;
        
        const hasAccess = this.hasTemplateAccess(userData, currentTemplate);
        
        if (!hasAccess) {
            console.log(`Enforcing template access: User ${userData.id} doesn't have access to ${currentTemplate}`);
            
            // Update user's template to classic
            this.revertToClassicTemplate(userData.id, currentTemplate);
            return false;
        }
        
        return true;
    },

    // Revert user to classic template
    revertToClassicTemplate: function(userId, fromTemplate) {
        if (!window.db || !userId) return;
        
        console.log(`Reverting user ${userId} from ${fromTemplate} to classic template`);
        
        window.db.collection('users').doc(userId).update({
            template: 'classic',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            templateRevertedAt: firebase.firestore.FieldValue.serverTimestamp(),
            revertedFrom: fromTemplate,
            revertReason: 'premium_access_lost'
        }).then(() => {
            console.log("Template successfully reverted to classic");
            
            // Reload the page to show classic template
            if (window.location.pathname.includes('bio.html')) {
                window.location.reload();
            }
        }).catch(error => {
            console.error("Error reverting template:", error);
        });
    },

    // Monitor user's template access continuously
    startMonitoring: function(userData) {
        if (!PREMIUM_ENFORCEMENT.enabled || !userData) return;
        
        const checkAccess = () => {
            if (userData.template && userData.template !== 'classic') {
                this.enforceTemplateAccess(userData, userData.template);
            }
        };
        
        // Initial check
        checkAccess();
        
        // Set up periodic monitoring
        setInterval(checkAccess, PREMIUM_ENFORCEMENT.checkInterval);
    },

    // Initialize premium enforcement for bio pages
    initializeBioPageEnforcement: function() {
        // This will be called from bio.js
        console.log("Premium enforcement initialized for bio page");
    },

    // Initialize premium enforcement for editor pages
    initializeEditorEnforcement: function() {
        // This will be called from bio-editor.js
        console.log("Premium enforcement initialized for editor page");
    },

    // Auto-downgrade expired trial
    autoDowngradeExpiredTrial: function(userId, userData) {
        console.log("Auto-downgrading expired trial for user:", userId);

        const db = window.firebase.firestore();

        // Check if user is currently using a premium template
        const currentTemplate = userData.template || 'classic';
        const usedTemplates = userData.usedTemplates || [];
        const hasUsedCurrentTemplate = usedTemplates.includes(currentTemplate);

        let updateData = {
            subscriptionTier: 'free',
            isPremium: false,
            trialActive: false,
            trialExpired: true,
            trialEndedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        // If user is using a premium template they haven't purchased, revert to classic
        if (currentTemplate !== 'classic' && !hasUsedCurrentTemplate) {
            updateData.template = 'classic';
            console.log(`Reverting template from ${currentTemplate} to classic due to expired trial`);
        }

        // Update user document
        db.collection('users').doc(userId).update(updateData)
            .then(() => {
                console.log("Trial auto-downgrade completed for user:", userId);

                // Show notification if on dashboard
                if (typeof showNotification === 'function') {
                    showNotification("Your free trial has ended. Upgrade to premium to continue enjoying all features!", "info");
                }
            })
            .catch((error) => {
                console.error("Error auto-downgrading expired trial:", error);
            });
    },

    // Start periodic subscription checking for current user
    startPeriodicSubscriptionCheck: function(userId) {
        if (!userId || !window.firebase || !window.firebase.firestore) {
            console.log("Cannot start periodic subscription check - missing requirements");
            return;
        }

        const db = window.firebase.firestore();

        const checkSubscription = () => {
            db.collection('users').doc(userId).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();

                        // Check if subscription has expired and auto-downgrade
                        const isValid = this.checkPremiumStatus(userData, userId);

                        if (!isValid && (userData.subscriptionTier === 'premium' || userData.subscriptionTier === 'creator' || userData.subscriptionTier === 'trial')) {
                            console.log("Periodic check detected expired subscription/trial");
                        }
                    }
                })
                .catch(error => {
                    console.error("Error in periodic subscription check:", error);
                });
        };

        // Initial check
        checkSubscription();

        // Set up periodic checking every 5 minutes
        setInterval(checkSubscription, 5 * 60 * 1000);

        console.log("Periodic subscription checking started for user:", userId);
    },

    // Check and downgrade all expired subscriptions (admin function)
    checkAllExpiredSubscriptions: function() {
        if (!window.firebase || !window.firebase.firestore) {
            console.error("Firebase not available for bulk subscription check");
            return;
        }

        const db = window.firebase.firestore();

        // Query users with premium, creator, or trial subscriptions
        db.collection('users')
            .where('subscriptionTier', 'in', ['premium', 'creator', 'trial'])
            .get()
            .then(snapshot => {
                const now = new Date();
                let expiredCount = 0;

                snapshot.forEach(doc => {
                    const userData = doc.data();
                    const userId = doc.id;

                    // Skip lifetime subscriptions
                    if (userData.subscriptionDuration === 'lifetime') {
                        return;
                    }

                    // Check if subscription or trial has expired
                    let expiryDate = null;

                    if (userData.subscriptionTier === 'trial' && userData.trialExpiration) {
                        expiryDate = userData.trialExpiration.toDate();
                    } else if (userData.subscriptionExpiration) {
                        expiryDate = userData.subscriptionExpiration.toDate();
                    }

                    if (expiryDate && expiryDate < now) {
                        console.log(`Found expired ${userData.subscriptionTier} for user ${userId}`);

                        if (userData.subscriptionTier === 'trial') {
                            this.autoDowngradeExpiredTrial(userId, userData);
                        } else {
                            this.autoDowngradeExpiredSubscription(userId, userData);
                        }
                        expiredCount++;
                    }
                });

                console.log(`Checked subscriptions - found ${expiredCount} expired subscriptions`);
            })
            .catch(error => {
                console.error("Error checking expired subscriptions:", error);
            });
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Premium enforcement script loaded");
    
    // Initialize based on current page
    if (window.location.pathname.includes('bio.html')) {
        window.PremiumEnforcement.initializeBioPageEnforcement();
    } else if (window.location.pathname.includes('bio-editor.html')) {
        window.PremiumEnforcement.initializeEditorEnforcement();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.PremiumEnforcement;
}
