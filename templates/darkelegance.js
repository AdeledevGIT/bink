// Dark Elegance Template - Standalone JavaScript
// This file contains all the functionality specific to the Dark Elegance template

// Initialize the DarkElegance namespace
window.DarkElegance = window.DarkElegance || {};

// Utility functions for the Dark Elegance template
window.DarkElegance.formatUsername = function(username) {
    if (!username) return '';
    return username.charAt(0).toUpperCase() + username.slice(1);
};

window.DarkElegance.getPlatformIcon = function(platform) {
    const icons = {
        'website': 'fas fa-globe',
        'instagram': 'fab fa-instagram',
        'twitter': 'fab fa-twitter',
        'facebook': 'fab fa-facebook',
        'linkedin': 'fab fa-linkedin',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'snapchat': 'fab fa-snapchat',
        'pinterest': 'fab fa-pinterest',
        'github': 'fab fa-github',
        'discord': 'fab fa-discord',
        'twitch': 'fab fa-twitch',
        'spotify': 'fab fa-spotify',
        'soundcloud': 'fab fa-soundcloud',
        'bandcamp': 'fab fa-bandcamp',
        'apple-music': 'fab fa-apple',
        'amazon-music': 'fab fa-amazon',
        'deezer': 'fas fa-music',
        'tidal': 'fas fa-music',
        'email': 'fas fa-envelope',
        'phone': 'fas fa-phone',
        'whatsapp': 'fab fa-whatsapp',
        'telegram': 'fab fa-telegram',
        'other': 'fas fa-link'
    };
    return icons[platform] || icons['other'];
};

// Get music platform specific icons
window.DarkElegance.getMusicPlatformIcon = function(platform) {
    const musicIcons = {
        'spotify': 'fab fa-spotify',
        'apple-music': 'fab fa-apple',
        'soundcloud': 'fab fa-soundcloud',
        'youtube': 'fab fa-youtube',
        'bandcamp': 'fab fa-bandcamp',
        'deezer': 'fas fa-music',
        'tidal': 'fas fa-music',
        'amazon-music': 'fab fa-amazon',
        'music': 'fas fa-music'
    };
    return musicIcons[platform] || musicIcons['music'];
};

// Format platform names for display
window.DarkElegance.formatPlatformName = function(platform) {
    const platformNames = {
        'spotify': 'Spotify',
        'apple-music': 'Apple Music',
        'soundcloud': 'SoundCloud',
        'youtube': 'YouTube',
        'bandcamp': 'Bandcamp',
        'deezer': 'Deezer',
        'tidal': 'TIDAL',
        'amazon-music': 'Amazon Music',
        'music': 'Music'
    };
    return platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
};

// Share profile function
window.DarkElegance.shareProfile = function(event, username) {
    event.preventDefault();
    event.stopPropagation();
    
    const url = window.location.href;
    const text = `Check out ${username}'s profile on BINK!`;
    
    if (navigator.share) {
        navigator.share({
            title: `${username} - BINK Profile`,
            text: text,
            url: url
        }).catch(console.error);
    } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(url).then(() => {
            // Show a temporary notification
            const notification = document.createElement('div');
            notification.textContent = 'Profile link copied to clipboard!';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d4af37;
                color: #000;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-family: 'Playfair Display', serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }).catch(() => {
            alert('Unable to copy link. Please copy the URL manually.');
        });
    }
};

// Share individual link function
window.DarkElegance.shareLink = function(event, url, title) {
    event.preventDefault();
    event.stopPropagation();
    
    const text = `Check out: ${title}`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => {
            const notification = document.createElement('div');
            notification.textContent = 'Link copied to clipboard!';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d4af37;
                color: #000;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-family: 'Playfair Display', serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }).catch(() => {
            alert('Unable to copy link. Please copy the URL manually.');
        });
    }
};

// Track link clicks
window.DarkElegance.trackLinkClick = function(event, linkId) {
    // Analytics tracking can be added here
    console.log('Link clicked:', linkId);
};

// Play music preview with embedded player
window.DarkElegance.playMusicPreview = function(platform, url, title, event) {
    // Always use the global playMusicPreview function if available (bio.html)
    if (window.playMusicPreview) {
        // Set the event.currentTarget for the global function to work properly
        if (event && event.currentTarget) {
            window.event = event;
        }
        window.playMusicPreview(platform, url, title);
    } else {
        // Fallback: create our own embedded player (for preview pages)
        window.DarkElegance.createEmbeddedMusicPlayer(platform, url, title, event.currentTarget);
    }
};

// Create embedded music player for Dark Elegance template
window.DarkElegance.createEmbeddedMusicPlayer = function(platform, url, title, clickedElement) {
    // Close any existing music player
    window.DarkElegance.closeExistingMusicPlayer();

    // Show loading state
    const playButton = clickedElement.querySelector('.play-button i');
    if (playButton) {
        playButton.className = 'fas fa-spinner fa-spin';
    }

    // Get embed URL based on platform
    const embedUrl = window.DarkElegance.getEmbedUrl(platform, url);

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
    playerModal.className = 'darkelegance-music-player-modal';
    playerModal.innerHTML = `
        <div class="darkelegance-music-player-content">
            <div class="darkelegance-music-player-header">
                <h3>${title}</h3>
                <button class="darkelegance-close-music-player" onclick="window.DarkElegance.closeMusicPlayer()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="darkelegance-music-player-body">
                <div class="darkelegance-music-loading" id="darkelegance-music-loading">
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
                    onload="window.DarkElegance.hideMusicLoading()"
                    onerror="window.DarkElegance.showMusicError()">
                </iframe>
            </div>
            <div class="darkelegance-music-player-footer">
                <button class="darkelegance-open-external-btn" onclick="window.open('${url}', '_blank')">
                    <i class="fas fa-external-link-alt"></i>
                    Open in ${window.DarkElegance.formatPlatformName(platform)}
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
            window.DarkElegance.closeMusicPlayer();
        }
    });
};

// Get embed URL for different platforms
window.DarkElegance.getEmbedUrl = function(platform, url) {
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
            const videoId = window.DarkElegance.getYouTubeVideoId(url);
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

// Get YouTube video ID
window.DarkElegance.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Close existing music player
window.DarkElegance.closeExistingMusicPlayer = function() {
    const existingPlayer = document.querySelector('.darkelegance-music-player-modal');
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
window.DarkElegance.closeMusicPlayer = function() {
    window.DarkElegance.closeExistingMusicPlayer();
};

// Helper functions for music player loading states
window.DarkElegance.hideMusicLoading = function() {
    const loadingElement = document.getElementById('darkelegance-music-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
};

window.DarkElegance.showMusicError = function() {
    const loadingElement = document.getElementById('darkelegance-music-loading');
    if (loadingElement) {
        loadingElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to load music player</p>
        `;
    }
};

// Render social links
window.DarkElegance.renderSocialLinks = function(socialLinks) {
    if (!socialLinks || Object.keys(socialLinks).length === 0) {
        return '';
    }

    return `
        <div class="darkelegance-socials">
            ${Object.entries(socialLinks).map(([platform, url]) => `
                <a href="${url}" target="_blank" rel="noopener noreferrer">
                    <i class="${window.DarkElegance.getPlatformIcon(platform)}"></i>
                </a>
            `).join('')}
        </div>
    `;
};

// Render catalog content
window.DarkElegance.renderCatalogContent = function(catalog) {
    if (!catalog || catalog.length === 0) {
        return '';
    }

    return `
        <div class="media-section">
            <h3 class="media-section-title">
                <i class="fas fa-store"></i> Catalog
            </h3>
            <div class="media-grid catalog-grid">
                ${catalog.map(item => {
                    const imageUrl = item.imageUrl || item.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';
                    const buyLink = item.buyLink || item.link || '#';
                    let displayPrice = '';
                    if (item.price) {
                        displayPrice = item.price.toString().includes('$') ? item.price : `$${item.price}`;
                    } else if (item.priceAmount) {
                        if (item.currency && item.priceAmount.toLowerCase() !== 'free') {
                            displayPrice = item.currency + item.priceAmount;
                        } else {
                            displayPrice = item.priceAmount;
                        }
                    } else {
                        displayPrice = 'Contact for Price';
                    }

                    return `
                        <div class="media-item catalog-item">
                            <div class="catalog-image">
                                <img src="${imageUrl}" alt="${item.title || 'Product'}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'">
                            </div>
                            <div class="media-info">
                                <h4 class="media-title">${item.title || 'Untitled Product'}</h4>
                                <p class="media-description">${item.description || ''}</p>
                                <div class="catalog-price">${displayPrice}</div>
                                <a href="${buyLink}" target="_blank" class="catalog-btn">
                                    <i class="fas fa-shopping-cart"></i> Buy Now
                                </a>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};

// Render media content
window.DarkElegance.renderMediaContent = function(media) {
    if (!media || Object.keys(media).length === 0) {
        return '';
    }

    let content = '';

    // Render videos
    if (media.videos && media.videos.length > 0) {
        content += `
            <div class="media-section">
                <h3 class="media-section-title">
                    <i class="fas fa-video"></i> Videos
                </h3>
                <div class="media-grid videos-grid">
                    ${media.videos.map(video => `
                        <div class="media-item video-item">
                            <div class="video-container">
                                <iframe src="${video.embedUrl}" frameborder="0" allowfullscreen loading="lazy"></iframe>
                            </div>
                            <div class="media-info">
                                <h4 class="media-title">${video.title}</h4>
                                <p class="media-description">${video.description || ''}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render images
    if (media.images && media.images.length > 0) {
        content += `
            <div class="media-section">
                <h3 class="media-section-title">
                    <i class="fas fa-images"></i> Gallery
                </h3>
                <div class="media-grid images-grid">
                    ${media.images.map(image => `
                        <div class="media-item image-item">
                            <div class="image-container">
                                <img src="${image.url}" alt="${image.title}" loading="lazy">
                            </div>
                            <div class="media-info">
                                <h4 class="media-title">${image.title}</h4>
                                <p class="media-description">${image.description || ''}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render music
    if (media.music && media.music.length > 0) {
        content += `
            <div class="media-section">
                <h3 class="media-section-title">
                    <i class="fas fa-music"></i> Music
                </h3>
                <div class="media-grid music-grid">
                    ${media.music.map(track => `
                        <div class="media-item music-item">
                            <div class="music-player" onclick="window.DarkElegance.playMusicPreview('${track.platform || 'music'}', '${track.url || '#'}', '${track.title}', event)">
                                <div class="music-platform-icon ${track.platform || 'music'}">
                                    <i class="${window.DarkElegance.getMusicPlatformIcon(track.platform || 'music')}"></i>
                                </div>
                                <div class="music-info">
                                    <h4 class="music-title">${track.title}</h4>
                                    <p class="music-artist">${track.artist || 'Unknown Artist'}</p>
                                    <p class="music-platform">${window.DarkElegance.formatPlatformName(track.platform || 'Music')}</p>
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

    return content;
};

// Main render function for Dark Elegance template
window.DarkElegance.render = function(data) {
    return `
        <div class="darkelegance-bio-bg">
            <div class="darkelegance-container">
                <div class="darkelegance-card">
                    <div class="darkelegance-header-actions">
                        <div class="darkelegance-join-link">
                            <a href="index.html" class="darkelegance-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="darkelegance-share">
                            <button class="darkelegance-share-btn" onclick="window.DarkElegance.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="darkelegance-profile">
                        <div class="darkelegance-avatar-container">
                            <img class="darkelegance-avatar" src="${data.profilePicUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'}" alt="Profile">
                        </div>
                        <div class="darkelegance-username">${window.DarkElegance.formatUsername(data.displayName || data.username)}</div>
                        <div class="darkelegance-bio">${data.bio || ''}</div>
                    </div>
                    <div class="darkelegance-links">
                        ${(data.links || []).map(link => `
                            <div class="darkelegance-link-container">
                                <a class="darkelegance-link" href="${link.url}" onclick="window.DarkElegance.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.DarkElegance.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="darkelegance-link-share-btn" onclick="window.DarkElegance.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.DarkElegance.renderCatalogContent(data.catalog || [])}
                    ${window.DarkElegance.renderMediaContent(data.media || {})}
                    ${window.DarkElegance.renderSocialLinks(data.socialLinks || {})}
                    <div class="darkelegance-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
    `;
};
