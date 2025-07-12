import os
import pathlib
import flask
from flask import Flask, redirect, url_for, session, request, render_template
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import google.auth.transport.requests
import pathlib
import requests

app = Flask(__name__)
app.secret_key = 'REPLACE_WITH_A_RANDOM_SECRET_KEY'  # Change this to a random secret key

# OAuth 2.0 Client Configuration
CLIENT_SECRETS_FILE = "client_secret.json"  # You will need to download this from Google Cloud Console

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube"
]

API_SERVICE_NAME_DRIVE = 'drive'
API_VERSION_DRIVE = 'v3'

API_SERVICE_NAME_YOUTUBE = 'youtube'
API_VERSION_YOUTUBE = 'v3'

@app.route('/')
def index():
    if 'credentials' not in session:
        return redirect('authorize')
    return render_template('index.html')

@app.route('/authorize')
def authorize():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    session['state'] = state
    return redirect(authorization_url)

@app.route('/oauth2callback')
def oauth2callback():
    state = session['state']
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=state,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    session['credentials'] = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    return redirect(url_for('index'))

def get_drive_service():
    credentials = Credentials(**session['credentials'])
    return build(API_SERVICE_NAME_DRIVE, API_VERSION_DRIVE, credentials=credentials)

def get_youtube_service():
    credentials = Credentials(**session['credentials'])
    return build(API_SERVICE_NAME_YOUTUBE, API_VERSION_YOUTUBE, credentials=credentials)

@app.route('/list_drive_videos')
def list_drive_videos():
    if 'credentials' not in session:
        return redirect('authorize')
    drive_service = get_drive_service()
    # List video files in Google Drive (mimeType video/*)
    results = drive_service.files().list(
        q="mimeType contains 'video/' and trashed = false",
        pageSize=10,
        fields="files(id, name, mimeType)"
    ).execute()
    items = results.get('files', [])
    return flask.jsonify(items)

@app.route('/upload_video/<file_id>')
def upload_video(file_id):
    if 'credentials' not in session:
        return redirect('authorize')
    drive_service = get_drive_service()
    youtube_service = get_youtube_service()

    # Get file metadata
    file = drive_service.files().get(fileId=file_id, fields='name, mimeType').execute()
    file_name = file['name']

    # Download file content
    request_drive = drive_service.files().get_media(fileId=file_id)
    fh = pathlib.Path(f'temp_{file_id}')
    with open(fh, 'wb') as f:
        downloader = googleapiclient.http.MediaIoBaseDownload(f, request_drive)
        done = False
        while done is False:
            status, done = downloader.next_chunk()

    # Upload to YouTube
    body = {
        'snippet': {
            'title': file_name,
            'description': 'Uploaded by auto video uploader',
            'categoryId': '22'  # People & Blogs category
        },
        'status': {
            'privacyStatus': 'private'
        }
    }
    media = googleapiclient.http.MediaFileUpload(str(fh), mimetype=file['mimeType'], resumable=True)
    request_upload = youtube_service.videos().insert(
        part=','.join(body.keys()),
        body=body,
        media_body=media
    )
    response = None
    while response is None:
        status, response = request_upload.next_chunk()

    # Remove temp file
    os.remove(fh)

    return flask.jsonify({'status': 'uploaded', 'videoId': response['id']})

if __name__ == '__main__':
    app.run('localhost', 8080, debug=True)
