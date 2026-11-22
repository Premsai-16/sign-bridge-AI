# SignBridge AI Platform

An accessibility-focused web application for Indian Sign Language (ISL) communication workflows, browser speech tools, and local session management.

## Product Goal
SignBridge provides a public conversation screen with camera-based isolated-sign recognition, browser speech captions, and spoken output. Owners can collect consented shared examples and publish a limited prototype model for all visitors. It does not translate continuous ISL sentences or animate sign output.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python + SQLite
- **Recognition status**: Browser hand detection, an optional owner-published shared prototype model, and private held-sign matching are available. No shared labels are bundled. Continuous ISL translation, dynamic signs, and grammar are not supported.

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
# From the repository root: create .env from .env.example and set a private owner username/password.
cp .env.example .env

# Start backend
cd backend
set -a; source ../.env; set +a
uvicorn app.main:app --reload --port 8001

# Start frontend (new terminal)
cd frontend
npm run dev
```

Visit http://localhost:5173. Camera access on phones and other devices requires HTTPS; localhost is the only common exception. For mobile use, deploy the site and API behind HTTPS and set `VITE_API_URL` and `CORS_ORIGINS` to the deployed addresses. In supported production browsers, install SignBridge as an app from the visible **Install app** button or the browser menu. The app shell and sign-detection assets are cached after first use; speech captions and new shared-model updates may require a connection.

### Live recognition and speech

Open the conversation screen and allow camera access. Only labels in the owner's published isolated-sign vocabulary or the visitor's private family vocabulary can be recognized. Recognized labels collect into one editable message; after a short pause, the message is added to the conversation and spoken once when voice is enabled. Edit the draft or use **Send & speak** to take manual control. Use **Caption speech** to turn a partner's spoken replies into text; browser support and recognition quality vary by device and language.

There is no fallback vocabulary. If the owner has not published a model, shared sign recognition stays blank rather than guessing labels. Even with a published model, the prototype recognizes isolated held poses and does not translate ISL grammar or full sign-language sentences.

### Owner training

Configure `ADMIN_USERNAME` and `ADMIN_PASSWORD` on the server before using `/owner/trainer`. The public app has no user sign-in. After explicit signer consent, the owner trainer records a 5-second silent video after a 1-second countdown, stores that clip privately for owner review, and sends derived hand-motion frames for shared training. Delete one sample or a whole label from the owner console; deleting also removes its saved clip. A label can be published after 10 training clips. Separate validation clips from different signers are recommended and reported but do not block publishing. The console keeps up to 20 model versions and supports rollback. Metrics from this small prototype do not guarantee field accuracy. The API stores examples in its configured database, private clips under `OWNER_VIDEO_DIR` (defaults beside the model), and the published model and history under `SHARED_MODEL_PATH` (Docker uses `/data/published-model.json`).

For Docker deployments, set `ADMIN_USERNAME` and a long random `ADMIN_PASSWORD` in the Compose environment. Admin sessions are held in server memory, so use a single API worker unless session storage is moved to a shared secure store.

### Docker

```bash
docker compose up --build
```

The web app is served at http://localhost:5173 and the development API at http://localhost:8001 (proxied through the web app). Set `VITE_API_URL` and `CORS_ORIGINS` when deploying on different hosts.

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
