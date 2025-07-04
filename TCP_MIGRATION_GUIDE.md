# TCP Agent Platform Migration Guide

This guide describes the authentication system updates to align with the TCP Agent Platform's requirements.

## Overview

The authentication system has been extended to support:
- JWT-based authentication for both users and agents
- Company → Project → User hierarchy with RBAC
- Agent authentication with registration tokens and per-agent JWT secrets
- Company roles: Owner, Billing Admin, Admin, Member
- Project roles: Project Owner, Project Admin, Developer, Analyst

## New Files Created

### Database Schema
- `/lib/db/tcp-schema.ts` - New schema with companies, projects, agents, and RBAC tables

### Authentication
- `/lib/auth/tcp-session.ts` - Enhanced session management for users and agents
- `/lib/auth/tcp-middleware.ts` - Middleware with RBAC support
- `/lib/auth/rbac.ts` - Role-based access control permissions

### API Endpoints
- `/app/api/agent/register/route.ts` - Agent registration endpoint
- `/app/api/agent/authenticate/route.ts` - Agent authentication endpoint
- `/app/api/agent/test/route.ts` - Example protected endpoint

### Actions & Queries
- `/app/(login)/tcp-actions.ts` - Updated authentication actions
- `/lib/db/tcp-queries.ts` - Database query helpers

### Middleware
- `/middleware.ts` - Updated to handle both user and agent authentication

## Migration Steps

### 1. Database Migration

Create a migration to add the new tables:

```sql
-- Companies table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_product_id TEXT,
  plan_name VARCHAR(50),
  subscription_status VARCHAR(20)
);

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX company_project_slug_idx ON projects(company_id, slug);

-- Company members
CREATE TABLE company_members (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX company_user_idx ON company_members(company_id, user_id);

-- Project members
CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX project_user_idx ON project_members(project_id, user_id);

-- Agents table
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  agent_id VARCHAR(255) NOT NULL UNIQUE,
  secret_hash TEXT NOT NULL,
  registration_token VARCHAR(255) UNIQUE,
  registration_token_expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  capabilities JSONB DEFAULT '[]',
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX project_agent_slug_idx ON agents(project_id, slug);
CREATE INDEX agent_id_idx ON agents(agent_id);

-- Agent activity logs
CREATE TABLE agent_activity_logs (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Update users table (remove role column)
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Company invitations
CREATE TABLE company_invitations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invited_by INTEGER NOT NULL REFERENCES users(id),
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL
);

-- Project invitations
CREATE TABLE project_invitations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invited_by INTEGER NOT NULL REFERENCES users(id),
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL
);
```

### 2. Data Migration

Migrate existing teams to companies:

```sql
-- Insert companies from teams
INSERT INTO companies (id, name, slug, created_at, updated_at, stripe_customer_id, stripe_subscription_id, stripe_product_id, plan_name, subscription_status)
SELECT id, name, LOWER(REPLACE(name, ' ', '-')), created_at, updated_at, stripe_customer_id, stripe_subscription_id, stripe_product_id, plan_name, subscription_status
FROM teams;

-- Migrate team members to company members
INSERT INTO company_members (company_id, user_id, role, joined_at)
SELECT team_id, user_id, 
  CASE role 
    WHEN 'owner' THEN 'owner'
    ELSE 'member'
  END,
  joined_at
FROM team_members;

-- Create default project for each company
INSERT INTO projects (company_id, name, slug)
SELECT id, name || ' Project', 'default'
FROM companies;

-- Add all company members as project members
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, cm.user_id,
  CASE cm.role
    WHEN 'owner' THEN 'project_owner'
    WHEN 'admin' THEN 'project_admin'
    ELSE 'developer'
  END
FROM projects p
JOIN company_members cm ON p.company_id = cm.company_id;
```

### 3. Update Import Statements

Replace imports in existing files:

```typescript
// Old
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { setSession } from '@/lib/auth/session';

// New
import { getUserContext } from '@/lib/auth/tcp-middleware';
import { validatedActionWithUser, validatedActionWithCompany, validatedActionWithProject } from '@/lib/auth/tcp-middleware';
import { setUserSession } from '@/lib/auth/tcp-session';
```

### 4. Update Authentication Flow

Replace sign-in/sign-up actions:

```typescript
// Use the new TCP actions
import { signIn, signUp, signOut } from '@/app/(login)/tcp-actions';
```

### 5. Agent Integration

To create and authenticate agents:

```typescript
// 1. Create an agent in the database
const agent = await db.insert(agents).values({
  projectId: projectId,
  name: 'My Agent',
  slug: 'my-agent',
  agentId: `agent_${randomBytes(16).toString('hex')}`,
  secretHash: await hashAgentSecret('temporary'),
  registrationToken: generateRegistrationToken(),
  registrationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
}).returning();

// 2. Agent registers using the registration token
const response = await fetch('/api/agent/register', {
  method: 'POST',
  body: JSON.stringify({
    registrationToken: agent.registrationToken,
    agentName: 'Production Agent v1'
  })
});

// Response contains:
// - agentId: Unique identifier
// - secret: One-time secret (store securely)
// - token: Initial JWT token

// 3. Agent authenticates to get new tokens
const authResponse = await fetch('/api/agent/authenticate', {
  method: 'POST',
  body: JSON.stringify({
    agentId: agentId,
    secret: secret
  })
});

// 4. Use the token in API requests
const apiResponse = await fetch('/api/agent/test', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## RBAC Permissions

### Company Permissions
- `company:read` - View company details
- `company:update` - Update company settings
- `company:delete` - Delete company
- `company:billing` - Manage billing
- `company:members:read` - View members
- `company:members:write` - Add/update members
- `company:members:delete` - Remove members
- `company:projects:create` - Create projects
- `company:projects:delete` - Delete projects
- `company:invites:create` - Create invitations
- `company:invites:revoke` - Revoke invitations

### Project Permissions
- `project:read` - View project details
- `project:update` - Update project settings
- `project:delete` - Delete project
- `project:members:read` - View members
- `project:members:write` - Add/update members
- `project:members:delete` - Remove members
- `project:agents:create` - Create agents
- `project:agents:read` - View agents
- `project:agents:update` - Update agents
- `project:agents:delete` - Delete agents
- `project:invites:create` - Create invitations
- `project:invites:revoke` - Revoke invitations
- `project:data:read` - Read project data
- `project:data:write` - Write project data
- `project:data:delete` - Delete project data

## Using the New Middleware

### Protected Actions

```typescript
// Action requiring company context
export const createProject = validatedActionWithCompany(
  projectSchema,
  'company:projects:create', // Required permission
  async (data, formData, context) => {
    // context.company is guaranteed to exist
    // context.user contains the authenticated user
  }
);

// Action requiring project context
export const updateAgent = validatedActionWithProject(
  agentSchema,
  'project:agents:update', // Required permission
  async (data, formData, context) => {
    // context.project is guaranteed to exist
    // context.company and context.user are also available
  }
);
```

### API Routes

```typescript
// User-only endpoint
export async function GET(request: NextRequest) {
  return withUserAuth(async (context) => {
    // context.user is authenticated
    return NextResponse.json({ user: context.user });
  })();
}

// Agent-only endpoint
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return withAgentAuth(async (context) => {
    // context.agent is authenticated
    return NextResponse.json({ agent: context.agent });
  })(authHeader);
}

// Either user or agent
export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return withAuth(async (context) => {
    if ('user' in context) {
      // User authenticated
    } else {
      // Agent authenticated
    }
    return NextResponse.json({ ok: true });
  })(authHeader);
}
```

## Testing

1. Test user authentication flow
2. Test company/project switching
3. Test RBAC permissions
4. Test agent registration and authentication
5. Test API endpoints with both user and agent tokens

## Rollback Plan

If issues arise:
1. Keep the original schema and files
2. Use feature flags to toggle between old and new auth
3. Gradually migrate users to the new system
4. Monitor for authentication errors

## Next Steps

1. Update UI components to show company/project context
2. Add company/project switchers
3. Create agent management UI
4. Update all existing actions to use new middleware
5. Add telemetry for authentication events