import { ensureDatabase } from '@/lib/database';
import { MODEL_INFO } from '@/lib/ml-model';

export const runtime = 'edge';

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const db = await ensureDatabase();
    await db.prepare('SELECT 1 AS ok').first();
    return Response.json(
      {
        status: 'operational',
        database: 'connected',
        model_version: MODEL_INFO.model_version,
        checked_at: checkedAt,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      {
        status: 'degraded',
        database: 'unavailable',
        model_version: MODEL_INFO.model_version,
        checked_at: checkedAt,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
