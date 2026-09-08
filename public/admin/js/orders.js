// public/admin/js/orders.js
function orderRowHtml(o) {
  return `
    <tr data-id="${o.id}">
      <td>${o.order_number}<br/><small style="color:var(--muted);">${o.customer_email}</small></td>
      <td>${o.shipping_name}<br/><small style="color:var(--muted);">${o.shipping_city}, ${o.shipping_state}</small></td>
      <td><span class="status-pill status-${o.status}">${statusLabel(o.status)}</span></td>
      <td>${formatRupees(o.total_paise)}</td>
      <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
      <td><button class="btn btn-secondary" data-action="manage">Manage</button></td>
    </tr>
  `;
}

function manageModalHtml(order) {
  const statuses = ['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed'];
  return `
    <div class="form-group">
      <label>Status</label>
      <select name="status">
        ${statuses.map((s) => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Tracking Number</label><input name="tracking_number" value="${order.tracking_number || ''}" /></div>
    <div class="form-group"><label>Internal Notes</label><textarea name="notes" rows="2">${order.notes || ''}</textarea></div>
    <p style="font-size:12px;color:var(--muted);">Setting status to "Shipped" will automatically send the customer a branded shipping email.</p>
  `;
}

async function loadOrders() {
  const status = document.getElementById('status-filter').value;
  const tbody = document.getElementById('orders-tbody');
  try {
    const { orders } = await AdminApi.getOrders(status);
    tbody.innerHTML = orders.length
      ? orders.map(orderRowHtml).join('')
      : `<tr><td colspan="6" class="empty-state">No orders found.</td></tr>`;

    tbody.querySelectorAll('button[data-action="manage"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.closest('tr').dataset.id);
        const { order } = await AdminApi.getOrder(id);
        openOrderModal(order);
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

function openOrderModal(order) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>Order #${order.order_number}</h2>
      <form id="order-form">${manageModalHtml(order)}</form>
      <p class="form-error" id="order-modal-error"></p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="order-modal-cancel" type="button">Cancel</button>
        <button class="btn btn-primary" type="submit" form="order-form">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#order-modal-cancel').addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await AdminApi.updateOrder(order.id, {
        status: fd.get('status'),
        tracking_number: fd.get('tracking_number'),
        notes: fd.get('notes'),
      });
      backdrop.remove();
      loadOrders();
    } catch (err) {
      const errorBox = backdrop.querySelector('#order-modal-error');
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });
}

async function init() {
  await guardAdminPage();
  loadOrders();
  document.getElementById('status-filter').addEventListener('change', loadOrders);

  // Deep-link support: /admin/html/orders.html?order=CMP-XXXX highlights nothing special
  // yet, but keeps the URL usable from the "new order" email CTA.
}

init();
