// src/lib/response.js
export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

export function error(message, status = 400, extra = {}) {
  return json({ ok: false, error: message, ...extra }, { status });
}

export function ok(data = {}, init = {}) {
  return json({ ok: true, ...data }, init);
}
