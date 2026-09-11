import { ensureDatabase, makeId } from '@/lib/database';
import {
  fetchDistrictForecast,
  fetchNearbyFacilities,
} from '@/lib/thermowatch';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const district = url.searchParams.get('district') || 'Delhi';
  const includeFacilities = url.searchParams.get('facilities') === 'true';
  const detail = await fetchDistrictForecast(district);
  const db = await ensureDatabase();
  const predictedAt = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        'INSERT INTO observations (id, district, temperature, humidity, htsi, risk, source, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        makeId('OBS'),
        detail.district,
        detail.current.temp,
        detail.current.humidity,
        detail.current.htsi,
        detail.current.risk,
        detail.current.source,
        predictedAt,
      ),
    ...detail.horizons.map((item) =>
      db
        .prepare(
          'INSERT INTO predictions (id, district, horizon_hours, probability, predicted_class, source, predicted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          makeId('PRD'),
          detail.district,
          item.horizon_hours,
          item.probability,
          item.predicted_class,
          detail.source,
          predictedAt,
        ),
    ),
  ]);
  const facilities = includeFacilities
    ? await fetchNearbyFacilities(detail.district)
    : undefined;
  return Response.json({ ...detail, facilities });
}
