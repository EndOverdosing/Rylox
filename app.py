from flask import Flask, request, jsonify, send_from_directory, render_template_string
import os
import yt_dlp
import logging
from urllib.parse import quote
import requests
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, APIC, TIT2, TPE1, TALB

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
    return send_from_directory(
        os.path.join(app.root_path, 'static', 'images'),
        'icon.png',
        mimetype='image/png'
    )

def embed_thumbnail(mp3_path, thumbnail_url, title=None, artist=None):
    try:
        if not thumbnail_url:
            logging.warning("No thumbnail URL provided")
            return
        
        response = requests.get(thumbnail_url, timeout=10)
        if response.status_code != 200:
            logging.warning(f"Failed to download thumbnail: {response.status_code}")
            return
        
        image_data = response.content
        
        if image_data.startswith(b'\x89PNG'):
            mime_type = 'image/png'
        elif image_data.startswith(b'\xff\xd8\xff'):
            mime_type = 'image/jpeg'
        else:
            mime_type = 'image/jpeg'
        
        audio = MP3(mp3_path)
        
        if audio.tags is None:
            audio.add_tags()
        
        audio.tags.delall("APIC")
        
        audio.tags.add(
            APIC(
                encoding=3,
                mime=mime_type,
                type=3,
                desc='Cover',
                data=image_data
            )
        )
        
        if title:
            audio.tags.delall("TIT2")
            audio.tags.add(TIT2(encoding=3, text=title))
        
        if artist:
            audio.tags.delall("TPE1")
            audio.tags.add(TPE1(encoding=3, text=artist))
        
        audio.save(v2_version=3)
        logging.info(f"Successfully embedded thumbnail and metadata into {mp3_path}")
        
    except Exception as e:
        logging.error(f"Failed to embed thumbnail: {str(e)}")

@app.route('/download', methods=['POST'])
def download():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid request."}), 400

    url = data.get('url')
    quality = data.get('quality', '192')

    if not url:
        return jsonify({"success": False, "error": "URL is required."}), 400

    if 'soundcloud.com' not in url:
        return jsonify({"success": False, "error": "Only SoundCloud URLs are supported."}), 400

    common_ydl_opts = {
        'nopart': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        'geo_bypass': True,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(common_ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        title = info.get('title') or info.get('id') or 'untitled_audio'
        uploader = info.get('uploader', 'Unknown')
        thumbnail_url = info.get('thumbnail')
        
        output_template = os.path.join(DOWNLOADS_FOLDER, f'{title}.%(ext)s')

        ydl_opts = {
            **common_ydl_opts,
            'outtmpl': output_template,
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': quality,
            }],
            'writethumbnail': False,
            'embedthumbnail': False,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([info['webpage_url']])

        final_filename = f'{title}.mp3'
        final_path = os.path.join(DOWNLOADS_FOLDER, final_filename)

        if not os.path.exists(final_path):
            raise FileNotFoundError("MP3 file not found after download.")

        embed_thumbnail(final_path, thumbnail_url, title, uploader)

        duration_seconds = info.get("duration")
        duration = "N/A"
        if duration_seconds:
            m, s = divmod(duration_seconds, 60)
            h, m = divmod(m, 60)
            duration = f"{int(h):02d}:{int(m):02d}:{int(s):02d}" if h else f"{int(m):02d}:{int(s):02d}"

        return jsonify({
            "success": True,
            "download_url": f"/static/downloads/{quote(final_filename)}",
            "filename": final_filename,
            "title": title,
            "thumbnail": thumbnail_url,
            "uploader": uploader,
            "duration": duration
        })

    except yt_dlp.utils.DownloadError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        logging.error(f"Download error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

application = app