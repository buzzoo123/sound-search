import logging
import librosa
import numpy as np
import torch
from transformers import ClapModel, ClapProcessor
import io

# 🔧 Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("embeddings")

# 📥 CLAP (local) model + processor
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
clap_model = ClapModel.from_pretrained("laion/clap-htsat-fused").to(device)
clap_processor = ClapProcessor.from_pretrained("laion/clap-htsat-fused")

# 🔁 Audio clip → CLAP embedding (local)
def get_audio_text_embeddings(audio_input: str | io.BytesIO) -> np.ndarray:
    """
    Embeds an audio file or in-memory audio data using local CLAP model (for audio-to-text similarity).
    """
    try:
        if isinstance(audio_input, str):  # If audio_input is a file path
            logger.info(f"Loading audio for CLAP from file: {audio_input}")
            waveform, sr = librosa.load(audio_input, sr=None, mono=True)
        elif isinstance(audio_input, io.BytesIO): # If audio_input is a BytesIO object
            logger.info("Loading audio for CLAP from in-memory data.")
            waveform, sr = librosa.load(audio_input, sr=None, mono=True)
        else:
            raise ValueError("audio_input must be a file path (str) or io.BytesIO object.")

        if sr != 48000:
            waveform = librosa.resample(waveform, orig_sr=sr, target_sr=48000)

        inputs = clap_processor(audios=waveform, sampling_rate=48000, return_tensors="pt").to(device)
        with torch.no_grad():
            embedding = clap_model.get_audio_features(**inputs).cpu().numpy()[0]

        logger.info("Generated CLAP embedding locally.")
        return embedding

    except Exception as e:
        logger.error(f"Error in get_audio_text_embeddings: {e}")
        return None

# 🔁 Text → CLAP embedding (local)
def get_text_audio_embeddings(text: str) -> np.ndarray:
    """
    Embeds text into the same audio space using local CLAP model.
    """
    def preprocess_clip_text(clip: str) -> str:
        return clip.strip().lower()

    clean_text = preprocess_clip_text(text)
    logger.info(f"Generating embedding for text: '{clean_text}'")

    inputs = clap_processor(text=clean_text, return_tensors="pt").to(device)
    with torch.no_grad():
        embedding = clap_model.get_text_features(**inputs).cpu().numpy()[0]

    logger.info("Generated CLAP text embedding locally.")
    return embedding