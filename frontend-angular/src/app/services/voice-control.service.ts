import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ChatService } from './chat.service';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused';
export type VoiceMode = 'auto' | 'push-to-talk';

export interface VoiceCommand {
  action: 
    | 'NEW_CHAT' 
    | 'DELETE_CHAT' 
    | 'TOGGLE_THEME' 
    | 'SET_THEME' 
    | 'OPEN_VAULT' 
    | 'CLOSE_VAULT' 
    | 'TOGGLE_SIDEBAR' 
    | 'TOGGLE_RAG' 
    | 'TOGGLE_WEB' 
    | 'SET_LANGUAGE' 
    | 'SET_MODEL' 
    | 'STOP_SPEAKING' 
    | 'REPEAT_MESSAGE' 
    | 'HELP';
  payload?: any;
  rawText: string;
  feedback: string;
}

export interface VoiceTranscript {
  text: string;
  isFinal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceControlService {
  // Observables for state
  private stateSubject = new BehaviorSubject<VoiceState>('idle');
  public state$: Observable<VoiceState> = this.stateSubject.asObservable();

  private modeSubject = new BehaviorSubject<VoiceMode>('auto');
  public mode$: Observable<VoiceMode> = this.modeSubject.asObservable();

  private audioLevelSubject = new BehaviorSubject<number>(0);
  public audioLevel$: Observable<number> = this.audioLevelSubject.asObservable();

  private transcriptSubject = new Subject<VoiceTranscript>();
  public transcript$: Observable<VoiceTranscript> = this.transcriptSubject.asObservable();

  private commandSubject = new Subject<VoiceCommand>();
  public command$: Observable<VoiceCommand> = this.commandSubject.asObservable();

  private userFinalSpeechSubject = new Subject<string>();
  public userFinalSpeech$: Observable<string> = this.userFinalSpeechSubject.asObservable();

  private activeLanguageSubject = new BehaviorSubject<string>('English');
  public activeLanguage$: Observable<string> = this.activeLanguageSubject.asObservable();

  // Silence Countdown for Auto Mode (seconds remaining, 0 when not active)
  private autoCountdownSubject = new BehaviorSubject<number>(0);
  public autoCountdown$: Observable<number> = this.autoCountdownSubject.asObservable();

  // Web Speech API
  private recognition: any = null;
  private isRecognitionRunning = false;
  private isMuted = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  // Web Audio API for visualizer
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  // Silence detection timer for continuous hands-free voice chat
  private silenceTimer: any = null;
  private countdownInterval: any = null;
  private accumulatedTranscript = '';
  private isManualStop = false;

  // Streaming Real-Time TTS Queue
  private speechSentenceQueue: string[] = [];
  private speechTokenBuffer: string = '';
  private isStreamCompleted: boolean = false;
  private isCurrentlyPlayingSentence: boolean = false;

  public readonly SPEECH_LANG_MAP: Record<string, string> = {
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

  constructor(
    private ngZone: NgZone,
    private chatService: ChatService
  ) {
    this.initSpeechRecognition();
  }

  public getState(): VoiceState {
    return this.stateSubject.value;
  }

  public getMode(): VoiceMode {
    return this.modeSubject.value;
  }

  public setMode(mode: VoiceMode) {
    this.modeSubject.next(mode);
    this.clearSilenceTimers();
  }

  public setLanguage(language: string) {
    this.activeLanguageSubject.next(language);
    if (this.recognition) {
      const newLang = this.SPEECH_LANG_MAP[language] || 'en-US';
      this.recognition.lang = newLang;
      if (this.isRecognitionRunning) {
        try {
          this.recognition.stop();
        } catch (err) {}
      }
    }
  }

  public getLanguage(): string {
    return this.activeLanguageSubject.value;
  }

  // --- Initialize Speech Recognition ---
  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition is not natively supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = this.SPEECH_LANG_MAP[this.getLanguage()] || 'en-US';

    this.recognition.onstart = () => {
      this.ngZone.run(() => {
        this.isRecognitionRunning = true;
        if (this.getState() !== 'speaking' && this.getState() !== 'processing') {
          this.stateSubject.next('listening');
        }
      });
    };

    this.recognition.onresult = (event: any) => {
      this.ngZone.run(() => {
        if (this.isMuted) return;

        // Barge-in: If user speaks while Lumi is speaking, stop playback immediately!
        if (this.getState() === 'speaking') {
          this.stopSpeaking();
          this.stateSubject.next('listening');
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          this.transcriptSubject.next({
            text: currentText,
            isFinal: !!final
          });

          if (final) {
            this.accumulatedTranscript = (this.accumulatedTranscript + ' ' + final).trim();
          }

          // In Push-to-Talk mode: do not auto-send on silence.
          if (this.getMode() === 'push-to-talk') {
            this.clearSilenceTimers();
            return;
          }

          // In Auto Hands-Free Mode: automatically send when user stops speaking
          if (this.getMode() === 'auto') {
            this.clearSilenceTimers();

            const textCandidate = (this.accumulatedTranscript || currentText).trim();

            // Check if direct voice command first
            const command = this.parseVoiceCommand(textCandidate);
            if (command) {
              this.commandSubject.next(command);
              this.accumulatedTranscript = '';
              return;
            }

            // Start 1.2s silence timer: when user stops speaking, automatically send query
            this.autoCountdownSubject.next(1);
            this.silenceTimer = setTimeout(() => {
              this.ngZone.run(() => {
                const textToSend = (this.accumulatedTranscript || currentText).trim();
                this.accumulatedTranscript = '';
                this.autoCountdownSubject.next(0);
                if (textToSend) {
                  this.finishUserSpeechTurn(textToSend);
                }
              });
            }, 1200);
          }
        }
      });
    };

    this.recognition.onspeechend = () => {
      this.ngZone.run(() => {
        if (this.getMode() === 'auto' && !this.isMuted && this.getState() === 'listening') {
          const textToSend = this.accumulatedTranscript.trim();
          if (textToSend) {
            this.clearSilenceTimers();
            this.finishUserSpeechTurn(textToSend);
          }
        }
      });
    };

    this.recognition.onerror = (event: any) => {
      this.ngZone.run(() => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.stateSubject.next('idle');
          this.isRecognitionRunning = false;
        } else if (event.error === 'no-speech') {
          if (this.getState() === 'listening' && !this.isManualStop && !this.isMuted) {
            this.restartRecognition();
          }
        }
      });
    };

    this.recognition.onend = () => {
      this.ngZone.run(() => {
        this.isRecognitionRunning = false;
        if (this.getState() === 'listening' && !this.isManualStop && !this.isMuted) {
          this.restartRecognition();
        }
      });
    };
  }

  private clearSilenceTimers() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.autoCountdownSubject.next(0);
  }

  // --- Web Audio API Microphone Analyzer for Visualizer ---
  public async startAudioAnalysis(): Promise<void> {
    try {
      if (!this.microphoneStream) {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1.0, avg / 80.0);

        this.audioLevelSubject.next(normalized);
        this.animationFrameId = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Microphone audio analysis failed:', err);
    }
  }

  public stopAudioAnalysis() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.audioLevelSubject.next(0);
  }

  // --- Voice Assistant Lifecycle Control ---
  public async startVoiceSession(): Promise<void> {
    this.isManualStop = false;
    this.accumulatedTranscript = '';
    this.clearSilenceTimers();
    await this.startAudioAnalysis();
    this.startListening();
  }

  public stopVoiceSession(): void {
    this.isManualStop = true;
    this.clearSilenceTimers();
    this.stopListening();
    this.stopSpeaking();
    this.stopAudioAnalysis();
    this.stateSubject.next('idle');
  }

  public startListening(): void {
    if (this.isMuted) return;
    this.isManualStop = false;
    this.stateSubject.next('listening');
    if (this.recognition && !this.isRecognitionRunning) {
      try {
        this.recognition.lang = this.SPEECH_LANG_MAP[this.getLanguage()] || 'en-US';
        this.recognition.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isRecognitionRunning) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }
  }

  private restartRecognition() {
    setTimeout(() => {
      if (this.getState() === 'listening' && !this.isManualStop && !this.isMuted) {
        try {
          this.recognition?.start();
        } catch (err) {}
      }
    }, 200);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopListening();
      this.stateSubject.next('paused');
    } else {
      this.startListening();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Speech Turn Finalization ---
  public finishUserSpeechTurn(explicitText?: string): void {
    this.clearSilenceTimers();

    const text = (explicitText || this.accumulatedTranscript).trim();
    this.accumulatedTranscript = '';

    if (!text) return;

    // Check if voice command
    const cmd = this.parseVoiceCommand(text);
    if (cmd) {
      this.commandSubject.next(cmd);
      return;
    }

    // Set state to processing and emit query for chat
    this.stateSubject.next('processing');
    this.userFinalSpeechSubject.next(text);
  }

  // =========================================================================
  // --- REAL-TIME STREAMING TTS QUEUE (Sentence-by-Sentence Zero-Lag Speech) ---
  // =========================================================================

  public initSpeechStream(): void {
    this.stopSpeaking();
    this.speechSentenceQueue = [];
    this.speechTokenBuffer = '';
    this.isStreamCompleted = false;
    this.isCurrentlyPlayingSentence = false;
  }

  public enqueueStreamChunk(chunkText: string): void {
    this.speechTokenBuffer += chunkText;

    // Detect natural sentence delimiters (. ? ! \n । Urdu: ۔ ؟) or pause commas after 7+ words
    const sentenceEndRegex = /([.?!;।۔؟\n]+)(\s+|$)/;
    let match = this.speechTokenBuffer.match(sentenceEndRegex);

    while (match && match.index !== undefined) {
      const cutIndex = match.index + match[0].length;
      const completeSentence = this.speechTokenBuffer.substring(0, cutIndex).trim();
      this.speechTokenBuffer = this.speechTokenBuffer.substring(cutIndex);

      if (completeSentence) {
        this.speechSentenceQueue.push(completeSentence);
        this.processNextSentenceInQueue();
      }

      match = this.speechTokenBuffer.match(sentenceEndRegex);
    }

    // If buffer grows long (e.g. 12+ words without period), split on commas to avoid lag
    const words = this.speechTokenBuffer.split(' ');
    if (words.length > 10) {
      const commaIndex = this.speechTokenBuffer.indexOf(',');
      if (commaIndex > 15) {
        const sentencePart = this.speechTokenBuffer.substring(0, commaIndex + 1).trim();
        this.speechTokenBuffer = this.speechTokenBuffer.substring(commaIndex + 1);
        if (sentencePart) {
          this.speechSentenceQueue.push(sentencePart);
          this.processNextSentenceInQueue();
        }
      }
    }
  }

  public finishSpeechStream(): void {
    this.isStreamCompleted = true;
    if (this.speechTokenBuffer.trim()) {
      this.speechSentenceQueue.push(this.speechTokenBuffer.trim());
      this.speechTokenBuffer = '';
    }
    this.processNextSentenceInQueue();
  }

  private processNextSentenceInQueue(): void {
    if (this.isCurrentlyPlayingSentence) return;

    if (this.speechSentenceQueue.length === 0) {
      if (this.isStreamCompleted) {
        this.ngZone.run(() => {
          if (this.getMode() === 'auto' && !this.isManualStop && !this.isMuted) {
            this.startListening();
          } else {
            this.stateSubject.next('idle');
          }
        });
      }
      return;
    }

    const nextSentence = this.speechSentenceQueue.shift();
    if (!nextSentence) return;

    this.isCurrentlyPlayingSentence = true;
    this.stateSubject.next('speaking');

    this.playSingleSentence(nextSentence, () => {
      this.isCurrentlyPlayingSentence = false;
      this.processNextSentenceInQueue();
    });
  }

  private playSingleSentence(text: string, onDone: () => void): void {
    const cleanText = this.cleanMarkdownForSpeech(text);
    if (!cleanText) {
      onDone();
      return;
    }

    const currentLang = this.getLanguage();
    const langCode = this.SPEECH_LANG_MAP[currentLang] || 'en-US';
    const targetLangLower = langCode.toLowerCase().replace('_', '-');
    const targetPrefix = targetLangLower.split('-')[0];

    // Find matched voice in browser speechSynthesis
    let matchedVoice: SpeechSynthesisVoice | null = null;
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // 1. Exact match with high-quality tag
        matchedVoice = voices.find(v => 
          v.lang.replace('_', '-').toLowerCase() === targetLangLower &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Neural'))
        ) || null;

        // 2. Exact match
        if (!matchedVoice) {
          matchedVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === targetLangLower) || null;
        }

        // 3. Language prefix match with quality voices
        if (!matchedVoice) {
          matchedVoice = voices.find(v => 
            v.lang.replace('_', '-').toLowerCase().startsWith(targetPrefix) &&
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Neural'))
          ) || null;
        }

        // 4. Any language prefix match
        if (!matchedVoice) {
          matchedVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetPrefix)) || null;
        }
      }
    }

    // Only use browser SpeechSynthesis if a genuine voice matching the target language is installed!
    if (matchedVoice && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = langCode;
        utterance.voice = matchedVoice;
        utterance.rate = 1.12;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          this.ngZone.run(() => {
            this.currentUtterance = null;
            onDone();
          });
        };

        utterance.onerror = (err) => {
          this.ngZone.run(() => {
            console.warn('SpeechSynthesis error on sentence, falling back to backend TTS:', err);
            this.currentUtterance = null;
            this.playBackendTts(cleanText, currentLang, onDone);
          });
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    // High-quality backend TTS for all regional languages without local OS voice packs (Punjabi, Bengali, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam, Urdu, etc.)
    this.playBackendTts(cleanText, currentLang, onDone);
  }

  private playBackendTts(cleanText: string, language: string, onDone: () => void): void {
    this.chatService.getTts(cleanText, language).subscribe({
      next: (blob) => {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudioElement = audio;

        audio.onended = () => {
          this.ngZone.run(() => {
            this.currentAudioElement = null;
            try { URL.revokeObjectURL(audioUrl); } catch (e) {}
            onDone();
          });
        };

        audio.onerror = () => {
          this.ngZone.run(() => {
            console.warn('Backend audio playback error');
            this.currentAudioElement = null;
            try { URL.revokeObjectURL(audioUrl); } catch (e) {}
            onDone();
          });
        };

        audio.play().catch(err => {
          console.warn('Audio play failed:', err);
          this.currentAudioElement = null;
          try { URL.revokeObjectURL(audioUrl); } catch (e) {}
          onDone();
        });
      },
      error: (err) => {
        console.warn('Backend TTS request error:', err);
        onDone();
      }
    });
  }

  // --- Fallback one-shot speak (e.g. for Repeat command) ---
  public speakText(text: string, onEndCallback?: () => void): void {
    if (!text || !text.trim()) {
      if (this.getMode() === 'auto') {
        this.startListening();
      } else {
        this.stateSubject.next('idle');
      }
      return;
    }

    this.initSpeechStream();
    this.enqueueStreamChunk(text);
    this.finishSpeechStream();
  }

  public stopSpeaking(): void {
    this.speechSentenceQueue = [];
    this.speechTokenBuffer = '';
    this.isCurrentlyPlayingSentence = false;
    this.isStreamCompleted = false;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    this.currentUtterance = null;
  }

  // --- Clean markdown text for TTS ---
  private cleanMarkdownForSpeech(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/-\s+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  // --- Voice Control Intent Parser ---
  public parseVoiceCommand(transcript: string): VoiceCommand | null {
    const text = transcript.trim().toLowerCase();

    // 1. Stop / Be quiet / Silence
    if (
      text === 'stop' || 
      text === 'stop talking' || 
      text === 'be quiet' || 
      text === 'pause' || 
      text === 'mute' || 
      text === 'silence' ||
      text === 'hush' ||
      text === 'शांत रहो' ||
      text === 'चुप रहो'
    ) {
      this.stopSpeaking();
      return {
        action: 'STOP_SPEAKING',
        rawText: transcript,
        feedback: 'Stopped Lumi voice playback'
      };
    }

    // 2. New chat / Clear conversation
    if (
      text.includes('new chat') || 
      text.includes('new conversation') || 
      text.includes('start a new chat') || 
      text.includes('create new chat') || 
      text.includes('clear chat') || 
      text.includes('fresh chat') ||
      text.includes('नया चैट') ||
      text.includes('नई बातचीत')
    ) {
      return {
        action: 'NEW_CHAT',
        rawText: transcript,
        feedback: 'Starting a new conversation'
      };
    }

    // 3. Delete chat
    if (
      text.includes('delete chat') || 
      text.includes('delete this chat') || 
      text.includes('delete conversation') ||
      text.includes('remove this conversation') ||
      text.includes('चैट डिलीट')
    ) {
      return {
        action: 'DELETE_CHAT',
        rawText: transcript,
        feedback: 'Deleting active conversation'
      };
    }

    // 4. Dark Mode / Light Mode / Theme Toggle
    if (text.includes('dark mode') || text.includes('enable dark mode') || text.includes('switch to dark mode')) {
      return {
        action: 'SET_THEME',
        payload: 'dark',
        rawText: transcript,
        feedback: 'Switched to Dark Mode'
      };
    }
    if (text.includes('light mode') || text.includes('enable light mode') || text.includes('switch to light mode')) {
      return {
        action: 'SET_THEME',
        payload: 'light',
        rawText: transcript,
        feedback: 'Switched to Light Mode'
      };
    }
    if (text.includes('toggle theme') || text.includes('change theme') || text.includes('switch theme')) {
      return {
        action: 'TOGGLE_THEME',
        rawText: transcript,
        feedback: 'Toggled application theme'
      };
    }

    // 5. Open / Close Knowledge Vault
    if (
      text.includes('open vault') || 
      text.includes('open knowledge vault') || 
      text.includes('open my documents') || 
      text.includes('show documents') || 
      text.includes('open documents') ||
      text.includes('नॉलेज वॉल्ट खोलो') ||
      text.includes('वॉल्ट खोलो')
    ) {
      return {
        action: 'OPEN_VAULT',
        rawText: transcript,
        feedback: 'Opening Knowledge Vault'
      };
    }
    if (
      text.includes('close vault') || 
      text.includes('hide vault') || 
      text.includes('close documents') ||
      text.includes('वॉल्ट बंद करो')
    ) {
      return {
        action: 'CLOSE_VAULT',
        rawText: transcript,
        feedback: 'Closing Knowledge Vault'
      };
    }

    // 6. Toggle Sidebar / Menu
    if (
      text.includes('toggle sidebar') || 
      text.includes('open sidebar') || 
      text.includes('close sidebar') || 
      text.includes('show menu') || 
      text.includes('hide menu')
    ) {
      return {
        action: 'TOGGLE_SIDEBAR',
        rawText: transcript,
        feedback: 'Toggled sidebar menu'
      };
    }

    // 7. Toggle Web Search
    if (
      text.includes('turn on web search') || 
      text.includes('enable web search') || 
      text.includes('activate web search') ||
      text.includes('turn off web search') || 
      text.includes('disable web search') || 
      text.includes('toggle web search') ||
      text.includes('वेब सर्च')
    ) {
      const enable = !text.includes('off') && !text.includes('disable');
      return {
        action: 'TOGGLE_WEB',
        payload: enable,
        rawText: transcript,
        feedback: enable ? 'Web Search enabled' : 'Web Search disabled'
      };
    }

    // 8. Toggle Vault RAG
    if (
      text.includes('turn on rag') || 
      text.includes('enable rag') || 
      text.includes('enable vault rag') ||
      text.includes('turn off rag') || 
      text.includes('disable rag') || 
      text.includes('toggle rag')
    ) {
      const enable = !text.includes('off') && !text.includes('disable');
      return {
        action: 'TOGGLE_RAG',
        payload: enable,
        rawText: transcript,
        feedback: enable ? 'Vault RAG Search enabled' : 'Vault RAG Search disabled'
      };
    }

    // 9. Switch Language
    const languageKeywords: Record<string, string> = {
      'hindi': 'Hindi',
      'हिंदी': 'Hindi',
      'english': 'English',
      'अंग्रेजी': 'English',
      'spanish': 'Spanish',
      'french': 'French',
      'german': 'German',
      'bengali': 'Bengali',
      'tamil': 'Tamil',
      'telugu': 'Telugu',
      'marathi': 'Marathi',
      'gujarati': 'Gujarati',
      'kannada': 'Kannada',
      'malayalam': 'Malayalam',
      'punjabi': 'Punjabi',
      'urdu': 'Urdu'
    };

    if (text.includes('switch language to') || text.includes('change language to') || text.includes('set language to') || text.includes('speak in')) {
      for (const [key, lang] of Object.entries(languageKeywords)) {
        if (text.includes(key)) {
          return {
            action: 'SET_LANGUAGE',
            payload: lang,
            rawText: transcript,
            feedback: `Switched language to ${lang}`
          };
        }
      }
    }

    // 10. Switch Model
    if (text.includes('switch model to') || text.includes('change model to') || text.includes('use model')) {
      if (text.includes('gemini')) {
        return { action: 'SET_MODEL', payload: 'google/gemini-2.0-flash-exp:free', rawText: transcript, feedback: 'Model set to Gemini 2.0 Flash' };
      }
      if (text.includes('llama 3.3') || text.includes('llama 70b')) {
        return { action: 'SET_MODEL', payload: 'meta-llama/llama-3.3-70b-instruct:free', rawText: transcript, feedback: 'Model set to Llama 3.3 70B' };
      }
      if (text.includes('llama')) {
        return { action: 'SET_MODEL', payload: 'meta-llama/llama-3.1-8b-instruct:free', rawText: transcript, feedback: 'Model set to Llama 3.1 8B' };
      }
      if (text.includes('glm') || text.includes('z.ai')) {
        return { action: 'SET_MODEL', payload: 'z-ai/glm-5.2:free', rawText: transcript, feedback: 'Model set to Z.ai GLM 5.2' };
      }
      if (text.includes('mistral')) {
        return { action: 'SET_MODEL', payload: 'mistralai/mistral-7b-instruct:free', rawText: transcript, feedback: 'Model set to Mistral 7B' };
      }
      if (text.includes('free') || text.includes('auto')) {
        return { action: 'SET_MODEL', payload: 'openrouter/free', rawText: transcript, feedback: 'Model set to OpenRouter Auto Free' };
      }
    }

    // 11. Repeat / Read last message
    if (
      text === 'repeat' || 
      text === 'repeat that' || 
      text === 'read last message' || 
      text === 'say that again' || 
      text === 'say again' ||
      text === 'फिर से बोलो'
    ) {
      return {
        action: 'REPEAT_MESSAGE',
        rawText: transcript,
        feedback: 'Repeating last response'
      };
    }

    // 12. Voice Commands Help
    if (
      text === 'help' || 
      text === 'voice help' || 
      text === 'voice commands' || 
      text === 'what can i say' || 
      text === 'show commands' ||
      text === 'कमांड्स दिखाओ'
    ) {
      return {
        action: 'HELP',
        rawText: transcript,
        feedback: 'Showing voice commands cheat sheet'
      };
    }

    return null;
  }
}
