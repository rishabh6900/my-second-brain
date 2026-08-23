import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadSummary } from '../../services/chat.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar-container">
      <!-- Header / Logo -->
      <div class="brand">
        <div class="logo-icon" (click)="goHome.emit()" style="cursor: pointer;" title="Back to Home">
          <i class="ri-sparkling-fill"></i>
        </div>
        <div class="brand-text" (click)="goHome.emit()" style="cursor: pointer;" title="Back to Home">
          <h2>Lumi AI</h2>
          <span class="badge">v2.0 • Ollama</span>
        </div>
        <button class="home-nav-btn" (click)="goHome.emit()" title="Go to Home Page">
          <i class="ri-home-4-line"></i>
        </button>
        <button class="mobile-close-btn" (click)="closeSidebar.emit()" title="Close Sidebar">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 0.5rem; width: 100%;">
        <button class="new-chat-btn" (click)="onNewChat()" style="flex: 1;">
          <i class="ri-add-line"></i>
          <span>New Chat</span>
        </button>
        <button class="vault-btn" (click)="openVault.emit()" title="Open Knowledge Vault & RAG">
          <i class="ri-book-open-line"></i>
          <span>Vault</span>
        </button>
      </div>

      <div class="divider"></div>

      <!-- Threads List Section -->
      <div class="section-title">
        <span>MY CONVERSATIONS</span>
        <span class="count-pill">{{ threads.length }}</span>
      </div>

      <div class="threads-list">
        <div 
          *ngFor="let t of threads" 
          class="thread-item" 
          [class.active]="t.id === activeThreadId"
          (click)="onSelectThread(t.id)"
        >
          <i class="ri-chat-3-line thread-icon"></i>
          <span class="thread-title" [title]="t.title">{{ t.title || 'New Conversation' }}</span>
          <button class="delete-btn" (click)="onDeleteThread($event, t.id)" title="Delete Conversation">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>

        <div *ngIf="threads.length === 0" class="empty-threads">
          <i class="ri-chat-smile-2-line"></i>
          <p>No past conversations found</p>
        </div>
      </div>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <div *ngIf="currentUser" class="user-profile-card">
          <div class="user-avatar">
            {{ (currentUser.name || 'U').charAt(0).toUpperCase() }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ currentUser.name }}</span>
            <span class="user-email">{{ currentUser.email }}</span>
          </div>
          <button class="logout-btn" (click)="logout.emit()" title="Log Out">
            <i class="ri-logout-box-r-line"></i>
          </button>
        </div>

        <div class="status-indicator">
          <span class="pulse-dot"></span>
          <span>Engine Connected</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      width: 280px;
      height: 100%;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 1.25rem 1rem;
      user-select: none;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding: 0 0.25rem;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #fff;
      box-shadow: 0 0 16px var(--accent-glow);
    }

    .brand-text h2 {
      font-family: var(--font-heading);
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .badge {
      font-size: 0.7rem;
      color: var(--accent-primary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .new-chat-btn {
      width: 100%;
      padding: 0.65rem 1rem;
      background: var(--accent-gradient);
      border: none;
      border-radius: 20px;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px var(--accent-glow);
    }

    .new-chat-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px var(--accent-glow);
      filter: brightness(1.1);
    }

    .vault-btn {
      padding: 0.65rem 0.95rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .vault-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--border-active);
      color: var(--text-primary);
      box-shadow: 0 2px 12px var(--accent-glow);
      transform: translateY(-1px);
    }

    [data-theme="light"] .vault-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #0f172a;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    [data-theme="light"] .vault-btn:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
    }

    .divider {
      height: 1px;
      background: var(--border-color);
      margin: 1rem 0 0.85rem 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
      margin-bottom: 0.65rem;
      padding: 0 0.25rem;
    }

    .count-pill {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 0.7rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    [data-theme="light"] .count-pill {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    .threads-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      padding-right: 2px;
    }

    .thread-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.85rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      color: var(--text-secondary);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
      position: relative;
    }

    .thread-item:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: var(--border-active);
      color: var(--text-primary);
      box-shadow: 0 2px 10px var(--accent-glow);
    }

    .thread-item.active {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--border-active);
      color: var(--text-primary);
      box-shadow: 0 2px 12px var(--accent-glow);
    }

    [data-theme="light"] .thread-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    [data-theme="light"] .thread-item:hover {
      background: #f8fafc;
      border-color: var(--accent-primary);
      color: #0f172a;
    }

    [data-theme="light"] .thread-item.active {
      background: #ede9fe;
      border-color: #818cf8;
      color: #4338ca;
    }

    .thread-icon {
      font-size: 1rem;
      color: var(--accent-primary);
      flex-shrink: 0;
    }

    .thread-title {
      flex: 1;
      font-size: 0.84rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 3px;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .thread-item:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.15);
    }

    .empty-threads {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-muted);
    }

    .empty-threads i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .home-nav-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      border-radius: 20px;
      padding: 5px 10px;
      font-size: 1rem;
      cursor: pointer;
      margin-left: auto;
      margin-right: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .home-nav-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      color: var(--text-primary);
      border-color: var(--border-active);
    }

    [data-theme="light"] .home-nav-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    .mobile-close-btn {
      display: none;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.4rem;
      cursor: pointer;
      margin-left: auto;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s ease;
    }

    .mobile-close-btn:hover {
      color: var(--text-primary);
    }

    @media (max-width: 768px) {
      .mobile-close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-profile-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.55rem 0.85rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.2s ease;
    }

    [data-theme="light"] .user-profile-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: white;
      font-weight: 700;
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px var(--accent-glow);
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 0.72rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .logout-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.15);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.74rem;
      font-weight: 500;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.3rem 0.75rem;
      width: fit-content;
    }

    [data-theme="light"] .status-indicator {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
    }
  `]
})
export class SidebarComponent {
  @Input() threads: ThreadSummary[] = [];
  @Input() activeThreadId: string = '';
  @Input() currentUser: any = null;

  @Output() selectThread = new EventEmitter<string>();
  @Output() newThread = new EventEmitter<void>();
  @Output() deleteThread = new EventEmitter<string>();
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();
  @Output() openVault = new EventEmitter<void>();

  onSelectThread(id: string) {
    this.selectThread.emit(id);
  }

  onNewChat() {
    this.newThread.emit();
  }

  onDeleteThread(event: Event, id: string) {
    event.stopPropagation();
    this.deleteThread.emit(id);
  }
}
