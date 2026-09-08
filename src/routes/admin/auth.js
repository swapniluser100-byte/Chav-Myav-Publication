// src/routes/admin/auth.js
import { ok, error } from '../../lib/response.js';
import { verifyPassword, createSessionToken, sessionCookie, clearSessionCookie, requireAdmin } from '../../lib/auth.js';

/** POST /api/admin/login  body: { email, password } */
export async function adminLogin(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.password) return error('Email and password are required', 400);

  const admin = await env.DB.prepare(`SELECT * FROM admin_users WHERE email = ?`).bind(body.email).first();
  if (!admin) return error('Incorrect email or password', 401);

  const valid = await verifyPassword(body.password, admin.password_hash);
  if (!valid) return error('Incorrect email or password', 401);

  const token = await createSessionToken(
    { adminId: admin.id, email: admin.email, role: admin.role },
    env.ADMIN_SESSION_SECRET
  );

  return ok({ name: admin.name, email: admin.email, role: admin.role }, {
    headers: { 'Set-Cookie': sessionCookie(token) },
  });
}

/** POST /api/admin/logout */
export async function adminLogout() {
  return ok({}, { headers: { 'Set-Cookie': clearSessionCookie() } });
}

/** GET /api/admin/me — used by every admin page to confirm the session is valid */
export async function adminMe(request, env) {
  const session = await requireAdmin(request, env);
  if (!session) return error('Unauthorized', 401);

  const admin = await env.DB.prepare(`SELECT name, email, role FROM admin_users WHERE id = ?`)
    .bind(session.adminId)
    .first();
  if (!admin) return error('Unauthorized', 401);

  return ok({ admin });
}
