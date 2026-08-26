import json
import requests
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, AIMessageChunk
from backend.config import (
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    OLLAMA_MODEL,
    get_openrouter_models_list
)


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


# Default LLM initialization
if OPENROUTER_API_KEY:
    print(f"Lumi AI: Initializing OpenRouter LLM (Primary: {OPENROUTER_MODEL}, Free tier with auto-fallback)")
    llm = OpenRouterLLM(api_key=OPENROUTER_API_KEY, model_name=OPENROUTER_MODEL)
elif GROQ_API_KEY:
    print(f"Lumi AI: Initializing Groq LLM (Model: {GROQ_MODEL})")
    llm = GroqLLM(api_key=GROQ_API_KEY, model_name=GROQ_MODEL)
else:
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


def get_llm_instance(model_name: str | None = None):
    """Return an appropriate LLM instance based on requested model name and available provider keys."""
    if model_name:
        if OPENROUTER_API_KEY:
            return OpenRouterLLM(api_key=OPENROUTER_API_KEY, model_name=model_name)
        elif GROQ_API_KEY:
            return GroqLLM(api_key=GROQ_API_KEY, model_name=model_name)
    return llm
