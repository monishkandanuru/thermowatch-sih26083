import { getRequestActor } from '@/lib/access';
import { ensureDatabase } from '@/lib/database';

export const runtime = 'edge';

export async function GET(request: Request) {
  const db = await ensureDatabase();
  const actor = await getRequestActor(request, db);
  return Response.json(actor, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
