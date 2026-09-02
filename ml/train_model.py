"""Train and export ThermoWatch's reproducible heat-risk classifier.

Data source: Open-Meteo ERA5-Seamless historical hourly weather.
Labels: transparent HTSI-derived proxy thermal-risk classes.
Split: 2022-2023 train, 2024 calibration, 2025 final chronological test.

The runtime consumes the exported JSON directly; Python is not required in production.
"""

from __future__ import annotations

import gzip
import hashlib
import json
import math
import time
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / "data-cache"
ARTIFACT_DIR = ROOT / "artifacts"
SOURCE_START = "2022-01-01"
SOURCE_END = "2025-12-31"
TRAIN_END = "2023-12-31T23:59"
CALIBRATION_END = "2024-12-31T23:59"
RANDOM_SEED = 26083

RISK_CLASSES = ["Low", "Moderate", "High", "Extreme", "Emergency"]
FEATURES = [
    "temperature_c",
    "humidity_pct",
    "wind_speed_ms",
    "shortwave_radiation_wm2",
    "uv_index_proxy",
    "heat_index_c",
    "wbgt_c",
    "pet_c",
    "hour_sin",
    "hour_cos",
    "day_sin",
    "day_cos",
    "latitude",
    "longitude",
]
FEATURE_LABELS = {
    "temperature_c": "Temperature",
    "humidity_pct": "Relative humidity",
    "wind_speed_ms": "Wind speed",
    "shortwave_radiation_wm2": "Solar radiation",
    "uv_index_proxy": "UV proxy",
    "heat_index_c": "Heat Index",
    "wbgt_c": "WBGT",
    "pet_c": "PET",
    "hour_sin": "Time of day (sin)",
    "hour_cos": "Time of day (cos)",
    "day_sin": "Season (sin)",
    "day_cos": "Season (cos)",
    "latitude": "Latitude",
    "longitude": "Longitude",
}

CITIES = [
    ("Delhi", 28.6139, 77.2090),
    ("Jaipur", 26.9124, 75.7873),
    ("Ahmedabad", 23.0225, 72.5714),
    ("Nagpur", 21.1458, 79.0882),
    ("Hyderabad", 17.3850, 78.4867),
    ("Patna", 25.5941, 85.1376),
    ("Lucknow", 26.8467, 80.9462),
    ("Bhopal", 23.2599, 77.4126),
    ("Bhubaneswar", 20.2961, 85.8245),
    ("Chandigarh", 30.7333, 76.7794),
    ("Bikaner", 28.0229, 73.3119),
    ("Jodhpur", 26.2389, 73.0243),
    ("Varanasi", 25.3176, 82.9739),
    ("Prayagraj", 25.4358, 81.8463),
    ("Gwalior", 26.2183, 78.1828),
    ("Aurangabad", 19.8762, 75.3433),
    ("Nanded", 19.1383, 77.3210),
    ("Raipur", 21.2514, 81.6296),
    ("Ranchi", 23.3441, 85.3096),
    ("Gaya", 24.7914, 85.0002),
]


def heat_index(temp_c: np.ndarray, humidity: np.ndarray) -> np.ndarray:
    temp_f = temp_c * 9 / 5 + 32
    r = humidity
    result_f = (
        -42.379
        + 2.04901523 * temp_f
        + 10.14333127 * r
        - 0.22475541 * temp_f * r
        - 0.00683783 * temp_f**2
        - 0.05481717 * r**2
        + 0.00122874 * temp_f**2 * r
        + 0.00085282 * temp_f * r**2
        - 0.00000199 * temp_f**2 * r**2
    )
    return (result_f - 32) * 5 / 9


def wet_bulb(temp_c: np.ndarray, humidity: np.ndarray) -> np.ndarray:
    return (
        temp_c * np.arctan(0.151977 * np.sqrt(humidity + 8.313659))
        + np.arctan(temp_c + humidity)
        - np.arctan(humidity - 1.676331)
        + 0.00391838 * humidity**1.5 * np.arctan(0.023101 * humidity)
        - 4.686035
    )


def thermal_metrics(
    temp_c: np.ndarray,
    humidity: np.ndarray,
    wind_ms: np.ndarray,
    solar: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    uv = np.clip(solar / 95.0, 0, 11)
    wbgt = 0.7 * wet_bulb(temp_c, humidity) + 0.2 * (temp_c + solar / 180) + 0.1 * temp_c
    hi = heat_index(temp_c, humidity)
    pet = temp_c + humidity * 0.035 + solar / 240 - wind_ms * 0.7
    thermal = np.clip((wbgt - 18) * 5.25, 0, 100)
    humidity_stress = np.clip((humidity - 35) * 0.34, 0, 18)
    radiant_stress = np.clip(solar / 75, 0, 14)
    uv_stress = np.clip(uv * 0.95, 0, 10)
    air_stress = np.clip((85 - 40) / 16, 0, 8)
    wind_relief = np.minimum(9, wind_ms * 1.7)
    htsi = np.clip(
        thermal * 0.66 + humidity_stress + radiant_stress + uv_stress + air_stress - wind_relief,
        0,
        100,
    )
    return uv, hi, wbgt, pet, htsi


def risk_index(scores: np.ndarray) -> np.ndarray:
    return np.select(
        [scores >= 85, scores >= 70, scores >= 55, scores >= 38],
        [4, 3, 2, 1],
        default=0,
    ).astype(int)


def fetch_city(name: str, latitude: float, longitude: float) -> dict:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / f"{name.lower().replace(' ', '-')}-{SOURCE_START}-{SOURCE_END}.json.gz"
    if cache_path.exists():
        with gzip.open(cache_path, "rt", encoding="utf-8") as stream:
            return json.load(stream)

    params = urllib.parse.urlencode(
        {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": SOURCE_START,
            "end_date": SOURCE_END,
            "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation",
            "timezone": "Asia/Kolkata",
            "wind_speed_unit": "ms",
            "models": "era5_seamless",
        }
    )
    request = urllib.request.Request(
        f"https://archive-api.open-meteo.com/v1/archive?{params}",
        headers={"User-Agent": "ThermoWatch-SIH26083-Training/4.0"},
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.load(response)
            with gzip.open(cache_path, "wt", encoding="utf-8") as stream:
                json.dump(payload, stream, separators=(",", ":"))
            return payload
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2**attempt)
    raise RuntimeError("unreachable")


def city_frame(name: str, latitude: float, longitude: float, payload: dict) -> pd.DataFrame:
    hourly = payload["hourly"]
    frame = pd.DataFrame(
        {
            "timestamp": pd.to_datetime(hourly["time"]),
            "temperature_c": hourly["temperature_2m"],
            "humidity_pct": hourly["relative_humidity_2m"],
            "wind_speed_ms": hourly["wind_speed_10m"],
            "shortwave_radiation_wm2": hourly["shortwave_radiation"],
        }
    )
    frame["district"] = name
    frame["latitude"] = latitude
    frame["longitude"] = longitude
    frame = frame[frame["timestamp"].dt.hour % 3 == 0].copy()
    numeric = [
        "temperature_c",
        "humidity_pct",
        "wind_speed_ms",
        "shortwave_radiation_wm2",
    ]
    frame[numeric] = frame[numeric].apply(pd.to_numeric, errors="coerce")
    frame = frame.dropna(subset=numeric)
    frame = frame[
        frame["temperature_c"].between(-10, 55)
        & frame["humidity_pct"].between(0, 100)
        & frame["wind_speed_ms"].between(0, 45)
        & frame["shortwave_radiation_wm2"].between(0, 1400)
    ].copy()

    uv, hi, wbgt, pet, htsi = thermal_metrics(
        frame["temperature_c"].to_numpy(float),
        frame["humidity_pct"].to_numpy(float),
        frame["wind_speed_ms"].to_numpy(float),
        frame["shortwave_radiation_wm2"].to_numpy(float),
    )
    frame["uv_index_proxy"] = uv
    frame["heat_index_c"] = hi
    frame["wbgt_c"] = wbgt
    frame["pet_c"] = pet
    frame["htsi"] = htsi
    frame["risk_index"] = risk_index(htsi)
    hour_angle = 2 * math.pi * frame["timestamp"].dt.hour / 24
    day_angle = 2 * math.pi * frame["timestamp"].dt.dayofyear / 365.25
    frame["hour_sin"] = np.sin(hour_angle)
    frame["hour_cos"] = np.cos(hour_angle)
    frame["day_sin"] = np.sin(day_angle)
    frame["day_cos"] = np.cos(day_angle)
    return frame


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)


def train_softmax(x: np.ndarray, y: np.ndarray, classes: int) -> tuple[np.ndarray, np.ndarray, list[float]]:
    rng = np.random.default_rng(RANDOM_SEED)
    n, p = x.shape
    weights = np.zeros((classes, p), dtype=np.float64)
    intercept = np.zeros(classes, dtype=np.float64)
    counts = np.bincount(y, minlength=classes)
    class_weights = n / (classes * np.maximum(counts, 1))
    learning_rate = 0.025
    batch_size = 4096
    l2 = 0.0015
    m_w = np.zeros_like(weights)
    v_w = np.zeros_like(weights)
    m_b = np.zeros_like(intercept)
    v_b = np.zeros_like(intercept)
    losses: list[float] = []
    step = 0

    for epoch in range(48):
        order = rng.permutation(n)
        for start in range(0, n, batch_size):
            step += 1
            idx = order[start : start + batch_size]
            xb, yb = x[idx], y[idx]
            probabilities = softmax(xb @ weights.T + intercept)
            target = np.zeros_like(probabilities)
            target[np.arange(len(yb)), yb] = 1
            sample_weights = class_weights[yb]
            error = (probabilities - target) * sample_weights[:, None]
            normalizer = sample_weights.sum()
            grad_w = error.T @ xb / normalizer + l2 * weights
            grad_b = error.sum(axis=0) / normalizer

            m_w = 0.9 * m_w + 0.1 * grad_w
            v_w = 0.999 * v_w + 0.001 * grad_w**2
            m_b = 0.9 * m_b + 0.1 * grad_b
            v_b = 0.999 * v_b + 0.001 * grad_b**2
            m_w_hat = m_w / (1 - 0.9**step)
            v_w_hat = v_w / (1 - 0.999**step)
            m_b_hat = m_b / (1 - 0.9**step)
            v_b_hat = v_b / (1 - 0.999**step)
            weights -= learning_rate * m_w_hat / (np.sqrt(v_w_hat) + 1e-8)
            intercept -= learning_rate * m_b_hat / (np.sqrt(v_b_hat) + 1e-8)

        train_prob = softmax(x @ weights.T + intercept)
        weighted_nll = -np.average(
            np.log(np.clip(train_prob[np.arange(n), y], 1e-12, 1)),
            weights=class_weights[y],
        )
        losses.append(float(weighted_nll))
        if epoch > 10 and abs(losses[-1] - losses[-2]) < 2e-6:
            break
    return weights, intercept, losses


def best_temperature(logits: np.ndarray, y: np.ndarray) -> float:
    candidates = np.linspace(0.55, 2.5, 196)
    losses = []
    for value in candidates:
        prob = softmax(logits / value)
        losses.append(-np.log(np.clip(prob[np.arange(len(y)), y], 1e-12, 1)).mean())
    return float(candidates[int(np.argmin(losses))])


def prediction_metrics(y: np.ndarray, probabilities: np.ndarray) -> dict:
    predicted = probabilities.argmax(axis=1)
    matrix = np.zeros((len(RISK_CLASSES), len(RISK_CLASSES)), dtype=int)
    for actual, guess in zip(y, predicted):
        matrix[actual, guess] += 1
    per_class = {}
    precision_values, recall_values, f1_values = [], [], []
    for index, label in enumerate(RISK_CLASSES):
        tp = matrix[index, index]
        fp = matrix[:, index].sum() - tp
        fn = matrix[index, :].sum() - tp
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        support = int(matrix[index, :].sum())
        per_class[label] = {
            "precision_pct": round(precision * 100, 1),
            "recall_pct": round(recall * 100, 1),
            "f1_pct": round(f1 * 100, 1),
            "support": support,
        }
        if support:
            precision_values.append(precision)
            recall_values.append(recall)
            f1_values.append(f1)
    high_actual = y >= 2
    high_predicted = predicted >= 2
    false_alarms = int((~high_actual & high_predicted).sum())
    missed_events = int((high_actual & ~high_predicted).sum())
    one_hot = np.eye(len(RISK_CLASSES))[y]
    return {
        "accuracy_pct": round(float((predicted == y).mean() * 100), 1),
        "precision_pct": round(float(np.mean(precision_values) * 100), 1),
        "recall_pct": round(float(np.mean(recall_values) * 100), 1),
        "macro_f1_pct": round(float(np.mean(f1_values) * 100), 1),
        "brier_score": round(float(np.mean(np.sum((probabilities - one_hot) ** 2, axis=1))), 4),
        "false_alarms": false_alarms,
        "missed_events": missed_events,
        "confusion_matrix": matrix.tolist(),
        "per_class": per_class,
        "class_support": {label: int((y == index).sum()) for index, label in enumerate(RISK_CLASSES)},
    }


def explain_row(
    row: np.ndarray,
    mean: np.ndarray,
    std: np.ndarray,
    weights: np.ndarray,
    predicted_index: int,
) -> list[dict]:
    standardized = (row - mean) / std
    raw = standardized * weights[predicted_index]
    order = np.argsort(np.abs(raw))[::-1]
    total = max(float(np.abs(raw).sum()), 1e-9)
    return [
        {
            "feature": FEATURES[index],
            "label": FEATURE_LABELS[FEATURES[index]],
            "contribution_pct": round(float(abs(raw[index]) / total * 100), 1),
            "direction": "raises" if raw[index] >= 0 else "reduces",
            "value": round(float(row[index]), 2),
        }
        for index in order[:6]
    ]


def rounded_list(values: np.ndarray, digits: int = 10) -> list:
    return np.round(values, digits).tolist()


def main() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    frames = []
    source_hasher = hashlib.sha256()
    source_rows = {}
    for position, (name, latitude, longitude) in enumerate(CITIES, start=1):
        print(f"[{position:02d}/{len(CITIES)}] {name}", flush=True)
        payload = fetch_city(name, latitude, longitude)
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
        source_hasher.update(canonical)
        frame = city_frame(name, latitude, longitude, payload)
        source_rows[name] = len(frame)
        frames.append(frame)

    data = pd.concat(frames, ignore_index=True).sort_values(["timestamp", "district"])
    train = data[data["timestamp"] <= TRAIN_END].copy()
    calibration = data[(data["timestamp"] > TRAIN_END) & (data["timestamp"] <= CALIBRATION_END)].copy()
    test = data[data["timestamp"] > CALIBRATION_END].copy()
    if min(len(train), len(calibration), len(test)) == 0:
        raise RuntimeError("Chronological split produced an empty partition")

    x_train = train[FEATURES].to_numpy(float)
    x_cal = calibration[FEATURES].to_numpy(float)
    x_test = test[FEATURES].to_numpy(float)
    y_train = train["risk_index"].to_numpy(int)
    y_cal = calibration["risk_index"].to_numpy(int)
    y_test = test["risk_index"].to_numpy(int)
    train_mean = x_train.mean(axis=0)
    train_std = x_train.std(axis=0)
    train_std[train_std < 1e-8] = 1
    x_train_scaled = (x_train - train_mean) / train_std
    x_cal_scaled = (x_cal - train_mean) / train_std
    x_test_scaled = (x_test - train_mean) / train_std

    weights, intercept, losses = train_softmax(x_train_scaled, y_train, len(RISK_CLASSES))
    calibration_logits = x_cal_scaled @ weights.T + intercept
    temperature = best_temperature(calibration_logits, y_cal)
    test_logits = (x_test_scaled @ weights.T + intercept) / temperature
    test_probabilities = softmax(test_logits)
    metrics = prediction_metrics(y_test, test_probabilities)
    predicted_test = test_probabilities.argmax(axis=1)

    importance_raw = np.mean(np.abs(weights), axis=0)
    importance = importance_raw / importance_raw.sum() * 100
    model = {
        "schema_version": 1,
        "model_version": "htsi-logit-4.0",
        "model_type": "Class-balanced multinomial logistic regression",
        "classes": RISK_CLASSES,
        "features": FEATURES,
        "feature_labels": FEATURE_LABELS,
        "scaler": {"mean": rounded_list(train_mean), "scale": rounded_list(train_std)},
        "coefficients": rounded_list(weights),
        "intercepts": rounded_list(intercept),
        "calibration_temperature": round(temperature, 6),
        "feature_importance": [
            {
                "feature": name,
                "label": FEATURE_LABELS[name],
                "importance_pct": round(float(importance[index]), 1),
            }
            for index, name in sorted(enumerate(FEATURES), key=lambda item: importance[item[0]], reverse=True)
        ],
        "training": {
            "source": "Open-Meteo ERA5-Seamless historical weather",
            "sampling": "every third hour",
            "train_period": "2022-01-01 to 2023-12-31",
            "calibration_period": "2024-01-01 to 2024-12-31",
            "test_period": "2025-01-01 to 2025-12-31",
            "train_samples": len(train),
            "calibration_samples": len(calibration),
            "test_samples": len(test),
            "random_seed": RANDOM_SEED,
            "final_weighted_nll": round(losses[-1], 6),
            "epochs": len(losses),
        },
        "label_note": "Real historical weather with HTSI-derived proxy thermal-risk labels; not verified IMD event or health-outcome labels.",
    }
    model_bytes = json.dumps(model, sort_keys=True, separators=(",", ":")).encode()
    model_sha = hashlib.sha256(model_bytes).hexdigest()
    (ARTIFACT_DIR / "heat-risk-model.json").write_text(json.dumps(model, indent=2) + "\n")

    replay_candidates = test.copy().reset_index(drop=True)
    replay_cases = []
    for district, group in replay_candidates.groupby("district"):
        desired_indices = {int(group["htsi"].idxmax()), int(group["htsi"].idxmin())}
        moderate = group.iloc[(group["htsi"] - 52).abs().argsort()[:1]]
        desired_indices.update(int(index) for index in moderate.index)
        for index in sorted(desired_indices):
            row = replay_candidates.loc[index]
            probability = test_probabilities[index]
            predicted_index = int(predicted_test[index])
            feature_row = row[FEATURES].to_numpy(float)
            replay_cases.append(
                {
                    "id": f"{district.lower().replace(' ', '-')}-{row['timestamp'].strftime('%Y%m%d%H')}",
                    "district": district,
                    "timestamp": row["timestamp"].isoformat(),
                    "observed": {
                        "temperature_c": round(float(row["temperature_c"]), 1),
                        "humidity_pct": round(float(row["humidity_pct"]), 0),
                        "wind_speed_ms": round(float(row["wind_speed_ms"]), 1),
                        "shortwave_radiation_wm2": round(float(row["shortwave_radiation_wm2"]), 0),
                        "htsi": round(float(row["htsi"]), 1),
                        "risk": RISK_CLASSES[int(row["risk_index"])],
                    },
                    "prediction": {
                        "risk": RISK_CLASSES[predicted_index],
                        "confidence_pct": round(float(probability[predicted_index] * 100), 1),
                        "high_risk_probability_pct": round(float(probability[2:].sum() * 100), 1),
                        "probabilities": {
                            label: round(float(probability[class_index] * 100), 1)
                            for class_index, label in enumerate(RISK_CLASSES)
                        },
                        "correct": predicted_index == int(row["risk_index"]),
                        "explanation": explain_row(feature_row, train_mean, train_std, weights, predicted_index),
                    },
                }
            )
    replay_cases.sort(key=lambda item: (item["district"], item["timestamp"]))
    (ARTIFACT_DIR / "replay-cases.json").write_text(json.dumps(replay_cases, indent=2) + "\n")

    high_priority = np.argsort(test["htsi"].to_numpy())[::-1][:24]
    timeline = np.linspace(0, len(test) - 1, 24, dtype=int)
    chart_indices = np.unique(np.concatenate([high_priority, timeline]))[:48]
    chart_replay = []
    for sequence, index in enumerate(chart_indices, start=1):
        row = test.iloc[int(index)]
        chart_replay.append(
            {
                "label": f"T{sequence}",
                "timestamp": row["timestamp"].isoformat(),
                "district": row["district"],
                "actual_htsi": round(float(row["htsi"]), 1),
                "predicted_probability": round(float(test_probabilities[int(index), 2:].sum() * 100), 1),
            }
        )

    district_accuracy = {}
    for district, group in test.reset_index(drop=True).groupby("district"):
        idx = group.index.to_numpy()
        district_accuracy[district] = round(float((predicted_test[idx] == y_test[idx]).mean() * 100), 1)
    validation_report = {
        **metrics,
        "labels": RISK_CLASSES,
        "replay": chart_replay,
        "district_accuracy_pct": district_accuracy,
        "test_period": "2025-01-01 to 2025-12-31",
        "test_samples": len(test),
        "model_sha256": model_sha,
        "methodology": "Chronological held-out evaluation. Coefficients fit on 2022-2023, probability temperature calibrated on 2024, tested once on 2025.",
        "caveat": model["label_note"],
    }
    (ARTIFACT_DIR / "validation-report.json").write_text(json.dumps(validation_report, indent=2) + "\n")

    manifest = {
        "source": "Open-Meteo Historical Weather API",
        "model": "ERA5-Seamless",
        "source_url": "https://open-meteo.com/en/docs/historical-weather-api",
        "date_range": f"{SOURCE_START} to {SOURCE_END}",
        "timezone": "Asia/Kolkata",
        "variables": [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "shortwave_radiation",
        ],
        "sampling": "every third hour after validation",
        "locations": [
            {"district": name, "latitude": latitude, "longitude": longitude, "rows": source_rows[name]}
            for name, latitude, longitude in CITIES
        ],
        "rows": {"total": len(data), "train": len(train), "calibration": len(calibration), "test": len(test)},
        "source_payload_sha256": source_hasher.hexdigest(),
        "model_sha256": model_sha,
    }
    (ARTIFACT_DIR / "data-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    print(json.dumps({"metrics": metrics, "rows": manifest["rows"], "model_sha256": model_sha}, indent=2))


if __name__ == "__main__":
    main()
