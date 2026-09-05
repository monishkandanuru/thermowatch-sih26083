import assert from 'node:assert/strict';
import test from 'node:test';
import { indiaForecastTime, nearestForecast } from '../lib/forecast-time';

void test('India weather timestamps represent the same instant on any server', () => {
  assert.equal(new Date(indiaForecastTime('2026-09-05T14:00')).toISOString(), '2026-09-05T08:30:00.000Z');
  assert.equal(indiaForecastTime('2026-09-05T08:30:00Z'), '2026-09-05T08:30:00Z');
});

void test('24-hour outlook starts from now rather than midnight array position', () => {
  const points = [
    { time: '2026-09-06T00:00+05:30' },
    { time: '2026-09-06T15:00+05:30' },
    { time: '2026-09-06T18:00+05:30' },
  ];
  assert.equal(nearestForecast(points, 24, Date.parse('2026-09-05T14:30+05:30')), points[1]);
});
