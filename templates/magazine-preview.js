// Magazine Preview JavaScript - Renders media sections correctly
window.MagazinePreview = {
    // Sample media data for preview
    sampleMedia: {
        images: [
            {
                id: 'img1',
                url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&h=200&fit=crop',
                title: 'Tech Journalism',
                description: 'Covering the latest in technology and innovation'
            },
            {
                id: 'img2',
                url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop',
                title: 'Cultural Stories',
                description: 'Exploring diverse communities and their stories'
            },
            {
                id: 'img3',
                url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop',
                title: 'Interview Sessions',
                description: 'Behind the scenes of exclusive interviews'
            }
        ],
        music: [
            {
                id: 'music1',
                title: 'Writing Inspiration',
                artist: 'Rachel Writer',
                platform: 'Spotify',
                url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
            },
            {
                id: 'music2',
                title: 'Focus Playlist',
                artist: 'Curated Collection',
                platform: 'Spotify',
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd'
            }
        ]
    },

    // Render media content using NEW magazine template styles
    renderMediaContent: function(media) {
        let html = '';

        // Images section
        if (media.images && media.images.length > 0) {
            html += `
                <div class="media-section">
                    <h2 class="section-title">Featured Gallery</h2>
                    <div class="media-grid images-grid">
                        ${media.images.map(image => `
                            <div class="media-item image-item">
                                <div class="image-container">
                                    <img src="${image.url}" alt="${image.title}" loading="lazy">
                                </div>
                                <div class="media-info">
                                    <h4 class="media-title">${image.title}</h4>
                                    <p class="media-description">${image.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Music section
        if (media.music && media.music.length > 0) {
            html += `
                <div class="media-section">
                    <h2 class="section-title">Featured Music</h2>
                    <div class="media-grid music-grid">
                        ${media.music.map(track => `
                            <div class="media-item music-item">
                                <div class="music-player" onclick="window.open('${track.url}', '_blank')">
                                    <div class="music-platform-icon spotify">
                                        <i class="fab fa-spotify"></i>
                                    </div>
                                    <div class="music-info">
                                        <h4 class="music-title">${track.title}</h4>
                                        <p class="music-artist">by ${track.artist}</p>
                                        <p class="music-platform">${track.platform}</p>
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

        return html;
    },

    // Initialize the preview
    init: function() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.renderPreview());
        } else {
            this.renderPreview();
        }
    },

    // Render the complete preview
    renderPreview: function() {
        // Find the media container or create one
        let mediaContainer = document.getElementById('media-container');
        if (!mediaContainer) {
            // Create media container after products section
            const productsSection = document.querySelector('.products-section');
            if (productsSection) {
                mediaContainer = document.createElement('div');
                mediaContainer.id = 'media-container';
                productsSection.parentNode.insertBefore(mediaContainer, productsSection.nextSibling);
            }
        }

        if (mediaContainer) {
            // Render media content
            mediaContainer.innerHTML = this.renderMediaContent(this.sampleMedia);
        }
    }
};

// Auto-initialize when script loads
window.MagazinePreview.init();
