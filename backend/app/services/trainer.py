import json
import math
import os
from collections import Counter
from pathlib import Path
from typing import Any

class PersonalizedTrainer:
    """Builds a nearest-centroid classifier from user-consented landmark examples."""

    def __init__(self, min_examples: int = 5, abstain_threshold: float = 0.75):
        self.min_examples = min_examples
        self.abstain_threshold = abstain_threshold
        self.centroids: dict[str, list[float]] = {}
        self.labels: list[str] = []
        self.model_version = "0.1.0"

    def _normalize(self, landmarks: list[float]) -> list[float]:
        """Landmarks are already normalized by the detector; return as-is."""
        return list(landmarks)

    def _align(self, seq_a: list[float], seq_b: list[float]) -> float:
        """Dynamic time warping distance between two landmark sequences."""
        n, m = len(seq_a), len(seq_b)
        if n == 0 or m == 0:
            return float("inf")
        dp = [[0.0] * (m + 1) for _ in range(n + 1)]
        for i in range(n + 1):
            dp[i][0] = float("inf")
        for j in range(m + 1):
            dp[0][j] = float("inf")
        dp[0][0] = 0.0
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                cost = abs(seq_a[i - 1] - seq_b[j - 1])
                dp[i][j] = cost + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        return dp[n][m] / max(n, m)

    def fit(self, examples: list[dict[str, Any]]) -> dict[str, Any]:
        """Train centroids from example records."""
        by_label: dict[str, list[list[float]]] = {}
        for ex in examples:
            landmarks = json.loads(ex.get("landmarks", "[]"))
            normalized = self._normalize(landmarks)
            by_label.setdefault(ex["label"], []).append(normalized)

        self.labels = sorted(by_label.keys())
        self.centroids = {}
        for label, vectors in by_label.items():
            if not vectors:
                continue
            dim = len(vectors[0])
            centroid = [sum(v[i] for v in vectors) / len(vectors) for i in range(dim)]
            self.centroids[label] = centroid

        balance = {label: len(vectors) for label, vectors in by_label.items()}
        return {
            "labels": self.labels,
            "class_balance": balance,
            "total_examples": len(examples),
            "is_ready": len(examples) >= self.min_examples and len(self.labels) >= 1,
        }

    def predict(self, landmarks: list[float]) -> tuple[str, float]:
        """Return (label, confidence) or ('unknown', confidence) if abstaining."""
        if not self.centroids:
            return "unknown", 0.0
        normalized = self._normalize(landmarks)
        distances = sorted(
            (self._align(normalized, centroid), label)
            for label, centroid in self.centroids.items()
        )
        best_score, best_label = distances[0]
        second_score = distances[1][0] if len(distances) > 1 else best_score

        if second_score < 1e-9:
            confidence = 1.0
        else:
            confidence = 1.0 - (best_score / second_score)

        if confidence < 0.2:
            return "unknown", round(max(0.0, confidence), 3)
        return best_label, round(confidence, 3)

    def save(self, path: str) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump({
                "centroids": self.centroids,
                "labels": self.labels,
                "model_version": self.model_version,
                "min_examples": self.min_examples,
                "abstain_threshold": self.abstain_threshold,
            }, f, indent=2)

    def load(self, path: str) -> None:
        with open(path) as f:
            data = json.load(f)
        self.centroids = data.get("centroids", {})
        self.labels = data.get("labels", [])
        self.model_version = data.get("model_version", "0.1.0")