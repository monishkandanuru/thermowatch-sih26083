import assert from 'node:assert/strict';
import test from 'node:test';

import { sortByUrgency } from '../lib/triage';

void test('sorts help recipients by severity before HTSI', () => {
  const result = sortByUrgency([
    { profile: 'High A', risk: 'High' as const, htsi: 78 },
    { profile: 'Emergency', risk: 'Emergency' as const, htsi: 86 },
    { profile: 'Extreme', risk: 'Extreme' as const, htsi: 80 },
    { profile: 'High B', risk: 'High' as const, htsi: 82 },
  ]);

  assert.deepEqual(
    result.map((item) => item.profile),
    ['Emergency', 'Extreme', 'High B', 'High A'],
  );
});

void test('does not mutate the original triage list', () => {
  const original = [
    { profile: 'Moderate', risk: 'Moderate' as const, htsi: 48 },
    { profile: 'High', risk: 'High' as const, htsi: 58 },
  ];

  sortByUrgency(original);

  assert.equal(original[0].profile, 'Moderate');
});
