export const SECURITY_DEMO_COOKIE = 'tw_security_demo';

export type SecurityDemoSession = {
  subject: string;
  role: 'officer';
  issuedAt: number;
  expiresAt: number;
};

function toBase64Url(value: Uint8Array | string) {
  const bytes =
    typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return new Uint8Array([...binary].map((character) => character.charCodeAt(0)));
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createSecurityDemoSession(
  subject: string,
  secret: string,
  now = Date.now(),
) {
  const session: SecurityDemoSession = {
    subject,
    role: 'officer',
    issuedAt: now,
    expiresAt: now + 4 * 60 * 60 * 1000,
  };
  const payload = toBase64Url(JSON.stringify(session));
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', await signingKey(secret), new TextEncoder().encode(payload)),
  );
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySecurityDemoSession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<SecurityDemoSession | null> {
  if (!token) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await signingKey(secret),
      fromBase64Url(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;
    const session = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as SecurityDemoSession;
    if (
      session.role !== 'officer' ||
      !session.subject ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= now
    )
      return null;
    return session;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string) {
  const cookies = request.headers.get('cookie') ?? '';
  for (const item of cookies.split(';')) {
    const [key, ...value] = item.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}

export function secureCompare(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let mismatch = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return mismatch === 0;
}
