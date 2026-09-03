import { canOperate, forbiddenResponse, getRequestActor } from '@/lib/access';
import {
  alertDeliveryMode,
  buildAlertMessage,
  isAlertChannel,
  isAlertLanguage,
} from '@/lib/alerting';
import { ensureDatabase, makeId } from '@/lib/database';
import { enforceRateLimit, writeAuditLog } from '@/lib/security';
import { DISTRICTS, type Risk } from '@/lib/thermowatch';

export const runtime = 'edge';

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
      sms: { ready: false, demo: true, label: 'SMS demo preview' },
      whatsapp: { ready: false, demo: true, label: 'WhatsApp demo preview' },
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
    !body.risk ||
    !validRisks.has(body.risk as Risk)
  )
    return Response.json(
      { error: 'A valid district and risk are required.' },
      { status: 400 },
    );
  const requestedChannel = body.channel || 'browser';
  if (!isAlertChannel(requestedChannel))
    return Response.json(
      { error: 'Select browser, SMS demo, or WhatsApp demo delivery.' },
      { status: 400 },
    );
  const db = await ensureDatabase();
  const actor = await getRequestActor(request, db);
  if (!canOperate(actor)) return forbiddenResponse(actor);
  const limited = await enforceRateLimit({
    db,
    request,
    actor,
    action: 'send-alert',
    limit: 12,
    windowSeconds: 3600,
  });
  if (limited) return limited;
  const requestedLanguage = body.language || '';
  const language = isAlertLanguage(requestedLanguage)
    ? requestedLanguage
    : 'en';
  const message = buildAlertMessage(language, body.district, body.risk);
  const deliveryMode = alertDeliveryMode(requestedChannel);
  const status = deliveryMode === 'live' ? 'sent' : 'demo_only';
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
      requestedChannel,
      language,
      message,
      status,
      createdAt,
    )
    .run();
  await writeAuditLog({
    db,
    actor,
    action: deliveryMode === 'live' ? 'alert.sent' : 'alert.demo_previewed',
    entityType: 'alert',
    entityId: id,
    details: {
      district: body.district,
      risk: body.risk,
      language,
      channel: requestedChannel,
      delivery_mode: deliveryMode,
    },
  });
  return Response.json(
    {
      id,
      message,
      channel: requestedChannel,
      delivery_mode: deliveryMode,
      status,
      created_at: createdAt,
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string };
  if (!body.id)
    return Response.json({ error: 'Alert id is required.' }, { status: 400 });
  const db = await ensureDatabase();
  const actor = await getRequestActor(request, db);
  if (!canOperate(actor)) return forbiddenResponse(actor);
  const acknowledgedAt = new Date().toISOString();
  await db
    .prepare(
      "UPDATE alerts SET status = 'acknowledged', acknowledged_at = ? WHERE id = ?",
    )
    .bind(acknowledgedAt, body.id)
    .run();
  await writeAuditLog({
    db,
    actor,
    action: 'alert.acknowledged',
    entityType: 'alert',
    entityId: body.id,
  });
  return Response.json({
    id: body.id,
    status: 'acknowledged',
    acknowledged_at: acknowledgedAt,
  });
}
