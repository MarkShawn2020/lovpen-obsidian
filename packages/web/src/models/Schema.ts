import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

// Need a database for production? Check out https://www.prisma.io/?via=nextjsboilerplate
// Tested and compatible with Next.js Boilerplate

export const counterSchema = pgTable('counter', {
  id: serial('id').primaryKey(),
  count: integer('count').default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const knowledgeItemsSchema = pgTable('knowledge_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  sourcePlatform: varchar('source_platform', { length: 100 }).notNull(),
  sourceId: varchar('source_id', { length: 255 }),
  contentType: varchar('content_type', { length: 50 }).notNull(),
  title: text('title'),
  content: text('content'),
  rawContent: jsonb('raw_content'),
  metadata: jsonb('metadata').default('{}').notNull(),
  embedding: jsonb('embedding'),
  tags: jsonb('tags').default('[]').notNull(),
  processingStatus: varchar('processing_status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const platformIntegrationsSchema = pgTable('platform_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  platformType: varchar('platform_type', { length: 100 }).notNull(),
  authData: jsonb('auth_data'),
  syncSettings: jsonb('sync_settings'),
  lastSync: timestamp('last_sync', { mode: 'date' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const processingJobsSchema = pgTable('processing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  knowledgeItemId: uuid('knowledge_item_id').references(() => knowledgeItemsSchema.id),
  jobType: varchar('job_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
