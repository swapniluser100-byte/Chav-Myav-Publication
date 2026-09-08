// src/routes/admin/customers.js
import { ok, error } from '../../lib/response.js';

/** GET /api/admin/customers */
export async function adminListCustomers(request, env) {
  const { results } = await env.DB.prepare(
    `SELECT c.*, COUNT(o.id) AS order_count, COALESCE(SUM(CASE WHEN o.status IN ('paid','shipped','delivered') THEN o.total_paise ELSE 0 END),0) AS lifetime_value_paise
     FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
     GROUP BY c.id ORDER BY c.created_at DESC`
  ).all();
  return ok({ customers: results });
}

/** GET /api/admin/customers/:id */
export async function adminGetCustomer(request, env, id) {
  const customer = await env.DB.prepare(`SELECT * FROM customers WHERE id = ?`).bind(id).first();
  if (!customer) return error('Customer not found', 404);
  const { results: orders } = await env.DB.prepare(
    `SELECT order_number, status, total_paise, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC`
  )
    .bind(id)
    .all();
  return ok({ customer, orders });
}
