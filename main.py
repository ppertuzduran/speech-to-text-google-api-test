from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import google.cloud.speech_v1 as speech
import os
import json
import asyncio
from typing import Dict, List
import logging
import traceback
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    logger.info("✅ Static files mounted successfully")
except Exception as e:
    logger.error(f"❌ Error mounting static files: {str(e)}")
    logger.error(traceback.format_exc())

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# Initialize Google Cloud Speech client
try:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "s2t-api-demo-march-2025-key.json"
    speech_client = speech.SpeechClient()
    logger.info("✅ Google Cloud Speech client initialized")
except Exception as e:
    logger.error(f"❌ Error initializing Google Cloud Speech client: {str(e)}")
    logger.error(traceback.format_exc())

async def process_audio(audio_chunk: bytes, websocket: WebSocket):
    try:
        logger.info(f"📥 Received audio chunk of size: {len(audio_chunk)} bytes")
        
        if len(audio_chunk) < 100:  # Skip very small chunks
            logger.warning("⚠️ Skipping audio chunk - too small")
            return
        
        # Configure the recognition
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code="es-ES",
            enable_automatic_punctuation=True,
            model="default",
            use_enhanced=True,
            audio_channel_count=1,
            profanity_filter=False  # Disable profanity filter for better performance
        )
        logger.info("✅ Speech recognition config created")

        # Create the audio object
        audio = speech.RecognitionAudio(content=audio_chunk)
        logger.info("✅ Audio object created")

        # Perform the transcription
        logger.info("🔄 Sending audio to Google Speech-to-Text API...")
        try:
            response = speech_client.recognize(config=config, audio=audio)
            logger.info("✅ Received response from Google Speech-to-Text API")
            
            # Process the results
            if not response.results:
                logger.warning("⚠️ No transcription results received from API")
                return

            for result in response.results:
                if result.alternatives:
                    transcript = result.alternatives[0].transcript
                    confidence = result.alternatives[0].confidence
                    logger.info(f"📝 Transcribed text: '{transcript}' (Confidence: {confidence:.2%})")
                    
                    # Send the transcription
                    await websocket.send_text(transcript)
                    logger.info("✅ Sent transcription to client")
                else:
                    logger.warning("⚠️ No alternatives found in transcription result")
        except Exception as api_error:
            logger.error(f"❌ Google Speech-to-Text API error: {str(api_error)}")
            logger.error(traceback.format_exc())
            await websocket.send_text(f"API Error: {str(api_error)}")

    except Exception as e:
        logger.error(f"❌ Error processing audio: {str(e)}")
        logger.error(traceback.format_exc())
        await websocket.send_text(f"Error: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def get():
    try:
        logger.info("📄 Attempting to serve index.html")
        with open("static/index.html") as f:
            content = f.read()
            logger.info("✅ Successfully read index.html")
            return content
    except Exception as e:
        logger.error(f"❌ Error serving index.html: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Error serving index.html")

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    try:
        logger.info(f"🔌 New WebSocket connection request from client: {client_id}")
        await websocket.accept()
        active_connections[client_id] = websocket
        logger.info(f"✅ WebSocket connection established with client: {client_id}")
        
        while True:
            # Receive audio chunk
            audio_chunk = await websocket.receive_bytes()
            logger.info(f"📥 Received audio chunk from client: {client_id}")
            
            # Process the audio chunk
            await process_audio(audio_chunk, websocket)
            
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected for client: {client_id}")
        if client_id in active_connections:
            del active_connections[client_id]
    except Exception as e:
        logger.error(f"❌ Error in WebSocket connection: {str(e)}")
        logger.error(traceback.format_exc())
        if client_id in active_connections:
            del active_connections[client_id]

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8080,
        reload=True,
        log_level="info"
    ) 