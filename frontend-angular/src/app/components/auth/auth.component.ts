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
      <!-- Background Ambient Glow Effects -->
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>

      <!-- Navigation Header -->
      <header class="auth-header">
        <div class="brand">
          <div class="logo-icon">
            <i class="ri-sparkling-fill"></i>
          </div>
          <h2>Lumi AI</h2>
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

      <!-- Main Landing & Auth Card Content -->
      <main class="auth-main">
        <!-- Left Hero Section -->
        <div class="hero-section">
          <span class="pill-badge">
            <i class="ri-magic-line"></i> Next-Gen AI Second Brain
          </span>
          <h1>Empower Your Thoughts with <span class="gradient-text">Lumi AI</span></h1>
          <p>
            Experience lightning-fast conversation memory, 15+ multilingual voice dictation,
            and deep reasoning powered by state-of-the-art AI models.
          </p>

          <div class="feature-grid">
            <div class="feature-item">
              <i class="ri-book-open-line feat-icon"></i>
              <div>
                <h4>PGVector Knowledge Vault</h4>
                <p>Embed PDFs, TXT, MD notes & Web URLs with RAG search</p>
              </div>
            </div>

            <div class="feature-item">
              <i class="ri-attachment-2 feat-icon"></i>
              <div>
                <h4>Direct Attachments & Citations</h4>
                <p>Attach documents in chat with match score badges 📌</p>
              </div>
            </div>

            <div class="feature-item">
              <i class="ri-database-2-line feat-icon"></i>
              <div>
                <h4>LangGraph Stateful Memory</h4>
                <p>Never lose context across your conversation threads</p>
              </div>
            </div>

            <div class="feature-item">
              <i class="ri-global-line feat-icon"></i>
              <div>
                <h4>15+ Multilingual Speech</h4>
                <p>Chat & dictate in Hindi, Tamil, Spanish, French & more</p>
              </div>
            </div>

            <div class="feature-item">
              <i class="ri-mic-line feat-icon"></i>
              <div>
                <h4>Voice Dictation & TTS</h4>
                <p>Real-time STT voice input and spoken audio MP3 streaming</p>
              </div>
            </div>

            <div class="feature-item">
              <i class="ri-search-eye-line feat-icon"></i>
              <div>
                <h4>Live Web Search Agent</h4>
                <p>Browse up-to-date live web news, stock data & research</p>
              </div>
            </div>

            <div class="feature-item">
              <i class="ri-shield-keyhole-line feat-icon"></i>
              <div>
                <h4>Enterprise Neon DB & Security</h4>
                <p>PostgreSQL persistence with bcrypt password security</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Glassmorphism Auth Form Card -->
        <div class="auth-card-wrapper">

          <!-- Welcome Card when Logged In -->
          <div *ngIf="authService.isLoggedIn" class="welcome-card glass-panel">
            <div class="user-avatar-lg">
              {{ (authService.currentUser?.name || 'U').charAt(0).toUpperCase() }}
            </div>
            <h3>Welcome back, {{ authService.currentUser?.name }}!</h3>
            <p class="user-email-text">{{ authService.currentUser?.email }}</p>
            
            <button class="launch-chat-btn" (click)="navigateToChat.emit()">
              <i class="ri-chat-3-line"></i>
              <span>Go to Chat Section</span>
              <i class="ri-arrow-right-line"></i>
            </button>

            <button class="logout-link-btn" (click)="authService.logout()">
              <i class="ri-logout-box-r-line"></i> Log Out
            </button>
          </div>

          <!-- Auth Forms when Logged Out -->
          <div *ngIf="!authService.isLoggedIn" class="auth-card glass-panel">
            <div class="card-header">
              <div class="tab-switcher">
                <button 
                  [class.active]="activeTab === 'login'" 
                  (click)="activeTab = 'login'; errorMessage = ''"
                >
                  Log In
                </button>
                <button 
                  [class.active]="activeTab === 'register'" 
                  (click)="activeTab = 'register'; errorMessage = ''"
                >
                  Sign Up
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
                <span *ngIf="!isLoading">Log In to Lumi AI</span>
                <ng-container *ngIf="isLoading">
                  <span class="spinner"></span>
                  <span>Logging In...</span>
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
                    placeholder="Alex Morgan" 
                    required 
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
    }

    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
      opacity: 0.25;
    }

    .glow-1 {
      width: 500px;
      height: 500px;
      background: #6366f1;
      top: -100px;
      left: -100px;
    }

    .glow-2 {
      width: 600px;
      height: 600px;
      background: #ec4899;
      bottom: -150px;
      right: -150px;
    }

    .auth-header {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 3rem;
      border-bottom: 1px solid var(--border-color);
      position: relative;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #fff;
      box-shadow: 0 0 16px var(--accent-glow);
    }

    .brand h2 {
      font-family: var(--font-heading);
      font-size: 1.3rem;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .go-chat-header-btn {
      background: var(--accent-gradient);
      border: none;
      border-radius: 20px;
      padding: 0.5rem 1.1rem;
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px var(--accent-glow);
      transition: all 0.2s ease;
    }

    .go-chat-header-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px var(--accent-glow);
    }

    .welcome-card {
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      border-radius: 24px;
    }

    .user-avatar-lg {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: white;
      font-size: 2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px var(--accent-glow);
    }

    .welcome-card h3 {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .user-email-text {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: -0.5rem 0 0.5rem 0;
    }

    .launch-chat-btn {
      width: 100%;
      background: var(--accent-gradient);
      border: none;
      border-radius: 14px;
      padding: 0.95rem;
      color: white;
      font-weight: 700;
      font-size: 1.05rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      box-shadow: 0 6px 20px var(--accent-glow);
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }

    .launch-chat-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 26px var(--accent-glow);
    }

    .logout-link-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: color 0.2s ease;
      margin-top: 0.25rem;
    }

    .logout-link-btn:hover {
      color: #ef4444;
    }

    .demo-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.5rem 1.1rem;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }

    .demo-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--border-active);
    }

    .auth-main {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 3rem 2rem;
      display: grid;
      grid-template-columns: 1.2fr 0.9fr;
      gap: 3rem;
      align-items: center;
      position: relative;
      z-index: 10;
    }

    .hero-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.9rem;
      background: var(--bg-pill);
      border: 1px solid var(--border-active);
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--badge-text);
      width: fit-content;
    }

    .hero-section h1 {
      font-family: var(--font-heading);
      font-size: 2.8rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .gradient-text {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-section p {
      font-size: 1.05rem;
      color: var(--text-secondary);
      line-height: 1.6;
      max-width: 520px;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-top: 1rem;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1rem;
    }

    .feat-icon {
      font-size: 1.3rem;
      color: var(--accent-primary);
      background: rgba(99, 102, 241, 0.12);
      padding: 8px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .feature-item h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .feature-item p {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.3;
    }

    .auth-card-wrapper {
      display: flex;
      justify-content: center;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .card-header {
      margin-bottom: 1.5rem;
    }

    .tab-switcher {
      display: flex;
      background: var(--bg-tab-bar);
      border-radius: 14px;
      padding: 4px;
      border: 1px solid var(--border-color);
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
      box-shadow: 0 2px 10px var(--accent-glow);
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
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
      color: #86efac;
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
      gap: 1.1rem;
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
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .reset-header p {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0;
    }

    .back-login-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.7rem;
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
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }

    .input-icon-box {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.7rem 0.85rem;
      transition: border-color 0.2s ease;
    }

    .input-icon-box:focus-within {
      border-color: var(--border-active);
    }

    .input-icon-box i {
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .input-icon-box input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.9rem;
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
      font-size: 1.1rem;
      transition: color 0.2s ease;
    }

    .toggle-pwd-btn:hover {
      color: var(--text-primary);
    }

    .submit-btn {
      background: var(--accent-gradient);
      border: none;
      border-radius: 12px;
      padding: 0.85rem 1.25rem;
      color: white;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 14px var(--accent-glow);
      transition: all 0.2s ease;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      min-height: 48px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--accent-glow);
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
      padding: 2px 10px;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .guest-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 12px;
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
    }

    .guest-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }

    .google-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.75rem;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      transition: all 0.2s ease;
    }

    .google-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .theme-btn {
      background: var(--bg-pill);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      width: 36px;
      height: 36px;
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
    }

    @media (max-width: 900px) {
      .auth-header {
        padding: 0 1.25rem;
      }
      .auth-main {
        grid-template-columns: 1fr;
        padding: 1.5rem 1rem;
        gap: 1.75rem;
      }
      .hero-section {
        text-align: center;
        align-items: center;
        gap: 0.85rem;
      }
      .hero-section h1 {
        font-size: 1.85rem;
      }
      .hero-section p {
        font-size: 0.92rem;
      }
      .feature-grid {
        display: none;
      }
      .auth-card {
        padding: 1.5rem 1.1rem;
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

  onQuickDemo() {
    this.authService.demoLogin().subscribe(() => {
      this.onLoginSuccess.emit();
    });
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
