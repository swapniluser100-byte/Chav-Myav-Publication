// src/routes/orders.js
import { ok, error } from '../lib/response.js';

function genOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CMP-${stamp}${rand}`;
}

/**
 * POST /api/orders
 * body: {
 *   customer: { name, phone, email?, address1, address2?, city, state, pincode },
 *   items: [{ bookId, quantity }]
 * }
 * Cash on Delivery: the order is placed and confirmed immediately, no
 * payment gateway involved. Stock is decremented right away since there's
 * no separate "payment succeeded" step to gate it on.
 */
export async function createOrder(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.customer || !Array.isArray(body.items) || body.items.length === 0) {
    return error('Incomplete order information', 400);
  }

  const { customer, items } = body;
  for (const field of ['name', 'phone', 'address1', 'city', 'state', 'pincode']) {
    if (!customer[field]) return error(`${field} is required`, 400);
  }

  // Re-price every item server-side; never trust prices from the client.
  const bookIds = items.map((i) => i.bookId);
  const placeholders = bookIds.map(() => '?').join(',');
  const { results: books } = await env.DB.prepare(
    `SELECT id, title, price_paise, stock FROM books WHERE id IN (${placeholders}) AND is_active = 1`
  )
    .bind(...bookIds)
    .all();

  const bookMap = new Map(books.map((b) => [b.id, b]));
  let subtotal = 0;
  const lineItems = [];
  for (const { bookId, quantity } of items) {
    const book = bookMap.get(bookId);
    if (!book) return error(`Book #${bookId} is not available`, 400);
    if (quantity < 1) return error('Quantity must be at least 1', 400);
    if (book.stock < quantity) return error(`"${book.title}" is out of stock`, 400);
    const lineTotal = book.price_paise * quantity;
    subtotal += lineTotal;
    lineItems.push({ bookId: book.id, title: book.title, unitPrice: book.price_paise, quantity, lineTotal });
  }

  const shipping = subtotal >= 50000 ? 0 : 5000; // free shipping over ₹500, flat ₹50 otherwise
  const total = subtotal + shipping;
  const orderNumber = genOrderNumber();

  // Find or create the customer. Match by email if given, otherwise by phone.
  let customerRow = customer.email
    ? await env.DB.prepare(`SELECT id FROM customers WHERE email = ?`).bind(customer.email).first()
    : await env.DB.prepare(`SELECT id FROM customers WHERE phone = ? ORDER BY id DESC LIMIT 1`).bind(customer.phone).first();

  if (!customerRow) {
    const inserted = await env.DB.prepare(
      `INSERT INTO customers (name, email, phone, address_line1, address_line2, city, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        customer.name,
        customer.email || null,
        customer.phone,
        customer.address1,
        customer.address2 || null,
        customer.city,
        customer.state,
        customer.pincode
      )
      .run();
    customerRow = { id: inserted.meta.last_row_id };
  }

  const orderInsert = await env.DB.prepare(
    `INSERT INTO orders (order_number, customer_id, status, subtotal_paise, shipping_paise, total_paise,
       shipping_name, shipping_phone, shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_pincode)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      orderNumber,
      customerRow.id,
      subtotal,
      shipping,
      total,
      customer.name,
      customer.phone,
      customer.address1,
      customer.address2 || null,
      customer.city,
      customer.state,
      customer.pincode
    )
    .run();

  const orderId = orderInsert.meta.last_row_id;

  const itemInserts = lineItems.map((it) =>
    env.DB.prepare(
      `INSERT INTO order_items (order_id, book_id, title, unit_price_paise, quantity, line_total_paise)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(orderId, it.bookId, it.title, it.unitPrice, it.quantity, it.lineTotal)
  );

  // Decrement stock right away -- there's no payment step to gate this on with COD.
  const stockUpdates = lineItems.map((it) =>
    env.DB.prepare(`UPDATE books SET stock = MAX(stock - ?, 0) WHERE id = ?`).bind(it.quantity, it.bookId)
  );

  await env.DB.batch([...itemInserts, ...stockUpdates]);

  return ok({ orderNumber, totalPaise: total });
}

/** GET /api/orders/:orderNumber — used by the order-success page to show a summary */
export async function getOrderByNumber(request, env, orderNumber) {
  const order = await env.DB.prepare(`SELECT * FROM orders WHERE order_number = ?`)
    .bind(orderNumber)
    .first();
  if (!order) return error('Order not found', 404);

  const { results: items } = await env.DB.prepare(`SELECT * FROM order_items WHERE order_id = ?`)
    .bind(order.id)
    .all();

  return ok({ order, items });
}
