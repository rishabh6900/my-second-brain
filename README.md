# 🧠 Lumi AI — Intelligence System & Second Brain

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Angular](https://img.shields.io/badge/Frontend-Angular%2019-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![LangGraph](https://img.shields.io/badge/Agent-LangGraph-FF6F00?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL%20%2B%20PGVector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![OpenRouter](https://img.shields.io/badge/AI%20Gateway-OpenRouter%20Free%20Tier-7C3AED?style=for-the-badge)](https://openrouter.ai/)
[![Tavily](https://img.shields.io/badge/Web%20Search-Tavily%20AI-0284C7?style=for-the-badge)](https://tavily.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

---

**Lumi AI** is an advanced AI-powered Second Brain and Knowledge Assistant. It combines **LangGraph conversational agent workflows**, **PostgreSQL PGVector semantic search (RAG)**, **Tavily AI live web search**, **zero-database Private (Incognito) Mode**, **multilingual voice recognition & synthesis**, **real-time chat document attachments**, **dynamic free LLM model switching**, and a **glassmorphism Angular UI**.

---

## ✨ Key Highlights & Features

- 🕵️ **Private (Incognito) Mode**: Zero-database chat sessions. When activated, user prompts and AI replies are completely ephemeral and are **never** stored in `chat_threads` or `chat_messages` tables. Includes a stealth UI theme and localized status banners across 15 languages.
- 🧠 **Personal Knowledge Vault (RAG)**: Ingest PDFs, Markdown, text documents, or live web URLs into Neon PostgreSQL with 384-dimensional `pgvector` embeddings and cosine similarity search.
- 🌐 **Live Web Search**: Real-time web search powered by Tavily AI with interactive citations and domain source badges.
- 🎙️ **Real-Time Voice Assistant & Control (`Alt + V`)**: Full-duplex conversational voice mode with audio-reactive 3D orb visualizer, hands-free loop, and natural voice command navigation.
- 🌍 **15+ Language Localization**: Seamless multi-language support (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Spanish, French, German).
- ⚡ **Dynamic Free LLM Switching**: One-click dropdown to select between OpenRouter Free, Llama 3.3 70B, Gemini 2.0 Flash, Mistral 7B, GLM 5.2, and more.
- 🎨 **Premium Glassmorphism UI**: Dynamic Dark/Light themes, Markdown rendering with tables, syntax-highlighted code blocks, and copy-to-clipboard buttons.

---

## 🛠️ Complete Tech Stack

### 🎨 Frontend
| Layer / Tool | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Angular 19](https://angular.dev/) | Standalone components, reactive forms, RxJS streams, and HttpClient |
| **Styling** | Vanilla CSS3 + Design System | Custom CSS variables, responsive grid/flexbox, and glassmorphism |
| **Theming** | Light & Dark Mode Engine | Real-time CSS variable switching with persistent `localStorage` |
| **Icons** | [Remix Icon 4.2](https://remixicon.com/) | SVG icon system for UI elements |
| **Typography** | [Google Fonts](https://fonts.google.com/) | `Outfit` (headings), `Inter` (body), and `Fira Code` (code blocks) |
| **Markdown Engine** | Custom Parser | Renders tables, blockquotes, lists, links, inline code, and IDE code blocks |
| **Voice & Audio** | Web Audio API + Speech API | Real-time audio waveform visualizer, SpeechRecognition STT & SpeechSynthesis TTS |
| **Auth Client** | Google Identity Services (GSI) | Google One-Tap & standard OAuth/credential integration |

---

### ⚙️ Backend & API
| Layer / Tool | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High-performance Python web framework with asynchronous routes |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | Lightning-fast ASGI web server with auto-reload capabilities |
| **Validation** | [Pydantic v2](https://docs.pydantic.dev/) | Strict data parsing, request validation, and response serialization |
| **Streaming** | Server-Sent Events (SSE) | Real-time token streaming for AI responses (`/api/chat/stream`) |
| **File Uploads** | `python-multipart` | Multipart file handling for documents and audio recordings |
| **Environment** | `python-dotenv` | Dynamic `.env` configuration loader with `override=True` |

---

### 🤖 AI, LLMs & Agent Orchestration
| Component | Tool / Library | Description |
| :--- | :--- | :--- |
| **Agent Engine** | [LangGraph](https://langchain-ai.github.io/langgraph/) | Graph workflow (`StateGraph`, `START`, `END`, and `MemorySaver`) |
| **LLM Gateway** | [OpenRouter AI](https://openrouter.ai/) | Access to top free open-source models with automated fallback routing |
| **Groq Cloud** | [LangChain Groq](https://github.com/groq/groq-python) | High-speed inference for Llama 3.3 and Mixtral models |
| **Local LLM** | [LangChain Ollama](https://github.com/ollama/ollama) | Offline inference with local models (`qwen2.5`, `llama3.2`, `mistral`) |
| **Agent Core** | [LangChain Core](https://python.langchain.com/) | Message abstractions (`AIMessage`, `HumanMessage`, `SystemMessage`) |
| **Live Web Search** | [Tavily AI Search](https://tavily.com/) | Real-time search engine tailored for LLMs with source citations |

---

### 📚 RAG, Vector Search & Document Ingestion
| Component | Tool / Library | Description |
| :--- | :--- | :--- |
| **Vector Database** | [Neon PostgreSQL](https://neon.tech/) + [pgvector](https://github.com/pgvector/pgvector) | Cloud PostgreSQL database with cosine similarity vector indexes |
| **Embeddings** | [Sentence-Transformers](https://www.sbert.net/) (`all-MiniLM-L6-v2`) | 384-dimensional dense semantic vector generation |
| **Text Chunking** | [LangChain Text Splitters](https://python.langchain.com/) | `RecursiveCharacterTextSplitter` (chunk size: 800, overlap: 150) |
| **PDF Extraction** | [pypdf](https://pypdf.readthedocs.io/) | High-speed PDF document text extraction |
| **Web Scraping** | [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/) | HTML cleaning, article extraction, and web page vectorization |

---

### 🎙️ Speech, Real-Time Voice Chat & Voice Control Engine
| Component | Tool / Library | Description |
| :--- | :--- | :--- |
| **Real-Time Voice Assistant** | Web Audio API + Speech API | Full-duplex hands-free live conversation loop with barge-in interruption |
| **Audio-Reactive Visualizer** | Web Audio `AnalyserNode` | Real-time 3D glowing orb & equalizer waveform reacting to voice intensity |
| **Voice Control & Intents** | Natural Voice Command Engine | Control theme, new chats, vault, web search, models & languages via voice |
| **Speech-to-Text (STT)** | `SpeechRecognition` (Google Speech API) | Transcribes 15+ spoken languages with auto audio normalization |
| **Text-to-Speech (TTS)** | `SpeechSynthesis` & `gTTS` | Natural, low-latency spoken responses with seamless auto-listen transition |
| **Supported Languages** | 15+ Multilingual Locales | English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Spanish, French, German |
| **Global Shortcut** | `Alt + V` | Quick toggle for Live Voice Assistant HUD anywhere in the app |

---

### 🔐 Security & Database
| Tool | Purpose |
| :--- | :--- |
| `psycopg2-binary` | PostgreSQL connection pool driver |
| `passlib[bcrypt]` | Salted bcrypt password hashing for user security |
| `Neon Cloud DB` | Scalable serverless PostgreSQL storage for users, threads, and embeddings |
| `Private Mode` | Bypasses database operations entirely for confidential / incognito sessions |

---

## 🌟 Supported Free LLM Models

Lumi AI allows you to switch LLM models directly from the UI header dropdown or via `.env`:

| Model Name | Provider | Model ID | Strengths |
| :--- | :--- | :--- | :--- |
| **OpenRouter Free** | OpenRouter | `openrouter/free` | ✨ Auto-routes to the best available free model |
| **Z.ai GLM 5.2** | Z.ai | `z-ai/glm-5.2:free` | 🧠 14.9B Reasoning, long-context (256k) & coding |
| **Llama 3.3 70B** | Meta | `meta-llama/llama-3.3-70b-instruct:free` | 🔥 Powerful, state-of-the-art general reasoning |
| **Gemini 2.0 Flash** | Google | `google/gemini-2.0-flash-exp:free` | ⚡ Ultra-fast token generation & long context |
| **Llama 3.1 8B** | Meta | `meta-llama/llama-3.1-8b-instruct:free` | 🚀 Lightweight, quick everyday responses |
| **Mistral 7B** | Mistral AI | `mistralai/mistral-7b-instruct:free` | 🌪️ Compact and concise multilingual model |
| **Llama 3.2 3B** | Meta | `meta-llama/llama-3.2-3b-instruct:free` | ⚡ Fast lightweight assistant |

---

## 🏗️ Architecture Diagram

```mermaid
graph TD
    User([User Client Browser])
    
    subgraph Frontend["Angular 19 Glassmorphism Client"]
        AuthComp[Auth Component / Login & Register]
        ChatComp[Chat Box & Private Mode Toggle]
        VoiceComp[Voice Assistant Modal & Audio HUD]
        ModelSelector[Dynamic Model Switcher]
        VaultComp[Knowledge Vault Modal]
        ChatService[Chat, Vault & Auth Services]
    end
    
    subgraph Backend["FastAPI Server Engine (server.py)"]
        API[FastAPI REST & SSE Router]
        RAGPipeline[RAG Embeddings & Chunking Engine]
        LangGraphAgent[LangGraph Agent Graph]
        VoiceEngine[STT SpeechRecognition & gTTS Engine]
        DBLayer[Database Manager - db.py]
    end

    subgraph External_AI["AI & Search Providers"]
        OpenRouter[OpenRouter Free Tier Gateway]
        Tavily[Tavily AI Live Web Search]
        SentenceTransformers[Sentence-Transformers Embeddings]
    end
    
    subgraph Storage["Neon Cloud Storage"]
        PG[(Neon PostgreSQL + PGVector)]
    end
    
    User --> AuthComp
    User --> ChatComp
    User --> VoiceComp
    User --> ModelSelector
    User --> VaultComp
    
    ChatComp --> ChatService
    VoiceComp --> ChatService
    VaultComp --> ChatService
    
    ChatService -->|/api/chat/stream (is_private), /api/models| API
    ChatService -->|/api/vault/*, /api/auth/*| API
    
    API --> DBLayer
    API --> RAGPipeline
    API --> LangGraphAgent
    API --> VoiceEngine
    
    LangGraphAgent --> OpenRouter
    LangGraphAgent --> Tavily
    RAGPipeline --> SentenceTransformers
    
    DBLayer -.->|Skipped when is_private == true| PG
    DBLayer -->|Normal Mode: Users, Threads & Vectors| PG
```

---

## 📂 Project Structure

```text
My_second_brain/
├── backend/              # Modular backend architecture
│   ├── __init__.py       # Package exports & backward compatibility
│   ├── config.py         # App config, LLM model registry & language maps
│   ├── llm.py            # Custom LLM wrappers (OpenRouter, Groq, Ollama)
│   ├── agent.py          # LangGraph ChatState, chat node & compiled workflow
│   ├── rag.py            # Embeddings, chunking, PDF/URL extractors & vector search
│   ├── voice.py          # Audio transcription (STT) & speech synthesis (TTS)
│   └── search.py         # Tavily live web search integration
├── backend.py            # Backward compatibility module proxy
├── server.py             # FastAPI REST endpoints, SSE token streaming, Vault, Auth & Private Mode
├── db.py                 # Neon PostgreSQL schema, user auth, thread storage & PGVector RAG
├── requirements.txt      # Python backend packages
├── .env                  # Environment keys (DATABASE_URL, OPENROUTER_API_KEY, TAVILY_API_KEY)
├── vercel.json           # Serverless deployment configuration
├── api/
│   └── index.py          # Serverless entrypoint
└── frontend-angular/     # Angular 19 application
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── auth/         # Login, Signup & Landing View
    │   │   │   ├── chat-box/     # Chat stream, Private Mode toggle, Model selector, Voice, Attachment & Markdown
    │   │   │   ├── sidebar/      # Threads history & Knowledge Vault trigger
    │   │   │   ├── vault/        # Document upload, URL ingestion & Vault manager
    │   │   │   └── voice-modal/  # Real-time Voice HUD & 3D Audio Visualizer
    │   │   └── services/         # Angular services (Auth, Chat, Vault, Theme, VoiceControl)
    │   ├── styles.css            # Global theme variables & glassmorphism utilities
    │   └── index.html            # Fonts and icon imports
    └── package.json
```

---

## ⚡ Setup & Installation

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Neon PostgreSQL Account** (with `pgvector` enabled)
- **OpenRouter API Key** (Free tier available)
- **Tavily API Key** (for real-time web search)

---

### 2. Backend Setup

1. **Navigate to the repository root**:
   ```bash
   cd My_second_brain
   ```

2. **Create a virtual environment (optional but recommended)**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure `.env` in the root folder**:
   ```env
   # Neon PostgreSQL Database URL
   DATABASE_URL="postgresql://username:password@ep-sample.neon.tech/neondb?sslmode=require"

   # OpenRouter AI Configuration (Free LLM Models)
   OPENROUTER_API_KEY="your_openrouter_api_key"
   OPENROUTER_MODEL="openrouter/free"
   OPENROUTER_AVAILABLE_MODELS="openrouter/free,z-ai/glm-5.2:free,meta-llama/llama-3.3-70b-instruct:free,google/gemini-2.0-flash-exp:free,meta-llama/llama-3.1-8b-instruct:free,mistralai/mistral-7b-instruct:free,meta-llama/llama-3.2-3b-instruct:free"

   # Tavily AI Search Key (Live Web Search)
   TAVILY_API_KEY="your_tavily_api_key"
   ```

5. **Start the FastAPI Backend**:
   ```bash
   uvicorn server:app --reload --port 8000
   ```

---

### 3. Frontend Setup

1. **Navigate to the Angular directory**:
   ```bash
   cd frontend-angular
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Angular Development Server**:
   ```bash
   npm start
   ```

4. **Open in your browser**:
   Navigate to `http://localhost:4200` to access Lumi AI.

---

## 🌐 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user with name, email, and password |
| `POST` | `/api/auth/login` | Authenticate user and verify bcrypt password |
| `POST` | `/api/auth/reset-password` | Update existing user password |

### 📚 Knowledge Vault & RAG (`/api/vault`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/vault/upload` | Ingest PDF, TXT, or MD documents into PGVector |
| `POST` | `/api/vault/url` | Scrape, chunk, and vectorize web page URLs |
| `GET` | `/api/vault/documents` | Retrieve all documents stored in the user's vault |
| `DELETE`| `/api/vault/documents/{id}` | Remove document and delete its vector embeddings |

### 💬 Conversations, Private Mode & Models (`/api`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/models` | Get all available LLMs and active default model |
| `GET` | `/api/model/info` | Inspect active provider, model slug, and fallback list |
| `GET` | `/api/threads` | Get conversation thread list for active user |
| `GET` | `/api/threads/{id}` | Get message history for a specific thread |
| `DELETE`| `/api/threads/{id}` | Delete a conversation thread |
| `POST` | `/api/chat` | Synchronous AI chat request (`is_private: true` skips database writes) |
| `POST` | `/api/chat/stream` | Real-time Server-Sent Events (SSE) AI streaming token response (`is_private: true` supported) |

### 🎙️ Audio & Voice (`/api`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/transcribe` | Convert uploaded voice audio to text via Google STT |
| `POST` | `/api/tts` | Synthesize AI response text into spoken audio MP3 stream |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
