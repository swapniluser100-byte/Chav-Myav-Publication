// src/routes/books.js
// Public, read-only endpoints used by the storefront.
import { ok, error } from '../lib/response.js';

/** GET /api/books?category=slug&featured=1&q=search */
export async function listBooks(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');
  const q = url.searchParams.get('q');

  let query = `
    SELECT b.id, b.title, b.slug, b.author, b.description, b.price_paise, b.mrp_paise,
           b.stock, b.cover_image_url, b.is_featured, c.name AS category_name, c.slug AS category_slug
    FROM books b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.is_active = 1
  `;
  const binds = [];

  if (category) {
    query += ` AND c.slug = ?`;
    binds.push(category);
  }
  if (featured) {
    query += ` AND b.is_featured = 1`;
  }
  if (q) {
    query += ` AND (b.title LIKE ? OR b.author LIKE ?)`;
    binds.push(`%${q}%`, `%${q}%`);
  }
  query += ` ORDER BY b.created_at DESC`;

  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return ok({ books: results });
}

/** GET /api/books/:slug */
export async function getBookBySlug(request, env, slug) {
  const book = await env.DB.prepare(
    `SELECT b.*, c.name AS category_name, c.slug AS category_slug
     FROM books b LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.slug = ? AND b.is_active = 1`
  )
    .bind(slug)
    .first();

  if (!book) return error('Book not found', 404);
  return ok({ book });
}

/** GET /api/categories */
export async function listCategories(request, env) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, slug, description FROM categories ORDER BY name`
  ).all();
  return ok({ categories: results });
}
