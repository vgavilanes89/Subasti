import { neon } from '@neondatabase/serverless';

let cached;

export function getSql() {
  if (!cached) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }
    cached = neon(connectionString);
  }
  return cached;
}
