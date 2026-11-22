# SignBridge AI Platform 🤟

> **Empowering inclusive, real-time, two-way communication between Deaf/Hard-of-Hearing individuals and hearing non-signers.**

SignBridge is an accessibility-first AI platform built around Indian Sign Language (ISL), client-side hand-landmark detection via MediaPipe WASM, real-time speech-to-text / text-to-speech assistive tools, 3D gesture visualization, and an owner dataset curation and model training studio.

---

## 🌟 Key Features

### 1. 💬 Two-Way Conversation Studio (`/conversation`)
- **Real-Time Camera Gesture Recognition**: Analyzes live camera feed using MediaPipe Hand Landmarker compiled to WebAssembly (WASM) running 100% locally in your browser.
- **Dynamic Landmark Overlay**: Visualizes hand joints and gestures with confidence indicators.
- **Sentence Assembler & Debouncer**: Accumulates recognized isolated signs into cohesive drafts with auto-correction, manual edits, and temporal debouncing.
- **VoiceDesk (Two-Way Communication)**:
  - **Speech-to-Text (STT)**: Live captions for spoken replies from hearing partners across multiple languages.
  - **Text-to-Speech (TTS)**: Instant natural voice playback for composed sign messages with adjustable speech rates and pitch.
  - **Auto-Translation**: Real-time cross-language translation across English, Hindi, Tamil, Telugu, Kannada, Bengali, and more.

### 2. 📚 Learn ISL & Reference Practice (`/learn`)
- **Structured ISL Curriculum**: Step-by-step interactive lessons covering numbers, alphabets, emergency phrases, and everyday greetings.
- **Interactive 3D Sign Avatar**: Three.js WebGL-rendered 3D sign avatar visualizing hand and arm motions.
- **Reference Practice with Camera Feedback**: Practice signs side-by-side with live visual cues and landmark alignment.

### 3. 🧰 Communication Hub & AAC Toolkits (`/hub`)
- **Augmentative and Alternative Communication (AAC)**: Quick-tap scenario boards for non-verbal expression.
- **Pre-Configured Emergency & Daily Boards**: Instant vocalization for medical emergencies, transit, daily needs, and emotional expression.

### 4. 🌐 Accessibility Network (`/accessibility`)
- **Domain-Tailored Assistive Workflows**:
  - 🏥 **Healthcare**: Patient-doctor intake dialogues, symptom communication, and triage assistance.
  - 🏫 **Education**: Classroom Q&A, student-teacher communication channels.
  - 🏢 **Workplace**: Accessible standups, meeting captioning, and inclusive workplace collaboration.
  - 🏛️ **Public Services**: Civic desk interactions, banking, and public transport navigation.
  - 🚨 **Emergency**: Rapid distress signals and offline phraseboards.

### 5. 🛠️ Owner Trainer & Model Studio (`/owner/trainer`)
- **Consented Sample Recording**: 5-second video recording workflow with silent countdown for authorized trainers.
- **Dataset Management**: Participant coding, automated train/validation splits, sample inspection, and clip replay.
- **Model Publishing Engine**: Generates normalized landmark centroid representations, computes held-out cross-signer validation metrics, and produces versioned prototype models.
- **Version History & Rollback**: Maintains up to 20 model iterations with single-click instant rollback.
- **Custom Translation Dictionaries**: Manage custom sign-to-speech phrasing and regional variations.

### 6. 🔐 Account & Cloud Synchronization (`/login`)
- **Unified Authentication**: Account registration and database-backed session management.
- **Supabase Integration**: Optional email OTP, phone SMS, and OAuth (Google, Apple, Facebook) sign-in.
- **Cloud-Synced Profiles**: Sync user preferences, favorites, learning progress, and personal custom signs securely across devices.

---

## 🏗️ Architecture

```
                                 ┌──────────────────────────────────────────────┐
                                 │               Browser Client                 │
                                 │  React 19 + TypeScript + Vite + Tailwind CSS │
                                 └───────┬──────────────────────────────┬───────┘
                                         │                              │
                        Client-Side Local Processing                    │ REST / Session
                                         │                              │ HTTP APIs
                  ┌──────────────────────┴───────┐                      │
                  │ - MediaPipe Vision WASM      │                      ▼
                  │ - 3D Three.js Avatar Canvas  │         ┌─────────────────────────┐
                  │ - Web Speech API (STT / TTS) │         │     FastAPI Backend     │
                  │ - Local Storage Cache / PWA  │         │   (Python 3.11+ async)  │
                  └──────────────────────────────┘         └────────────┬────────────┘
                                                                        │
                                                ┌───────────────────────┴───────────────────────┐
                                                │                                               │
                                                ▼                                               ▼
                                     ┌─────────────────────┐                         ┌─────────────────────┐
                                     │   SQLite Database   │                         │ Published Models &  │
                                     │  (SQLAlchemy ORM)   │                         │ Consent Video Clips │
                                     └─────────────────────┘                         └─────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, React Router 7 |
| **Machine Learning & Vision** | MediaPipe Tasks-Vision (WASM), Client-Side Centroid Classifier |
| **3D Rendering** | Three.js WebGL rendering for 3D gesture guidance |
| **Audio & Speech** | Web Speech API (SpeechRecognition & SpeechSynthesis), Bundled Audio Assets |
| **Backend** | FastAPI, Uvicorn, Python 3.11+, Pydantic v2 |
| **Database & ORM** | SQLite / aiosqlite, SQLAlchemy 2.0 |
| **Auth & Cloud (Optional)** | Supabase Auth (OAuth, Email OTP, SMS) |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ (recommended 22+)
- **Python** 3.11+
- Modern browser with camera and microphone permissions enabled

---

### Local Development Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Premsai-16/sign-bridge-AI.git
cd sign-bridge-AI/signbridge-ai-platform
```

#### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` to configure your admin credentials and API options:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-to-a-strong-password
DATABASE_URL=sqlite:///./signbridge.db
CORS_ORIGINS=http://localhost:5173
```

#### 3. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the FastAPI development server
uvicorn app.main:app --reload --port 8001
```
The API documentation will be available at:
- Swagger UI: `http://localhost:8001/docs`
- Health check: `http://localhost:8001/health`

#### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### 🐳 Docker Deployment

To spin up the entire application in isolated containers:

```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8001`

---

## 📡 Backend API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Service health status |
| `/api/v1/models` | `GET` | Retrieve published isolated-sign model metadata |
| `/api/v1/auth/register` | `POST` | Register a new user account |
| `/api/v1/auth/login` | `POST` | Authenticate and obtain session token |
| `/api/v1/auth/admin/login` | `POST` | Authenticate owner / admin workspace |
| `/api/v1/accounts/me` | `GET` | Get current account details |
| `/api/v1/accounts/saves` | `GET` / `PATCH` | Sync preferences, favorites, and custom signs |
| `/api/v1/accounts/supabase` | `POST` | Exchange verified Supabase session for local session |
| `/api/v1/translation` | `POST` | Text translation API with multi-language fallback |
| `/api/v1/owner/examples` | `GET` / `POST` | Query or upload consented training examples |
| `/api/v1/owner/examples/{id}/video` | `GET` | Fetch owner review video clip |
| `/api/v1/owner/publish` | `POST` | Train, evaluate, and publish new model version |
| `/api/v1/owner/versions` | `GET` | List model version history |
| `/api/v1/owner/versions/{ver}/activate` | `POST` | Roll back to a previous model version |
| `/api/v1/transcripts/` | `GET` / `POST` | Store or retrieve conversation transcripts |
| `/api/v1/consent/` | `POST` | Submit informed consent confirmation |

---

## 🧪 Testing & Quality Assurance

### Backend Unit & Integration Tests
```bash
# Run backend test suite
backend/venv/bin/pytest backend/tests -v
```
Covers:
- Account authentication & session validation
- Owner training, dataset curation, and model rollback workflows
- API endpoints and error handling

### Frontend Speech & Translation Tests
```bash
node frontend/tests/speech.test.mjs
```
Covers:
- Shipped audio bundle verification
- Multi-language translation deduplication and cache
- Privacy protection during online translation disablement

---

## 🔒 Privacy, Security & Data Governance

- **Zero Camera Streaming by Default**: Video feeds for regular visitors are processed strictly on-device via WebAssembly. No raw video or hand images leave the browser.
- **Consented Training Only**: Trainer video samples are collected only under explicit, signed consent, stored in a secure server directory, and deleted alongside their training labels.
- **Privacy-Preserving Personal Signs**: Personal family sign models remain stored in browser memory or are encrypted under personal account data storage (5 MB cap).
- **No Secrets in Bundles**: All API keys and admin passwords reside server-side in `.env`.

---

## 📂 Project Directory Structure

```
signbridge-ai-platform/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy database schemas
│   │   ├── routers/         # API endpoints (account, owner, auth, translation, etc.)
│   │   ├── services/        # Model trainer, centroid calculator, storage logic
│   │   ├── database.py      # Database engine & session maker
│   │   └── main.py          # FastAPI application factory & middleware
│   ├── tests/               # Backend pytest test suite
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/              # Static assets, WASM bundles, PWA manifest, audio files
│   ├── src/
│   │   ├── components/      # UI components (HandOverlay, SentenceTranslator, VoiceDesk, etc.)
│   │   ├── hooks/           # useCamera, useMediaPipe, custom hooks
│   │   ├── lib/             # API client, speech synthesis, auto-translate, Supabase
│   │   ├── pages/           # Landing, ConversationStudio, LearnISL, CommunicationHub, etc.)
│   │   ├── styles/          # Tailwind CSS styling and theme definitions
│   │   └── App.tsx          # Application routing and providers
│   └── tests/               # Node test suites
├── docs/                    # Design documentation, screenshots, and upgrade roadmaps
├── docker-compose.yml       # Multi-container orchestration
├── MODEL_CARD.md            # AI model limitations, intended use, and governance
├── PRIVACY.md               # Data privacy principles and user rights
└── README.md                # Project documentation
```

---

## 📜 Limitations & Responsible AI

- **Isolated Sign Recognition**: Current model architecture targets isolated held sign poses. It does not transcribe continuous sign sentences, facial expressions, or complex regional grammar.
- **Prototype Status**: Held-out metrics are calculated on small prototype sets and must be validated with native Deaf signers before deploying in critical safety environments.
- **Assistive Tool**: SignBridge is an assistive aid and is not a certified legal or medical sign-language interpreter replacement.

---

## 📄 License & Attribution

- Built with ❤️ for accessibility and inclusion.
- For third-party licenses, see [THIRD_PARTY_NOTICES.md](file:///Users/premsais/Desktop/final%20sign/signbridge-ai-platform/THIRD_PARTY_NOTICES.md).
