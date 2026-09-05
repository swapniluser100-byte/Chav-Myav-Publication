// src/emails/order-shipped.js
import { emailLayout, brandColors } from './layout.js';

export function orderShippedEmail(order) {
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:17px;font-weight:700;">तुमचे पार्सल रवाना झाले आहे 📦</p>
    <p style="margin:0 0 20px;color:${brandColors.muted};">
      ऑर्डर <strong style="color:${brandColors.ink};">#${order.order_number}</strong> आता कुरिअरकडे सुपूर्द करण्यात आली आहे.
      ${order.tracking_number ? `ट्रॅकिंग क्रमांक: <strong>${order.tracking_number}</strong>` : ''}
    </p>
    <p style="margin:0;font-size:13px;color:${brandColors.muted};">
      पाठवण्याचा पत्ता: ${order.shipping_address1}, ${order.shipping_address2 ? order.shipping_address2 + ', ' : ''}${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}
    </p>
  `;

  return {
    subject: `ऑर्डर पाठवली गेली - #${order.order_number} | चव म्याव प्रकाशन`,
    html: emailLayout({
      preheader: `ऑर्डर #${order.order_number} रवाना झाली आहे.`,
      bodyHtml,
    }),
  };
}
