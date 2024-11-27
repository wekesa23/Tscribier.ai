// Initialize WaveSurfer for audio
var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#777',
    progressColor: 'rgba(25, 20, 30, 0.83)',
    barWidth: NaN,
    cursorWidth: 1,
    height: 30,
});

// Initialize video element
var videoPlayer = document.getElementById('video-player');
var isVideoPlaying = false;

// Handle file upload
document.getElementById('media-upload').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (file) {
        var fileType = file.type.split('/')[0]; // Check if it's audio or video

        if (fileType === 'audio') {
            var reader = new FileReader();
            reader.onload = function(e) {
                videoPlayer.style.display = 'none'; // Hide video player
                wavesurfer.loadBlob(file);
            };
            reader.readAsDataURL(file);
        } else if (fileType === 'video') {
            wavesurfer.empty(); // Unload any existing audio
            videoPlayer.src = URL.createObjectURL(file);
            videoPlayer.style.display = 'block'; // Show video player
            videoPlayer.load();
            isVideoPlaying = false;
        }
    }
});

// Play/Pause button functionality (for both audio and video)
document.getElementById('play-pause').addEventListener('click', function() {
    if (videoPlayer.style.display === 'block') {
        if (isVideoPlaying) {
            videoPlayer.pause();
        } else {
            videoPlayer.play();
        }
        isVideoPlaying = !isVideoPlaying;
    } else {
        wavesurfer.playPause();
    }
});

// Skip backward button functionality (skip back 5 seconds)
document.getElementById('skip-backward').addEventListener('click', function() {
    if (videoPlayer.style.display === 'block') {
        videoPlayer.currentTime -= 5;
    } else {
        wavesurfer.skip(-5);
    }
});

// Skip forward button functionality (skip forward 5 seconds)
document.getElementById('skip-forward').addEventListener('click', function() {
    if (videoPlayer.style.display === 'block') {
        videoPlayer.currentTime += 5;
    } else {
        wavesurfer.skip(5);
    }
});

// Replay button functionality (restart media from the beginning)
document.getElementById('replay').addEventListener('click', function() {
    if (videoPlayer.style.display === 'block') {
        videoPlayer.currentTime = 0;
        videoPlayer.play();
    } else {
        wavesurfer.seekTo(0);
        wavesurfer.play();
    }
});

// Media speed control functionality
document.getElementById('speed-slider').addEventListener('input', function() {
    var speed = this.value;
    if (videoPlayer.style.display === 'block') {
        videoPlayer.playbackRate = speed;
    } else {
        wavesurfer.setPlaybackRate(speed);
    }
});

// Update time display while media is playing (for both audio and video)
function updateTimeDisplay(currentTime) {
    var minutes = Math.floor(currentTime / 60);
    var seconds = Math.floor(currentTime % 60);
    document.getElementById('current-time').textContent = 'Current Time: ' + 
        (minutes < 10 ? '0' : '') + minutes + ':' + 
        (seconds < 10 ? '0' : '') + seconds;
}

wavesurfer.on('audioprocess', function() {
    updateTimeDisplay(wavesurfer.getCurrentTime());
});

videoPlayer.addEventListener('timeupdate', function() {
    updateTimeDisplay(videoPlayer.currentTime);
});

// Reset time display when media finishes playing
wavesurfer.on('finish', function() {
    document.getElementById('current-time').textContent = 'Current Time: 00:00';
});

videoPlayer.addEventListener('ended', function() {
    document.getElementById('current-time').textContent = 'Current Time: 00:00';
});

// Handle keyboard shortcuts (for both audio and video)
document.addEventListener('keydown', function(e) {
    switch (e.key) {
        case 'F8':
            e.preventDefault();
            document.getElementById('play-pause').click();
            break;
        case 'F2':
            e.preventDefault();
            document.getElementById('skip-backward').click();
            break;
        case 'F4':
            e.preventDefault();
            document.getElementById('skip-forward').click();
            break;
        case 'F12':
            e.preventDefault();
            insertTimestamp();
            break;
    }
});
// Insert timestamp at the current cursor position in the text editor
function insertTimestamp() {
    var textEditor = document.getElementById('text-editor');
    var currentTime;

    // Check if video is being displayed or audio is being played
    if (videoPlayer.style.display === 'block') {
        currentTime = videoPlayer.currentTime; // Use video time if video is active
    } else {
        currentTime = wavesurfer.getCurrentTime(); // Use audio time if audio is active
    }

    var minutes = Math.floor(currentTime / 60);
    var seconds = Math.floor(currentTime % 60);
    var timestamp = '[(' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds + ')]';

    // Insert timestamp at the current cursor position
    if (textEditor.selectionStart || textEditor.selectionStart === 0) {
        var startPos = textEditor.selectionStart;
        var endPos = textEditor.selectionEnd;
        var textBefore = textEditor.value.substring(0, startPos);
        var textAfter = textEditor.value.substring(endPos, textEditor.value.length);
        textEditor.value = textBefore + timestamp + textAfter;
        textEditor.selectionStart = textEditor.selectionEnd = startPos + timestamp.length;
    } else {
        textEditor.value += timestamp;
    }

    textEditor.focus();
}

// Save as TXT functionality
document.getElementById('save-txt').addEventListener('click', function() {
    var text = document.getElementById('text-editor').value;
    var blob = new Blob([text], { type: 'text/plain' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transcript.txt';
    link.click();
});

// Transcription feature remains unchanged
document.getElementById('transcribe-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('media-upload');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload an audio or video file first.');
        return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    try {
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.transcript) {
            document.getElementById('text-editor').value = data.transcript;
        } else {
            alert('Transcription failed.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing the transcription.');
    }
});
// Toggle visibility of the find and replace box
document.getElementById('find-replace-toggle-btn').addEventListener('click', function() {
    var findReplaceBox = document.getElementById('find-replace-box');
    if (findReplaceBox.style.display === 'none' || findReplaceBox.style.display === '') {
        findReplaceBox.style.display = 'block';  // Show the box
    } else {
        findReplaceBox.style.display = 'none';  // Hide the box
    }
});

// Handle find and replace functionality
document.getElementById('find-replace-btn').addEventListener('click', function() {
    var findText = document.getElementById('find-text').value;
    var replaceText = document.getElementById('replace-text').value;
    var textEditor = document.getElementById('text-editor');

    if (findText) {
        var text = textEditor.value;
        var regex = new RegExp(findText, 'g');  // Global search for the findText
        textEditor.value = text.replace(regex, replaceText);
    }
});

// Save the text editor content to localStorage
document.getElementById('text-editor').addEventListener('input', function () {
    localStorage.setItem('savedText', document.getElementById('text-editor').value);
});
// Load saved text and audio/video on page load
document.addEventListener("DOMContentLoaded", function () {
    const textEditor = document.getElementById('text-editor');

    // Retrieve saved text from localStorage
    if (localStorage.getItem('savedText')) {
        textEditor.value = localStorage.getItem('savedText');
    }

    // Load saved audio and video
    loadAudioFromLocalStorage();
    loadVideoFromLocalStorage();
});


