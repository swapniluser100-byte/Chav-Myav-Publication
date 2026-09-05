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
    <p style="margin:0 0 8px;font-size:17px;font-weight:700;">धन्यवाद, ${order.shipping_name}!</p>
    <p style="margin:0 0 20px;color:${brandColors.muted};">
      तुमची ऑर्डर <strong style="color:${brandColors.ink};">#${order.order_number}</strong> यशस्वीरित्या मिळाली आहे.
      पेमेंट कन्फर्म झाले असून लवकरच आम्ही तुमचे पुस्तक पॅक करून पाठवू.
    </p>
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <td style="padding-bottom:8px;border-bottom:2px solid ${brandColors.ink};font-weight:700;">पुस्तक</td>
          <td style="padding-bottom:8px;border-bottom:2px solid ${brandColors.ink};font-weight:700;text-align:center;">संख्या</td>
          <td style="padding-bottom:8px;border-bottom:2px solid ${brandColors.ink};font-weight:700;text-align:right;">किंमत</td>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table role="presentation" width="100%" style="margin-top:12px;font-size:14px;">
      <tr>
        <td style="color:${brandColors.muted};">उप-बेरीज</td>
        <td style="text-align:right;">${rupees(order.subtotal_paise)}</td>
      </tr>
      <tr>
        <td style="color:${brandColors.muted};">शिपिंग</td>
        <td style="text-align:right;">${order.shipping_paise ? rupees(order.shipping_paise) : 'मोफत'}</td>
      </tr>
      <tr>
        <td style="padding-top:8px;font-weight:700;font-size:16px;">एकूण</td>
        <td style="padding-top:8px;text-align:right;font-weight:700;font-size:16px;color:${brandColors.maroon};">${rupees(order.total_paise)}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:${brandColors.muted};">
      पाठवण्याचा पत्ता: ${order.shipping_address1}, ${order.shipping_address2 ? order.shipping_address2 + ', ' : ''}${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}
    </p>
  `;

  return {
    subject: `ऑर्डर निश्चित - #${order.order_number} | चव म्याव प्रकाशन`,
    html: emailLayout({
      preheader: `तुमची ऑर्डर #${order.order_number} निश्चित झाली आहे.`,
      bodyHtml,
      ctaLabel: 'ऑर्डरची स्थिती पाहा',
      ctaUrl: `https://chavmayav.com/html/order-success.html?order=${order.order_number}`,
    }),
  };
}
