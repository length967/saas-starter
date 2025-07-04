import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as tcpSchema from './tcp-schema';

// Use DATABASE_URL if available (for Supabase), otherwise fall back to POSTGRES_URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

// Create a postgres client that works with Supabase's connection pooler
export const client = postgres(connectionString, {
  prepare: false, // Required for Supabase connection pooling
});

// Export the drizzle instance with TCP schema
export const db = drizzle(client, { schema: tcpSchema });

// Export all schema elements for easy access
export * from './tcp-schema';