# ThermoWatch reproducible model

This folder contains the training pipeline for the model used by the hosted ThermoWatch application.

## What the model does

The model classifies heat risk from environmental conditions. Live 24/48/72-hour Open-Meteo forecast variables are passed to this classifier to produce a risk class, calibrated confidence, High+ probability and feature contributions.

## Data and split

- Source: Open-Meteo Historical Weather API, ERA5-Seamless reanalysis.
- Locations: the 20 Indian locations configured in ThermoWatch.
- Sampling: every third hour.
- Training: 2022-01-01 to 2023-12-31.
- Probability calibration: 2024-01-01 to 2024-12-31.
- Final held-out test: 2025-01-01 to 2025-12-31.

The split is chronological. The 2025 test rows are never used to fit coefficients or calibrate probabilities.

## Labels and limitation

Labels are derived from the documented ThermoWatch HTSI methodology applied to observed historical weather. They are proxy thermal-risk labels, not verified IMD heatwave-event or health-outcome labels. The app displays this limitation prominently.

## Reproduce

Run from the site root with Python 3 and NumPy/Pandas available:

```bash
python3 ml/train_model.py
```

Downloaded source responses are cached in `ml/data-cache/` and are intentionally excluded from Git. The reproducible model, validation report, replay cases and data manifest are written to `ml/artifacts/` and committed.

Verify the exported evidence without downloading data:

```bash
python3 ml/verify_artifacts.py
npx tsx ml/verify_runtime.ts
```

## Outputs

- `heat-risk-model.json`: scaler, coefficients, intercepts, calibration temperature and feature importance.
- `validation-report.json`: chronological holdout metrics, confusion matrix and replay chart data.
- `replay-cases.json`: real held-out 2025 observations with model predictions and explanations.
- `data-manifest.json`: source, date ranges, locations, row counts and source-data checksum.
