-- Chav Myav Publication -- D1 Database Schema
-- Run with: wrangler d1 execute chav-mayav-db --remote --file=./db/schema.sql

PRAGMA foreign_keys = ON;

-- ==========================================================
-- Categories (e.g. Short Stories, Novels, Poetry, Biography)
-- ==========================================================
CREATE TABLE IF NOT EXISTS categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ==========================================================
-- Books
-- ==========================================================
CREATE TABLE IF NOT EXISTS books (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,             -- Marathi title
  slug            TEXT NOT NULL UNIQUE,
  author          TEXT NOT NULL,
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description     TEXT,
  price_paise     INTEGER NOT NULL,          -- price stored in paise (INR minor unit)
  mrp_paise       INTEGER,                   -- optional strike-through price
  stock           INTEGER NOT NULL DEFAULT 0,
  pages           INTEGER,
  isbn            TEXT,
  cover_image_url TEXT,
  is_featured     INTEGER NOT NULL DEFAULT 0, -- 0/1
  is_active       INTEGER NOT NULL DEFAULT 1,  -- 0/1, soft hide from store
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_active ON books(is_active);

-- ==========================================================
-- Customers
-- Email is optional (no emails are sent by this app) -- phone is the
-- primary contact method for Cash on Delivery orders.
-- ==========================================================
CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,                 -- nullable; SQLite allows multiple NULLs
  phone         TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  state         TEXT,
  pincode       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ==========================================================
-- Orders
-- Cash on Delivery only -- no payment gateway fields. Stock is
-- decremented immediately when the order is placed.
-- ==========================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number        TEXT NOT NULL UNIQUE,   -- human friendly, e.g. CMP-000123
  customer_id         INTEGER NOT NULL REFERENCES customers(id),
  status              TEXT NOT NULL DEFAULT 'pending',
                      -- pending | confirmed | shipped | delivered | cancelled
  subtotal_paise      INTEGER NOT NULL,
  shipping_paise      INTEGER NOT NULL DEFAULT 0,
  total_paise         INTEGER NOT NULL,       -- amount to collect on delivery
  shipping_name       TEXT NOT NULL,
  shipping_phone      TEXT NOT NULL,
  shipping_address1   TEXT NOT NULL,
  shipping_address2   TEXT,
  shipping_city       TEXT NOT NULL,
  shipping_state      TEXT NOT NULL,
  shipping_pincode    TEXT NOT NULL,
  tracking_number     TEXT,
  notes               TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ==========================================================
-- Order line items (snapshot of price/title at time of purchase)
-- ==========================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id     INTEGER REFERENCES books(id),
  title       TEXT NOT NULL,
  unit_price_paise INTEGER NOT NULL,
  quantity    INTEGER NOT NULL,
  line_total_paise INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ==========================================================
-- Admin users (console login)
-- ==========================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,   -- PBKDF2 hash, format: iterations:saltHex:hashHex
  role           TEXT NOT NULL DEFAULT 'admin', -- admin | staff
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
