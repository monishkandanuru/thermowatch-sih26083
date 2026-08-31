import { ensureDatabase, makeId } from '@/lib/database';

export const runtime = 'edge';

const templates: Record<string, (district: string, risk: string) => string> = {
  en: (district, risk) =>
    `${risk} heat-risk warning for ${district}. Avoid peak-hour exposure, stay hydrated and check vulnerable people.`,
  hi: (district, risk) =>
    `${district} के लिए ${risk} गर्मी जोखिम चेतावनी। दोपहर की गर्मी से बचें, पानी पीते रहें और कमजोर लोगों की सहायता करें।`,
  te: (district, risk) =>
    `${district}కు ${risk} వేడి ప్రమాద హెచ్చరిక. మధ్యాహ్న వేడిని నివారించండి, నీరు తాగండి మరియు బలహీనులకు సహాయం చేయండి.`,
};

export async function GET(request: Request) {
  const district = new URL(request.url).searchParams.get('district');
  const db = await ensureDatabase();
  const query = district
    ? db
        .prepare(
          'SELECT * FROM alerts WHERE district = ? ORDER BY created_at DESC LIMIT 40',
        )
        .bind(district)
    : db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 40');
  const result = await query.all();
  return Response.json({
    alerts: result.results,
    channels: {
      browser: { ready: true, label: 'Browser notification' },
      sms: { ready: false, label: 'SMS needs provider credentials' },
      webhook: { ready: false, label: 'Webhook needs an endpoint' },
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    district?: string;
    risk?: string;
    language?: string;
    channel?: string;
  };
  if (!body.district || !body.risk)
    return Response.json(
      { error: 'District and risk are required.' },
      { status: 400 },
    );
  if ((body.channel || 'browser') !== 'browser')
    return Response.json(
      {
        error:
          'This hosted demo has browser delivery enabled. Configure an external provider for SMS or webhook delivery.',
      },
      { status: 400 },
    );
  const language = templates[body.language || 'en']
    ? body.language || 'en'
    : 'en';
  const message = templates[language](body.district, body.risk);
  const db = await ensureDatabase();
  const id = makeId('ALT');
  const createdAt = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO alerts (id, district, risk, channel, language, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      body.district,
      body.risk,
      'browser',
      language,
      message,
      'sent',
      createdAt,
    )
    .run();
  return Response.json(
    { id, message, channel: 'browser', status: 'sent', created_at: createdAt },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string };
  if (!body.id)
    return Response.json({ error: 'Alert id is required.' }, { status: 400 });
  const db = await ensureDatabase();
  const acknowledgedAt = new Date().toISOString();
  await db
    .prepare(
      "UPDATE alerts SET status = 'acknowledged', acknowledged_at = ? WHERE id = ?",
    )
    .bind(acknowledgedAt, body.id)
    .run();
  return Response.json({
    id: body.id,
    status: 'acknowledged',
    acknowledged_at: acknowledgedAt,
  });
}
