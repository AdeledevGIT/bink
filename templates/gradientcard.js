// Gradient Card Template - Custom JavaScript
// This file contains the Gradient Card template implementation that matches the preview exactly

window.GradientCard = window.GradientCard || {};

// Render Gradient Card media content with preview-matching structure
window.GradientCard.renderMediaContent = function(media) {
    if (!media || typeof media !== 'object') {
        // Return sample media content when no media is provided (like in preview)
        return window.GradientCard.getSampleMediaContent();
    }

    // Check if media is empty and provide sample data for preview
    const hasAnyMedia = (media.youtube && media.youtube.length > 0) ||
                       (media.images && media.images.length > 0) ||
                       (media.music && media.music.length > 0);

    if (!hasAnyMedia) {
        // Show sample content like the preview does
        return window.GradientCard.getSampleMediaContent();
    }

    let mediaHTML = '';

    // Images Gallery
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
                                <img src="${image.url}" alt="${image.title}" loading="lazy" onclick="window.GradientCard.openImageModal('${image.url}', '${image.title}')">
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
                                    src="https://www.youtube.com/embed/${window.GradientCard.getYouTubeVideoId(video.url)}"
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
                            <div class="music-player" onclick="window.GradientCard.playMusicPreview('${music.platform}', '${music.url}', '${music.title}')">
                                <div class="music-platform-icon ${music.platform}">
                                    <i class="${window.GradientCard.getMusicPlatformIcon(music.platform)}"></i>
                                </div>
                                <div class="music-info">
                                    <h4 class="music-title">${music.title}</h4>
                                    ${music.artist ? `<p class="music-artist">by ${music.artist}</p>` : ''}
                                    <p class="music-platform">${window.GradientCard.getPlatformDisplayName(music.platform)}</p>
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

    return mediaHTML;
};

// Get sample media content that matches the preview
window.GradientCard.getSampleMediaContent = function() {
    return `
        <div class="media-section">
            <h3 class="media-section-title">
                <i class="fas fa-images"></i> Gallery
            </h3>
            <div class="media-grid images-grid">
                <div class="media-item image-item">
                    <div class="image-container">
                        <img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=300&h=200&fit=crop" alt="Design Work 1" loading="lazy">
                    </div>
                    <div class="media-info">
                        <h4 class="media-title">Modern UI Design</h4>
                        <p class="media-description">Clean and modern user interface design for mobile applications</p>
                    </div>
                </div>
                <div class="media-item image-item">
                    <div class="image-container">
                        <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop" alt="Design Work 2" loading="lazy">
                    </div>
                    <div class="media-info">
                        <h4 class="media-title">Brand Identity</h4>
                        <p class="media-description">Complete brand identity design including logo and visual guidelines</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="media-section">
            <h3 class="media-section-title">
                <i class="fab fa-youtube"></i> Videos
            </h3>
            <div class="media-grid youtube-grid">
                <div class="media-item youtube-item">
                    <div class="youtube-embed-container">
                        <iframe
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            frameborder="0"
                            allowfullscreen
                            loading="lazy">
                        </iframe>
                    </div>
                    <div class="media-info">
                        <h4 class="media-title">Design Process Tutorial</h4>
                        <p class="media-description">Step-by-step guide to my design process and workflow</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="media-section">
            <h3 class="media-section-title">
                <i class="fas fa-music"></i> Music
            </h3>
            <div class="media-grid music-grid">
                <div class="media-item music-item">
                    <div class="music-player" onclick="window.open('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh', '_blank')">
                        <div class="music-platform-icon spotify">
                            <i class="fab fa-spotify"></i>
                        </div>
                        <div class="music-info">
                            <h4 class="music-title">Creative Flow</h4>
                            <p class="music-artist">by Alex Designer</p>
                            <p class="music-platform">Spotify</p>
                        </div>
                        <div class="play-button">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="media-item music-item">
                    <div class="music-player" onclick="window.open('https://music.apple.com/us/album/inspiration/1234567890', '_blank')">
                        <div class="music-platform-icon apple-music">
                            <i class="fab fa-apple"></i>
                        </div>
                        <div class="music-info">
                            <h4 class="music-title">Inspiration</h4>
                            <p class="music-artist">by Alex Designer</p>
                            <p class="music-platform">Apple Music</p>
                        </div>
                        <div class="play-button">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Helper functions for Gradient Card template
window.GradientCard.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

window.GradientCard.getMusicPlatformIcon = function(platform) {
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

window.GradientCard.getPlatformDisplayName = function(platform) {
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

// Media interaction functions
window.GradientCard.openImageModal = function(imageUrl, imageTitle) {
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

    // Close modal functionality
    const closeBtn = modal.querySelector('.image-modal-close');
    closeBtn.onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    };
};

window.GradientCard.playMusicPreview = function(platform, url, title) {
    // Open music link in new tab
    if (url && url !== '#') {
        window.open(url, '_blank');
    }
};

// Render social links for Gradient Card
window.GradientCard.renderSocialLinks = function(socialLinks) {
    if (!socialLinks || Object.keys(socialLinks).length === 0) {
        // Return default social links like in preview
        return `
            <a href="#"><i class="fab fa-twitter"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
            <a href="#"><i class="fab fa-linkedin"></i></a>
            <a href="#"><i class="fab fa-github"></i></a>
        `;
    }

    return Object.entries(socialLinks).map(([platform, url]) => `
        <a href="${url}" target="_blank"><i class="${window.GradientCard.getPlatformIcon(platform)}"></i></a>
    `).join('');
};

window.GradientCard.getPlatformIcon = function(platform) {
    const icons = {
        'facebook': 'fab fa-facebook',
        'twitter': 'fab fa-twitter',
        'instagram': 'fab fa-instagram',
        'linkedin': 'fab fa-linkedin',
        'github': 'fab fa-github',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'snapchat': 'fab fa-snapchat',
        'discord': 'fab fa-discord',
        'twitch': 'fab fa-twitch',
        'website': 'fas fa-globe'
    };
    return icons[platform] || 'fas fa-link';
};
