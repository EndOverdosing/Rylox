document.addEventListener('DOMContentLoaded', () => {
    const urlFormContainer = document.querySelector('.url-form-container');
    const urlInput = document.getElementById('url-input');
    const qualitySelect = document.getElementById('quality-select');
    const submitButton = document.getElementById('submit-button');
    const outputArea = document.getElementById('output-area');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');
    const settingsHeader = document.querySelector('#formatting-settings .settings-header');
    const customFormatList = document.getElementById('custom-format-list');
    const formatInputs = {
        artist: document.getElementById('format-artist'),
        title: document.getElementById('format-title'),
        album: document.getElementById('format-album'),
    };
    const themeSwitcher = document.getElementById('theme-switcher');
    const mobilePasteButton = document.getElementById('paste-button-mobile');

    const savePreference = (key, value) => localStorage.setItem(key, value);
    const getPreference = (key) => localStorage.getItem(key);

    function applySavedPreferences() {
        const savedTheme = getPreference('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }

        const savedQuality = getPreference('quality');
        if (savedQuality) {
            qualitySelect.value = savedQuality;
        }

        for (const key in formatInputs) {
            const savedValue = getPreference(`format_${key}`);
            if (savedValue) {
                formatInputs[key].value = savedValue;
            }
        }

        const isFormatSectionOpen = getPreference('format_section_open');
        if (isFormatSectionOpen === 'true') {
            customFormatList.classList.remove('hidden');
            settingsHeader.classList.add('open');
        }
    }

    themeSwitcher.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const newTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        savePreference('theme', newTheme);
    });

    if (mobilePasteButton) {
        mobilePasteButton.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    urlInput.value = text;
                    urlInput.focus();
                }
            } catch (err) {
                console.error('Failed to read clipboard contents: ', err);
                alert('Could not paste from clipboard. Please paste manually.');
            }
        });
    }

    qualitySelect.addEventListener('change', () => savePreference('quality', qualitySelect.value));
    for (const key in formatInputs) {
        formatInputs[key].addEventListener('input', () => savePreference(`format_${key}`, formatInputs[key].value));
    }

    settingsHeader.addEventListener('click', () => {
        const isOpen = customFormatList.classList.toggle('hidden');
        settingsHeader.classList.toggle('open');
        savePreference('format_section_open', !isOpen);
    });

    function handleMouseMove(e) {
        document.body.style.setProperty('--cursor-x', `${e.clientX}px`);
        document.body.style.setProperty('--cursor-y', `${e.clientY}px`);
        document.body.style.setProperty('--cursor-opacity', '1');
    }

    function handleMouseLeave() {
        document.body.style.setProperty('--cursor-opacity', '0');
    }

    function addInteractiveBorderListeners(element) {
        element.addEventListener('mousemove', e => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            element.style.setProperty('--x', `${x}px`);
            element.style.setProperty('--y', `${y}px`);
            element.style.setProperty('--opacity', '1');
        });
        element.addEventListener('mouseleave', () => {
            element.style.setProperty('--opacity', '0');
        });
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.querySelectorAll('.interactive-border').forEach(addInteractiveBorderListeners);

    function getCustomFormatString() {
        const artist = document.getElementById('format-artist').value.trim() || '{artist}';
        const title = document.getElementById('format-title').value.trim() || '{title}';
        const album = document.getElementById('format-album').value.trim();
        let parts = [];
        if (artist) parts.push(artist);
        if (title) parts.push(title);
        let formatString = parts.join(' - ');
        if (album) {
            formatString += ` - ${album}`;
        }
        return formatString;
    }

    async function downloadMedia(event) {
        event.preventDefault();
        const url = urlInput.value.trim();
        if (!url) {
            showError("Please enter a music URL.");
            return;
        }
        submitButton.disabled = true;
        urlFormContainer.style.display = 'none';
        outputArea.innerHTML = '';
        progressContainer.classList.remove('hidden');
        updateProgress(10, "Initializing...");
        try {
            updateProgress(25, "Fetching track information...");
            const isCustomFormatActive = !customFormatList.classList.contains('hidden');
            const customFormat = isCustomFormatActive ? getCustomFormatString() : null;
            const response = await fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    quality: qualitySelect.value,
                    custom_format: customFormat
                })
            });
            updateProgress(75, "Downloading & Converting...");
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || `Server error: ${response.statusText}`);
            }
            updateProgress(100, "Done!");
            setTimeout(() => {
                showResult(data);
                const downloadLink = document.createElement('a');
                downloadLink.href = data.download_url;
                downloadLink.download = data.filename;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                progressContainer.classList.add('hidden');
                urlFormContainer.style.display = 'flex';
            }, 500);
        } catch (e) {
            console.error("Error:", e);
            showError(e.message);
            progressContainer.classList.add('hidden');
            urlFormContainer.style.display = 'flex';
        } finally {
            submitButton.disabled = false;
        }
    }

    window.downloadMedia = downloadMedia;

    function updateProgress(percentage, status) {
        progressBar.style.width = `${percentage}%`;
        progressStatus.textContent = status;
    }

    function showResult(data) {
        const resultCardHTML = `
            <div class="result-card">
                <div class="result-thumbnail-wrapper">
                    <img src="${data.thumbnail}" alt="Thumbnail for ${data.title}" onerror="this.parentElement.style.display='none'">
                </div>
                <div class="result-info">
                    <h2>${data.title}</h2>
                    <p>By: ${data.uploader || 'N/A'} | Duration: ${data.duration || 'N/A'}</p>
                    <div id="download-status">
                        Your download has started! If not, <a href="${data.download_url}" download="${data.filename}">click here</a>.
                    </div>
                </div>
            </div>
        `;
        outputArea.innerHTML = resultCardHTML;
    }

    function showError(message) {
        outputArea.innerHTML = `<div class="error-box">${message}</div>`;
    }

    applySavedPreferences();
});