import { ensureDatabase, makeId } from '@/lib/database';

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
  if (
    !body.district ||
    !body.incident_type ||
    !body.severity ||
    !body.description ||
    body.description.trim().length < 10
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
  return Response.json(
    { id, district: body.district, status: 'open', created_at: createdAt },
    { status: 201 },
  );
}
