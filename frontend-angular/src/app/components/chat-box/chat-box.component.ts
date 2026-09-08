import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatMessage, ChatService, ModelOption } from '../../services/chat.service';
import { ThemeService } from '../../services/theme.service';
import { VoiceControlService } from '../../services/voice-control.service';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbox-container">
      <!-- Header -->
      <div class="chat-header">
        <button class="menu-btn" (click)="toggleSidebar.emit()" title="Toggle Conversations">
          <i class="ri-menu-2-line"></i>
        </button>
        <div class="header-info">
          <h3>{{ activeTitle || 'New Conversation' }}</h3>
        </div>

        <!-- Dynamic LLM Model Selector -->
        <div class="model-selector" [title]="'Active Model: ' + getSelectedModelName()">
          <i class="ri-cpu-line model-icon"></i>
          <select [(ngModel)]="selectedModel" (change)="onModelChange()" class="model-select" title="Change LLM Model">
            <option *ngFor="let m of availableModels" [value]="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>

        <!-- Multi-Language Selector -->
        <div class="lang-selector">
          <i class="ri-global-line lang-icon"></i>
          <select [(ngModel)]="selectedLanguage" (ngModelChange)="onLanguageChange($event)" class="lang-select" title="Select Chat & Voice Language">
            <option value="English">🇬🇧 English</option>
            <option value="English (India)">🇮🇳 English (India)</option>
            <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
            <option value="Bengali">🇮🇳 Bengali (বাংলা)</option>
            <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
            <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
            <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
            <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
            <option value="Kannada">🇮🇳 Kannada (ಕನ್ನಡ)</option>
            <option value="Malayalam">🇮🇳 Malayalam (മലയാളം)</option>
            <option value="Punjabi">🇮🇳 Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="Urdu">🇮🇳 Urdu (اردو)</option>
            <option value="Spanish">🇪🇸 Spanish (Español)</option>
            <option value="French">🇫🇷 French (Français)</option>
            <option value="German">🇩🇪 German (Deutsch)</option>
          </select>
        </div>

        <!-- Private / Incognito Mode Toggle Button -->
        <button 
          class="rag-toggle-btn private-toggle-btn"
          [class.active]="isPrivateMode"
          (click)="onTogglePrivateMode()"
          [title]="isPrivateMode ? getPrivateTooltipOn() : getPrivateTooltipOff()"
        >
          <span class="full-label">🕵️ {{ getPrivateLabel() }}</span>
          <span class="short-label">🕵️ {{ getPrivateShortLabel() }}</span>
          <span class="rag-dot private-dot" [class.on]="isPrivateMode"></span>
        </button>

        <!-- RAG Vault Toggle & Vault Modal Button -->
        <button 
          class="rag-toggle-btn"
          [class.active]="useRag"
          (click)="useRag = !useRag"
          [title]="useRag ? 'Vault RAG Search ON (Click to disable)' : 'Vault RAG Search OFF (Click to enable)'"
        >
          <span class="full-label">🧠 Vault RAG</span>
          <span class="short-label">🧠 RAG</span>
          <span class="rag-dot" [class.on]="useRag"></span>
        </button>

        <!-- Web Search Toggle Button -->
        <button 
          class="rag-toggle-btn web-toggle-btn"
          [class.active]="useWebSearch"
          (click)="useWebSearch = !useWebSearch"
          [title]="useWebSearch ? 'Live Web Search ON (Click to disable)' : 'Live Web Search OFF (Click to enable)'"
        >
          <span class="full-label">🌐 Web Search</span>
          <span class="short-label">🌐 Web</span>
          <span class="rag-dot" [class.on]="useWebSearch"></span>
        </button>

        <!-- Real-Time Conversational Voice Assistant Button -->
        <button 
          class="rag-toggle-btn voice-live-header-btn"
          (click)="openVoiceModal.emit()"
          title="Start Real-Time Voice Chat & Voice Control (Alt + V)"
        >
          <span class="full-label">🎙️ Live Voice</span>
          <span class="short-label">🎙️ Voice</span>
          <span class="rag-dot"></span>
        </button>

        <button 
          class="header-vault-btn"
          (click)="openVaultModal.emit()"
          title="Open Knowledge Vault Manager"
        >
          <i class="ri-book-open-line"></i>
        </button>


        <!-- Light / Dark Theme Toggle -->
        <button 
          class="theme-btn" 
          (click)="themeService.toggleTheme()" 
          [title]="themeService.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <i [class]="themeService.isDark ? 'ri-sun-line' : 'ri-moon-line'"></i>
        </button>
      </div>

      <!-- Private Mode Banner with Multi-Language Translation -->
      <div *ngIf="isPrivateMode" class="private-mode-banner">
        <div class="private-banner-content">
          <i class="ri-shield-keyhole-fill private-banner-icon"></i>
          <div class="private-banner-text">
            <strong>{{ getPrivateBannerTitle() }}</strong>
            <span>{{ getPrivateBannerDescription() }}</span>
          </div>
        </div>
        <button class="private-banner-close" (click)="onTogglePrivateMode()" [title]="getPrivateTooltipOn()">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <!-- Messages Scroll View -->
      <div class="messages-container" #scrollContainer>
        <div class="messages-wrapper">
          <div *ngIf="messages.length === 0" class="welcome-screen">
            <div class="welcome-card glass-panel">
              <div class="sparkle-icon">
                <i class="ri-pulse-line"></i>
              </div>
              <h2>How can Lumi AI help you today?</h2>
              <p>Ask anything, dictate notes, or analyze complex queries with persistent chat memory.</p>
              <div class="sample-chips">
                <button (click)="sendSample('What can you help me with?')">💡 What can you help me with?</button>
                <button (click)="sendSample('Summarize our recent discussion')">📝 Summarize discussion</button>
              </div>
            </div>
          </div>

          <div *ngFor="let msg of messages; let i = index" class="message-row" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            <div class="avatar" [class.user-avatar]="msg.role === 'user'">
              <i *ngIf="msg.role === 'user'" class="ri-user-3-line"></i>
              <i *ngIf="msg.role === 'assistant'" class="ri-sparkling-fill"></i>
            </div>

            <div class="message-content-wrapper">
              <div class="message-bubble" [class.user-bubble]="msg.role === 'user'">
                <div *ngIf="msg.content; else typingTpl" class="message-text" [innerHTML]="formatMessageContent(msg.content)"></div>
                <ng-template #typingTpl>
                  <div class="typing-indicator" *ngIf="msg.role === 'assistant'">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                  </div>
                </ng-template>
              </div>

              <!-- Citations Badges -->
              <div *ngIf="msg.role === 'assistant' && msg.citations && msg.citations.length > 0" class="citations-container">
                <span class="citations-header">📌 Sources:</span>
                <span *ngFor="let cite of msg.citations" class="citation-chip" [title]="'Relevance match: ' + (cite.score * 100).toFixed(0) + '%'">
                  📄 {{ cite.title }} <span class="cite-score">{{ (cite.score * 100).toFixed(0) }}%</span>
                </span>
              </div>

              <!-- Live Web Sources Badges -->
              <div *ngIf="msg.role === 'assistant' && msg.webSources && msg.webSources.length > 0" class="citations-container web-sources-container">
                <span class="citations-header">🌐 Web Sources:</span>
                <a *ngFor="let src of msg.webSources" [href]="src.href" target="_blank" rel="noopener noreferrer" class="citation-chip web-chip" [title]="src.href">
                  🔗 {{ src.title }}
                </a>
              </div>

              <!-- Message Actions (Copy Text & TTS) -->
              <div *ngIf="msg.content" class="msg-actions">
                <button 
                  class="action-icon-btn copy-msg-btn" 
                  [class.copied]="copiedMsgIndex === i"
                  (click)="copyMessageText(msg.content, i)" 
                  [title]="copiedMsgIndex === i ? 'Copied to clipboard!' : 'Copy full text'"
                >
                  <i [class]="copiedMsgIndex === i ? 'ri-check-line' : 'ri-file-copy-line'"></i>
                  <span class="action-btn-label" *ngIf="copiedMsgIndex === i">Copied!</span>
                </button>

                <button 
                  *ngIf="msg.role === 'assistant'"
                  class="action-icon-btn tts-btn" 
                  (click)="speakMessage(msg.content)" 
                  [disabled]="isSpeaking" 
                  title="Read Aloud"
                >
                  <i class="ri-volume-up-line"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Action Area -->
      <div class="input-area glass-panel">
        <div *ngIf="isRecording" class="recording-badge">
          <span class="recording-dot"></span>
          <span>Listening in {{ selectedLanguage }}... Click mic to stop</span>
        </div>

        <div *ngIf="attachedFile" class="attachment-preview-badge">
          <span class="attach-icon">📄</span>
          <span class="attach-name">{{ attachedFile.name }} ({{ (attachedFile.size / 1024).toFixed(1) }} KB)</span>
          <button (click)="attachedFile = null" class="attach-remove-btn" title="Remove attachment">✕</button>
        </div>

        <div class="input-wrapper">
          <!-- Direct File Attachment Button -->
          <button 
            class="action-btn attach-btn" 
            [class.attached-active]="!!attachedFile"
            (click)="attachmentInput.click()" 
            [title]="attachedFile ? 'Attached: ' + attachedFile.name : 'Attach PDF, TXT or MD document'"
          >
            <i class="ri-attachment-2"></i>
          </button>
          <input #attachmentInput type="file" (change)="onAttachmentSelected($event)" accept=".pdf,.txt,.md" style="display: none;" />

          <!-- Voice Recorder Button -->
          <button 
            class="action-btn mic-btn" 
            [class.recording-active]="isRecording"
            (click)="toggleVoiceRecording()" 
            [title]="isRecording ? 'Click to stop recording' : 'Speak / Dictate message'"
          >
            <i [class]="isRecording ? 'ri-stop-circle-fill' : 'ri-mic-line'"></i>
          </button>

          <!-- Input Textarea -->
          <textarea 
            #inputField
            [(ngModel)]="userInputText"
            (keydown.enter)="onKeyDown($event)"
            placeholder="Type a message, attach document, or click mic to dictate..."
            rows="1"
          ></textarea>

          <!-- Send Button -->
          <button 
            class="action-btn send-btn" 
            [disabled]="!userInputText.trim() || isStreaming"
            (click)="sendMessage()" 
            title="Send Message"
          >
            <i class="ri-send-plane-2-fill"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      width: 100%;
      min-width: 0;
    }

    .chatbox-container {
      flex: 1;
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-dark);
      position: relative;
    }

    .chat-header {
      height: 60px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      background: var(--bg-header);
      backdrop-filter: blur(8px);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .header-info h3 {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    .thread-badge {
      font-size: 0.75rem;
      background: var(--bg-pill);
      border: 1px solid var(--border-color);
      padding: 2px 8px;
      border-radius: 12px;
      color: var(--text-muted);
      font-family: var(--font-code);
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
    }

    .messages-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .welcome-screen {
      height: 100%;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .welcome-card {
      max-width: 520px;
      padding: 2.5rem;
      border-radius: 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .sparkle-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      color: white;
      box-shadow: 0 0 24px var(--accent-glow);
    }

    .welcome-card h2 {
      font-family: var(--font-heading);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .welcome-card p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .sample-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .sample-chips button {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.5rem 1rem;
      color: var(--text-secondary);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sample-chips button:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--border-active);
      color: var(--text-primary);
    }

    .message-row {
      display: flex;
      gap: 0.85rem;
      width: 100%;
      align-items: flex-start;
    }

    .message-row.user {
      flex-direction: row-reverse;
      justify-content: flex-start;
    }

    .message-row.user .message-content-wrapper {
      align-items: flex-end;
      max-width: 82%;
    }

    .message-row.assistant .message-content-wrapper {
      align-items: flex-start;
      flex: 1;
      max-width: calc(100% - 46px);
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .avatar.user-avatar {
      background: rgba(99, 102, 241, 0.2);
      color: #a855f7;
    }

    .message-content-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .message-bubble {
      padding: 0.9rem 1.25rem;
      border-radius: 18px;
      background: var(--ai-msg-bg);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 0.95rem;
      line-height: 1.6;
      word-break: break-word;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      width: fit-content;
      max-width: 100%;
    }

    .user-bubble {
      background: var(--user-msg-bg);
      border: none;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
    }

    /* Markdown Rich Text Styling - Light & Dark Theme Compatible */
    .message-text {
      width: 100%;
      color: inherit;
    }
    .message-text ::ng-deep .md-p {
      margin-bottom: 0.75rem;
      color: inherit;
      line-height: 1.6;
    }
    .message-text ::ng-deep .md-p:last-child {
      margin-bottom: 0;
    }
    .message-text ::ng-deep .md-h1,
    .message-text ::ng-deep .md-h2,
    .message-text ::ng-deep .md-h3 {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--text-primary);
      margin: 1rem 0 0.5rem 0;
      line-height: 1.3;
    }
    .user-bubble .message-text ::ng-deep .md-h1,
    .user-bubble .message-text ::ng-deep .md-h2,
    .user-bubble .message-text ::ng-deep .md-h3 {
      color: #ffffff;
    }
    .message-text ::ng-deep .md-h3 {
      font-size: 1.05rem;
    }
    .message-text ::ng-deep .md-h2 {
      font-size: 1.2rem;
    }
    .message-text ::ng-deep .md-h1 {
      font-size: 1.35rem;
    }
    .message-text ::ng-deep .md-ul,
    .message-text ::ng-deep .md-ol {
      margin: 0.5rem 0 0.75rem 1.3rem;
      padding: 0;
      color: inherit;
    }
    .message-text ::ng-deep .md-li,
    .message-text ::ng-deep .md-oli {
      margin-bottom: 0.35rem;
      line-height: 1.6;
      color: inherit;
    }
    .message-text ::ng-deep strong,
    .message-text ::ng-deep b {
      color: var(--text-primary);
      font-weight: 700;
    }
    .user-bubble .message-text ::ng-deep strong,
    .user-bubble .message-text ::ng-deep b {
      color: #ffffff;
    }
    .message-text ::ng-deep em,
    .message-text ::ng-deep i {
      color: inherit;
      font-style: italic;
    }
    /* Modern IDE Code Blocks */
    .message-text ::ng-deep .code-block-wrapper {
      margin: 1rem 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: #090d16;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
      position: relative;
    }
    .message-text ::ng-deep .code-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.45rem 0.9rem;
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-family: var(--font-code);
      font-size: 0.78rem;
    }
    .message-text ::ng-deep .code-lang-tag {
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .message-text ::ng-deep .copy-code-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-family: var(--font-body);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .message-text ::ng-deep .copy-code-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.5);
      color: #ffffff;
    }
    .message-text ::ng-deep .copy-code-btn.copied {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(16, 185, 129, 0.5);
      color: #34d399;
    }
    .message-text ::ng-deep .md-code-block {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0.95rem 1.15rem;
      margin: 0;
      overflow-x: auto;
      font-family: var(--font-code);
      font-size: 0.88rem;
      line-height: 1.6;
      color: #e2e8f0;
      -webkit-overflow-scrolling: touch;
    }
    .message-text ::ng-deep .md-code-block code {
      font-family: inherit;
      color: inherit;
      background: transparent;
      padding: 0;
      border: none;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .code-block-wrapper,
    [data-theme="light"] .message-text ::ng-deep .code-block-wrapper {
      background: #0f172a;
      border: 1px solid #334155;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .code-block-header,
    [data-theme="light"] .message-text ::ng-deep .code-block-header {
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .code-lang-tag,
    [data-theme="light"] .message-text ::ng-deep .code-lang-tag {
      color: #cbd5e1;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .copy-code-btn,
    [data-theme="light"] .message-text ::ng-deep .copy-code-btn {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: #f1f5f9;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .copy-code-btn:hover,
    [data-theme="light"] .message-text ::ng-deep .copy-code-btn:hover {
      background: rgba(99, 102, 241, 0.3);
      border-color: #6366f1;
    }
    .user-bubble .message-text ::ng-deep .code-block-wrapper {
      background: rgba(10, 15, 30, 0.7);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .user-bubble .message-text ::ng-deep .code-block-header {
      background: rgba(255, 255, 255, 0.1);
      border-bottom-color: rgba(255, 255, 255, 0.15);
    }
    .user-bubble .message-text ::ng-deep .copy-code-btn {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    /* Inline Code */
    .message-text ::ng-deep .md-inline-code {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 2px 6px;
      border-radius: 6px;
      font-family: var(--font-code);
      font-size: 0.86rem;
      color: #818cf8;
      font-weight: 600;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .md-inline-code,
    [data-theme="light"] .message-text ::ng-deep .md-inline-code {
      background: rgba(99, 102, 241, 0.1);
      border-color: rgba(99, 102, 241, 0.25);
      color: #4338ca;
    }
    .user-bubble .message-text ::ng-deep .md-inline-code {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: #ffffff;
    }
    .message-text ::ng-deep .md-link {
      color: #6366f1;
      text-decoration: underline;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .md-link,
    [data-theme="light"] .message-text ::ng-deep .md-link {
      color: #4f46e5;
    }
    .message-text ::ng-deep .md-link:hover {
      color: #818cf8;
    }

    /* Markdown Tables - Premium Glassmorphism & High-Contrast Typography */
    .message-text ::ng-deep .md-table-wrapper {
      width: 100%;
      max-width: 100%;
      margin: 1rem 0;
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--table-border);
      background: var(--table-bg);
      box-shadow: var(--table-shadow);
      -webkit-overflow-scrolling: touch;
      transition: all 0.2s ease;
    }
    .message-text ::ng-deep .md-table {
      width: 100%;
      min-width: 440px;
      border-collapse: collapse;
      font-size: 0.9rem;
      line-height: 1.6;
      text-align: left;
    }
    .message-text ::ng-deep .md-table thead th {
      background: var(--table-th-bg);
      color: var(--table-th-text);
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.8rem 1.1rem;
      border-bottom: 2px solid var(--table-th-border);
      border-right: 1px solid var(--table-td-border);
      white-space: nowrap;
    }
    .message-text ::ng-deep .md-table thead th:last-child {
      border-right: none;
    }
    .message-text ::ng-deep .md-table tbody td {
      padding: 0.75rem 1.1rem;
      border-bottom: 1px solid var(--table-td-border);
      border-right: 1px solid var(--table-td-border);
      color: var(--table-td-text);
      vertical-align: top;
      transition: background 0.15s ease;
    }
    .message-text ::ng-deep .md-table tbody td:last-child {
      border-right: none;
    }
    .message-text ::ng-deep .md-table tbody tr:nth-child(even) {
      background: var(--table-tr-even);
    }
    .message-text ::ng-deep .md-table tbody tr:hover {
      background: var(--table-tr-hover);
    }
    .message-text ::ng-deep .md-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* Light Mode Table Styling Explicit Direct Overrides */
    :host-context([data-theme="light"]) .message-text ::ng-deep .md-table-wrapper,
    [data-theme="light"] .message-text ::ng-deep .md-table-wrapper {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06) !important;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .md-table thead th,
    [data-theme="light"] .message-text ::ng-deep .md-table thead th {
      background: linear-gradient(135deg, #f1f5f9 0%, #eef2ff 100%) !important;
      color: #0f172a !important;
      border-bottom: 2px solid #cbd5e1 !important;
      border-right: 1px solid #e2e8f0 !important;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .md-table tbody td,
    [data-theme="light"] .message-text ::ng-deep .md-table tbody td {
      border-bottom: 1px solid #f1f5f9 !important;
      border-right: 1px solid #f1f5f9 !important;
      color: #1e293b !important;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .md-table tbody tr:nth-child(even),
    [data-theme="light"] .message-text ::ng-deep .md-table tbody tr:nth-child(even) {
      background: #f8fafc !important;
    }
    :host-context([data-theme="light"]) .message-text ::ng-deep .md-table tbody tr:hover,
    [data-theme="light"] .message-text ::ng-deep .md-table tbody tr:hover {
      background: #eef2ff !important;
    }

    /* User Bubble Table Overrides */
    .user-bubble .message-text ::ng-deep .md-table-wrapper {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
      box-shadow: none;
    }
    .user-bubble .message-text ::ng-deep .md-table thead th {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
      border-right: 1px solid rgba(255, 255, 255, 0.2);
    }
    .user-bubble .message-text ::ng-deep .md-table tbody td {
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      border-right: 1px solid rgba(255, 255, 255, 0.15);
    }
    .user-bubble .message-text ::ng-deep .md-table tbody tr:nth-child(even) {
      background: rgba(255, 255, 255, 0.06);
    }
    .user-bubble .message-text ::ng-deep .md-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Horizontal Rules, Blockquotes & Strikethrough */
    .message-text ::ng-deep .md-hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 1.25rem 0;
      opacity: 0.8;
    }
    .user-bubble .message-text ::ng-deep .md-hr {
      border-top-color: rgba(255, 255, 255, 0.3);
    }
    .message-text ::ng-deep .md-blockquote {
      border-left: 3px solid var(--accent-primary);
      background: rgba(99, 102, 241, 0.08);
      padding: 0.65rem 1rem;
      margin: 0.75rem 0;
      border-radius: 0 8px 8px 0;
      color: var(--text-secondary);
      font-style: italic;
    }
    .user-bubble .message-text ::ng-deep .md-blockquote {
      border-left-color: #ffffff;
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }
    .message-text ::ng-deep .md-del {
      text-decoration: line-through;
      opacity: 0.7;
    }

    .citations-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.4rem;
      padding: 0.4rem 0.65rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed var(--border-color);
      border-radius: 12px;
      font-size: 0.76rem;
    }

    .citations-header {
      font-weight: 700;
      color: var(--text-muted);
      font-size: 0.74rem;
    }

    .citation-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid var(--border-active);
      color: var(--text-primary);
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 0.75rem;
    }

    .cite-score {
      font-size: 0.7rem;
      color: #10b981;
      font-weight: 700;
    }

    .attachment-preview-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid var(--border-active);
      padding: 0.35rem 0.75rem;
      border-radius: 10px;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-primary);
    }

    .attach-remove-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.85rem;
      margin-left: 0.25rem;
    }

    .attach-remove-btn:hover {
      color: #ef4444;
    }

    .attach-btn {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
    }

    .attach-btn:hover, .attached-active {
      background: rgba(99, 102, 241, 0.2) !important;
      color: var(--accent-primary) !important;
    }

    .msg-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.35rem;
      padding: 0 0.15rem;
    }

    .action-icon-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.92rem;
      padding: 3px 6px;
      border-radius: 6px;
      transition: all 0.2s ease;
      font-family: var(--font-body);
    }

    .action-icon-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
    }

    [data-theme="light"] .action-icon-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text-primary);
    }

    .action-icon-btn.copied {
      color: #10b981 !important;
    }

    .action-btn-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: #10b981;
    }

    .tts-btn {
      color: var(--text-muted);
    }

    .tts-btn:hover {
      color: var(--accent-primary);
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 2px;
    }

    .input-area {
      margin: 1rem 1.5rem 1.5rem 1.5rem;
      border-radius: 16px;
      padding: 0.85rem 1.25rem;
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      position: relative;
    }

    .recording-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #ef4444;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .recording-dot {
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      box-shadow: 0 0 8px #ef4444;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      width: 100%;
    }

    .input-wrapper textarea {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: 0.95rem;
      outline: none;
      resize: none;
      max-height: 120px;
      line-height: 1.5;
    }

    .input-wrapper textarea::placeholder {
      color: var(--text-muted);
    }

    .action-btn {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mic-btn {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
    }

    .mic-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }

    .model-selector {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.3rem 0.75rem;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .model-selector:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--border-active);
      box-shadow: 0 2px 12px var(--accent-glow);
    }

    :host-context([data-theme="light"]) .model-selector,
    [data-theme="light"] .model-selector {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    :host-context([data-theme="light"]) .model-selector:hover,
    [data-theme="light"] .model-selector:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
    }

    .model-icon {
      color: #38bdf8;
      font-size: 1rem;
      flex-shrink: 0;
    }

    :host-context([data-theme="light"]) .model-icon,
    [data-theme="light"] .model-icon {
      color: #0284c7;
    }

    .model-select {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: 0.84rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      max-width: 190px;
      text-overflow: ellipsis;
      appearance: auto;
    }

    .model-select option {
      background: var(--bg-sidebar);
      color: var(--text-primary);
      padding: 6px 10px;
    }

    :host-context([data-theme="light"]) .model-select option,
    [data-theme="light"] .model-select option {
      background: #ffffff;
      color: #0f172a;
    }

    .lang-selector {
      margin-left: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.25rem 0.65rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .lang-selector:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--border-active);
      box-shadow: 0 2px 12px var(--accent-glow);
    }

    :host-context([data-theme="light"]) .lang-selector,
    [data-theme="light"] .lang-selector {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    :host-context([data-theme="light"]) .lang-selector:hover,
    [data-theme="light"] .lang-selector:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .lang-icon {
      color: var(--accent-primary);
      font-size: 1rem;
    }

    .lang-select {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: 0.82rem;
      font-weight: 500;
      outline: none;
      cursor: pointer;
    }

    .lang-select option {
      background: var(--bg-sidebar);
      color: var(--text-primary);
    }

    :host-context([data-theme="light"]) .lang-select option,
    [data-theme="light"] .lang-select option {
      background: #ffffff;
      color: #0f172a;
    }

    .short-label {
      display: none;
    }

    .full-label {
      display: inline;
    }

    .rag-toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.25rem 0.65rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      margin-left: 0.5rem;
      flex-shrink: 0;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .rag-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--border-active);
      box-shadow: 0 2px 12px var(--accent-glow);
      transform: translateY(-1px);
    }

    .rag-toggle-btn.active {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--border-active);
      color: var(--text-primary);
      box-shadow: 0 2px 12px var(--accent-glow);
    }

    :host-context([data-theme="light"]) .rag-toggle-btn,
    [data-theme="light"] .rag-toggle-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    :host-context([data-theme="light"]) .rag-toggle-btn:hover,
    [data-theme="light"] .rag-toggle-btn:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    :host-context([data-theme="light"]) .rag-toggle-btn.active,
    [data-theme="light"] .rag-toggle-btn.active {
      background: #ede9fe !important;
      border-color: #818cf8 !important;
      color: #4338ca !important;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2) !important;
    }

    .web-toggle-btn.active {
      background: rgba(56, 189, 248, 0.2) !important;
      border-color: rgba(56, 189, 248, 0.5) !important;
      color: #38bdf8 !important;
      box-shadow: 0 2px 12px rgba(56, 189, 248, 0.25) !important;
    }

    :host-context([data-theme="light"]) .web-toggle-btn.active,
    [data-theme="light"] .web-toggle-btn.active {
      background: #e0f2fe !important;
      border-color: #38bdf8 !important;
      color: #0284c7 !important;
      box-shadow: 0 2px 10px rgba(56, 189, 248, 0.25) !important;
    }

    .private-toggle-btn.active {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(126, 34, 206, 0.25)) !important;
      border-color: rgba(168, 85, 247, 0.6) !important;
      color: #c084fc !important;
      box-shadow: 0 2px 14px rgba(168, 85, 247, 0.3) !important;
    }

    :host-context([data-theme="light"]) .private-toggle-btn.active,
    [data-theme="light"] .private-toggle-btn.active {
      background: #f3e8ff !important;
      border-color: #a855f7 !important;
      color: #7e22ce !important;
      box-shadow: 0 2px 10px rgba(168, 85, 247, 0.2) !important;
    }

    .rag-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #94a3b8;
      transition: all 0.2s ease;
    }

    .rag-dot.on {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .rag-dot.private-dot.on {
      background: #c084fc !important;
      box-shadow: 0 0 8px #c084fc !important;
    }

    /* Multi-Language Private Mode Banner */
    .private-mode-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 1.25rem;
      background: linear-gradient(90deg, rgba(88, 28, 135, 0.3) 0%, rgba(126, 34, 206, 0.18) 100%);
      border-bottom: 1px solid rgba(168, 85, 247, 0.35);
      backdrop-filter: blur(8px);
      z-index: 10;
      animation: fadeInBanner 0.3s ease-in-out;
    }

    @keyframes fadeInBanner {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .private-banner-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #e9d5ff;
    }

    .private-banner-icon {
      font-size: 1.25rem;
      color: #c084fc;
      filter: drop-shadow(0 0 6px rgba(192, 132, 252, 0.6));
    }

    .private-banner-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      font-size: 0.82rem;
      line-height: 1.35;
    }

    .private-banner-text strong {
      font-size: 0.86rem;
      color: #f3e8ff;
      letter-spacing: 0.02em;
    }

    .private-banner-text span {
      color: #d8b4fe;
      opacity: 0.92;
    }

    .private-banner-close {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      color: #e9d5ff;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .private-banner-close:hover {
      background: rgba(168, 85, 247, 0.3);
      color: #ffffff;
      transform: scale(1.05);
    }

    :host-context([data-theme="light"]) .private-mode-banner,
    [data-theme="light"] .private-mode-banner {
      background: linear-gradient(90deg, #faf5ff 0%, #f3e8ff 100%) !important;
      border-bottom: 1px solid #d8b4fe !important;
    }

    :host-context([data-theme="light"]) .private-banner-content,
    [data-theme="light"] .private-banner-content {
      color: #581c87 !important;
    }

    :host-context([data-theme="light"]) .private-banner-icon,
    [data-theme="light"] .private-banner-icon {
      color: #7e22ce !important;
      filter: none !important;
    }

    :host-context([data-theme="light"]) .private-banner-text strong,
    [data-theme="light"] .private-banner-text strong {
      color: #581c87 !important;
      font-weight: 700 !important;
    }

    :host-context([data-theme="light"]) .private-banner-text span,
    [data-theme="light"] .private-banner-text span {
      color: #6b21a8 !important;
      font-weight: 500 !important;
      opacity: 1 !important;
    }

    :host-context([data-theme="light"]) .private-banner-close,
    [data-theme="light"] .private-banner-close {
      background: #ffffff !important;
      border: 1px solid #d8b4fe !important;
      color: #6b21a8 !important;
      box-shadow: 0 1px 4px rgba(126, 34, 206, 0.1) !important;
    }

    :host-context([data-theme="light"]) .private-banner-close:hover,
    [data-theme="light"] .private-banner-close:hover {
      background: #ede9fe !important;
      color: #4c1d95 !important;
    }

    .header-vault-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      width: 34px;
      height: 34px;
      margin-left: 0.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
      cursor: pointer;
      font-size: 1rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .header-vault-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--border-active);
      box-shadow: 0 2px 12px var(--accent-glow);
      transform: translateY(-1px);
    }

    :host-context([data-theme="light"]) .header-vault-btn,
    [data-theme="light"] .header-vault-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    :host-context([data-theme="light"]) .header-vault-btn:hover,
    [data-theme="light"] .header-vault-btn:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .theme-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      width: 34px;
      height: 34px;
      margin-left: 0.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 1.1rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .theme-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--border-active);
      color: var(--text-primary);
      box-shadow: 0 2px 12px var(--accent-glow);
      transform: translateY(-1px);
    }

    :host-context([data-theme="light"]) .theme-btn,
    [data-theme="light"] .theme-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    :host-context([data-theme="light"]) .theme-btn:hover,
    [data-theme="light"] .theme-btn:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .menu-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.25rem;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .menu-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
    }

    .send-btn {
      background: var(--accent-gradient);
      color: white;
      box-shadow: 0 2px 8px var(--accent-glow);
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.04);
      box-shadow: 0 4px 14px var(--accent-glow);
    }

    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .chat-header {
        padding: 0 0.5rem;
        gap: 0.3rem;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .chat-header::-webkit-scrollbar {
        display: none;
      }
      .header-info {
        display: none;
      }
      .short-label {
        display: inline;
      }
      .full-label {
        display: none;
      }
      .menu-btn {
        margin-right: 0.15rem;
        min-width: 32px;
        height: 32px;
      }
      .model-selector {
        padding: 0.2rem 0.4rem;
        gap: 0.2rem;
        flex-shrink: 0;
      }
      .model-select {
        font-size: 0.76rem;
        max-width: 90px;
      }
      .lang-selector {
        margin-left: 0.1rem;
        padding: 0.2rem 0.4rem;
        gap: 0.2rem;
        flex-shrink: 0;
      }
      .lang-select {
        font-size: 0.76rem;
        max-width: 70px;
      }
      .rag-toggle-btn {
        margin-left: 0.1rem;
        padding: 0.2rem 0.45rem;
        font-size: 0.76rem;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .header-vault-btn, .theme-btn {
        width: 32px;
        height: 32px;
        margin-left: 0.15rem;
        font-size: 1rem;
        flex-shrink: 0;
      }
      .messages-container {
        padding: 1rem 0.75rem;
      }
      .message-row {
        gap: 0.5rem;
      }
      .avatar {
        width: 30px;
        height: 30px;
        font-size: 0.85rem;
      }
      .message-row.assistant .message-content-wrapper {
        max-width: calc(100% - 38px);
      }
      .message-row.user .message-content-wrapper {
        max-width: 88%;
      }
      .message-bubble {
        padding: 0.75rem 0.95rem;
        font-size: 0.9rem;
      }
      .input-area {
        margin: 0.5rem 0.75rem 0.75rem 0.75rem;
        width: calc(100% - 1.5rem);
        padding: 0.5rem 0.75rem;
      }
      .welcome-card {
        padding: 1.5rem 1rem;
      }
    }
  `]
})
export class ChatBoxComponent implements OnInit, AfterViewChecked, OnChanges {
  @Input() messages: ChatMessage[] = [];
  @Input() activeTitle: string = '';
  @Input() threadId: string = '';
  @Input() isStreaming: boolean = false;
  @Input() isPrivateMode: boolean = false;

  @Output() onSend = new EventEmitter<{ text: string; language: string; useRag: boolean; useWebSearch: boolean; attachedFile?: File; model?: string; isPrivate?: boolean }>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openVaultModal = new EventEmitter<void>();
  @Output() openVoiceModal = new EventEmitter<void>();
  @Output() togglePrivate = new EventEmitter<boolean>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  userInputText: string = '';
  selectedLanguage: string = 'English';
  selectedModel: string = 'openrouter/free';
  availableModels: ModelOption[] = [
    { id: 'openrouter/free', name: 'OpenRouter Free (Auto Router)', provider: 'OpenRouter' },
    { id: 'z-ai/glm-5.2:free', name: 'Z.ai GLM 5.2 (Free)', provider: 'OpenRouter' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', provider: 'OpenRouter' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', provider: 'OpenRouter' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', provider: 'OpenRouter' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', provider: 'OpenRouter' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', provider: 'OpenRouter' }
  ];
  useRag: boolean = false;
  useWebSearch: boolean = false;
  attachedFile: File | null = null;
  isRecording: boolean = false;
  isSpeaking: boolean = false;
  copiedMsgIndex: number | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(
    private chatService: ChatService,
    private sanitizer: DomSanitizer,
    public themeService: ThemeService,
    private voiceService: VoiceControlService
  ) {}

  onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
    this.voiceService.setLanguage(lang);
  }

  ngOnInit(): void {
    (window as any).copyCodeSnippet = (btn: HTMLElement) => {
      try {
        const wrapper = btn.closest('.code-block-wrapper');
        const codeEl = wrapper ? wrapper.querySelector('code') : null;
        const textToCopy = codeEl ? codeEl.innerText : '';
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
          const span = btn.querySelector('span');
          const icon = btn.querySelector('i');
          const prevText = span ? span.innerText : 'Copy code';
          
          btn.classList.add('copied');
          if (span) span.innerText = 'Copied!';
          if (icon) icon.className = 'ri-check-line';

          setTimeout(() => {
            btn.classList.remove('copied');
            if (span) span.innerText = prevText;
            if (icon) icon.className = 'ri-file-copy-line';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy code snippet:', err);
        });
      } catch (err) {
        console.error('Copy snippet error:', err);
      }
    };

    const saved = localStorage.getItem('lumi_selected_model');
    if (saved) {
      this.selectedModel = saved;
    }
    this.loadAvailableModels();
  }

  loadAvailableModels(): void {
    this.chatService.getModels().subscribe({
      next: (res) => {
        if (res && res.models && res.models.length > 0) {
          this.availableModels = res.models;
          const saved = localStorage.getItem('lumi_selected_model');
          if (!saved && res.default) {
            this.selectedModel = res.default;
          }
        }
      },
      error: (err) => {
        console.warn('Using default models list.', err);
      }
    });
  }

  onModelChange(): void {
    if (this.selectedModel) {
      localStorage.setItem('lumi_selected_model', this.selectedModel);
    }
  }

  copyMessageText(content: string, index: number): void {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      this.copiedMsgIndex = index;
      setTimeout(() => {
        if (this.copiedMsgIndex === index) {
          this.copiedMsgIndex = null;
        }
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });
  }

  getSelectedModelName(): string {
    const found = this.availableModels.find(m => m.id === this.selectedModel);
    return found ? found.name : this.selectedModel;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messages']) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  formatMessageContent(content: string): SafeHtml {
    if (!content) return '';
    const htmlString = this.parseMarkdown(content);
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  private renderMarkdownTables(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let i = 0;

    const isSeparatorLine = (line: string): boolean => {
      const trimmed = line.trim();
      return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed) || /^(\s*:?-+:?\s*\|)+\s*:?-+:?\s*$/.test(trimmed);
    };

    const isTableRow = (line: string): boolean => {
      const trimmed = line.trim();
      return trimmed.includes('|') && trimmed.length > 1;
    };

    const splitRow = (line: string): string[] => {
      let trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        trimmed = trimmed.substring(1);
      }
      if (trimmed.endsWith('|')) {
        trimmed = trimmed.substring(0, trimmed.length - 1);
      }
      return trimmed.split('|').map(cell => cell.trim());
    };

    while (i < lines.length) {
      if (
        i + 1 < lines.length &&
        isTableRow(lines[i]) &&
        isSeparatorLine(lines[i + 1])
      ) {
        const headerCells = splitRow(lines[i]);
        const separatorCells = splitRow(lines[i + 1]);

        const alignments = separatorCells.map(sep => {
          const s = sep.trim();
          const leftColon = s.startsWith(':');
          const rightColon = s.endsWith(':');
          if (leftColon && rightColon) return 'center';
          if (rightColon) return 'right';
          if (leftColon) return 'left';
          return 'left';
        });

        let tableHtml = '<div class="md-table-wrapper"><table class="md-table"><thead><tr>';
        headerCells.forEach((hCell, colIdx) => {
          const align = alignments[colIdx] || 'left';
          const alignStyle = align !== 'left' ? ` style="text-align: ${align};"` : '';
          tableHtml += `<th${alignStyle}>${hCell}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        i += 2; // Advance past header and separator rows

        while (i < lines.length && isTableRow(lines[i]) && !isSeparatorLine(lines[i])) {
          const cells = splitRow(lines[i]);
          tableHtml += '<tr>';
          const maxCols = Math.max(headerCells.length, cells.length);
          for (let colIdx = 0; colIdx < maxCols; colIdx++) {
            const cellContent = cells[colIdx] !== undefined ? cells[colIdx] : '';
            const align = alignments[colIdx] || 'left';
            const alignStyle = align !== 'left' ? ` style="text-align: ${align};"` : '';
            tableHtml += `<td${alignStyle}>${cellContent}</td>`;
          }
          tableHtml += '</tr>';
          i++;
        }

        tableHtml += '</tbody></table></div>';
        result.push(tableHtml);
      } else {
        result.push(lines[i]);
        i++;
      }
    }

    return result.join('\n');
  }

  private parseMarkdown(text: string): string {
    if (!text) return '';

    // 1. Basic HTML escaping
    let str = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Protect Code blocks ``` ... ``` with safe alphanumeric tokens (no underscores/asterisks)
    const codeBlocks: string[] = [];
    str = str.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
      const token = `%%LUMICB${codeBlocks.length}%%`;
      const trimmedCode = code.trim();
      const displayLang = lang ? lang.toUpperCase() : 'CODE';
      const langClass = lang ? ` language-${lang.toLowerCase()}` : '';

      const blockHtml = `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang-tag">${displayLang}</span><button class="copy-code-btn" onclick="window.copyCodeSnippet(this)" title="Copy code snippet"><i class="ri-file-copy-line"></i><span>Copy code</span></button></div><pre class="md-code-block${langClass}"><code>${trimmedCode}</code></pre></div>`;

      codeBlocks.push(blockHtml);
      return token;
    });

    // 3. Protect Inline code `code` with safe alphanumeric tokens
    const inlineCodes: string[] = [];
    str = str.replace(/`([^`\n]+)`/g, (_match, code) => {
      const token = `%%LUMIIC${inlineCodes.length}%%`;
      inlineCodes.push(`<code class="md-inline-code">${code}</code>`);
      return token;
    });

    // 4. Render Markdown Tables
    str = this.renderMarkdownTables(str);

    // 5. Horizontal Rules (---, ***, ___)
    str = str.replace(/^(?:---|(?:\*\s*){3,}|(?:_\s*){3,})\s*$/gm, '<hr class="md-hr">');

    // 6. Blockquotes (> ...)
    str = str.replace(/^\s*&gt;\s*(.*$)/gim, '<blockquote class="md-blockquote">$1</blockquote>');

    // 7. Markdown Links [text](url)
    str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

    // 8. Headers ###, ##, #
    str = str.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    str = str.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
    str = str.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

    // 9. Strikethrough ~~text~~
    str = str.replace(/~~(.*?)~~/g, '<del class="md-del">$1</del>');

    // 10. Bold **text** and __text__
    str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 11. Italic *text* and _text_
    str = str.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
    str = str.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // 12. Bullet lists: convert - item or * item
    str = str.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="md-li">$1</li>');
    str = str.replace(/(<li class="md-li">[\s\S]*?<\/li>\s*)+/g, '<ul class="md-ul">$&</ul>');

    // 13. Numbered lists: convert 1. item
    str = str.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="md-oli">$1</li>');
    str = str.replace(/(<li class="md-oli">[\s\S]*?<\/li>\s*)+/g, '<ol class="md-ol">$&</ol>');

    // 14. Paragraphs and breaks
    const blocks = str.split(/\n\n+/);
    str = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<div class="md-table-wrapper"') ||
        trimmed.startsWith('<div class="code-block-wrapper"') ||
        trimmed.startsWith('%%LUMICB') ||
        trimmed.startsWith('<hr') ||
        trimmed.startsWith('<blockquote')
      ) {
        return trimmed;
      }
      return `<p class="md-p">${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // 15. Restore Inline Code and Code Blocks
    inlineCodes.forEach((codeHtml, idx) => {
      str = str.split(`%%LUMIIC${idx}%%`).join(codeHtml);
    });
    codeBlocks.forEach((blockHtml, idx) => {
      str = str.split(`%%LUMICB${idx}%%`).join(blockHtml);
    });

    return str;
  }

  private readonly PRIVATE_TRANSLATIONS: Record<string, { label: string; short: string; title: string; desc: string; tipOn: string; tipOff: string }> = {
    'English': {
      label: 'Private Mode',
      short: 'Private',
      title: 'Private Mode Active',
      desc: 'Messages and AI responses are ephemeral and will NOT be stored in your chat history or database.',
      tipOn: 'Private Mode ON (Click to exit)',
      tipOff: 'Private Mode OFF (Click to start private chat)'
    },
    'English (India)': {
      label: 'Private Mode',
      short: 'Private',
      title: 'Private Mode Active',
      desc: 'Messages and AI responses are ephemeral and will NOT be stored in your chat history or database.',
      tipOn: 'Private Mode ON (Click to exit)',
      tipOff: 'Private Mode OFF (Click to start private chat)'
    },
    'Hindi': {
      label: 'निजी मोड',
      short: 'निजी',
      title: 'निजी मोड सक्रिय है',
      desc: 'संदेश और AI उत्तर अस्थायी हैं और आपके इतिहास या डेटाबेस में सहेजे नहीं जाएंगे।',
      tipOn: 'निजी मोड चालू (बाहर निकलने के लिए क्लिक करें)',
      tipOff: 'निजी मोड बंद (निजी चैट शुरू करने के लिए क्लिक करें)'
    },
    'Bengali': {
      label: 'প্রাইভেট মোড',
      short: 'প্রাইভেট',
      title: 'প্রাইভেট মোড সক্রিয়',
      desc: 'বার্তা এবং AI প্রতিক্রিয়াগুলি অস্থায়ী এবং আপনার ইতিহাস বা ডেটাবেসে সংরক্ষিত হবে না।',
      tipOn: 'প্রাইভেট মোড চালু (প্রস্থান করতে ক্লিক করুন)',
      tipOff: 'প্রাইভেট মোড বন্ধ (প্রাইভেট চ্যাট শুরু করুন)'
    },
    'Tamil': {
      label: 'தனிப்பட்ட முறை',
      short: 'தனிப்பட்ட',
      title: 'தனிப்பட்ட முறை செயலில் உள்ளது',
      desc: 'செய்திகள் மற்றும் AI பதில்கள் தற்காலிகமானவை மற்றும் உங்கள் வரலாற்றில் சேமிக்கப்படாது.',
      tipOn: 'தனிப்பட்ட முறை ஆன் (வெளியேற கிளிக் செய்க)',
      tipOff: 'தனிப்பட்ட முறை ஆஃப் (தொடங்க கிளிக் செய்க)'
    },
    'Telugu': {
      label: 'ప్రైవేట్ మోడ్',
      short: 'ప్రైవేట్',
      title: 'ప్రైవేట్ మోడ్ యాక్టివ్‌లో ఉంది',
      desc: 'సందేశాలు మరియు AI సమాధానాలు తాత్కాలికం మరియు మీ హిస్టరీ లేదా డేటాబేస్‌లో సేవ్ కావు.',
      tipOn: 'ప్రైవేట్ మోడ్ ఆన్ (నిష్క్రమించడానికి క్లిక్ చేయండి)',
      tipOff: 'ప్రైవేట్ మోడ్ ఆఫ్ (ప్రారంభించడానికి క్లిక్ చేయండి)'
    },
    'Marathi': {
      label: 'खाजगी मोड',
      short: 'खाजगी',
      title: 'खाजगी मोड सक्रिय आहे',
      desc: 'संदेश आणि AI उत्तरे तात्पुरती आहेत आणि तुमच्या इतिहासामध्ये सेव्ह केली जाणार नाहीत.',
      tipOn: 'खाजगी मोड चालू (बाहेर पडण्यासाठी क्लिक करा)',
      tipOff: 'खाजगी मोड बंद (खाजगी चॅट सुरू करा)'
    },
    'Gujarati': {
      label: 'ખાનગી મોડ',
      short: 'ખાનગી',
      title: 'ખાનગી મોડ સક્રિય છે',
      desc: 'સંદેશાઓ અને AI જવાબો અસ્થાયી છે અને તમારા ઇતિહાસમાં સાચવવામાં આવશે નહીં.',
      tipOn: 'ખાનગી મોડ ચાલુ (બહાર નીકળવા ક્લિક કરો)',
      tipOff: 'ખાનગી મોડ બંધ (ખાનગી ચેટ શરૂ કરો)'
    },
    'Kannada': {
      label: 'ಖಾಸಗಿ ಮೋಡ್',
      short: 'ಖಾಸಗಿ',
      title: 'ಖಾಸಗಿ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ',
      desc: 'ಸಂದೇಶಗಳು ಮತ್ತು AI ಪ್ರತಿಕ್ರಿಯೆಗಳು ತಾತ್ಕಾಲಿಕವಾಗಿದ್ದು ಇತಿಹಾಸದಲ್ಲಿ ಉಳಿಸಲಾಗುವುದಿಲ್ಲ.',
      tipOn: 'ಖಾಸಗಿ ಮೋಡ್ ಆನ್ (ನಿರ್ಗಮಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ)',
      tipOff: 'ಖಾಸಗಿ ಮೋಡ್ ಆಫ್ (ಪ್ರಾರಂಭಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ)'
    },
    'Malayalam': {
      label: 'സ്വകാര്യ മോഡ്',
      short: 'സ്വകാര്യ',
      title: 'സ്വകാര്യ മോഡ് സജീവമാണ്',
      desc: 'സന്ദേശങ്ങളും AI മറുപടികളും താൽക്കാലികമാണ്, ചരിത്രത്തിൽ സൂക്ഷിക്കപ്പെടില്ല.',
      tipOn: 'സ്വകാര്യ മോഡ് ഓൺ (പുറത്തുകടക്കാൻ ക്ലിക്ക് ചെയ്യുക)',
      tipOff: 'സ്വകാര്യ മോഡ് ഓഫ് (ആരംഭിക്കാൻ ക്ലിക്ക് ചെയ്യുക)'
    },
    'Punjabi': {
      label: 'ਨਿੱਜੀ ਮੋਡ',
      short: 'ਨਿੱਜੀ',
      title: 'ਨਿੱਜੀ ਮੋਡ ਕਿਰਿਆਸ਼ੀਲ ਹੈ',
      desc: 'ਸੁਨੇਹੇ ਅਤੇ AI ਜਵਾਬ ਅਸਥਾਈ ਹਨ ਅਤੇ ਤੁਹਾਡੇ ਇਤਿਹਾਸ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਨਹੀਂ ਕੀਤੇ ਜਾਣਗੇ।',
      tipOn: 'ਨਿੱਜੀ ਮੋਡ ਚਾਲੂ (ਬਾਹਰ ਨਿਕਲਣ ਲਈ ਕਲਿੱਕ ਕਰੋ)',
      tipOff: 'ਨਿੱਜੀ ਮੋਡ ਬੰਦ (ਨਿੱਜੀ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ)'
    },
    'Urdu': {
      label: 'پرائیویٹ موڈ',
      short: 'پرائیویٹ',
      title: 'پرائیویٹ موڈ فعال ہے',
      desc: 'پیغامات اور جوابات عارضی ہیں اور آپ کی ہسٹری یا ڈیٹا بیس میں محفوظ نہیں ہوں گے۔',
      tipOn: 'پرائیویٹ موڈ آن (باہر نکلنے کے لیے کلک کریں)',
      tipOff: 'پرائیویٹ موڈ آف (شروع کرنے کے لیے کلک کریں)'
    },
    'Spanish': {
      label: 'Modo Privado',
      short: 'Privado',
      title: 'Modo Privado Activo',
      desc: 'Los mensajes y respuestas son efímeros y NO se guardarán en tu historial ni base de datos.',
      tipOn: 'Modo Privado ACTIVADO (Haz clic para salir)',
      tipOff: 'Modo Privado DESACTIVADO (Haz clic para iniciar)'
    },
    'French': {
      label: 'Mode Privé',
      short: 'Privé',
      title: 'Mode Privé Actif',
      desc: 'Les messages et réponses sont éphémères et ne seront PAS enregistrés dans votre historique.',
      tipOn: 'Mode Privé ACTIVÉ (Cliquez pour quitter)',
      tipOff: 'Mode Privé DÉSACTIVÉ (Cliquez pour démarrer)'
    },
    'German': {
      label: 'Privater Modus',
      short: 'Privat',
      title: 'Privater Modus Aktiv',
      desc: 'Nachrichten und Antworten sind flüchtig und werden NICHT in Ihrem Verlauf gespeichert.',
      tipOn: 'Privater Modus AN (Klicken zum Beenden)',
      tipOff: 'Privater Modus AUS (Klicken zum Starten)'
    }
  };

  getPrivateLabel(): string {
    return this.PRIVATE_TRANSLATIONS[this.selectedLanguage]?.label || 'Private Mode';
  }

  getPrivateShortLabel(): string {
    return this.PRIVATE_TRANSLATIONS[this.selectedLanguage]?.short || 'Private';
  }

  getPrivateBannerTitle(): string {
    return this.PRIVATE_TRANSLATIONS[this.selectedLanguage]?.title || 'Private Mode Active';
  }

  getPrivateBannerDescription(): string {
    return this.PRIVATE_TRANSLATIONS[this.selectedLanguage]?.desc || 'Messages and AI responses are ephemeral and will NOT be stored in your chat history or database.';
  }

  getPrivateTooltipOn(): string {
    return this.PRIVATE_TRANSLATIONS[this.selectedLanguage]?.tipOn || 'Private Mode ON (Click to exit)';
  }

  getPrivateTooltipOff(): string {
    return this.PRIVATE_TRANSLATIONS[this.selectedLanguage]?.tipOff || 'Private Mode OFF (Click to start private chat)';
  }

  onTogglePrivateMode(): void {
    this.togglePrivate.emit(!this.isPrivateMode);
  }

  onAttachmentSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.attachedFile = event.target.files[0];
      this.useRag = true;
    }
  }

  sendMessage() {
    if (!this.userInputText.trim() && !this.attachedFile) return;
    if (this.isStreaming) return;
    const text = this.userInputText.trim() || `(Uploaded document: ${this.attachedFile?.name})`;
    const file = this.attachedFile || undefined;
    this.userInputText = '';
    this.attachedFile = null;
    this.onSend.emit({
      text,
      language: this.selectedLanguage,
      useRag: this.useRag,
      useWebSearch: this.useWebSearch,
      attachedFile: file,
      model: this.selectedModel,
      isPrivate: this.isPrivateMode
    });
  }

  sendSample(sampleText: string) {
    this.onSend.emit({
      text: sampleText,
      language: this.selectedLanguage,
      useRag: this.useRag,
      useWebSearch: this.useWebSearch,
      model: this.selectedModel,
      isPrivate: this.isPrivateMode
    });
  }

  onKeyDown(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.sendMessage();
    }
  }

  private readonly SPEECH_LANG_MAP: Record<string, string> = {
    'English': 'en-US',
    'English (India)': 'en-IN',
    'Hindi': 'hi-IN',
    'Bengali': 'bn-IN',
    'Tamil': 'ta-IN',
    'Telugu': 'te-IN',
    'Marathi': 'mr-IN',
    'Gujarati': 'gu-IN',
    'Kannada': 'kn-IN',
    'Malayalam': 'ml-IN',
    'Punjabi': 'pa-IN',
    'Urdu': 'ur-IN',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE'
  };

  private speechRecognition: any = null;

  toggleVoiceRecording() {
    if (this.isRecording) {
      this.stopVoiceRecording();
    } else {
      this.startVoiceRecording();
    }
  }

  private startVoiceRecording() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = this.SPEECH_LANG_MAP[this.selectedLanguage] || 'en-US';

        let baseText = this.userInputText ? this.userInputText + ' ' : '';

        this.speechRecognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          this.userInputText = baseText + finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
        };

        this.speechRecognition.onerror = (err: any) => {
          console.warn('SpeechRecognition error, falling back to MediaRecorder:', err);
          this.fallbackMediaRecorder();
        };

        this.speechRecognition.onend = () => {
          this.isRecording = false;
        };

        this.speechRecognition.start();
        this.isRecording = true;
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed to start, falling back to MediaRecorder:', e);
      }
    }

    this.fallbackMediaRecorder();
  }

  private async fallbackMediaRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.chatService.transcribeAudio(audioBlob, this.selectedLanguage).subscribe({
          next: (res) => {
            if (res.text && !res.text.startsWith('Could not')) {
              this.userInputText = res.text;
            }
          },
          error: (err) => console.error('Transcription error:', err)
        });
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone.');
    }
  }

  private stopVoiceRecording() {
    if (this.speechRecognition && this.isRecording) {
      try {
        this.speechRecognition.stop();
      } catch (e) {}
    }
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
    this.isRecording = false;
  }

  speakMessage(text: string) {
    if (this.isSpeaking) return;
    this.isSpeaking = true;

    this.chatService.getTts(text, this.selectedLanguage).subscribe({
      next: (blob) => {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => { this.isSpeaking = false; };
        audio.onerror = () => { this.isSpeaking = false; };
        audio.play();
      },
      error: () => {
        // Fallback to browser SpeechSynthesis API if backend TTS fails
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => { this.isSpeaking = false; };
          utterance.onerror = () => { this.isSpeaking = false; };
          window.speechSynthesis.speak(utterance);
        } else {
          this.isSpeaking = false;
        }
      }
    });
  }
}

