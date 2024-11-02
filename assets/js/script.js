document.addEventListener('DOMContentLoaded', function() {
    var audioPlayer = document.getElementById('audioPlayer');
    var playPauseButton = document.getElementById('playPauseButton');
    var progressBar = document.getElementById('progressBar');
    var progress = document.getElementById('progress');
	var playButton = document.getElementById('playPauseButton');
	
    // 添加闪烁效果
    playButton.classList.add('flash');

    // 2秒后移除闪烁效果
    setTimeout(function() {
        playButton.classList.remove('flash');
    }, 2000); // 持续2秒

//读取首页小组件
	loadContent('library.html', 'library-content');
	loadContent('gallery.html', 'gallery-content');
	loadContent('video.html', 'video-content');
	loadContent('achive.html', 'achive-content');
	
//首页小组件函数
	function loadContent(file, containerId) {
	fetch(file)
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.text();
		})
		.then(data => {
			document.getElementById(containerId).innerHTML = data;
			// 隐藏 "See More" 按钮
			document.querySelector(`#${containerId}`).nextElementSibling.style.display = 'none';
		})
		.catch(error => {
			console.error('There has been a problem with your fetch operation:', error);
			document.getElementById(containerId).innerHTML = "Error loading content.";
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


        const gif = document.getElementById('gif');
        
        gif.addEventListener('mouseover', () => {
            gif.classList.add('shake'); // 鼠标悬停时添加 shake 类
        });

        gif.addEventListener('mouseout', () => {
            gif.classList.remove('shake'); // 鼠标移开时移除 shake 类
        });



});
	
