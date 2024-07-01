from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import time
import librosa
import numpy as np
from tensorflow.keras.models import load_model
from werkzeug.utils import secure_filename
import mysql.connector

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

AUDIO_FOLDER = 'audio'
os.makedirs(AUDIO_FOLDER, exist_ok=True)
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER

# Configure MySQL connection
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'mysql@123'
app.config['MYSQL_DB'] = 'deepfake_audio_info'

# MySQL setup
def get_db_connection():
    return mysql.connector.connect(
        host=app.config['MYSQL_HOST'],
        user=app.config['MYSQL_USER'],
        password=app.config['MYSQL_PASSWORD'],
        database=app.config['MYSQL_DB']
    )

# Function to preprocess the audio file and extract MFCC features
def preprocess_audio(file_path, sr=22050, n_mfcc=13, max_len=103):
    y, sr = librosa.load(file_path, sr=sr)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    if mfcc.shape[1] < max_len:
        pad_width = max_len - mfcc.shape[1]
        mfcc = np.pad(mfcc, pad_width=((0, 0), (0, pad_width)), mode='wrap')
    else:
        mfcc = mfcc[:, :max_len]
    return mfcc

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/audio', methods=['POST'])
def deepfake_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filepath = os.path.join(app.config['AUDIO_FOLDER'], file.filename)
        try:
            file.save(filepath)
            # Preprocess the audio file
            mfcc_features = preprocess_audio(filepath)
            mfcc_features = mfcc_features[np.newaxis, ...]

            # Load the trained model
            model = load_model('E:/ASVspoof2021_LA_eval/saved_models/audio_classification.hdf5')

            # Make a prediction
            prediction = model.predict(mfcc_features)
            predicted_class = np.argmax(prediction, axis=1).item()

            # Delete the audio file after processing
            os.remove(filepath)

            return jsonify({
                'message': 'File processed successfully', 
                'predicted_class': predicted_class
            })
        except Exception as e:
            # If an error occurs, attempt to delete the file
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500




@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files or not all(k in request.form for k in ('name', 'email', 'department', 'university')):
        return jsonify({'error': 'Audio file or form fields not found.'}), 400

    file = request.files['audio']
    name = request.form.get('name')
    email = request.form.get('email')
    department = request.form.get('department')
    university = request.form.get('university')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    timestamp = int(time.time())
    filename = secure_filename(f"{name}_{timestamp}.wav" if name else f"audio_{timestamp}.wav")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    
    try:
        file.save(filepath)

        conn = get_db_connection()
        cursor = conn.cursor()
        query = "INSERT INTO audio_info (name, email, department, university, filename, path) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.execute(query, (name, email, department, university, filename, filepath))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'File uploaded successfully', 'path': filepath, 'predicted_class': predicted_class})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
