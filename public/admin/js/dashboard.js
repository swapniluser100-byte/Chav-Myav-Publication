// public/admin/js/dashboard.js
async function load() {
  await guardAdminPage();
  try {
    const { stats, recentOrders, recentEmails } = await AdminApi.getDashboard();

    document.getElementById('stat-grid').innerHTML = `
      <div class="stat-card"><div class="label">Total Orders</div><div class="value">${stats.total_orders}</div></div>
      <div class="stat-card"><div class="label">Total Revenue</div><div class="value">${formatRupees(stats.total_revenue)}</div></div>
      <div class="stat-card"><div class="label">Pending Shipment</div><div class="value">${stats.pending_orders}</div></div>
      <div class="stat-card"><div class="label">Active Books</div><div class="value">${stats.total_books}</div></div>
      <div class="stat-card"><div class="label">Low Stock</div><div class="value">${stats.low_stock}</div></div>
      <div class="stat-card"><div class="label">Total Customers</div><div class="value">${stats.total_customers}</div></div>
    `;

    document.getElementById('recent-orders').innerHTML = recentOrders.length
      ? `<table class="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            ${recentOrders
              .map(
                (o) => `<tr>
                  <td>${o.order_number}</td>
                  <td>${o.shipping_name}</td>
                  <td><span class="status-pill status-${o.status}">${statusLabel(o.status)}</span></td>
                  <td>${formatRupees(o.total_paise)}</td>
                  <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>`
      : `<p class="empty-state">No orders yet.</p>`;

    document.getElementById('recent-emails').innerHTML = recentEmails.length
      ? `<table class="admin-table">
          <thead><tr><th>Recipient</th><th>Subject</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            ${recentEmails
              .map(
                (m) => `<tr>
                  <td>${m.to_email}</td>
                  <td>${m.subject}</td>
                  <td>${m.type}</td>
                  <td><span class="status-pill status-${m.status === 'sent' ? 'paid' : 'cancelled'}">${m.status}</span></td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>`
      : `<p class="empty-state">No emails sent yet.</p>`;
  } catch (err) {
    console.error(err);
  }
}

load();
