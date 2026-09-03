import assert from 'node:assert/strict';
import test from 'node:test';

import { predictHeatRisk } from '../lib/ml-model';
import { computeHtsi, riskFor } from '../lib/thermowatch';
import { evaluateForecastWarnings } from '../lib/warnings';
import {
  alertDeliveryMode,
  buildAlertMessage,
  isAlertChannel,
  isAlertLanguage,
} from '../lib/alerting';

void test('HTSI risk boundaries remain stable', () => {
  assert.equal(riskFor(0), 'Low');
  assert.equal(riskFor(37.9), 'Low');
  assert.equal(riskFor(38), 'Moderate');
  assert.equal(riskFor(55), 'High');
  assert.equal(riskFor(70), 'Extreme');
  assert.equal(riskFor(85), 'Emergency');
});

void test('HTSI responds to materially hotter conditions', () => {
  const mild = computeHtsi({
    temp: 28,
    humidity: 45,
    wind: 2.5,
    uv: 3,
    solar: 250,
  });
  const dangerous = computeHtsi({
    temp: 43,
    humidity: 55,
    wind: 0.8,
    uv: 9,
    solar: 900,
  });
  assert(dangerous.htsi > mild.htsi);
  assert(['High', 'Extreme', 'Emergency'].includes(dangerous.risk));
});

void test('runtime model emits a complete calibrated probability distribution', () => {
  const prediction = predictHeatRisk({
    temperature_c: 39,
    humidity_pct: 50,
    wind_speed_ms: 1.2,
    shortwave_radiation_wm2: 780,
    latitude: 28.6139,
    longitude: 77.209,
    timestamp: '2026-05-20T14:00:00',
  });
  const total = Object.values(prediction.probabilities).reduce(
    (sum, value) => sum + value,
    0,
  );
  assert(Math.abs(total - 100) <= 0.3);
  assert(prediction.confidence_pct >= 0 && prediction.confidence_pct <= 100);
  assert.equal(prediction.explanation.length, 6);
});

void test('automatic warnings enforce probability and class thresholds', () => {
  const warnings = evaluateForecastWarnings([
    {
      district: 'Delhi',
      horizon_hours: 24,
      predicted_class: 'High',
      high_risk_probability: 72,
      htsi: 62,
      valid_at: '2026-05-20T14:00:00',
      model_version: 'htsi-logit-4.0',
    },
    {
      district: 'Jaipur',
      horizon_hours: 24,
      predicted_class: 'Moderate',
      high_risk_probability: 82,
      htsi: 49,
      valid_at: '2026-05-20T14:00:00',
      model_version: 'htsi-logit-4.0',
    },
    {
      district: 'Nagpur',
      horizon_hours: 48,
      predicted_class: 'High',
      high_risk_probability: 59.9,
      htsi: 58,
      valid_at: '2026-05-21T14:00:00',
      model_version: 'htsi-logit-4.0',
    },
  ]);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].district, 'Delhi');
  assert.equal(warnings[0].priority, 'watch');
  assert.match(warnings[0].dedupe_key, /^delhi:24:/);
});

void test('regional warning templates and demo delivery modes stay explicit', () => {
  assert.equal(isAlertLanguage('kn'), true);
  assert.equal(isAlertChannel('whatsapp'), true);
  assert.match(buildAlertMessage('kn', 'Bengaluru', 'High'), /Bengaluru/);
  assert.equal(alertDeliveryMode('browser'), 'live');
  assert.equal(alertDeliveryMode('sms'), 'demo');
  assert.equal(alertDeliveryMode('whatsapp'), 'demo');
});
