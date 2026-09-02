import { ensureDatabase } from '@/lib/database';

export const runtime = 'edge';

export async function GET(request: Request) {
  const district = new URL(request.url).searchParams.get('district');
  const db = await ensureDatabase();
  const query = district
    ? db
        .prepare(
          `SELECT * FROM warning_events WHERE district = ? AND status = 'active'
           ORDER BY probability DESC, horizon_hours ASC LIMIT 40`,
        )
        .bind(district)
    : db.prepare(
        `SELECT * FROM warning_events WHERE status = 'active'
         ORDER BY probability DESC, horizon_hours ASC LIMIT 80`,
      );
  const result = await query.all();
  return Response.json({ warnings: result.results });
}
