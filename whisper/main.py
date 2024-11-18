from faster_whisper import WhisperModel
from faster_whisper.audio import pad_or_trim, decode_audio
import logging
import tempfile
import socketio
import uvicorn
import base64
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv('.env')

# logging.basicConfig()
# logging.getLogger("faster_whisper").setLevel(logging.DEBUG)

cors_origins = os.getenv("CORS_ORIGIN", "").split(",")
print(f"CORS_ORIGINS: {cors_origins}")

sio = socketio.AsyncServer(cors_allowed_origins=cors_origins, async_mode="asgi")
app = socketio.ASGIApp(sio)

model_size = os.getenv("MODEL_SIZE", "small")
device = os.getenv("DEVICE", "cpu")
compute_type = os.getenv("COMPUTE_TYPE", "int8")
print(f"MODEL_SIZE: {model_size}, DEVICE: {device}, COMPUTE_TYPE: {compute_type}")

model = WhisperModel(model_size, device=device, compute_type=compute_type)


def process_wav_bytes(webm_bytes: bytes, sample_rate: int = 16000):
    try:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=True) as temp_file:
            temp_file.write(webm_bytes)
            temp_file.flush()
            waveform = decode_audio(temp_file.name)
            return waveform
    except Exception as e:
        logging.error(f"Erreur lors du traitement des octets WAV: {e}")
        raise

async def transcribe(audio, sid):
    try:
        waveform = process_wav_bytes(audio)
        # audio = pad_or_trim(waveform, length=3000)

        segments, info = model.transcribe(
            audio=waveform,
            language="fr",
            beam_size=5,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        for segment in segments:
            print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
            # for word in segment.words:
                # print("[%.2fs -> %.2fs] %s" % (word.start, word.end, word.word))

            await sio.emit("transcription", {"transcription": segment.text}, to=sid)
                

        return segments
    except Exception as e:
        logging.error(f"Erreur lors de la transcription de l'audio: {e}")
        raise

@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.event
def disconnect(sid):
    print('disconnect ', sid)

@sio.event
async def audio(sid, data):
    print('audio ', sid)
    audio_base64 = data.get('audio')
    if audio_base64:
        audio_bytes = base64.b64decode(audio_base64)
        await transcribe(audio=audio_bytes, sid=sid)



if __name__ == "__main__":
    host = os.getenv("WHISPER_HOST", "")
    port = os.getenv("WHISPER_PORT", "")
    print(f"HOST: {host}, PORT {port}")
    uvicorn.run(app, host=host, port=int(port))