// src/lib/auth.js
// Password hashing (PBKDF2 via Web Crypto) + lightweight signed session tokens.
// No external dependencies - everything here runs on the Workers runtime as-is.

const PBKDF2_ITERATIONS = 100000;

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** Hash a plaintext password. Returns "iterations:saltHex:hashHex" for storage in D1. */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `${PBKDF2_ITERATIONS}:${toHex(salt)}:${toHex(bits)}`;
}

/** Verify a plaintext password against a stored "iterations:saltHex:hashHex" string. */
export async function verifyPassword(password, stored) {
  const [iterStr, saltHex, hashHex] = stored.split(':');
  const iterations = parseInt(iterStr, 10);
  const salt = fromHex(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const computedHex = toHex(bits);
  // constant-time-ish compare
  if (computedHex.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHex.length; i++) {
    diff |= computedHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return diff === 0;
}

function base64url(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlToBuffer(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Create a signed session token: base64(payload).base64(hmac). Expires via `exp` (unix seconds). */
export async function createSessionToken(payload, secret, ttlSeconds = 60 * 60 * 12) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const encoded = base64url(new TextEncoder().encode(JSON.stringify(body)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encoded));
  return `${encoded}.${base64url(sig)}`;
}

/** Verify + decode a session token. Returns payload object, or null if invalid/expired. */
export async function verifySessionToken(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, base64urlToBuffer(sig), new TextEncoder().encode(encoded));
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBuffer(encoded)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Reads the `cmp_admin_session` cookie from a request. */
export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token, maxAgeSeconds = 60 * 60 * 12) {
  return `cmp_admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `cmp_admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Middleware-style guard for admin routes. Returns admin payload or null. */
export async function requireAdmin(request, env) {
  const token = getCookie(request, 'cmp_admin_session');
  if (!token) return null;
  return verifySessionToken(token, env.ADMIN_SESSION_SECRET);
}
