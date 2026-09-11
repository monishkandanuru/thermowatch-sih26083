import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aggregateModelForecast,
  ENSEMBLE_SYSTEMS,
  FORECAST_SAMPLE_SIZE,
} from '../lib/weather-ensemble';

void test('two independent global ensemble systems provide ten samples', () => {
  assert.deepEqual(ENSEMBLE_SYSTEMS, ['ecmwf_ifs025', 'icon_global']);
  assert.equal(FORECAST_SAMPLE_SIZE, 10);
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

void test('ensemble mean uses complete aligned forecast trajectories', () => {
  const payload = {
    hourly: {
      time: ['2026-09-12T12:00'],
      temperature_2m_model_a: [36],
      temperature_2m_model_b: [39],
      temperature_2m_model_c: [42],
      temperature_2m_member01_model_a: [90],
      relative_humidity_2m_model_a: [45],
      relative_humidity_2m_model_b: [60],
      relative_humidity_2m_model_c: [75],
      relative_humidity_2m_member01_model_a: [99],
      wind_speed_10m_model_a: [1],
      wind_speed_10m_model_b: [2],
      wind_speed_10m_model_c: [3],
      wind_speed_10m_member01_model_a: [20],
      shortwave_radiation_model_a: [600],
      shortwave_radiation_model_b: [750],
      shortwave_radiation_model_c: [900],
      shortwave_radiation_member01_model_a: [2000],
    },
  };
  const [point] = aggregateModelForecast(payload);
  assert.equal(point.temperature_c, 51.75);
  assert.equal(point.humidity_pct, 69.75);
  assert.equal(point.wind_speed_ms, 6.5);
  assert.equal(point.shortwave_radiation_wm2, 1062.5);
  assert.equal(point.model_count, 4);
});

void test('missing model values are ignored instead of becoming zero', () => {
  const [point] = aggregateModelForecast({
    hourly: {
      time: ['2026-09-12T12:00'],
      temperature_2m_a: [36],
      temperature_2m_b: [null],
      temperature_2m_c: [39],
      temperature_2m_d: [42],
      relative_humidity_2m_a: [45],
      relative_humidity_2m_b: [null],
      relative_humidity_2m_c: [60],
      relative_humidity_2m_d: [75],
      wind_speed_10m_a: [1],
      wind_speed_10m_b: [null],
      wind_speed_10m_c: [2],
      wind_speed_10m_d: [3],
      shortwave_radiation_a: [600],
      shortwave_radiation_b: [null],
      shortwave_radiation_c: [750],
      shortwave_radiation_d: [900],
    },
  });
  assert.equal(point.temperature_c, 39);
  assert.equal(point.model_count, 3);
});
