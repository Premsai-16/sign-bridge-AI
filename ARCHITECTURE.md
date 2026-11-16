# Architecture Overview

## Directory Structure
```
signbridge-ai-platform/
├── docker-compose.yml      # Local development services
├── dockerfile              # Production build for backend
├── frontend/               # React + TypeScript application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Application pages (6 divisions + landing)
│   │   ├── App.tsx         # Main routing
│   │   └── main.tsx        # Entry point
│   └── vite.config.ts
├── backend/                # FastAPI Python API
│   ├── app/
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── routers/        # API route handlers
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic (trainer, etc.)
│   │   ├── database.py     # Database configuration
│   │   └── main.py         # FastAPI app entry
│   ├── init_db.py          # Database initialization
│   └── requirements.txt
├── tests/                  # Python unit/API tests
├── MODEL_CARD.md
├── PRIVACY.md
├── README.md
└── .env.example
```

## Data Flow

1. **User Authentication** (Planned)
   - Session-based authentication
   - User preferences stored locally

2. **Enrollment Flow**
   - User records sign examples via camera
   - Examples stored with explicit consent
   - Trainer builds personalized classifier
   - Model saved locally

3. **Recognition Flow**
   - Camera feed analyzed in overlapping windows
   - Landmark detection → normalized → classifier
   - Temporal debounce suppresses repeats
   - Stable signs added to transcript
   - Automatic speech output via Web Speech API

## Backend API Routes
- `GET /health` - Health check
- `GET /api/v1/models` - Available models
- `POST /api/v1/enrollment/` - Add sign example
- `GET /api/v1/enrollment/status` - Training status
- `POST /api/v1/transcripts/` - Save transcript
- `GET /api/v1/transcripts/` - List transcripts
- `POST /api/v1/consent/` - Record consent

## Frontend Components
- `Layout` - Navigation and footer
- `Button` - Accessible button with variants
- `SignCamera` - Camera preview with controls
- `useCamera` - MediaDevices hook
- `useSignRecognition` - Recognition state machine
- 6 Division pages + NotFound

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic
- **Deployment**: Docker Compose