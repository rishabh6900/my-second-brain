import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceControlService, VoiceState, VoiceMode, VoiceTranscript, VoiceCommand } from '../../services/voice-control.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-voice-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="voice-overlay" (click)="onBackdropClick($event)">
      <div class="voice-modal-container glass-panel">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="brand-badge">
            <span class="live-dot" [class.active]="state === 'listening' || state === 'speaking'"></span>
            <span class="brand-title">Lumi Live Voice</span>
            <span class="mode-pill" [class.auto]="mode === 'auto'">
              {{ mode === 'auto' ? '⚡ Hands-Free Loop' : '👆 Push-to-Talk' }}
            </span>
          </div>

          <div class="header-actions">
            <!-- Language Selector -->
            <div class="lang-selector-wrapper">
              <i class="ri-global-line"></i>
              <select [(ngModel)]="selectedLanguage" (change)="onLanguageChange()" class="voice-lang-select" title="Change voice language">
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

            <!-- Help / Commands Button -->
            <button class="icon-tool-btn" (click)="showCommands = !showCommands" [class.active]="showCommands" title="Voice Commands Cheat Sheet">
              <i class="ri-command-line"></i>
            </button>

            <!-- Close Button -->
            <button class="icon-tool-btn close-btn" (click)="close()" title="Exit Voice Mode (Esc)">
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>

        <!-- Voice Command Toast Notification -->
        <div *ngIf="lastCommandFeedback" class="command-toast animate-slide-down">
          <div class="command-toast-icon">⚡</div>
          <div class="command-toast-text">{{ lastCommandFeedback }}</div>
        </div>

        <!-- Auto-Send Countdown Banner in Hands-Free Mode -->
        <div *ngIf="mode === 'auto' && autoCountdown > 0 && state === 'listening'" class="auto-countdown-banner animate-slide-down">
          <div class="countdown-pulse-icon">⏱️</div>
          <span class="countdown-text">Sending query in <strong>{{ autoCountdown }}s</strong>...</span>
          <button (click)="cancelCountdown()" class="countdown-cancel-btn" title="Pause and keep speaking">
            <i class="ri-pause-line"></i> Wait
          </button>
          <button (click)="manualSendTurn()" class="countdown-send-btn" title="Send immediately">
            <i class="ri-send-plane-fill"></i> Send Now
          </button>
        </div>

        <!-- Main Center Area: Interactive Audio Reactive Orb & Waveform -->
        <div class="orb-container">
          <!-- Ambient Background Glow Circles -->
          <div class="glow-bg" [ngClass]="state"></div>
          <div class="orb-ring ring-1" [ngClass]="state" [style.transform]="'scale(' + (1 + audioLevel * 0.4) + ')'"></div>
          <div class="orb-ring ring-2" [ngClass]="state" [style.transform]="'scale(' + (1 + audioLevel * 0.7) + ')'"></div>

          <!-- Central Glowing Orb -->
          <div 
            class="central-orb" 
            [ngClass]="state"
            [style.transform]="'scale(' + (1 + audioLevel * 0.25) + ')'"
            (click)="onOrbClick()"
            [title]="getOrbTooltip()"
          >
            <div class="orb-core">
              <i *ngIf="state === 'listening'" class="ri-mic-fill orb-icon mic-glow"></i>
              <i *ngIf="state === 'processing'" class="ri-loader-4-line orb-icon spin-slow"></i>
              <i *ngIf="state === 'speaking'" class="ri-volume-up-fill orb-icon speak-pulse"></i>
              <i *ngIf="state === 'paused' || state === 'idle'" class="ri-mic-off-line orb-icon"></i>
            </div>
          </div>

          <!-- Audio Equalizer Bars -->
          <div class="audio-wave-bars">
            <span *ngFor="let bar of waveBars; let i = index" 
                  class="wave-bar" 
                  [ngClass]="state"
                  [style.height.px]="getBarHeight(i)"></span>
          </div>

          <!-- Live Status Indicator -->
          <div class="status-label-badge" [ngClass]="state">
            <span *ngIf="state === 'listening'" class="status-text">
              <span class="pulse-indicator red"></span> 
              {{ mode === 'push-to-talk' ? 'Listening... Speak and click "Send Query" when done' : 'Listening in ' + selectedLanguage + '... Speak naturally' }}
            </span>
            <span *ngIf="state === 'processing'" class="status-text">
              <span class="pulse-indicator purple"></span> Lumi is generating response...
            </span>
            <span *ngIf="state === 'speaking'" class="status-text">
              <span class="pulse-indicator green"></span> Lumi is speaking... (Click orb to interrupt)
            </span>
            <span *ngIf="state === 'paused'" class="status-text">
              <span class="pulse-indicator amber"></span> Microphone Muted
            </span>
            <span *ngIf="state === 'idle'" class="status-text">
              <span class="pulse-indicator gray"></span> Ready. Click microphone or orb to start
            </span>
          </div>
        </div>

        <!-- Live Subtitles & Transcripts Area -->
        <div class="transcript-display-area">
          <!-- User Live Speech Subtitle -->
          <div *ngIf="currentTranscript" class="transcript-bubble user-transcript animate-fade-in">
            <div class="transcript-avatar"><i class="ri-user-voice-line"></i></div>
            <div class="transcript-body">
              <div class="transcript-header-row">
                <span class="transcript-label">You:</span>
                <button *ngIf="mode === 'push-to-talk' && state === 'listening'" (click)="clearTranscript()" class="clear-text-btn" title="Clear spoken text">
                  <i class="ri-delete-bin-line"></i> Clear
                </button>
              </div>
              <p class="transcript-text">{{ currentTranscript }}</p>
            </div>
          </div>

          <!-- AI Response Live Subtitle -->
          <div *ngIf="currentAiResponse" class="transcript-bubble ai-transcript animate-fade-in">
            <div class="transcript-avatar ai-avatar"><i class="ri-sparkling-fill"></i></div>
            <div class="transcript-body">
              <span class="transcript-label">Lumi AI:</span>
              <p class="transcript-text">{{ currentAiResponse }}</p>
            </div>
          </div>

          <div *ngIf="!currentTranscript && !currentAiResponse" class="transcript-placeholder">
            <p>💡 Tip: Speak your query, or try a voice command like <em>"Switch to dark mode"</em></p>
          </div>
        </div>

        <!-- Controls Toolbar Footer -->
        <div class="modal-footer">
          <!-- Mode Selector (Hands-Free Auto Loop vs Push-to-Talk) -->
          <div class="mode-toggle-group">
            <button 
              class="mode-btn" 
              [class.active]="mode === 'push-to-talk'" 
              (click)="setMode('push-to-talk')"
              title="Manual control: Speak and click Send Query when ready"
            >
              <i class="ri-fingerprint-line"></i>
              <span>Push-to-Talk</span>
            </button>
            <button 
              class="mode-btn" 
              [class.active]="mode === 'auto'" 
              (click)="setMode('auto')"
              title="Continuous hands-free conversation loop"
            >
              <i class="ri-repeat-2-line"></i>
              <span>Hands-Free Loop</span>
            </button>
          </div>

          <!-- Main Interactive Action Buttons -->
          <div class="action-buttons-center">
            <!-- Mute / Unmute Button -->
            <button 
              class="footer-circle-btn mic-toggle" 
              [class.muted]="isMuted"
              (click)="toggleMute()" 
              [title]="isMuted ? 'Unmute Microphone' : 'Mute Microphone'"
            >
              <i [class]="isMuted ? 'ri-mic-off-line' : 'ri-mic-fill'"></i>
            </button>

            <!-- Barge-In / Stop Speaking Button (visible when Lumi is speaking) -->
            <button 
              *ngIf="state === 'speaking'" 
              class="footer-action-pill stop-speech-btn animate-scale-in"
              (click)="stopSpeaking()"
              title="Interrupt and stop speaking"
            >
              <i class="ri-stop-circle-fill"></i>
              <span>Stop Lumi</span>
            </button>

            <!-- Manual Send Turn (when in Push-to-Talk mode or user wants to send immediately) -->
            <button 
              *ngIf="currentTranscript && (state === 'listening' || state === 'idle')" 
              class="footer-action-pill send-turn-btn animate-scale-in"
              (click)="manualSendTurn()"
              title="Send query now"
            >
              <i class="ri-send-plane-fill"></i>
              <span>Send Query</span>
            </button>
          </div>

          <!-- End Session Button -->
          <button class="footer-end-btn" (click)="close()" title="Exit voice session">
            <i class="ri-phone-fill"></i>
            <span>End Call</span>
          </button>
        </div>

        <!-- Voice Commands Cheat Sheet Drawer / Modal -->
        <div *ngIf="showCommands" class="commands-drawer animate-slide-up">
          <div class="drawer-header">
            <div class="drawer-title">
              <i class="ri-command-line"></i>
              <h4>Voice Control Cheat Sheet</h4>
            </div>
            <button class="icon-tool-btn" (click)="showCommands = false"><i class="ri-close-line"></i></button>
          </div>

          <p class="drawer-desc">Speak any of these natural commands anytime during voice mode:</p>

          <div class="commands-grid">
            <div class="command-card">
              <span class="cmd-category">💬 Chat & Navigation</span>
              <div class="cmd-sample">"New chat" / "Start new conversation"</div>
              <div class="cmd-sample">"Delete this conversation"</div>
              <div class="cmd-sample">"Toggle sidebar" / "Open menu"</div>
            </div>

            <div class="command-card">
              <span class="cmd-category">🎨 Theme & Interface</span>
              <div class="cmd-sample">"Switch to dark mode"</div>
              <div class="cmd-sample">"Switch to light mode"</div>
              <div class="cmd-sample">"Toggle theme"</div>
            </div>

            <div class="command-card">
              <span class="cmd-category">🧠 Vault & Web AI</span>
              <div class="cmd-sample">"Open vault" / "Open documents"</div>
              <div class="cmd-sample">"Turn on live web search"</div>
              <div class="cmd-sample">"Enable vault RAG search"</div>
            </div>

            <div class="command-card">
              <span class="cmd-category">🔊 Voice & Models</span>
              <div class="cmd-sample">"Stop" / "Be quiet" / "Pause"</div>
              <div class="cmd-sample">"Switch language to Hindi / Spanish..."</div>
              <div class="cmd-sample">"Switch model to Gemini / Llama..."</div>
              <div class="cmd-sample">"Repeat last message"</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .voice-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 18, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .voice-modal-container {
      width: 100%;
      max-width: 760px;
      height: 85vh;
      max-height: 720px;
      border-radius: 28px;
      background: radial-gradient(circle at 50% 30%, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-glow);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    /* Modal Header */
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 10;
    }

    .brand-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .mode-pill {
      font-size: 0.72rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 2px 10px;
      border-radius: 20px;
      font-weight: 600;
    }

    .mode-pill.auto {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }

    .live-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #64748b;
      transition: all 0.3s ease;
    }

    .live-dot.active {
      background: #10b981;
      box-shadow: 0 0 12px #10b981;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .lang-selector-wrapper {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 0.3rem 0.65rem;
      color: #94a3b8;
    }

    .voice-lang-select {
      background: transparent;
      border: none;
      color: #f8fafc;
      font-size: 0.82rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }

    .voice-lang-select option {
      background: #0f172a;
      color: #fff;
    }

    .icon-tool-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .icon-tool-btn:hover, .icon-tool-btn.active {
      background: rgba(99, 102, 241, 0.25);
      border-color: var(--border-active);
      color: #fff;
      box-shadow: 0 0 12px var(--accent-glow);
    }

    .close-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: #ef4444;
      color: #ef4444;
    }

    /* Command Toast */
    .command-toast {
      position: absolute;
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.5rem 1.25rem;
      border-radius: 24px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
      z-index: 20;
    }

    /* Auto-Send Countdown Banner */
    .auto-countdown-banner {
      position: absolute;
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #6366f1;
      padding: 0.45rem 1rem;
      border-radius: 24px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.84rem;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
      z-index: 20;
    }

    .countdown-cancel-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      color: #fca5a5;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
    }

    .countdown-send-btn {
      background: var(--accent-gradient);
      border: none;
      color: #fff;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
    }

    /* Central Orb Section */
    .orb-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 1rem 0;
      min-height: 260px;
    }

    .glow-bg {
      position: absolute;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.3;
      transition: all 0.5s ease;
      pointer-events: none;
    }

    .glow-bg.listening {
      background: radial-gradient(circle, #38bdf8 0%, #6366f1 70%);
      opacity: 0.45;
    }
    .glow-bg.processing {
      background: radial-gradient(circle, #ec4899 0%, #8b5cf6 70%);
      opacity: 0.5;
    }
    .glow-bg.speaking {
      background: radial-gradient(circle, #10b981 0%, #3b82f6 70%);
      opacity: 0.55;
    }
    .glow-bg.paused {
      background: radial-gradient(circle, #f59e0b 0%, #ef4444 70%);
      opacity: 0.3;
    }

    .orb-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(99, 102, 241, 0.2);
      pointer-events: none;
      transition: transform 0.1s ease-out;
    }

    .ring-1 {
      width: 170px;
      height: 170px;
    }

    .ring-2 {
      width: 220px;
      height: 220px;
      border-color: rgba(99, 102, 241, 0.1);
    }

    .central-orb {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      box-shadow: 0 0 35px rgba(99, 102, 241, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 5;
      transition: all 0.15s ease-out;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .central-orb:hover {
      transform: scale(1.08) !important;
    }

    .central-orb.listening {
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%);
      box-shadow: 0 0 45px rgba(56, 189, 248, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.4);
    }

    .central-orb.processing {
      background: linear-gradient(135deg, #701a75 0%, #a21caf 50%, #f472b6 100%);
      box-shadow: 0 0 45px rgba(244, 114, 182, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.4);
      animation: spin-pulse 2s infinite ease-in-out;
    }

    .central-orb.speaking {
      background: linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%);
      box-shadow: 0 0 50px rgba(52, 211, 153, 0.7), inset 0 0 30px rgba(255, 255, 255, 0.5);
    }

    .central-orb.paused {
      background: linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%);
      box-shadow: 0 0 30px rgba(245, 158, 11, 0.4);
    }

    .orb-core {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .orb-icon {
      font-size: 2.2rem;
      color: #ffffff;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
    }

    .mic-glow {
      animation: micPulse 1.2s infinite alternate ease-in-out;
    }

    .speak-pulse {
      animation: speakPulse 0.8s infinite alternate ease-in-out;
    }

    .spin-slow {
      animation: spin 1s infinite linear;
    }

    /* Equalizer Wave Bars */
    .audio-wave-bars {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 36px;
      margin-top: 1.25rem;
    }

    .wave-bar {
      width: 4px;
      min-height: 4px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.3);
      transition: height 0.08s ease-out;
    }

    .wave-bar.listening {
      background: linear-gradient(to top, #0284c7, #38bdf8);
    }

    .wave-bar.speaking {
      background: linear-gradient(to top, #059669, #34d399);
    }

    .wave-bar.processing {
      background: linear-gradient(to top, #a21caf, #f472b6);
    }

    /* Status Label Badge */
    .status-label-badge {
      margin-top: 0.85rem;
      padding: 0.35rem 1rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .status-text {
      font-size: 0.84rem;
      font-weight: 500;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pulse-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .pulse-indicator.red { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
    .pulse-indicator.purple { background: #c084fc; box-shadow: 0 0 8px #c084fc; }
    .pulse-indicator.green { background: #34d399; box-shadow: 0 0 8px #34d399; }
    .pulse-indicator.amber { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; }
    .pulse-indicator.gray { background: #64748b; }

    /* Subtitles / Live Transcript Area */
    .transcript-display-area {
      padding: 0.85rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 180px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .transcript-bubble {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .transcript-avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .transcript-avatar.ai-avatar {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .transcript-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .transcript-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .clear-text-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 0.72rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .clear-text-btn:hover {
      text-decoration: underline;
    }

    .transcript-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .transcript-text {
      font-size: 0.92rem;
      line-height: 1.45;
      color: #f1f5f9;
      word-break: break-word;
    }

    .transcript-placeholder {
      text-align: center;
      color: #64748b;
      font-size: 0.84rem;
      padding: 0.5rem 0;
    }

    /* Modal Footer Toolbar */
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.75rem;
      background: rgba(15, 23, 42, 0.8);
      gap: 1rem;
    }

    .mode-toggle-group {
      display: flex;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      padding: 3px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .mode-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 16px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mode-btn.active {
      background: var(--accent-gradient);
      color: #fff;
      box-shadow: 0 2px 8px var(--accent-glow);
    }

    .action-buttons-center {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .footer-circle-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    }

    .footer-circle-btn:hover {
      transform: scale(1.08);
      background: rgba(255, 255, 255, 0.18);
    }

    .footer-circle-btn.muted {
      background: #ef4444;
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
    }

    .footer-action-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 24px;
      border: none;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stop-speech-btn {
      background: #ef4444;
      color: #fff;
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
    }

    .stop-speech-btn:hover {
      background: #dc2626;
      transform: translateY(-2px);
    }

    .send-turn-btn {
      background: var(--accent-gradient);
      color: #fff;
      box-shadow: 0 0 16px var(--accent-glow);
    }

    .send-turn-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 20px var(--accent-glow);
    }

    .footer-end-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 1.1rem;
      border-radius: 20px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .footer-end-btn:hover {
      background: #ef4444;
      color: #fff;
      border-color: #ef4444;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.4);
    }

    /* Commands Drawer */
    .commands-drawer {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(24px);
      padding: 1.75rem;
      z-index: 30;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.75rem;
    }

    .drawer-title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: #fff;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .drawer-desc {
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .commands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .command-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .cmd-category {
      font-size: 0.85rem;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 0.25rem;
    }

    .cmd-sample {
      font-size: 0.8rem;
      color: #cbd5e1;
      background: rgba(0, 0, 0, 0.25);
      padding: 4px 8px;
      border-radius: 6px;
      font-family: var(--font-code);
    }

    /* Keyframe Animations */
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @keyframes micPulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      100% { transform: scale(1.1); opacity: 1; }
    }

    @keyframes speakPulse {
      0% { transform: scale(0.92); opacity: 0.85; }
      100% { transform: scale(1.12); opacity: 1; }
    }

    @keyframes spin-pulse {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.05) rotate(180deg); }
      100% { transform: scale(1) rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -15px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-slide-down {
      animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .animate-slide-up {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    .animate-scale-in {
      animation: fadeIn 0.2s ease-out;
    }
  `]
})
export class VoiceModalComponent implements OnInit, OnDestroy {
  @Input() initialLanguage: string = 'English';
  @Output() closeModal = new EventEmitter<void>();
  @Output() onVoiceQuery = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();

  state: VoiceState = 'idle';
  mode: VoiceMode = 'auto';
  audioLevel: number = 0;
  selectedLanguage: string = 'English';
  isMuted: boolean = false;
  showCommands: boolean = false;
  autoCountdown: number = 0;

  currentTranscript: string = '';
  currentAiResponse: string = '';
  lastCommandFeedback: string = '';
  private toastTimeout: any = null;

  waveBars = new Array(16).fill(0);

  private subs: Subscription[] = [];

  constructor(
    public voiceService: VoiceControlService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.selectedLanguage = this.initialLanguage || 'English';
    this.voiceService.setLanguage(this.selectedLanguage);

    this.subs.push(
      this.voiceService.state$.subscribe((st) => {
        this.state = st;
        this.cdr.markForCheck();
      }),
      this.voiceService.mode$.subscribe((m) => {
        this.mode = m;
        this.cdr.markForCheck();
      }),
      this.voiceService.audioLevel$.subscribe((lvl) => {
        this.audioLevel = lvl;
        this.cdr.markForCheck();
      }),
      this.voiceService.transcript$.subscribe((t: VoiceTranscript) => {
        this.currentTranscript = t.text;
        this.cdr.markForCheck();
      }),
      this.voiceService.command$.subscribe((cmd: VoiceCommand) => {
        this.displayCommandToast(cmd.feedback);
        this.cdr.markForCheck();
      }),
      this.voiceService.autoCountdown$.subscribe((cnt: number) => {
        this.autoCountdown = cnt;
        this.cdr.markForCheck();
      }),
      this.voiceService.userFinalSpeech$.subscribe((query: string) => {
        this.currentAiResponse = '';
        this.onVoiceQuery.emit(query);
        this.cdr.markForCheck();
      })
    );

    // Start live voice session immediately upon modal open
    this.voiceService.startVoiceSession();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.voiceService.stopVoiceSession();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('voice-overlay')) {
      this.close();
    }
  }

  close(): void {
    this.voiceService.stopVoiceSession();
    this.closeModal.emit();
  }

  setMode(mode: VoiceMode): void {
    this.voiceService.setMode(mode);
  }

  onLanguageChange(): void {
    this.voiceService.setLanguage(this.selectedLanguage);
    this.languageChange.emit(this.selectedLanguage);
  }

  toggleMute(): void {
    this.isMuted = this.voiceService.toggleMute();
  }

  stopSpeaking(): void {
    this.voiceService.stopSpeaking();
    this.voiceService.startListening();
  }

  cancelCountdown(): void {
    this.voiceService.setMode(this.mode); // resets silence timer safely
  }

  clearTranscript(): void {
    this.currentTranscript = '';
    this.voiceService.stopSpeaking();
  }

  manualSendTurn(): void {
    if (this.currentTranscript.trim()) {
      this.voiceService.finishUserSpeechTurn(this.currentTranscript);
    }
  }

  onOrbClick(): void {
    if (this.state === 'speaking') {
      this.stopSpeaking();
    } else if (this.currentTranscript.trim()) {
      this.manualSendTurn();
    } else if (this.isMuted || this.state === 'paused') {
      this.toggleMute();
    }
  }

  getOrbTooltip(): string {
    if (this.state === 'speaking') return 'Click to stop Lumi speaking';
    if (this.currentTranscript.trim()) return 'Click to send your query now';
    if (this.state === 'listening') return 'Listening...';
    if (this.isMuted) return 'Click to unmute';
    return 'Click to activate';
  }

  getBarHeight(index: number): number {
    const factor = Math.sin((index / 15) * Math.PI);
    const base = this.state === 'listening' || this.state === 'speaking' ? 6 : 4;
    return base + (this.audioLevel * 30 * factor);
  }

  displayCommandToast(feedback: string): void {
    this.lastCommandFeedback = feedback;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.lastCommandFeedback = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  public updateAiResponse(chunkText: string, isDone: boolean = false): void {
    this.currentAiResponse = chunkText;
    this.cdr.markForCheck();
  }
}
