// src/lib/resend.js
// Thin wrapper over the Resend API (https://resend.com/docs/api-reference/emails/send-email)
// Every email in this project is sent through here so branding/logging stays in one place.

export async function sendEmail(env, { to, subject, html, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || 'Chav Myav Publication <orders@chavmayav.com>',
      to: [to],
      subject,
      html,
      reply_to: replyTo || env.EMAIL_REPLY_TO || undefined,
    }),
  });

  const body = await res.json().catch(() => ({}));
  return { success: res.ok, status: res.status, body };
}

/** Sends an email and writes the outcome to email_log so the admin console can show it. */
export async function sendAndLog(env, { to, subject, html, type, orderId }) {
  let result;
  try {
    result = await sendEmail(env, { to, subject, html });
  } catch (err) {
    result = { success: false, body: { message: String(err) } };
  }

  await env.DB.prepare(
    `INSERT INTO email_log (to_email, subject, type, order_id, status, error)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      to,
      subject,
      type,
      orderId || null,
      result.success ? 'sent' : 'failed',
      result.success ? null : JSON.stringify(result.body)
    )
    .run();

  return result;
}
