function extractBodyContent(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body && doc.body.children.length ? doc.body.innerHTML : html;
}

function loadContent(file, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        return Promise.resolve();
    }

    return fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${file}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = extractBodyContent(html);

            const button = container.nextElementSibling;
            if (button && button.tagName === 'BUTTON') {
                button.style.display = 'none';
            }
        })
        .catch(error => {
            console.error(error);
            container.textContent = 'Error loading content.';
        });
}

window.loadContent = loadContent;

document.addEventListener('DOMContentLoaded', function() {
    [
        ['partials/library.html', 'library-content'],
        ['partials/gallery.html', 'gallery-content'],
        ['partials/video.html', 'video-content'],
        ['partials/achievements.html', 'achive-content']
    ].forEach(([file, containerId]) => loadContent(file, containerId));

    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseButton = document.getElementById('playPauseButton');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');

    if (audioPlayer && playPauseButton && progressBar && progress) {
        playPauseButton.classList.add('flash');
        setTimeout(() => playPauseButton.classList.remove('flash'), 2000);

        function updatePlayPauseButton() {
            playPauseButton.classList.toggle('pause-button', !audioPlayer.paused);
            playPauseButton.classList.toggle('play-button', audioPlayer.paused);
        }

        playPauseButton.addEventListener('click', function() {
            if (audioPlayer.paused) {
                audioPlayer.play();
            } else {
                audioPlayer.pause();
            }
            updatePlayPauseButton();
        });

        audioPlayer.addEventListener('play', updatePlayPauseButton);
        audioPlayer.addEventListener('pause', updatePlayPauseButton);
        audioPlayer.addEventListener('timeupdate', function() {
            if (Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
                progress.style.width = `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%`;
            }
        });

        progressBar.addEventListener('click', function(event) {
            if (Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
                audioPlayer.currentTime = (event.offsetX / progressBar.offsetWidth) * audioPlayer.duration;
            }
        });

        updatePlayPauseButton();
    }

    const gif = document.getElementById('gif');
    if (gif) {
        gif.addEventListener('mouseover', () => gif.classList.add('shake'));
        gif.addEventListener('mouseout', () => gif.classList.remove('shake'));
    }
});
