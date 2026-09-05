// public/admin/js/dashboard.js
async function load() {
  await guardAdminPage();
  try {
    const { stats, recentOrders, recentEmails } = await AdminApi.getDashboard();

    document.getElementById('stat-grid').innerHTML = `
      <div class="stat-card"><div class="label">एकूण ऑर्डर्स</div><div class="value">${stats.total_orders}</div></div>
      <div class="stat-card"><div class="label">एकूण महसूल</div><div class="value">${formatRupees(stats.total_revenue)}</div></div>
      <div class="stat-card"><div class="label">पाठवायच्या प्रलंबित</div><div class="value">${stats.pending_orders}</div></div>
      <div class="stat-card"><div class="label">सक्रिय पुस्तके</div><div class="value">${stats.total_books}</div></div>
      <div class="stat-card"><div class="label">कमी साठा</div><div class="value">${stats.low_stock}</div></div>
      <div class="stat-card"><div class="label">एकूण ग्राहक</div><div class="value">${stats.total_customers}</div></div>
    `;

    document.getElementById('recent-orders').innerHTML = recentOrders.length
      ? `<table class="admin-table">
          <thead><tr><th>ऑर्डर</th><th>ग्राहक</th><th>स्थिती</th><th>रक्कम</th><th>दिनांक</th></tr></thead>
          <tbody>
            ${recentOrders
              .map(
                (o) => `<tr>
                  <td>${o.order_number}</td>
                  <td>${o.shipping_name}</td>
                  <td><span class="status-pill status-${o.status}">${statusLabel(o.status)}</span></td>
                  <td>${formatRupees(o.total_paise)}</td>
                  <td>${new Date(o.created_at).toLocaleDateString('mr-IN')}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>`
      : `<p class="empty-state">अजून कोणतीही ऑर्डर नाही.</p>`;

    document.getElementById('recent-emails').innerHTML = recentEmails.length
      ? `<table class="admin-table">
          <thead><tr><th>प्राप्तकर्ता</th><th>विषय</th><th>प्रकार</th><th>स्थिती</th></tr></thead>
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
      : `<p class="empty-state">अजून कोणताही ईमेल पाठवला गेला नाही.</p>`;
  } catch (err) {
    console.error(err);
  }
}

load();
