document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('nav ul li a');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            window.scrollTo({
                top: targetSection.offsetTop - document.querySelector('header').offsetHeight,
                behavior: 'smooth'
            });
        });
    });

    const browseBtn = document.getElementById('browseBtn');
    const audioInput = document.getElementById('audioInput');
    const audioPath = document.getElementById('audioPath');

    browseBtn.addEventListener('click', function () {
        audioInput.click();
    });

    audioInput.addEventListener('change', function () {
        if (audioInput.files.length > 0) {
            audioPath.value = audioInput.files[0].name;
        }
    });

    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.addEventListener('click', function () {
    if (audioInput.files.length > 0) {
        const formData = new FormData();
        formData.append('audio', audioInput.files[0]);

        fetch('audio', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                alert('Success: ' + data.message  + '\nPredicted class: ' + data.predicted_class);
            }
            // + '\nPath: ' + data.path
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Network error occurred. Please check console for details.');
        });
    } else {
        alert('Please select an audio file first.');
    }
    });
});
