// src/emails/order-confirmation.js
import { emailLayout, brandColors } from './layout.js';

function rupees(paise) {
  return `₹${(paise / 100).toFixed(2)}`;
}

/**
 * @param {object} order - row from `orders`
 * @param {Array}  items - rows from `order_items`
 */
export function orderConfirmationEmail(order, items) {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #EEE6D6;">${it.title}</td>
        <td style="padding:8px 0;border-bottom:1px solid #EEE6D6;text-align:center;">${it.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #EEE6D6;text-align:right;">${rupees(it.line_total_paise)}</td>
      </tr>`
    )
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:17px;font-weight:700;">Thank you, ${order.shipping_name}!</p>
    <p style="margin:0 0 20px;color:${brandColors.muted};">
      Your order <strong style="color:${brandColors.ink};">#${order.order_number}</strong> has been received successfully.
      Payment is confirmed and we'll have your books packed and on their way soon.
    </p>
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <td style="padding-bottom:8px;border-bottom:2px solid ${brandColors.ink};font-weight:700;">Book</td>
          <td style="padding-bottom:8px;border-bottom:2px solid ${brandColors.ink};font-weight:700;text-align:center;">Qty</td>
          <td style="padding-bottom:8px;border-bottom:2px solid ${brandColors.ink};font-weight:700;text-align:right;">Price</td>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table role="presentation" width="100%" style="margin-top:12px;font-size:14px;">
      <tr>
        <td style="color:${brandColors.muted};">Subtotal</td>
        <td style="text-align:right;">${rupees(order.subtotal_paise)}</td>
      </tr>
      <tr>
        <td style="color:${brandColors.muted};">Shipping</td>
        <td style="text-align:right;">${order.shipping_paise ? rupees(order.shipping_paise) : 'Free'}</td>
      </tr>
      <tr>
        <td style="padding-top:8px;font-weight:700;font-size:16px;">Total</td>
        <td style="padding-top:8px;text-align:right;font-weight:700;font-size:16px;color:${brandColors.maroon};">${rupees(order.total_paise)}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:${brandColors.muted};">
      Shipping to: ${order.shipping_address1}, ${order.shipping_address2 ? order.shipping_address2 + ', ' : ''}${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}
    </p>
  `;

  return {
    subject: `Order Confirmed - #${order.order_number} | Chav Myav Publication`,
    html: emailLayout({
      preheader: `Your order #${order.order_number} has been confirmed.`,
      bodyHtml,
      ctaLabel: 'View Order Status',
      ctaUrl: `https://chavmayav.com/html/order-success.html?order=${order.order_number}`,
    }),
  };
}
