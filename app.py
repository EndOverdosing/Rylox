from flask import Flask, request, jsonify
import os
import yt_dlp
import logging
import re
import base64
import sys
import tempfile

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

DOWNLOADS_FOLDER = os.path.join(tempfile.gettempdir(), 'rylox_downloads')
if not os.path.exists(DOWNLOADS_FOLDER):
    os.makedirs(DOWNLOADS_FOLDER)

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
    if not data or not data.get('url') or 'soundcloud.com' not in data.get('url'):
        return jsonify({"success": False, "error": "Invalid request."}), 400

    url = data.get('url')
    quality = data.get('quality', '192')
    custom_format = data.get('custom_format')

    try:
        with yt_dlp.YoutubeDL({'nopart': True}) as ydl:
            info = ydl.extract_info(url, download=False)

        if custom_format:
            safe_title = get_formatted_filename(custom_format, info)
        else:
            safe_title = sanitize_filename(info.get('title', 'untitled_audio'))

        if not safe_title:
             safe_title = sanitize_filename(info.get('id', 'untitled_audio'))

        output_template = os.path.join(DOWNLOADS_FOLDER, safe_title)

        if sys.platform == "win32":
            ffmpeg_exe_path = r'C:\ProgramData\chocolatey\bin\ffmpeg.exe'
        else:

            ffmpeg_exe_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'ffmpeg'))

        ydl_opts = {
            'outtmpl': output_template,
            'ffmpeg_location': ffmpeg_exe_path,
            'format': 'bestaudio/best',
            'postprocessors': [{'key': 'FFmpegExtractAudio','preferredcodec': 'mp3','preferredquality': quality}],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([info['webpage_url']])

        final_filename_mp3 = f'{safe_title}.mp3'
        final_filepath = os.path.join(DOWNLOADS_FOLDER, final_filename_mp3)

        if not os.path.exists(final_filepath):
            raise FileNotFoundError("Could not find the converted MP3 file after processing.")

        with open(final_filepath, 'rb') as f:
            binary_data = f.read()

        os.remove(final_filepath)

        base64_data = base64.b64encode(binary_data).decode('utf-8')
        download_url = f"data:audio/mpeg;base64,{base64_data}"

        return jsonify({
            "success": True,
            "download_url": download_url,
            "filename": final_filename_mp3,
            "title": info.get("title", "Untitled"),
            "thumbnail": info.get("thumbnail"),
            "uploader": info.get("uploader", "N/A"),
            "duration": info.get("duration",0)
        })

    except Exception as e:
        logging.error(f"A critical error occurred: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"An unexpected error occurred: {str(e)}"}), 500

application = app