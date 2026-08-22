import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('dark');
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const savedTheme = (localStorage.getItem('lumi_theme') as Theme) || 'dark';
    this.setTheme(savedTheme);
  }

  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  get isDark(): boolean {
    return this.themeSubject.value === 'dark';
  }

  toggleTheme() {
    const nextTheme: Theme = this.isDark ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(theme: Theme) {
    this.themeSubject.next(theme);
    localStorage.setItem('lumi_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}
