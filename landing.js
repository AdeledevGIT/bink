// Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Promo Handler Functionality
    // Check if promo elements exist
    const upgradeButton = document.getElementById('upgrade-button');
    const promoInactiveMessage = document.getElementById('promo-inactive-message');
    const lifetimeOffer = document.getElementById('lifetime-offer');

    // Check if promo is active
    // In a real implementation, this would make an API call to check admin settings
    function checkPromoStatus() {
        // For demo purposes, we'll just use a variable
        // In a real implementation, this would be fetched from the server
        const isPromoActive = false; // Change to true to simulate active promo

        // Update UI based on promo status
        updatePromoUI(isPromoActive);
    }

    // Update UI based on promo status
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

    // Initialize promo status
    checkPromoStatus();
    // Mobile Menu Toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');

            // Change icon based on menu state
            const icon = mobileMenuButton.querySelector('i');
            if (mobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close mobile menu when clicking on a link
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                const icon = mobileMenuButton.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');

            question.addEventListener('click', function() {
                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }

    // Testimonial Slider
    const testimonialSlider = document.querySelector('.testimonials-slider');
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.testimonial-dots .dot');

    if (testimonialSlider && testimonialCards.length > 0 && dots.length > 0) {
        // Set initial active dot
        dots[0].classList.add('active');

        // Handle dot clicks
        dots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                // Remove active class from all dots
                dots.forEach(d => d.classList.remove('active'));

                // Add active class to clicked dot
                dot.classList.add('active');

                // Scroll to corresponding testimonial
                if (testimonialCards[index]) {
                    testimonialSlider.scrollTo({
                        left: testimonialCards[index].offsetLeft - testimonialSlider.offsetLeft,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Update active dot based on scroll position
        testimonialSlider.addEventListener('scroll', function() {
            const scrollPosition = testimonialSlider.scrollLeft;
            const sliderWidth = testimonialSlider.offsetWidth;

            // Find the card that is most visible
            let activeIndex = 0;
            let maxVisibility = 0;

            testimonialCards.forEach((card, index) => {
                const cardLeft = card.offsetLeft - testimonialSlider.offsetLeft;
                const cardRight = cardLeft + card.offsetWidth;

                // Calculate how much of the card is visible
                const visibleLeft = Math.max(cardLeft, scrollPosition);
                const visibleRight = Math.min(cardRight, scrollPosition + sliderWidth);
                const visibleWidth = Math.max(0, visibleRight - visibleLeft);

                if (visibleWidth > maxVisibility) {
                    maxVisibility = visibleWidth;
                    activeIndex = index;
                }
            });

            // Update active dot
            dots.forEach(d => d.classList.remove('active'));
            if (dots[activeIndex]) {
                dots[activeIndex].classList.add('active');
            }
        });
    }

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Skip if href is just "#"
            if (href === '#') return;

            e.preventDefault();

            const targetElement = document.querySelector(href);

            if (targetElement) {
                // Calculate header height for offset
                const headerHeight = document.querySelector('.landing-header').offsetHeight;

                window.scrollTo({
                    top: targetElement.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.landing-header');

    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card');

    if (animateElements.length > 0) {
        // Check if element is in viewport
        function isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8
            );
        }

        // Add animation class when element is in viewport
        function checkVisibility() {
            animateElements.forEach(element => {
                if (isInViewport(element)) {
                    element.classList.add('animate');
                }
            });
        }

        // Initial check
        checkVisibility();

        // Check on scroll
        window.addEventListener('scroll', checkVisibility);
    }
});
