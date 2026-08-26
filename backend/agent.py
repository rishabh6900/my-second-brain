from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

from backend.config import OPENROUTER_API_KEY, GROQ_API_KEY
from backend.llm import llm, OpenRouterLLM, GroqLLM


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
            
    # Invoke active LLM
    response = active_llm.invoke(cleaned_messages)
    return {"messages": [response]}


checkpointer = MemorySaver()

graph = StateGraph(ChatState)
graph.add_node("chat_node", chat_node)
graph.add_edge(START, "chat_node")
graph.add_edge("chat_node", END)

chatbot = graph.compile(checkpointer=checkpointer)


def retrieve_all_threads():
    import db
    threads = db.get_user_chat_threads()
    return [t["id"] for t in threads]
