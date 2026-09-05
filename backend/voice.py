import io
import speech_recognition as sr
from gtts import gTTS
from backend.config import STT_LANG_MAP, TTS_LANG_MAP


def transcribe_audio(audio_bytes, language="English"):
    recognizer = sr.Recognizer()
    lang_code = STT_LANG_MAP.get(language, "en-US")
    with sr.AudioFile(audio_bytes) as source:
        audio_data = recognizer.record(source)
        try:
            return recognizer.recognize_google(audio_data, language=lang_code)
        except sr.UnknownValueError:
            return "Could not understand audio"
        except sr.RequestError as e:
            return f"Could not request results; {e}"


def text_to_audio(text, language="English"):
    try:
        lang_code = TTS_LANG_MAP.get(language, "en")
        if language == "English (India)":
            tts = gTTS(text=text, lang="en", tld="co.in")
        else:
            tts = gTTS(text=text, lang=lang_code)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        print(f"TTS Error: {e}")
        return None
