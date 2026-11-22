# Architecture Overview

This document describes the high-level architecture, subsystem boundaries, data flows, and technology stack of the SignBridge AI Platform.

---

## 1. System Architecture

SignBridge follows a client-centric architecture designed for low latency, user privacy, and responsiveness:

```
+-----------------------------------------------------------------------------------+
|                                  Browser Client                                   |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  |   Video & Camera   |-->|   MediaPipe Vision  |-->|  Centroid / Personal     |  |
|  |     (WebRTC)       |   |   (Local WASM Task) |   |  Held-Sign Classifier    |  |
|  +--------------------+   +---------------------+   +------------+-------------+  |
|                                                                  |                |
|  +--------------------+   +---------------------+                v                |
|  |     VoiceDesk      |<--|    Web Speech API   |<----+  Sentence Assembler &     |
|  | (STT Captions/TTS) |   |    (Local Voices)   |     |  Debounce Buffer          |
|  +--------------------+   +---------------------+     +------------------------+  |
+-----------------------------------------------------------------------------------+
                                       |
                   HTTP / REST Sessions & Supabase Sync
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                                 FastAPI Backend                                   |
|                                                                                   |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  | Account & Sessions  |  |   Owner Studio API   |  | Translation & Model Host |  |
|  |  (/api/v1/accounts) |  |   (/api/v1/owner)    |  |     (/api/v1/models)     |  |
|  +----------+----------+  +----------+-----------+  +-------------+------------+  |
|             |                        |                            |               |
|             v                        v                            v               |
|     +---------------+        +---------------+            +---------------+       |
|     | SQLite DB     |        | Consent Video |            | Published     |       |
|     | (SQLAlchemy)  |        | Directory     |            | Models JSON   |       |
|     +---------------+        +---------------+            +---------------+       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Subsystems & Data Flow

### A. Client-Side Sign Recognition Pipeline
1. **Camera Feed**: Raw camera frames are captured using the browser `navigator.mediaDevices.getUserMedia` API.
2. **Landmark Extraction**: Frames are fed into MediaPipe Hand Landmarker WASM assets running locally in the browser. Twenty-one 3D landmarks per detected hand are generated.
3. **Normalization**: Hand landmark coordinates are normalized relative to wrist origin and hand span to remain invariant to distance from the lens.
4. **Classification**:
   - **Shared Model**: Compares normalized frame vector against the owner-published centroids (Euclidean distance with cosine verification).
   - **Personal Signs**: Compares against personal family signs saved in user account/local storage.
5. **Debouncing & Message Assembly**: Validated signs pass through a temporal stabilization window to prevent stutter and false triggers, then append to the editable message draft.

### B. Two-Way Speech & Captions (VoiceDesk)
1. **Signer to Spoken Audio**: Composed sentences trigger Web Speech API `SpeechSynthesis` (or pre-bundled regional audio recordings) for instant voice playback.
2. **Hearing Partner to Text**: Browser `SpeechRecognition` captures live spoken replies and transcribes them onto the conversation view with support for multi-language captioning.
3. **Translation Service**: Cross-language translation maps text between English, Hindi, Tamil, Telugu, and other regional languages via `/api/v1/translation`.

### C. Owner Dataset Curation & Model Publishing
1. **Consented Recording**: Authorized owners record 5-second video samples with explicit signer consent.
2. **Feature Extraction**: Video clips produce normalized landmark sequences categorized with participant IDs and dataset splits (`train` / `val`).
3. **Centroid Compilation**: When the owner hits **Publish**, the backend computes class centroids, calculates cross-signer held-out validation accuracy, and generates a new versioned `published-model.json`.
4. **Version Control & Rollback**: Up to 20 past versions are preserved in storage, enabling instantaneous rollback via `/api/v1/owner/versions/{ver}/activate`.

### D. Authentication & State Sync
1. **Local Accounts**: Database-backed sessions stored in SQLite with password hashing and session tokens.
2. **Supabase Integration**: Optional verified identity exchange supporting Email OTP, Phone SMS, and OAuth providers (Google, Apple, Facebook).
3. **Cloud Saves**: Syncs user UI preferences, favorites, learning module progress, and custom family gestures (subject to 5 MB account limit).

---

## 3. Directory Layout

```
signbridge-ai-platform/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models (Accounts, Examples, Transcripts, Consent)
│   │   ├── routers/         # Endpoint modules (account, auth, owner, translation, enrollment)
│   │   ├── services/        # Business logic (centroid trainer, video processing)
│   │   ├── database.py      # SQLite connection & session pool
│   │   └── main.py          # FastAPI application factory
│   ├── tests/               # Pytest suite
│   └── requirements.txt     # Backend dependencies
├── frontend/
│   ├── public/              # Static files, PWA manifest, WASM binaries, audio
│   ├── src/
│   │   ├── components/      # UI widgets (HandOverlay, SentenceTranslator, VoiceDesk, etc.)
│   │   ├── hooks/           # useCamera, useMediaPipe
│   │   ├── lib/             # API client, speech synthesis, auto-translate, Supabase
│   │   ├── pages/           # Landing, ConversationStudio, LearnISL, CommunicationHub, etc.
│   │   ├── styles/          # Tailwind CSS tokens
│   │   └── App.tsx          # Router configuration
│   └── tests/               # Speech and translation test suite
├── docs/                    # UI specs, setup guides, upgrade roadmap
├── MODEL_CARD.md            # Model card & algorithmic ethics
├── PRIVACY.md               # Privacy disclosures
└── README.md                # Quickstart and overview
```

---

## 4. Technology Stack Summary

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Three.js
- **Vision & ML**: MediaPipe Tasks-Vision WASM, Centroid Classifier
- **Backend API**: FastAPI, Uvicorn, Python 3.11+, Pydantic v2
- **Database**: SQLite with SQLAlchemy 2.0 ORM, aiosqlite
- **Auth & Identity**: Database session tokens + Supabase Auth
- **Containerization**: Docker Compose
