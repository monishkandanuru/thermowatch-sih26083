import { canOperate, forbiddenResponse, getRequestActor } from '@/lib/access';
import { ensureDatabase } from '@/lib/database';

export const runtime = 'edge';

export async function GET(request: Request) {
  const db = await ensureDatabase();
  const actor = await getRequestActor(request, db);
  if (!canOperate(actor)) return forbiddenResponse(actor);
  const result = await db
    .prepare(
      `SELECT id, actor_role, action, entity_type, entity_id, details_json, created_at
       FROM audit_logs ORDER BY created_at DESC LIMIT 100`,
    )
    .all();
  return Response.json(
    { audit_logs: result.results },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
