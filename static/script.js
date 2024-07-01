document.addEventListener('DOMContentLoaded', function () {

    const startRecordingButton = document.getElementById('start-recording');
    const stopRecordingButton = document.getElementById('stop-recording');
    const animationVideo = document.getElementById('animation-video');
    const audioContainer = document.getElementById('audio-container');
    const audioElement = document.getElementById('audio-element');
    let mediaRecorder;
    let audioChunks = [];

    // Display audio element initially
    audioElement.style.display = 'block';

    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);

    const saveAudioButton = document.getElementById('save-audio');

    saveAudioButton.addEventListener('click', saveAudio);

    // Hide animation video container initially
    if (animationVideo) {
        animationVideo.style.display = 'none';
    }

    function startRecording() {
        // Clear previous audio data
        audioChunks = [];
        if (audioElement) {
            audioElement.src = ""; // Clear audio source
        }

        // Show animation video container
        if (animationVideo) {
            animationVideo.style.display = 'block';
            animationVideo.play();
        }

        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Create new audio element for recorded audio
                    const recordedAudioElement = document.createElement('audio');
                    recordedAudioElement.controls = true;
                    recordedAudioElement.src = audioUrl;

                    // Append recorded audio player to audio container
                    audioContainer.appendChild(recordedAudioElement);
                };
                mediaRecorder.start();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
            });
    }

    function stopRecording() {
        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;

        // Hide animation video container
        if (animationVideo) {
            animationVideo.pause();
            animationVideo.style.display = 'none';
        }

        // Remove any existing audio player
        audioContainer.innerHTML = '';

        if (mediaRecorder) {
            mediaRecorder.stop();
        }
    }

    function saveAudio() {
        if (audioChunks.length === 0) {
            alert('No audio data to save');
            return;
        }

        const blob = new Blob(audioChunks, { type: 'audio/wav'});
        const formData = new FormData();
        const timestamp = Date.now();
        const filename = 'audio_' + timestamp + '.wav';

        // Retrieve input values inside the form submission event listener
        // Retrieve input values inside the form submission event listener
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const department = document.getElementById('Department').value; // Corrected ID
        const university = document.getElementById('University').value; // Corrected ID


        formData.append('audio', blob, filename);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('department', department);
        formData.append('university', university);

        const url = 'upload';

        fetch(url, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    console.log('Audio saved successfully.');
                    
                    if (name === null || name === "") {
                        alert("Audio saved successfully.\nThank you for your response!");
                    } else {
                        alert("Audio saved successfully.\nThank you for your response, " + name + "!");
                    }                    

                    // Clear the recorded chunks
                    audioChunks = [];

                    // Display the MediaRecorder element
                    audioElement.style.display = 'block';
                } else {
                    console.error('Failed to save audio.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
});

function showPopup(message) {
    alert(message);
}