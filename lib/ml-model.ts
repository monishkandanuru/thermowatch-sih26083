import modelArtifact from '@/ml/artifacts/heat-risk-model.json';
import replayArtifact from '@/ml/artifacts/replay-cases.json';
import validationArtifact from '@/ml/artifacts/validation-report.json';

export type ModelRisk =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Extreme'
  | 'Emergency';

export type ModelContribution = {
  feature: string;
  label: string;
  contribution_pct: number;
  direction: 'raises' | 'reduces';
  value: number;
};

export type ModelPrediction = {
  predicted_class: ModelRisk;
  confidence_pct: number;
  high_risk_probability_pct: number;
  probabilities: Record<ModelRisk, number>;
  explanation: ModelContribution[];
};

type PredictionInput = {
  temperature_c: number;
  humidity_pct: number;
  wind_speed_ms: number;
  shortwave_radiation_wm2: number;
  latitude: number;
  longitude: number;
  timestamp: string | Date;
};

const model = modelArtifact as typeof modelArtifact & {
  classes: ModelRisk[];
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function heatIndexRaw(tempC: number, humidity: number) {
  const tempF = (tempC * 9) / 5 + 32;
  const resultF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF ** 2 -
    0.05481717 * humidity ** 2 +
    0.00122874 * tempF ** 2 * humidity +
    0.00085282 * tempF * humidity ** 2 -
    0.00000199 * tempF ** 2 * humidity ** 2;
  return ((resultF - 32) * 5) / 9;
}

function wetBulb(tempC: number, humidity: number) {
  return (
    tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(tempC + humidity) -
    Math.atan(humidity - 1.676331) +
    0.00391838 * humidity ** 1.5 * Math.atan(0.023101 * humidity) -
    4.686035
  );
}

function timestampParts(value: string | Date) {
  const text =
    value instanceof Date
      ? value.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' })
      : value;
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):\d{2})?/,
  );
  if (!match) {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const read = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    return {
      year: read('year'),
      month: read('month'),
      day: read('day'),
      hour: read('hour'),
    };
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? 0),
  };
}

function featureVector(input: PredictionInput) {
  const uv = clamp(input.shortwave_radiation_wm2 / 95, 0, 11);
  const wbgt =
    0.7 * wetBulb(input.temperature_c, input.humidity_pct) +
    0.2 *
      (input.temperature_c + input.shortwave_radiation_wm2 / 180) +
    0.1 * input.temperature_c;
  const heatIndex = heatIndexRaw(input.temperature_c, input.humidity_pct);
  const pet =
    input.temperature_c +
    input.humidity_pct * 0.035 +
    input.shortwave_radiation_wm2 / 240 -
    input.wind_speed_ms * 0.7;
  const { year, month, day, hour } = timestampParts(input.timestamp);
  const startOfYear = Date.UTC(year, 0, 1);
  const currentDay = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.floor((currentDay - startOfYear) / 86_400_000) + 1;
  const hourAngle = (2 * Math.PI * hour) / 24;
  const dayAngle = (2 * Math.PI * dayOfYear) / 365.25;
  const values: Record<string, number> = {
    temperature_c: input.temperature_c,
    humidity_pct: input.humidity_pct,
    wind_speed_ms: input.wind_speed_ms,
    shortwave_radiation_wm2: input.shortwave_radiation_wm2,
    uv_index_proxy: uv,
    heat_index_c: heatIndex,
    wbgt_c: wbgt,
    pet_c: pet,
    hour_sin: Math.sin(hourAngle),
    hour_cos: Math.cos(hourAngle),
    day_sin: Math.sin(dayAngle),
    day_cos: Math.cos(dayAngle),
    latitude: input.latitude,
    longitude: input.longitude,
  };
  return model.features.map((feature) => values[feature]);
}

function round(value: number, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function predictHeatRisk(input: PredictionInput): ModelPrediction {
  const values = featureVector(input);
  const standardized = values.map(
    (value, index) =>
      (value - model.scaler.mean[index]) / model.scaler.scale[index],
  );
  const logits = model.coefficients.map(
    (classWeights, classIndex) =>
      (classWeights.reduce(
        (sum, weight, featureIndex) =>
          sum + weight * standardized[featureIndex],
        model.intercepts[classIndex],
      ) / model.calibration_temperature),
  );
  const maximum = Math.max(...logits);
  const exponentials = logits.map((value) => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  const probabilities = exponentials.map((value) => value / total);
  const predictedIndex = probabilities.indexOf(Math.max(...probabilities));
  const rawContributions = standardized.map(
    (value, index) => value * model.coefficients[predictedIndex][index],
  );
  const contributionTotal = Math.max(
    rawContributions.reduce((sum, value) => sum + Math.abs(value), 0),
    1e-9,
  );
  const explanation = rawContributions
    .map((value, index) => ({
      feature: model.features[index],
      label: model.feature_labels[
        model.features[index] as keyof typeof model.feature_labels
      ],
      contribution_pct: round((Math.abs(value) / contributionTotal) * 100),
      direction: (value >= 0 ? 'raises' : 'reduces') as 'raises' | 'reduces',
      value: round(values[index], 2),
    }))
    .sort((a, b) => b.contribution_pct - a.contribution_pct)
    .slice(0, 6);
  const probabilityMap = Object.fromEntries(
    model.classes.map((risk, index) => [risk, round(probabilities[index] * 100)]),
  ) as Record<ModelRisk, number>;
  return {
    predicted_class: model.classes[predictedIndex],
    confidence_pct: round(probabilities[predictedIndex] * 100),
    high_risk_probability_pct: round(
      probabilities.slice(2).reduce((sum, value) => sum + value, 0) * 100,
    ),
    probabilities: probabilityMap,
    explanation,
  };
}

export const MODEL_INFO = {
  model_version: model.model_version,
  model_type: model.model_type,
  data_source: model.training.source,
  train_samples: model.training.train_samples,
  calibration_samples: model.training.calibration_samples,
  test_samples: model.training.test_samples,
  train_period: model.training.train_period,
  calibration_period: model.training.calibration_period,
  test_period: model.training.test_period,
  metrics: {
    accuracy_pct: validationArtifact.accuracy_pct,
    precision_pct: validationArtifact.precision_pct,
    recall_pct: validationArtifact.recall_pct,
    macro_f1_pct: validationArtifact.macro_f1_pct,
    brier_score: validationArtifact.brier_score,
    false_alarms: validationArtifact.false_alarms,
    missed_events: validationArtifact.missed_events,
  },
  feature_names: model.feature_importance.map((item) => item.label),
  feature_importance: model.feature_importance,
  label_note: model.label_note,
  artifact_sha256: validationArtifact.model_sha256,
};

export const VALIDATION_REPORT = validationArtifact;
export const REPLAY_CASES = replayArtifact;
