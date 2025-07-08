/* Black Landing Template - Standalone JavaScript */

// Initialize the black landing template namespace
window.BlackLanding = window.BlackLanding || {};

// Platform icon mapping for black landing template
window.BlackLanding.getPlatformIcon = function(platform) {
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

// Music platform icon mapping
window.BlackLanding.getMusicPlatformIcon = function(platform) {
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

// Platform display name mapping
window.BlackLanding.getPlatformDisplayName = function(platform) {
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

// Format username (remove @ if present)
window.BlackLanding.formatUsername = function(username) {
    if (!username) return '';
    return username.startsWith('@') ? username.substring(1) : username;
};

// Share profile function
window.BlackLanding.shareProfile = function(e, username) {
    e.preventDefault();
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

// Share link function
window.BlackLanding.shareLink = function(e, url, title) {
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
window.BlackLanding.trackLinkClick = function(e, linkId) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('u');

        if (!username || !linkId) return;

        // Find the user by username
        if (typeof db !== 'undefined') {
            db.collection('users').where('username', '==', username).get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) return;

                    const userDoc = querySnapshot.docs[0];
                    const userId = userDoc.id;

                    const userLinkRef = db.collection('users').doc(userId).collection('links').doc(linkId);
                    return userLinkRef.get().then(doc => {
                        if (doc.exists) {
                            return userLinkRef.update({
                                clicks: firebase.firestore.FieldValue.increment(1),
                                lastClickedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        } else {
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
        }
    } catch (error) {
        console.error('Error tracking link click:', error);
    }
};

// YouTube video ID extraction
window.BlackLanding.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Open image modal (placeholder function)
window.BlackLanding.openImageModal = function(imageUrl, title) {
    // Simple implementation - open in new tab
    window.open(imageUrl, '_blank');
};

// Play music preview (placeholder function)
window.BlackLanding.playMusicPreview = function(platform, url, title) {
    // Simple implementation - open music link
    window.open(url, '_blank');
};

// Play YouTube video
window.BlackLanding.playYouTubeVideo = function(url, title) {
    // Open YouTube video in new tab
    window.open(url, '_blank');
};

// Get YouTube thumbnail URL
window.BlackLanding.getYouTubeThumbnail = function(url) {
    const videoId = window.BlackLanding.getYouTubeVideoId(url);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop'; // Fallback image
};

// Render catalog content
window.BlackLanding.renderCatalogContent = function(catalog) {
    if (!catalog || !Array.isArray(catalog) || catalog.length === 0) return '';

    return `
    <div class="blacklanding-catalog-section">
        <h3 class="blacklanding-catalog-title">Products</h3>
        <div class="blacklanding-catalog-grid">
            ${catalog.map(product => `
                <div class="blacklanding-catalog-item">
                    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" class="blacklanding-catalog-item-image">` : ''}
                    <div class="blacklanding-catalog-item-content">
                        <h4 class="blacklanding-catalog-item-title">${product.title}</h4>
                        ${product.description ? `<p class="blacklanding-catalog-item-description">${product.description}</p>` : ''}
                        ${product.price ? `<div class="blacklanding-catalog-item-price">${product.price}</div>` : ''}
                        <a href="${product.buyLink}" target="_blank" class="blacklanding-catalog-buy-btn">
                            <i class="fas fa-shopping-cart"></i> Buy Now
                        </a>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
};

// Render media content
window.BlackLanding.renderMediaContent = function(media) {
    if (!media || typeof media !== 'object') return '';

    const hasAnyMedia = (media.youtube && media.youtube.length > 0) ||
                       (media.images && media.images.length > 0) ||
                       (media.music && media.music.length > 0);

    if (!hasAnyMedia) {
        return '';
    }

    let mediaHTML = '';

    // YouTube Videos - Dark Theme
    if (media.youtube && media.youtube.length > 0) {
        mediaHTML += `
            <div class="blacklanding-media-section">
                <h3 class="blacklanding-media-section-title">
                    <i class="fab fa-youtube"></i> Videos
                </h3>
                <div class="blacklanding-media-grid blacklanding-youtube-grid">
                    ${media.youtube.map(video => `
                        <div class="blacklanding-youtube-item" onclick="window.BlackLanding.playYouTubeVideo('${video.url}', '${video.title}')">
                            <div class="blacklanding-youtube-thumbnail-container">
                                <img src="${video.thumbnail || window.BlackLanding.getYouTubeThumbnail(video.url)}" alt="${video.title}" class="blacklanding-youtube-thumbnail">
                                <div class="blacklanding-youtube-play-overlay"></div>
                            </div>
                            <div class="blacklanding-youtube-content-container">
                                <h4 class="blacklanding-youtube-title">${video.title}</h4>
                                ${video.description ? `<p class="blacklanding-youtube-description">${video.description}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Images - Dark Theme
    if (media.images && media.images.length > 0) {
        mediaHTML += `
            <div class="blacklanding-media-section">
                <h3 class="blacklanding-media-section-title">
                    <i class="fas fa-images"></i> Gallery
                </h3>
                <div class="blacklanding-media-grid blacklanding-images-grid">
                    ${media.images.map(image => `
                        <div class="blacklanding-image-item">
                            <div class="blacklanding-image-container">
                                <img src="${image.url}" alt="${image.title}" loading="lazy" onclick="window.BlackLanding.openImageModal('${image.url}', '${image.title}')">
                            </div>
                            <div class="blacklanding-media-info">
                                <h4 class="blacklanding-media-title">${image.title}</h4>
                                ${image.description ? `<p class="blacklanding-media-description">${image.description}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Music - Dark Theme
    if (media.music && media.music.length > 0) {
        mediaHTML += `
            <div class="blacklanding-media-section">
                <h3 class="blacklanding-media-section-title">
                    <i class="fas fa-music"></i> Music
                </h3>
                <div class="blacklanding-media-grid blacklanding-music-grid">
                    ${media.music.map(music => `
                        <div class="blacklanding-music-item">
                            <div class="blacklanding-music-player" onclick="window.BlackLanding.playMusicPreview('${music.platform}', '${music.url}', '${music.title}')">
                                <div class="blacklanding-music-platform-icon ${music.platform}">
                                    <i class="${window.BlackLanding.getMusicPlatformIcon(music.platform)}"></i>
                                </div>
                                <div class="blacklanding-music-info">
                                    <h4 class="blacklanding-music-title">${music.title}</h4>
                                    ${music.artist ? `<p class="blacklanding-music-artist">by ${music.artist}</p>` : ''}
                                    <p class="blacklanding-music-platform">${window.BlackLanding.getPlatformDisplayName(music.platform)}</p>
                                </div>
                                <div class="blacklanding-play-button">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return mediaHTML || '';
};

// Main render function for black landing template
window.BlackLanding.render = function(data) {
    return `
        <div class="blacklanding-bio-bg">
            <div class="blacklanding-header-actions">
                <div class="blacklanding-join-link">
                    <a href="index.html" class="blacklanding-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                </div>
                <div class="blacklanding-share">
                    <button class="blacklanding-share-btn" onclick="window.BlackLanding.shareProfile(event, '${data.username}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
            <div class="blacklanding-banner">
                <div class="blacklanding-profile-row-inline">
                    <div class="blacklanding-profile-pic-username">
                        <img class="blacklanding-profile-pic" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        <div class="blacklanding-username-inline">${window.BlackLanding.formatUsername(data.displayName || data.username)}</div>
                    </div>
                </div>
            </div>
            <div class="blacklanding-main">
                <div class="blacklanding-about-section">
                    <div class="blacklanding-section-title">ABOUT ${(data.displayName || data.username) ? window.BlackLanding.formatUsername(data.displayName || data.username) : ''}</div>
                    <div class="blacklanding-bio">${data.bio || ''}</div>
                </div>
                <div class="blacklanding-section-title" style="margin-top:32px;">VISIT OUR PAGES</div>
                <div class="blacklanding-links-list">
                    ${(data.links || []).map(link => `
                        <div class="blacklanding-link-row">
                            <a class="blacklanding-link-title" href="${link.url}" onclick="window.BlackLanding.trackLinkClick(event, '${link.id}')" target="_blank">
                                <i class="${window.BlackLanding.getPlatformIcon(link.platform)}"></i>
                                ${link.title}
                            </a>
                            <button class="blacklanding-link-share-btn" onclick="window.BlackLanding.shareLink(event, '${link.url}', '${link.title}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${window.BlackLanding.renderCatalogContent(data.catalog || [])}
                ${window.BlackLanding.renderMediaContent(data.media || {})}
                <div class="blacklanding-footer">
                    Powered by <a href="index.html" target="_blank">BINK</a>
                </div>
            </div>
        </div>
        `;
};
