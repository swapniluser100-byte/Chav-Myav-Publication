// src/index.js
// Single Worker that serves the static site (via the [assets] binding configured
// in wrangler.toml) and handles every /api/* route. Keeping routing logic here
// small and declarative; the actual work lives in src/routes/*.

import { error } from './lib/response.js';
import { requireAdmin } from './lib/auth.js';

import { listBooks, getBookBySlug, listCategories } from './routes/books.js';
import { createOrder, getOrderByNumber } from './routes/orders.js';
import { verifyPayment, razorpayWebhook } from './routes/payments.js';

import { adminLogin, adminLogout, adminMe } from './routes/admin/auth.js';
import { getDashboard } from './routes/admin/dashboard.js';
import {
  adminListBooks,
  createBook,
  updateBook,
  deleteBook,
  adminListCategories,
  createCategory,
} from './routes/admin/books.js';
import { adminListOrders, adminGetOrder, adminUpdateOrder } from './routes/admin/orders.js';
import { adminListCustomers, adminGetCustomer } from './routes/admin/customers.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const method = request.method;
  const segments = path.split('/').filter(Boolean);

  // ---------- Public storefront routes ----------
  if (path === '/books' && method === 'GET') return listBooks(request, env);
  if (segments[0] === 'books' && segments[1] && method === 'GET') return getBookBySlug(request, env, segments[1]);
  if (path === '/categories' && method === 'GET') return listCategories(request, env);

  if (path === '/orders' && method === 'POST') return createOrder(request, env);
  if (segments[0] === 'orders' && segments[1] && method === 'GET') return getOrderByNumber(request, env, segments[1]);

  if (path === '/payments/verify' && method === 'POST') return verifyPayment(request, env);
  if (path === '/payments/webhook' && method === 'POST') return razorpayWebhook(request, env);

  // ---------- Admin auth (no session required) ----------
  if (path === '/admin/login' && method === 'POST') return adminLogin(request, env);
  if (path === '/admin/logout' && method === 'POST') return adminLogout();
  if (path === '/admin/me' && method === 'GET') return adminMe(request, env);

  // ---------- Everything else under /admin/* requires a valid session ----------
  if (segments[0] === 'admin') {
    const session = await requireAdmin(request, env);
    if (!session) return error('Unauthorized - please log in again', 401);

    if (path === '/admin/dashboard' && method === 'GET') return getDashboard(request, env);

    if (path === '/admin/books' && method === 'GET') return adminListBooks(request, env);
    if (path === '/admin/books' && method === 'POST') return createBook(request, env);
    if (segments[1] === 'books' && segments[2] && method === 'PUT') return updateBook(request, env, segments[2]);
    if (segments[1] === 'books' && segments[2] && method === 'DELETE') return deleteBook(request, env, segments[2]);

    if (path === '/admin/categories' && method === 'GET') return adminListCategories(request, env);
    if (path === '/admin/categories' && method === 'POST') return createCategory(request, env);

    if (path === '/admin/orders' && method === 'GET') return adminListOrders(request, env);
    if (segments[1] === 'orders' && segments[2] && method === 'GET') return adminGetOrder(request, env, segments[2]);
    if (segments[1] === 'orders' && segments[2] && method === 'PATCH') return adminUpdateOrder(request, env, segments[2]);

    if (path === '/admin/customers' && method === 'GET') return adminListCustomers(request, env);
    if (segments[1] === 'customers' && segments[2] && method === 'GET') return adminGetCustomer(request, env, segments[2]);
  }

  return error('Route not found', 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        const response = await handleApi(request, env);
        return withCors(response);
      } catch (err) {
        console.error(err);
        return withCors(error('Internal server error', 500));
      }
    }

    // Everything else is a static asset (HTML/CSS/JS/images from /public).
    return env.ASSETS.fetch(request);
  },
};
