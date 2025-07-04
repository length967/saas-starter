import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// In Next.js, environment variables are automatically loaded from .env.local
// Only throw error if we're not in build time
if (!process.env.POSTGRES_URL && process.env.NODE_ENV !== 'production') {
  console.warn('POSTGRES_URL environment variable is not set. Using placeholder for build.');
}

const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
