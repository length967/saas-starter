import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Company table - top level entity
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  // Billing fields
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

// Projects under companies
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  companyProjectSlugIdx: uniqueIndex('company_project_slug_idx').on(table.companyId, table.slug),
}));

// Company members - maps users to companies with roles
export const companyMembers = pgTable('company_members', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  role: varchar('role', { length: 50 }).notNull(), // owner, billing_admin, admin, member
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (table) => ({
  companyUserIdx: uniqueIndex('company_user_idx').on(table.companyId, table.userId),
}));

// Project members - maps users to projects with roles
export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  role: varchar('role', { length: 50 }).notNull(), // project_owner, project_admin, developer, analyst
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (table) => ({
  projectUserIdx: uniqueIndex('project_user_idx').on(table.projectId, table.userId),
}));

// Agents - AI agents that can authenticate and perform actions
export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  // Authentication fields
  agentId: varchar('agent_id', { length: 255 }).notNull().unique(), // Unique identifier for the agent
  secretHash: text('secret_hash').notNull(), // Hashed JWT secret for this agent
  registrationToken: varchar('registration_token', { length: 255 }).unique(), // One-time registration token
  registrationTokenExpiresAt: timestamp('registration_token_expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  // Metadata
  capabilities: jsonb('capabilities').$type<string[]>().default([]),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  projectAgentSlugIdx: uniqueIndex('project_agent_slug_idx').on(table.projectId, table.slug),
  agentIdIdx: index('agent_id_idx').on(table.agentId),
}));

// Agent activity logs
export const agentActivityLogs = pgTable('agent_activity_logs', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id')
    .notNull()
    .references(() => agents.id),
  action: text('action').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// Update users table to remove team references
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Company invitations
export const companyInvitations = pgTable('company_invitations', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Project invitations
export const projectInvitations = pgTable('project_invitations', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  projects: many(projects),
  companyMembers: many(companyMembers),
  companyInvitations: many(companyInvitations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  projectMembers: many(projectMembers),
  agents: many(agents),
  projectInvitations: many(projectInvitations),
}));

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, {
    fields: [companyMembers.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyMembers.userId],
    references: [users.id],
  }),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  project: one(projects, {
    fields: [agents.projectId],
    references: [projects.id],
  }),
  activityLogs: many(agentActivityLogs),
}));

export const agentActivityLogsRelations = relations(agentActivityLogs, ({ one }) => ({
  agent: one(agents, {
    fields: [agentActivityLogs.agentId],
    references: [agents.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  companyMembers: many(companyMembers),
  projectMembers: many(projectMembers),
  companyInvitationsSent: many(companyInvitations),
  projectInvitationsSent: many(projectInvitations),
}));

// Type exports
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type NewCompanyMember = typeof companyMembers.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type AgentActivityLog = typeof agentActivityLogs.$inferSelect;
export type NewAgentActivityLog = typeof agentActivityLogs.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CompanyInvitation = typeof companyInvitations.$inferSelect;
export type NewCompanyInvitation = typeof companyInvitations.$inferInsert;
export type ProjectInvitation = typeof projectInvitations.$inferSelect;
export type NewProjectInvitation = typeof projectInvitations.$inferInsert;

// Role enums
export enum CompanyRole {
  OWNER = 'owner',
  BILLING_ADMIN = 'billing_admin',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum ProjectRole {
  PROJECT_OWNER = 'project_owner',
  PROJECT_ADMIN = 'project_admin',
  DEVELOPER = 'developer',
  ANALYST = 'analyst',
}

// Activity types for logging
export enum ActivityType {
  // User activities
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  // Company activities
  CREATE_COMPANY = 'CREATE_COMPANY',
  UPDATE_COMPANY = 'UPDATE_COMPANY',
  DELETE_COMPANY = 'DELETE_COMPANY',
  // Project activities
  CREATE_PROJECT = 'CREATE_PROJECT',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  // Member activities
  ADD_COMPANY_MEMBER = 'ADD_COMPANY_MEMBER',
  REMOVE_COMPANY_MEMBER = 'REMOVE_COMPANY_MEMBER',
  UPDATE_COMPANY_MEMBER_ROLE = 'UPDATE_COMPANY_MEMBER_ROLE',
  ADD_PROJECT_MEMBER = 'ADD_PROJECT_MEMBER',
  REMOVE_PROJECT_MEMBER = 'REMOVE_PROJECT_MEMBER',
  UPDATE_PROJECT_MEMBER_ROLE = 'UPDATE_PROJECT_MEMBER_ROLE',
  // Invitation activities
  INVITE_COMPANY_MEMBER = 'INVITE_COMPANY_MEMBER',
  INVITE_PROJECT_MEMBER = 'INVITE_PROJECT_MEMBER',
  ACCEPT_COMPANY_INVITATION = 'ACCEPT_COMPANY_INVITATION',
  ACCEPT_PROJECT_INVITATION = 'ACCEPT_PROJECT_INVITATION',
  // Agent activities
  CREATE_AGENT = 'CREATE_AGENT',
  UPDATE_AGENT = 'UPDATE_AGENT',
  DELETE_AGENT = 'DELETE_AGENT',
  REGISTER_AGENT = 'REGISTER_AGENT',
  AGENT_AUTHENTICATED = 'AGENT_AUTHENTICATED',
}