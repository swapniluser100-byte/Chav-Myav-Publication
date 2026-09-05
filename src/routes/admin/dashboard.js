// src/routes/admin/dashboard.js
import { ok } from '../../lib/response.js';

/** GET /api/admin/dashboard */
export async function getDashboard(request, env) {
  const [{ total_orders }] = (await env.DB.prepare(`SELECT COUNT(*) AS total_orders FROM orders`).all()).results;
  const [{ total_revenue }] = (
    await env.DB.prepare(`SELECT COALESCE(SUM(total_paise),0) AS total_revenue FROM orders WHERE status IN ('paid','shipped','delivered')`).all()
  ).results;
  const [{ pending_orders }] = (
    await env.DB.prepare(`SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'paid'`).all()
  ).results;
  const [{ total_books }] = (await env.DB.prepare(`SELECT COUNT(*) AS total_books FROM books WHERE is_active = 1`).all()).results;
  const [{ low_stock }] = (await env.DB.prepare(`SELECT COUNT(*) AS low_stock FROM books WHERE stock <= 5 AND is_active = 1`).all()).results;
  const [{ total_customers }] = (await env.DB.prepare(`SELECT COUNT(*) AS total_customers FROM customers`).all()).results;

  const { results: recentOrders } = await env.DB.prepare(
    `SELECT order_number, shipping_name, status, total_paise, created_at FROM orders ORDER BY created_at DESC LIMIT 8`
  ).all();

  const { results: recentEmails } = await env.DB.prepare(
    `SELECT to_email, subject, type, status, created_at FROM email_log ORDER BY created_at DESC LIMIT 8`
  ).all();

  return ok({
    stats: { total_orders, total_revenue, pending_orders, total_books, low_stock, total_customers },
    recentOrders,
    recentEmails,
  });
}
