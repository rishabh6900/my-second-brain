import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { AuthComponent } from './components/auth/auth.component';
import { VaultModalComponent } from './components/vault/vault-modal.component';
import { VoiceModalComponent } from './components/voice-modal/voice-modal.component';
import { ChatService, ThreadSummary, ChatMessage } from './services/chat.service';
import { AuthService } from './services/auth.service';
import { VaultService } from './services/vault.service';
import { ThemeService } from './services/theme.service';
import { VoiceControlService, VoiceCommand } from './services/voice-control.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, 
    ChatBoxComponent, 
    AuthComponent, 
    VaultModalComponent,
    VoiceModalComponent
  ],
  template: `
    <!-- Landing / Home View when on '/' path or when logged out -->
    <app-auth 
      *ngIf="currentPath === '/' || !authService.isLoggedIn" 
      (onLoginSuccess)="onLoginSuccess()"
      (navigateToChat)="navigateTo('/chat')"
    ></app-auth>

    <!-- Main Chat Application Layout when on '/chat' AND Logged In -->
    <div *ngIf="currentPath === '/chat' && authService.isLoggedIn" class="app-layout" [class.sidebar-open]="isSidebarOpen">
      <!-- Backdrop for mobile drawer -->
      <div 
        class="sidebar-backdrop" 
        *ngIf="isSidebarOpen && isMobile" 
        (click)="closeSidebarOnMobile()"
      ></div>

      <app-sidebar
        [threads]="threads"
        [activeThreadId]="activeThreadId"
        [currentUser]="authService.currentUser"
        (selectThread)="onSelectThread($event)"
        (newThread)="onNewThread()"
        (deleteThread)="onDeleteThread($event)"
        (closeSidebar)="closeSidebarOnMobile()"
        (goHome)="navigateTo('/')"
        (logout)="onLogout()"
        (openVault)="isVaultOpen = true"
      ></app-sidebar>

      <app-chat-box
        #chatBox
        [messages]="messages"
        [activeTitle]="activeTitle"
        [threadId]="activeThreadId"
        [isStreaming]="isStreaming"
        (onSend)="handleUserSendMessage($event)"
        (toggleSidebar)="onToggleSidebar()"
        (openVaultModal)="isVaultOpen = true"
        (openVoiceModal)="isVoiceModalOpen = true"
      ></app-chat-box>

      <!-- Knowledge Vault Manager Modal -->
      <app-vault-modal
        *ngIf="isVaultOpen"
        [userId]="authService.currentUser?.id || 'guest'"
        (closeModal)="isVaultOpen = false"
      ></app-vault-modal>

      <!-- Real-Time Conversational Voice Assistant & Control Modal -->
      <app-voice-modal
        #voiceModal
        *ngIf="isVoiceModalOpen"
        [initialLanguage]="activeLanguage"
        (closeModal)="isVoiceModalOpen = false"
        (onVoiceQuery)="handleVoiceQuery($event)"
      ></app-voice-modal>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    .app-layout {
      display: flex;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
    app-sidebar {
      flex-shrink: 0;
      height: 100%;
      z-index: 50;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    app-chat-box {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sidebar-backdrop {
      display: none;
    }

    @media (max-width: 768px) {
      app-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 280px;
        transform: translateX(-100%);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
      }

      .app-layout.sidebar-open app-sidebar {
        transform: translateX(0);
      }

      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 40;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('voiceModal') voiceModal?: VoiceModalComponent;
  @ViewChild('chatBox') chatBox?: ChatBoxComponent;

  threads: ThreadSummary[] = [];
  activeThreadId: string = '';
  messages: ChatMessage[] = [];
  activeTitle: string = '';
  isStreaming: boolean = false;
  isSidebarOpen: boolean = false;
  isMobile: boolean = false;
  isVaultOpen: boolean = false;
  isVoiceModalOpen: boolean = false;

  activeLanguage: string = 'English';
  selectedModel: string = 'openrouter/free';
  useRag: boolean = false;
  useWebSearch: boolean = false;

  currentPath: string = window.location.pathname;

  private resizeListener = () => this.checkScreenSize();
  private commandSub?: Subscription;

  constructor(
    private chatService: ChatService,
    public authService: AuthService,
    private vaultService: VaultService,
    public themeService: ThemeService,
    public voiceControlService: VoiceControlService
  ) {}

  @HostListener('window:popstate')
  onPopState() {
    this.currentPath = window.location.pathname;
    this.checkRouteAccess();
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent) {
    // Global hotkey Alt + V to toggle real-time voice mode
    if (event.altKey && (event.key === 'v' || event.key === 'V')) {
      event.preventDefault();
      if (this.authService.isLoggedIn && this.currentPath === '/chat') {
        this.isVoiceModalOpen = !this.isVoiceModalOpen;
      }
    } else if (event.key === 'Escape' && this.isVoiceModalOpen) {
      this.isVoiceModalOpen = false;
    }
  }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', this.resizeListener);
    this.checkRouteAccess();
    this.initVoiceCommandListeners();
  }

  private initVoiceCommandListeners() {
    this.commandSub = this.voiceControlService.command$.subscribe((cmd: VoiceCommand) => {
      this.executeVoiceCommand(cmd);
    });
  }

  private executeVoiceCommand(cmd: VoiceCommand) {
    switch (cmd.action) {
      case 'NEW_CHAT':
        this.onNewThread();
        break;
      case 'DELETE_CHAT':
        if (this.activeThreadId) {
          this.onDeleteThread(this.activeThreadId);
        }
        break;
      case 'TOGGLE_THEME':
        this.themeService.toggleTheme();
        break;
      case 'SET_THEME':
        if (cmd.payload === 'dark' && !this.themeService.isDark) {
          this.themeService.toggleTheme();
        } else if (cmd.payload === 'light' && this.themeService.isDark) {
          this.themeService.toggleTheme();
        }
        break;
      case 'OPEN_VAULT':
        this.isVaultOpen = true;
        break;
      case 'CLOSE_VAULT':
        this.isVaultOpen = false;
        break;
      case 'TOGGLE_SIDEBAR':
        this.onToggleSidebar();
        break;
      case 'TOGGLE_RAG':
        this.useRag = cmd.payload;
        if (this.chatBox) this.chatBox.useRag = this.useRag;
        break;
      case 'TOGGLE_WEB':
        this.useWebSearch = cmd.payload;
        if (this.chatBox) this.chatBox.useWebSearch = this.useWebSearch;
        break;
      case 'SET_LANGUAGE':
        if (cmd.payload) {
          this.activeLanguage = cmd.payload;
          this.voiceControlService.setLanguage(cmd.payload);
          if (this.chatBox) this.chatBox.selectedLanguage = cmd.payload;
        }
        break;
      case 'SET_MODEL':
        if (cmd.payload) {
          this.selectedModel = cmd.payload;
          if (this.chatBox) this.chatBox.selectedModel = cmd.payload;
        }
        break;
      case 'STOP_SPEAKING':
        this.voiceControlService.stopSpeaking();
        break;
      case 'REPEAT_MESSAGE':
        const lastAiMsg = [...this.messages].reverse().find(m => m.role === 'assistant' && m.content);
        if (lastAiMsg) {
          this.voiceControlService.speakText(lastAiMsg.content);
        }
        break;
      case 'HELP':
        if (this.voiceModal) {
          this.voiceModal.showCommands = true;
        }
        break;
    }
  }

  navigateTo(path: string) {
    if (path === '/chat' && !this.authService.isLoggedIn) {
      path = '/';
    }
    history.pushState({}, '', path);
    this.currentPath = path;
    this.checkRouteAccess();
  }

  private checkRouteAccess() {
    if (this.currentPath === '/chat') {
      if (!this.authService.isLoggedIn) {
        history.replaceState({}, '', '/');
        this.currentPath = '/';
      } else {
        this.loadThreads();
      }
    }
  }

  onLoginSuccess() {
    this.activeThreadId = '';
    this.messages = [];
    this.threads = [];
    this.navigateTo('/chat');
  }

  onLogout() {
    this.authService.logout();
    this.threads = [];
    this.messages = [];
    this.activeThreadId = '';
    this.isVoiceModalOpen = false;
    this.voiceControlService.stopVoiceSession();
    this.navigateTo('/');
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
    this.commandSub?.unsubscribe();
    this.voiceControlService.stopVoiceSession();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarOpen = true;
    }
  }

  onToggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebarOnMobile() {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  loadThreads() {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;

    this.chatService.getThreads(userId).subscribe({
      next: (threads) => {
        this.threads = threads;
        if (!this.activeThreadId) {
          this.onNewThread();
        }
      },
      error: () => {
        if (!this.activeThreadId) {
          this.onNewThread();
        }
      }
    });
  }

  onSelectThread(threadId: string) {
    this.activeThreadId = threadId;
    this.closeSidebarOnMobile();
    this.chatService.getThread(threadId).subscribe({
      next: (data) => {
        this.messages = data.messages || [];
        this.activeTitle = data.title || 'New Conversation';
      },
      error: (err) => console.error('Failed to load thread', err)
    });
  }

  onNewThread() {
    const userId = this.authService.currentUser?.id || 'guest';
    this.activeThreadId = `${userId}__${this.generateUuid()}`;
    this.messages = [];
    this.activeTitle = 'New Conversation';
    this.closeSidebarOnMobile();
  }

  onDeleteThread(threadId: string) {
    this.chatService.deleteThread(threadId).subscribe({
      next: () => {
        if (this.activeThreadId === threadId) {
          this.onNewThread();
        }
        this.loadThreads();
      },
      error: (err) => console.error('Error deleting thread', err)
    });
  }

  // --- Real-time Conversational Voice Chat Handler ---
  handleVoiceQuery(query: string) {
    if (!query || !query.trim() || this.isStreaming) return;
    const userId = this.authService.currentUser?.id || 'guest';
    const lang = this.voiceControlService.getLanguage() || this.activeLanguage;

    if (!this.activeThreadId) {
      this.activeThreadId = `${userId}__${this.generateUuid()}`;
    }

    const userMsg: ChatMessage = { role: 'user', content: query };
    this.messages.push(userMsg);

    if (this.messages.length === 1) {
      this.activeTitle = query.length > 40 ? query.substring(0, 40) + '...' : query;
    }

    const aiMsg: ChatMessage = { role: 'assistant', content: '' };
    this.messages.push(aiMsg);
    this.isStreaming = true;

    let accumulatedAiResponse = '';

    // Initialize instant zero-latency streaming TTS queue
    this.voiceControlService.initSpeechStream();

    this.chatService.sendMessageStream(
      this.activeThreadId,
      query,
      lang,
      (chunkText) => {
        aiMsg.content += chunkText;
        accumulatedAiResponse += chunkText;
        if (this.voiceModal) {
          this.voiceModal.updateAiResponse(accumulatedAiResponse, false);
        }
        // Feed chunk into streaming TTS immediately! First sentence begins playback in ~200ms
        this.voiceControlService.enqueueStreamChunk(chunkText);
      },
      (error) => {
        this.isStreaming = false;
        const errText = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
        aiMsg.content += `\n\n⚠️ **Error:** ${errText}`;
        this.voiceControlService.speakText('Sorry, I encountered an issue generating a response.');
      },
      () => {
        this.isStreaming = false;
        this.loadThreads();
        if (this.voiceModal) {
          this.voiceModal.updateAiResponse(accumulatedAiResponse, true);
        }
        // Finalize speech stream so remaining sentences complete and auto-resume listening
        this.voiceControlService.finishSpeechStream();
      },
      this.useRag,
      userId,
      (citations) => {
        aiMsg.citations = citations;
      },
      this.useWebSearch,
      (webSources) => {
        aiMsg.webSources = webSources;
      },
      this.selectedModel
    );
  }

  // --- Regular Text Input Chat Handler ---
  handleUserSendMessage(payload: { text: string; language: string; useRag?: boolean; useWebSearch?: boolean; attachedFile?: File; model?: string } | string) {
    const text = typeof payload === 'string' ? payload : payload.text;
    const language = typeof payload === 'string' ? this.activeLanguage : payload.language;
    const model = typeof payload === 'object' ? payload.model : this.selectedModel;
    const useRag = typeof payload === 'string' ? this.useRag : (payload.useRag ?? this.useRag);
    const useWebSearch = typeof payload === 'object' ? (payload.useWebSearch ?? this.useWebSearch) : this.useWebSearch;
    const attachedFile = typeof payload === 'object' ? payload.attachedFile : undefined;
    const userId = this.authService.currentUser?.id || 'guest';

    if (!text.trim() || this.isStreaming) return;

    const executeStream = () => {
      const userMsg: ChatMessage = { role: 'user', content: text };
      this.messages.push(userMsg);

      if (this.messages.length === 1) {
        this.activeTitle = text.length > 40 ? text.substring(0, 40) + '...' : text;
      }

      const aiMsg: ChatMessage = { role: 'assistant', content: '' };
      this.messages.push(aiMsg);

      this.isStreaming = true;

      this.chatService.sendMessageStream(
        this.activeThreadId,
        text,
        language,
        (chunkText) => {
          aiMsg.content += chunkText;
        },
        (error) => {
          this.isStreaming = false;
          const errText = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
          aiMsg.content += `\n\n⚠️ **Error:** ${errText}`;
        },
        () => {
          this.isStreaming = false;
          this.loadThreads();
        },
        useRag,
        userId,
        (citations) => {
          aiMsg.citations = citations;
        },
        useWebSearch,
        (webSources) => {
          aiMsg.webSources = webSources;
        },
        model
      );
    };

    if (attachedFile) {
      this.isStreaming = true;
      this.vaultService.uploadDocument(attachedFile, userId).subscribe({
        next: () => {
          this.isStreaming = false;
          executeStream();
        },
        error: (err) => {
          console.error('Attachment upload error:', err);
          this.isStreaming = false;
          executeStream();
        }
      });
    } else {
      executeStream();
    }
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
