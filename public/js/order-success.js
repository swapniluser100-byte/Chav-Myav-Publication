// public/js/order-success.js
const orderNumber = new URLSearchParams(location.search).get('order');
const root = document.getElementById('order-success-root');

async function load() {
  if (!orderNumber) {
    root.innerHTML = `<p class="empty-state">ऑर्डर क्रमांक सापडला नाही.</p>`;
    return;
  }
  try {
    const { order, items } = await Api.getOrder(orderNumber);
    root.innerHTML = `
      <div class="success-box">
        <div class="success-icon">✓</div>
        <h1 style="font-family:var(--font-display);font-size:26px;">धन्यवाद, ${order.shipping_name}!</h1>
        <p style="color:var(--muted);">
          तुमची ऑर्डर <strong>#${order.order_number}</strong> यशस्वीरित्या नोंदवली गेली आहे.
          कन्फर्मेशन ईमेल ${order.shipping_phone ? '' : ''}पाठवण्यात आला आहे.
        </p>
        <table class="cart-table" style="text-align:left;margin-top:24px;">
          <tbody>
            ${items
              .map(
                (it) => `<tr><td>${it.title} × ${it.quantity}</td><td style="text-align:right;">${formatRupees(it.line_total_paise)}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="summary-row total" style="margin-top:12px;"><span>एकूण</span><span>${formatRupees(order.total_paise)}</span></div>
        <a href="/html/index.html" class="btn btn-secondary" style="margin-top:28px;">पुन्हा खरेदी करा</a>
      </div>
    `;
  } catch (err) {
    root.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

load();
