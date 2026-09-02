# Real-Time Conversational Voice Chat & Voice Control Feature

## Overview
This feature introduces a full-duplex **Real-Time Voice Assistant Mode** and comprehensive **Voice Control System** for Lumi AI ("My Second Brain"). Users can converse naturally with Lumi AI completely hands-free (like ChatGPT Voice / Gemini Live) and control application features (theme, navigation, vault, search, models, and conversation management) using spoken voice commands in 15+ languages.

---

## Key Capabilities

1. **Real-Time Conversational Voice Mode (Full-Duplex)**:
   - **Continuous Hands-Free Conversation Loop**: Listens to the user -> detects speech end -> sends to AI with streaming response -> speaks AI response via natural TTS -> automatically resumes listening for continuous dialogue.
   - **Audio Reactive 3D Orb & Waveform Visualizer**: Real-time Web Audio API frequency analysis driving smooth glowing particle and waveform animations reflecting speaking/listening intensity.
   - **Barge-In / Interruption Support**: Instant cancellation of AI speech if the user interrupts or speaks.
   - **Hands-Free vs. Push-to-Talk Toggle**: Supports both auto-turn conversation and push-to-talk for noisy environments.

2. **Full App Voice Control System**:
   - Built-in natural language intent engine that intercepts voice commands and triggers app actions:
     - **Navigation & Chats**: *"New chat"*, *"Create new conversation"*, *"Clear chat"*, *"Delete conversation"*, *"Go home"*, *"Logout"*.
     - **UI & Themes**: *"Switch to dark mode"*, *"Switch to light mode"*, *"Toggle theme"*, *"Toggle sidebar"*.
     - **Knowledge Vault & RAG**: *"Open vault"*, *"Open knowledge documents"*, *"Close vault"*, *"Enable vault RAG"*, *"Disable RAG"*.
     - **Web Search & AI**: *"Turn on web search"*, *"Disable web search"*, *"Switch model to Gemini / Llama / GLM"*, *"Switch language to Hindi / French / Spanish..."*.
     - **Voice Playback Control**: *"Stop"*, *"Be quiet"*, *"Repeat last message"*, *"Voice commands / Help"*.

3. **Futuristic Glassmorphism Voice Assistant HUD (Modal & Floating)**:
   - Interactive live voice interface with animated visualizer, live real-time transcript subtitles, quick controls, and interactive voice command cheat sheet.
   - Prominent launch button in the chat header + global hotkey (`Alt + V`).

---

## Proposed Changes

### Frontend (`frontend-angular`)

#### [NEW] [`src/app/services/voice-control.service.ts`](file:///d:/project_2023_2027/My_second_brain/frontend-angular/src/app/services/voice-control.service.ts)
- Comprehensive voice engine service wrapping Web Speech API (`webkitSpeechRecognition`), Web Audio API (`AudioContext`, `AnalyserNode`), and TTS (`SpeechSynthesis` + fallback backend gTTS).
- Real-time frequency data stream for visualizers.
- Voice command matcher & dispatcher for app actions.
- Full-duplex conversational flow management (listening -> processing -> speaking -> listening).

#### [NEW] [`src/app/components/voice-modal/voice-modal.component.ts`](file:///d:/project_2023_2027/My_second_brain/frontend-angular/src/app/components/voice-modal/voice-modal.component.ts)
- Glassmorphism animated Voice Assistant Modal.
- Audio-reactive pulsing orb and live wave bars.
- Real-time user & AI subtitles.
- Hands-free / Push-to-talk toggle, mic mute, interrupt button, and interactive command cheat sheet drawer.

#### [MODIFY] [`src/app/components/chat-box/chat-box.component.ts`](file:///d:/project_2023_2027/My_second_brain/frontend-angular/src/app/components/chat-box/chat-box.component.ts)
- Add "🎙️ Live Voice" action button in the chat header.
- Connect voice command feedback toasts/notifications.
- Enhance input mic button with pulse feedback and quick-mode switching.

#### [MODIFY] [`src/app/app.component.ts`](file:///d:/project_2023_2027/My_second_brain/frontend-angular/src/app/app.component.ts)
- Integrate `VoiceModalComponent` and `VoiceControlService`.
- Wire up voice commands to application state:
  - `NEW_CHAT` -> `onNewThread()`
  - `DELETE_CHAT` -> `onDeleteThread()`
  - `TOGGLE_THEME` -> `themeService.toggleTheme()`
  - `OPEN_VAULT` / `CLOSE_VAULT` -> `isVaultOpen`
  - `TOGGLE_SIDEBAR` -> `onToggleSidebar()`
  - `SET_LANGUAGE` / `SET_MODEL` / `TOGGLE_RAG` / `TOGGLE_WEB` -> sync with chat state.
- Register `Alt + V` global keyboard shortcut to toggle Voice Mode.

#### [MODIFY] [`src/styles.css`](file:///d:/project_2023_2027/My_second_brain/frontend-angular/src/styles.css)
- Add keyframes and styles for audio wave visualizer, pulsing glow orbs, and voice command toast notifications.

---

### Backend (`backend/`)

#### [MODIFY] [`backend/voice.py`](file:///d:/project_2023_2027/My_second_brain/backend/voice.py) & [`server.py`](file:///d:/project_2023_2027/My_second_brain/server.py)
- Support voice command hint endpoints and enhanced language mapping for STT/TTS.
- Verify audio stream compatibility for low-latency playback.

---

## Verification Plan

### Automated / Build Verification
- Run Angular compiler build check (`npm run build` in `frontend-angular`) to verify zero TypeScript or template errors.
- Test Python backend server routes (`python -m uvicorn server:app --reload` check / sanity endpoints).

### Interactive & Manual Verification
1. **Live Conversational Voice Mode**:
   - Open Voice Assistant modal via header "🎙️ Live Voice" button or `Alt + V`.
   - Speak a query (e.g., *"Tell me three facts about Mars"*).
   - Verify:
     - Visualizer orb reacts smoothly to microphone input.
     - Live transcription shows user text.
     - Lumi AI streams the answer and speaks it aloud with natural voice.
     - System automatically returns to listening mode when speech ends.
     - Interrupting Lumi stops speech immediately.
2. **Voice Control Testing**:
   - Say *"Switch to light mode"* -> Check theme switches to light mode.
   - Say *"Switch to dark mode"* -> Check theme switches back to dark mode.
   - Say *"Open vault"* -> Knowledge Vault modal opens.
   - Say *"Close vault"* -> Knowledge Vault modal closes.
   - Say *"Start a new chat"* -> Starts a new chat thread.
   - Say *"Turn on web search"* / *"Turn on vault RAG"* -> Toggles feature on.
   - Say *"Switch language to Hindi"* -> Sets selected language to Hindi.
3. **Voice Commands Cheat Sheet**:
   - Click "Command Help" button in Voice Modal to verify full cheat sheet of supported voice commands.
