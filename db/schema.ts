import {
  index,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const incidents = sqliteTable('incidents', {
  id: text('id').primaryKey(),
  district: text('district').notNull(),
  incidentType: text('incident_type').notNull(),
  severity: text('severity').notNull(),
  description: text('description').notNull(),
  reporter: text('reporter').notNull().default('anonymous'),
  status: text('status').notNull().default('open'),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_incidents_district_created').on(table.district, table.createdAt)]);

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  district: text('district').notNull(),
  risk: text('risk').notNull(),
  channel: text('channel').notNull(),
  language: text('language').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('sent'),
  acknowledgedAt: text('acknowledged_at'),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_alerts_district_created').on(table.district, table.createdAt)]);

export const observations = sqliteTable('observations', {
  id: text('id').primaryKey(),
  district: text('district').notNull(),
  temperature: real('temperature').notNull(),
  humidity: real('humidity').notNull(),
  htsi: real('htsi').notNull(),
  risk: text('risk').notNull(),
  source: text('source').notNull(),
  observedAt: text('observed_at').notNull(),
}, (table) => [index('idx_observations_district_time').on(table.district, table.observedAt)]);

export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey(),
  district: text('district').notNull(),
  horizonHours: real('horizon_hours').notNull(),
  probability: real('probability').notNull(),
  predictedClass: text('predicted_class').notNull(),
  source: text('source').notNull(),
  predictedAt: text('predicted_at').notNull(),
}, (table) => [index('idx_predictions_district_time').on(table.district, table.predictedAt)]);

export const warningEvents = sqliteTable('warning_events', {
  id: text('id').primaryKey(),
  dedupeKey: text('dedupe_key').notNull(),
  district: text('district').notNull(),
  horizonHours: real('horizon_hours').notNull(),
  risk: text('risk').notNull(),
  probability: real('probability').notNull(),
  htsi: real('htsi').notNull(),
  modelVersion: text('model_version').notNull(),
  status: text('status').notNull().default('active'),
  validAt: text('valid_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_warning_events_dedupe').on(table.dedupeKey),
  index('idx_warning_events_district_created').on(table.district, table.createdAt),
  index('idx_warning_events_status_created').on(table.status, table.createdAt),
]);

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  detailsJson: text('details_json').notNull().default('{}'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_audit_logs_created').on(table.createdAt),
  index('idx_audit_logs_entity').on(table.entityType, table.entityId),
]);

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: real('count').notNull(),
  windowStart: text('window_start').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userRoles = sqliteTable('user_roles', {
  userId: text('user_id').primaryKey(),
  role: text('role').notNull().default('officer'),
  updatedAt: text('updated_at').notNull(),
});
