// src/routes/payments.js
import { ok, error } from '../lib/response.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../lib/razorpay.js';
import { sendAndLog } from '../lib/resend.js';
import { orderConfirmationEmail } from '../emails/order-confirmation.js';
import { adminNewOrderEmail } from '../emails/admin-new-order.js';

async function markOrderPaidAndNotify(env, order) {
  if (order.status === 'paid') return; // already processed (idempotent)

  await env.DB.prepare(`UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?`)
    .bind(order.id)
    .run();

  const { results: items } = await env.DB.prepare(`SELECT * FROM order_items WHERE order_id = ?`)
    .bind(order.id)
    .all();

  // Decrement stock for each purchased book
  await env.DB.batch(
    items.map((it) =>
      env.DB.prepare(`UPDATE books SET stock = MAX(stock - ?, 0) WHERE id = ?`).bind(it.quantity, it.book_id)
    )
  );

  const customer = await env.DB.prepare(`SELECT email FROM customers WHERE id = ?`)
    .bind(order.customer_id)
    .first();

  const confirmation = orderConfirmationEmail(order, items);
  await sendAndLog(env, {
    to: customer.email,
    subject: confirmation.subject,
    html: confirmation.html,
    type: 'order_confirmation',
    orderId: order.id,
  });

  if (env.ADMIN_ALERT_EMAIL) {
    const adminAlert = adminNewOrderEmail(order);
    await sendAndLog(env, {
      to: env.ADMIN_ALERT_EMAIL,
      subject: adminAlert.subject,
      html: adminAlert.html,
      type: 'admin_alert',
      orderId: order.id,
    });
  }
}

/**
 * POST /api/payments/verify
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Called by the frontend immediately after Razorpay Checkout succeeds.
 */
export async function verifyPayment(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return error('Invalid request', 400);

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (!orderId || !paymentId || !signature) return error('Incomplete payment information', 400);

  const valid = await verifyPaymentSignature(env, { orderId, paymentId, signature });
  if (!valid) return error('Payment verification failed', 400);

  const order = await env.DB.prepare(`SELECT * FROM orders WHERE razorpay_order_id = ?`)
    .bind(orderId)
    .first();
  if (!order) return error('Order not found', 404);

  await env.DB.prepare(`UPDATE orders SET razorpay_payment_id = ? WHERE id = ?`).bind(paymentId, order.id).run();
  await markOrderPaidAndNotify(env, { ...order, razorpay_payment_id: paymentId });

  return ok({ orderNumber: order.order_number });
}

/**
 * POST /api/payments/webhook
 * Razorpay server-to-server webhook — a safety net in case the browser tab
 * closes before /verify runs. Configure this URL + secret in the Razorpay dashboard.
 */
export async function razorpayWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('X-Razorpay-Signature');

  const valid = await verifyWebhookSignature(env, rawBody, signature);
  if (!valid) return error('Invalid webhook signature', 400);

  const payload = JSON.parse(rawBody);
  if (payload.event === 'payment.captured') {
    const razorpayOrderId = payload.payload.payment.entity.order_id;
    const order = await env.DB.prepare(`SELECT * FROM orders WHERE razorpay_order_id = ?`)
      .bind(razorpayOrderId)
      .first();
    if (order) await markOrderPaidAndNotify(env, order);
  }

  return ok({ received: true });
}
