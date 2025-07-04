# TCP Agent Platform - Supabase Migration Guide

This guide explains how to connect to the TCP Agent Platform's existing Supabase instance.

## Overview

The TCP Agent Platform uses Supabase with the following configuration:
- Project Reference: `qalcyeaxuivvgqukrpzt`
- 26 existing migrations with a comprehensive schema
- Multi-tenant architecture with companies as the root entity
- Advanced features including agents, telemetry, and transfers

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and update with your Supabase credentials:

```bash
cp .env.example .env
```

Update the following values in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for server-side operations)
- `DATABASE_URL`: Direct database connection string
- `POSTGRES_URL`: Same as DATABASE_URL (for backward compatibility)

### 2. Using the TCP Schema

The TCP Agent Platform schema is defined in `lib/db/tcp-schema.ts`. To use it:

```typescript
import { db } from '@/lib/db/supabase-drizzle';
import { companies, projects, agents } from '@/lib/db/tcp-schema';

// Example: Query companies
const allCompanies = await db.select().from(companies);

// Example: Query projects for a company
const companyProjects = await db.select()
  .from(projects)
  .where(eq(projects.companyId, companyId));
```

### 3. Using Supabase Client

For client-side operations:

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('companies')
  .select('*');
```

For server-side operations:

```typescript
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Regular client (respects RLS)
const supabase = await createClient();

// Service client (bypasses RLS - use with caution)
const supabaseAdmin = await createServiceClient();
```

### 4. Authentication Integration

The TCP Agent Platform uses Supabase Auth. Update your middleware to use Supabase:

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

### 5. Multi-Tenant Considerations

The TCP Agent Platform uses a multi-tenant architecture with these key concepts:

1. **Companies**: Root tenant entity
2. **Projects**: Belong to companies
3. **Users**: Can belong to multiple companies with different roles
4. **RLS Policies**: Enforce tenant isolation at the database level

Always include company context in your queries:

```typescript
// Bad - no tenant isolation
const allAgents = await db.select().from(agents);

// Good - tenant-scoped query
const companyAgents = await db.select()
  .from(agents)
  .innerJoin(projects, eq(agents.projectId, projects.id))
  .where(eq(projects.companyId, currentCompanyId));
```

### 6. Type Safety

The TCP schema provides full TypeScript support:

```typescript
import type { Company, Project, Agent, User } from '@/lib/db/tcp-schema';

// Type-safe operations
const createProject = async (project: NewProject): Promise<Project> => {
  const [newProject] = await db.insert(projects).values(project).returning();
  return newProject;
};
```

## Migration Checklist

- [ ] Update `.env` with Supabase credentials
- [ ] Replace auth logic to use Supabase Auth
- [ ] Update queries to use TCP schema
- [ ] Implement proper multi-tenant queries
- [ ] Test RLS policies are working correctly
- [ ] Update API routes to use Supabase client
- [ ] Migrate user sessions to Supabase Auth

## Important Notes

1. **Do not run migrations** - The TCP Agent Platform already has 26 migrations applied
2. **Respect RLS policies** - Always use the appropriate client (regular vs service)
3. **Multi-tenant safety** - Always scope queries by company/project
4. **Use existing schema** - Don't modify the database schema without coordination

## Troubleshooting

### Connection Issues
- Verify your Supabase URL and keys are correct
- Check if your IP is allowlisted in Supabase settings
- Ensure you're using the correct connection string format

### RLS Policy Errors
- Make sure you're authenticated when accessing protected tables
- Use the service client for administrative operations
- Check if your user has the correct role/permissions

### Type Errors
- Run `pnpm run db:generate` to update type definitions
- Ensure you're importing from the correct schema file
- Check that your queries match the expected types