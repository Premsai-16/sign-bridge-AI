# SignBridge AI Platform

An accessibility-focused web application for Indian Sign Language (ISL) communication workflows, browser speech tools, and local session management.

## Product Goal
SignBridge provides on-device hand detection, experimental recognition for a published 11-sign ISL vocabulary, optional personal held-sign enrollment, typed/spoken conversation tools, and local study tracking. It does not translate continuous ISL sentences or animate sign output.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python + SQLite
- **Recognition status**: Browser hand detection, a limited 11-class isolated-sign model, and consent-based personal held-sign matching are available. Continuous ISL translation, dynamic signs, and grammar are not supported.

## Quick Start

### Prerequisites
- Node.js 22+
- Python 3.11+
- Modern browser with camera access

### Installation

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Development

```bash
# Start backend
cd backend
uvicorn app.main:app --reload --port 8000

# Start frontend (new terminal)
cd frontend
npm run dev
```

Visit http://localhost:5173

### Live recognition and speech

Open **Live Translate**, allow camera access, and use the **11 sign model** for the bundled isolated vocabulary. Hold a sign clearly in view; accepted labels appear in the transcript. **Speak each recognized sign aloud** reads accepted labels using a voice installed on the device. Press **Test voice** once if the browser blocks speech until a user gesture. You can also choose **My vocabulary** and enroll at least five examples for a sign. A single trained label can now be recognized; adding labels improves rejection of other hand shapes.

The bundled model recognizes only `cellphone`, `good`, `hello`, `house`, `I`, `loud`, `quiet`, `red`, `shoes`, `teacher`, and `time`. It produces individual English labels, not full sentence translations. For accurate continuous ISL, this project still needs a signer-diverse consented dataset, a temporal model, and evaluation with Deaf ISL experts.

### Docker

```bash
docker compose up --build
```

The web app is served at http://localhost:5173 and the API at http://localhost:8000. Set `VITE_API_URL` and `CORS_ORIGINS` when deploying on different hosts.

## Project Structure

```
signbridge-ai-platform/
├── frontend/          # React + Vite app
├── backend/           # FastAPI API
├── docs/              # Documentation
└── docker-compose.yml
```

## Six Divisions
1. Sign Intelligence - On-device hand detection, limited published vocabulary, and personal held-sign vocabulary
2. Communication Hub - Text/speech tools
3. AI Avatar Studio - Speech output; signing animation library not included
4. Accessibility Network - Scenario workflows
5. Learning & Community - Local study tracking; shared community service not connected
6. Trust & AI Research - Model cards & governance

## Privacy
- Session notes saved in the browser by default
- Consent-based sample collection
- No raw video/audio stored by default
- Informed consent for landmark samples

## License
Contact: #248, 2nd Main, 5th Cross Road, Ambedkar Nagar, Robertsonpet, KGF 563122
