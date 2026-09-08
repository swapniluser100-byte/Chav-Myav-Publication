// src/routes/admin/orders.js
import { ok, error } from '../../lib/response.js';

/** GET /api/admin/orders?status=pending */
export async function adminListOrders(request, env) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = `SELECT o.*, c.email AS customer_email FROM orders o JOIN customers c ON c.id = o.customer_id`;
  const binds = [];
  if (status) {
    query += ` WHERE o.status = ?`;
    binds.push(status);
  }
  query += ` ORDER BY o.created_at DESC`;

  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return ok({ orders: results });
}

/** GET /api/admin/orders/:id */
export async function adminGetOrder(request, env, id) {
  const order = await env.DB.prepare(
    `SELECT o.*, c.email AS customer_email FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = ?`
  )
    .bind(id)
    .first();
  if (!order) return error('Order not found', 404);

  const { results: items } = await env.DB.prepare(`SELECT * FROM order_items WHERE order_id = ?`).bind(id).all();
  return ok({ order, items });
}

/**
 * PATCH /api/admin/orders/:id
 * body: { status?, tracking_number?, notes? }
 * Cash on Delivery orders move through: pending -> confirmed -> shipped -> delivered
 * (or cancelled at any point). No emails are sent -- customers are tracked
 * and updated here in the console, or contacted directly by phone.
 */
export async function adminUpdateOrder(request, env, id) {
  const b = await request.json().catch(() => null);
  if (!b) return error('Invalid request', 400);

  const order = await env.DB.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first();
  if (!order) return error('Order not found', 404);

  const nextStatus = b.status || order.status;
  const trackingNumber = b.tracking_number ?? order.tracking_number;
  const notes = b.notes ?? order.notes;

  await env.DB.prepare(
    `UPDATE orders SET status=?, tracking_number=?, notes=?, updated_at=datetime('now') WHERE id = ?`
  )
    .bind(nextStatus, trackingNumber, notes, id)
    .run();

  return ok({});
}
