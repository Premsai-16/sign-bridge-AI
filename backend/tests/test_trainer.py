import json
import os
import tempfile
from app.services import PersonalizedTrainer

HELLO = [0.0, 0.0, 0.1, 0.1, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5]
GOODBYE = [0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9, 0.9, 1.0, 1.0]

def make_examples():
    return [
        {"label": "hello", "landmarks": json.dumps(HELLO)},
        {"label": "hello", "landmarks": json.dumps(HELLO)},
        {"label": "hello", "landmarks": json.dumps(HELLO)},
        {"label": "goodbye", "landmarks": json.dumps(GOODBYE)},
        {"label": "goodbye", "landmarks": json.dumps(GOODBYE)},
        {"label": "goodbye", "landmarks": json.dumps(GOODBYE)},
    ]

def test_fit_and_predict():
    trainer = PersonalizedTrainer()
    result = trainer.fit(make_examples())
    assert result["is_ready"] is True
    assert set(result["labels"]) == {"hello", "goodbye"}
    label, conf = trainer.predict(HELLO)
    assert label == "hello"
    assert conf > 0.5

def test_abstain_unknown():
    trainer = PersonalizedTrainer()
    trainer.fit(make_examples())
    midpoint = [0.25, 0.25, 0.35, 0.35, 0.45, 0.45, 0.55, 0.55, 0.65, 0.65, 0.75, 0.75]
    label, conf = trainer.predict(midpoint)
    assert label == "unknown"
    assert conf < 0.2

def test_save_and_load():
    trainer = PersonalizedTrainer()
    trainer.fit(make_examples())
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "model.json")
        trainer.save(path)
        loaded = PersonalizedTrainer()
        loaded.load(path)
        assert set(loaded.labels) == {"hello", "goodbye"}
        label, _ = loaded.predict(HELLO)
        assert label == "hello"

def test_not_ready():
    trainer = PersonalizedTrainer()
    result = trainer.fit([{"label": "x", "landmarks": json.dumps([1.0])}])
    assert result["is_ready"] is False