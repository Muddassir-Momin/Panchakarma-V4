'use strict';
/**
 * database/migrate.js — Run all SQL migrations in order
 * Usage:  node database/migrate.js
 */
require('dotenv').config();
const mysql  = require('mysql2/promise');
const fs     = require('fs');
const path   = require('path');

async function runMigrations() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  });

  console.log('🌿 Panchakarma — Running Migrations\n');

  // Create DB if not exists
  await conn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'panchakarma_db'}\` ` +
    `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.execute(`USE \`${process.env.DB_NAME || 'panchakarma_db'}\``);
  console.log('✅ Database ready\n');

  const migrDir = path.join(__dirname, 'migrations');
  const files   = fs.readdirSync(migrDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrDir, file), 'utf8');
    // Split on semicolons to run each statement separately
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await conn.execute(stmt);
    }
    console.log(`  ✅ ${file}`);
  }

  console.log('\n🎉 All migrations completed!');
  console.log('Next:  node database/seeds/run.js');
  await conn.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
