#!/usr/bin/env node
// scripts/create-admin.mjs
// Generates the SQL to create (or reset) an admin console login.
// Hash format matches src/lib/auth.js exactly: "iterations:saltHex:hashHex" (PBKDF2-SHA256).
//
// Usage:
//   node scripts/create-admin.mjs "Owner Name" owner@chavmayav.com "A-strong-password"
//
// Then run the printed command, e.g.:
//   wrangler d1 execute chav-mayav-db --remote --command "INSERT INTO ..."

import crypto from 'node:crypto';

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node scripts/create-admin.mjs "Owner Name" owner@chavmayav.com "A-strong-password"');
  process.exit(1);
}

const ITERATIONS = 100000;
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const stored = `${ITERATIONS}:${salt.toString('hex')}:${hash.toString('hex')}`;

const sql = `INSERT INTO admin_users (name, email, password_hash, role) VALUES ('${name.replace(/'/g, "''")}', '${email.replace(/'/g, "''")}', '${stored}', 'admin');`;

console.log('\nRun this against your D1 database:\n');
console.log(`wrangler d1 execute chav-mayav-db --remote --command "${sql.replace(/"/g, '\\"')}"\n`);
console.log('(Drop --remote for a local dev database.)\n');
