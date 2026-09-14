import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VaultDocument {
  id: string;
  title: string;
  file_type: string;
  file_path_or_url?: string;
  char_count: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class VaultService {
  private apiUrl = `${environment.apiUrl}/api/vault`;

  constructor(private http: HttpClient) {}

  getDocuments(userId: string): Observable<VaultDocument[]> {
    return this.http.get<VaultDocument[]>(`${this.apiUrl}/documents`, {
      params: { user_id: userId }
    });
  }

  uploadDocument(file: File, userId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  addUrlDocument(url: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/url`, { url, user_id: userId });
  }

  deleteDocument(docId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/documents/${docId}`, {
      params: { user_id: userId }
    });
  }
}
