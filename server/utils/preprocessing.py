import os
import uuid
import torchaudio

def preprocess_clip_audio(clip: str) -> str:
    """
    Takes an audio file, converts to 48kHz mono WAV, and returns the new file path.
    """
    out_path = f"/tmp/{uuid.uuid4()}.wav"

    waveform, sr = torchaudio.load(clip)
    if sr != 48000:
        waveform = torchaudio.transforms.Resample(orig_freq=sr, new_freq=48000)(waveform)

    # Convert to mono
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    torchaudio.save(out_path, waveform, 48000)
    return out_path

def preprocess_clip_text(clip: str) -> str:
    return clip.strip().lower()