// src/routes/admin/books.js
import { ok, error } from '../../lib/response.js';

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0900-\u097F-]+/g, '')
    .replace(/-+/g, '-');
}

/** GET /api/admin/books — includes inactive books, unlike the public endpoint */
export async function adminListBooks(request, env) {
  const { results } = await env.DB.prepare(
    `SELECT b.*, c.name AS category_name FROM books b LEFT JOIN categories c ON c.id = b.category_id ORDER BY b.created_at DESC`
  ).all();
  return ok({ books: results });
}

/** POST /api/admin/books */
export async function createBook(request, env) {
  const b = await request.json().catch(() => null);
  if (!b || !b.title || !b.author || b.price_paise == null) return error('Title, author, and price are required', 400);

  const slug = b.slug ? slugify(b.slug) : slugify(b.title);
  const result = await env.DB.prepare(
    `INSERT INTO books (title, slug, author, category_id, description, price_paise, mrp_paise, stock, pages, isbn, cover_image_url, is_featured, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      b.title,
      slug,
      b.author,
      b.category_id || null,
      b.description || null,
      b.price_paise,
      b.mrp_paise || null,
      b.stock || 0,
      b.pages || null,
      b.isbn || null,
      b.cover_image_url || null,
      b.is_featured ? 1 : 0,
      b.is_active === false ? 0 : 1
    )
    .run();

  return ok({ id: result.meta.last_row_id, slug });
}

/** PUT /api/admin/books/:id */
export async function updateBook(request, env, id) {
  const b = await request.json().catch(() => null);
  if (!b) return error('Invalid request', 400);

  await env.DB.prepare(
    `UPDATE books SET title=?, author=?, category_id=?, description=?, price_paise=?, mrp_paise=?, stock=?, pages=?, isbn=?, cover_image_url=?, is_featured=?, is_active=?, updated_at=datetime('now')
     WHERE id = ?`
  )
    .bind(
      b.title,
      b.author,
      b.category_id || null,
      b.description || null,
      b.price_paise,
      b.mrp_paise || null,
      b.stock || 0,
      b.pages || null,
      b.isbn || null,
      b.cover_image_url || null,
      b.is_featured ? 1 : 0,
      b.is_active === false ? 0 : 1,
      id
    )
    .run();

  return ok({});
}

/** DELETE /api/admin/books/:id — soft delete (keeps order history intact) */
export async function deleteBook(request, env, id) {
  await env.DB.prepare(`UPDATE books SET is_active = 0 WHERE id = ?`).bind(id).run();
  return ok({});
}

/** GET /api/admin/categories */
export async function adminListCategories(request, env) {
  const { results } = await env.DB.prepare(`SELECT * FROM categories ORDER BY name`).all();
  return ok({ categories: results });
}

/** POST /api/admin/categories */
export async function createCategory(request, env) {
  const c = await request.json().catch(() => null);
  if (!c || !c.name) return error('Name is required', 400);
  const slug = c.slug ? slugify(c.slug) : slugify(c.name);
  const result = await env.DB.prepare(`INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)`)
    .bind(c.name, slug, c.description || null)
    .run();
  return ok({ id: result.meta.last_row_id, slug });
}
