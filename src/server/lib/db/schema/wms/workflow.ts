import { relations } from 'drizzle-orm';
import { boolean, integer, json, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant, user } from '../system';

// Workflows Table
export const workflows = pgTable('wms_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  workflowType: varchar('workflow_type', { length: 50, enum: ['inbound', 'outbound', 'cycle_counting'] }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => user.id),
  configuration: json('configuration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex('wms_workflows_tenant_name_idx').on(t.tenantId, t.name),
}));

// Workflow Steps Table
export const workflowSteps = pgTable('wms_workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id),
  name: varchar('name', { length: 100 }).notNull(),
  stepOrder: integer('step_order').notNull(),
  stepType: varchar('step_type', { length: 50, enum: ['manual', 'automated', 'validation'] }).notNull(),
  description: text('description'),
  isOptional: boolean('is_optional').default(false).notNull(),
  configuration: json('configuration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex('wms_workflow_steps_tenant_workflow_order_idx').on(t.tenantId, t.workflowId, t.stepOrder),
}));

// Relations
export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [workflows.tenantId],
    references: [tenant.id],
  }),
  createdByUser: one(user, {
    fields: [workflows.createdBy],
    references: [user.id],
  }),
  steps: many(workflowSteps),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  tenant: one(tenant, {
    fields: [workflowSteps.tenantId],
    references: [tenant.id],
  }),
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
}));

// Type definitions
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type NewWorkflowStep = typeof workflowSteps.$inferInsert;
