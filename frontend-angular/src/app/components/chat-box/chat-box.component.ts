import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatMessage, ChatService, ModelOption } from '../../services/chat.service';
import { ThemeService } from '../../services/theme.service';

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
          <select [(ngModel)]="selectedLanguage" class="lang-select" title="Select Chat & Voice Language">
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
          class="voice-live-header-btn"
          (click)="openVoiceModal.emit()"
          title="Start Real-Time Voice Chat & Voice Control (Alt + V)"
        >
          <span class="live-mic-pulse"></span>
          <i class="ri-mic-line"></i>
          <span class="full-label">Live Voice</span>
          <span class="short-label">Voice</span>
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
    .message-text ::ng-deep .md-code-block {
      background: #0f172a;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin: 0.75rem 0;
      overflow-x: auto;
      font-family: var(--font-code);
      font-size: 0.88rem;
      color: #f8fafc;
    }
    [data-theme="light"] .message-text ::ng-deep .md-code-block {
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #cbd5e1;
    }
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
    [data-theme="light"] .message-text ::ng-deep .md-link {
      color: #4f46e5;
    }
    .message-text ::ng-deep .md-link:hover {
      color: #818cf8;
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

    [data-theme="light"] .model-selector {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    [data-theme="light"] .model-selector:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
    }

    .model-icon {
      color: #38bdf8;
      font-size: 1rem;
      flex-shrink: 0;
    }

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

    [data-theme="light"] .lang-selector {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

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

    [data-theme="light"] .rag-toggle-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    [data-theme="light"] .rag-toggle-btn:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    [data-theme="light"] .rag-toggle-btn.active {
      background: #ede9fe;
      border-color: #818cf8;
      color: #4338ca;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
    }

    .web-toggle-btn.active {
      background: rgba(56, 189, 248, 0.2) !important;
      border-color: rgba(56, 189, 248, 0.5) !important;
      color: #38bdf8 !important;
      box-shadow: 0 2px 12px rgba(56, 189, 248, 0.25) !important;
    }

    [data-theme="light"] .web-toggle-btn.active {
      background: #e0f2fe !important;
      border-color: #38bdf8 !important;
      color: #0284c7 !important;
      box-shadow: 0 2px 10px rgba(56, 189, 248, 0.25) !important;
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

    .voice-live-header-btn {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%);
      border: 1px solid rgba(168, 85, 247, 0.5);
      border-radius: 20px;
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #e0e7ff;
      cursor: pointer;
      margin-left: 0.4rem;
      flex-shrink: 0;
      white-space: nowrap;
      box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
      position: relative;
      transition: all 0.25s ease;
    }

    .voice-live-header-btn:hover {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff;
      border-color: #c084fc;
      box-shadow: 0 0 18px rgba(168, 85, 247, 0.6);
      transform: translateY(-1px);
    }

    .live-mic-pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 8px #34d399;
      animation: pulse-ring 1.8s infinite;
    }

    [data-theme="light"] .voice-live-header-btn {
      background: linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%);
      border: 1px solid #c084fc;
      color: #6b21a8;
      box-shadow: 0 2px 8px rgba(168, 85, 247, 0.2);
    }

    [data-theme="light"] .voice-live-header-btn:hover {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff;
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

    [data-theme="light"] .header-vault-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

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

    [data-theme="light"] .theme-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

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

  @Output() onSend = new EventEmitter<{ text: string; language: string; useRag: boolean; useWebSearch: boolean; attachedFile?: File; model?: string }>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openVaultModal = new EventEmitter<void>();
  @Output() openVoiceModal = new EventEmitter<void>();

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
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
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

  private parseMarkdown(text: string): string {
    if (!text) return '';

    // Basic HTML escaping
    let str = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ``` ... ```
    str = str.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
      return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    str = str.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Markdown Links [text](url)
    str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

    // Headers ###, ##, #
    str = str.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    str = str.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
    str = str.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

    // Bold **text** and __text__
    str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic *text* and _text_
    str = str.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
    str = str.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // Bullet lists: convert - item or * item
    str = str.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="md-li">$1</li>');
    str = str.replace(/(<li class="md-li">[\s\S]*?<\/li>\s*)+/g, '<ul class="md-ul">$&</ul>');

    // Numbered lists: convert 1. item
    str = str.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="md-oli">$1</li>');
    str = str.replace(/(<li class="md-oli">[\s\S]*?<\/li>\s*)+/g, '<ol class="md-ol">$&</ol>');

    // Paragraphs and breaks
    const blocks = str.split(/\n\n+/);
    str = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<pre')) {
        return trimmed;
      }
      return `<p class="md-p">${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return str;
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
      model: this.selectedModel
    });
  }

  sendSample(sampleText: string) {
    this.onSend.emit({
      text: sampleText,
      language: this.selectedLanguage,
      useRag: this.useRag,
      useWebSearch: this.useWebSearch,
      model: this.selectedModel
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

