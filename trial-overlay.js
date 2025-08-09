// 14-Day Premium Trial System
// This script manages the premium trial overlay and functionality

// Trial configuration
const TRIAL_CONFIG = {
    durationDays: 14,
    features: [
        'Access to all premium templates',
        'Advanced analytics and insights',
        'Custom themes and branding',
        'Priority customer support',
        'Unlimited link customization',
        'Advanced social media integration'
    ]
};

// Global trial management object
window.TrialManager = {
    // Check if user is eligible for trial
    isEligibleForTrial: function(userData) {
        if (!userData) return false;
        
        // User is eligible if:
        // 1. They haven't claimed a trial before
        // 2. They are currently on free tier
        // 3. They don't have an active subscription
        return !userData.trialClaimed && 
               userData.subscriptionTier === 'free' && 
               !userData.isPremium;
    },

    // Check if user has an active trial
    hasActiveTrial: function(userData) {
        if (!userData || !userData.trialActive) return false;
        
        if (userData.trialExpiration) {
            const expiryDate = userData.trialExpiration.toDate ? 
                              userData.trialExpiration.toDate() : 
                              new Date(userData.trialExpiration);
            const now = new Date();
            
            return expiryDate > now;
        }
        
        return false;
    },

    // Get trial days remaining
    getTrialDaysRemaining: function(userData) {
        if (!this.hasActiveTrial(userData)) return 0;
        
        const expiryDate = userData.trialExpiration.toDate ? 
                          userData.trialExpiration.toDate() : 
                          new Date(userData.trialExpiration);
        const now = new Date();
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    },

    // Start trial for user
    startTrial: async function(userId) {
        try {
            const db = firebase.firestore();
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + TRIAL_CONFIG.durationDays);
            
            await db.collection('users').doc(userId).update({
                trialActive: true,
                trialClaimed: true,
                trialStartDate: firebase.firestore.FieldValue.serverTimestamp(),
                trialExpiration: firebase.firestore.Timestamp.fromDate(trialEndDate),
                isPremium: true, // Grant premium access during trial
                subscriptionTier: 'trial', // Special tier for trial users
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Trial started successfully for user:', userId);
            return true;
            
        } catch (error) {
            console.error('❌ Error starting trial:', error);
            return false;
        }
    },

    // End trial for user
    endTrial: async function(userId, userData) {
        try {
            const db = firebase.firestore();
            
            await db.collection('users').doc(userId).update({
                trialActive: false,
                trialExpired: true,
                trialEndedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isPremium: false,
                subscriptionTier: 'free',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Trial ended for user:', userId);
            return true;
            
        } catch (error) {
            console.error('❌ Error ending trial:', error);
            return false;
        }
    },

    // Show trial overlay
    showTrialOverlay: function(userData, context = 'dashboard') {
        // Remove existing overlay if present
        this.hideTrialOverlay();
        
        const overlay = this.createTrialOverlay(userData, context);
        document.body.appendChild(overlay);
        
        // Animate in
        setTimeout(() => {
            overlay.classList.add('show');
        }, 100);
    },

    // Hide trial overlay
    hideTrialOverlay: function() {
        const existingOverlay = document.getElementById('trial-overlay');
        if (existingOverlay) {
            existingOverlay.classList.remove('show');
            setTimeout(() => {
                existingOverlay.remove();
            }, 300);
        }
    },

    // Create trial overlay HTML
    createTrialOverlay: function(userData, context) {
        const overlay = document.createElement('div');
        overlay.id = 'trial-overlay';
        overlay.className = 'trial-overlay';
        
        const isEligible = this.isEligibleForTrial(userData);
        const hasActiveTrial = this.hasActiveTrial(userData);
        const daysRemaining = this.getTrialDaysRemaining(userData);
        
        let content = '';
        
        if (isEligible) {
            // Show trial offer
            content = this.createTrialOfferContent(context);
        } else if (hasActiveTrial) {
            // Show trial status
            content = this.createTrialStatusContent(daysRemaining, context);
        } else {
            // Show upgrade prompt
            content = this.createUpgradePromptContent(context);
        }
        
        overlay.innerHTML = content;
        
        // Add event listeners
        this.attachOverlayEventListeners(overlay, userData, context);
        
        return overlay;
    },

    // Create trial offer content
    createTrialOfferContent: function(context) {
        return `
            <div class="trial-overlay-content">
                <div class="trial-card">
                    <div class="trial-header">
                        <div class="trial-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <h2>🎉 Start Your Free Premium Trial!</h2>
                        <p>Get full access to all premium features for 14 days - completely free!</p>
                    </div>
                    
                    <div class="trial-features">
                        <h3>What you'll get:</h3>
                        <ul>
                            ${TRIAL_CONFIG.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="trial-actions">
                        <button class="trial-btn trial-btn-primary" id="start-trial-btn">
                            <i class="fas fa-rocket"></i>
                            Start Free Trial
                        </button>
                        <button class="trial-btn trial-btn-secondary" id="maybe-later-btn">
                            Maybe Later
                        </button>
                    </div>
                    
                    <div class="trial-footer">
                        <p><i class="fas fa-info-circle"></i> No credit card required • Cancel anytime • Automatically ends after 14 days</p>
                    </div>
                </div>
            </div>
        `;
    },

    // Create trial status content
    createTrialStatusContent: function(daysRemaining, context) {
        return `
            <div class="trial-overlay-content">
                <div class="trial-card trial-active">
                    <div class="trial-header">
                        <div class="trial-icon active">
                            <i class="fas fa-crown"></i>
                        </div>
                        <h2>🔥 Premium Trial Active!</h2>
                        <p>You have <strong>${daysRemaining} days</strong> left in your free trial</p>
                    </div>
                    
                    <div class="trial-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((14 - daysRemaining) / 14) * 100}%"></div>
                        </div>
                        <div class="progress-text">
                            Day ${14 - daysRemaining + 1} of 14
                        </div>
                    </div>
                    
                    <div class="trial-cta">
                        <p>Love the premium features? Upgrade now to keep them forever!</p>
                        <button class="trial-btn trial-btn-primary" id="upgrade-now-btn">
                            <i class="fas fa-star"></i>
                            Upgrade to Premium
                        </button>
                    </div>
                    
                    <div class="trial-actions">
                        <button class="trial-btn trial-btn-secondary" id="remind-later-btn">
                            Remind Me Later
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Create upgrade prompt content
    createUpgradePromptContent: function(context) {
        return `
            <div class="trial-overlay-content">
                <div class="trial-card trial-expired">
                    <div class="trial-header">
                        <div class="trial-icon expired">
                            <i class="fas fa-star"></i>
                        </div>
                        <h2>Unlock Premium Features</h2>
                        <p>Get access to all premium templates and advanced features</p>
                    </div>
                    
                    <div class="trial-features">
                        <ul>
                            ${TRIAL_CONFIG.features.slice(0, 4).map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="trial-actions">
                        <button class="trial-btn trial-btn-primary" id="upgrade-now-btn">
                            <i class="fas fa-crown"></i>
                            Upgrade to Premium
                        </button>
                        <button class="trial-btn trial-btn-secondary" id="close-overlay-btn">
                            Continue with Free
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Attach event listeners to overlay
    attachOverlayEventListeners: function(overlay, userData, context) {
        // Start trial button
        const startTrialBtn = overlay.querySelector('#start-trial-btn');
        if (startTrialBtn) {
            startTrialBtn.addEventListener('click', async () => {
                startTrialBtn.disabled = true;
                startTrialBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting Trial...';
                
                const success = await this.startTrial(firebase.auth().currentUser.uid);
                if (success) {
                    this.hideTrialOverlay();
                    // Reload page to reflect trial status
                    window.location.reload();
                } else {
                    startTrialBtn.disabled = false;
                    startTrialBtn.innerHTML = '<i class="fas fa-rocket"></i> Start Free Trial';
                    alert('Failed to start trial. Please try again.');
                }
            });
        }
        
        // Upgrade buttons
        const upgradeButtons = overlay.querySelectorAll('#upgrade-now-btn');
        upgradeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideTrialOverlay();
                window.location.href = 'pricing.html';
            });
        });
        
        // Close/dismiss buttons
        const dismissButtons = overlay.querySelectorAll('#maybe-later-btn, #remind-later-btn, #close-overlay-btn');
        dismissButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideTrialOverlay();
                // Set a flag to not show again for this session
                sessionStorage.setItem('trialOverlayDismissed', 'true');
            });
        });
        
        // Close on overlay click (outside card)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideTrialOverlay();
                sessionStorage.setItem('trialOverlayDismissed', 'true');
            }
        });
    }
};
