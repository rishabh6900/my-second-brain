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
      margin-bottom: 1.5rem;
      padding: 0 0.25rem;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
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
      font-size: 1.25rem;
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
      padding: 0.75rem 1rem;
      background: var(--accent-gradient);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px var(--accent-glow);
    }

    .new-chat-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--accent-glow);
      filter: brightness(1.1);
    }

    .divider {
      height: 1px;
      background: var(--border-color);
      margin: 1.25rem 0 1rem 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
      margin-bottom: 0.75rem;
      padding: 0 0.25rem;
    }

    .count-pill {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 6px;
      color: var(--text-secondary);
    }

    .threads-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding-right: 2px;
    }

    .thread-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .thread-item:hover {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-primary);
    }

    .thread-item.active {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid var(--border-active);
      color: var(--text-primary);
    }

    .thread-icon {
      font-size: 1.1rem;
      color: var(--accent-primary);
    }

    .thread-title {
      flex: 1;
      font-size: 0.88rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: opacity;
      opacity: 0;
      transition: all 0.15s ease;
    }

    .thread-item:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
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
      border-radius: 8px;
      padding: 5px 8px;
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
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .user-profile-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.65rem 0.75rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.85rem;
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
      border-radius: 6px;
      transition: color 0.15s ease;
    }

    .logout-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    .vault-btn {
      padding: 0.75rem 0.85rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid var(--border-active);
      border-radius: 12px;
      color: var(--accent-primary);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }

    .vault-btn:hover {
      background: rgba(99, 102, 241, 0.25);
      transform: translateY(-1px);
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
