import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aggregateModelForecast,
  FORECAST_MODELS,
} from '../lib/weather-ensemble';

void test('ten independent global models are configured', () => {
  assert.equal(FORECAST_MODELS.length, 10);
  assert.equal(new Set(FORECAST_MODELS).size, 10);
});

void test('ensemble forecast averages aligned valid model values', () => {
  const payload = {
    hourly: {
      time: ['2026-09-12T12:00'],
      temperature_2m_a: [36],
      temperature_2m_b: [39],
      temperature_2m_c: [42],
      relative_humidity_2m_a: [45],
      relative_humidity_2m_b: [60],
      relative_humidity_2m_c: [75],
      wind_speed_10m_a: [1],
      wind_speed_10m_b: [2],
      wind_speed_10m_c: [3],
      shortwave_radiation_a: [600],
      shortwave_radiation_b: [750],
      shortwave_radiation_c: [900],
    },
  };
  const [point] = aggregateModelForecast(payload);
  assert.equal(point.temperature_c, 39);
  assert.equal(point.humidity_pct, 60);
  assert.equal(point.wind_speed_ms, 2);
  assert.equal(point.shortwave_radiation_wm2, 750);
  assert.equal(point.model_count, 3);
  assert.equal(point.temperature_spread_c, Math.sqrt(6));
});

void test('ensemble forecast rejects hours with too few complete inputs', () => {
  const result = aggregateModelForecast({
    hourly: {
      time: ['2026-09-12T12:00'],
      temperature_2m_a: [39],
      relative_humidity_2m_a: [60],
      wind_speed_10m_a: [2],
      shortwave_radiation_a: [750],
    },
  });
  assert.deepEqual(result, []);
});
