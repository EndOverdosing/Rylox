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
    if not data: return jsonify({"success":False,"error":"Invalid request."}),400
    raw_url = data.get('url')
    quality = data.get('quality','192')
    custom_format = data.get('custom_format')
    if not raw_url: return jsonify({"success":False,"error":"URL required."}),400
    try:
        parsed=urlparse(raw_url);netloc=parsed.netloc.replace('m.soundcloud.com','soundcloud.com')
        clean_url=urlunparse((parsed.scheme,netloc,parsed.path,'','',''))
    except: clean_url=raw_url
    if 'soundcloud.com' not in clean_url: return jsonify({"success":False,"error":"Only SoundCloud URLs supported."}),400
    session=requests.Session()
    session.headers.update({'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
    session.get('https://soundcloud.com/')
    ydl_opts0={'nopart':True,'quiet':True,'no_warnings':True,'cookies':session.cookies}
    with yt_dlp.YoutubeDL(ydl_opts0) as ydl: info=ydl.extract_info(clean_url,download=False)
    safe_title=get_formatted_filename(custom_format,info) if custom_format else sanitize_filename(info.get('title','untitled_audio'))
    output_template=os.path.join(DOWNLOADS_FOLDER,f'{safe_title}.%(ext)s')
    thumb=info.get('thumbnail','').replace('-original.jpg','-t500x500.jpg')
    ydl_opts={**ydl_opts0,'outtmpl':output_template,'format':'bestaudio/best','postprocessors':[{'key':'FFmpegExtractAudio','preferredcodec':'mp3','preferredquality':quality},{'key':'EmbedThumbnail','already_have_thumbnail':False}],'writethumbnail':True,'embed_thumbnail':True,'thumbnail':thumb}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([info['webpage_url']])
    final_mp3=f'{safe_title}.mp3'
    if not os.path.exists(os.path.join(DOWNLOADS_FOLDER,final_mp3)): raise FileNotFoundError
    dur=info.get('duration',0);duration=f"{int(dur//60):02d}:{int(dur%60):02d}" if dur else "N/A"
    return jsonify({"success":True,"download_url":f"/static/downloads/{quote(final_mp3)}","filename":final_mp3,"title":info.get('title','Untitled'),"thumbnail":f"/thumbnail?url={quote(thumb)}" if thumb else "","uploader":info.get('uploader','N/A'),"duration":duration})

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

application = app