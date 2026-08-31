import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
