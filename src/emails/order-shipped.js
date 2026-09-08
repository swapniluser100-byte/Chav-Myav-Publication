// src/emails/order-shipped.js
import { emailLayout, brandColors } from './layout.js';

export function orderShippedEmail(order) {
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:17px;font-weight:700;">Your parcel is on its way 📦</p>
    <p style="margin:0 0 20px;color:${brandColors.muted};">
      Order <strong style="color:${brandColors.ink};">#${order.order_number}</strong> has now been handed over to the courier.
      ${order.tracking_number ? `Tracking number: <strong>${order.tracking_number}</strong>` : ''}
    </p>
    <p style="margin:0;font-size:13px;color:${brandColors.muted};">
      Shipping to: ${order.shipping_address1}, ${order.shipping_address2 ? order.shipping_address2 + ', ' : ''}${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}
    </p>
  `;

  return {
    subject: `Order Shipped - #${order.order_number} | Chav Myav Publication`,
    html: emailLayout({
      preheader: `Order #${order.order_number} is on its way.`,
      bodyHtml,
    }),
  };
}
