import os
import json
import math
import requests
from dotenv import load_dotenv 
from langgraph.graph import StateGraph, START, END 
from typing import TypedDict, Annotated 
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, AIMessageChunk
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

load_dotenv(override=True) 
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

def get_openrouter_models_list():
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

class OpenRouterLLM:
    def __init__(
        self,
        api_key: str,
        model_name: str = "openrouter/free",
        temperature: float = 0.7,
        fallback_models: list[str] | None = None
    ):
        self.api_key = api_key
        self.model_name = model_name or "openrouter/free"
        self.temperature = temperature
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.fallback_models = fallback_models or get_openrouter_models_list()

    def _convert_messages(self, messages: list[BaseMessage]) -> list[dict]:
        formatted = []
        for m in messages:
            if isinstance(m, SystemMessage):
                role = "system"
            elif isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                role = "user"
            formatted.append({"role": role, "content": str(m.content)})
        return formatted

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mysecondbrain.local",
            "X-Title": "Lumi AI Second Brain"
        }

    def invoke(self, messages: list[BaseMessage]) -> AIMessage:
        headers = self._get_headers()
        models_to_try = [self.model_name] + [m for m in self.fallback_models if m != self.model_name]
        
        last_error = None
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": self._convert_messages(messages),
                "temperature": self.temperature,
                "stream": False
            }
            try:
                resp = requests.post(self.url, headers=headers, json=payload, timeout=45)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        msg = choices[0].get("message", {})
                        content = msg.get("content", "")
                        if content:
                            return AIMessage(content=content)
                else:
                    err_msg = ""
                    try:
                        err_json = resp.json()
                        err_msg = err_json.get("error", {}).get("message", resp.text)
                    except Exception:
                        err_msg = resp.text
                    last_error = f"Model {model} returned HTTP {resp.status_code}: {err_msg}"
                    print(f"OpenRouter [{model}] warning: {last_error}. Attempting fallback...")
                    continue
            except Exception as e:
                last_error = f"Model {model} exception: {str(e)}"
                print(f"OpenRouter [{model}] error: {last_error}. Attempting fallback...")
                continue

        raise RuntimeError(f"OpenRouter API Error: {last_error}")

    def stream(self, messages: list[BaseMessage]):
        headers = self._get_headers()
        models_to_try = [self.model_name] + [m for m in self.fallback_models if m != self.model_name]
        
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": self._convert_messages(messages),
                "temperature": self.temperature,
                "stream": True
            }
            try:
                resp = requests.post(self.url, headers=headers, json=payload, stream=True, timeout=45)
                if resp.status_code != 200:
                    print(f"OpenRouter streaming [{model}] HTTP {resp.status_code}: {resp.text}. Trying fallback...")
                    continue

                got_content = False
                for line in resp.iter_lines():
                    if line:
                        line_str = line.decode('utf-8').strip()
                        if line_str.startswith("data: "):
                            data_str = line_str[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk_json = json.loads(data_str)
                                choices = chunk_json.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    text = delta.get("content", "")
                                    if text:
                                        got_content = True
                                        yield AIMessageChunk(content=text)
                            except Exception:
                                pass
                if got_content:
                    return
            except Exception as e:
                print(f"OpenRouter streaming [{model}] exception: {e}. Trying fallback...")
                continue

        raise RuntimeError("OpenRouter streaming failed across all attempted free models.")

class GroqLLM:
    def __init__(self, api_key: str, model_name: str = "llama-3.3-70b-versatile", temperature: float = 0.7):
        self.api_key = api_key
        self.model_name = model_name
        self.temperature = temperature
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    def _convert_messages(self, messages: list[BaseMessage]) -> list[dict]:
        formatted = []
        for m in messages:
            if isinstance(m, SystemMessage):
                role = "system"
            elif isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                role = "user"
            formatted.append({"role": role, "content": str(m.content)})
        return formatted

    def invoke(self, messages: list[BaseMessage]) -> AIMessage:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": self._convert_messages(messages),
            "temperature": self.temperature,
            "stream": False
        }
        resp = requests.post(self.url, headers=headers, json=payload, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError(f"Groq API Error ({resp.status_code}): {resp.text}")
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return AIMessage(content=content)

    def stream(self, messages: list[BaseMessage]):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": self._convert_messages(messages),
            "temperature": self.temperature,
            "stream": True
        }
        resp = requests.post(self.url, headers=headers, json=payload, stream=True, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError(f"Groq API Stream Error ({resp.status_code}): {resp.text}")
        
        for line in resp.iter_lines():
            if line:
                line_str = line.decode('utf-8').strip()
                if line_str.startswith("data: "):
                    data_str = line_str[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(data_str)
                        delta = chunk_json["choices"][0]["delta"]
                        text = delta.get("content", "")
                        if text:
                            yield AIMessageChunk(content=text)
                    except Exception:
                        pass

if OPENROUTER_API_KEY:
    print(f"Lumi AI: Initializing OpenRouter LLM (Primary: {OPENROUTER_MODEL}, Free tier with auto-fallback)")
    llm = OpenRouterLLM(api_key=OPENROUTER_API_KEY, model_name=OPENROUTER_MODEL)
elif GROQ_API_KEY:
    print(f"Lumi AI: Initializing Groq LLM (Model: {GROQ_MODEL})")
    llm = GroqLLM(api_key=GROQ_API_KEY, model_name=GROQ_MODEL)
else:
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
    print(f"Lumi AI: Initializing Local ChatOllama (Model: {OLLAMA_MODEL})")
    try:
        from langchain_ollama import ChatOllama
    except ImportError:
        try:
            from langchain_community.chat_models import ChatOllama
        except ImportError:
            from langchain_community.chat_models.ollama import ChatOllama
    llm = ChatOllama(
        model=OLLAMA_MODEL,
        temperature=0.7
    )

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

from langchain_core.messages import SystemMessage


class ChatState(TypedDict, total=False):
    messages: Annotated[list[BaseMessage], add_messages]
    system_prompt: str
    model: str

def chat_node(state: ChatState):
    raw_messages = state.get('messages', [])
    sys_prompt = state.get('system_prompt', '')
    requested_model = state.get('model', '')
    
    cleaned_messages = []
    if sys_prompt:
        cleaned_messages.append(SystemMessage(content=sys_prompt))
    else:
        # Check if there's any existing SystemMessage
        sys_msgs = [m for m in raw_messages if isinstance(m, SystemMessage)]
        if sys_msgs:
            cleaned_messages.append(sys_msgs[-1])
            
    # Include all conversation messages except SystemMessages
    for m in raw_messages:
        if not isinstance(m, SystemMessage):
            cleaned_messages.append(m)
            
    # Determine the LLM instance to use
    active_llm = llm
    if requested_model:
        if OPENROUTER_API_KEY:
            active_llm = OpenRouterLLM(api_key=OPENROUTER_API_KEY, model_name=requested_model)
        elif GROQ_API_KEY:
            active_llm = GroqLLM(api_key=GROQ_API_KEY, model_name=requested_model)
            
    # Stream chunks / get response from active LLM
    response = active_llm.invoke(cleaned_messages)
    return {"messages": [response]}  


checkpointer = MemorySaver()

graph = StateGraph(ChatState) 
graph.add_node("chat_node",chat_node) 
graph.add_edge(START,"chat_node")
graph.add_edge("chat_node",END)

chatbot = graph.compile(checkpointer=checkpointer) 
def retrieve_all_threads():
    import db
    threads = db.get_user_chat_threads()
    return [t["id"] for t in threads]

import speech_recognition as sr
from gtts import gTTS
import io

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
        tts = gTTS(text=text, lang=lang_code)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

# --- RAG & Knowledge Vault Processing Pipeline ---
import math
import requests
from bs4 import BeautifulSoup
import db

_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Warning: sentence-transformers model load notice ({e}), using fallback vectorizer.")
            _embedding_model = "fallback"
    return _embedding_model

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()
    if model != "fallback" and hasattr(model, 'encode'):
        try:
            embeddings = model.encode(texts, show_progress_bar=False)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            print(f"Embedding encode error: {e}")
    
    results = []
    for text in texts:
        vec = [0.0] * 384
        for i, b in enumerate(text.encode('utf-8', errors='ignore')):
            vec[i % 384] += (b % 100) / 100.0
        norm = math.sqrt(sum(v*v for v in vec)) or 1.0
        results.append([v / norm for v in vec])
    return results

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
        return splitter.split_text(text)
    except Exception:
        chunks = []
        start = 0
        step = chunk_size - overlap
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk.strip())
            start += step
        return chunks

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        return "\n\n".join(pages_text)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def extract_text_from_url(url: str) -> tuple[str, str]:
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "LumiAI-Bot/1.0"})
        soup = BeautifulSoup(resp.text, 'html.parser')
        for s in soup(["script", "style", "nav", "footer", "header"]):
            s.decompose()
        title = soup.title.string.strip() if soup.title and soup.title.string else url
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return title, "\n".join(lines)
    except Exception as e:
        print(f"URL extraction error: {e}")
        return url, ""

def process_and_store_document(user_id: str, title: str, file_type: str, raw_text: str, file_path_or_url: str = "") -> dict:
    if not raw_text.strip():
        raise ValueError("No readable text content extracted from document.")
    
    doc_id = db.save_user_document(user_id, title, file_type, file_path_or_url, len(raw_text))
    chunks = chunk_text(raw_text)
    if chunks:
        embeddings = generate_embeddings(chunks)
        db.save_document_chunks(doc_id, user_id, chunks, embeddings)
    
    return {
        "id": doc_id,
        "title": title,
        "file_type": file_type,
        "char_count": len(raw_text),
        "chunk_count": len(chunks)
    }

def get_rag_context(user_id: str, query: str, top_k: int = 4) -> tuple[str, list[dict]]:
    if not user_id or not query:
        return "", []
    try:
        query_emb = generate_embeddings([query])[0]
        hits = db.similarity_search(user_id, query_emb, top_k=top_k)
        relevant_hits = [h for h in hits if h.get("score", 0) > 0.05]
        if not relevant_hits:
            return "", []
        
        context_str = "USER KNOWLEDGE BASE RELEVANT EXCERPTS:\n"
        for idx, hit in enumerate(relevant_hits, 1):
            context_str += f"\n--- Source {idx}: {hit['title']} (Relevance: {hit['score']:.2f}) ---\n{hit['text']}\n"
        return context_str, relevant_hits
    except Exception as e:
        print(f"RAG context error: {e}")
        return "", []

def perform_web_search(query: str, max_results: int = 4) -> tuple[str, list[dict]]:
    results = []
    tavily_key = os.getenv("TAVILY_API_KEY")
    if not tavily_key:
        print("TAVILY_API_KEY is not set in environment.")
        return "", []

    try:
        try:
            from tavily import TavilyClient
            tclient = TavilyClient(api_key=tavily_key)
            t_res = tclient.search(query, search_depth="basic", max_results=max_results)
            for r in t_res.get("results", []):
                results.append({
                    "title": r.get("title", "Web Result"),
                    "href": r.get("url", ""),
                    "body": r.get("content", "")
                })
        except ImportError:
            resp = requests.post(
                "https://api.tavily.com/search",
                json={"api_key": tavily_key, "query": query, "max_results": max_results},
                timeout=8
            )
            if resp.status_code == 200:
                t_data = resp.json()
                for r in t_data.get("results", []):
                    results.append({
                        "title": r.get("title", "Web Result"),
                        "href": r.get("url", ""),
                        "body": r.get("content", "")
                    })
    except Exception as e:
        print(f"Tavily web search error: {e}")

    if not results:
        return "", []

    context_str = "LIVE WEB SEARCH RESULTS:\n"
    web_sources = []
    for idx, r in enumerate(results, 1):
        title = r.get("title", "Web Result")
        href = r.get("href", "")
        body = r.get("body", "")
        context_str += f"\n--- Source [{idx}]: {title} ({href}) ---\n{body}\n"
        web_sources.append({"title": title, "href": href})

    return context_str, web_sources



