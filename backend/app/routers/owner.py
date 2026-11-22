import json
import math
import os
import re
import shutil
import uuid
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import UserExample
from .auth import validate_admin_session

router = APIRouter(prefix="/api/v1/owner", tags=["owner trainer"])
FEATURE_COUNT = 126
SEQUENCE_LENGTH = 12
MIN_CAPTURE_FRAMES = 1
MAX_CAPTURE_FRAMES = 60
MIN_TRAIN_EXAMPLES = 10
MIN_VALIDATION_EXAMPLES = 0
MAX_MODEL_VERSIONS = 20
MAX_MATCH_DISTANCE = 0.2
MIN_MARGIN = 0.16
MAX_VIDEO_BYTES = 25 * 1024 * 1024


class ExampleInput(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    frames: list[list[float]] = Field(min_length=MIN_CAPTURE_FRAMES, max_length=MAX_CAPTURE_FRAMES)
    consented: bool
    dataset_split: Literal["train", "validation"] = "train"
    participant_code: str = Field(min_length=2, max_length=24, pattern=r"^[A-Za-z0-9_-]+$")


class RenameInput(BaseModel):
    new_label: str = Field(min_length=1, max_length=40)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def model_path() -> Path:
    configured = os.getenv("SHARED_MODEL_PATH")
    return Path(configured) if configured else Path(__file__).resolve().parents[2] / "data" / "published-model.json"


def versions_path() -> Path:
    return model_path().parent / "model-versions"


def clips_path() -> Path:
    configured = os.getenv("OWNER_VIDEO_DIR")
    return Path(configured) if configured else model_path().parent / "training-videos"


def normalize_sequence(value: object) -> list[list[float]] | None:
    if not isinstance(value, list):
        return None
    # Existing still-pose samples stay usable as repeated static frames.
    if len(value) == FEATURE_COUNT and all(isinstance(item, (int, float)) for item in value):
        if not all(math.isfinite(item) and -1.001 <= item <= 1.001 for item in value):
            return None
        source = [[float(item) for item in value]] * SEQUENCE_LENGTH
    else:
        if not MIN_CAPTURE_FRAMES <= len(value) <= MAX_CAPTURE_FRAMES:
            return None
        if any(not isinstance(frame, list) or len(frame) != FEATURE_COUNT for frame in value):
            return None
        if any(not isinstance(item, (int, float)) or not math.isfinite(item) or not -1.001 <= item <= 1.001 for frame in value for item in frame):
            return None
        source = [[float(item) for item in frame] for frame in value]
    if len(source) == SEQUENCE_LENGTH:
        return source
    result = []
    for target_index in range(SEQUENCE_LENGTH):
        position = target_index * (len(source) - 1) / (SEQUENCE_LENGTH - 1)
        start = int(position)
        end = min(start + 1, len(source) - 1)
        fraction = position - start
        result.append([source[start][feature] * (1 - fraction) + source[end][feature] * fraction for feature in range(FEATURE_COUNT)])
    return result


def sequence_distance(first: list[list[float]], second: list[list[float]]) -> float:
    return sum(
        math.sqrt(sum((value - target[index]) ** 2 for index, value in enumerate(frame)) / FEATURE_COUNT)
        for frame, target in zip(first, second)
    ) / SEQUENCE_LENGTH


def classify(sequence: list[list[float]], templates: dict[str, list[list[list[float]]]]) -> str:
    ranked = []
    for label, examples in templates.items():
        if examples:
            nearest = sorted(sequence_distance(sequence, template) for template in examples)[:3]
            ranked.append((sum(nearest) / len(nearest), label))
    ranked.sort()
    if not ranked or ranked[0][0] > MAX_MATCH_DISTANCE:
        return "unknown"
    margin = max(0.0, 1.0 - ranked[0][0] / max(ranked[1][0], 1e-6)) if len(ranked) > 1 else 1.0
    if len(ranked) > 1 and margin < MIN_MARGIN:
        return "unknown"
    return ranked[0][1]


@router.get("/examples")
async def list_examples(_: str = Depends(validate_admin_session), db: Session = Depends(get_db)):
    examples = db.query(UserExample).order_by(UserExample.created_at.asc(), UserExample.id.asc()).all()
    return [{
        "id": item.id,
        "label": item.label,
        "created_at": item.created_at,
        "consented": item.consented,
        "dataset_split": item.dataset_split,
        "participant_code": item.participant_code,
        "num_frames": item.num_frames,
        "has_video": bool(item.clip_path and Path(item.clip_path).is_file()),
    } for item in examples]


@router.post("/examples")
async def add_example(
    label: str = Form(...),
    frames_json: str = Form(...),
    consented: bool = Form(...),
    dataset_split: Literal["train", "validation"] = Form("train"),
    participant_code: str = Form(...),
    video: UploadFile = File(...),
    _: str = Depends(validate_admin_session),
    db: Session = Depends(get_db),
):
    try:
        decoded_frames = json.loads(frames_json)
        example = ExampleInput(label=label, frames=decoded_frames, consented=consented, dataset_split=dataset_split, participant_code=participant_code)
    except (json.JSONDecodeError, ValidationError) as cause:
        raise HTTPException(status_code=400, detail="The captured hand-motion sample is invalid. Record it again.") from cause
    label = " ".join(example.label.split()).casefold()
    if not example.consented:
        raise HTTPException(status_code=400, detail="Confirm the signer’s consent before saving this example.")
    if any(len(frame) != FEATURE_COUNT for frame in example.frames):
        raise HTTPException(status_code=400, detail=f"Each recorded frame must contain exactly {FEATURE_COUNT} hand-landmark values.")
    if any(not math.isfinite(value) or not -1.001 <= value <= 1.001 for frame in example.frames for value in frame):
        raise HTTPException(status_code=400, detail="Recorded hand landmarks are outside the accepted range.")
    content_type = (video.content_type or "").split(";")[0].lower()
    extension = {"video/webm": ".webm", "video/mp4": ".mp4", "video/ogg": ".ogv"}.get(content_type)
    if not extension:
        raise HTTPException(status_code=415, detail="This browser produced an unsupported video format. Try a current browser and record again.")
    clip_data = await video.read(MAX_VIDEO_BYTES + 1)
    if len(clip_data) < 1024 or len(clip_data) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="The video clip is empty or too large. Keep it under 25 MB and record again.")
    clip_folder = clips_path()
    clip_folder.mkdir(parents=True, exist_ok=True)
    clip_file = clip_folder / f"{uuid.uuid4().hex}{extension}"
    clip_file.write_bytes(clip_data)
    entry = UserExample(
        label=label,
        landmarks=json.dumps(example.frames),
        num_frames=len(example.frames),
        consented=True,
        dataset_split=example.dataset_split,
        participant_code=example.participant_code,
        clip_path=str(clip_file),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "label": entry.label, "created_at": entry.created_at, "consented": entry.consented, "dataset_split": entry.dataset_split, "participant_code": entry.participant_code, "num_frames": entry.num_frames, "has_video": True}


@router.get("/examples/{example_id}/video")
async def get_example_video(example_id: int, _: str = Depends(validate_admin_session), db: Session = Depends(get_db)):
    entry = db.get(UserExample, example_id)
    if entry is None or not entry.clip_path:
        raise HTTPException(status_code=404, detail="No video is saved for this sample.")
    clip = Path(entry.clip_path).resolve()
    root = clips_path().resolve()
    if root not in clip.parents or not clip.is_file():
        raise HTTPException(status_code=404, detail="The saved sample video is unavailable.")
    return FileResponse(clip, media_type="video/mp4" if clip.suffix == ".mp4" else "video/webm", content_disposition_type="inline")


@router.delete("/examples/{example_id}")
async def delete_example(example_id: int, _: str = Depends(validate_admin_session), db: Session = Depends(get_db)):
    entry = db.get(UserExample, example_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Training example not found")
    if entry.clip_path:
        clip = Path(entry.clip_path).resolve()
        root = clips_path().resolve()
        if root in clip.parents:
            clip.unlink(missing_ok=True)
    db.delete(entry)
    db.commit()
    return {"deleted": example_id}


@router.delete("/labels/{label}")
async def delete_label(label: str, _: str = Depends(validate_admin_session), db: Session = Depends(get_db)):
    entries = db.query(UserExample).filter(UserExample.label == label.casefold()).all()
    count = len(entries)
    for entry in entries:
        if entry.clip_path:
            clip = Path(entry.clip_path).resolve()
            if clips_path().resolve() in clip.parents:
                clip.unlink(missing_ok=True)
        db.delete(entry)
    db.commit()
    if not count:
        raise HTTPException(status_code=404, detail="Vocabulary label not found")
    return {"label": label.casefold(), "deleted_examples": count}


@router.put("/labels/{label}")
async def rename_label(label: str, rename: RenameInput, _: str = Depends(validate_admin_session), db: Session = Depends(get_db)):
    cleaned = " ".join(rename.new_label.split()).casefold()
    if db.query(UserExample).filter(UserExample.label == cleaned).first() and cleaned != label.casefold():
        raise HTTPException(status_code=409, detail="That vocabulary label already exists.")
    count = db.query(UserExample).filter(UserExample.label == label.casefold()).update({UserExample.label: cleaned}, synchronize_session=False)
    db.commit()
    if not count:
        raise HTTPException(status_code=404, detail="Vocabulary label not found")
    return {"label": cleaned, "updated_examples": count}


@router.post("/publish")
async def publish_model(_: str = Depends(validate_admin_session), db: Session = Depends(get_db), dry_run: bool = False):
    examples = db.query(UserExample).filter(UserExample.consented.is_(True)).order_by(UserExample.id.asc()).all()
    grouped: dict[str, dict[str, list[tuple[list[list[float]], str]]]] = defaultdict(lambda: {"train": [], "validation": []})
    for example in examples:
        try:
            vector = json.loads(example.landmarks)
        except (TypeError, json.JSONDecodeError):
            continue
        sequence = normalize_sequence(vector)
        if sequence is None:
            continue
        split = example.dataset_split if example.dataset_split in ("train", "validation") else "train"
        grouped[example.label][split].append((sequence, example.participant_code))

    if not grouped:
        raise HTTPException(status_code=400, detail="No valid consented examples are available to train a model.")

    all_train_codes: set[str] = set()
    all_validation_codes: set[str] = set()
    for label, splits in grouped.items():
        train_codes = {code for _, code in splits["train"]}
        validation_codes = {code for _, code in splits["validation"]}
        if len(splits["train"]) < MIN_TRAIN_EXAMPLES:
            raise HTTPException(status_code=400, detail=f"“{label}” needs at least {MIN_TRAIN_EXAMPLES} training video samples before publishing.")
        if not train_codes:
            raise HTTPException(status_code=400, detail=f"“{label}” needs at least one consenting signer before publishing.")
        all_train_codes.update(train_codes)
        all_validation_codes.update(validation_codes)
    overlap = all_train_codes & all_validation_codes
    if overlap:
        raise HTTPException(status_code=400, detail="Keep validation signer codes separate from all training signer codes to avoid inflated evaluation results.")

    templates = {label: [sequence for sequence, _ in splits["train"]] for label, splits in grouped.items()}
    centroids = {
        label: [sum(sequence[frame][feature] for sequence in templates[label] for frame in range(SEQUENCE_LENGTH)) / (len(templates[label]) * SEQUENCE_LENGTH) for feature in range(FEATURE_COUNT)]
        for label in templates
    }
    per_label: dict[str, dict[str, int]] = {label: {"correct": 0, "total": len(splits["validation"]), "recognized": 0} for label, splits in grouped.items()}
    confusion: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    correct = total = recognized = 0
    for expected_label, splits in grouped.items():
        for vector, _ in splits["validation"]:
            predicted = classify(vector, templates)
            confusion[expected_label][predicted] += 1
            total += 1
            if predicted != "unknown":
                recognized += 1
                per_label[expected_label]["recognized"] += 1
            if predicted == expected_label:
                correct += 1
                per_label[expected_label]["correct"] += 1
    metrics = {
        "confusion": dict(confusion),
        "validation_examples": total,
        "validation_signers": len(all_validation_codes),
        "accuracy": round(correct / total, 4) if total else 0.0,
        "coverage": round(recognized / total, 4) if total else 0.0,
        "per_label": {
            label: {
                "examples": value["total"],
                "accuracy": round(value["correct"] / value["total"], 4) if value["total"] else 0.0,
                "coverage": round(value["recognized"] / value["total"], 4) if value["total"] else 0.0,
            }
            for label, value in per_label.items()
        },
    }
    version = datetime.now(UTC).strftime("%Y.%m.%d.%H%M%S.%f")
    payload = {
        "format": 1,
        "version": version,
        "created_at": datetime.now(UTC).isoformat(),
        "labels": sorted(centroids),
        "examples_per_label": {label: {"train": len(splits["train"]), "validation": len(splits["validation"])} for label, splits in grouped.items()},
        "centroids": centroids,
        "templates": templates,
        "validation_metrics": metrics,
        "scope": "experimental_isolated_signs",
    }
    if dry_run:
        return {"published": False, "labels": payload["labels"], "validation_metrics": metrics}
    destination = model_path()
    history = versions_path()
    destination.parent.mkdir(parents=True, exist_ok=True)
    history.mkdir(parents=True, exist_ok=True)
    version_file = history / f"{version}.json"
    version_file.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    temporary.replace(destination)
    old_versions = sorted(history.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True)
    for old in old_versions[MAX_MODEL_VERSIONS:]:
        old.unlink(missing_ok=True)
    return {"published": True, "version": version, "labels": payload["labels"], "examples_per_label": payload["examples_per_label"], "validation_metrics": metrics}


@router.get("/model")
async def get_published_model():
    path = model_path()
    if not path.is_file():
        return {"published": False}
    try:
        return json.loads(path.read_text(encoding="utf-8")) | {"published": True}
    except (OSError, json.JSONDecodeError):
        raise HTTPException(status_code=503, detail="Published model could not be loaded")


@router.get("/versions")
async def list_versions(_: str = Depends(validate_admin_session)):
    active_path = model_path()
    active = {}
    if active_path.is_file():
        try:
            active = json.loads(active_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    versions = []
    for path in sorted(versions_path().glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
        try:
            model = json.loads(path.read_text(encoding="utf-8"))
            versions.append({"version": model.get("version", path.stem), "created_at": model.get("created_at"), "labels": model.get("labels", []), "is_active": model.get("version") == active.get("version"), "validation_metrics": model.get("validation_metrics")})
        except (OSError, json.JSONDecodeError):
            continue
    return versions


@router.post("/versions/{version}/activate")
async def activate_version(version: str, _: str = Depends(validate_admin_session)):
    if not re.fullmatch(r"[0-9.]+", version):
        raise HTTPException(status_code=400, detail="Invalid model version")
    source = versions_path() / f"{version}.json"
    if not source.is_file():
        raise HTTPException(status_code=404, detail="Model version is no longer available")
    destination = model_path()
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    shutil.copyfile(source, temporary)
    temporary.replace(destination)
    return {"activated": version}


class TranslationInput(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    language: Literal["en-IN", "kn-IN", "ta-IN", "te-IN", "hi-IN"]
    text: str = Field(min_length=1, max_length=500)


def translation_path() -> Path:
    return model_path().parent / "translations.json"


@router.get("/translations")
async def get_translations():
    path = translation_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as cause:
        raise HTTPException(status_code=503, detail="Translations could not be loaded.") from cause


@router.put("/translations")
async def save_translation(value: TranslationInput, _: str = Depends(validate_admin_session)):
    label = " ".join(value.label.split()).casefold()
    translated = value.text.strip()
    if not label or not translated:
        raise HTTPException(status_code=400, detail="Enter both a phrase and its translation.")
    data = await get_translations()
    data.setdefault(label, {})[value.language] = translated
    path = translation_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)
    return data
