-- Sample seed data. Run AFTER schema.sql:
-- wrangler d1 execute chav-mayav-db --remote --file=./db/seed.sql
--
-- Category names are in English to match the storefront UI. Book titles and
-- author names stay in Marathi -- they're the actual product, like keeping
-- French novel titles in French on a bookstore selling French literature.

INSERT INTO categories (name, slug, description) VALUES
  ('Short Stories', 'short-stories', 'Collections of Marathi short fiction'),
  ('Novels', 'novels', 'Full-length Marathi novels'),
  ('Poetry', 'poetry', 'Marathi poetry collections'),
  ('Biography', 'biography', 'Biographies and memoirs');

INSERT INTO books (title, slug, author, category_id, description, price_paise, mrp_paise, stock, pages, cover_image_url, is_featured, is_active) VALUES
  ('मातीतील मोती', 'maatitil-moti', 'अनिल जोशी', 2, 'A moving novel set in rural Maharashtra, following one family across three generations.', 24900, 29900, 40, 212, '', 1, 1),
  ('पाऊसवाटा', 'paausvata', 'सुनीता देशपांडे', 3, 'A poetry collection reflecting on nature, memory, and relationships.', 14900, 17900, 60, 96, '', 1, 1),
  ('धुक्यातील पावलं', 'dhukyatil-paavlan', 'रमेश कुलकर्णी', 1, 'A collection of mysterious and emotionally resonant short stories.', 19900, 22900, 35, 168, '', 0, 1),
  ('माझी जडणघडण', 'majhi-jadanghadan', 'शारदा भोसले', 4, 'The memoir of an ordinary woman''s extraordinary journey of self-discovery.', 29900, 34900, 25, 240, '', 1, 1);

-- Create your admin login with: node scripts/create-admin.mjs "Your Name" you@example.com "your-password"
-- That script prints a ready-to-run wrangler d1 execute command for admin_users.
