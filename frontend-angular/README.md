# 🎨 Lumi AI — Angular Frontend Client

[![Angular](https://img.shields.io/badge/Angular-19.1.0-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?style=flat-square&logo=reactivex)](https://rxjs.dev/)

This repository contains the standalone **Angular 19** frontend application for **Lumi AI**. It provides a sleek glassmorphism user interface with dark/light themes, real-time message streaming, thread management, speech recording, and Google Authentication integration.

---

## 🚀 Development Setup

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

## 🧩 Architectural Overview

The Angular application is organized using **Standalone Components** and modular services:

### Key Components

- **`AuthComponent` (`src/app/components/auth/`)**:
  - Implements tabbed Login and Sign-Up forms.
  - Supports Google Identity Services (GSI) prompt and backend authentication.
  - Features glassmorphism panels, ambient background glows, and instant demo access.

- **`ChatBoxComponent` (`src/app/components/chat-box/`)**:
  - Handles real-time message exchange and streaming via Server-Sent Events (SSE).
  - Includes integrated audio recorder for voice dictation (STT).
  - Provides text-to-speech (TTS) read-aloud buttons for AI responses.

- **`SidebarComponent` (`src/app/components/sidebar/`)**:
  - Displays persistent conversation threads sorted chronologically.
  - Handles thread creation, selection, and deletion.
  - Shows logged-in user profile avatar and logout controls.

### Key Services

- **`AuthService` (`src/app/services/auth.service.ts`)**:
  - Manages session state via RxJS `BehaviorSubject`.
  - Connects to FastAPI endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/google`).
  - Persists authenticated user in `localStorage`.

- **`ChatService` (`src/app/services/chat.service.ts`)**:
  - Manages thread selection and message list state.
  - Handles voice transcription file upload (`/api/transcribe`) and audio playback (`/api/tts`).

- **`ThemeService` (`src/app/services/theme.service.ts`)**:
  - Manages global CSS variables for dynamic Dark Mode and Light Mode switching.

---

## 🎨 Design Tokens & Theming

The application uses Vanilla CSS custom properties defined in `src/styles.css` for instant theme toggling without full page reloads:

- `--bg-dark`, `--panel-bg`, `--glass-border`
- `--text-primary`, `--text-secondary`
- `--accent-purple`, `--accent-blue`
