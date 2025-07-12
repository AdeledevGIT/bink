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

// Play music preview with embedded player
window.LandingProfile.playMusicPreview = function(platform, url, title, event) {
    // Always use the global playMusicPreview function if available (bio.html)
    if (window.playMusicPreview) {
        // Set the event.currentTarget for the global function to work properly
        if (event && event.currentTarget) {
            window.event = event;
        }
        window.playMusicPreview(platform, url, title);
    } else {
        // Fallback: create our own embedded player (for preview pages)
        window.LandingProfile.createEmbeddedMusicPlayer(platform, url, title, event.currentTarget);
    }
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

// Create embedded music player for Landing Profile template
window.LandingProfile.createEmbeddedMusicPlayer = function(platform, url, title, clickedElement) {
    // Close any existing music player
    window.LandingProfile.closeExistingMusicPlayer();

    // Show loading state
    const playButton = clickedElement.querySelector('.play-button i');
    if (playButton) {
        playButton.className = 'fas fa-spinner fa-spin';
    }

    // Get embed URL based on platform
    const embedUrl = window.LandingProfile.getEmbedUrl(platform, url);

    if (!embedUrl) {
        // If no embed URL available, fall back to opening external link
        setTimeout(() => {
            window.open(url, '_blank');
            if (playButton) {
                playButton.className = 'fas fa-external-link-alt';
            }
        }, 500);
        return;
    }

    // Create music player modal
    const playerModal = document.createElement('div');
    playerModal.className = 'landing-music-player-modal';
    playerModal.innerHTML = `
        <div class="landing-music-player-content">
            <div class="landing-music-player-header">
                <h3>${title}</h3>
                <button class="landing-close-music-player" onclick="window.LandingProfile.closeMusicPlayer()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="landing-music-player-body">
                <div class="landing-music-loading" id="landing-music-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading music player...</p>
                </div>
                <iframe
                    src="${embedUrl}"
                    width="100%"
                    height="152"
                    frameborder="0"
                    allowtransparency="true"
                    allow="encrypted-media"
                    onload="window.LandingProfile.hideMusicLoading()"
                    onerror="window.LandingProfile.showMusicError()">
                </iframe>
            </div>
            <div class="landing-music-player-footer">
                <button class="landing-open-external-btn" onclick="window.open('${url}', '_blank')">
                    <i class="fas fa-external-link-alt"></i>
                    Open in ${window.LandingProfile.getPlatformDisplayName(platform)}
                </button>
            </div>
        </div>
    `;

    // Add to page
    document.body.appendChild(playerModal);

    // Reset play button icon
    setTimeout(() => {
        if (playButton) {
            playButton.className = 'fas fa-pause';
        }
    }, 500);

    // Add click outside to close
    playerModal.addEventListener('click', (e) => {
        if (e.target === playerModal) {
            window.LandingProfile.closeMusicPlayer();
        }
    });
};

// Get embed URL for different platforms
window.LandingProfile.getEmbedUrl = function(platform, url) {
    switch (platform) {
        case 'spotify':
            if (url.includes('spotify.com/track/')) {
                const trackId = url.split('/track/')[1].split('?')[0];
                return `https://open.spotify.com/embed/track/${trackId}`;
            } else if (url.includes('spotify.com/album/')) {
                const albumId = url.split('/album/')[1].split('?')[0];
                return `https://open.spotify.com/embed/album/${albumId}`;
            } else if (url.includes('spotify.com/playlist/')) {
                const playlistId = url.split('/playlist/')[1].split('?')[0];
                return `https://open.spotify.com/embed/playlist/${playlistId}`;
            }
            break;

        case 'soundcloud':
            return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;

        case 'youtube-music':
        case 'youtube':
            const videoId = window.LandingProfile.getYouTubeVideoId(url);
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
            break;

        case 'bandcamp':
            if (url.includes('/track/')) {
                return `${url.replace('/track/', '/EmbeddedPlayer/track=')}`;
            } else if (url.includes('/album/')) {
                return `${url.replace('/album/', '/EmbeddedPlayer/album=')}`;
            }
            break;

        case 'apple-music':
            if (url.includes('music.apple.com')) {
                return url.replace('music.apple.com', 'embed.music.apple.com');
            }
            break;

        case 'audiomack':
            if (url.includes('audiomack.com/song/')) {
                return url.replace('audiomack.com/song/', 'audiomack.com/embed/song/');
            }
            break;

        case 'tidal':
            if (url.includes('tidal.com/track/')) {
                const trackId = url.split('/track/')[1].split('?')[0];
                return `https://embed.tidal.com/tracks/${trackId}`;
            }
            break;

        default:
            return null;
    }
    return null;
};

// Close existing music player
window.LandingProfile.closeExistingMusicPlayer = function() {
    const existingPlayer = document.querySelector('.landing-music-player-modal');
    if (existingPlayer) {
        existingPlayer.remove();
    }

    // Reset all play buttons
    const playButtons = document.querySelectorAll('.play-button i');
    playButtons.forEach(btn => {
        if (btn.className.includes('pause') || btn.className.includes('spinner')) {
            btn.className = 'fas fa-play';
        }
    });
};

// Close music player
window.LandingProfile.closeMusicPlayer = function() {
    window.LandingProfile.closeExistingMusicPlayer();
};

// Helper functions for music player loading states
window.LandingProfile.hideMusicLoading = function() {
    const loadingElement = document.getElementById('landing-music-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
};

window.LandingProfile.showMusicError = function() {
    const loadingElement = document.getElementById('landing-music-loading');
    if (loadingElement) {
        loadingElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to load music player</p>
        `;
    }
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
                            <div class="music-player" onclick="window.LandingProfile.playMusicPreview('${music.platform}', '${music.url}', '${music.title}', event)">
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
        ${window.LandingProfile.renderSocialLinks(data.socialLinks || {})}
        <div class="landing-footer">
            Powered by <a href="index.html" target="_blank">BINK</a>
        </div>
    </div>
</div>
    `;
};

// Render social links
window.LandingProfile.renderSocialLinks = function(socialLinks) {
    if (!socialLinks || typeof socialLinks !== 'object' || Object.keys(socialLinks).length === 0) return '';

    return `
        <div class="landing-socials">
            ${Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return '';
                return `<a href="${url}" target="_blank" class="landing-social-icon">
                    <i class="${window.LandingProfile.getPlatformIcon(platform)}"></i>
                </a>`;
            }).join('')}
        </div>
    `;
};
