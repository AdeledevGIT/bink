// Portfolio Template - Custom JavaScript
// This file contains the Portfolio template implementation that matches the preview exactly

window.Portfolio = window.Portfolio || {};

// Render Portfolio media content with preview-matching structure
window.Portfolio.renderMediaContent = function(media) {
    if (!media || typeof media !== 'object') {
        // Return sample media content when no media is provided (like in preview)
        return window.Portfolio.getSampleMediaContent();
    }

    // Check if media is empty and provide sample data for preview
    const hasAnyMedia = (media.youtube && media.youtube.length > 0) ||
                       (media.images && media.images.length > 0) ||
                       (media.music && media.music.length > 0);

    if (!hasAnyMedia) {
        // Show sample content like the preview does
        return window.Portfolio.getSampleMediaContent();
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
                                <img src="${image.url}" alt="${image.title}" loading="lazy" onclick="window.Portfolio.openImageModal('${image.url}', '${image.title}')">
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
                <div class="media-grid videos-grid">
                    ${media.youtube.map(video => `
                        <div class="media-item video-item">
                            <div class="video-container">
                                <iframe
                                    src="https://www.youtube.com/embed/${window.Portfolio.getYouTubeVideoId(video.url)}"
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
                            <div class="music-player" onclick="window.Portfolio.playMusicPreview('${music.platform}', '${music.url}', '${music.title}')">
                                <div class="music-platform-icon ${music.platform}">
                                    <i class="${window.Portfolio.getMusicPlatformIcon(music.platform)}"></i>
                                </div>
                                <div class="music-info">
                                    <h4 class="music-title">${music.title}</h4>
                                    ${music.artist ? `<p class="music-artist">by ${music.artist}</p>` : ''}
                                    <p class="music-platform">${window.Portfolio.getPlatformDisplayName(music.platform)}</p>
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
window.Portfolio.getSampleMediaContent = function() {
    return `
        <div class="media-section">
            <h3 class="media-section-title">
                <i class="fas fa-images"></i> Gallery
            </h3>
            <div class="media-grid images-grid">
                <div class="media-item image-item">
                    <div class="image-container">
                        <img src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=300&h=200&fit=crop" alt="Architecture Project 1" loading="lazy">
                    </div>
                    <div class="media-info">
                        <h4 class="media-title">Modern Office Complex</h4>
                        <p class="media-description">Sustainable office building with innovative design</p>
                    </div>
                </div>
                <div class="media-item image-item">
                    <div class="image-container">
                        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=200&fit=crop" alt="Architecture Project 2" loading="lazy">
                    </div>
                    <div class="media-info">
                        <h4 class="media-title">Residential Complex</h4>
                        <p class="media-description">Modern living spaces with green architecture</p>
                    </div>
                </div>
                <div class="media-item image-item">
                    <div class="image-container">
                        <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop" alt="Architecture Project 3" loading="lazy">
                    </div>
                    <div class="media-info">
                        <h4 class="media-title">Urban Planning</h4>
                        <p class="media-description">City development with sustainable approach</p>
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
                            <h4 class="music-title">Design Inspiration</h4>
                            <p class="music-artist">by Ben Architect</p>
                            <p class="music-platform">Spotify</p>
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

// Helper functions for Portfolio template
window.Portfolio.getYouTubeVideoId = function(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

window.Portfolio.getMusicPlatformIcon = function(platform) {
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

window.Portfolio.getPlatformDisplayName = function(platform) {
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
window.Portfolio.openImageModal = function(imageUrl, imageTitle) {
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

window.Portfolio.playMusicPreview = function(platform, url, title) {
    // Open music link in new tab
    if (url && url !== '#') {
        window.open(url, '_blank');
    }
};
