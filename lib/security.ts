import type { D1Database } from '@cloudflare/workers-types';

import type { RequestActor } from '@/lib/access';
import { makeId } from '@/lib/database';

async function anonymousKey(request: Request) {
  const source =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    'anonymous';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source),
  );
  return Array.from(new Uint8Array(digest))
    .slice(0, 10)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export async function enforceRateLimit(input: {
  db: D1Database;
  request: Request;
  actor: RequestActor;
  action: string;
  limit: number;
  windowSeconds: number;
}) {
  const identity = input.actor.id ?? (await anonymousKey(input.request));
  const key = `${input.action}:${identity}`;
  const now = new Date();
  const existing = await input.db
    .prepare(
      'SELECT count, window_start FROM rate_limits WHERE key = ? LIMIT 1',
    )
    .bind(key)
    .first<{ count: number; window_start: string }>();
  const expired =
    !existing ||
    now.getTime() - new Date(existing.window_start).getTime() >=
      input.windowSeconds * 1000;
  const nextCount = expired ? 1 : existing.count + 1;
  const windowStart = expired ? now.toISOString() : existing.window_start;
  await input.db
    .prepare(
      `INSERT INTO rate_limits (key, count, window_start, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET count = excluded.count, window_start = excluded.window_start, updated_at = excluded.updated_at`,
    )
    .bind(key, nextCount, windowStart, now.toISOString())
    .run();
  if (nextCount > input.limit) {
    return Response.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(input.windowSeconds) } },
    );
  }
  return null;
}

export async function writeAuditLog(input: {
  db: D1Database;
  actor: RequestActor;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}) {
  await input.db
    .prepare(
      'INSERT INTO audit_logs (id, actor_id, actor_role, action, entity_type, entity_id, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      makeId('AUD'),
      input.actor.id,
      input.actor.role,
      input.action,
      input.entityType,
      input.entityId,
      JSON.stringify(input.details ?? {}),
      new Date().toISOString(),
    )
    .run();
}
