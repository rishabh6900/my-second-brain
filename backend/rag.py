import io
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
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
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
