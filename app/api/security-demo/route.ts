import { env } from 'cloudflare:workers';

import { ensureDatabase } from '@/lib/database';
import {
  createSecurityDemoSession,
  readCookie,
  secureCompare,
  SECURITY_DEMO_COOKIE,
  verifySecurityDemoSession,
} from '@/lib/security-demo-auth';
import { enforceRateLimit, writeAuditLog } from '@/lib/security';

export const runtime = 'edge';

function configuration() {
  const values = env as unknown as Record<string, unknown>;
  return {
    username:
      typeof values.THERMOWATCH_DEMO_USER === 'string'
        ? values.THERMOWATCH_DEMO_USER
        : 'innovatrix-officer',
    password:
      typeof values.THERMOWATCH_DEMO_PASSWORD === 'string'
        ? values.THERMOWATCH_DEMO_PASSWORD
        : 'ThermoWatch@26083',
    secret:
      typeof values.THERMOWATCH_DEMO_SESSION_SECRET === 'string'
        ? values.THERMOWATCH_DEMO_SESSION_SECRET
        : 'thermowatch-sih26083-security-demonstration-key',
  };
}

function cookieHeader(request: Request, token: string, maxAge: number) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SECURITY_DEMO_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export async function GET(request: Request) {
  const session = await verifySecurityDemoSession(
    readCookie(request, SECURITY_DEMO_COOKIE),
    configuration().secret,
  );
  return Response.json(
    session
      ? {
          authenticated: true,
          officer_id: session.subject,
          role: session.role,
          expires_at: new Date(session.expiresAt).toISOString(),
        }
      : { authenticated: false },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    officer_id?: string;
    passcode?: string;
  } | null;
  const officerId = body?.officer_id?.trim() ?? '';
  const passcode = body?.passcode ?? '';
  const db = await ensureDatabase();
  const actor = {
    id: null,
    email: null,
    name: null,
    role: 'public' as const,
    signed_in: false,
  };
  const limited = await enforceRateLimit({
    db,
    request,
    actor,
    action: 'security-demo-login',
    limit: 8,
    windowSeconds: 15 * 60,
  });
  if (limited) return limited;

  const expected = configuration();
  if (
    !secureCompare(officerId, expected.username) ||
    !secureCompare(passcode, expected.password)
  ) {
    return Response.json(
      { error: 'Officer ID or passcode is incorrect.' },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const token = await createSecurityDemoSession(officerId, expected.secret);
  await writeAuditLog({
    db,
    actor: {
      id: `security-demo:${officerId}`,
      email: null,
      name: officerId,
      role: 'officer',
      signed_in: true,
    },
    action: 'security_demo.login_succeeded',
    entityType: 'security_demo_session',
    entityId: officerId,
    details: { expires_in_hours: 4 },
  });
  return Response.json(
    {
      authenticated: true,
      officer_id: officerId,
      role: 'officer',
      expires_in_hours: 4,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Set-Cookie': cookieHeader(request, token, 4 * 60 * 60),
      },
    },
  );
}

export async function DELETE(request: Request) {
  return Response.json(
    { authenticated: false },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Set-Cookie': cookieHeader(request, '', 0),
      },
    },
  );
}
