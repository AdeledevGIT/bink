/**
 * Handles video playback and interaction
 * Ensures videos play properly on mobile devices
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get video and play button elements
    const video = document.querySelector('.hero-video');
    const playButton = document.querySelector('.video-play-button');
    
    if (video && playButton) {
        // Check if video is playing
        function isVideoPlaying(video) {
            return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
        }
        
        // Function to show play button
        function showPlayButton() {
            playButton.style.opacity = '1';
        }
        
        // Function to hide play button
        function hidePlayButton() {
            playButton.style.opacity = '0';
        }
        
        // Initially check if video is playing
        if (!isVideoPlaying(video)) {
            showPlayButton();
        }
        
        // Handle play button click
        playButton.addEventListener('click', function() {
            video.play();
            hidePlayButton();
        });
        
        // Handle video play event
        video.addEventListener('play', function() {
            hidePlayButton();
        });
        
        // Handle video pause event
        video.addEventListener('pause', function() {
            showPlayButton();
        });
        
        // Handle video end event
        video.addEventListener('ended', function() {
            showPlayButton();
        });
        
        // Try to autoplay the video
        video.play().catch(function(error) {
            // Autoplay was prevented, show play button
            showPlayButton();
            console.log('Autoplay prevented:', error);
        });
        
        // For mobile devices, handle touch to play
        document.addEventListener('touchstart', function() {
            if (!isVideoPlaying(video)) {
                video.play().catch(function(error) {
                    showPlayButton();
                });
            }
        }, { once: true });
    }
});
