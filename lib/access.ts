import type { D1Database } from '@cloudflare/workers-types';
import { env } from 'cloudflare:workers';

export type AccessRole = 'public' | 'officer' | 'admin';

export type RequestActor = {
  id: string | null;
  email: string | null;
  name: string | null;
  role: AccessRole;
  signed_in: boolean;
};

function optionalName(request: Request) {
  const encoding = request.headers.get(
    'oai-authenticated-user-full-name-encoding',
  );
  const value = request.headers.get('oai-authenticated-user-full-name');
  if (!value || encoding !== 'percent-encoded-utf-8') return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export async function getRequestActor(
  request: Request,
  db?: D1Database,
): Promise<RequestActor> {
  const id = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  if (!id) {
    return { id: null, email: null, name: null, role: 'public', signed_in: false };
  }
  const configuredOfficerIds = (env as unknown as Record<string, unknown>)
    .THERMOWATCH_OFFICER_IDS;
  const officerIds = (typeof configuredOfficerIds === 'string'
    ? configuredOfficerIds
    : ''
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  let role: AccessRole = officerIds.includes(id) ? 'admin' : 'public';
  if (db) {
    const saved = await db
      .prepare('SELECT role FROM user_roles WHERE user_id = ? LIMIT 1')
      .bind(id)
      .first<{ role: string }>();
    if (
      saved?.role === 'admin' ||
      saved?.role === 'officer' ||
      saved?.role === 'public'
    ) {
      role = saved.role;
    }
  }
  return {
    id,
    email,
    name: optionalName(request) ?? email,
    role,
    signed_in: true,
  };
}

export function canOperate(actor: RequestActor) {
  return actor.role === 'officer' || actor.role === 'admin';
}

export function forbiddenResponse(actor: RequestActor) {
  return Response.json(
    {
      error: actor.signed_in
        ? 'Your account does not have officer permission.'
        : 'Sign in with ChatGPT to perform this authority action.',
      sign_in_required: !actor.signed_in,
    },
    { status: actor.signed_in ? 403 : 401 },
  );
}
