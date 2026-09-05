// public/admin/js/customers.js
function customerRowHtml(c) {
  return `
    <tr>
      <td>${c.name}<br/><small style="color:var(--muted);">${c.email}</small></td>
      <td>${c.phone}</td>
      <td>${c.city || '—'}, ${c.state || ''}</td>
      <td>${c.order_count}</td>
      <td>${formatRupees(c.lifetime_value_paise)}</td>
    </tr>
  `;
}

async function loadCustomers() {
  const tbody = document.getElementById('customers-tbody');
  try {
    const { customers } = await AdminApi.getCustomers();
    tbody.innerHTML = customers.length
      ? customers.map(customerRowHtml).join('')
      : `<tr><td colspan="5" class="empty-state">अजून कोणताही ग्राहक नाही.</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${err.message}</td></tr>`;
  }
}

(async function init() {
  await guardAdminPage();
  loadCustomers();
})();
