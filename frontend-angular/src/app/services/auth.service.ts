import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    try {
      const savedUser = localStorage.getItem('lumi_user');
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load user from storage', e);
    }
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.baseUrl}/api/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res.user) {
          localStorage.setItem('lumi_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  register(name: string, email: string, password: string): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.baseUrl}/api/auth/register`, { name, email, password });
  }

  resetPassword(email: string, new_password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/reset-password`, { email, new_password });
  }

  demoLogin(): Observable<{ user: User }> {
    const demoUser: User = {
      id: 'demo-user-123',
      name: 'Guest User',
      email: 'guest@lumi.ai'
    };
    localStorage.setItem('lumi_user', JSON.stringify(demoUser));
    this.currentUserSubject.next(demoUser);
    return of({ user: demoUser });
  }

  googleLogin(googlePayload?: { id_token?: string; email?: string; name?: string; google_id?: string; avatar_url?: string }): Observable<{ user: User }> {
    const payload = googlePayload || {
      email: 'user.google@gmail.com',
      name: 'Google User',
      google_id: 'google-demo-id'
    };

    return this.http.post<{ user: User }>(`${this.baseUrl}/api/auth/google`, payload).pipe(
      tap(res => {
        if (res.user) {
          localStorage.setItem('lumi_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      })
    );
  }


  logout() {
    localStorage.removeItem('lumi_user');
    this.currentUserSubject.next(null);
  }
}
