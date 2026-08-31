import { env } from 'cloudflare:workers';

let initialized = false;

export async function ensureDatabase() {
  if (initialized) return env.DB;
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY, district TEXT NOT NULL, incident_type TEXT NOT NULL,
      severity TEXT NOT NULL, description TEXT NOT NULL, reporter TEXT NOT NULL DEFAULT 'anonymous',
      status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL
    )`),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_incidents_district_created ON incidents(district, created_at)',
    ),
    db.prepare(`CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY, district TEXT NOT NULL, risk TEXT NOT NULL, channel TEXT NOT NULL,
      language TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'sent',
      acknowledged_at TEXT, created_at TEXT NOT NULL
    )`),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_alerts_district_created ON alerts(district, created_at)',
    ),
    db.prepare(`CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY, district TEXT NOT NULL, temperature REAL NOT NULL, humidity REAL NOT NULL,
      htsi REAL NOT NULL, risk TEXT NOT NULL, source TEXT NOT NULL, observed_at TEXT NOT NULL
    )`),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_observations_district_time ON observations(district, observed_at)',
    ),
    db.prepare(`CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY, district TEXT NOT NULL, horizon_hours REAL NOT NULL, probability REAL NOT NULL,
      predicted_class TEXT NOT NULL, source TEXT NOT NULL, predicted_at TEXT NOT NULL
    )`),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_predictions_district_time ON predictions(district, predicted_at)',
    ),
  ]);
  initialized = true;
  return db;
}

export function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
