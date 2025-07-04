import type { Config } from 'drizzle-kit';

// Separate Drizzle config for TCP Agent Platform schema
// This connects to the existing Supabase database
export default {
  schema: './lib/db/tcp-schema.ts',
  out: './lib/db/tcp-migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL!,
  },
} satisfies Config;