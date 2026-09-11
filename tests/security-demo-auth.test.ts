import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSecurityDemoSession,
  secureCompare,
  verifySecurityDemoSession,
} from '../lib/security-demo-auth';

void test('security demo session accepts a valid signed token', async () => {
  const now = Date.parse('2026-09-11T09:00:00Z');
  const token = await createSecurityDemoSession('innovatrix-officer', 'test-secret', now);
  const session = await verifySecurityDemoSession(token, 'test-secret', now + 1_000);
  assert.equal(session?.subject, 'innovatrix-officer');
  assert.equal(session?.role, 'officer');
});

void test('security demo session rejects tampering and expiry', async () => {
  const now = Date.parse('2026-09-11T09:00:00Z');
  const token = await createSecurityDemoSession('innovatrix-officer', 'test-secret', now);
  assert.equal(await verifySecurityDemoSession(`${token}x`, 'test-secret', now), null);
  assert.equal(
    await verifySecurityDemoSession(token, 'test-secret', now + 5 * 60 * 60 * 1000),
    null,
  );
});

void test('credential comparison checks exact values', () => {
  assert.equal(secureCompare('officer', 'officer'), true);
  assert.equal(secureCompare('officer', 'Officer'), false);
  assert.equal(secureCompare('officer', 'officer-extra'), false);
});
