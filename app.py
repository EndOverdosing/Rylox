from flask import Flask, request, jsonify, send_from_directory, render_template_string, Response
import os
import yt_dlp
import logging
import re
from urllib.parse import quote, unquote
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__, static_folder='static')

STATIC_FOLDER = 'static'
DOWNLOADS_FOLDER = os.path.join(STATIC_FOLDER, 'downloads')

for subfolder in ['js', 'styling', 'images', 'downloads']:
    path = os.path.join(STATIC_FOLDER, subfolder)
    if not os.path.exists(path):
        os.makedirs(path)

@app.route('/')
def home():
    """Serves the main HTML page."""
    try:
        with open('index.html', encoding='utf-8') as f:
            return render_template_string(f.read())
    except FileNotFoundError:
        return "index.html not found.", 404

@app.route('/favicon.ico')
def favicon():
    """Serves the favicon."""
    return send_from_directory(os.path.join(app.root_path, 'static', 'images'),
                               'icon.png', mimetype='image/png')

@app.route('/thumbnail')
def thumbnail_proxy():
    """Fetches and serves a thumbnail image to bypass hotlinking protection."""
    image_url = request.args.get('url')
    if not image_url:
        return "Missing image URL", 400

    try:
        s = requests.Session()
        s.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
        
        resp = s.get(unquote(image_url), stream=True, timeout=10)
        resp.raise_for_status()

        return Response(resp.iter_content(chunk_size=1024), content_type=resp.headers['Content-Type'])

    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to proxy thumbnail {image_url}: {e}")
        return "Failed to fetch image", 502


def sanitize_filename(filename):
    """Removes illegal characters from a filename."""
    return re.sub(r'[\\/*?:"<>|]', "", filename).strip()

def get_formatted_filename(custom_format, info):
    """Formats the filename based on a custom user-defined format."""
    replacements = {
        '{title}': info.get('title', 'N/A'),
        '{artist}': info.get('artist') or info.get('uploader', 'N/A'),
        '{album}': info.get('album', 'N/A'),
    }

    formatted_name = custom_format
    if not formatted_name.strip():
        logging.warning("Custom format string was empty, falling back to default.")
        return sanitize_filename(info.get('title', 'untitled_audio'))

    for placeholder, value in replacements.items():
        if value:
            formatted_name = formatted_name.replace(placeholder, str(value))

    return sanitize_filename(formatted_name)

@app.route('/download', methods=['POST'])
def download():
    """Handles the download request, restricted to SoundCloud URLs."""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid request."}), 400

    url = data.get('url')
    quality = data.get('quality', '192')
    custom_format = data.get('custom_format')

    logging.info(f"Received download request. URL: {url}, Quality: {quality}")
    if custom_format:
        logging.info(f"Custom format template: '{custom_format}'")

    if not url:
        return jsonify({"success": False, "error": "URL is required."}), 400

    if not re.search(r'https?://(www\.)?soundcloud\.com/', url):
        logging.warning(f"Rejected non-SoundCloud URL: {url}")
        return jsonify({"success": False, "error": "Only SoundCloud URLs are supported."}), 400

    common_ydl_opts = {
        'nopart': True,
        'http_headers': {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'},
        'geo_bypass': True,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        logging.info("Extracting media info...")
        with yt_dlp.YoutubeDL(common_ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        logging.info(f"Successfully extracted info for '{info.get('title')}'")

        if custom_format:
            safe_title = get_formatted_filename(custom_format, info)
        else:
            safe_title = sanitize_filename(info.get('title', 'untitled_audio'))

        if not safe_title:
             safe_title = sanitize_filename(info.get('id', 'untitled_audio'))

        logging.info(f"Sanitized filename will be: '{safe_title}'")

        output_template = os.path.join(DOWNLOADS_FOLDER, f'{safe_title}.%(ext)s')

        ydl_opts = {
            **common_ydl_opts,
            'outtmpl': output_template,
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': quality,
            }],
        }

        logging.info("Starting download and conversion with yt-dlp...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([info['webpage_url']])
        logging.info("Download and conversion finished.")

        final_filename_mp3 = f'{safe_title}.mp3'
        final_filepath = os.path.join(DOWNLOADS_FOLDER, final_filename_mp3)

        if not os.path.exists(final_filepath):
            logging.error(f"File not found after download: {final_filepath}")
            raise FileNotFoundError("Could not find the converted MP3 file after processing.")

        download_url = f"/static/downloads/{quote(final_filename_mp3)}"
        
        thumbnail_url = ""
        original_thumbnail = info.get("thumbnail")
        if original_thumbnail:
            thumbnail_url = f"/thumbnail?url={quote(original_thumbnail)}"

        duration_seconds = info.get("duration")
        duration_str = "N/A"
        if duration_seconds:
            m, s = divmod(duration_seconds, 60)
            h, m = divmod(m, 60)
            duration_str = f"{int(h):02d}:{int(m):02d}:{int(s):02d}" if h > 0 else f"{int(m):02d}:{int(s):02d}"

        response_data = {
            "success": True,
            "download_url": download_url,
            "filename": final_filename_mp3,
            "title": info.get("title", "Untitled"),
            "thumbnail": thumbnail_url,
            "uploader": info.get("uploader", "N/A"),
            "duration": duration_str
        }
        logging.info("Successfully prepared response.")
        return jsonify(response_data)

    except yt_dlp.utils.DownloadError as e:
        error_message = str(e)
        logging.error(f"yt-dlp DownloadError: {error_message}", exc_info=True)
        if "is not a valid URL" in error_message:
            return jsonify({"success": False, "error": "The provided link is not a valid URL."}), 400
        if "Unsupported URL" in error_message:
            return jsonify({"success": False, "error": "This website or URL is not supported."}), 400
        return jsonify({"success": False, "error": f"Failed to download from the URL: {error_message}"}), 500
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serves static files."""
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

application = app