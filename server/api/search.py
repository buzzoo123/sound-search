import os
import glob
from typing import List, Dict
from fastapi import APIRouter, UploadFile, File, Request, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from utils.embeddings import get_audio_text_embeddings, get_text_audio_embeddings
from utils.extensions import limiter
import io

router = APIRouter(prefix="/embed", tags=["Embeddings"])

@router.post("/batch_upload")
@limiter.limit("20/minute")
async def batch_embed_from_uploaded_folder(files: list[UploadFile] = File(...), request: Request = None):
    """
    Uploads a folder (represented as a list of files), processes them in memory, and returns CLAP embeddings.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    audio_embeddings: Dict[str, List[float]] = {}

    for file in files:
        try:
            audio_content = await file.read()
            audio_io = io.BytesIO(audio_content)

            clip_emb = get_audio_text_embeddings(audio_io)
            audio_embeddings[file.filename] = clip_emb.tolist()

        except Exception as e:
            audio_embeddings[file.filename] = None

    return {
        "file_count": len(files),
        "sample_embeddings": audio_embeddings
    }

@router.post("/audio")
@limiter.limit("30/minute")
async def embed_single_audio(file: UploadFile = File(...), request: Request = None):
    """
    Upload a single audio file and get its audio-audio and audio-text embeddings.
    """
    try:
        audio_content = await file.read()
        audio_io = io.BytesIO(audio_content)

        audio_emb = get_audio_text_embeddings(audio_io)
        return {
            "query_embedding": audio_emb.tolist()
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/text")
@limiter.limit("30/minute")
async def embed_single_text(text: str = Form(...), request: Request = None):
    """
    Submit a text string and get its embedding in audio space (CLAP).
    """
    try:
        embedding = get_text_audio_embeddings(text)
        return {"query_embedding": embedding.tolist()}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/health")
async def health_check():
    return {"status": "loading", "message": "gagaga"}