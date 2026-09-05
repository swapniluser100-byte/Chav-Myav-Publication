// src/emails/admin-new-order.js
import { emailLayout, brandColors } from './layout.js';

function rupees(paise) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function adminNewOrderEmail(order) {
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:17px;font-weight:700;">नवीन ऑर्डर आली आहे 🎉</p>
    <p style="margin:0 0 16px;color:${brandColors.muted};">
      #${order.order_number} — ${order.shipping_name} (${order.shipping_phone})
    </p>
    <p style="margin:0;font-size:20px;font-weight:700;color:${brandColors.maroon};">${rupees(order.total_paise)}</p>
  `;

  return {
    subject: `नवीन ऑर्डर #${order.order_number} - ${rupees(order.total_paise)}`,
    html: emailLayout({
      preheader: `नवीन ऑर्डर #${order.order_number}`,
      bodyHtml,
      ctaLabel: 'ॲडमिन कन्सोलमध्ये पाहा',
      ctaUrl: `https://chavmayav.com/admin/html/orders.html?order=${order.order_number}`,
    }),
  };
}
