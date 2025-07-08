/* Landing Profile Template - Standalone JavaScript */

// Initialize the landing profile template namespace
window.LandingProfile = window.LandingProfile || {};

// Platform icon mapping for landing profile template
window.LandingProfile.getPlatformIcon = function(platform) {
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
window.LandingProfile.getMusicPlatformIcon = function(platform) {
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
window.LandingProfile.getPlatformDisplayName = function(platform) {
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
window.LandingProfile.formatUsername = function(username) {
    if (!username) return '';
    return username.startsWith('@') ? username.substring(1) : username;
};

// Share profile function
window.LandingProfile.shareProfile = function(e, username) {
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
window.LandingProfile.shareLink = function(e, url, title) {
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
window.LandingProfile.trackLinkClick = function(e, linkId) {
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
window.LandingProfile.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Open image modal (placeholder function)
window.LandingProfile.openImageModal = function(imageUrl, title) {
    // Simple implementation - open in new tab
    window.open(imageUrl, '_blank');
};

// Play music preview (placeholder function)
window.LandingProfile.playMusicPreview = function(platform, url, title) {
    // Simple implementation - open music link
    window.open(url, '_blank');
};

// Play YouTube video
window.LandingProfile.playYouTubeVideo = function(url, title) {
    // Open YouTube video in new tab
    window.open(url, '_blank');
};

// Get YouTube thumbnail URL
window.LandingProfile.getYouTubeThumbnail = function(url) {
    const videoId = window.LandingProfile.getYouTubeVideoId(url);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop'; // Fallback image
};

// Render catalog content
window.LandingProfile.renderCatalogContent = function(catalog) {
    if (!catalog || !Array.isArray(catalog) || catalog.length === 0) return '';

    return `
    <div class="catalog-section">
        <h3 class="catalog-title">Products</h3>
        <div class="catalog-grid">
            ${catalog.map(product => `
                <div class="catalog-item">
                    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" class="catalog-item-image">` : ''}
                    <div class="catalog-item-content">
                        <h4 class="catalog-item-title">${product.title}</h4>
                        ${product.description ? `<p class="catalog-item-description">${product.description}</p>` : ''}
                        ${product.price ? `<div class="catalog-item-price">${product.price}</div>` : ''}
                        <a href="${product.buyLink}" target="_blank" class="catalog-buy-btn">
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
window.LandingProfile.renderMediaContent = function(media) {
    if (!media || typeof media !== 'object') return '';

    const hasAnyMedia = (media.youtube && media.youtube.length > 0) ||
                       (media.images && media.images.length > 0) ||
                       (media.music && media.music.length > 0);

    if (!hasAnyMedia) {
        return '';
    }

    let mediaHTML = '';

    // YouTube Videos - Local Design
    if (media.youtube && media.youtube.length > 0) {
        mediaHTML += `
            <div class="media-section">
                <h3 class="media-section-title">
                    <i class="fab fa-youtube"></i> Videos
                </h3>
                <div class="media-grid youtube-grid">
                    ${media.youtube.map(video => `
                        <div class="youtube-item" onclick="window.LandingProfile.playYouTubeVideo('${video.url}', '${video.title}')">
                            <div class="youtube-thumbnail-container">
                                <img src="${video.thumbnail || window.LandingProfile.getYouTubeThumbnail(video.url)}" alt="${video.title}" class="youtube-thumbnail">
                                <div class="youtube-play-overlay"></div>
                            </div>
                            <div class="youtube-content-container">
                                <h4 class="youtube-title">${video.title}</h4>
                                ${video.description ? `<p class="youtube-description">${video.description}</p>` : ''}
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
                                <img src="${image.url}" alt="${image.title}" loading="lazy" onclick="window.LandingProfile.openImageModal('${image.url}', '${image.title}')">
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
                            <div class="music-player" onclick="window.LandingProfile.playMusicPreview('${music.platform}', '${music.url}', '${music.title}')">
                                <div class="music-platform-icon ${music.platform}">
                                    <i class="${window.LandingProfile.getMusicPlatformIcon(music.platform)}"></i>
                                </div>
                                <div class="music-info">
                                    <h4 class="music-title">${music.title}</h4>
                                    ${music.artist ? `<p class="music-artist">by ${music.artist}</p>` : ''}
                                    <p class="music-platform">${window.LandingProfile.getPlatformDisplayName(music.platform)}</p>
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

    return mediaHTML || '';
};

// Main render function for landing profile template
window.LandingProfile.render = function(data) {
    return `
<div class="landing-bio-bg">
    <div class="landing-header-actions">
        <div class="landing-join-link">
            <a href="index.html" class="landing-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
        </div>
        <div class="landing-share">
            <button class="landing-share-btn" onclick="window.LandingProfile.shareProfile(event, '${data.username}')">
                <i class="fas fa-share-alt"></i>
            </button>
        </div>
    </div>
    <div class="landing-banner">
        <div class="landing-profile-row">
            <div class="landing-profile-pic-username">
                <img class="landing-profile-pic" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                <div class="landing-username-inline">${window.LandingProfile.formatUsername(data.displayName || data.username)}</div>
            </div>
        </div>
    </div>
    <div class="landing-main">
        <div class="landing-section-title">ABOUT ${window.LandingProfile.formatUsername(data.displayName || data.username)}</div>
        <div class="landing-bio">${data.bio || ''}</div>
        <div class="landing-section-title" style="margin-top:32px;">VISIT OUR PAGES</div>
        <div class="landing-links-list">
            ${(data.links || []).map(link => `
                <div class="landing-link-row">
                    <a class="landing-link-title" href="${link.url}" onclick="window.LandingProfile.trackLinkClick(event, '${link.id}')" target="_blank">
                        <i class="${window.LandingProfile.getPlatformIcon(link.platform)}"></i>
                        ${link.title}
                    </a>
                    <button class="landing-link-share-btn" onclick="window.LandingProfile.shareLink(event, '${link.url}', '${link.title}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            `).join('')}
        </div>
        ${window.LandingProfile.renderCatalogContent(data.catalog || [])}
        ${window.LandingProfile.renderMediaContent(data.media || {})}
        <div class="landing-footer">
            Powered by <a href="index.html" target="_blank">BINK</a>
        </div>
    </div>
</div>
    `;
};
