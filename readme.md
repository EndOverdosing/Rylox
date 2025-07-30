![Rylox Logo](/static/images/github-banner.png)

# Rylox - SoundCloud Downloader

Rylox is a streamlined web app that lets you download SoundCloud audio tracks as MP3 files. Choose your preferred quality and save tracks directly to your device with ease.

## Features

* **SoundCloud Support:** Download any SoundCloud audio track.
* **MP3 Format:** Tracks saved in widely compatible MP3 format.
* **Quality Selection:** Choose bitrate for your downloads.
* **Clean Interface:** Simple, modern UI for straightforward use.
* **Track Info:** See title, artist, and duration before download.
* **Custom Filenames:** Use placeholders like `{title}`, `{artist}` to format filenames.
* **Responsive Design:** Fully functional on desktop and mobile.

## Installation & Usage

1. Clone the repo:

   ```bash
   git clone https://github.com/keepmesmerizing/rylox.git
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

   *Ensure FFmpeg is installed and available in your system PATH.*

3. Start the app:

   ```bash
   python app.py
   ```

   Access at `http://127.0.0.1:5000`.

4. Use the web interface:

   * Open the URL in a browser.
   * Paste the SoundCloud track URL.
   * Select audio quality.
   * (Optional) Set custom filename format.
   * Click download and wait.

## Technology Stack

* Backend: Flask (Python)
* Media Download: `yt-dlp`
* Audio Processing: FFmpeg
* Frontend: HTML, CSS, JavaScript
* Icons: Font Awesome
