import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page-container">
      <!-- Background Cyber Ambient Mesh & Glows -->
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>
      <div class="ambient-glow glow-3"></div>
      <div class="grid-overlay"></div>

      <!-- Navigation Header -->
      <header class="auth-header">
        <div class="brand" (click)="navigateToChat.emit()">
          <div class="logo-icon">
            <i class="ri-sparkling-fill"></i>
          </div>
          <div class="brand-text">
            <h2>Lumi AI</h2>
            <span class="brand-sub">Second Brain OS</span>
          </div>
        </div>

        <div class="header-badges">
          <div class="status-pill">
            <span class="pulse-dot"></span>
            <span>Free Multi-LLM Cloud</span>
          </div>
        </div>

        <div class="header-actions">
          <button 
            class="theme-btn" 
            (click)="themeService.toggleTheme()" 
            [title]="themeService.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <i [class]="themeService.isDark ? 'ri-sun-line' : 'ri-moon-line'"></i>
          </button>

          <button *ngIf="authService.isLoggedIn" class="go-chat-header-btn" (click)="navigateToChat.emit()">
            <i class="ri-chat-3-line"></i>
            <span>Open Chat Workspace</span>
            <i class="ri-arrow-right-line"></i>
          </button>

        </div>
      </header>

      <!-- Main Landing & Auth Hub -->
      <main class="auth-main">
        <!-- Left Hero & Capability Showcase -->
        <div class="hero-section">
          <div class="hero-badge-row">
            <span class="pill-badge glow-badge">
              <i class="ri-brain-line"></i> Next-Gen AI Intelligence Platform
            </span>
            <span class="pill-badge meta-badge">
              <i class="ri-shield-check-line"></i> Private & Persistent
            </span>
          </div>

          <h1 class="hero-title">
            Empower Your Mind with <br>
            <span class="gradient-text glow-text">Lumi AI</span>
          </h1>

          <p class="hero-desc">
            Your high-performance AI second brain. Combine deep conversation memory, 
            vectorized knowledge retrieval, live web research, and multilingual voice speech in one unified interface.
          </p>

          <!-- Interactive Highlights Stats Ticker -->
          <div class="stats-bar">
            <div class="stat-item">
              <span class="stat-num">7+</span>
              <span class="stat-label">Free LLM Models</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">384-d</span>
              <span class="stat-label">PGVector RAG</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">15+</span>
              <span class="stat-label">Voice Languages</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">Live</span>
              <span class="stat-label">Tavily Web Search</span>
            </div>
          </div>

          <!-- Feature Capability Grid (Static Showcase) -->
          <div class="feature-grid">
            <div class="feature-item">
              <div class="feat-icon-box purple">
                <i class="ri-book-open-line"></i>
              </div>
              <div class="feat-content">
                <div class="feat-header-row">
                  <h4>PGVector Knowledge Vault</h4>
                  <span class="tag-badge">RAG</span>
                </div>
                <p>Embed PDFs, TXT, Markdown notes & Web URLs with instant vector search and citation match badges.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feat-icon-box blue">
                <i class="ri-database-2-line"></i>
              </div>
              <div class="feat-content">
                <div class="feat-header-row">
                  <h4>LangGraph Stateful Memory</h4>
                  <span class="tag-badge">Memory</span>
                </div>
                <p>Multi-turn conversation persistence across threads. Never lose historical reasoning or context.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feat-icon-box pink">
                <i class="ri-mic-line"></i>
              </div>
              <div class="feat-content">
                <div class="feat-header-row">
                  <h4>Voice Dictation & Neural TTS</h4>
                  <span class="tag-badge">Speech</span>
                </div>
                <p>Dictate via Google STT and listen to AI answers with audio synthesis across 15+ global languages.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feat-icon-box amber">
                <i class="ri-search-eye-line"></i>
              </div>
              <div class="feat-content">
                <div class="feat-header-row">
                  <h4>Live Web Search Agent</h4>
                  <span class="tag-badge">Live Web</span>
                </div>
                <p>Autonomous Tavily research integration fetches breaking news, live data, and citations seamlessly.</p>
              </div>
            </div>
          </div>

          <!-- Quick Starter Prompts -->
          <div class="quick-prompts-section">
            <span class="prompts-title"><i class="ri-flashlight-line"></i> Quick Launch Ideas:</span>
            <div class="prompt-chips">
              <button class="prompt-chip" (click)="launchWithPrompt('Summarize my uploaded notes in Knowledge Vault')">
                📄 <span>Summarize my vault documents</span>
              </button>
              <button class="prompt-chip" (click)="launchWithPrompt('Search the latest AI tech breakthroughs this week')">
                🌐 <span>Latest AI tech news</span>
              </button>
              <button class="prompt-chip" (click)="launchWithPrompt('Explain quantum computing simply in Hindi')">
                🎙️ <span>Multilingual voice explanation</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Glassmorphism Auth / Welcome Hub -->
        <div class="auth-card-wrapper">

          <!-- Welcome Card when Logged In -->
          <div *ngIf="authService.isLoggedIn" class="welcome-card glass-panel">
            <div class="welcome-card-glow"></div>
            
            <div class="user-avatar-wrapper">
              <div class="user-avatar-lg">
                {{ (authService.currentUser?.name || 'U').charAt(0).toUpperCase() }}
              </div>
              <span class="online-indicator" title="Active"></span>
            </div>

            <div class="welcome-user-info">
              <div class="tier-chip">
                <i class="ri-vip-crown-2-fill"></i>
                <span>Active Member</span>
              </div>
              <h3 class="welcome-name">Welcome back, {{ authService.currentUser?.name }}!</h3>
              <p class="user-email-text">{{ authService.currentUser?.email }}</p>
            </div>

            <!-- Dashboard Quick Actions -->
            <div class="dashboard-shortcuts">
              <button class="shortcut-box" (click)="navigateToChat.emit()">
                <i class="ri-chat-smile-2-line"></i>
                <div class="shortcut-text">
                  <strong>Chat Assistant</strong>
                  <small>Open active stream</small>
                </div>
                <i class="ri-arrow-right-s-line arrow-icon"></i>
              </button>

              <button class="shortcut-box" (click)="navigateToChat.emit()">
                <i class="ri-folder-open-line"></i>
                <div class="shortcut-text">
                  <strong>Knowledge Vault</strong>
                  <small>Search & upload docs</small>
                </div>
                <i class="ri-arrow-right-s-line arrow-icon"></i>
              </button>
            </div>

            <!-- Primary Action Launch -->
            <button class="launch-chat-btn" (click)="navigateToChat.emit()">
              <i class="ri-chat-3-line"></i>
              <span>Launch Workspace</span>
              <i class="ri-arrow-right-line"></i>
            </button>

            <!-- System Info Pills -->
            <div class="system-status-box">
              <div class="status-row">
                <span><i class="ri-cpu-line"></i> LLM Engine</span>
                <span class="status-val green">Auto Fallback Ready</span>
              </div>
              <div class="status-row">
                <span><i class="ri-database-line"></i> Vector Store</span>
                <span class="status-val green">PGVector / SQLite</span>
              </div>
            </div>

            <button class="logout-link-btn" (click)="authService.logout()">
              <i class="ri-logout-box-r-line"></i> Sign Out
            </button>
          </div>

          <!-- Auth Card when Logged Out -->
          <div *ngIf="!authService.isLoggedIn" class="auth-card glass-panel">
            <div class="auth-card-glow"></div>

            <div class="card-header">
              <div class="auth-title-group">
                <h3>Get Started</h3>
                <p>Sign in to sync your conversation memory and vault</p>
              </div>

              <div class="tab-switcher">
                <button 
                  [class.active]="activeTab === 'login'" 
                  (click)="activeTab = 'login'; errorMessage = ''; successMessage = ''"
                >
                  Log In
                </button>
                <button 
                  [class.active]="activeTab === 'register'" 
                  (click)="activeTab = 'register'; errorMessage = ''; successMessage = ''"
                >
                  Create Account
                </button>
              </div>
            </div>

            <!-- Error Banner -->
            <div *ngIf="errorMessage" class="error-banner">
              <i class="ri-error-warning-line"></i>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Success Banner -->
            <div *ngIf="successMessage" class="success-banner">
              <i class="ri-checkbox-circle-line"></i>
              <span>{{ successMessage }}</span>
            </div>

            <!-- Login Form -->
            <form *ngIf="activeTab === 'login'" (ngSubmit)="handleLogin()" class="auth-form">
              <div class="form-group">
                <label>Email Address</label>
                <div class="input-icon-box">
                  <i class="ri-mail-line"></i>
                  <input 
                    type="email" 
                    [(ngModel)]="loginEmail" 
                    name="loginEmail"
                    placeholder="name@company.com" 
                    required 
                    autocomplete="email"
                  />
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label>Password</label>
                  <button type="button" class="forgot-link-btn" (click)="activeTab = 'reset'; errorMessage = ''; successMessage = ''">
                    Forgot password?
                  </button>
                </div>
                <div class="input-icon-box">
                  <i class="ri-lock-line"></i>
                  <input 
                    [type]="showLoginPassword ? 'text' : 'password'" 
                    [(ngModel)]="loginPassword" 
                    name="loginPassword"
                    placeholder="••••••••" 
                    required 
                    autocomplete="current-password"
                  />
                  <button 
                    type="button" 
                    class="toggle-pwd-btn" 
                    (click)="showLoginPassword = !showLoginPassword" 
                    [title]="showLoginPassword ? 'Hide Password' : 'Show Password'"
                  >
                    <i [class]="showLoginPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
                  </button>
                </div>
              </div>

              <button type="submit" class="submit-btn" [disabled]="isLoading">
                <span *ngIf="!isLoading">Log In to Workspace</span>
                <ng-container *ngIf="isLoading">
                  <span class="spinner"></span>
                  <span>Authenticating...</span>
                </ng-container>
              </button>

            </form>

            <!-- Register Form -->
            <form *ngIf="activeTab === 'register'" (ngSubmit)="handleRegister()" class="auth-form">
              <div class="form-group">
                <label>Full Name</label>
                <div class="input-icon-box">
                  <i class="ri-user-line"></i>
                  <input 
                    type="text" 
                    [(ngModel)]="regName" 
                    name="regName"
                    placeholder="Rishabh Prajapati" 
                    required 
                    autocomplete="name"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <div class="input-icon-box">
                  <i class="ri-mail-line"></i>
                  <input 
                    type="email" 
                    [(ngModel)]="regEmail" 
                    name="regEmail"
                    placeholder="name@company.com" 
                    required 
                    autocomplete="email"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Create Password</label>
                <div class="input-icon-box">
                  <i class="ri-lock-line"></i>
                  <input 
                    [type]="showRegPassword ? 'text' : 'password'" 
                    [(ngModel)]="regPassword" 
                    name="regPassword"
                    placeholder="At least 6 characters" 
                    required 
                    autocomplete="new-password"
                  />
                  <button 
                    type="button" 
                    class="toggle-pwd-btn" 
                    (click)="showRegPassword = !showRegPassword" 
                    [title]="showRegPassword ? 'Hide Password' : 'Show Password'"
                  >
                    <i [class]="showRegPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
                  </button>
                </div>
              </div>

              <button type="submit" class="submit-btn" [disabled]="isLoading">
                <span *ngIf="!isLoading">Create Free Account</span>
                <ng-container *ngIf="isLoading">
                  <span class="spinner"></span>
                  <span>Creating Account...</span>
                </ng-container>
              </button>

            </form>

            <!-- Reset Password Form -->
            <form *ngIf="activeTab === 'reset'" (ngSubmit)="handleResetPassword()" class="auth-form">
              <div class="reset-header">
                <h3>Reset Password</h3>
                <p>Enter your registered email and new password.</p>
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <div class="input-icon-box">
                  <i class="ri-mail-line"></i>
                  <input 
                    type="email" 
                    [(ngModel)]="resetEmail" 
                    name="resetEmail"
                    placeholder="name@company.com" 
                    required 
                    autocomplete="email"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>New Password</label>
                <div class="input-icon-box">
                  <i class="ri-lock-line"></i>
                  <input 
                    [type]="showResetPassword ? 'text' : 'password'" 
                    [(ngModel)]="resetPassword" 
                    name="resetPassword"
                    placeholder="At least 6 characters" 
                    required 
                    autocomplete="new-password"
                  />
                  <button 
                    type="button" 
                    class="toggle-pwd-btn" 
                    (click)="showResetPassword = !showResetPassword" 
                    [title]="showResetPassword ? 'Hide Password' : 'Show Password'"
                  >
                    <i [class]="showResetPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
                  </button>
                </div>
              </div>

              <button type="submit" class="submit-btn" [disabled]="isLoading">
                <span *ngIf="!isLoading">Update Password</span>
                <ng-container *ngIf="isLoading">
                  <span class="spinner"></span>
                  <span>Updating Password...</span>
                </ng-container>
              </button>

              <button type="button" class="back-login-btn" (click)="activeTab = 'login'; errorMessage = ''; successMessage = ''">
                <i class="ri-arrow-left-line"></i> Back to Log In
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: 100vh;
      width: 100vw;
      background-color: var(--bg-dark);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow-x: hidden;
      overflow-y: auto;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.08) 0%, transparent 40%);
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      pointer-events: none;
      z-index: 1;
    }

    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(140px);
      pointer-events: none;
      opacity: 0.35;
      animation: float-glow 14s ease-in-out infinite alternate;
    }

    .glow-1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, #6366f1 0%, transparent 70%);
      top: -120px;
      left: -120px;
    }

    .glow-2 {
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, #ec4899 0%, transparent 70%);
      bottom: -180px;
      right: -150px;
      animation-delay: -5s;
    }

    .glow-3 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
      top: 40%;
      left: 35%;
      animation-delay: -9s;
    }

    @keyframes float-glow {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -25px) scale(1.08); }
      100% { transform: translate(-20px, 35px) scale(0.95); }
    }

    .auth-header {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 3.5rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-header);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      cursor: pointer;
      user-select: none;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      color: #fff;
      box-shadow: 0 0 20px var(--accent-glow);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .brand:hover .logo-icon {
      transform: scale(1.08) rotate(6deg);
    }

    .brand-text h2 {
      font-family: var(--font-heading);
      font-size: 1.35rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .brand-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .header-badges {
      display: flex;
      align-items: center;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 20px;
      padding: 0.3rem 0.85rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #16a34a;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      background-color: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 8px #22c55e;
      animation: pulse-light 1.8s infinite;
    }

    @keyframes pulse-light {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .go-chat-header-btn {
      background: var(--accent-gradient);
      border: none;
      border-radius: 20px;
      padding: 0.55rem 1.25rem;
      color: white;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      box-shadow: 0 4px 16px var(--accent-glow);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .go-chat-header-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 22px var(--accent-glow);
    }

    .quick-demo-btn {
      background: var(--bg-pill);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.5rem 1.1rem;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.2s ease;
    }

    .quick-demo-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--border-active);
      color: var(--accent-primary);
    }

    .theme-btn {
      background: var(--bg-pill);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 1.15rem;
      transition: all 0.2s ease;
    }

    .theme-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--border-active);
      transform: rotate(15deg);
    }

    .auth-main {
      flex: 1;
      max-width: 1320px;
      width: 100%;
      margin: 0 auto;
      padding: 3.5rem 2.5rem;
      display: grid;
      grid-template-columns: 1.25fr 0.95fr;
      gap: 3.5rem;
      align-items: center;
      position: relative;
      z-index: 10;
    }

    .hero-section {
      display: flex;
      flex-direction: column;
      gap: 1.6rem;
    }

    .hero-badge-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.95rem;
      background: var(--bg-pill);
      border: 1px solid var(--border-active);
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--badge-text);
      width: fit-content;
      backdrop-filter: blur(10px);
    }

    .glow-badge {
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.2);
    }

    .meta-badge {
      border-color: var(--border-color);
      color: var(--text-secondary);
      background: var(--bg-pill);
    }

    .hero-title {
      font-family: var(--font-heading);
      font-size: 3.2rem;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: var(--text-primary);
    }

    .gradient-text {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .glow-text {
      text-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
    }

    .hero-desc {
      font-size: 1.08rem;
      color: var(--text-secondary);
      line-height: 1.65;
      max-width: 580px;
    }

    .stats-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.85rem 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      width: fit-content;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-num {
      font-family: var(--font-heading);
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-divider {
      width: 1px;
      height: 24px;
      background: var(--border-color);
    }

    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.1rem;
      margin-top: 0.5rem;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 0.95rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.1rem;
      cursor: default;
      user-select: none;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      transition: border-color 0.25s ease, background 0.25s ease;
    }

    .feature-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.06), transparent 70%);
      pointer-events: none;
    }

    .feature-item:hover {
      border-color: rgba(99, 102, 241, 0.3);
      background: var(--bg-card);
    }

    .feat-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .feat-icon-box.purple {
      background: rgba(139, 92, 246, 0.15);
      color: #8b5cf6;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }

    .feat-icon-box.blue {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .feat-icon-box.pink {
      background: rgba(236, 72, 153, 0.15);
      color: #ec4899;
      border: 1px solid rgba(236, 72, 153, 0.3);
    }

    .feat-icon-box.amber {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .feat-content {
      flex: 1;
    }

    .feat-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .feat-content h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .tag-badge {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--bg-pill);
      color: var(--badge-text);
      border: 1px solid var(--border-color);
      letter-spacing: 0.03em;
    }

    .feat-content p {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
    }

    .quick-prompts-section {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-top: 0.25rem;
    }

    .prompts-title {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .prompt-chips {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .prompt-chip {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.45rem 0.9rem;
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .prompt-chip:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-active);
      color: var(--accent-primary);
      transform: translateY(-2px);
    }

    .auth-card-wrapper {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .welcome-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem 2.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.25rem;
      border-radius: 28px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color);
      background: var(--bg-card);
    }

    .welcome-card-glow, .auth-card-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--accent-gradient);
    }

    .user-avatar-wrapper {
      position: relative;
    }

    .user-avatar-lg {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: white;
      font-size: 2.2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px var(--accent-glow);
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 4px;
      width: 16px;
      height: 16px;
      background-color: #22c55e;
      border: 3px solid var(--bg-card);
      border-radius: 50%;
    }

    .welcome-user-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }

    .tier-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.65rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--badge-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .welcome-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .user-email-text {
      color: var(--text-muted);
      font-size: 0.88rem;
      margin: 0;
    }

    .dashboard-shortcuts {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin: 0.25rem 0;
    }

    .shortcut-box {
      width: 100%;
      background: var(--bg-pill);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      cursor: pointer;
      color: var(--text-primary);
      text-align: left;
      transition: all 0.2s ease;
    }

    .shortcut-box i:first-child {
      font-size: 1.3rem;
      color: var(--accent-primary);
    }

    .shortcut-box .arrow-icon {
      margin-left: auto;
      color: var(--text-muted);
      font-size: 1.1rem;
      transition: transform 0.2s ease;
    }

    .shortcut-box:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-active);
      transform: translateX(3px);
    }

    .shortcut-box:hover .arrow-icon {
      transform: translateX(3px);
      color: var(--text-primary);
    }

    .shortcut-text {
      display: flex;
      flex-direction: column;
    }

    .shortcut-text strong {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .shortcut-text small {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .launch-chat-btn {
      width: 100%;
      background: var(--accent-gradient);
      border: none;
      border-radius: 16px;
      padding: 1rem;
      color: white;
      font-weight: 800;
      font-size: 1.05rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      box-shadow: 0 8px 25px var(--accent-glow);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .launch-chat-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px var(--accent-glow);
    }

    .system-status-box {
      width: 100%;
      background: var(--bg-pill);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.65rem 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .status-row i {
      margin-right: 0.35rem;
    }

    .status-val.green {
      color: #16a34a;
      font-weight: 600;
    }

    .logout-link-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.88rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: color 0.2s ease;
      margin-top: -0.25rem;
    }

    .logout-link-btn:hover {
      color: #ef4444;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      border-radius: 28px;
      padding: 2.2rem;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      position: relative;
      overflow: hidden;
    }

    .auth-title-group {
      margin-bottom: 1.25rem;
    }

    .auth-title-group h3 {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .auth-title-group p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }

    .tab-switcher {
      display: flex;
      background: var(--bg-tab-bar);
      border-radius: 14px;
      padding: 4px;
      border: 1px solid var(--border-color);
      margin-bottom: 1.25rem;
    }

    .tab-switcher button {
      flex: 1;
      padding: 0.65rem;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.9rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-switcher button.active {
      background: var(--accent-primary);
      color: white;
      box-shadow: 0 2px 12px var(--accent-glow);
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .success-banner {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #16a34a;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-group label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .forgot-link-btn {
      background: transparent;
      border: none;
      color: var(--accent-primary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s ease;
    }

    .forgot-link-btn:hover {
      text-decoration: underline;
      filter: brightness(1.2);
    }

    .reset-header h3 {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .reset-header p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }

    .back-login-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.75rem;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      margin-top: 0.25rem;
    }

    .back-login-btn:hover {
      background: var(--bg-pill);
      color: var(--text-primary);
    }

    .input-icon-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.75rem 0.95rem;
      transition: all 0.2s ease;
    }

    .input-icon-box:focus-within {
      border-color: var(--border-active);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .input-icon-box i {
      color: var(--text-muted);
      font-size: 1.15rem;
    }

    .input-icon-box input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.92rem;
      font-family: var(--font-body);
    }

    .toggle-pwd-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0 0.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      transition: color 0.2s ease;
    }

    .toggle-pwd-btn:hover {
      color: var(--text-primary);
    }

    .submit-btn {
      background: var(--accent-gradient);
      border: none;
      border-radius: 14px;
      padding: 0.9rem 1.25rem;
      color: white;
      font-weight: 700;
      font-size: 0.98rem;
      cursor: pointer;
      box-shadow: 0 6px 18px var(--accent-glow);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      min-height: 48px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px var(--accent-glow);
    }

    .submit-btn:disabled {
      opacity: 0.85;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255, 255, 255, 0.35);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: auth-spin 0.75s linear infinite;
      display: inline-block;
    }

    @keyframes auth-spin {
      to { transform: rotate(360deg); }
    }

    .or-divider {
      text-align: center;
      position: relative;
      margin: 0.25rem 0;
    }

    .or-divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: var(--border-color);
    }

    .or-divider span {
      position: relative;
      background: var(--or-badge-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2px 12px;
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .guest-btn {
      background: var(--bg-pill);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.85rem;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      transition: all 0.2s ease;
    }

    .guest-btn:hover {
      background: rgba(99, 102, 241, 0.12);
      border-color: var(--border-active);
      color: var(--accent-primary);
      transform: translateY(-1px);
    }

    /* --- Specialized Light Theme Polish --- */
    :host-context([data-theme="light"]) .auth-page-container {
      background-color: #f8fafc;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
        radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.06) 0%, transparent 50%);
    }

    :host-context([data-theme="light"]) .grid-overlay {
      background-image: 
        linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    }

    :host-context([data-theme="light"]) .ambient-glow {
      opacity: 0.12;
    }

    :host-context([data-theme="light"]) .auth-header {
      background: rgba(255, 255, 255, 0.88);
      border-bottom: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    :host-context([data-theme="light"]) .status-pill {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #059669;
    }

    :host-context([data-theme="light"]) .stats-bar {
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    :host-context([data-theme="light"]) .feature-item {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
    }

    :host-context([data-theme="light"]) .feature-item:hover {
      background: #ffffff;
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 10px 24px rgba(99, 102, 241, 0.1);
    }

    :host-context([data-theme="light"]) .feat-icon-box.purple {
      background: #f3e8ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }

    :host-context([data-theme="light"]) .feat-icon-box.blue {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }

    :host-context([data-theme="light"]) .feat-icon-box.pink {
      background: #fdf2f8;
      color: #db2777;
      border: 1px solid #fbcfe8;
    }

    :host-context([data-theme="light"]) .feat-icon-box.amber {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    :host-context([data-theme="light"]) .prompt-chip {
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    :host-context([data-theme="light"]) .prompt-chip:hover {
      background: #f5f3ff;
      border-color: #c4b5fd;
      color: #4f46e5;
    }

    :host-context([data-theme="light"]) .welcome-card,
    :host-context([data-theme="light"]) .auth-card {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #e2e8f0;
      box-shadow: 0 20px 45px -10px rgba(99, 102, 241, 0.12), 0 8px 24px -6px rgba(0, 0, 0, 0.04);
    }

    :host-context([data-theme="light"]) .online-indicator {
      border: 3px solid #ffffff;
    }

    :host-context([data-theme="light"]) .shortcut-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    :host-context([data-theme="light"]) .shortcut-box:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    :host-context([data-theme="light"]) .system-status-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    :host-context([data-theme="light"]) .input-icon-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    :host-context([data-theme="light"]) .guest-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
    }

    :host-context([data-theme="light"]) .guest-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      color: #0f172a;
    }

    @media (max-width: 1024px) {
      .auth-header {
        padding: 0 1.5rem;
      }
      .header-badges {
        display: none;
      }
      .auth-main {
        grid-template-columns: 1fr;
        padding: 2rem 1.25rem;
        gap: 2.5rem;
      }
      .hero-section {
        text-align: center;
        align-items: center;
      }
      .hero-title {
        font-size: 2.4rem;
      }
      .stats-bar {
        justify-content: center;
      }
      .feature-grid {
        grid-template-columns: 1fr;
        width: 100%;
        max-width: 580px;
      }
      .prompt-chips {
        justify-content: center;
      }
      .welcome-card, .auth-card {
        max-width: 500px;
      }
    }

    @media (max-width: 640px) {
      .auth-header {
        padding: 0 1rem;
        height: 64px;
      }
      .brand-sub {
        display: none;
      }
      .hero-title {
        font-size: 2rem;
      }
      .stats-bar {
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 0.75rem;
      }
      .stat-divider {
        display: none;
      }
      .stat-item {
        align-items: center;
        width: 45%;
      }
      .auth-card, .welcome-card {
        padding: 1.6rem 1.2rem;
      }
    }
  `]
})
export class AuthComponent {
  activeTab: 'login' | 'register' | 'reset' = 'login';

  loginEmail = '';
  loginPassword = '';

  regName = '';
  regEmail = '';
  regPassword = '';

  resetEmail = '';
  resetPassword = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  showLoginPassword = false;
  showRegPassword = false;
  showResetPassword = false;

  @Output() onLoginSuccess = new EventEmitter<void>();
  @Output() navigateToChat = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}

  handleLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Please fill in all fields.';
      this.successMessage = '';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.onLoginSuccess.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Invalid email or password.';
      }
    });
  }

  handleRegister() {
    if (!this.regName || !this.regEmail || !this.regPassword) {
      this.errorMessage = 'Please fill in all fields.';
      this.successMessage = '';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.regName, this.regEmail, this.regPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.loginEmail = this.regEmail;
        this.loginPassword = '';
        this.activeTab = 'login';
        this.successMessage = 'Account created successfully! Please enter your password to log in.';
        this.regName = '';
        this.regEmail = '';
        this.regPassword = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Registration failed. Try again.';
      }
    });
  }

  handleResetPassword() {
    if (!this.resetEmail || !this.resetPassword) {
      this.errorMessage = 'Please fill in all fields.';
      this.successMessage = '';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(this.resetEmail, this.resetPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.loginEmail = this.resetEmail;
        this.loginPassword = '';
        this.activeTab = 'login';
        this.successMessage = 'Password updated successfully! Please log in with your new password.';
        this.resetPassword = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Failed to reset password. Check your email address.';
      }
    });
  }

  launchWithPrompt(promptText: string) {
    if (this.authService.isLoggedIn) {
      this.navigateToChat.emit();
    } else {
      this.activeTab = 'login';
      this.errorMessage = 'Please log in or create an account to access the workspace.';
    }
  }

  onGoogleLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const gWindow = window as any;
    const clientId = gWindow.GOOGLE_CLIENT_ID || '';
    
    if (clientId && clientId !== 'YOUR_REAL_GOOGLE_CLIENT_ID' && gWindow.google?.accounts?.id) {
      try {
        gWindow.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              this.authService.googleLogin({ id_token: response.credential }).subscribe({
                next: () => {
                  this.isLoading = false;
                  this.onLoginSuccess.emit();
                },
                error: (err) => {
                  this.isLoading = false;
                  this.errorMessage = err?.error?.detail || 'Google sign-in failed.';
                }
              });
            }
          }
        });
        gWindow.google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn('Google GSI prompt error', e);
      }
    }

    this.isLoading = false;
    this.errorMessage = 'Google OAuth Client ID is not configured. Please sign up or log in with your email and password.';
  }
}
