import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ThreadSummary {
  id: string;
  title: string;
  messageCount: number;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  citations?: Array<{ title: string; score: number }>;
  webSources?: Array<{ title: string; href: string }>;
}

export interface ThreadDetail {
  threadId: string;
  title: string;
  messages: ChatMessage[];
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  badge?: string;
  icon?: string;
}

export interface AvailableModelsResponse {
  models: ModelOption[];
  default: string;
  active_provider: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getModels(): Observable<AvailableModelsResponse> {
    return this.http.get<AvailableModelsResponse>(`${this.baseUrl}/api/models`);
  }

  getThreads(userId?: string): Observable<ThreadSummary[]> {
    const url = userId ? `${this.baseUrl}/api/threads?user_id=${encodeURIComponent(userId)}` : `${this.baseUrl}/api/threads`;
    return this.http.get<ThreadSummary[]>(url);
  }

  getThread(threadId: string): Observable<ThreadDetail> {
    return this.http.get<ThreadDetail>(`${this.baseUrl}/api/threads/${threadId}`);
  }

  deleteThread(threadId: string): Observable<any> {
    if (!threadId || !threadId.trim()) {
      return of({ message: 'No thread ID provided' });
    }
    return this.http.delete(`${this.baseUrl}/api/threads/${encodeURIComponent(threadId)}`);
  }

  async sendMessageStream(
    threadId: string,
    message: string,
    language: string = 'English',
    onChunk: (chunkText: string) => void,
    onError: (err: any) => void,
    onComplete: () => void,
    useRag: boolean = false,
    userId?: string,
    onCitations?: (citations: Array<{ title: string; score: number }>) => void,
    useWebSearch: boolean = false,
    onWebSources?: (sources: Array<{ title: string; href: string }>) => void,
    model?: string,
    isPrivate: boolean = false
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thread_id: threadId,
          message,
          language,
          model,
          use_rag: useRag,
          use_web_search: useWebSearch,
          user_id: userId,
          is_private: isPrivate
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.text) {
                onChunk(dataObj.text);
              } else if (dataObj.citations && onCitations) {
                onCitations(dataObj.citations);
              } else if (dataObj.webSources && onWebSources) {
                onWebSources(dataObj.webSources);
              } else if (dataObj.error) {
                onError(dataObj.error);
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE chunk', e);
            }
          }
        }
      }
      onComplete();
    } catch (error) {
      onError(error);
    }
  }

  transcribeAudio(file: File | Blob, language: string = 'English'): Observable<{ text: string }> {
    const formData = new FormData();
    formData.append('file', file, 'audio.wav');
    formData.append('language', language);
    return this.http.post<{ text: string }>(`${this.baseUrl}/api/transcribe`, formData);
  }

  getTts(text: string, language: string = 'English'): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/api/tts`, { text, language }, { responseType: 'blob' });
  }
}
