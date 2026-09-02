import assert from 'node:assert/strict';

import { predictHeatRisk } from '../lib/ml-model';
import { DISTRICTS } from '../lib/thermowatch';
import replayCases from './artifacts/replay-cases.json';

let verified = 0;
let maximumConfidenceDifference = 0;
let maximumHighRiskDifference = 0;
for (const replay of replayCases) {
  const district = DISTRICTS.find(
    (item) => item.district === replay.district,
  );
  assert(district, `Unknown replay district: ${replay.district}`);
  const prediction = predictHeatRisk({
    temperature_c: replay.observed.temperature_c,
    humidity_pct: replay.observed.humidity_pct,
    wind_speed_ms: replay.observed.wind_speed_ms,
    shortwave_radiation_wm2: replay.observed.shortwave_radiation_wm2,
    latitude: district.lat,
    longitude: district.lon,
    timestamp: replay.timestamp,
  });
  assert.equal(
    prediction.predicted_class,
    replay.prediction.risk,
    `${replay.id} class mismatch`,
  );
  maximumConfidenceDifference = Math.max(
    maximumConfidenceDifference,
    Math.abs(prediction.confidence_pct - replay.prediction.confidence_pct),
  );
  maximumHighRiskDifference = Math.max(
    maximumHighRiskDifference,
    Math.abs(
      prediction.high_risk_probability_pct -
        replay.prediction.high_risk_probability_pct,
    ),
  );
  verified += 1;
}

// Replay weather is deliberately rounded for display, while its saved prediction
// was calculated from full-precision source rows. Class parity is exact; this
// tolerance only covers the small probability change caused by display rounding.
assert(maximumConfidenceDifference <= 3);
assert(maximumHighRiskDifference <= 3);

console.log(
  JSON.stringify(
    {
      status: 'runtime parity verified',
      replay_cases: verified,
      model_version: 'htsi-logit-4.0',
      maximum_confidence_difference_pct: maximumConfidenceDifference,
      maximum_high_risk_difference_pct: maximumHighRiskDifference,
    },
    null,
    2,
  ),
);
