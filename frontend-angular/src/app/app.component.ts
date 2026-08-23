import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { AuthComponent } from './components/auth/auth.component';
import { VaultModalComponent } from './components/vault/vault-modal.component';
import { ChatService, ThreadSummary, ChatMessage } from './services/chat.service';
import { AuthService } from './services/auth.service';
import { VaultService } from './services/vault.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ChatBoxComponent, AuthComponent, VaultModalComponent],
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
        [messages]="messages"
        [activeTitle]="activeTitle"
        [threadId]="activeThreadId"
        [isStreaming]="isStreaming"
        (onSend)="handleUserSendMessage($event)"
        (toggleSidebar)="onToggleSidebar()"
        (openVaultModal)="isVaultOpen = true"
      ></app-chat-box>

      <app-vault-modal
        *ngIf="isVaultOpen"
        [userId]="authService.currentUser?.id || 'guest'"
        (closeModal)="isVaultOpen = false"
      ></app-vault-modal>
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
  threads: ThreadSummary[] = [];
  activeThreadId: string = '';
  messages: ChatMessage[] = [];
  activeTitle: string = '';
  isStreaming: boolean = false;
  isSidebarOpen: boolean = false;
  isMobile: boolean = false;
  isVaultOpen: boolean = false;

  currentPath: string = window.location.pathname;

  private resizeListener = () => this.checkScreenSize();

  constructor(
    private chatService: ChatService,
    public authService: AuthService,
    private vaultService: VaultService
  ) {}

  @HostListener('window:popstate')
  onPopState() {
    this.currentPath = window.location.pathname;
    this.checkRouteAccess();
  }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', this.resizeListener);
    this.checkRouteAccess();
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
    this.navigateTo('/');
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarOpen = true;
    } else if (this.isSidebarOpen && this.isMobile) {
      // Keep state or default to closed on initial mobile load
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

  handleUserSendMessage(payload: { text: string; language: string; useRag?: boolean; useWebSearch?: boolean; attachedFile?: File; model?: string } | string) {
    const text = typeof payload === 'string' ? payload : payload.text;
    const language = typeof payload === 'string' ? 'English' : payload.language;
    const model = typeof payload === 'object' ? payload.model : undefined;
    const useRag = typeof payload === 'string' ? false : (payload.useRag ?? false);
    const useWebSearch = typeof payload === 'object' ? (payload.useWebSearch ?? false) : false;
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

