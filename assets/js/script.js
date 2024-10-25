    document.addEventListener('DOMContentLoaded', function() {
        var audioPlayer = document.getElementById('audioPlayer');
        var playPauseButton = document.getElementById('playPauseButton');
        var progressBar = document.getElementById('progressBar');
        var progress = document.getElementById('progress');

        // 尝试自动播放
        var playPromise = audioPlayer.play();

        // 自动播放被阻止处理
        if (playPromise !== undefined) {
            playPromise.catch(function(error) {
                console.log('自动播放被阻止，需要用户交互:', error);

                // 提示用户点击页面以播放音频
                document.addEventListener('click', function() {
                    audioPlayer.play();
                }, { once: true }); // 确保只执行一次
            });
        }

        // 更新播放/暂停按钮
        function updatePlayPauseButton() {
            if (audioPlayer.paused) {
                playPauseButton.classList.remove('pause-button');
                playPauseButton.classList.add('play-button');
            } else {
                playPauseButton.classList.remove('play-button');
                playPauseButton.classList.add('pause-button');
            }
        }

        // 播放/暂停按钮点击事件
        playPauseButton.addEventListener('click', function() {
            if (audioPlayer.paused) {
                audioPlayer.play();
            } else {
                audioPlayer.pause();
            }
            updatePlayPauseButton();
        });
		
	    // 音频播放成功事件，用于更新按钮状态
    audioPlayer.addEventListener('play', updatePlayPauseButton);
    audioPlayer.addEventListener('pause', updatePlayPauseButton);

        // 更新进度条
        audioPlayer.addEventListener('timeupdate', function() {
            var percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = percentage + '%';
        });

        // 进度条点击事件
        progressBar.addEventListener('click', function(event) {
            var clickX = event.offsetX;
            var barWidth = progressBar.offsetWidth;
            var newTime = (clickX / barWidth) * audioPlayer.duration;
            audioPlayer.currentTime = newTime;
        });

        // 初始化按钮状态
        updatePlayPauseButton();
    });
	
