window.BINK = window.BINK || {};
window.BINK.templates = window.BINK.templates || {};
window.BINK.templates.templates = window.BINK.templates.templates || {};

// Template categories based on user types
window.BINK.templates.categories = {
    'all': {
        name: 'All Templates',
        description: 'Browse all available templates',
        icon: 'fas fa-th-large'
    },
    'creator': {
        name: 'Content Creator',
        description: 'Perfect for influencers, YouTubers, and social media creators',
        icon: 'fas fa-video'
    },
    'business': {
        name: 'Professional',
        description: 'Ideal for business professionals, executives, and corporate use',
        icon: 'fas fa-briefcase'
    },
    'seller': {
        name: 'Online Seller',
        description: 'Great for e-commerce, product showcases, and online stores',
        icon: 'fas fa-shopping-cart'
    },
    'artist': {
        name: 'Creative Artist',
        description: 'Designed for artists, designers, photographers, and creatives',
        icon: 'fas fa-palette'
    }
};

// Helper for icons
window.BINK.templates.getPlatformIcon = function(platform) {
    const icons = {
        'instagram': 'fab fa-instagram',
        'twitter': 'fab fa-x-twitter',
        'facebook': 'fab fa-facebook',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'linkedin': 'fab fa-linkedin',
        'github': 'fab fa-github',
        'pinterest': 'fab fa-pinterest',
        'snapchat': 'fab fa-snapchat',
        'reddit': 'fab fa-reddit',
        'twitch': 'fab fa-twitch',
        'discord': 'fab fa-discord',
        'whatsapp': 'fab fa-whatsapp',
        'telegram': 'fab fa-telegram',
        'medium': 'fab fa-medium',
        'spotify': 'fab fa-spotify',
        'apple-music': 'fab fa-apple',
        'youtube-music': 'fab fa-youtube',
        'audiomack': 'fas fa-music',
        'soundcloud': 'fab fa-soundcloud',
        'bandcamp': 'fab fa-bandcamp',
        'tidal': 'fas fa-music',
        'deezer': 'fas fa-music',
        'amazon-music': 'fab fa-amazon',
        'behance': 'fab fa-behance',
        'dribbble': 'fab fa-dribbble',
        'website': 'fas fa-globe',
        'email': 'fas fa-envelope',
        'phone': 'fas fa-phone',
        'other': 'fas fa-link'
    };
    return icons[platform] || icons.other;
};

// Helper to format username (remove @ if present, don't add it)
window.BINK.templates.formatUsername = function(username) {
    if (!username) return '';
    // Remove @ symbol if it's at the beginning of the username, don't add it back
    return username.startsWith('@') ? username.substring(1) : username;
};

// Helper to render social links
window.BINK.templates.renderSocialLinks = function(socialLinks) {
    if (!socialLinks || typeof socialLinks !== 'object') return '';
    return Object.entries(socialLinks).map(([platform, url]) => {
        if (!url) return '';
        return `<a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>`;
    }).join('');
};

// Helper to render catalog content
window.BINK.templates.renderCatalogContent = function(catalog) {
    if (!catalog || !Array.isArray(catalog) || catalog.length === 0) return '';

    const catalogId = `catalog-grid-${Date.now()}`;
    const catalogHTML = `
    <div class="catalog-section">
        <h3 class="catalog-title">Products</h3>
        <div class="catalog-grid" id="${catalogId}">
            ${catalog.map(product => {
                // Display price with currency if available
                let displayPrice = '';
                if (product.price) {
                    displayPrice = product.price;
                } else if (product.priceAmount) {
                    // For backward compatibility, construct price from separate fields
                    if (product.currency && product.priceAmount.toLowerCase() !== 'free') {
                        displayPrice = product.currency + product.priceAmount;
                    } else {
                        displayPrice = product.priceAmount;
                    }
                }

                return `
                    <div class="catalog-item">
                        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" class="catalog-item-image">` : ''}
                        <div class="catalog-item-content">
                            <h4 class="catalog-item-title">${product.title}</h4>
                            ${product.description ? `<p class="catalog-item-description">${product.description}</p>` : ''}
                            ${displayPrice ? `<div class="catalog-item-price">${displayPrice}</div>` : ''}
                            <a href="${product.buyLink}" target="_blank" class="catalog-buy-btn">
                                <i class="fas fa-shopping-cart"></i> Buy Now
                            </a>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    </div>
    `;

    // Initialize auto-scroll after rendering
    setTimeout(() => {
        const catalogGrid = document.getElementById(catalogId);
        if (catalogGrid) {
            window.BINK.templates.initializeCatalogAutoScroll(catalogGrid);
        }
    }, 100);

    return catalogHTML;
};

// Auto-scroll functionality for catalog
window.BINK.templates.initializeCatalogAutoScroll = function(catalogGrid) {
    if (!catalogGrid || catalogGrid.children.length <= 1) return;

    let scrollPosition = 0;
    let isScrolling = true;
    let scrollDirection = 1; // 1 for right, -1 for left

    const scrollSpeed = 0.5; // pixels per frame
    const pauseDuration = 2000; // pause at ends in milliseconds

    function autoScroll() {
        if (!isScrolling) return;

        const maxScroll = catalogGrid.scrollWidth - catalogGrid.clientWidth;

        if (maxScroll <= 0) return; // No need to scroll if content fits

        scrollPosition += scrollSpeed * scrollDirection;

        // Check boundaries and reverse direction
        if (scrollPosition >= maxScroll) {
            scrollPosition = maxScroll;
            scrollDirection = -1;
            pauseScrolling();
        } else if (scrollPosition <= 0) {
            scrollPosition = 0;
            scrollDirection = 1;
            pauseScrolling();
        }

        catalogGrid.scrollLeft = scrollPosition;

        if (isScrolling) {
            requestAnimationFrame(autoScroll);
        }
    }

    function pauseScrolling() {
        isScrolling = false;
        setTimeout(() => {
            isScrolling = true;
            requestAnimationFrame(autoScroll);
        }, pauseDuration);
    }

    // Start auto-scroll
    requestAnimationFrame(autoScroll);

    // Pause on hover
    catalogGrid.addEventListener('mouseenter', () => {
        isScrolling = false;
    });

    catalogGrid.addEventListener('mouseleave', () => {
        isScrolling = true;
        requestAnimationFrame(autoScroll);
    });

    // Handle manual scrolling
    catalogGrid.addEventListener('scroll', () => {
        scrollPosition = catalogGrid.scrollLeft;
    });
};

// Helper to render media content
window.BINK.templates.renderMediaContent = function(media) {
    if (!media || typeof media !== 'object') return '';

    // Check if media is empty and provide sample data for preview
    const hasAnyMedia = (media.youtube && media.youtube.length > 0) ||
                       (media.images && media.images.length > 0) ||
                       (media.music && media.music.length > 0);

    if (!hasAnyMedia) {
        // Don't show any media sections if user hasn't added content
        return '';
    }

    let mediaHTML = '';

    // YouTube Videos
    if (media.youtube && media.youtube.length > 0) {
        mediaHTML += `
            <div class="media-section">
                <h3 class="media-section-title">
                    <i class="fab fa-youtube"></i> Videos
                </h3>
                <div class="media-grid youtube-grid">
                    ${media.youtube.map(video => `
                        <div class="media-item youtube-item">
                            <div class="youtube-embed-container">
                                <iframe
                                    src="https://www.youtube.com/embed/${window.BINK.templates.getYouTubeVideoId(video.url)}"
                                    frameborder="0"
                                    allowfullscreen
                                    loading="lazy">
                                </iframe>
                            </div>
                            <div class="media-info">
                                <h4 class="media-title">${video.title}</h4>
                                ${video.description ? `<p class="media-description">${video.description}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Images
    if (media.images && media.images.length > 0) {
        mediaHTML += `
            <div class="media-section">
                <h3 class="media-section-title">
                    <i class="fas fa-images"></i> Gallery
                </h3>
                <div class="media-grid images-grid">
                    ${media.images.map(image => `
                        <div class="media-item image-item">
                            <div class="image-container">
                                <img src="${image.url}" alt="${image.title}" loading="lazy" onclick="window.BINK.templates.openImageModal('${image.url}', '${image.title}')">
                            </div>
                            <div class="media-info">
                                <h4 class="media-title">${image.title}</h4>
                                ${image.description ? `<p class="media-description">${image.description}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Music
    if (media.music && media.music.length > 0) {
        mediaHTML += `
            <div class="media-section">
                <h3 class="media-section-title">
                    <i class="fas fa-music"></i> Music
                </h3>
                <div class="media-grid music-grid">
                    ${media.music.map(music => `
                        <div class="media-item music-item">
                            <div class="music-player" onclick="window.BINK.templates.playMusicPreview('${music.platform}', '${music.url}', '${music.title}')">
                                <div class="music-platform-icon ${music.platform}">
                                    <i class="${window.BINK.templates.getMusicPlatformIcon(music.platform)}"></i>
                                </div>
                                <div class="music-info">
                                    <h4 class="music-title">${music.title}</h4>
                                    ${music.artist ? `<p class="music-artist">by ${music.artist}</p>` : ''}
                                    <p class="music-platform">${window.BINK.templates.getPlatformDisplayName(music.platform)}</p>
                                </div>
                                <div class="play-button">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return mediaHTML ? `<div class="media-container">${mediaHTML}</div>` : '';
};

// Helper functions for media
window.BINK.templates.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

window.BINK.templates.getMusicPlatformIcon = function(platform) {
    const icons = {
        'spotify': 'fab fa-spotify',
        'apple-music': 'fab fa-apple',
        'youtube-music': 'fab fa-youtube',
        'audiomack': 'fas fa-music',
        'soundcloud': 'fab fa-soundcloud',
        'bandcamp': 'fab fa-bandcamp',
        'tidal': 'fas fa-music',
        'deezer': 'fas fa-music',
        'amazon-music': 'fab fa-amazon',
        'other': 'fas fa-music'
    };
    return icons[platform] || icons.other;
};

window.BINK.templates.getPlatformDisplayName = function(platform) {
    const names = {
        'spotify': 'Spotify',
        'apple-music': 'Apple Music',
        'youtube-music': 'YouTube Music',
        'audiomack': 'AudioMack',
        'soundcloud': 'SoundCloud',
        'bandcamp': 'Bandcamp',
        'tidal': 'Tidal',
        'deezer': 'Deezer',
        'amazon-music': 'Amazon Music',
        'other': 'Music'
    };
    return names[platform] || 'Music';
};

// Global functions for media interactions
window.BINK.templates.openImageModal = function(imageUrl, imageTitle) {
    // Create and show image modal
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <span class="image-modal-close">&times;</span>
            <img src="${imageUrl}" alt="${imageTitle}">
            <div class="image-modal-title">${imageTitle}</div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Close modal events
    modal.querySelector('.image-modal-close').onclick = () => {
        document.body.removeChild(modal);
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
};

window.BINK.templates.playMusicPreview = function(platform, url, title) {
    // Use the same embedded music player functionality from bio.js
    if (window.playMusicPreview) {
        window.playMusicPreview(platform, url, title);
    } else {
        // Fallback to opening external link if embedded player not available
        window.open(url, '_blank');
    }
};

// Utility for initials and avatar HTML (bio page version, no camera+ indicator)
function getAvatarHTML(data, className, containerClass, color, border = '', shadow = '') {
    const initial = (data.displayName || data.username || 'U').charAt(0).toUpperCase();
    const hasPic = !!data.profilePicUrl;
    const bg = color ? `background:${color};` : '';
    const borderStyle = border ? `border:${border};` : '';
    const shadowStyle = shadow ? `box-shadow:${shadow};` : '';
    // Generate unique IDs for image and initials for event handlers
    const uniqueId = `avatar-${Math.random().toString(36).substr(2, 9)}`;
    const imgId = `${uniqueId}-img`;
    const initialsId = `${uniqueId}-initials`;
    // Add onerror/onload handlers to toggle initials and image
    return `
        <div class="${containerClass || ''}" style="position:relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
            <img class="${className}" id="${imgId}" src="${data.profilePicUrl || ''}" alt="Profile" style="${hasPic ? '' : 'display:none;'} width: 100%; height: 100%; object-fit: cover; border-radius: 50%; ${borderStyle} ${shadowStyle}"
                onerror="this.style.display='none'; var initials=document.getElementById('${initialsId}'); if(initials){initials.style.display='flex';}"
                onload="if(this.src && !this.src.endsWith('profile.png')){this.style.display=''; var initials=document.getElementById('${initialsId}'); if(initials){initials.style.display='none';}}"
            >
            <div class="avatar-initials" id="${initialsId}" style="${hasPic ? 'display:none;' : ''}${bg} ${borderStyle} ${shadowStyle} position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:2.5rem; font-weight:700; border-radius:50%; z-index:2; letter-spacing:0.02em; text-transform:uppercase;">
                ${initial}
            </div>
        </div>
    `;
}

// Classic Template (fallback, no extra CSS)
window.BINK.templates.templates['classic'] = {
    id: 'classic',
    name: 'Classic',
    description: 'Simple, clean, and timeless.',
    css: 'bio.css',
    isPremium: false,
    category: 'creator',
    render: function(data) {
        return `
        <div class="bio-page">
            <div class="bio-container">
                <div class="bio-header-actions">
                    <div class="bio-join-link">
                        <a href="index.html" class="bio-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                    </div>
                    <div class="bio-share">
                        <button class="bio-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="bio-header">
                    <div class="profile-image-container">
                        <img src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}" alt="Profile Image">
                    </div>
                    <div class="bio-header-content">
                        <h1>${data.displayName || data.username}</h1>
                        <p class="bio-description">${data.bio || ''}</p>
                    </div>
                </div>
                <div class="links-container">
                    ${(data.links || []).map(link => `
                        <div class="bio-link-container">
                            <a class="bio-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                ${link.title}
                            </a>
                            <button class="bio-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}
                <div class="social-icons">
                    ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                        <a class="social-icon" href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                    `).join('')}
                </div>

                <footer class="bio-footer">
                    <p>Powered by <a href="index.html" target="_blank">BINK</a></p>
                </footer>
            </div>
        </div>
        `;
    }
};

// NeonCard Template - Restyled
window.BINK.templates.templates['neoncard'] = {
    id: 'neoncard',
    name: 'Neon Card',
    description: 'A modern, animated neon-styled bio page with sleek design.',
    css: 'templates/neoncard.css',
    isPremium: false,
    category: 'creator',
    render: function(data) {
        // data: { displayName, username, bio, profilePicUrl, links, socialLinks }
        return `
        <div class="neoncard-bio-page">
            <div class="neoncard-container">
                <div class="neoncard-header-actions">
                    <div class="neoncard-join-link">
                        <a href="index.html" class="neoncard-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                    </div>
                    <div class="neoncard-share">
                        <button class="neoncard-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="neoncard-header">
                    <div class="neoncard-avatar-container">
                        <img class="neoncard-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                    </div>
                    <div class="neoncard-username" data-text="${window.BINK.templates.formatUsername(data.displayName || data.username)}">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="neoncard-bio">${data.bio || ''}</div>
                </div>
                <div class="neoncard-links">
                    ${(data.links || []).map(link => `
                        <div class="neoncard-link-container">
                            <a class="neoncard-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                            </a>
                            <button class="neoncard-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="neoncard-socials">
                    ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                        <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                    `).join('')}
                </div>

                <div class="neoncard-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// GlassMorphism Template (NEW)
window.BINK.templates.templates['glassmorphism'] = {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted glass effect with soft gradients.',
    css: 'templates/glassmorphism.css',
    isPremium: false,
    category: 'creator',
    render: function(data) {
        return `
        <div class="glass-bio-bg">
            <div class="glass-bio-card">
                <div class="glass-header-actions">
                    <div class="glass-join-link">
                        <a href="index.html" class="glass-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                    </div>
                    <div class="glass-share">
                        <button class="glass-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="glass-profile">
                    <img class="glass-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                    <div class="glass-name">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="glass-bio">${data.bio || ''}</div>
                </div>
                <div class="glass-links">
                    ${(data.links || []).map(link => `
                        <div class="glass-link-container">
                            <a class="glass-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                ${link.title}
                            </a>
                            <button class="glass-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="glass-socials">
                    ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                        <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                    `).join('')}
                </div>

                <div class="glass-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

window.BINK.templates.templates['purplecard'] = {
    id: 'purplecard',
    name: 'Purple Card',
    description: 'Rounded, modern, purple card style (matches your screenshot)',
    css: 'templates/purplecard.css',
    isPremium: true,
    tokenPrice: 150,
    category: 'creator',
    render: function(data) {
        return `
        <div class="purplecard-bio-bg">
            <div class="purplecard-bio-main">
                <div class="purplecard-header-actions">
                    <div class="purplecard-join-link">
                        <a href="index.html" class="purplecard-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                    </div>
                    <div class="purplecard-share">
                        <button class="purplecard-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="purplecard-header">
                    <img class="purplecard-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                    <div class="purplecard-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="purplecard-bio">${data.bio || ''}</div>
                </div>
                <div class="purplecard-links">
                    ${(data.links || []).map(link => `
                        <div class="purplecard-link-container">
                            <a class="purplecard-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <span>${link.title}</span>
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                            </a>
                            <button class="purplecard-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="purplecard-socials">
                    ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                        <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                    `).join('')}
                </div>

                <div class="purplecard-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

window.BINK.templates.templates['landingprofile'] = {
    id: 'landingprofile',
    name: 'Landing Profile',
    description: 'Banner, profile at top left, username in front, share buttons, and sections as described.',
    css: 'templates/landingprofile.css',
    js: 'templates/landingprofile.js',
    isPremium: true,
    tokenPrice: 120,
    category: 'creator',
    render: function(data) {
        // Load the standalone JavaScript if not already loaded
        if (!window.LandingProfile) {
            const script = document.createElement('script');
            script.src = 'templates/landingprofile.js';
            script.onload = function() {
                // Re-render after script loads
                const bioRoot = document.getElementById('bio-root');
                if (bioRoot) {
                    bioRoot.innerHTML = window.LandingProfile.render(data);
                }
            };
            document.head.appendChild(script);
            return '<div>Loading...</div>';
        }

        return window.LandingProfile.render(data);
    }
};

// Share logic for profile and links
window.BINK.templates.shareProfile = function(e, username) {
    e.preventDefault();
    // Use only username parameter - no template parameter
    const url = `${window.location.origin}/bio.html?u=${username}`;
    if (navigator.share) {
        navigator.share({
            title: `Check out @${username}'s BINK profile!`,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert('Profile link copied!');
    }
};

window.BINK.templates.shareLink = function(e, url, title) {
    e.preventDefault();
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert('Link copied!');
    }
};

// Track link clicks
window.BINK.templates.trackLinkClick = function(e, linkId) {
    // Don't prevent default - we still want the link to open

    try {
        // Get the current user ID from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('u');

        if (!username || !linkId) return;

        // Find the user by username
        db.collection('users').where('username', '==', username).get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) return;

                const userDoc = querySnapshot.docs[0];
                const userId = userDoc.id;

                // First try to update in user's collection
                const userLinkRef = db.collection('users').doc(userId).collection('links').doc(linkId);
                return userLinkRef.get().then(doc => {
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
                });
            })
            .catch(error => {
                console.error('Error tracking link click:', error);
            });
    } catch (error) {
        console.error('Error tracking link click:', error);
    }
};

// Function to preview a template without saving it
window.BINK.templates.previewTemplate = function(templateId) {
    const username = document.getElementById('username-display')?.textContent;
    if (!username) return;

    // For preview purposes, we still use the template parameter
    // This allows users to preview templates before applying them
    // But for actual bio links, we don't include the template parameter
    const previewUrl = `bio.html?u=${username}&t=${templateId}`;
    const previewFrame = document.getElementById('preview-frame');
    if (previewFrame) {
        previewFrame.src = previewUrl;
    }

    // Update open preview button
    const openPreviewButton = document.getElementById('open-preview-button');
    if (openPreviewButton) {
        openPreviewButton.href = previewUrl;
    }
};

// Function to create template label (free/premium)
window.BINK.templates.createTemplateLabel = function(template) {
    const isPremium = template.isPremium;
    const tokenPrice = template.tokenPrice || 100;

    if (isPremium) {
        return `<div class="template-label premium">
            <i class="fas fa-crown"></i> Premium (${tokenPrice} Tokens)
        </div>`;
    } else {
        return `<div class="template-label free">
            <i class="fas fa-check-circle"></i> Free
        </div>`;
    }
};

// Function to get template by ID
window.BINK.templates.getTemplateById = function(templateId) {
    return window.BINK.templates.templates[templateId];
};

// Function to show premium template modal
window.BINK.templates.showPremiumTemplateModal = function(templateId) {
    // Get template details
    const template = window.BINK.templates.getTemplateById(templateId);
    if (!template) {
        console.error("Template not found:", templateId);
        return;
    }

    // Get current user data
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        console.error("User not authenticated");
        return;
    }

    const currentUserData = window.currentUserData || {};
    const currentTokens = currentUserData.tokens || 0;
    const tokenPrice = template.tokenPrice || 100;

    // Get modal elements
    const modal = document.getElementById('premium-template-modal');
    const templateNameEl = document.getElementById('premium-template-name');
    const templatePriceEl = document.getElementById('premium-template-price');
    const templateBalanceEl = document.getElementById('premium-template-balance');
    const useTokensBtn = document.getElementById('use-tokens-btn');
    const buyTokensBtn = document.getElementById('buy-tokens-btn');
    const closeModalBtn = document.getElementById('close-premium-modal-btn');
    const closeModalX = document.getElementById('close-premium-modal');

    if (!modal || !templateNameEl || !templatePriceEl || !templateBalanceEl || !useTokensBtn || !buyTokensBtn) {
        console.error("Premium template modal elements not found");
        return;
    }

    // Update modal content
    templateNameEl.textContent = template.name;
    templatePriceEl.textContent = tokenPrice;
    templateBalanceEl.textContent = currentTokens;

    // Show modal
    modal.style.display = 'block';

    // Set up event listeners
    const closeModal = () => {
        modal.style.display = 'none';
    };

    // Remove existing event listeners to prevent duplicates
    const newUseTokensBtn = useTokensBtn.cloneNode(true);
    useTokensBtn.parentNode.replaceChild(newUseTokensBtn, useTokensBtn);

    const newBuyTokensBtn = buyTokensBtn.cloneNode(true);
    buyTokensBtn.parentNode.replaceChild(newBuyTokensBtn, buyTokensBtn);

    const newCloseModalBtn = closeModalBtn.cloneNode(true);
    closeModalBtn.parentNode.replaceChild(newCloseModalBtn, closeModalBtn);

    const newCloseModalX = closeModalX.cloneNode(true);
    closeModalX.parentNode.replaceChild(newCloseModalX, closeModalX);

    // Add new event listeners
    newUseTokensBtn.addEventListener('click', () => {
        if (currentTokens < tokenPrice) {
            alert(`You don't have enough tokens. This template costs ${tokenPrice} tokens.`);
            return;
        }

        // Use tokens for template
        if (typeof window.useTokenForTemplate === 'function') {
            window.useTokenForTemplate(templateId, tokenPrice);
        } else {
            useTokensForTemplate(templateId, tokenPrice);
        }

        closeModal();
    });

    newBuyTokensBtn.addEventListener('click', () => {
        closeModal();
        window.location.href = 'tokens.html';
    });

    newCloseModalBtn.addEventListener('click', closeModal);
    newCloseModalX.addEventListener('click', closeModal);

    // Close when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
};

// Fallback implementation of useTokenForTemplate if the bio-editor.js function isn't available
function useTokensForTemplate(templateId, tokenPrice) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    // Get current user data
    const currentUserData = window.currentUserData || {};
    const currentTokens = currentUserData.tokens || 0;

    if (currentTokens < tokenPrice) {
        alert(`You don't have enough tokens. This template costs ${tokenPrice} token${tokenPrice > 1 ? 's' : ''}.`);
        return;
    }

    // Get used templates array
    const usedTemplates = currentUserData.usedTemplates || [];

    // Check if template is already used
    if (usedTemplates.includes(templateId)) {
        // Already used, no need to spend tokens
        console.log("Template already used, no need to spend tokens");
        selectTemplateAndSave(templateId);
        return;
    }

    // Calculate new token balance
    const newTokenBalance = currentTokens - tokenPrice;

    // Update user document
    const db = firebase.firestore();
    db.collection('users').doc(currentUser.uid).update({
        tokens: newTokenBalance,
        usedTemplates: firebase.firestore.FieldValue.arrayUnion(templateId),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log(`Used ${tokenPrice} token(s) for template ${templateId}`);

        // Get template name for better messaging
        const template = window.BINK.templates.getTemplateById(templateId);
        const templateName = template ? template.name : 'premium template';

        alert(`Successfully unlocked ${templateName}!`);

        // Update local data
        if (window.currentUserData) {
            window.currentUserData.tokens = newTokenBalance;
            window.currentUserData.usedTemplates = [...usedTemplates, templateId];
        }

        // Update token balance display in header if it exists
        const headerTokenCount = document.getElementById('header-token-count');
        if (headerTokenCount) {
            headerTokenCount.textContent = newTokenBalance;
        }

        // Record token usage
        recordTokenUsageForTemplate(templateId, tokenPrice, templateName);

        // Select the template
        selectTemplateAndSave(templateId);
    })
    .catch(error => {
        console.error("Error using tokens:", error);
        alert(`Error unlocking template: ${error.message}`);
    });
}

// Record token usage for analytics (fallback implementation)
function recordTokenUsageForTemplate(templateId, tokenAmount, templateName) {
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;

        const db = firebase.firestore();
        db.collection('tokenUsage').add({
            userId: currentUser.uid,
            templateId: templateId,
            templateName: templateName,
            tokenAmount: tokenAmount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error recording token usage:', error);
    }
}

// Select and save template (fallback implementation)
function selectTemplateAndSave(templateId) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    // Highlight the selected template if the function exists
    if (typeof window.highlightSelectedTemplate === 'function') {
        window.highlightSelectedTemplate(templateId);
    }

    // Update preview with the selected template if the function exists
    if (typeof window.updatePreviewFrameWithTemplate === 'function') {
        window.updatePreviewFrameWithTemplate(templateId);
    }

    // Save the template selection to database
    const db = firebase.firestore();
    const bioPageRef = db.collection('bioPages').doc(currentUser.uid);
    const userRef = db.collection('users').doc(currentUser.uid);

    // Use a batch to update both documents
    const batch = db.batch();

    batch.update(bioPageRef, {
        template: templateId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.update(userRef, {
        template: templateId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.commit()
    .then(() => {
        console.log(`Template updated to ${templateId}`);

        // Update local data
        if (window.currentUserData) {
            window.currentUserData.template = templateId;
        }

        // Reload the page to reflect changes
        window.location.reload();
    })
    .catch(error => {
        console.error("Error updating template:", error);
        alert(`Error saving template: ${error.message}`);
    });
}

// Function to show premium template modal
window.BINK.templates.showTokenPurchaseModal = function(templateId) {
    // Get template details
    const template = window.BINK.templates.getTemplateById(templateId);
    if (!template) {
        console.error("Template not found:", templateId);
        return;
    }

    // Get current user data
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        console.error("User not authenticated");
        return;
    }

    const currentUserData = window.currentUserData || {};
    const currentTokens = currentUserData.tokens || 0;
    const tokenPrice = template.tokenPrice || 100;

    // Directly select the template
    if (typeof window.handleTemplateSelection === 'function') {
        window.handleTemplateSelection(templateId);
    } else {
        console.log("Template selection function not available");
        // Fallback to direct selection
        selectTemplateAndSave(templateId);
    }
};

window.BINK.templates.templates['blacklanding'] = {
    id: 'blacklanding',
    name: 'Black Landing',
    description: 'Dark landing page, username inline, centered about section.',
    css: 'templates/blacklanding.css',
    js: 'templates/blacklanding.js',
    isPremium: true,
    tokenPrice: 180,
    category: 'business',
    render: function(data) {
        // Load the standalone JavaScript if not already loaded
        if (!window.BlackLanding) {
            const script = document.createElement('script');
            script.src = 'templates/blacklanding.js';
            script.onload = function() {
                // Re-render after script loads
                const bioRoot = document.getElementById('bio-root');
                if (bioRoot) {
                    bioRoot.innerHTML = window.BlackLanding.render(data);
                }
            };
            document.head.appendChild(script);
            return '<div>Loading...</div>';
        }

        return window.BlackLanding.render(data);
    }
};

// Gradient Flow Template (Premium)
window.BINK.templates.templates['gradientflow'] = {
    id: 'gradientflow',
    name: 'Gradient Flow',
    description: 'A modern template with flowing gradient backgrounds.',
    css: 'templates/gradientflow.css',
    isPremium: true,
    tokenPrice: 120,
    category: 'creator',
    render: function(data) {
        return `
        <div class="gradientflow-bio-bg">
            <div class="gradientflow-container">
                <div class="gradientflow-card">
                    <div class="gradientflow-header-actions">
                        <div class="gradientflow-join-link">
                            <a href="index.html" class="gradientflow-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="gradientflow-share">
                            <button class="gradientflow-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="gradientflow-profile">
                        <div class="gradientflow-avatar-container">
                            <img class="gradientflow-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="gradientflow-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="gradientflow-bio">${data.bio || ''}</div>
                    </div>
                    <div class="gradientflow-links">
                        ${(data.links || []).map(link => `
                            <div class="gradientflow-link-container">
                                <a class="gradientflow-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="gradientflow-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="gradientflow-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                    <div class="gradientflow-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Dark Elegance Template (Premium)
window.BINK.templates.templates['darkelegance'] = {
    id: 'darkelegance',
    name: 'Dark Elegance',
    description: 'A sophisticated dark template with gold accents.',
    css: 'templates/darkelegance.css',
    isPremium: true,
    tokenPrice: 180,
    category: 'business',
    render: function(data) {
        return `
        <div class="darkelegance-bio-bg">
            <div class="darkelegance-container">
                <div class="darkelegance-card">
                    <div class="darkelegance-header-actions">
                        <div class="darkelegance-join-link">
                            <a href="index.html" class="darkelegance-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="darkelegance-share">
                            <button class="darkelegance-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="darkelegance-profile">
                        <div class="darkelegance-avatar-container">
                            <img class="darkelegance-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="darkelegance-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="darkelegance-bio">${data.bio || ''}</div>
                    </div>
                    <div class="darkelegance-links">
                        ${(data.links || []).map(link => `
                            <div class="darkelegance-link-container">
                                <a class="darkelegance-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="darkelegance-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="darkelegance-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                    <div class="darkelegance-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Neon Glow Template (Premium)
window.BINK.templates.templates['neonglow'] = {
    id: 'neonglow',
    name: 'Neon Glow',
    description: 'A vibrant template with neon glow effects.',
    css: 'templates/neonglow.css',
    isPremium: true,
    tokenPrice: 200,
    category: 'creator',
    render: function(data) {
        return `
        <div class="neonglow-bio-bg">
            <div class="neonglow-container">
                <div class="neonglow-card">
                    <div class="neonglow-header-actions">
                        <div class="neonglow-join-link">
                            <a href="index.html" class="neonglow-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="neonglow-share">
                            <button class="neonglow-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="neonglow-profile">
                        <div class="neonglow-avatar-container">
                            <img class="neonglow-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="neonglow-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="neonglow-bio">${data.bio || ''}</div>
                    </div>
                    <div class="neonglow-links">
                        ${(data.links || []).map(link => `
                            <div class="neonglow-link-wrapper">
                                <a href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <div class="neonglow-link">
                                        <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                        ${link.title}
                                    </div>
                                </a>
                                <button class="neonglow-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="neonglow-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                    <div class="neonglow-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Minimal Zen Template (Premium)
window.BINK.templates.templates['minimalzen'] = {
    id: 'minimalzen',
    name: 'Minimal Zen',
    description: 'A clean, minimalist template with subtle animations.',
    css: 'templates/minimalzen.css',
    isPremium: true,
    tokenPrice: 150,
    category: 'business',
    render: function(data) {
        return `
        <div class="minimalzen-bio-bg">
            <div class="minimalzen-container">
                <div class="minimalzen-card">
                    <div class="minimalzen-header-actions">
                        <div class="minimalzen-join-link">
                            <a href="index.html" class="minimalzen-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="minimalzen-share">
                            <button class="minimalzen-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="minimalzen-profile">
                        <div class="minimalzen-avatar-container">
                            <img class="minimalzen-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="minimalzen-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="minimalzen-bio">${data.bio || ''}</div>
                    </div>
                    <div class="minimalzen-links">
                        ${(data.links || []).map(link => `
                            <div class="minimalzen-link-container">
                                <a class="minimalzen-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="minimalzen-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="minimalzen-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                    <div class="minimalzen-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Tech Wave Template (Premium)
window.BINK.templates.templates['techwave'] = {
    id: 'techwave',
    name: 'Tech Wave',
    description: 'A futuristic tech-themed template with wave animations.',
    css: 'templates/techwave.css',
    isPremium: true,
    tokenPrice: 180,
    category: 'creator',
    render: function(data) {
        return `
        <div class="techwave-bio-bg">
            <div class="techwave-waves"></div>
            <div class="techwave-waves-2"></div>
            <div class="techwave-container">
                <div class="techwave-card">
                    <div class="techwave-header-actions">
                        <div class="techwave-join-link">
                            <a href="index.html" class="techwave-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="techwave-share">
                            <button class="techwave-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="techwave-profile">
                        <div class="techwave-avatar-container">
                            <img class="techwave-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="techwave-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="techwave-bio">${data.bio || ''}</div>
                    </div>
                    <div class="techwave-links">
                        ${(data.links || []).map(link => `
                            <div class="techwave-link-container">
                                <a class="techwave-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="techwave-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="techwave-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                    <div class="techwave-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Split Screen Template (Premium)
window.BINK.templates.templates['splitscreen'] = {
    id: 'splitscreen',
    name: 'Split Screen',
    description: 'A modern split-screen layout with content on one side and profile on the other.',
    css: 'templates/splitscreen.css',
    isPremium: true,
    tokenPrice: 170,
    category: 'seller',
    render: function(data) {
        return `
        <div class="splitscreen-bio-bg">
            <div class="splitscreen-container">
                <div class="splitscreen-sidebar">
                    <div class="splitscreen-profile">
                        <div class="splitscreen-avatar-container">
                            <img class="splitscreen-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="splitscreen-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="splitscreen-bio">${data.bio || ''}</div>
                        <div class="splitscreen-socials">
                            ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                                <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="splitscreen-content">
                    <div class="splitscreen-header-actions">
                        <div class="splitscreen-join-link">
                            <a href="index.html" class="splitscreen-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="splitscreen-share">
                            <button class="splitscreen-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="splitscreen-section-title">My Links</div>
                    <div class="splitscreen-links">
                        ${(data.links || []).map(link => `
                            <div class="splitscreen-link-container">
                                <a class="splitscreen-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="splitscreen-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="splitscreen-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Magazine Template (Premium) - Redesigned
window.BINK.templates.templates['magazine'] = {
    id: 'magazine',
    name: 'Magazine',
    description: 'A modern magazine-style layout with clean sections.',
    css: 'templates/magazine.css',
    isPremium: true,
    tokenPrice: 160,
    category: 'business',
    render: function(data) {
        return `
        <div class="magazine-bio-bg">
            <div class="magazine-container">
                <div class="magazine-header-actions">
                    <div class="magazine-join-link">
                        <a href="index.html" class="magazine-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                    </div>
                    <div class="magazine-share">
                        <button class="magazine-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="magazine-profile-section">
                    <div class="magazine-profile-header">
                        <div class="magazine-avatar-container">
                            <img class="magazine-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="magazine-profile-info">
                            <div class="magazine-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                            <div class="magazine-socials">
                                ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                                    <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="magazine-bio-section">
                        <div class="magazine-section-label">About</div>
                        <div class="magazine-bio">${data.bio || ''}</div>
                    </div>
                </div>

                <div class="magazine-links-section">
                    <div class="magazine-section-label">Featured Links</div>
                    <div class="magazine-links">
                        ${(data.links || []).map(link => `
                            <div class="magazine-link-container">
                                <a class="magazine-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <div class="magazine-link-icon">
                                        <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    </div>
                                    <div class="magazine-link-content">
                                        <div class="magazine-link-title">${link.title}</div>
                                    </div>
                                </a>
                                <button class="magazine-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="magazine-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Retro Wave Template (Premium)
window.BINK.templates.templates['retrowave'] = {
    id: 'retrowave',
    name: 'Retro Wave',
    description: 'A retro-inspired template with 80s aesthetics.',
    css: 'templates/retrowave.css',
    isPremium: true,
    tokenPrice: 190,
    category: 'creator',
    render: function(data) {
        return `
        <div class="retrowave-bio-bg">
            <div class="retrowave-sun"></div>
            <div class="retrowave-container">
                <div class="retrowave-card">
                    <div class="retrowave-header-actions">
                        <div class="retrowave-join-link">
                            <a href="index.html" class="retrowave-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="retrowave-share">
                            <button class="retrowave-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="retrowave-profile">
                        <div class="retrowave-avatar-container">
                            <img class="retrowave-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="retrowave-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="retrowave-bio">${data.bio || ''}</div>
                    </div>
                    <div class="retrowave-links">
                        ${(data.links || []).map(link => `
                            <div class="retrowave-link-container">
                                <a class="retrowave-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="retrowave-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="retrowave-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                    <div class="retrowave-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Nature Template (Premium)
window.BINK.templates.templates['nature'] = {
    id: 'nature',
    name: 'Nature',
    description: 'An organic, nature-themed template with earthy tones.',
    css: 'templates/nature.css',
    isPremium: true,
    tokenPrice: 140,
    category: 'artist',
    render: function(data) {
        return `
        <div class="nature-bio-bg">
            <div class="nature-container">
                <div class="nature-card">
                    <div class="nature-header-actions">
                        <div class="nature-join-link">
                            <a href="index.html" class="nature-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="nature-share">
                            <button class="nature-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="nature-profile">
                        <div class="nature-avatar-container">
                            <img class="nature-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="nature-username">@${data.displayName || data.username}</div>
                        <div class="nature-bio">${data.bio || ''}</div>
                    </div>
                    <div class="nature-links">
                        ${(data.links || []).map(link => `
                            <div class="nature-link-container">
                                <a class="nature-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="nature-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}
                    <div class="nature-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                    <div class="nature-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Portfolio Template (Premium) - Redesigned with prominent links
window.BINK.templates.templates['portfolio'] = {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'A professional portfolio layout with prominent links.',
    css: 'templates/portfolio.css',
    isPremium: true,
    tokenPrice: 175,
    category: 'seller',
    render: function(data) {
        return `
        <div class="portfolio-bio-bg">
            <div class="portfolio-container">
                <div class="portfolio-header-actions">
                    <div class="portfolio-join-link">
                        <a href="index.html" class="portfolio-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                    </div>
                    <div class="portfolio-share">
                        <button class="portfolio-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="portfolio-profile-section">
                    <div class="portfolio-avatar-container">
                        <img class="portfolio-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                    </div>
                    <div class="portfolio-profile-info">
                        <div class="portfolio-username">@${data.displayName || data.username}</div>
                        <div class="portfolio-bio">${data.bio || ''}</div>
                        <div class="portfolio-socials">
                            ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                                <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="portfolio-links-section">
                    <h2 class="portfolio-section-title">My Links</h2>
                    <div class="portfolio-links-grid">
                        ${(data.links || []).map(link => `
                            <div class="portfolio-link-wrapper">
                                <a class="portfolio-link-card" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <div class="portfolio-link-icon">
                                        <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    </div>
                                    <div class="portfolio-link-title">${link.title}</div>
                                    <div class="portfolio-link-visit">Visit <i class="fas fa-arrow-right"></i></div>
                                </a>
                                <button class="portfolio-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="portfolio-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Corporate Professional Template
window.BINK.templates.templates['corporate'] = {
    id: 'corporate',
    name: 'Corporate Professional',
    description: 'Clean, professional template perfect for business professionals and executives.',
    css: 'templates/corporate.css',
    isPremium: true,
    tokenPrice: 150,
    category: 'business',
    render: function(data) {
        return `
        <div class="corporate-bio-page">
            <div class="corporate-container">
                <div class="corporate-header-actions">
                    <div class="corporate-join-link">
                        <a href="index.html"><i class="fas fa-user-plus"></i> Join BINK</a>
                    </div>
                    <button class="corporate-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="corporate-header">
                    ${getAvatarHTML(data, 'corporate-avatar', 'corporate-avatar-container', '#e0e7ef', '3px solid #e0e7ef', '0 5px 15px rgba(0,0,0,0.08)')}
                    <div class="corporate-name">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="corporate-title">Professional</div>
                    <div class="corporate-bio">${data.bio || ''}</div>
                </div>

                <div class="corporate-content">
                    <div class="corporate-links">
                        <div class="corporate-section-title">Professional Links</div>
                        ${(data.links || []).map(link => `
                            <div class="corporate-link-container">
                                <a class="corporate-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    <span class="corporate-link-text">${link.title}</span>
                                    <button class="corporate-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                        <i class="fas fa-share-alt"></i>
                                    </button>
                                </a>
                            </div>
                        `).join('')}
                    </div>

                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <div class="corporate-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                </div>

                <div class="corporate-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Creative Artist Template
window.BINK.templates.templates['creative'] = {
    id: 'creative',
    name: 'Creative Artist',
    description: 'Vibrant, artistic template perfect for creatives, artists, and designers.',
    css: 'templates/creative.css',
    isPremium: true,
    tokenPrice: 180,
    category: 'artist',
    render: function(data) {
        return `
        <div class="creative-bio-page">
            <div class="creative-container">
                <div class="creative-header-actions">
                    <div class="creative-join-link">
                        <a href="index.html"><i class="fas fa-user-plus"></i> Join BINK</a>
                    </div>
                    <button class="creative-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="creative-header">
                    ${getAvatarHTML(data, 'creative-avatar', 'creative-avatar-container', '#e0e7ef', '3px solid #e0e7ef', '0 5px 15px rgba(0,0,0,0.08)')}
                    <div class="creative-name">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="creative-title">Creative Artist</div>
                    <div class="creative-bio">${data.bio || ''}</div>
                </div>

                <div class="creative-content">
                    <div class="creative-links">
                        <div class="creative-section-title">My Creative Work</div>
                        ${(data.links || []).map(link => `
                            <div class="creative-link-container">
                                <a class="creative-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    <span class="creative-link-text">${link.title}</span>
                                    <button class="creative-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                        <i class="fas fa-share-alt"></i>
                                    </button>
                                </a>
                            </div>
                        `).join('')}
                    </div>

                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <div class="creative-socials">
                        ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                            <a href="${url}" target="_blank"><i class="${window.BINK.templates.getPlatformIcon(platform)}"></i></a>
                        `).join('')}
                    </div>
                </div>

                <div class="creative-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Gradient Card Template (Premium)
window.BINK.templates.templates['gradientcard'] = {
    id: 'gradientcard',
    name: 'Gradient Card',
    description: 'Modern gradient background with card-style layout and smooth animations.',
    css: 'templates/gradientcard.css',
    isPremium: true,
    tokenPrice: 140,
    category: 'seller',
    render: function(data) {
        return `
        <div class="gradientcard-bio-bg">
            <div class="gradientcard-container">
                <div class="gradientcard-header-actions">
                    <a href="index.html" class="gradientcard-join-btn">
                        <i class="fas fa-user-plus"></i> Join BINK
                    </a>
                    <button class="gradientcard-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                <div class="gradientcard-profile">
                    ${getAvatarHTML(data, 'gradientcard-avatar', 'gradientcard-avatar-container', '#667eea', '4px solid #fff', '0 8px 32px #667eea')}
                    <div class="gradientcard-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="gradientcard-bio">${data.bio || ''}</div>
                </div>
                <div class="gradientcard-links">
                    ${(data.links || []).map(link => `
                        <div class="gradientcard-link-container">
                            <a class="gradientcard-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                            </a>
                            <button class="gradientcard-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}
                <div class="gradientcard-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>
                <div class="gradientcard-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Neon Minimal Template (Premium)
window.BINK.templates.templates['neonminimal'] = {
    id: 'neonminimal',
    name: 'Neon Minimal',
    description: 'Clean minimal design with neon accents and cyberpunk aesthetics.',
    css: 'templates/neonminimal.css',
    isPremium: true,
    tokenPrice: 150,
    category: 'creator',
    render: function(data) {
        return `
        <div class="neonminimal-bio-bg">
            <div class="neonminimal-container">
                <div class="neonminimal-header-actions">
                    <a href="index.html" class="neonminimal-join-btn">
                        <i class="fas fa-user-plus"></i> Join BINK
                    </a>
                    <button class="neonminimal-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="neonminimal-profile">
                    ${getAvatarHTML(data, 'neonminimal-avatar', 'neonminimal-avatar-container', '#e0e7ef', '3px solid #e0e7ef', '0 5px 15px rgba(0,0,0,0.08)')}
                    <div class="neonminimal-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="neonminimal-bio">${data.bio || ''}</div>
                </div>

                <div class="neonminimal-links">
                    ${(data.links || []).map(link => `
                        <div class="neonminimal-link-container">
                            <a class="neonminimal-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                            </a>
                            <button class="neonminimal-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="neonminimal-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>

                <div class="neonminimal-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Soft Pastel Template (Premium)
window.BINK.templates.templates['softpastel'] = {
    id: 'softpastel',
    name: 'Soft Pastel',
    description: 'Dreamy pastel colors with soft rounded elements and whimsical design.',
    css: 'templates/softpastel.css',
    isPremium: true,
    tokenPrice: 160,
    category: 'artist',
    render: function(data) {
        return `
        <div class="softpastel-bio-bg">
            <div class="softpastel-container">
                <div class="softpastel-header-actions">
                    <a href="index.html" class="softpastel-join-btn">
                        <i class="fas fa-user-plus"></i> Join BINK
                    </a>
                    <button class="softpastel-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                <div class="softpastel-profile">
                    ${getAvatarHTML(data, 'softpastel-avatar', 'softpastel-avatar-container', '#ffeef8', '4px solid #ffc1e3', '0 8px 32px #ffc1e3')}
                    <div class="softpastel-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="softpastel-bio">${data.bio || ''}</div>
                </div>
                <div class="softpastel-links">
                    ${(data.links || []).map(link => `
                        <div class="softpastel-link-container">
                            <a class="softpastel-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                            </a>
                            <button class="softpastel-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}
                <div class="softpastel-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>
                <div class="softpastel-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Cover Story Template (Premium)
window.BINK.templates.templates['coverstory'] = {
    id: 'coverstory',
    name: 'Cover Story',
    description: 'Profile picture as background cover with overlay text and modern card design.',
    css: 'templates/coverstory.css',
    isPremium: true,
    tokenPrice: 130,
    category: 'business',
    render: function(data) {
        const profileImageUrl = data.profilePicUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=280&fit=crop&crop=face';
        return `
        <div class="coverstory-bio-bg">
            <div class="coverstory-container">
                <div class="coverstory-header" style="background-image: url('${profileImageUrl}');">
                    <div class="coverstory-header-actions">
                        <a href="index.html" class="coverstory-join-btn">
                            <i class="fas fa-user-plus"></i> Join BINK
                        </a>
                        <button class="coverstory-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>

                    <div class="coverstory-profile-info">
                        <div class="coverstory-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="coverstory-bio">${data.bio || ''}</div>
                    </div>
                </div>

                <div class="coverstory-content">
                    <div class="coverstory-links">
                        ${(data.links || []).map(link => `
                            <div class="coverstory-link-container">
                                <a class="coverstory-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    <span>${link.title}</span>
                                </a>
                                <button class="coverstory-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <div class="coverstory-socials">
                        ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                    </div>

                    <div class="coverstory-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Aurora Glow Template (Premium)
window.BINK.templates.templates['auroraglow'] = {
    id: 'auroraglow',
    name: 'Aurora Glow',
    description: 'Dynamic aurora background with glowing elements and mesmerizing animations.',
    css: 'templates/auroraglow.css',
    isPremium: true,
    tokenPrice: 200,
    category: 'creator',
    render: function(data) {
        return `
        <div class="auroraglow-bio-bg">
            <div class="auroraglow-container">
                <div class="auroraglow-header-actions">
                    <a href="index.html" class="auroraglow-join-btn">
                        <i class="fas fa-user-plus"></i> Join BINK
                    </a>
                    <button class="auroraglow-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                <div class="auroraglow-profile">
                    ${getAvatarHTML(data, 'auroraglow-avatar', 'auroraglow-avatar-container', '#0a0a0f', '3px solid #7877c6', '0 0 30px #7877c6')}
                    <div class="auroraglow-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="auroraglow-bio">${data.bio || ''}</div>
                </div>
                <div class="auroraglow-links">
                    ${(data.links || []).map(link => `
                        <div class="auroraglow-link-container">
                            <a class="auroraglow-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                            </a>
                            <button class="auroraglow-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}
                <div class="auroraglow-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>
                <div class="auroraglow-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Hero Banner Template (Premium)
window.BINK.templates.templates['herobanner'] = {
    id: 'herobanner',
    name: 'Hero Banner',
    description: 'Clean hero banner with profile picture as background and content below.',
    css: 'templates/herobanner.css',
    isPremium: true,
    tokenPrice: 160,
    category: 'business',
    render: function(data) {
        return `
        <div class="herobanner-bio-bg">
            <div class="herobanner-container">
                <div class="herobanner-header" style="background-image: url('${data.profilePicUrl || 'https://adeledevgit.github.io/bink/profile.png'}');">
                    <div class="herobanner-header-actions">
                        <a href="index.html" class="herobanner-join-btn">
                            <i class="fas fa-user-plus"></i> Join BINK
                        </a>
                        <button class="herobanner-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="herobanner-content">
                    <div class="herobanner-profile">
                        <div class="herobanner-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="herobanner-bio">${data.bio || ''}</div>
                    </div>

                    <div class="herobanner-links">
                        ${(data.links || []).map(link => `
                            <div class="herobanner-link-container">
                                <a class="herobanner-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                    <span>${link.title}</span>
                                </a>
                                <button class="herobanner-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <div class="herobanner-socials">
                        ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                    </div>

                    <div class="herobanner-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};

// Cyberpunk Template (Premium)
window.BINK.templates.templates['cyberpunk'] = {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic neon-lit cyberpunk aesthetic with matrix effects.',
    css: 'templates/cyberpunk.css',
    isPremium: true,
    tokenPrice: 200,
    category: 'creator',
    render: function(data) {
        return `
        <div class="cyberpunk-bio-bg">
            <div class="cyberpunk-container">
                <div class="cyberpunk-header-actions">
                    <a href="index.html" class="cyberpunk-join-btn">
                        <i class="fas fa-user-plus"></i> JOIN BINK
                    </a>
                    <button class="cyberpunk-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="cyberpunk-profile">
                    <div class="cyberpunk-avatar-container">
                        ${getAvatarHTML(data, 'cyberpunk-avatar', 'cyberpunk-avatar-container', '#0a0a0a', '3px solid #00ffff', '0 0 20px #00ffff')}
                        <div class="cyberpunk-avatar-glow"></div>
                    </div>
                    <div class="cyberpunk-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="cyberpunk-title">CYBER SPECIALIST</div>
                    <div class="cyberpunk-bio">${data.bio || 'Digital guardian navigating the neon-lit corridors of cyberspace'}</div>
                </div>

                <div class="cyberpunk-links">
                    ${(data.links || []).map(link => `
                        <div class="cyberpunk-link-container">
                            <a class="cyberpunk-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                                <div class="cyberpunk-link-glow"></div>
                            </a>
                            <button class="cyberpunk-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="cyberpunk-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>

                <div class="cyberpunk-footer">
                    <span class="cyberpunk-glitch">POWERED BY</span> <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Ocean Waves Template (Premium)
window.BINK.templates.templates['oceanwaves'] = {
    id: 'oceanwaves',
    name: 'Ocean Waves',
    description: 'Serene ocean-inspired design with flowing wave animations.',
    css: 'templates/oceanwaves.css',
    isPremium: true,
    tokenPrice: 180,
    category: 'artist',
    render: function(data) {
        return `
        <div class="oceanwaves-bio-bg">
            <div class="oceanwaves-waves">
                <div class="wave wave1"></div>
                <div class="wave wave2"></div>
                <div class="wave wave3"></div>
            </div>

            <div class="oceanwaves-container">
                <div class="oceanwaves-header-actions">
                    <a href="index.html" class="oceanwaves-join-btn">
                        <i class="fas fa-user-plus"></i> Join BINK
                    </a>
                    <button class="oceanwaves-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="oceanwaves-profile">
                    <div class="oceanwaves-avatar-container">
                        ${getAvatarHTML(data, 'oceanwaves-avatar', 'oceanwaves-avatar-container', 'rgba(255,255,255,0.1)', '4px solid rgba(255,255,255,0.8)', '0 10px 30px rgba(0,0,0,0.2)')}
                        <div class="oceanwaves-avatar-ripple"></div>
                    </div>
                    <div class="oceanwaves-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="oceanwaves-title">Ocean Explorer</div>
                    <div class="oceanwaves-bio">${data.bio || 'Capturing the endless beauty of ocean waves and marine life'}</div>
                </div>

                <div class="oceanwaves-links">
                    ${(data.links || []).map(link => `
                        <div class="oceanwaves-link-container">
                            <a class="oceanwaves-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                                <div class="oceanwaves-link-wave"></div>
                            </a>
                            <button class="oceanwaves-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="oceanwaves-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>

                <div class="oceanwaves-footer">
                    <span class="oceanwaves-flowing-text">Powered by</span> <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Vintage Polaroid Template (Premium)
window.BINK.templates.templates['vintagepolaroid'] = {
    id: 'vintagepolaroid',
    name: 'Vintage Polaroid',
    description: 'Nostalgic film photography aesthetic with polaroid frames.',
    css: 'templates/vintagepolaroid.css',
    isPremium: true,
    tokenPrice: 160,
    category: 'artist',
    render: function(data) {
        return `
        <div class="vintagepolaroid-bio-bg">
            <div class="vintagepolaroid-container">
                <div class="vintagepolaroid-header-actions">
                    <a href="index.html" class="vintagepolaroid-join-btn">
                        <i class="fas fa-user-plus"></i> Join BINK
                    </a>
                    <button class="vintagepolaroid-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="vintagepolaroid-polaroid-frame">
                    <div class="vintagepolaroid-photo">
                        <img class="vintagepolaroid-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                    </div>
                    <div class="vintagepolaroid-caption">
                        <div class="vintagepolaroid-handwriting">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                        <div class="vintagepolaroid-date">Est. 2024</div>
                    </div>
                </div>

                <div class="vintagepolaroid-profile">
                    <div class="vintagepolaroid-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="vintagepolaroid-title">Vintage Photographer & Collector</div>
                    <div class="vintagepolaroid-bio">${data.bio || 'Capturing life\'s beautiful moments through the lens of nostalgia'}</div>
                </div>

                <div class="vintagepolaroid-links">
                    ${(data.links || []).map(link => `
                        <div class="vintagepolaroid-link-container">
                            <a class="vintagepolaroid-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                                <div class="vintagepolaroid-tape"></div>
                            </a>
                            <button class="vintagepolaroid-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="vintagepolaroid-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>

                <div class="vintagepolaroid-footer">
                    <span class="vintagepolaroid-typewriter">Powered by</span> <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Neon Gaming Template (Premium)
window.BINK.templates.templates['neongaming'] = {
    id: 'neongaming',
    name: 'Neon Gaming',
    description: 'High-tech gaming aesthetic with RGB lighting and stats.',
    css: 'templates/neongaming.css',
    isPremium: true,
    tokenPrice: 220,
    category: 'creator',
    render: function(data) {
        return `
        <div class="neongaming-bio-bg">
            <div class="neongaming-grid-overlay"></div>
            <div class="neongaming-particles">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
            </div>

            <div class="neongaming-container">
                <div class="neongaming-header-actions">
                    <a href="index.html" class="neongaming-join-btn">
                        <i class="fas fa-user-plus"></i> JOIN GAME
                    </a>
                    <button class="neongaming-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="neongaming-profile">
                    <div class="neongaming-avatar-container">
                        <div class="neongaming-avatar-frame">
                            ${getAvatarHTML(data, 'neongaming-avatar', 'neongaming-avatar-frame', '#0d0d0d', 'none', 'none')}
                            <div class="neongaming-avatar-border"></div>
                        </div>
                        <div class="neongaming-level-badge">LVL 99</div>
                    </div>
                    <div class="neongaming-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="neongaming-title">PRO GAMER</div>
                    <div class="neongaming-stats">
                        <div class="stat">
                            <span class="stat-value">2.5K</span>
                            <span class="stat-label">WINS</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">98%</span>
                            <span class="stat-label">WIN RATE</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">1.2M</span>
                            <span class="stat-label">SCORE</span>
                        </div>
                    </div>
                    <div class="neongaming-bio">${data.bio || 'Elite gamer conquering virtual worlds and breaking records'}</div>
                </div>

                <div class="neongaming-links">
                    ${(data.links || []).map(link => `
                        <div class="neongaming-link-container">
                            <a class="neongaming-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                                <div class="neongaming-link-glow"></div>
                            </a>
                            <button class="neongaming-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="neongaming-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>

                <div class="neongaming-footer">
                    <span class="neongaming-glitch-text">POWERED BY</span> <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Storefront Template (Premium Only) - E-commerce focused layout
window.BINK.templates.templates['storefront'] = {
    id: 'storefront',
    name: 'Storefront',
    description: 'E-commerce focused template with product showcase and minimal bio.',
    css: 'templates/storefront.css',
    isPremium: true,
    premiumOnly: true,
    category: 'seller',
    render: function(data) {
        return `
        <div class="storefront-bio-bg">
            <div class="storefront-container">
                <!-- Header with BINK branding -->
                <div class="storefront-header">
                    <div class="storefront-header-actions">
                        <div class="storefront-join-link">
                            <a href="index.html" class="storefront-join-btn">
                                <i class="fas fa-user-plus"></i> Join BINK
                            </a>
                        </div>
                        <div class="storefront-share">
                            <button class="storefront-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Compact profile section -->
                    <div class="storefront-profile-bar">
                        <div class="storefront-avatar-container">
                            <img src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'}" alt="Profile" class="storefront-avatar">
                        </div>
                        <div class="storefront-profile-info">
                            <h1 class="storefront-username">${data.displayName || data.username}</h1>
                            <p class="storefront-bio">${data.bio || 'Welcome to my store!'}</p>
                        </div>
                        <div class="storefront-store-badge">
                            <i class="fas fa-store"></i>
                            <span>Store</span>
                        </div>
                    </div>
                </div>

                <!-- Main content area - Products first -->
                <div class="storefront-main">
                    <!-- Featured Products Section -->
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}

                    <!-- Links section (compact) -->
                    ${data.links && data.links.length > 0 ? `
                    <div class="storefront-links-section">
                        <h3 class="storefront-section-title">
                            <i class="fas fa-link"></i> Quick Links
                        </h3>
                        <div class="storefront-links-grid">
                            ${data.links.map(link => `
                                <div class="storefront-link-container">
                                    <a class="storefront-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                        <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                        <span>${link.title}</span>
                                    </a>
                                    <button class="storefront-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                        <i class="fas fa-share-alt"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Media section (if any) -->
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <!-- Social links -->
                    ${Object.keys(data.socialLinks || {}).length > 0 ? `
                    <div class="storefront-socials">
                        <h4>Follow Us</h4>
                        <div class="storefront-social-icons">
                            ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                                <a href="${url}" target="_blank" class="storefront-social-icon">
                                    <i class="${window.BINK.templates.getPlatformIcon(platform)}"></i>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="storefront-footer">
                    <p>Powered by <a href="index.html" target="_blank">BINK</a> • Create your own store</p>
                </div>
            </div>
        </div>
        `;
    }
};

// Marketplace Template (Premium Only) - Colorful marketplace-style storefront
window.BINK.templates.templates['marketplace'] = {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Vibrant marketplace-style template with colorful product displays.',
    css: 'templates/marketplace.css',
    isPremium: true,
    premiumOnly: true,
    category: 'seller',
    render: function(data) {
        return `
        <div class="marketplace-bio-bg">
            <div class="marketplace-container">
                <!-- Header with BINK branding -->
                <div class="marketplace-header">
                    <div class="marketplace-header-actions">
                        <div class="marketplace-join-link">
                            <a href="index.html" class="marketplace-join-btn">
                                <i class="fas fa-user-plus"></i> Join BINK
                            </a>
                        </div>
                        <div class="marketplace-share">
                            <button class="marketplace-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Profile banner -->
                    <div class="marketplace-profile-banner">
                        <div class="marketplace-avatar-container">
                            <img src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}" alt="Profile" class="marketplace-avatar">
                            <div class="marketplace-verified-badge">
                                <i class="fas fa-check"></i>
                            </div>
                        </div>
                        <div class="marketplace-profile-info">
                            <h1 class="marketplace-username">${data.displayName || data.username}</h1>
                            <p class="marketplace-bio">${data.bio || 'Welcome to my marketplace!'}</p>
                            <div class="marketplace-stats">
                                <div class="marketplace-stat">
                                    <span class="marketplace-stat-number">${(data.catalog && data.catalog.length) || '6'}</span>
                                    <span class="marketplace-stat-label">Products</span>
                                </div>
                                <div class="marketplace-stat">
                                    <span class="marketplace-stat-number">4.9</span>
                                    <span class="marketplace-stat-label">Rating</span>
                                </div>
                                <div class="marketplace-stat">
                                    <span class="marketplace-stat-number">150+</span>
                                    <span class="marketplace-stat-label">Sales</span>
                                </div>
                            </div>
                        </div>
                        <div class="marketplace-shop-badge">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Marketplace</span>
                        </div>
                    </div>
                </div>

                <!-- Main content area -->
                <div class="marketplace-main">
                    <!-- Products Section -->
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}

                    <!-- Links section -->
                    ${data.links && data.links.length > 0 ? `
                    <div class="marketplace-links-section">
                        <h3 class="marketplace-section-title">
                            <i class="fas fa-external-link-alt"></i> External Links
                        </h3>
                        <div class="marketplace-links-grid">
                            ${data.links.map(link => `
                                <div class="marketplace-link-container">
                                    <a class="marketplace-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                        <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                        <span>${link.title}</span>
                                        <i class="fas fa-arrow-right marketplace-link-arrow"></i>
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Media section -->
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <!-- Social links -->
                    ${Object.keys(data.socialLinks || {}).length > 0 ? `
                    <div class="marketplace-socials">
                        <h4>Connect With Us</h4>
                        <div class="marketplace-social-icons">
                            ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                                <a href="${url}" target="_blank" class="marketplace-social-icon">
                                    <i class="${window.BINK.templates.getPlatformIcon(platform)}"></i>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="marketplace-footer">
                    <p>Powered by <a href="index.html" target="_blank">BINK</a> • Start your marketplace today</p>
                </div>
            </div>
        </div>
        `;
    }
};

// Boutique Template (Premium Only) - Luxury boutique-style storefront
window.BINK.templates.templates['boutique'] = {
    id: 'boutique',
    name: 'Boutique',
    description: 'Elegant luxury boutique template with sophisticated design.',
    css: 'templates/boutique.css',
    isPremium: true,
    premiumOnly: true,
    category: 'seller',
    render: function(data) {
        return `
        <div class="boutique-bio-bg">
            <div class="boutique-container">
                <!-- Header with BINK branding -->
                <div class="boutique-header">
                    <div class="boutique-header-actions">
                        <div class="boutique-join-link">
                            <a href="index.html" class="boutique-join-btn">
                                <i class="fas fa-user-plus"></i> Join BINK
                            </a>
                        </div>
                        <div class="boutique-share">
                            <button class="boutique-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Elegant profile section -->
                    <div class="boutique-profile-section">
                        <div class="boutique-profile-content">
                            <div class="boutique-avatar-container">
                                <img src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face'}" alt="Profile" class="boutique-avatar">
                            </div>
                            <div class="boutique-profile-text">
                                <h1 class="boutique-username">${data.displayName || data.username}</h1>
                                <p class="boutique-bio">${data.bio || 'Curated luxury collections'}</p>
                                <div class="boutique-luxury-badge">
                                    <i class="fas fa-gem"></i>
                                    <span>Luxury Boutique</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main content area -->
                <div class="boutique-main">
                    <!-- Collections Section -->
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}

                    <!-- Links section -->
                    ${data.links && data.links.length > 0 ? `
                    <div class="boutique-links-section">
                        <h3 class="boutique-section-title">Exclusive Access</h3>
                        <div class="boutique-links-grid">
                            ${data.links.map(link => `
                                <div class="boutique-link-container">
                                    <a class="boutique-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                        <div class="boutique-link-icon">
                                            <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                        </div>
                                        <div class="boutique-link-content">
                                            <span class="boutique-link-title">${link.title}</span>
                                            <span class="boutique-link-subtitle">Exclusive access</span>
                                        </div>
                                        <i class="fas fa-chevron-right boutique-link-arrow"></i>
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Media section -->
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <!-- Social links -->
                    ${Object.keys(data.socialLinks || {}).length > 0 ? `
                    <div class="boutique-socials">
                        <h4>Follow Our Journey</h4>
                        <div class="boutique-social-icons">
                            ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                                <a href="${url}" target="_blank" class="boutique-social-icon">
                                    <i class="${window.BINK.templates.getPlatformIcon(platform)}"></i>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="boutique-footer">
                    <p>Powered by <a href="index.html" target="_blank">BINK</a> • Elevate your brand</p>
                </div>
            </div>
        </div>
        `;
    }
};

// Digital Store Template (Premium Only) - Digital products storefront layout
window.BINK.templates.templates['digitalstore'] = {
    id: 'digitalstore',
    name: 'Digital Store',
    description: 'Modern storefront template for selling digital products, courses, and downloads.',
    css: 'templates/digitalstore.css',
    isPremium: true,
    premiumOnly: true,
    category: 'seller',
    render: function(data) {
        return `
        <div class="digitalstore-bio-bg">
            <div class="digitalstore-container">
                <!-- Header with BINK branding -->
                <div class="digitalstore-header">
                    <div class="digitalstore-header-actions">
                        <div class="digitalstore-join-link">
                            <a href="index.html" class="digitalstore-join-btn">
                                <i class="fas fa-user-plus"></i> Join BINK
                            </a>
                        </div>
                        <div class="digitalstore-share">
                            <button class="digitalstore-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Store banner -->
                    <div class="digitalstore-banner">
                        <div class="digitalstore-banner-content">
                            <div class="digitalstore-profile-section">
                                <div class="digitalstore-avatar-container">
                                    <img src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'}" alt="Store Owner" class="digitalstore-avatar">
                                    <div class="digitalstore-verified-badge">
                                        <i class="fas fa-check"></i>
                                    </div>
                                </div>
                                <div class="digitalstore-profile-info">
                                    <h1 class="digitalstore-store-name">${data.displayName || data.username}</h1>
                                    <p class="digitalstore-store-tagline">${data.bio || 'Premium digital products & downloads'}</p>
                                </div>
                            </div>
                            <div class="digitalstore-badges">
                                <div class="digitalstore-badge digitalstore-badge-digital">
                                    <i class="fas fa-download"></i>
                                    <span>Digital Store</span>
                                </div>
                                <div class="digitalstore-badge digitalstore-badge-instant">
                                    <i class="fas fa-bolt"></i>
                                    <span>Instant Download</span>
                                </div>
                            </div>
                        </div>
                        <div class="digitalstore-store-stats">
                            <div class="digitalstore-stat">
                                <span class="digitalstore-stat-number">${(data.catalog && data.catalog.length) || '12'}</span>
                                <span class="digitalstore-stat-label">Products</span>
                            </div>
                            <div class="digitalstore-stat">
                                <span class="digitalstore-stat-number">5K+</span>
                                <span class="digitalstore-stat-label">Downloads</span>
                            </div>
                            <div class="digitalstore-stat">
                                <span class="digitalstore-stat-number">4.9★</span>
                                <span class="digitalstore-stat-label">Rating</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main content area -->
                <div class="digitalstore-main">
                    <!-- Digital Products Section -->
                    ${window.BINK.templates.renderCatalogContent(data.catalog || [])}

                    <!-- Links section (External Stores) -->
                    ${data.links && data.links.length > 0 ? `
                    <div class="digitalstore-links-section">
                        <h3 class="digitalstore-section-title">
                            <i class="fas fa-external-link-alt"></i> More Stores & Platforms
                        </h3>
                        <div class="digitalstore-links-grid">
                            ${data.links.map(link => `
                                <div class="digitalstore-link-card">
                                    <a class="digitalstore-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                        <div class="digitalstore-link-icon">
                                            <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                        </div>
                                        <div class="digitalstore-link-content">
                                            <h4 class="digitalstore-link-title">${link.title}</h4>
                                            <p class="digitalstore-link-description">Shop on external platform</p>
                                        </div>
                                        <div class="digitalstore-link-arrow">
                                            <i class="fas fa-arrow-right"></i>
                                        </div>
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Media section (Product previews) -->
                    ${window.BINK.templates.renderMediaContent(data.media || {})}

                    <!-- Social links -->
                    ${Object.keys(data.socialLinks || {}).length > 0 ? `
                    <div class="digitalstore-social-section">
                        <h4>Follow for Updates</h4>
                        <div class="digitalstore-social-icons">
                            ${Object.entries(data.socialLinks || {}).map(([platform, url]) => `
                                <a href="${url}" target="_blank" class="digitalstore-social-icon">
                                    <i class="${window.BINK.templates.getPlatformIcon(platform)}"></i>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="digitalstore-footer">
                    <p>Powered by <a href="index.html" target="_blank">BINK</a> • Start your digital store</p>
                </div>
            </div>
        </div>
        `;
    }
};

// Zen Minimal Template (Premium)
window.BINK.templates.templates['zenminimal'] = {
    id: 'zenminimal',
    name: 'Zen Minimal',
    description: 'Clean, peaceful, and purposeful minimalist design.',
    css: 'templates/zenminimal.css',
    isPremium: true,
    tokenPrice: 140,
    category: 'business',
    render: function(data) {
        return `
        <div class="zenminimal-bio-bg">
            <div class="zenminimal-container">
                <div class="zenminimal-header-actions">
                    <a href="index.html" class="zenminimal-join-btn">
                        <i class="fas fa-user-plus"></i> Join BINK
                    </a>
                    <button class="zenminimal-share-btn" onclick="window.BINK.templates.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>

                <div class="zenminimal-profile">
                    <div class="zenminimal-avatar-container">
                        ${getAvatarHTML(data, 'zenminimal-avatar', 'zenminimal-avatar-container', '#f8fafc', '4px solid white', '0 8px 32px rgba(0,0,0,0.12)')}
                        <div class="zenminimal-avatar-ring"></div>
                    </div>
                    <div class="zenminimal-username">${window.BINK.templates.formatUsername(data.displayName || data.username)}</div>
                    <div class="zenminimal-title">Mindful Designer</div>
                    <div class="zenminimal-bio">${data.bio || 'Creating beautiful, purposeful designs with intention and simplicity'}</div>
                </div>

                <div class="zenminimal-links">
                    ${(data.links || []).map(link => `
                        <div class="zenminimal-link-container">
                            <a class="zenminimal-link" href="${link.url}" onclick="window.BINK.templates.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BINK.templates.getPlatformIcon(link.platform)}"></i>
                                <span>${link.title}</span>
                            </a>
                            <button class="zenminimal-link-share-btn" onclick="window.BINK.templates.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${window.BINK.templates.renderCatalogContent(data.catalog || [])}
                ${window.BINK.templates.renderMediaContent(data.media || {})}

                <div class="zenminimal-socials">
                    ${window.BINK.templates.renderSocialLinks(data.socialLinks)}
                </div>

                <div class="zenminimal-footer">
                    <span>Powered by</span> <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
    }
};

// Category helper functions
window.BINK.templates.getTemplatesByCategory = function(category) {
    if (category === 'all') {
        return Object.values(this.templates);
    }
    return Object.values(this.templates).filter(template => template.category === category);
};

window.BINK.templates.getCategoryInfo = function(category) {
    return this.categories[category] || this.categories['all'];
};

window.BINK.templates.getAllCategories = function() {
    return Object.keys(this.categories);
};