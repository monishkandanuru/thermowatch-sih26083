import { ensureDatabase, makeId } from '@/lib/database';
import {
  MODEL_INFO,
  REPLAY_CASES,
  VALIDATION_REPORT,
} from '@/lib/ml-model';
import { fetchAllDistricts } from '@/lib/thermowatch';

export const runtime = 'edge';

export async function GET() {
  const districts = await fetchAllDistricts();
  const db = await ensureDatabase();
  const now = new Date().toISOString();
  await db.batch(
    districts.map((item) =>
      db
        .prepare(
          'INSERT INTO observations (id, district, temperature, humidity, htsi, risk, source, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          makeId('OBS'),
          item.district,
          item.temp,
          item.humidity,
          item.htsi,
          item.risk,
          item.source,
          now,
        ),
    ),
  );
  const [alertCount, incidentCount] = await Promise.all([
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM alerts WHERE status != 'acknowledged'",
      )
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM incidents WHERE status = 'open'")
      .first<{ count: number }>(),
  ]);
  const highest = [...districts].sort((a, b) => b.htsi - a.htsi);
  return Response.json({
    districts,
    model: MODEL_INFO,
    authority: {
      coverage: districts.length,
      high_risk_count: districts.filter((item) =>
        ['High', 'Extreme', 'Emergency'].includes(item.risk),
      ).length,
      active_alerts: alertCount?.count ?? 0,
      open_incidents: incidentCount?.count ?? 0,
      highest_risk_locations: highest.slice(0, 7),
      recommended_interventions: [
        'Open and clearly signpost cooling centres before peak heat.',
        'Move outdoor labour and school activity away from 12–4 PM.',
        'Prioritise older adults, children, outdoor workers and people with chronic illness.',
        'Pre-position water, ORS and emergency medical teams in High+ districts.',
      ],
    },
    validation: {
      ...VALIDATION_REPORT,
      replay_cases: REPLAY_CASES,
    },
    generated_at: now,
  });
}
