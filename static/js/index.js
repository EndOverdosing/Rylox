document.addEventListener('DOMContentLoaded', () => {
    const save = (k, v) => localStorage.setItem(k, v);
    const load = k => localStorage.getItem(k);
    const q = s => document.querySelector(s);
    const qa = s => document.querySelectorAll(s);

    const ui = {
        urlForm: q('.url-form-container'),
        urlInput: q('#url-input'),
        quality: q('#quality-select'),
        submit: q('#submit-button'),
        output: q('#output-area'),
        progressBox: q('#progress-container'),
        progressBar: q('#progress-bar'),
        progressText: q('#progress-status'),
        filenameToggle: q('#filename-toggle'),
        filenameContent: q('.filename-content'),
        filenamePattern: q('#filename-pattern'),
        mobilePaste: q('#paste-button-mobile'),
        settingsBtn: q('#settings-trigger'),
        settingsOverlay: q('#settings-overlay'),
        settingsClose: q('#settings-close'),
        settingsApply: q('#settings-apply-btn'),
        settingsNav: qa('.settings-nav-btn'),
        settingsTabs: qa('.settings-tab'),
        themeOptions: qa('.theme-option'),
        blurRange: q('#setting-blur-intensity'),
        blurVal: q('#setting-blur-val'),
        fontRange: q('#setting-font-size'),
        fontVal: q('#setting-font-size-val'),
        reducedMotion: q('#setting-reduced-motion'),
        opendyslexic: q('#setting-opendyslexic'),
        autoDownload: q('#auto-download'),
        minimalMode: q('#minimal-mode'),
        defaultQuality: q('#default-quality'),
        helpBtn: q('#help-btn'),
        helpOverlay: q('#help-overlay'),
        helpClose: q('#help-overlay .details-overlay-close'),
        helpSearch: q('#help-search-input'),
        helpArticles: q('#help-articles-container'),
        noHelp: q('#no-results-message'),
        hamburger: q('#hamburgerBtn'),
        dropdown: q('#dropdownMenu'),
        dropdownSettings: q('#settings-btn'),
        dropdownHelp: q('#help-btn'),
        minimalHero: q('#minimal-hero-container'),
        heroParticles: q('#hero-particles'),
        greeting: q('#greeting-text'),
        mainContent: q('.main-content'),
        urlFormContainer: q('#url-form-container'),
    };

    const state = {
        theme: load('rylox_theme') || 'default',
        blur: Number(load('rylox_blur') || 1),
        fontSize: Number(load('rylox_font') || 14.5),
        reduced: load('rylox_reduced') === 'true',
        dyslexic: load('rylox_dyslexic') === 'true',
        autoDL: load('rylox_auto') === 'true',
        minimal: load('rylox_minimal') !== 'false',
        quality: load('rylox_quality') || '192',
        customFormat: load('rylox_format') || '',
        filenameOn: load('rylox_filename') === 'true'
    };

    console.log('Initial minimal state:', state.minimal);
    console.log('Main content element:', ui.mainContent);
    console.log('Minimal hero element:', ui.minimalHero);

    const setActiveThemeButton = () => {
        ui.themeOptions.forEach(opt => {
            opt.classList.remove('active');
            const indicator = opt.querySelector('.active-indicator');
            indicator.style.opacity = '0';
            indicator.style.transform = 'scale(0.5)';
            if (opt.dataset.theme === state.theme) {
                opt.classList.add('active');
                const activeIndicator = opt.querySelector('.active-indicator');
                activeIndicator.style.opacity = '1';
                activeIndicator.style.transform = 'scale(1)';
            }
        });
    };

    const loadSettingsFromStorage = () => {
        state.theme = load('rylox_theme') || 'default';
        state.blur = Number(load('rylox_blur') || 1);
        state.fontSize = Number(load('rylox_font') || 14.5);
        state.reduced = load('rylox_reduced') === 'true';
        state.dyslexic = load('rylox_dyslexic') === 'true';
        state.autoDL = load('rylox_auto') === 'true';
        state.minimal = load('rylox_minimal') !== 'false';
        state.quality = load('rylox_quality') || '192';
        state.customFormat = load('rylox_format') || '';
        state.filenameOn = load('rylox_filename') === 'true';
    };

    const populateSettingsForm = () => {
        ui.autoDownload.checked = state.autoDL;
        ui.minimalMode.checked = state.minimal;
        ui.defaultQuality.value = state.quality;
        ui.filenameToggle.checked = state.filenameOn;
        ui.filenameContent.classList.toggle('hidden', !state.filenameOn);
        if (state.filenameOn && state.customFormat) ui.filenamePattern.value = state.customFormat;
        ui.blurRange.value = state.blur;
        ui.blurVal.textContent = state.blur.toFixed(1);
        ui.fontRange.value = state.fontSize;
        ui.fontVal.textContent = state.fontSize.toFixed(1);
        ui.reducedMotion.checked = state.reduced;
        ui.opendyslexic.checked = state.dyslexic;
        setActiveThemeButton();
    };

    const saveSettings = () => {
        state.theme = ui.themeOptions[0].parentElement.querySelector('.active')?.dataset.theme || 'default';
        state.blur = Number(ui.blurRange.value);
        state.fontSize = Number(ui.fontRange.value);
        state.reduced = ui.reducedMotion.checked;
        state.dyslexic = ui.opendyslexic.checked;
        state.autoDL = ui.autoDownload.checked;
        state.minimal = ui.minimalMode.checked;
        state.quality = ui.defaultQuality.value;
        state.customFormat = ui.filenamePattern.value;
        state.filenameOn = ui.filenameToggle.checked;

        save('rylox_theme', state.theme);
        save('rylox_blur', state.blur);
        save('rylox_font', state.fontSize);
        save('rylox_reduced', state.reduced);
        save('rylox_dyslexic', state.dyslexic);
        save('rylox_auto', state.autoDL);
        save('rylox_minimal', state.minimal);
        save('rylox_quality', state.quality);
        save('rylox_format', state.customFormat);
        save('rylox_filename', state.filenameOn);

        applySettings();
    };

    const openSettings = () => {
        loadSettingsFromStorage();
        populateSettingsForm();
        ui.settingsOverlay.classList.add('active');
        document.body.classList.add('overlay-open');

        const settingsPane = q('#settings-overlay .details-overlay-pane');
        if (settingsPane) {
            settingsPane.style.transform = 'translateY(0px)';
            settingsPane.style.transition = 'none';
            requestAnimationFrame(() => {
                settingsPane.style.transition = '';
            });
        }
    };

    const closeSettings = () => {
        ui.settingsOverlay.classList.remove('active');
        document.body.classList.remove('overlay-open');

        const settingsPane = q('#settings-overlay .details-overlay-pane');
        if (settingsPane) {
            settingsPane.style.transform = 'translateY(100%)';
        }
    };

    const openHelp = () => {
        ui.helpOverlay.classList.add('active');
        document.body.classList.add('overlay-open');

        const helpPane = q('#help-overlay .details-overlay-pane');
        if (helpPane) {
            helpPane.style.transform = 'translateY(0px)';
            helpPane.style.transition = 'none';
            requestAnimationFrame(() => {
                helpPane.style.transition = '';
            });
        }
    };

    const closeHelp = () => {
        ui.helpOverlay.classList.remove('active');
        document.body.classList.remove('overlay-open');

        const helpPane = q('#help-overlay .details-overlay-pane');
        if (helpPane) {
            helpPane.style.transform = 'translateY(100%)';
        }
    };

    const toggleDropdown = () => {
        const expanded = ui.hamburger.getAttribute('aria-expanded') === 'true';
        ui.hamburger.setAttribute('aria-expanded', !expanded);
        ui.dropdown.classList.toggle('visible');
    };

    const closeDropdown = () => {
        ui.hamburger.setAttribute('aria-expanded', 'false');
        ui.dropdown.classList.remove('visible');
    };

    const getCustomFormat = () => {
        if (!ui.filenameToggle.checked) return null;
        return ui.filenamePattern.value.trim() || '{artist} - {title}';
    };

    const updateProgress = (p, t) => {
        ui.progressBar.style.width = `${p}%`;
        ui.progressText.textContent = t;
    };

    const showResult = d => {
        hideFormSkeleton();
        ui.output.innerHTML = `
    <div class="result-card">
        <div class="result-thumbnail-wrapper">
            <img src="${d.thumbnail}" alt="cover" onerror="this.parentElement.style.display='none'">
        </div>
        <div class="result-info">
            <h2>${d.title}</h2>
            <p>By: ${d.uploader || 'N/A'} | Duration: ${d.duration || 'N/A'}</p>
            <div id="download-status">
                Download started. If not, <a href="${d.download_url}" download="${d.filename}">click here</a>.
            </div>
        </div>
    </div>`;

        const a = document.createElement('a');
        a.href = d.download_url;
        a.download = d.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        ui.progressBox.classList.add('hidden');
        ui.submit.disabled = false;
    };

    const showError = m => {
        hideFormSkeleton();
        ui.output.innerHTML = `<div class="error-box">${m}</div>`;
        ui.progressBox.classList.add('hidden');
        ui.submit.disabled = false;
    };

    const showFormSkeleton = () => {
        if (ui.urlFormContainer) {
            ui.urlFormContainer.classList.add('loading');
        }
    };

    const hideFormSkeleton = () => {
        if (ui.urlFormContainer) {
            ui.urlFormContainer.classList.remove('loading');
        }
    };

    const downloadMedia = async e => {
        if (e) e.preventDefault();
        const url = ui.urlInput.value.trim();
        if (!url) return showError('Please enter a SoundCloud URL.');

        ui.submit.disabled = true;
        ui.output.innerHTML = '';
        ui.progressBox.classList.remove('hidden');
        showFormSkeleton();

        updateProgress(10, 'Validating URL...');

        try {
            updateProgress(30, 'Fetching track info...');

            const format = getCustomFormat();
            const r = await fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    quality: ui.quality.value,
                    custom_format: format
                })
            });

            updateProgress(60, 'Processing audio...');

            if (!r.ok) {
                const err = await r.json();
                throw new Error(err.error || 'Server error');
            }

            const d = await r.json();

            updateProgress(90, 'Finalizing download...');

            if (!d.success) throw new Error(d.error || 'Download failed');

            updateProgress(100, 'Done!');

            setTimeout(() => {
                hideFormSkeleton();
                showResult(d);
            }, 500);

        } catch (err) {
            console.error(err);
            hideFormSkeleton();
            showError(err.message);
        }
    };

    const pasteMobile = async () => {
        try {
            const t = await navigator.clipboard.readText();
            if (t) {
                ui.urlInput.value = t;
                ui.urlInput.focus();
            }
        } catch {
            alert('Could not paste. Please paste manually.');
        }
    };

    const initParticles = () => {
        const el = document.getElementById('hero-particles');
        if (!el || el.children.length) return;

        const icons = [
            'fa-snowflake', 'fa-tree', 'fa-gift', 'fa-sleigh',
            'fa-stocking', 'fa-candy-cane', 'fa-presents', 'fa-reindeer'
        ];

        for (let i = 0; i < 100; i++) {
            const p = document.createElement('i');
            p.className = `fas ${icons[(Math.random() * icons.length) | 0]} particle`;

            const size = 0.85 + Math.random() * 0.7;
            const left = Math.random() * 100;
            const yOffset = Math.random() * 200;
            const duration = 10 + Math.random() * 20;
            const delay = -Math.random() * 25;
            const rotation = (90 + Math.random() * 180) * (Math.random() > 0.5 ? 1 : -1);
            const opacity = 0.3 + Math.random() * 0.5;
            const blur = Math.random();

            p.style.setProperty('--p-left', `${left}%`);
            p.style.setProperty('--p-size', `${size}rem`);
            p.style.setProperty('--p-duration', `${duration}s`);
            p.style.setProperty('--p-delay', `${delay}s`);
            p.style.setProperty('--p-rotation', `${rotation}deg`);
            p.style.setProperty('--p-opacity', opacity);
            p.style.setProperty('--p-blur', `${blur}px`);
            p.style.setProperty('--p-y-offset', `${yOffset}px`);

            el.appendChild(p);
        }
    };

    const updateGreeting = () => {
        if (!ui.greeting) return;
        const h = new Date().getHours();
        let g = [];
        if (h >= 5 && h < 12) g = ['Good morning.<br>Ready for fresh beats?', 'Rise and shine.<br>What are we listening to?', 'Morning vibes.<br>Pick your soundtrack.'];
        else if (h >= 12 && h < 17) g = ['Good afternoon.<br>Time for a break?', 'Afternoon chill.<br>Dive into new sounds.', 'Midday mood.<br>What\'s next?'];
        else g = ['Good evening.<br>Unwind with music.', 'Night time.<br>Let\'s find a gem.', 'Late night?<br>We got you.'];
        ui.greeting.innerHTML = g[Math.floor(Math.random() * g.length)];
    };

    const loadMinimalHero = () => {
        if (!ui.minimalHero) return;

        if (ui.minimalHero.classList.contains('hidden')) {
            console.log('loadMinimalHero: Skipping because hero is hidden');
            return;
        }

        console.log('loadMinimalHero: Starting...');

        const content = q('#minimal-hero-content');
        const skeleton = q('#minimal-hero-skeleton');
        if (!content || !skeleton) return;

        content.classList.remove('active');
        content.style.opacity = '0';
        content.style.display = 'none';

        skeleton.style.display = 'flex';
        skeleton.style.opacity = '1';

        updateGreeting();
        initParticles();

        setTimeout(() => {
            skeleton.style.opacity = '0';
            setTimeout(() => {
                skeleton.style.display = 'none';
                content.style.display = 'flex';
                requestAnimationFrame(() => {
                    content.style.opacity = '1';
                    content.classList.add('active');
                    console.log('loadMinimalHero: Completed');
                });
            }, 300);
        }, 800);
    };

    if (ui.minimalMode) {
        ui.minimalMode.addEventListener('change', () => {
            const isMinimal = ui.minimalMode.checked;
            console.log('Minimal mode toggled:', isMinimal);

            if (ui.minimalHero && ui.mainContent) {
                if (isMinimal) {
                    ui.minimalHero.style.display = 'flex';
                    ui.minimalHero.style.opacity = '0';

                    setTimeout(() => {
                        ui.minimalHero.style.opacity = '1';
                    }, 10);

                    loadMinimalHero();

                    ui.mainContent.style.opacity = '0';
                    setTimeout(() => {
                        ui.mainContent.style.display = 'none';
                    }, 300);
                } else {
                    ui.minimalHero.style.opacity = '0';
                    setTimeout(() => {
                        ui.minimalHero.style.display = 'none';
                    }, 300);

                    ui.mainContent.style.display = 'block';
                    ui.mainContent.style.opacity = '0';
                    setTimeout(() => {
                        ui.mainContent.style.opacity = '1';
                    }, 50);
                }
            }
        });
    }

    const applySettings = () => {
        console.log('applySettings: minimal =', state.minimal);

        document.documentElement.setAttribute('data-theme', state.theme);
        document.documentElement.style.setProperty('--glass-blur-intense', `${10 * state.blur}px`);
        document.documentElement.style.setProperty('--glass-blur-moderate', `${9 * state.blur}px`);
        document.documentElement.style.setProperty('--glass-blur-subtle', `${5 * state.blur}px`);
        document.documentElement.style.setProperty('--base-font-size', `${state.fontSize}px`);
        document.body.classList.toggle('reduce-motion', state.reduced);
        document.body.classList.toggle('opendyslexic', state.dyslexic);

        if (state.theme === 'light-theme') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }

        if (ui.mainContent && ui.minimalHero) {
            if (state.minimal) {
                ui.mainContent.style.display = 'none';
                ui.mainContent.style.opacity = '0';
                ui.mainContent.classList.remove('no-minimal');

                ui.minimalHero.style.display = 'flex';
                ui.minimalHero.style.opacity = '1';
                loadMinimalHero();
            } else {
                ui.minimalHero.style.display = 'none';
                ui.minimalHero.style.opacity = '0';

                ui.mainContent.style.display = 'block';
                ui.mainContent.style.opacity = '1';
                ui.mainContent.classList.add('no-minimal');
            }
        }
    };

    loadSettingsFromStorage();
    applySettings();
    populateSettingsForm();

    console.log('Initial state - minimal:', state.minimal);

    if (state.minimal) {
        console.log('Setting up minimal mode');
        if (ui.minimalHero) {
            ui.minimalHero.classList.remove('hidden');
            loadMinimalHero();
        }
        if (ui.mainContent) {
            ui.mainContent.classList.add('hidden');
        }
    } else {
        console.log('Setting up normal mode');
        if (ui.minimalHero) {
            ui.minimalHero.classList.add('hidden');
        }
        if (ui.mainContent) {
            ui.mainContent.classList.remove('hidden');
        }
    }

    function showInitialSkeleton() {
        const urlFormContainer = document.querySelector('#url-form-container');
        const heroHeader = document.querySelector('.hero-header');
        const logoImg = document.querySelector('.hero-header .logo');

        if (urlFormContainer) {
            urlFormContainer.classList.add('loading');
        }

        if (heroHeader) {
            heroHeader.classList.add('loading');
        }

        if (logoImg) {
            const originalSrc = logoImg.src;
            logoImg.dataset.originalSrc = originalSrc;
            logoImg.src = '/static/images/transparent.png';
        }

        setTimeout(() => {
            if (urlFormContainer) {
                urlFormContainer.classList.remove('loading');
            }
            if (heroHeader) {
                heroHeader.classList.remove('loading');
            }
            if (logoImg && logoImg.dataset.originalSrc) {
                logoImg.src = logoImg.dataset.originalSrc;
                delete logoImg.dataset.originalSrc;
            }
        }, 1500);
    }

    showInitialSkeleton();

    const setupOverlayDragging = (overlay, pane, dragHandle) => {
        let startY = 0;
        let startTranslateY = 0;
        let isDragging = false;
        let currentTranslateY = 0;

        const startDrag = (e) => {
            isDragging = true;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            startY = clientY;

            const computedStyle = window.getComputedStyle(pane);
            const matrix = new DOMMatrixReadOnly(computedStyle.transform);
            startTranslateY = matrix.m42;
            currentTranslateY = startTranslateY;

            pane.style.transition = 'none';
            pane.style.transform = `translateY(${currentTranslateY}px)`;

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', stopDrag);

            e.preventDefault();
            return false;
        };

        const drag = (e) => {
            if (!isDragging) return;

            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = clientY - startY;

            currentTranslateY = startTranslateY + deltaY;
            if (currentTranslateY < 0) currentTranslateY = 0;

            pane.style.transform = `translateY(${currentTranslateY}px)`;

            e.preventDefault();
            return false;
        };

        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;

            pane.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            const paneHeight = pane.offsetHeight;
            const threshold = paneHeight * 0.2;

            if (currentTranslateY > threshold) {
                if (overlay === ui.settingsOverlay) {
                    closeSettings();
                } else if (overlay === ui.helpOverlay) {
                    closeHelp();
                }
                pane.style.transform = 'translateY(100%)';
            } else {
                pane.style.transform = 'translateY(0px)';
            }

            currentTranslateY = 0;

            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', stopDrag);

            e.preventDefault();
            return false;
        };

        if (dragHandle) {
            dragHandle.addEventListener('mousedown', startDrag);
            dragHandle.addEventListener('touchstart', startDrag, { passive: false });
        }

        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) {
                if (overlay === ui.settingsOverlay) {
                    closeSettings();
                } else if (overlay === ui.helpOverlay) {
                    closeHelp();
                }
            }
        });
    };

    const applyBlur = () => {
        if (ui.blurVal) ui.blurVal.textContent = Number(ui.blurRange.value).toFixed(1);
    };

    const applyFont = () => {
        if (ui.fontVal) ui.fontVal.textContent = Number(ui.fontRange.value).toFixed(1);
    };

    if (ui.settingsBtn) ui.settingsBtn.addEventListener('click', openSettings);
    if (ui.settingsClose) ui.settingsClose.addEventListener('click', closeSettings);

    if (ui.settingsApply) {
        ui.settingsApply.addEventListener('click', () => {
            saveSettings();
            closeSettings();
        });
    }

    if (ui.hamburger) ui.hamburger.addEventListener('click', toggleDropdown);

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('touchmove', handleGlobalMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleGlobalMouseLeave);
    document.addEventListener('touchend', handleGlobalMouseLeave);

    document.addEventListener('click', e => {
        if (!e.target.closest('.hamburger-menu') && !e.target.closest('.dropdown-menu') && ui.dropdown) {
            closeDropdown();
        }
    });

    if (ui.dropdownSettings) {
        ui.dropdownSettings.addEventListener('click', () => {
            closeDropdown();
            openSettings();
        });
    }

    if (ui.dropdownHelp) {
        ui.dropdownHelp.addEventListener('click', () => {
            closeDropdown();
            openHelp();
        });
    }

    if (ui.filenameToggle) {
        ui.filenameToggle.addEventListener('change', e => {
            if (ui.filenameContent) {
                ui.filenameContent.classList.toggle('hidden', !e.target.checked);
            }
        });
    }

    if (ui.mobilePaste) ui.mobilePaste.addEventListener('click', pasteMobile);
    if (ui.submit) ui.submit.addEventListener('click', downloadMedia);
    if (ui.blurRange) ui.blurRange.addEventListener('input', applyBlur);
    if (ui.fontRange) ui.fontRange.addEventListener('input', applyFont);

    if (qa('.preset-btn').length) {
        qa('.preset-btn').forEach(b => {
            b.addEventListener('click', () => {
                qa('.preset-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                if (ui.filenamePattern) {
                    ui.filenamePattern.value = b.dataset.preset.replace(/-/g, ' - ');
                }
            });
        });
    }

    if (qa('.tag').length) {
        qa('.tag').forEach(t => {
            t.addEventListener('click', () => {
                if (ui.filenamePattern) {
                    ui.filenamePattern.value += t.dataset.tag;
                }
            });
        });
    }

    if (ui.settingsNav.length) {
        ui.settingsNav.forEach(btn => {
            btn.addEventListener('click', () => {
                ui.settingsNav.forEach(b => b.classList.remove('active'));
                ui.settingsTabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                const tab = q(`#${btn.dataset.tab}-tab`);
                if (tab) tab.classList.add('active');
            });
        });
    }

    if (ui.themeOptions.length) {
        ui.themeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                qa('.theme-option').forEach(x => {
                    x.classList.remove('active');
                    const indicator = x.querySelector('.active-indicator');
                    if (indicator) {
                        indicator.style.opacity = '0';
                        indicator.style.transform = 'scale(0.5)';
                    }
                });
                opt.classList.add('active');
                const ind = opt.querySelector('.active-indicator');
                if (ind) {
                    ind.style.opacity = '1';
                    ind.style.transform = 'scale(1)';
                }
            });
        });
    }

    const helpSearch = () => {
        if (!ui.helpSearch || !ui.helpArticles || !ui.noHelp) return;
        const v = ui.helpSearch.value.toLowerCase();
        const articles = qa('.help-article');
        let has = false;
        articles.forEach(a => {
            const match = a.textContent.toLowerCase().includes(v);
            a.style.display = match ? 'block' : 'none';
            if (match) has = true;
        });
        ui.noHelp.style.display = has ? 'none' : 'flex';
    };

    if (ui.helpSearch) ui.helpSearch.addEventListener('input', helpSearch);

    if (ui.settingsOverlay) {
        ui.settingsOverlay.addEventListener('click', e => {
            if (e.target === ui.settingsOverlay || e.target.classList.contains('details-overlay-backdrop')) {
                closeSettings();
            }
        });
    }

    if (ui.helpOverlay) {
        ui.helpOverlay.addEventListener('click', e => {
            if (e.target === ui.helpOverlay || e.target.classList.contains('details-overlay-backdrop')) {
                closeHelp();
            }
        });

        if (ui.helpClose) {
            ui.helpClose.addEventListener('click', closeHelp);
        }
    }

    setTimeout(() => {
        const settingsPane = q('#settings-overlay .details-overlay-pane');
        const settingsDragHandle = q('#settings-overlay .drag-handle');
        const helpPane = q('#help-overlay .details-overlay-pane');
        const helpDragHandle = q('#help-overlay .drag-handle');

        if (settingsPane) {
            setupOverlayDragging(ui.settingsOverlay, settingsPane, settingsDragHandle);
        }

        if (helpPane) {
            setupOverlayDragging(ui.helpOverlay, helpPane, helpDragHandle);
        }
    }, 100);

    window.downloadMedia = downloadMedia;

    setTimeout(() => {
        applyInteractiveBorders();

        document.querySelectorAll('.interactive-border').forEach(element => {
            addInteractiveBorderListeners(element);
        });
    }, 300);

    setTimeout(() => {
        console.log('Emergency fix: Checking minimal hero state');
        if (ui.minimalHero && ui.mainContent) {
            if (state.minimal) {
                console.log('Emergency: Forcing minimal mode ON');
                ui.minimalHero.classList.remove('hidden');
                ui.minimalHero.style.display = 'flex';
                ui.mainContent.style.display = 'none';
                ui.mainContent.classList.remove('no-minimal');

                if (ui.heroParticles && ui.heroParticles.children.length === 0) {
                    initParticles();
                }
            } else {
                console.log('Emergency: Forcing minimal mode OFF');
                ui.minimalHero.classList.add('hidden');
                ui.minimalHero.style.display = 'none';
                ui.mainContent.style.display = 'block';
                ui.mainContent.classList.add('no-minimal');
            }
        }
    }, 100);

    const addInteractiveBorderToForm = () => {
        const urlForm = q('.url-form');
        if (urlForm && !urlForm.dataset.interactiveBorderInit) {
            urlForm.classList.add('js-interactive-border');
            addInteractiveBorderListeners(urlForm);
            urlForm.dataset.interactiveBorderInit = 'true';
        }
    };

    setTimeout(() => {
        addInteractiveBorderToForm();
    }, 100);
});

let mouseMoveRaf;

function handleGlobalMouseMove(e) {
    if (mouseMoveRaf) return;
    mouseMoveRaf = requestAnimationFrame(() => {
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        if (x !== undefined && y !== undefined) {
            document.documentElement.style.setProperty('--cursor-x', `${x}px`);
            document.documentElement.style.setProperty('--cursor-y', `${y}px`);
            document.documentElement.style.setProperty('--cursor-opacity', '1');
        }
        mouseMoveRaf = null;
    });
}

function handleGlobalMouseLeave() {
    document.documentElement.style.setProperty('--cursor-opacity', '0');
}

function addInteractiveBorderListeners(element) {
    let rect = null;
    let rafId = null;
    let leaveTimeout;

    const updateRect = () => {
        rect = element.getBoundingClientRect();
    };

    const handleMove = (clientX, clientY) => {
        clearTimeout(leaveTimeout);
        if (!rect) updateRect();

        if (rafId) return;

        rafId = requestAnimationFrame(() => {
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            element.style.setProperty('--x', `${x}px`);
            element.style.setProperty('--y', `${y}px`);
            element.style.setProperty('--opacity', '1');
            rafId = null;
        });
    };

    const handleLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        element.style.setProperty('--opacity', '0');
    };

    element.addEventListener('mouseenter', updateRect);
    element.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
    element.addEventListener('mouseleave', handleLeave);

    element.addEventListener('touchstart', e => {
        updateRect();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    element.addEventListener('touchmove', e => handleMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

    element.addEventListener('touchend', () => {
        leaveTimeout = setTimeout(handleLeave, 500);
    });

    element.addEventListener('touchcancel', handleLeave);
}

function applyInteractiveBorders() {
    const selectors = [
        '.nav-search-container',
        '.dropdown-menu',
        '.details-overlay-pane',
        '#help-search-input',
        '.hero-search-wrapper',
        '.filename-settings',
        '.help-search-wrapper',
        '.theme-preview-card',
        '.paste-button-mobile',
        '.result-card',
        'result-info'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach(element => {
        if (element.dataset.interactiveBorderInit) return;

        element.classList.add('js-interactive-border');
        addInteractiveBorderListeners(element);
        element.dataset.interactiveBorderInit = 'true';
    });
}