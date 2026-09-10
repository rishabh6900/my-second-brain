# Lumi AI — Angular Frontend Client

[![Angular](https://img.shields.io/badge/Angular-19.1.0-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?style=flat-square&logo=reactivex)](https://rxjs.dev/)

This repository contains the standalone **Angular 19** frontend application for **Lumi AI**. It provides a sleek glassmorphism user interface with dark/light themes, real-time message streaming, zero-database Private (Incognito) Mode, full-duplex conversational voice assistant HUD, Knowledge Vault RAG manager, and thread history.

---

## Development Setup

### 1. Installation

Run `npm install` inside the `frontend-angular` directory to install project dependencies:

```bash
cd frontend-angular
npm install
```

### 2. Development Server

Run `npm start` or `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

```bash
npm start
```

### 3. Build for Production

Run `npm run build` to build the production bundle into the `dist/` directory:

```bash
npm run build
```

---

## Architectural Overview

The Angular application is organized using **Standalone Components** and modular services:

### Key Components

- **`AuthComponent` (`src/app/components/auth/`)**:
  - Implements tabbed Login and Sign-Up forms.
  - Features glassmorphism panels, ambient background glows, and instant guest demo access.

- **`ChatBoxComponent` (`src/app/components/chat-box/`)**:
  - Handles real-time message exchange and streaming via Server-Sent Events (SSE).
  - **Private / Incognito Mode**: Zero-database ephemeral chat mode with glowing purple badge and 15-language localized privacy banners.
  - **LLM Switcher**: Dynamic free model selector (OpenRouter, Llama 3.3, Gemini 2.0 Flash, Mistral, GLM 5.2).
  - **Multi-Language Selector**: 15+ supported languages for AI responses and voice interactions.
  - **RAG & Web Search Toggles**: One-click switches for Knowledge Vault retrieval and live Tavily web search.
  - **Rich Markdown Renderer**: Renders tables, blockquotes, lists, links, inline code, and IDE code blocks with copy buttons.

- **`VoiceModalComponent` (`src/app/components/voice-modal/`)**:
  - Full-screen / overlay conversational voice assistant HUD triggered by `Alt + V`.
  - Audio-reactive 3D glowing orb and real-time equalizer waveforms via Web Audio `AnalyserNode`.
  - Real-time spoken transcript display with instant AI speech synthesis streaming.

- **`VaultModalComponent` (`src/app/components/vault/`)**:
  - Manages personal document uploads (PDF, TXT, MD) and live web URL scraping.
  - Displays list of stored knowledge chunks and vector embeddings with delete capabilities.

- **`SidebarComponent` (`src/app/components/sidebar/`)**:
  - Displays persistent conversation threads sorted chronologically.
  - Handles thread creation, selection, and deletion (private chats are automatically excluded).
  - Shows logged-in user profile avatar, system connection status, and logout controls.

---

### Key Services

- **`AuthService` (`src/app/services/auth.service.ts`)**:
  - Manages session state via RxJS `BehaviorSubject`.
  - Connects to FastAPI endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password`).
  - Persists authenticated user in `localStorage`.

- **`ChatService` (`src/app/services/chat.service.ts`)**:
  - Manages SSE streaming connection (`/api/chat/stream`) with `is_private` support.
  - Retrieves available LLM models list (`/api/models`).
  - Handles voice transcription file upload (`/api/transcribe`) and audio playback (`/api/tts`).

- **`VoiceControlService` (`src/app/services/voice-control.service.ts`)**:
  - Orchestrates natural language voice commands (e.g. *"New chat"*, *"Open vault"*, *"Toggle theme"*, *"Switch to Hindi"*).
  - Manages zero-latency streaming text-to-speech queues.

- **`VaultService` (`src/app/services/vault.service.ts`)**:
  - Connects to Knowledge Vault backend endpoints (`/api/vault/upload`, `/api/vault/url`, `/api/vault/documents`).

- **`ThemeService` (`src/app/services/theme.service.ts`)**:
  - Manages global CSS variables for dynamic Dark Mode and Light Mode switching with local persistence.

---

## Design Tokens & Theming

The application uses Vanilla CSS custom properties defined in `src/styles.css` for instant theme toggling without full page reloads:

- `--bg-primary`, `--bg-secondary`, `--bg-card`, `--panel-bg`
- `--glass-border`, `--glass-shine`, `--accent-glow`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-gradient`, `--accent-primary`, `--accent-secondary`


