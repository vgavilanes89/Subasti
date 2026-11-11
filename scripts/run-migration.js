// Usage: node scripts/run-migration.js sql/016_order_shipping_address.sql
// Runs each statement in the file against DATABASE_URL from .env.development.local.
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-migration.js <path-to-sql-file>');
  process.exit(1);
}

const envText = fs.readFileSync(path.join(__dirname, '..', '.env.development.local'), 'utf8');
const match = envText.match(/DATABASE_URL="?([^"\r\n]+)"?/);
if (!match) {
  console.error('DATABASE_URL not found in .env.development.local');
  process.exit(1);
}
const sql = neon(match[1]);

const statements = fs
  .readFileSync(file, 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

(async () => {
  for (const statement of statements) {
    await sql.query(statement);
    console.log('ok:', statement.split('\n')[0].slice(0, 80));
  }
  console.log('Migration complete.');
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
