import { ensureDatabase } from '@/lib/database';

export const runtime = 'edge';

export async function GET(request: Request) {
  const district = new URL(request.url).searchParams.get('district') || 'Delhi';
  const db = await ensureDatabase();
  const [observations, predictions] = await Promise.all([
    db
      .prepare(
        'SELECT * FROM observations WHERE district = ? ORDER BY observed_at DESC LIMIT 40',
      )
      .bind(district)
      .all(),
    db
      .prepare(
        'SELECT * FROM predictions WHERE district = ? ORDER BY predicted_at DESC LIMIT 40',
      )
      .bind(district)
      .all(),
  ]);
  return Response.json({
    district,
    observations: observations.results,
    predictions: predictions.results,
    counts: {
      observations: observations.results.length,
      predictions: predictions.results.length,
    },
  });
}
