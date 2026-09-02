import { ensureDatabase, makeId } from '@/lib/database';
import { MODEL_INFO } from '@/lib/ml-model';
import {
  fetchAllForecastLayers,
  type ForecastLayerPoint,
} from '@/lib/thermowatch';
import { evaluateForecastWarnings } from '@/lib/warnings';

export const runtime = 'edge';

type LayerPayload = {
  layers: Record<'24' | '48' | '72', ForecastLayerPoint[]>;
  generated_at: string;
  warning_count: number;
  model_version: string;
};

let cached: { expiresAt: number; payload: LayerPayload } | null = null;

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get('refresh') === 'true';
  if (!refresh && cached && cached.expiresAt > Date.now()) {
    return Response.json(cached.payload, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  }
  const layers = await fetchAllForecastLayers();
  const generatedAt = new Date().toISOString();
  const allPredictions = Object.values(layers).flat().map((item) => ({
    district: item.district,
    horizon_hours: item.horizon_hours,
    predicted_class: item.risk,
    high_risk_probability: item.high_risk_probability,
    htsi: item.htsi,
    valid_at: item.valid_at,
    model_version: item.model_version,
  }));
  const warnings = evaluateForecastWarnings(allPredictions);
  const db = await ensureDatabase();
  if (warnings.length) {
    await db.batch(
      warnings.map((warning) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO warning_events
             (id, dedupe_key, district, horizon_hours, risk, probability, htsi, model_version, status, valid_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
          )
          .bind(
            makeId('WRN'),
            warning.dedupe_key,
            warning.district,
            warning.horizon_hours,
            warning.predicted_class,
            warning.high_risk_probability,
            warning.htsi,
            warning.model_version,
            warning.valid_at,
            generatedAt,
          ),
      ),
    );
  }
  await db
    .prepare(
      "UPDATE warning_events SET status = 'expired' WHERE status = 'active' AND valid_at < ?",
    )
    .bind(generatedAt)
    .run();
  const payload: LayerPayload = {
    layers: {
      24: layers[24],
      48: layers[48],
      72: layers[72],
    },
    generated_at: generatedAt,
    warning_count: warnings.length,
    model_version: MODEL_INFO.model_version,
  };
  cached = { expiresAt: Date.now() + 5 * 60_000, payload };
  return Response.json(payload, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
