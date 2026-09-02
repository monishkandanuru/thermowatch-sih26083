import { canOperate, forbiddenResponse, getRequestActor } from '@/lib/access';
import { ensureDatabase, makeId } from '@/lib/database';
import { enforceRateLimit, writeAuditLog } from '@/lib/security';
import { DISTRICTS, type Risk } from '@/lib/thermowatch';

export const runtime = 'edge';

export async function GET(request: Request) {
  const district = new URL(request.url).searchParams.get('district') || 'Delhi';
  const db = await ensureDatabase();
  const result = await db
    .prepare(
      'SELECT * FROM incidents WHERE district = ? ORDER BY created_at DESC LIMIT 30',
    )
    .bind(district)
    .all();
  return Response.json({ incidents: result.results });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    district?: string;
    incident_type?: string;
    severity?: string;
    description?: string;
    reporter?: string;
  };
  const validDistricts = new Set(DISTRICTS.map((item) => item.district));
  const validRisks = new Set<Risk>([
    'Low',
    'Moderate',
    'High',
    'Extreme',
    'Emergency',
  ]);
  if (
    !body.district ||
    !validDistricts.has(body.district) ||
    !body.incident_type ||
    !body.severity ||
    !validRisks.has(body.severity as Risk) ||
    !body.description ||
    body.description.trim().length < 10 ||
    body.description.trim().length > 1200 ||
    body.incident_type.length > 80 ||
    (body.reporter?.length ?? 0) > 120
  ) {
    return Response.json(
      {
        error:
          'District, incident type, severity and a useful description are required.',
      },
      { status: 400 },
    );
  }
  const db = await ensureDatabase();
  const actor = await getRequestActor(request, db);
  const limited = await enforceRateLimit({
    db,
    request,
    actor,
    action: 'submit-incident',
    limit: 8,
    windowSeconds: 3600,
  });
  if (limited) return limited;
  const id = makeId('INC');
  const createdAt = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO incidents (id, district, incident_type, severity, description, reporter, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      body.district,
      body.incident_type,
      body.severity,
      body.description.trim(),
      body.reporter?.trim() || 'anonymous',
      'open',
      createdAt,
    )
    .run();
  await writeAuditLog({
    db,
    actor,
    action: 'incident.created',
    entityType: 'incident',
    entityId: id,
    details: { district: body.district, severity: body.severity },
  });
  return Response.json(
    { id, district: body.district, status: 'open', created_at: createdAt },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    status?: 'open' | 'monitoring' | 'resolved';
  };
  if (!body.id || !['open', 'monitoring', 'resolved'].includes(body.status ?? ''))
    return Response.json(
      { error: 'A valid incident id and status are required.' },
      { status: 400 },
    );
  const db = await ensureDatabase();
  const actor = await getRequestActor(request, db);
  if (!canOperate(actor)) return forbiddenResponse(actor);
  await db
    .prepare('UPDATE incidents SET status = ? WHERE id = ?')
    .bind(body.status, body.id)
    .run();
  await writeAuditLog({
    db,
    actor,
    action: 'incident.status_changed',
    entityType: 'incident',
    entityId: body.id,
    details: { status: body.status },
  });
  return Response.json({ id: body.id, status: body.status });
}
