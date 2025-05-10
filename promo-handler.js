/**
 * Handles the one-time offer/promo functionality
 * This script checks if the one-time offer is active and shows/hides elements accordingly
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const upgradeButton = document.getElementById('upgrade-button');
    const promoInactiveMessage = document.getElementById('promo-inactive-message');
    const lifetimeOffer = document.getElementById('lifetime-offer');
    
    // Check if promo is active (this would normally be fetched from the server/admin settings)
    // For demo purposes, we'll use a function that simulates checking the server
    checkPromoStatus();
    
    /**
     * Checks if the one-time offer/promo is active
     * In a real implementation, this would make an API call to check admin settings
     */
    function checkPromoStatus() {
        // Simulate an API call or server check
        // For demo purposes, we'll just use a variable
        // In a real implementation, this would be fetched from the server
        const isPromoActive = false; // Change to true to simulate active promo
        
        // Update UI based on promo status
        updatePromoUI(isPromoActive);
    }
    
    /**
     * Updates the UI based on whether the promo is active or not
     * @param {boolean} isActive - Whether the promo is active
     */
    function updatePromoUI(isActive) {
        if (isActive) {
            // Promo is active, show the upgrade button and lifetime offer
            if (upgradeButton) upgradeButton.style.display = 'block';
            if (promoInactiveMessage) promoInactiveMessage.style.display = 'none';
            if (lifetimeOffer) lifetimeOffer.style.display = 'block';
        } else {
            // Promo is not active, show the inactive message and hide lifetime offer
            if (upgradeButton) upgradeButton.style.display = 'none';
            if (promoInactiveMessage) promoInactiveMessage.style.display = 'block';
            if (lifetimeOffer) lifetimeOffer.style.display = 'none';
        }
    }
});
