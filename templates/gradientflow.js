// Gradient Flow Template - Standalone JavaScript
// Complete standalone implementation with no shared dependencies

// Initialize GradientFlow namespace
window.GradientFlow = window.GradientFlow || {};

// Platform icon mapping for links
window.GradientFlow.getPlatformIcon = function(platform) {
    const icons = {
        'instagram': 'fab fa-instagram',
        'twitter': 'fab fa-twitter',
        'facebook': 'fab fa-facebook',
        'linkedin': 'fab fa-linkedin',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'snapchat': 'fab fa-snapchat',
        'pinterest': 'fab fa-pinterest',
        'discord': 'fab fa-discord',
        'twitch': 'fab fa-twitch',
        'reddit': 'fab fa-reddit',
        'telegram': 'fab fa-telegram',
        'whatsapp': 'fab fa-whatsapp',
        'github': 'fab fa-github',
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
window.GradientFlow.getMusicPlatformIcon = function(platform) {
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
window.GradientFlow.getPlatformDisplayName = function(platform) {
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
window.GradientFlow.formatUsername = function(username) {
    if (!username) return '';
    return username.startsWith('@') ? username.substring(1) : username;
};

// Share profile function
window.GradientFlow.shareProfile = function(event, username) {
    event.preventDefault();
    event.stopPropagation();
    
    const url = `${window.location.origin}/${username}`;
    const title = `Check out ${username}'s BINK profile`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(console.error);
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(url).then(() => {
            // Show temporary feedback
            const btn = event.target.closest('.gradientflow-share-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }).catch(() => {
            // Final fallback - open share dialog
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        });
    }
};

// Share individual link function
window.GradientFlow.shareLink = function(event, url, title) {
    event.preventDefault();
    event.stopPropagation();
    
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => {
            const btn = event.target.closest('.gradientflow-link-share-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }).catch(() => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        });
    }
};

// Track link clicks
window.GradientFlow.trackLinkClick = function(event, linkId) {
    // Analytics tracking would go here
    console.log('Link clicked:', linkId);
    return true;
};

// Get YouTube video ID from URL
window.GradientFlow.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Get YouTube thumbnail URL
window.GradientFlow.getYouTubeThumbnail = function(url) {
    const videoId = window.GradientFlow.getYouTubeVideoId(url);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop';
};

// Open image modal
window.GradientFlow.openImageModal = function(imageUrl, title) {
    // Simple implementation - open image in new tab
    window.open(imageUrl, '_blank');
};

// Play music preview with embedded player
window.GradientFlow.playMusicPreview = function(platform, url, title, event) {
    // Always use the global playMusicPreview function if available (bio.html)
    if (window.playMusicPreview) {
        // Set the event.currentTarget for the global function to work properly
        if (event && event.currentTarget) {
            window.event = event;
        }
        window.playMusicPreview(platform, url, title);
    } else {
        // Fallback: create our own embedded player (for preview pages)
        window.GradientFlow.createEmbeddedMusicPlayer(platform, url, title, event.currentTarget);
    }
};

// Play YouTube video
window.GradientFlow.playYouTubeVideo = function(url, title) {
    window.open(url, '_blank');
};

// Create embedded music player for Gradient Flow template
window.GradientFlow.createEmbeddedMusicPlayer = function(platform, url, title, clickedElement) {
    // Close any existing music player
    window.GradientFlow.closeExistingMusicPlayer();

    // Show loading state
    const playButton = clickedElement.querySelector('.gradientflow-play-button i');
    if (playButton) {
        playButton.className = 'fas fa-spinner fa-spin';
    }

    // Get embed URL based on platform
    const embedUrl = window.GradientFlow.getEmbedUrl(platform, url);

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
    playerModal.className = 'gradientflow-music-player-modal';
    playerModal.innerHTML = `
        <div class="gradientflow-music-player-content">
            <div class="gradientflow-music-player-header">
                <h3>${title}</h3>
                <button class="gradientflow-close-music-player" onclick="window.GradientFlow.closeMusicPlayer()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="gradientflow-music-player-body">
                <div class="gradientflow-music-loading" id="gradientflow-music-loading">
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
                    onload="window.GradientFlow.hideMusicLoading()"
                    onerror="window.GradientFlow.showMusicError()">
                </iframe>
            </div>
            <div class="gradientflow-music-player-footer">
                <button class="gradientflow-open-external-btn" onclick="window.open('${url}', '_blank')">
                    <i class="fas fa-external-link-alt"></i>
                    Open in ${window.GradientFlow.getPlatformDisplayName(platform)}
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
            window.GradientFlow.closeMusicPlayer();
        }
    });
};

// Get embed URL for different platforms
window.GradientFlow.getEmbedUrl = function(platform, url) {
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
            const videoId = window.GradientFlow.getYouTubeVideoId(url);
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
window.GradientFlow.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Close existing music player
window.GradientFlow.closeExistingMusicPlayer = function() {
    const existingPlayer = document.querySelector('.gradientflow-music-player-modal');
    if (existingPlayer) {
        existingPlayer.remove();
    }

    // Reset all play buttons
    const playButtons = document.querySelectorAll('.gradientflow-play-button i');
    playButtons.forEach(btn => {
        if (btn.className.includes('pause') || btn.className.includes('spinner')) {
            btn.className = 'fas fa-play';
        }
    });
};

// Close music player
window.GradientFlow.closeMusicPlayer = function() {
    window.GradientFlow.closeExistingMusicPlayer();
};

// Helper functions for music player loading states
window.GradientFlow.hideMusicLoading = function() {
    const loadingElement = document.getElementById('gradientflow-music-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
};

window.GradientFlow.showMusicError = function() {
    const loadingElement = document.getElementById('gradientflow-music-loading');
    if (loadingElement) {
        loadingElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to load music player</p>
        `;
    }
};

// Render catalog content
window.GradientFlow.renderCatalogContent = function(catalog) {
    if (!catalog || catalog.length === 0) return '';

    console.log('Rendering catalog:', catalog);

    return `
        <div class="gradientflow-catalog-section">
            <h3 class="gradientflow-catalog-title">
                <i class="fas fa-store"></i> Catalog
            </h3>
            <div class="gradientflow-catalog-grid">
                ${catalog.map(item => {
                    console.log('Catalog item:', item);
                    return `
                    <div class="gradientflow-catalog-item">
                        <div class="gradientflow-catalog-image-container">
                            <img src="${item.image || item.imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'}" alt="${item.name || 'Product'}" class="gradientflow-catalog-image" loading="lazy">
                            <div class="gradientflow-catalog-overlay">
                                <div class="gradientflow-catalog-price">$${item.price || '0.00'}</div>
                            </div>
                        </div>
                        <div class="gradientflow-catalog-info">
                            <h4 class="gradientflow-catalog-name">${item.name || 'Product'}</h4>
                            ${item.description ? `<p class="gradientflow-catalog-description">${item.description}</p>` : ''}
                            <a href="${item.link || '#'}" class="gradientflow-catalog-buy-btn" target="_blank">
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
window.GradientFlow.renderMediaContent = function(media) {
    if (!media) return '';

    let mediaHTML = '';

    // YouTube Videos
    if (media.youtube && media.youtube.length > 0) {
        mediaHTML += `
            <div class="gradientflow-media-section">
                <h3 class="gradientflow-media-section-title">
                    <i class="fab fa-youtube"></i> Videos
                </h3>
                <div class="gradientflow-media-grid gradientflow-youtube-grid">
                    ${media.youtube.map(video => `
                        <div class="gradientflow-youtube-item" onclick="window.GradientFlow.playYouTubeVideo('${video.url}', '${video.title}')">
                            <div class="gradientflow-youtube-thumbnail-container">
                                <img src="${video.thumbnail || window.GradientFlow.getYouTubeThumbnail(video.url)}" alt="${video.title}" class="gradientflow-youtube-thumbnail">
                                <div class="gradientflow-youtube-play-overlay">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                            <div class="gradientflow-youtube-content-container">
                                <h4 class="gradientflow-youtube-title">${video.title}</h4>
                                ${video.description ? `<p class="gradientflow-youtube-description">${video.description}</p>` : ''}
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
            <div class="gradientflow-media-section">
                <h3 class="gradientflow-media-section-title">
                    <i class="fas fa-images"></i> Gallery
                </h3>
                <div class="gradientflow-media-grid gradientflow-images-grid">
                    ${media.images.map(image => `
                        <div class="gradientflow-image-item">
                            <div class="gradientflow-image-container">
                                <img src="${image.url}" alt="${image.title}" loading="lazy" onclick="window.GradientFlow.openImageModal('${image.url}', '${image.title}')">
                            </div>
                            <div class="gradientflow-media-info">
                                <h4 class="gradientflow-media-title">${image.title}</h4>
                                ${image.description ? `<p class="gradientflow-media-description">${image.description}</p>` : ''}
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
            <div class="gradientflow-media-section">
                <h3 class="gradientflow-media-section-title">
                    <i class="fas fa-music"></i> Music
                </h3>
                <div class="gradientflow-media-grid gradientflow-music-grid">
                    ${media.music.map(music => `
                        <div class="gradientflow-music-item">
                            <div class="gradientflow-music-player" onclick="window.GradientFlow.playMusicPreview('${music.platform}', '${music.url}', '${music.title}', event)">
                                <div class="gradientflow-music-platform-icon ${music.platform}">
                                    <i class="${window.GradientFlow.getMusicPlatformIcon(music.platform)}"></i>
                                </div>
                                <div class="gradientflow-music-info">
                                    <h4 class="gradientflow-music-title">${music.title}</h4>
                                    ${music.artist ? `<p class="gradientflow-music-artist">by ${music.artist}</p>` : ''}
                                    <p class="gradientflow-music-platform">${window.GradientFlow.getPlatformDisplayName(music.platform)}</p>
                                </div>
                                <div class="gradientflow-play-button">
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

// Main render function for Gradient Flow template
window.GradientFlow.render = function(data) {
    return `
        <div class="gradientflow-bio-bg">
            <div class="gradientflow-container">
                <div class="gradientflow-card">
                    <div class="gradientflow-header-actions">
                        <div class="gradientflow-join-link">
                            <a href="index.html" class="gradientflow-join-btn"><i class="fas fa-user-plus"></i>Join BINK</a>
                        </div>
                        <div class="gradientflow-share">
                            <button class="gradientflow-share-btn" onclick="window.GradientFlow.shareProfile(event, '${data.username}')">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="gradientflow-profile">
                        <div class="gradientflow-avatar-container">
                            <img class="gradientflow-avatar" src="${data.avatar || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face'}" alt="${data.username || 'Profile'}">
                        </div>
                        <div class="gradientflow-username">${window.GradientFlow.formatUsername(data.username) || 'username'}</div>
                        <div class="gradientflow-bio">${data.bio || ''}</div>
                    </div>
                    <div class="gradientflow-links">
                        ${(data.links || []).map(link => `
                            <div class="gradientflow-link-container">
                                <a class="gradientflow-link" href="${link.url}" onclick="window.GradientFlow.trackLinkClick(event, '${link.id}')" target="_blank">
                                    <i class="${window.GradientFlow.getPlatformIcon(link.platform)}"></i>
                                    ${link.title}
                                </a>
                                <button class="gradientflow-link-share-btn" onclick="window.GradientFlow.shareLink(event, '${link.url}', '${link.title}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${window.GradientFlow.renderCatalogContent(data.catalog || [])}
                    ${window.GradientFlow.renderMediaContent(data.media || {})}
                    ${window.GradientFlow.renderSocialLinks(data.socialLinks || {})}
                    <div class="gradientflow-footer">
                        Powered by <a href="index.html" target="_blank">BINK</a>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Render social links
window.GradientFlow.renderSocialLinks = function(socialLinks) {
    if (!socialLinks || typeof socialLinks !== 'object' || Object.keys(socialLinks).length === 0) return '';

    return `
        <div class="gradientflow-socials">
            ${Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return '';
                return `<a href="${url}" target="_blank" class="gradientflow-social-icon">
                    <i class="${window.GradientFlow.getPlatformIcon(platform)}"></i>
                </a>`;
            }).join('')}
        </div>
    `;
};
