import os
from dotenv import load_dotenv

load_dotenv(override=True)

# API Keys & Default Models
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def get_openrouter_models_list() -> list[str]:
    env_models_str = os.getenv("OPENROUTER_AVAILABLE_MODELS", "")
    if env_models_str.strip():
        return [m.strip() for m in env_models_str.split(",") if m.strip()]
    return [
        "openrouter/free",
        "z-ai/glm-5.2:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "meta-llama/llama-3.2-3b-instruct:free"
    ]


FREE_OPENROUTER_MODELS = get_openrouter_models_list()

MODEL_METADATA_MAP = {
    "openrouter/free": {"name": "OpenRouter Free (Auto Router)", "badge": "Auto Free", "icon": "ri-magic-line"},
    "z-ai/glm-5.2:free": {"name": "Z.ai GLM 5.2 (Free)", "badge": "Z.ai 15B (Free)", "icon": "ri-brain-line"},
    "meta-llama/llama-3.3-70b-instruct:free": {"name": "Llama 3.3 70B (Free)", "badge": "Powerful (Free)", "icon": "ri-robot-2-line"},
    "google/gemini-2.0-flash-exp:free": {"name": "Gemini 2.0 Flash (Free)", "badge": "Ultra Fast (Free)", "icon": "ri-flashlight-line"},
    "meta-llama/llama-3.1-8b-instruct:free": {"name": "Llama 3.1 8B (Free)", "badge": "Fast (Free)", "icon": "ri-speed-line"},
    "mistralai/mistral-7b-instruct:free": {"name": "Mistral 7B (Free)", "badge": "Balanced (Free)", "icon": "ri-sparkling-line"},
    "meta-llama/llama-3.2-3b-instruct:free": {"name": "Llama 3.2 3B (Free)", "badge": "Lightweight (Free)", "icon": "ri-feather-line"}
}

STT_LANG_MAP = {
    "English": "en-US",
    "English (India)": "en-IN",
    "Hindi": "hi-IN",
    "Bengali": "bn-IN",
    "Tamil": "ta-IN",
    "Telugu": "te-IN",
    "Marathi": "mr-IN",
    "Gujarati": "gu-IN",
    "Kannada": "kn-IN",
    "Malayalam": "ml-IN",
    "Punjabi": "pa-IN",
    "Urdu": "ur-IN",
    "Spanish": "es-ES",
    "French": "fr-FR",
    "German": "de-DE"
}

TTS_LANG_MAP = {
    "English": "en",
    "English (India)": "en",
    "Hindi": "hi",
    "Bengali": "bn",
    "Tamil": "ta",
    "Telugu": "te",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Punjabi": "pa",
    "Urdu": "ur",
    "Spanish": "es",
    "French": "fr",
    "German": "de"
}


def get_available_models():
    models = []
    if OPENROUTER_API_KEY:
        model_ids = get_openrouter_models_list()
        for mid in model_ids:
            meta = MODEL_METADATA_MAP.get(mid, {
                "name": mid.split("/")[-1].replace(":free", " (Free)"),
                "badge": "✨ Free",
                "icon": "ri-cpu-line"
            })
            models.append({
                "id": mid,
                "name": meta["name"],
                "provider": "OpenRouter",
                "badge": meta.get("badge", "✨ Free"),
                "icon": meta.get("icon", "ri-cpu-line")
            })
        default_model = OPENROUTER_MODEL or (model_ids[0] if model_ids else "openrouter/free")
    elif GROQ_API_KEY:
        models = [
            {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B Versatile", "provider": "Groq", "badge": "🔥 Groq Fast", "icon": "ri-robot-2-line"},
            {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant", "provider": "Groq", "badge": "⚡ Instant", "icon": "ri-speed-line"},
            {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B 32k", "provider": "Groq", "badge": "📚 Long Context", "icon": "ri-book-open-line"},
            {"id": "gemma2-9b-it", "name": "Gemma 2 9B IT", "provider": "Groq", "badge": "💎 Google", "icon": "ri-gem-line"}
        ]
        default_model = GROQ_MODEL
    else:
        ollama_m = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
        models = [
            {"id": ollama_m, "name": f"Local Ollama ({ollama_m})", "provider": "Ollama", "badge": "🏠 Local", "icon": "ri-hard-drive-2-line"}
        ]
        default_model = ollama_m
        
    return {
        "models": models,
        "default": default_model,
        "active_provider": "OpenRouter" if OPENROUTER_API_KEY else ("Groq" if GROQ_API_KEY else "Ollama")
    }


def get_model_info():
    if OPENROUTER_API_KEY:
        return {
            "provider": "OpenRouter",
            "model": OPENROUTER_MODEL,
            "tier": "Free",
            "fallback_models": FREE_OPENROUTER_MODELS
        }
    elif GROQ_API_KEY:
        return {
            "provider": "Groq",
            "model": GROQ_MODEL,
            "tier": "Standard",
            "fallback_models": []
        }
    else:
        return {
            "provider": "Local Ollama",
            "model": os.getenv("OLLAMA_MODEL", "qwen2.5:7b"),
            "tier": "Local",
            "fallback_models": []
        }
