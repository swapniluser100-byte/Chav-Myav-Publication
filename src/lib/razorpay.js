// src/lib/razorpay.js
// Talks to Razorpay's REST API directly with fetch — the official Node SDK
// depends on APIs that aren't available in the Workers runtime.

function authHeader(env) {
  const token = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  return `Basic ${token}`;
}

/** Create a Razorpay order for the given amount (in paise). */
export async function createRazorpayOrder(env, { amountPaise, receipt, notes }) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: authHeader(env),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: notes || {},
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order create failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify the signature Razorpay's checkout.js returns to the browser after payment.
 * Expected signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
export async function verifyPaymentSignature(env, { orderId, paymentId, signature }) {
  const expected = await hmacSha256Hex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
  return expected === signature;
}

/** Verify an incoming webhook's X-Razorpay-Signature header against the raw body. */
export async function verifyWebhookSignature(env, rawBody, signatureHeader) {
  const expected = await hmacSha256Hex(env.RAZORPAY_WEBHOOK_SECRET, rawBody);
  return expected === signatureHeader;
}
