// public/admin/js/admin-api.js
const ADMIN_API_BASE = '/api/admin';

async function adminRequest(path, options = {}) {
  const res = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    if (!location.pathname.endsWith('/login.html')) location.href = '/admin/html/login.html';
    throw new Error('अनधिकृत');
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'काहीतरी चूक झाली');
  }
  return data;
}

const AdminApi = {
  login: (email, password) => adminRequest('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => adminRequest('/logout', { method: 'POST' }),
  me: () => adminRequest('/me'),

  getDashboard: () => adminRequest('/dashboard'),

  getBooks: () => adminRequest('/books'),
  createBook: (book) => adminRequest('/books', { method: 'POST', body: JSON.stringify(book) }),
  updateBook: (id, book) => adminRequest(`/books/${id}`, { method: 'PUT', body: JSON.stringify(book) }),
  deleteBook: (id) => adminRequest(`/books/${id}`, { method: 'DELETE' }),

  getCategories: () => adminRequest('/categories'),
  createCategory: (cat) => adminRequest('/categories', { method: 'POST', body: JSON.stringify(cat) }),

  getOrders: (status) => adminRequest(`/orders${status ? `?status=${status}` : ''}`),
  getOrder: (id) => adminRequest(`/orders/${id}`),
  updateOrder: (id, patch) => adminRequest(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  getCustomers: () => adminRequest('/customers'),
  getCustomer: (id) => adminRequest(`/customers/${id}`),
};

function formatRupees(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusLabel(status) {
  const map = {
    pending_payment: 'पेमेंट प्रलंबित',
    paid: 'पेमेंट झाले',
    shipped: 'पाठवले',
    delivered: 'पोहोचले',
    cancelled: 'रद्द',
    payment_failed: 'पेमेंट अयशस्वी',
  };
  return map[status] || status;
}

/** Call at the top of every protected admin page. Redirects to login on failure. */
async function guardAdminPage() {
  try {
    const { admin } = await AdminApi.me();
    document.querySelectorAll('[data-admin-name]').forEach((el) => (el.textContent = admin.name));
    return admin;
  } catch {
    location.href = '/admin/html/login.html';
    return null;
  }
}

document.addEventListener('click', (e) => {
  if (e.target.matches('[data-logout]')) {
    AdminApi.logout().finally(() => (location.href = '/admin/html/login.html'));
  }
});
