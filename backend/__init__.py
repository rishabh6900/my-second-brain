"""
Lumi AI Backend Package
Provides modular sub-packages for configurations, LLMs, LangGraph agent workflows,
RAG pipelines, voice transcription/synthesis, and web search.
"""

from backend.config import (
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    OLLAMA_MODEL,
    TAVILY_API_KEY,
    get_openrouter_models_list,
    FREE_OPENROUTER_MODELS,
    MODEL_METADATA_MAP,
    get_available_models,
    get_model_info,
    STT_LANG_MAP,
    TTS_LANG_MAP
)

from backend.llm import (
    OpenRouterLLM,
    GroqLLM,
    llm,
    get_llm_instance
)

from backend.agent import (
    ChatState,
    chat_node,
    checkpointer,
    graph,
    chatbot,
    retrieve_all_threads
)

from backend.voice import (
    transcribe_audio,
    text_to_audio
)

from backend.rag import (
    get_embedding_model,
    generate_embeddings,
    chunk_text,
    extract_text_from_pdf,
    extract_text_from_url,
    process_and_store_document,
    get_rag_context
)

from backend.search import (
    perform_web_search
)

__all__ = [
    # Config & Models
    "OPENROUTER_API_KEY",
    "OPENROUTER_MODEL",
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "OLLAMA_MODEL",
    "TAVILY_API_KEY",
    "get_openrouter_models_list",
    "FREE_OPENROUTER_MODELS",
    "MODEL_METADATA_MAP",
    "get_available_models",
    "get_model_info",
    "STT_LANG_MAP",
    "TTS_LANG_MAP",
    # LLM
    "OpenRouterLLM",
    "GroqLLM",
    "llm",
    "get_llm_instance",
    # Agent & Graph
    "ChatState",
    "chat_node",
    "checkpointer",
    "graph",
    "chatbot",
    "retrieve_all_threads",
    # Voice
    "transcribe_audio",
    "text_to_audio",
    # RAG
    "get_embedding_model",
    "generate_embeddings",
    "chunk_text",
    "extract_text_from_pdf",
    "extract_text_from_url",
    "process_and_store_document",
    "get_rag_context",
    # Search
    "perform_web_search"
]
