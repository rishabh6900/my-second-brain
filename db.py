import os
import sqlite3
import uuid
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("db")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "lumi_db")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

# Check if psycopg2 is available
USE_POSTGRES = False
psycopg2 = None

try:
    import psycopg2
    import psycopg2.extras
    if DATABASE_URL or os.getenv("POSTGRES_HOST"):
        USE_POSTGRES = True
except ImportError:
    logger.warning("psycopg2 module not installed. Falling back to SQLite.")

def get_pg_connection():
    if not psycopg2:
        return None
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    try:
        if db_url:
            conn_url = db_url
            if conn_url.startswith("postgres://"):
                conn_url = conn_url.replace("postgres://", "postgresql://", 1)
            conn = psycopg2.connect(conn_url)
        else:
            conn = psycopg2.connect(
                host=os.getenv("POSTGRES_HOST", "localhost"),
                port=os.getenv("POSTGRES_PORT", "5432"),
                dbname=os.getenv("POSTGRES_DB", "lumi_db"),
                user=os.getenv("POSTGRES_USER", "postgres"),
                password=os.getenv("POSTGRES_PASSWORD", "postgres")
            )
        return conn
    except Exception as e:
        logger.warning(f"Failed to connect to PostgreSQL: {e}. Using SQLite fallback.")
        return None

def get_sqlite_connection():
    return sqlite3.connect("chatbot.db", check_same_thread=False)

def init_db():
    load_dotenv(override=True)
    pg_success = False
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255),
                    google_id VARCHAR(255) UNIQUE,
                    avatar_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                # Try enabling pgvector extension
                try:
                    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                except Exception as ext_err:
                    logger.warning(f"Could not create vector extension: {ext_err}")
                
                cur.execute("""
                CREATE TABLE IF NOT EXISTS user_documents (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    file_type VARCHAR(50) NOT NULL,
                    file_path_or_url TEXT,
                    char_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                
                # Check vector extension support
                try:
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS document_embeddings (
                        id VARCHAR(255) PRIMARY KEY,
                        document_id VARCHAR(255) REFERENCES user_documents(id) ON DELETE CASCADE,
                        user_id VARCHAR(255) NOT NULL,
                        chunk_text TEXT NOT NULL,
                        embedding vector(384)
                    );
                    """)
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_doc_embed_user ON document_embeddings(user_id);")
                except Exception:
                    conn.rollback()
                    # Fallback to json text column if pgvector extension is not enabled in postgres
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS user_documents (
                        id VARCHAR(255) PRIMARY KEY,
                        user_id VARCHAR(255) NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        file_type VARCHAR(50) NOT NULL,
                        file_path_or_url TEXT,
                        char_count INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE TABLE IF NOT EXISTS document_embeddings (
                        id VARCHAR(255) PRIMARY KEY,
                        document_id VARCHAR(255) REFERENCES user_documents(id) ON DELETE CASCADE,
                        user_id VARCHAR(255) NOT NULL,
                        chunk_text TEXT NOT NULL,
                        embedding_json TEXT NOT NULL
                    );
                    """)
                cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_threads (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255),
                    title VARCHAR(255) DEFAULT 'New Conversation',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id VARCHAR(255) PRIMARY KEY,
                    thread_id VARCHAR(255) REFERENCES chat_threads(id) ON DELETE CASCADE,
                    role VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    citations TEXT,
                    web_sources TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
            conn.commit()
            conn.close()
            logger.info("Successfully connected to and initialized PostgreSQL database with RAG & Chat Store support.")
            pg_success = True
        except Exception as e:
            logger.error(f"Error initializing PostgreSQL tables: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        google_id TEXT UNIQUE,
        avatar_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_path_or_url TEXT,
        char_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS document_embeddings (
        id TEXT PRIMARY KEY,
        document_id TEXT REFERENCES user_documents(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding_json TEXT NOT NULL
    );
    """)
    cur.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cur.fetchall()]
    if "google_id" not in columns:
        try:
            cur.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
        except Exception:
            pass
    if "avatar_url" not in columns:
        try:
            cur.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        except Exception:
            pass
    sq_conn.commit()
    sq_conn.close()
    
    if pg_success:
        return "postgresql"
    logger.info("Initialized SQLite fallback database (users & document vault ready).")
    return "sqlite"

DB_TYPE = init_db()

def hash_password(password: str) -> str:
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    except Exception:
        import hashlib
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        import hashlib
        if hashed_password == plain_password:
            return True
        return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() == hashed_password

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    clean_email = email.lower().strip()
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT id, name, email, password, google_id, avatar_url FROM users WHERE email = %s", (clean_email,))
                user = cur.fetchone()
            conn.close()
            return dict(user) if user else None
        except Exception as e:
            logger.error(f"PostgreSQL fetch error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute("SELECT id, name, email, password, google_id, avatar_url FROM users WHERE lower(email) = ?", (clean_email,))
    row = cur.fetchone()
    sq_conn.close()
    if row:
        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "password": row[3],
            "google_id": row[4],
            "avatar_url": row[5]
        }
    return None

def get_user_by_google_id(google_id: str) -> Optional[Dict[str, Any]]:
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT id, name, email, password, google_id, avatar_url FROM users WHERE google_id = %s", (google_id,))
                user = cur.fetchone()
            conn.close()
            return dict(user) if user else None
        except Exception as e:
            logger.error(f"PostgreSQL fetch by google_id error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute("SELECT id, name, email, password, google_id, avatar_url FROM users WHERE google_id = ?", (google_id,))
    row = cur.fetchone()
    sq_conn.close()
    if row:
        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "password": row[3],
            "google_id": row[4],
            "avatar_url": row[5]
        }
    return None

def create_user(name: str, email: str, password: Optional[str] = None, google_id: Optional[str] = None, avatar_url: Optional[str] = None) -> Dict[str, Any]:
    clean_email = email.lower().strip()
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(password) if password else None
    
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (id, name, email, password, google_id, avatar_url) VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_id, name.strip(), clean_email, hashed_pwd, google_id, avatar_url)
                )
            conn.commit()
            conn.close()
            return {
                "id": user_id,
                "name": name.strip(),
                "email": clean_email,
                "google_id": google_id,
                "avatar_url": avatar_url
            }
        except Exception as e:
            logger.error(f"PostgreSQL insert user error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute(
        "INSERT INTO users (id, name, email, password, google_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, name.strip(), clean_email, hashed_pwd, google_id, avatar_url)
    )
    sq_conn.commit()
    sq_conn.close()
    
    return {
        "id": user_id,
        "name": name.strip(),
        "email": clean_email,
        "google_id": google_id,
        "avatar_url": avatar_url
    }

def update_google_user(email: str, google_id: str, avatar_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
    clean_email = email.lower().strip()
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET google_id = %s, avatar_url = COALESCE(%s, avatar_url) WHERE email = %s",
                    (google_id, avatar_url, clean_email)
                )
            conn.commit()
            conn.close()
            return get_user_by_email(clean_email)
        except Exception as e:
            logger.error(f"PostgreSQL update google user error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute(
        "UPDATE users SET google_id = ?, avatar_url = COALESCE(?, avatar_url) WHERE lower(email) = ?",
        (google_id, avatar_url, clean_email)
    )
    sq_conn.commit()
    sq_conn.close()
    return get_user_by_email(clean_email)

def update_user_password(email: str, new_password: str) -> bool:
    clean_email = email.lower().strip()
    hashed_pwd = hash_password(new_password)
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET password = %s WHERE email = %s", (hashed_pwd, clean_email))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"PostgreSQL update password error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute("UPDATE users SET password = ? WHERE lower(email) = ?", (hashed_pwd, clean_email))
    sq_conn.commit()
    sq_conn.close()
    return True


import json
import math

def save_user_document(user_id: str, title: str, file_type: str, file_path_or_url: str = "", char_count: int = 0) -> str:
    doc_id = str(uuid.uuid4())
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO user_documents (id, user_id, title, file_type, file_path_or_url, char_count) VALUES (%s, %s, %s, %s, %s, %s)",
                    (doc_id, user_id, title, file_type, file_path_or_url, char_count)
                )
            conn.commit()
            conn.close()
            return doc_id
        except Exception as e:
            logger.error(f"PostgreSQL save_user_document error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute(
        "INSERT INTO user_documents (id, user_id, title, file_type, file_path_or_url, char_count) VALUES (?, ?, ?, ?, ?, ?)",
        (doc_id, user_id, title, file_type, file_path_or_url, char_count)
    )
    sq_conn.commit()
    sq_conn.close()
    return doc_id


def save_document_chunks(doc_id: str, user_id: str, chunks: list[str], embeddings: list[list[float]]) -> bool:
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                # Test if vector column is available
                has_vector = False
                try:
                    cur.execute("SELECT embedding FROM document_embeddings LIMIT 0;")
                    has_vector = True
                except Exception:
                    conn.rollback()

                for chunk_text, emb in zip(chunks, embeddings):
                    chunk_id = str(uuid.uuid4())
                    if has_vector:
                        cur.execute(
                            "INSERT INTO document_embeddings (id, document_id, user_id, chunk_text, embedding) VALUES (%s, %s, %s, %s, %s::vector)",
                            (chunk_id, doc_id, user_id, chunk_text, str(emb))
                        )
                    else:
                        cur.execute(
                            "INSERT INTO document_embeddings (id, document_id, user_id, chunk_text, embedding_json) VALUES (%s, %s, %s, %s, %s)",
                            (chunk_id, doc_id, user_id, chunk_text, json.dumps(emb))
                        )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"PostgreSQL save_document_chunks error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    for chunk_text, emb in zip(chunks, embeddings):
        chunk_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO document_embeddings (id, document_id, user_id, chunk_text, embedding_json) VALUES (?, ?, ?, ?, ?)",
            (chunk_id, doc_id, user_id, chunk_text, json.dumps(emb))
        )
    sq_conn.commit()
    sq_conn.close()
    return True


def get_user_documents(user_id: str) -> list[dict]:
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, title, file_type, file_path_or_url, char_count, created_at FROM user_documents WHERE user_id = %s ORDER BY created_at DESC",
                    (user_id,)
                )
                rows = cur.fetchall()
            conn.close()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"PostgreSQL get_user_documents error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute(
        "SELECT id, title, file_type, file_path_or_url, char_count, created_at FROM user_documents WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cur.fetchall()
    sq_conn.close()
    return [
        {
            "id": r[0],
            "title": r[1],
            "file_type": r[2],
            "file_path_or_url": r[3],
            "char_count": r[4],
            "created_at": r[5]
        }
        for r in rows
    ]


def delete_user_document(doc_id: str, user_id: str) -> bool:
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM document_embeddings WHERE document_id = %s AND user_id = %s", (doc_id, user_id))
                cur.execute("DELETE FROM user_documents WHERE id = %s AND user_id = %s", (doc_id, user_id))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"PostgreSQL delete_user_document error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute("DELETE FROM document_embeddings WHERE document_id = ? AND user_id = ?", (doc_id, user_id))
    cur.execute("DELETE FROM user_documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    sq_conn.commit()
    sq_conn.close()
    return True


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def similarity_search(user_id: str, query_embedding: list[float], top_k: int = 4) -> list[dict]:
    results = []
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                has_vector = False
                try:
                    cur.execute("SELECT embedding FROM document_embeddings LIMIT 0;")
                    has_vector = True
                except Exception:
                    conn.rollback()

                if has_vector:
                    cur.execute(
                        """
                        SELECT de.chunk_text, ud.title, 1 - (de.embedding <=> %s::vector) AS score
                        FROM document_embeddings de
                        JOIN user_documents ud ON de.document_id = ud.id
                        WHERE de.user_id = %s
                        ORDER BY de.embedding <=> %s::vector ASC
                        LIMIT %s;
                        """,
                        (str(query_embedding), user_id, str(query_embedding), top_k)
                    )
                    rows = cur.fetchall()
                    conn.close()
                    return [{"text": r["chunk_text"], "title": r["title"], "score": float(r["score"] or 0)} for r in rows]
                else:
                    cur.execute(
                        """
                        SELECT de.chunk_text, ud.title, de.embedding_json
                        FROM document_embeddings de
                        JOIN user_documents ud ON de.document_id = ud.id
                        WHERE de.user_id = %s;
                        """,
                        (user_id,)
                    )
                    rows = cur.fetchall()
                    conn.close()
                    scored_rows = []
                    for r in rows:
                        emb = json.loads(r["embedding_json"])
                        score = _cosine_similarity(query_embedding, emb)
                        scored_rows.append({"text": r["chunk_text"], "title": r["title"], "score": score})
                    scored_rows.sort(key=lambda x: x["score"], reverse=True)
                    return scored_rows[:top_k]
        except Exception as e:
            logger.error(f"PostgreSQL similarity_search error: {e}")
            if conn:
                conn.close()

    sq_conn = get_sqlite_connection()
    cur = sq_conn.cursor()
    cur.execute(
        """
        SELECT de.chunk_text, ud.title, de.embedding_json
        FROM document_embeddings de
        JOIN user_documents ud ON de.document_id = ud.id
        WHERE de.user_id = ?;
        """,
        (user_id,)
    )
    rows = cur.fetchall()
    sq_conn.close()
    scored_rows = []
    for r in rows:
        emb = json.loads(r[2])
        score = _cosine_similarity(query_embedding, emb)
        scored_rows.append({"text": r[0], "title": r[1], "score": score})
    scored_rows.sort(key=lambda x: x["score"], reverse=True)
    return scored_rows[:top_k]


from datetime import datetime

def save_chat_thread(thread_id: str, user_id: Optional[str] = None, title: str = "New Conversation") -> str:
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO chat_threads (id, user_id, title, updated_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = CURRENT_TIMESTAMP;
                    """,
                    (thread_id, user_id, title)
                )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"PostgreSQL save_chat_thread error: {e}")
            if conn:
                conn.close()
    return thread_id

def save_chat_message(thread_id: str, role: str, content: str, msg_id: Optional[str] = None, citations: Optional[list] = None, web_sources: Optional[list] = None) -> dict:
    if not msg_id:
        msg_id = str(uuid.uuid4())
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO chat_messages (id, thread_id, role, content, citations, web_sources)
                    VALUES (%s, %s, %s, %s, %s, %s);
                    """,
                    (msg_id, thread_id, role, content, json.dumps(citations) if citations else None, json.dumps(web_sources) if web_sources else None)
                )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"PostgreSQL save_chat_message error: {e}")
            if conn:
                conn.close()
    return {
        "id": msg_id,
        "role": role,
        "content": content,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "status": "complete",
        "citations": citations,
        "webSources": web_sources
    }

def get_user_chat_threads(user_id: Optional[str] = None) -> list[dict]:
    conn = get_pg_connection()
    if not conn:
        return []
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if user_id:
                cur.execute(
                    """
                    SELECT ct.id, ct.title, COUNT(cm.id) AS message_count
                    FROM chat_threads ct
                    LEFT JOIN chat_messages cm ON ct.id = cm.thread_id
                    WHERE ct.user_id = %s OR ct.id LIKE %s OR ct.id LIKE %s
                    GROUP BY ct.id, ct.title, ct.updated_at
                    ORDER BY ct.updated_at DESC;
                    """,
                    (user_id, f"{user_id}__%", f"{user_id}:%")
                )
            else:
                cur.execute(
                    """
                    SELECT ct.id, ct.title, COUNT(cm.id) AS message_count
                    FROM chat_threads ct
                    LEFT JOIN chat_messages cm ON ct.id = cm.thread_id
                    GROUP BY ct.id, ct.title, ct.updated_at
                    ORDER BY ct.updated_at DESC;
                    """
                )
            rows = cur.fetchall()
        conn.close()
        return [{"id": r["id"], "title": r["title"] or "New Conversation", "messageCount": int(r["message_count"] or 0)} for r in rows]
    except Exception as e:
        logger.error(f"PostgreSQL get_user_chat_threads error: {e}")
        if conn:
            conn.close()
        return []

def get_chat_thread_details(thread_id: str) -> dict:
    conn = get_pg_connection()
    title = "New Conversation"
    messages = []
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT title FROM chat_threads WHERE id = %s;", (thread_id,))
                t_row = cur.fetchone()
                if t_row:
                    title = t_row["title"] or title
                cur.execute(
                    """
                    SELECT id, role, content, citations, web_sources, created_at
                    FROM chat_messages
                    WHERE thread_id = %s
                    ORDER BY created_at ASC;
                    """,
                    (thread_id,)
                )
                rows = cur.fetchall()
                for r in rows:
                    msg = {
                        "id": r["id"],
                        "role": r["role"],
                        "content": r["content"],
                        "createdAt": r["created_at"].isoformat() + "Z" if r.get("created_at") else datetime.utcnow().isoformat() + "Z",
                        "status": "complete"
                    }
                    if r.get("citations"):
                        msg["citations"] = json.loads(r["citations"]) if isinstance(r["citations"], str) else r["citations"]
                    if r.get("web_sources"):
                        msg["webSources"] = json.loads(r["web_sources"]) if isinstance(r["web_sources"], str) else r["web_sources"]
                    messages.append(msg)
            conn.close()
        except Exception as e:
            logger.error(f"PostgreSQL get_chat_thread_details error: {e}")
            if conn:
                conn.close()
    return {
        "threadId": thread_id,
        "title": title,
        "messages": messages
    }

def delete_chat_thread(thread_id: str) -> bool:
    conn = get_pg_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM chat_messages WHERE thread_id = %s;", (thread_id,))
                cur.execute("DELETE FROM chat_threads WHERE id = %s;", (thread_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"PostgreSQL delete_chat_thread error: {e}")
            if conn:
                conn.close()
    return False


