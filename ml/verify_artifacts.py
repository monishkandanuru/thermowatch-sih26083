"""Offline integrity checks for the exported ThermoWatch ML evidence."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ARTIFACTS = ROOT / "artifacts"


def read(name: str):
    return json.loads((ARTIFACTS / name).read_text())


def main() -> None:
    model = read("heat-risk-model.json")
    report = read("validation-report.json")
    replay = read("replay-cases.json")
    manifest = read("data-manifest.json")

    canonical = json.dumps(model, sort_keys=True, separators=(",", ":")).encode()
    model_sha = hashlib.sha256(canonical).hexdigest()
    assert model_sha == report["model_sha256"] == manifest["model_sha256"]
    assert len(model["features"]) == len(model["scaler"]["mean"])
    assert len(model["features"]) == len(model["scaler"]["scale"])
    assert len(model["coefficients"]) == len(model["classes"]) == 5
    assert all(len(row) == len(model["features"]) for row in model["coefficients"])

    numeric_values = [
        *model["scaler"]["mean"],
        *model["scaler"]["scale"],
        *model["intercepts"],
        *(value for row in model["coefficients"] for value in row),
    ]
    assert all(math.isfinite(value) for value in numeric_values)
    assert all(value > 0 for value in model["scaler"]["scale"])

    matrix_total = sum(sum(row) for row in report["confusion_matrix"])
    assert matrix_total == report["test_samples"] == manifest["rows"]["test"]
    diagonal = sum(
        report["confusion_matrix"][index][index]
        for index in range(len(report["labels"]))
    )
    assert round(diagonal / matrix_total * 100, 1) == report["accuracy_pct"]
    assert manifest["rows"]["total"] == (
        manifest["rows"]["train"]
        + manifest["rows"]["calibration"]
        + manifest["rows"]["test"]
    )

    assert len(replay) >= len(manifest["locations"]) * 3
    assert len({case["id"] for case in replay}) == len(replay)
    districts = {item["district"] for item in manifest["locations"]}
    assert {case["district"] for case in replay} == districts
    for case in replay:
        probabilities = case["prediction"]["probabilities"]
        assert set(probabilities) == set(model["classes"])
        assert abs(sum(probabilities.values()) - 100) <= 0.3
        expected_correct = (
            case["observed"]["risk"] == case["prediction"]["risk"]
        )
        assert case["prediction"]["correct"] == expected_correct
        assert 0 <= case["prediction"]["confidence_pct"] <= 100
        assert 0 <= case["prediction"]["high_risk_probability_pct"] <= 100

    print(
        json.dumps(
            {
                "status": "verified",
                "model_sha256": model_sha,
                "test_samples": report["test_samples"],
                "replay_cases": len(replay),
                "districts": len(districts),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
