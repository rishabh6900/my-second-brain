from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import json
import asyncio
import io
from datetime import datetime

from backend import (
    chatbot, retrieve_all_threads, transcribe_audio, text_to_audio,
    extract_text_from_pdf, extract_text_from_url, process_and_store_document, get_rag_context,
    perform_web_search, get_model_info, get_available_models
)
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import db
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/models")
def list_models():
    return get_available_models()

@app.get("/api/model/info")
def model_info():
    return get_model_info()


class ChatRequest(BaseModel):
    thread_id: str
    message: str
    language: str = "English"
    model: str | None = None
    use_rag: bool = False
    use_web_search: bool = False
    user_id: str | None = None


class URLIngestRequest(BaseModel):
    url: str
    user_id: str

class TTSRequest(BaseModel):
    text: str
    language: str = "English"

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


@app.post("/api/auth/register")
def register(request: RegisterRequest):
    existing_user = db.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    user = db.create_user(
        name=request.name,
        email=request.email,
        password=request.password
    )
    return {"user": {"id": user["id"], "name": user["name"], "email": user["email"], "avatarUrl": user.get("avatar_url")}}

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

@app.post("/api/auth/reset-password")
def reset_password(request: ResetPasswordRequest):
    user = db.get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")
    
    db.update_user_password(request.email, request.new_password)
    return {"message": "Password updated successfully."}

@app.post("/api/auth/login")
def login(request: LoginRequest):
    user = db.get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    if user.get("password") and not db.verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    return {"user": {"id": user["id"], "name": user["name"], "email": user["email"], "avatarUrl": user.get("avatar_url")}}



def format_message(msg, status="complete", citations=None, web_sources=None):
    if isinstance(msg, SystemMessage) or not isinstance(msg, (HumanMessage, AIMessage)):
        return None
    role = "user" if isinstance(msg, HumanMessage) else "assistant"
    msg_id = str(uuid.uuid4())
    res = {
        "id": msg_id,
        "role": role,
        "content": msg.content,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "status": status
    }
    if citations:
        res["citations"] = citations
    if web_sources:
        res["webSources"] = web_sources
    return res

@app.get("/api/threads")
def list_threads(user_id: str | None = None):
    return db.get_user_chat_threads(user_id)

@app.get("/api/threads/{threadId}")
def get_thread(threadId: str):
    return db.get_chat_thread_details(threadId)

@app.delete("/api/threads")
@app.delete("/api/threads/")
def delete_threads_root(thread_id: str | None = None):
    if thread_id:
        db.delete_chat_thread(thread_id)
    return {"message": "Threads endpoint"}

@app.delete("/api/threads/{threadId}")
def delete_thread(threadId: str):
    if threadId:
        db.delete_chat_thread(threadId)
    return {"message": "Thread deleted"}

LANGUAGE_PROMPTS = {
    "English": "English",
    "English (India)": "English (Indian style)",
    "Hindi": "Hindi (हिंदी - Devanagari script)",
    "Bengali": "Bengali (বাংলা - Bengali script)",
    "Tamil": "Tamil (தமிழ் - Tamil script)",
    "Telugu": "Telugu (తెలుగు - Telugu script)",
    "Marathi": "Marathi (मराठी - Devanagari script)",
    "Gujarati": "Gujarati (ગુજરાતી - Gujarati script)",
    "Kannada": "Kannada (ಕನ್ನಡ - Kannada script)",
    "Malayalam": "Malayalam (മലയാളം - Malayalam script)",
    "Punjabi": "Punjabi (ਪੰਜਾਬੀ - Gurmukhi script)",
    "Urdu": "Urdu (اردو - Nastaliq script)",
    "Spanish": "Spanish (Español)",
    "French": "French (Français)",
    "German": "German (Deutsch)"
}

def get_system_message(lang_name: str, rag_context: str = "", web_context: str = "") -> SystemMessage:
    today_str = datetime.utcnow().strftime("%A, %B %d, %Y")
    lang_desc = LANGUAGE_PROMPTS.get(lang_name, lang_name)
    if lang_name in ["English", "English (India)"]:
        base_prompt = (
            f"You are Lumi, a helpful AI assistant. Today's date is {today_str}.\n"
            f"[CRITICAL LANGUAGE INSTRUCTION: The user has explicitly selected the language: {lang_desc}. "
            f"Regardless of the language of any previous messages in this conversation history, you MUST write your ENTIRE response STRICTLY in {lang_desc}. "
            f"Do not respond in Hindi, Spanish, or any other language unless the user explicitly requests it in their message.]"
        )
    else:
        base_prompt = (
            f"You are Lumi, a helpful AI assistant. Today's date is {today_str}.\n"
            f"[CRITICAL LANGUAGE INSTRUCTION: The user has explicitly selected the language: {lang_desc}. "
            f"Regardless of the language of any previous messages in this conversation history, you MUST write your ENTIRE response STRICTLY in {lang_desc}. "
            f"Do not respond in English or any other language unless the user explicitly requests it in their message.]"
        )
    if rag_context:
        base_prompt += f"\n\nUse the following relevant context from the user's personal Knowledge Vault to answer their query accurately:\n{rag_context}\nIf the answer is found in the context, cite the source document name."
    if web_context:
        base_prompt += f"\n\nUse the following LIVE WEB SEARCH RESULTS to provide accurate, up-to-date information:\n{web_context}\nCite relevant web sources when answering."
    return SystemMessage(content=base_prompt)

@app.post("/api/chat")
def chat(request: ChatRequest):
    config = {"configurable": {"thread_id": request.thread_id}}
    rag_context = ""
    hits = []
    if request.use_rag and request.user_id:
        rag_context, hits = get_rag_context(request.user_id, request.message)

    web_context = ""
    web_sources = []
    if request.use_web_search:
        web_context, web_sources = perform_web_search(request.message)

    sys_msg = get_system_message(request.language, rag_context, web_context)
    title = request.message[:40] + ("..." if len(request.message) > 40 else "")
    db.save_chat_thread(request.thread_id, request.user_id, title)
    db.save_chat_message(request.thread_id, "user", request.message)

    lang_desc = LANGUAGE_PROMPTS.get(request.language, request.language)
    model_input = request.message
    if request.language not in ["English", "English (India)"]:
        model_input = f"{request.message}\n\n[Instruction: Respond strictly and entirely in {lang_desc}]"

    try:
        res = chatbot.invoke(
            {
                "system_prompt": sys_msg.content,
                "model": request.model,
                "messages": [HumanMessage(content=model_input)]
            },
            config=config
        )
        messages = res.get("messages", [])
        ai_msg = messages[-1] if messages else AIMessage(content="Error generating response.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    citations = [{"title": h["title"], "score": round(h["score"], 2)} for h in hits]
    saved_ai_msg = db.save_chat_message(
        request.thread_id, "assistant", ai_msg.content,
        citations=citations if citations else None,
        web_sources=web_sources if web_sources else None
    )
    return {
        "threadId": request.thread_id,
        "message": saved_ai_msg
    }

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    config = {"configurable": {"thread_id": request.thread_id}}
    rag_context = ""
    hits = []
    if request.use_rag and request.user_id:
        rag_context, hits = get_rag_context(request.user_id, request.message)

    web_context = ""
    web_sources = []
    if request.use_web_search:
        web_context, web_sources = perform_web_search(request.message)

    sys_msg = get_system_message(request.language, rag_context, web_context)
    citations = [{"title": h["title"], "score": round(h["score"], 2)} for h in hits]
    
    title = request.message[:40] + ("..." if len(request.message) > 40 else "")
    db.save_chat_thread(request.thread_id, request.user_id, title)
    db.save_chat_message(request.thread_id, "user", request.message)

    lang_desc = LANGUAGE_PROMPTS.get(request.language, request.language)
    model_input = request.message
    if request.language not in ["English", "English (India)"]:
        model_input = f"{request.message}\n\n[Instruction: Respond strictly and entirely in {lang_desc}]"

    async def generate():
        full_text = ""
        try:
            for chunk, metadata in chatbot.stream(
                {
                    "system_prompt": sys_msg.content,
                    "model": request.model,
                    "messages": [HumanMessage(content=model_input)]
                },
                config=config,
                stream_mode="messages",
            ):
                if isinstance(chunk, AIMessage):
                    full_text += chunk.content
                    payload = json.dumps({"text": chunk.content})
                    yield f"data: {payload}\n\n"
                    await asyncio.sleep(0)
            
            if citations:
                payload = json.dumps({"citations": citations})
                yield f"data: {payload}\n\n"

            if web_sources:
                payload = json.dumps({"webSources": web_sources})
                yield f"data: {payload}\n\n"

            db.save_chat_message(
                request.thread_id, "assistant", full_text,
                citations=citations if citations else None,
                web_sources=web_sources if web_sources else None
            )
        except Exception as e:
            payload = json.dumps({"error": str(e)})
            yield f"data: {payload}\n\n"
                
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

# --- Knowledge Vault API Endpoints ---

@app.post("/api/vault/upload")
async def vault_upload(file: UploadFile = File(...), user_id: str = Form(...)):
    filename = file.filename or "uploaded_document"
    contents = await file.read()
    
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext == "pdf":
        text = extract_text_from_pdf(contents)
        file_type = "PDF Document"
    else:
        try:
            text = contents.decode("utf-8")
        except UnicodeDecodeError:
            text = contents.decode("latin-1", errors="ignore")
        file_type = "Markdown Document" if ext in ["md", "markdown"] else "Text Document"

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from uploaded file.")

    try:
        doc_info = process_and_store_document(
            user_id=user_id,
            title=filename,
            file_type=file_type,
            raw_text=text,
            file_path_or_url=filename
        )
        return doc_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest document: {str(e)}")

@app.post("/api/vault/url")
def vault_url(request: URLIngestRequest):
    if not request.url or not request.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid HTTP/HTTPS URL.")
    
    title, text = extract_text_from_url(request.url)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not fetch text content from specified URL.")
        
    try:
        doc_info = process_and_store_document(
            user_id=request.user_id,
            title=title,
            file_type="Web Page",
            raw_text=text,
            file_path_or_url=request.url
        )
        return doc_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest URL: {str(e)}")

@app.get("/api/vault/documents")
def vault_list_documents(user_id: str):
    docs = db.get_user_documents(user_id)
    return docs

@app.delete("/api/vault/documents/{doc_id}")
def vault_delete_document(doc_id: str, user_id: str):
    success = db.delete_user_document(doc_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or could not be deleted.")
    return {"message": "Document deleted successfully."}

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = Form("English")):
    try:
        contents = await file.read()
        audio_io = io.BytesIO(contents)
        text = transcribe_audio(audio_io, language=language)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tts")
def tts(request: TTSRequest):
    audio_bytes = text_to_audio(request.text, language=request.language)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Failed to convert text to speech")
    return Response(content=audio_bytes, media_type="audio/mpeg")

