from flask import Flask, request, jsonify, send_from_directory, render_template_string, Response
import os
import yt_dlp
import logging
import re
from urllib.parse import quote, unquote, urlparse, urlunparse
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
    try:
        with open('index.html', encoding='utf-8') as f:
            return render_template_string(f.read())
    except FileNotFoundError:
        return "index.html not found.", 404

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static', 'images'),
                               'icon.png', mimetype='image/png')

@app.route('/thumbnail')
def thumbnail_proxy():
    image_url = request.args.get('url')
    if not image_url:
        return "Missing image URL", 400

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://soundcloud.com/'
        }
        resp = requests.get(unquote(image_url), headers=headers, timeout=15)
        resp.raise_for_status()
        return Response(resp.content, content_type=resp.headers['Content-Type'])
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to proxy thumbnail {image_url}: {e}")
        return "Failed to fetch image", 502

def sanitize_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename).strip()

def get_formatted_filename(custom_format, info):
    replacements = {
        '{title}': info.get('title', 'N/A'),
        '{artist}': info.get('artist') or info.get('uploader', 'N/A'),
        '{album}': info.get('album', 'N/A'),
    }
    formatted_name = custom_format
    if not formatted_name.strip():
        return sanitize_filename(info.get('title', 'untitled_audio'))
    for placeholder, value in replacements.items():
        if value:
            formatted_name = formatted_name.replace(placeholder, str(value))
    return sanitize_filename(formatted_name)

@app.route('/download', methods=['POST'])
def download():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid request."}), 400

    raw_url = data.get('url')
    quality = data.get('quality', '192')
    custom_format = data.get('custom_format')

    if not raw_url:
        return jsonify({"success": False, "error": "URL is required."}), 400
        
    try:
        parsed_url = urlparse(raw_url)
        netloc = parsed_url.netloc.replace('m.soundcloud.com', 'soundcloud.com')
        clean_url = urlunparse((parsed_url.scheme, netloc, parsed_url.path, '', '', ''))
        url = clean_url
    except Exception:
        url = raw_url

    if 'soundcloud.com' not in url:
        return jsonify({"success": False, "error": "Only SoundCloud URLs are supported."}), 400

    try:
        logging.info(f"Attempting to get session cookies from SoundCloud...")
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        session.get('https://soundcloud.com/')
        logging.info(f"Session cookies obtained.")

        common_ydl_opts = {
            'nopart': True,
            'quiet': True,
            'no_warnings': True,
            'cookiefile': None,
            'cookies': session.cookies,
        }

        logging.info(f"Extracting media info for URL: {url}")
        with yt_dlp.YoutubeDL(common_ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        logging.info(f"Successfully extracted info for '{info.get('title')}'")

        if custom_format:
            safe_title = get_formatted_filename(custom_format, info)
        else:
            safe_title = sanitize_filename(info.get('title', 'untitled_audio'))

        if not safe_title:
             safe_title = sanitize_filename(info.get('id', 'untitled_audio'))

        output_template = os.path.join(DOWNLOADS_FOLDER, f'{safe_title}.%(ext)s')

        ydl_opts = {
            **common_ydl_opts,
            'outtmpl': output_template,
            'format': 'bestaudio/best',
            'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': quality}],
        }

        logging.info("Starting download and conversion with yt-dlp...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([info['webpage_url']])
        logging.info("Download and conversion finished.")

        final_filename_mp3 = f'{safe_title}.mp3'
        final_filepath = os.path.join(DOWNLOADS_FOLDER, final_filename_mp3)

        if not os.path.exists(final_filepath):
            raise FileNotFoundError("Could not find the converted MP3 file after processing.")

        download_url = f"/static/downloads/{quote(final_filename_mp3)}"
        
        thumbnail_url = ""
        original_thumbnail = info.get("thumbnail")
        if original_thumbnail:
            web_friendly_thumbnail = original_thumbnail.replace('-original.jpg', '-t500x500.jpg')
            thumbnail_url = f"/thumbnail?url={quote(web_friendly_thumbnail)}"

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
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

application = app