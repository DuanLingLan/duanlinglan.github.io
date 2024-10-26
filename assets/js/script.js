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


	
//blog对话框部分，暂时弃用------------------
	// 获取对话框元素
	const blogDialog = document.getElementById('blogDialog');

	// 添加事件监听，当点击对话框外部时关闭对话框
	blogDialog.addEventListener('click', function(event) {
		if (event.target === blogDialog) {
			blogDialog.close();
		}
	});

	// 示例的打开对话框函数（你可以根据需要调用这个函数）
	function openBlogDialog() {
		blogDialog.showModal();
	}

	// 添加放大功能函数
	function openFullBlog() {
		window.open('blog.html', '_blank');
			// 关闭 homepage 中的对话框
		const blogDialog = document.getElementById('blogDialog');
		if (blogDialog) {
			blogDialog.close();
		}
	}
//以上全部暂时弃用---------------------------

});
	
