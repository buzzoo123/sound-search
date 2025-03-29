import os
import glob
from typing import List, Dict

from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from utils.embeddings import get_audio_audio_embeddings, get_audio_text_embeddings, get_text_audio_embeddings
from utils.extensions import limiter

router = APIRouter(prefix="/embed", tags=["Embeddings"])


def find_audio_files(folder_path: str) -> List[str]:
    return glob.glob(os.path.join(folder_path, "**", "*.wav"), recursive=True) + \
           glob.glob(os.path.join(folder_path, "**", "*.mp3"), recursive=True)


@router.post("/batch")
@limiter.limit("20/minute")
async def batch_embed_from_folder(folder_path: str = Form(...), request: Request = None):
    """
    Recursively scans a folder for audio files and returns CLAP embeddings.
    """
    if not os.path.exists(folder_path):
        return JSONResponse(status_code=400, content={"error": "Folder does not exist."})

    audio_files = find_audio_files(folder_path)
    if not audio_files:
        return JSONResponse(status_code=404, content={"error": "No audio files found."})

    audio_audio_embeddings: Dict[str, List[float]] = {}
    audio_text_embeddings: Dict[str, List[float]] = {}

    for file_path in audio_files:
        filename = os.path.basename(file_path)

        try:
            audio_emb = get_audio_audio_embeddings(file_path)
            text_emb = get_audio_text_embeddings(file_path)
            audio_audio_embeddings[filename] = audio_emb.tolist()
            audio_text_embeddings[filename] = text_emb.tolist()
        except Exception as e:
            audio_audio_embeddings[filename] = f"Error: {str(e)}"
            audio_text_embeddings[filename] = None

    return {
        "file_count": len(audio_files),
        "audio_audio_embeddings": audio_audio_embeddings,
        "audio_text_embeddings": audio_text_embeddings
    }


@router.post("/audio")
@limiter.limit("10/minute")
async def embed_single_audio(file: UploadFile = File(...), request: Request = None):
    """
    Upload a single audio file and get its audio-audio and audio-text embeddings.
    """
    file_path = f"/tmp/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        audio_emb = get_audio_audio_embeddings(file_path)
        text_emb = get_audio_text_embeddings(file_path)
        return {
            "audio_audio_embedding": audio_emb.tolist(),
            "audio_text_embedding": text_emb.tolist()
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        os.remove(file_path)


@router.post("/text")
@limiter.limit("30/minute")
async def embed_single_text(text: str = Form(...), request: Request = None):
    """
    Submit a text string and get its embedding in audio space (CLAP).
    """
    try:
        embedding = get_text_audio_embeddings(text)
        return {"embedding": embedding.tolist()}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
