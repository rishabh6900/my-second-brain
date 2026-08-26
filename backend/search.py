import requests
from backend.config import TAVILY_API_KEY


def perform_web_search(query: str, max_results: int = 4) -> tuple[str, list[dict]]:
    results = []
    tavily_key = TAVILY_API_KEY
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
