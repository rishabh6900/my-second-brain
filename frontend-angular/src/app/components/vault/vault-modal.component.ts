import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VaultService, VaultDocument } from '../../services/vault.service';

@Component({
  selector: 'app-vault-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title-group">
            <div class="brain-badge">
              🧠
            </div>
            <div>
              <h3>Knowledge Vault & RAG</h3>
              <p class="subtitle">Embed documents & web links directly into Lumi's brain</p>
            </div>
          </div>
          <button class="close-icon-btn" (click)="onClose()" title="Close Vault">
            ✕
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="tab-bar">
          <button 
            class="tab-btn"
            [class.active]="activeTab === 'upload'" 
            (click)="activeTab = 'upload'">
            📄 Upload File
          </button>
          <button 
            class="tab-btn"
            [class.active]="activeTab === 'url'" 
            (click)="activeTab = 'url'">
            🌐 Web Page URL
          </button>
          <button 
            class="tab-btn"
            [class.active]="activeTab === 'documents'" 
            (click)="activeTab = 'documents'; loadDocuments()">
            📚 Stored Notes ({{ documents.length }})
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          
          <!-- Alert Message -->
          <div *ngIf="message" class="alert-box" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
            <span>{{ message }}</span>
            <button (click)="message=''" class="alert-close">✕</button>
          </div>

          <!-- TAB 1: FILE UPLOAD -->
          <div *ngIf="activeTab === 'upload'" class="tab-content">
            <div class="dropzone" (click)="fileInput.click()">
              <input #fileInput type="file" (change)="onFileSelected($event)" accept=".pdf,.txt,.md" class="hidden-file-input" />
              <div class="drop-icon">📥</div>
              <p class="drop-title">Click to browse or drop file here</p>
              <p class="drop-sub">Supports PDF (.pdf), Plain Text (.txt), and Markdown (.md)</p>
            </div>

            <div *ngIf="selectedFile" class="selected-file-card">
              <div class="file-info flex-row">
                <span class="file-icon">📄</span>
                <div>
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <p class="file-size">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
                </div>
              </div>
              <button 
                [disabled]="isLoading"
                (click)="uploadSelectedFile()" 
                class="btn-primary">
                <span *ngIf="isLoading" class="spinner">⏳</span>
                <span>{{ isLoading ? 'Processing...' : 'Embed Document' }}</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: WEB URL -->
          <div *ngIf="activeTab === 'url'" class="tab-content">
            <div class="form-group">
              <label class="form-label">Web Page URL</label>
              <input 
                type="url" 
                [(ngModel)]="webUrl" 
                placeholder="https://example.com/article-or-documentation" 
                class="form-input" />
            </div>

            <button 
              [disabled]="isLoading || !webUrl.trim()"
              (click)="ingestUrl()"
              class="btn-primary full-width">
              <span *ngIf="isLoading" class="spinner">⏳</span>
              <span>{{ isLoading ? 'Fetching & Ingesting...' : 'Fetch & Save to Knowledge Base' }}</span>
            </button>
          </div>

          <!-- TAB 3: DOCUMENTS LIST -->
          <div *ngIf="activeTab === 'documents'" class="tab-content">
            <div *ngIf="documents.length === 0" class="empty-state">
              <p class="empty-icon">📭</p>
              <p class="empty-text">No documents in your vault yet.</p>
              <p class="empty-sub">Upload a file or URL above to enable RAG answers!</p>
            </div>

            <div *ngFor="let doc of documents" class="doc-card">
              <div class="doc-left">
                <div class="doc-badge">
                  {{ doc.file_type.includes('PDF') ? '📕' : doc.file_type.includes('Web') ? '🌐' : '📝' }}
                </div>
                <div class="doc-details">
                  <h4 class="doc-title">{{ doc.title }}</h4>
                  <div class="doc-meta">
                    <span class="meta-pill">{{ doc.file_type }}</span>
                    <span>•</span>
                    <span>{{ doc.char_count }} chars</span>
                    <span>•</span>
                    <span>{{ doc.created_at | date:'shortDate' }}</span>
                  </div>
                </div>
              </div>

              <button 
                (click)="deleteDoc(doc.id)"
                title="Delete document" 
                class="delete-doc-btn">
                🗑️
              </button>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button (click)="onClose()" class="btn-secondary">
            Close Vault
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-card {
      width: 100%;
      max-width: 580px;
      max-height: 85vh;
      background: var(--bg-sidebar);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--text-primary);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.02);
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .brain-badge {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      box-shadow: 0 0 16px var(--accent-glow);
    }

    .modal-header h3 {
      font-family: var(--font-heading);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .close-icon-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.1rem;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .close-icon-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }

    .tab-bar {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.15);
    }

    .tab-btn {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0.65rem 0.85rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: var(--text-primary);
    }

    .tab-btn.active {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
      background: rgba(99, 102, 241, 0.1);
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .alert-box {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .alert-box.success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }

    .alert-box.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .alert-close {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.7;
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .dropzone {
      border: 2px dashed var(--border-active);
      border-radius: 16px;
      padding: 2.25rem 1.5rem;
      text-align: center;
      background: rgba(99, 102, 241, 0.04);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dropzone:hover {
      background: rgba(99, 102, 241, 0.1);
      border-color: var(--accent-primary);
    }

    .hidden-file-input {
      display: none;
    }

    .drop-icon {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }

    .drop-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .drop-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .selected-file-card {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;
    }

    .file-icon {
      font-size: 1.5rem;
    }

    .file-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;
    }

    .file-size {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 12px var(--accent-glow);
    }

    .btn-primary {
      padding: 0.75rem 1.25rem;
      background: var(--accent-gradient);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px var(--accent-glow);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.1);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .full-width {
      width: 100%;
    }

    .doc-card {
      padding: 0.85rem 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      transition: all 0.15s ease;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .doc-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: var(--border-active);
    }

    .doc-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    .doc-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .doc-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    .doc-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      min-width: 0;
    }

    .doc-meta {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      min-width: 0;
    }

    .meta-pill {
      color: var(--accent-primary);
      font-weight: 600;
      flex-shrink: 0;
    }

    .delete-doc-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 6px;
      border-radius: 8px;
      flex-shrink: 0;
      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .delete-doc-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.15);
    }

    @media (max-width: 600px) {
      .modal-card {
        max-height: 90vh;
        border-radius: 18px;
      }
      .modal-header {
        padding: 1rem 1.2rem;
      }
      .modal-body {
        padding: 1rem 1rem;
      }
      .doc-card {
        padding: 0.75rem 0.75rem;
        gap: 0.5rem;
      }
      .doc-badge {
        width: 32px;
        height: 32px;
        font-size: 1rem;
      }
      .doc-title {
        font-size: 0.82rem;
      }
      .doc-meta {
        font-size: 0.68rem;
        gap: 0.25rem;
      }
      .delete-doc-btn {
        padding: 4px;
        font-size: 1rem;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-text {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .empty-sub {
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      background: rgba(0, 0, 0, 0.15);
    }

    .btn-secondary {
      padding: 0.6rem 1.1rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      color: var(--text-primary);
    }

    .spinner {
      display: inline-block;
      animation: spin 1s infinite linear;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class VaultModalComponent implements OnInit {
  @Input() userId: string = 'default_user';
  @Output() closeModal = new EventEmitter<void>();

  activeTab: 'upload' | 'url' | 'documents' = 'upload';
  selectedFile: File | null = null;
  webUrl: string = '';
  documents: VaultDocument[] = [];
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private vaultService: VaultService) {}

  ngOnInit() {
    this.loadDocuments();
  }

  onClose() {
    this.closeModal.emit();
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadSelectedFile() {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.message = '';

    this.vaultService.uploadDocument(this.selectedFile, this.userId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = `Successfully embedded "${res.title}" into Knowledge Vault!`;
        this.messageType = 'success';
        this.selectedFile = null;
        this.loadDocuments();
      },
      error: (err) => {
        this.isLoading = false;
        this.message = err?.error?.detail || 'Failed to upload document.';
        this.messageType = 'error';
      }
    });
  }

  ingestUrl() {
    if (!this.webUrl) return;
    this.isLoading = true;
    this.message = '';

    this.vaultService.addUrlDocument(this.webUrl, this.userId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = `Successfully ingested "${res.title}" into Knowledge Vault!`;
        this.messageType = 'success';
        this.webUrl = '';
        this.loadDocuments();
      },
      error: (err) => {
        this.isLoading = false;
        this.message = err?.error?.detail || 'Failed to ingest URL.';
        this.messageType = 'error';
      }
    });
  }

  loadDocuments() {
    this.vaultService.getDocuments(this.userId).subscribe({
      next: (docs) => {
        this.documents = docs || [];
      },
      error: (err) => {
        console.error('Error loading vault documents', err);
      }
    });
  }

  deleteDoc(docId: string) {
    if (!confirm('Are you sure you want to delete this document from your Knowledge Vault?')) return;
    this.vaultService.deleteDocument(docId, this.userId).subscribe({
      next: () => {
        this.message = 'Document deleted from Knowledge Vault.';
        this.messageType = 'success';
        this.loadDocuments();
      },
      error: (err) => {
        this.message = 'Failed to delete document.';
        this.messageType = 'error';
      }
    });
  }
}
