function applyThemeImmediately() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

applyThemeImmediately();

function showMainSkeleton() {
    const wrapper = document.querySelector('.main-content-wrapper');
    wrapper.classList.add('loading');

    const isMobile = window.innerWidth <= 600;
    const pasteButtonSkeleton = isMobile
        ? '<div class="paste-button-mobile" style="display: flex;"><div class="skeleton skeleton-icon" style="margin: 0;"></div></div>'
        : '';

    const skeletonHTML = `
<div class="skeleton-wrapper">
    <div style="display: flex; align-items: center;">
        ${pasteButtonSkeleton}
        <div class="skeleton-form" style="flex: 1;">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-input"></div>
            <div class="skeleton-divider"></div>
            <div class="skeleton skeleton-select"></div>
            <div class="skeleton skeleton-button"></div>
        </div>
    </div>
    <div class="skeleton-theme-toggle">
        <div class="skeleton skeleton-theme-icon"></div>
        <div class="skeleton skeleton-theme-text"></div>
    </div>
</div>
    `;

    wrapper.insertAdjacentHTML('afterbegin', skeletonHTML);
}

function hideMainSkeleton() {
    const wrapper = document.querySelector('.main-content-wrapper');
    const skeletonWrapper = wrapper.querySelector('.skeleton-wrapper');
    if (skeletonWrapper) {
        skeletonWrapper.remove();
    }
    wrapper.classList.remove('loading');
}

document.addEventListener('DOMContentLoaded', () => {
    showMainSkeleton();

    setTimeout(() => {
        hideMainSkeleton();

        const urlFormContainer = document.querySelector('.url-form-container');
        const urlInput = document.getElementById('url-input');
        const qualitySelect = document.getElementById('quality-select');
        const submitButton = document.getElementById('submit-button');
        const outputArea = document.getElementById('output-area');
        const themeSwitcher = document.getElementById('theme-switcher');
        const mobilePasteButton = document.getElementById('paste-button-mobile');

        const savePreference = (key, value) => localStorage.setItem(key, value);
        const getPreference = (key) => localStorage.getItem(key);

        function applySavedPreferences() {
            const savedTheme = getPreference('theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
                themeSwitcher.innerHTML = '<i class="fa-solid fa-sun"></i><span>Light Mode</span>';
            } else {
                themeSwitcher.innerHTML = '<i class="fa-solid fa-moon"></i><span>Dark Mode</span>';
            }

            const savedQuality = getPreference('quality');
            if (savedQuality) {
                qualitySelect.value = savedQuality;
            }
        }

        themeSwitcher.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');

            themeSwitcher.innerHTML = isLight
                ? '<i class="fa-solid fa-sun"></i><span>Light Mode</span>'
                : '<i class="fa-solid fa-moon"></i><span>Dark Mode</span>';

            savePreference('theme', isLight ? 'light' : 'dark');
        });

        if (mobilePasteButton) {
            mobilePasteButton.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        urlInput.value = text;
                        urlInput.focus();
                    }
                } catch {
                    alert('Clipboard access failed.');
                }
            });
        }

        qualitySelect.addEventListener('change', () =>
            savePreference('quality', qualitySelect.value)
        );

        function showSkeletonLoading() {
            const isMobile = window.innerWidth <= 600;

            outputArea.innerHTML = `
    <div class="result-card loading">
        <div class="result-background-overlay"></div>
        <div class="drag-handle"></div>
        <div class="result-card-inner">
            <div class="result-thumbnail-wrapper">
                <div class="skeleton skeleton-thumbnail"></div>
            </div>
            <div class="result-info">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text-short" style="margin-top: 0.5rem;"></div>
                <div class="skeleton skeleton-text-mini" style="margin-top: 0.75rem;"></div>
            </div>
        </div>
    </div>
    `;

            const card = outputArea.querySelector('.result-card');
            if (card) card.classList.add('loading');

            if (isMobile) {
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.height = '100%';

                const backdrop = document.createElement('div');
                backdrop.className = 'overlay-backdrop';
                document.body.appendChild(backdrop);
                setTimeout(() => backdrop.classList.add('active'), 10);

                outputArea.classList.add('active');
                setupMobileDrag();
            }
        }

        async function downloadMedia(event) {
            event.preventDefault();

            const url = urlInput.value.trim();

            const existingError = document.querySelector('.error-box');
            if (existingError) existingError.remove();

            if (!url) {
                showError('Please enter a music URL.');
                return;
            }

            submitButton.disabled = true;

            showSkeletonLoading();

            try {
                const response = await fetch('/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url,
                        quality: qualitySelect.value
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Download failed.');
                }

                showResult(data);

            } catch (e) {
                showError(e.message);
                outputArea.innerHTML = '';
            } finally {
                submitButton.disabled = false;
            }
        }

        window.downloadMedia = downloadMedia;

        function showResult(data) {
            const isMobile = window.innerWidth <= 600;

            const cardHTML = `
    <div class="result-card">
        <div class="result-background-overlay" style="background-image: url('${data.thumbnail || ''}');"></div>
        <div class="drag-handle"></div>
        <div class="result-card-inner">
            <div class="result-thumbnail-wrapper"></div>
            <div class="result-info">
                <h2>${data.title || 'Untitled'}</h2>
                <p class="result-meta">${data.uploader || 'Unknown'} • ${data.duration || 'N/A'}</p>
                <div class="download-status">
                    <a href="${data.download_url}" download="${data.filename}">Tap to download</a>
                </div>
            </div>
        </div>
    </div>
    `;

            outputArea.innerHTML = cardHTML;

            const card = outputArea.querySelector('.result-card');
            if (card) card.classList.remove('loading');

            if (isMobile) {
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.height = '100%';
                outputArea.classList.add('active');
                setupMobileDrag();
            }
        }

        function showError(message) {
            const existingError = document.querySelector('.error-box');
            if (existingError) existingError.remove();

            const errorBox = document.createElement('div');
            errorBox.className = 'error-box';
            errorBox.textContent = message;

            const urlForm = document.querySelector('.url-form-container');
            urlForm.insertAdjacentElement('afterend', errorBox);

            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        }

        function setupMobileDrag() {
            const resultCard = document.querySelector('.result-card');
            const thumbnail = document.querySelector('.result-thumbnail-wrapper');
            if (!resultCard || !thumbnail) return;

            let startY = 0;
            let currentY = 0;
            let isDragging = false;

            const handleStart = (e) => {
                isDragging = true;
                startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
                resultCard.style.transition = 'none';
                outputArea.style.transition = 'none';
            };

            const handleMove = (e) => {
                if (!isDragging) return;

                currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                const diff = currentY - startY;

                if (diff > 0) {
                    outputArea.style.transform = `translateY(${diff}px)`;
                }
            };

            const handleEnd = () => {
                if (!isDragging) return;
                isDragging = false;

                const diff = currentY - startY;
                resultCard.style.transition = '';
                outputArea.style.transition = '';

                if (diff > 100) {
                    closeMobileOverlay();
                } else {
                    outputArea.style.transform = 'translateY(0)';
                }
            };

            thumbnail.addEventListener('touchstart', handleStart, { passive: true });
            thumbnail.addEventListener('mousedown', handleStart);
            document.addEventListener('touchmove', handleMove, { passive: true });
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('touchend', handleEnd);
            document.addEventListener('mouseup', handleEnd);
        }

        function closeMobileOverlay() {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';

            const backdrop = document.querySelector('.overlay-backdrop');
            outputArea.classList.remove('active');
            if (backdrop) {
                backdrop.classList.remove('active');
                setTimeout(() => backdrop.remove(), 300);
            }
            outputArea.style.transform = '';
        }

        applySavedPreferences();
    }, 1000);
});