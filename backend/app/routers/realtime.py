import json
from datetime import UTC, datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .auth import active_sessions

router = APIRouter(prefix="/api/v1/realtime", tags=["realtime"])
connected_sessions: dict[str, dict] = {}


class ConnectionManager:
    async def connect(self, websocket: WebSocket, session_id: str, username: str) -> None:
        await websocket.accept()
        connected_sessions[session_id] = {
            "username": username,
            "connected_at": datetime.now(UTC).isoformat(),
            "websocket": websocket,
        }

    def disconnect(self, websocket: WebSocket, session_id: str) -> None:
        connection = connected_sessions.get(session_id)
        if connection and connection.get("websocket") is websocket:
            connected_sessions.pop(session_id, None)

    async def send_to_session(self, message: dict, session_id: str) -> None:
        connection = connected_sessions.get(session_id)
        websocket = connection.get("websocket") if connection else None
        if websocket:
            try:
                await websocket.send_json(message)
            except (RuntimeError, WebSocketDisconnect):
                self.disconnect(websocket, session_id)


manager = ConnectionManager()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str | None = None):
    session = active_sessions.get(token or "")
    if not session or datetime.now(UTC) >= session["expires_at"]:
        if token:
            active_sessions.pop(token, None)
        await websocket.close(code=1008, reason="Sign in with a valid session first.")
        return

    await manager.connect(websocket, session_id, session["username"])
    try:
        while True:
            try:
                message = json.loads(await websocket.receive_text())
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Send a valid JSON message."})
                continue

            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(UTC).isoformat()})
            elif message.get("type") == "sign_landmarks":
                await handle_sign_landmarks(message, session_id)
            else:
                await websocket.send_json({"type": "error", "message": "Unsupported realtime message type."})
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)


async def handle_sign_landmarks(message: dict, session_id: str) -> None:
    landmarks = message.get("landmarks")
    if not isinstance(landmarks, list) or not landmarks or any(
        not isinstance(value, (int, float)) or isinstance(value, bool) for value in landmarks
    ):
        await manager.send_to_session({"type": "error", "message": "Landmarks must be a non-empty numeric array."}, session_id)
        return

    # Classification runs in the browser so raw frames and landmarks stay on-device.
    # Never manufacture a translation from arbitrary landmark values here.
    await manager.send_to_session({
        "type": "recognition_unavailable",
        "message": "Use the browser's on-device model for supported isolated signs. This API does not translate landmark streams.",
        "landmarks_received": len(landmarks),
    }, session_id)


@router.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    connection = connected_sessions.get(session_id)
    if connection:
        return {
            "session_id": session_id,
            "status": "active",
            "username": connection["username"],
            "connected_at": connection["connected_at"],
        }
    return {"session_id": session_id, "status": "not_found"}
