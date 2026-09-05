// src/routes/admin/orders.js
import { ok, error } from '../../lib/response.js';
import { sendAndLog } from '../../lib/resend.js';
import { orderShippedEmail } from '../../emails/order-shipped.js';

/** GET /api/admin/orders?status=paid */
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
  if (!order) return error('ऑर्डर सापडली नाही', 404);

  const { results: items } = await env.DB.prepare(`SELECT * FROM order_items WHERE order_id = ?`).bind(id).all();
  return ok({ order, items });
}

/**
 * PATCH /api/admin/orders/:id
 * body: { status?, tracking_number?, notes? }
 * Setting status -> 'shipped' automatically sends the branded shipping email.
 */
export async function adminUpdateOrder(request, env, id) {
  const b = await request.json().catch(() => null);
  if (!b) return error('अवैध विनंती', 400);

  const order = await env.DB.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first();
  if (!order) return error('ऑर्डर सापडली नाही', 404);

  const nextStatus = b.status || order.status;
  const trackingNumber = b.tracking_number ?? order.tracking_number;
  const notes = b.notes ?? order.notes;

  await env.DB.prepare(
    `UPDATE orders SET status=?, tracking_number=?, notes=?, updated_at=datetime('now') WHERE id = ?`
  )
    .bind(nextStatus, trackingNumber, notes, id)
    .run();

  if (nextStatus === 'shipped' && order.status !== 'shipped') {
    const customer = await env.DB.prepare(`SELECT email FROM customers WHERE id = ?`).bind(order.customer_id).first();
    const updatedOrder = { ...order, status: nextStatus, tracking_number: trackingNumber };
    const emailContent = orderShippedEmail(updatedOrder);
    await sendAndLog(env, {
      to: customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      type: 'order_shipped',
      orderId: order.id,
    });
  }

  return ok({});
}
