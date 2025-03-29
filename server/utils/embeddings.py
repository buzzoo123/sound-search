import os
import uuid
import logging
import requests
import numpy as np
import torch
import librosa
import torchaudio
from transformers import ClapModel, ClapProcessor
from .preprocessing import preprocess_clip_audio, preprocess_clip_text

# 🔧 Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("embeddings")

# 🎵 Hugging Face API for MusicCNN
HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
MUSICCNN_MODEL = "serket/musicnn"
BASE_URL = "https://api-inference.huggingface.co/models"

headers_audio = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/octet-stream"
}

# 📥 CLAP (local) model + processor
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
clap_model = ClapModel.from_pretrained("laion/clap-htsat-fused").to(device)
clap_processor = ClapProcessor.from_pretrained("laion/clap-htsat-fused")

# 🔁 Audio clip → MusicCNN embedding (API)
def get_audio_audio_embeddings(audio_path: str) -> np.ndarray:
    """
    Embeds an audio file using MusicCNN via Hugging Face API.
    """
    if not HF_API_TOKEN:
        raise ValueError("HF_API_TOKEN not set")

    preprocessed_audio = preprocess_clip_audio(audio_path)
    url = f"{BASE_URL}/{MUSICCNN_MODEL}"

    with open(preprocessed_audio, "rb") as f:
        audio_data = f.read()

    logger.info(f"Sending audio '{preprocessed_audio}' to MusicCNN...")

    res = requests.post(url, headers=headers_audio, data=audio_data)
    if res.status_code != 200:
        raise RuntimeError(f"MusicCNN API failed: {res.status_code} - {res.text}")

    output = res.json()
    logger.info("Received MusicCNN embedding.")
    return np.array([entry["score"] for entry in output])

# 🔁 Audio clip → CLAP embedding (local)
def get_audio_text_embeddings(audio_path: str) -> np.ndarray:
    """
    Embeds an audio file using local CLAP model (for audio-to-text similarity).
    """
    logger.info(f"Loading audio for CLAP: {audio_path}")

    waveform, sr = librosa.load(audio_path, sr=None, mono=True)
    if sr != 48000:
        waveform = librosa.resample(waveform, orig_sr=sr, target_sr=48000)

    inputs = clap_processor(audios=waveform, sampling_rate=48000, return_tensors="pt").to(device)
    with torch.no_grad():
        embedding = clap_model.get_audio_features(**inputs).cpu().numpy()[0]

    logger.info("Generated CLAP embedding locally.")
    return embedding

# 🔁 Text → CLAP embedding (local)
def get_text_audio_embeddings(text: str) -> np.ndarray:
    """
    Embeds text into the same audio space using local CLAP model.
    """
    clean_text = preprocess_clip_text(text)
    logger.info(f"Generating embedding for text: '{clean_text}'")

    inputs = clap_processor(text=clean_text, return_tensors="pt").to(device)
    with torch.no_grad():
        embedding = clap_model.get_text_features(**inputs).cpu().numpy()[0]

    logger.info("Generated CLAP text embedding locally.")
    return embedding
