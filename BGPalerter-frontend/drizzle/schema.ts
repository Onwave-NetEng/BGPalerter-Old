import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["viewer", "operator", "admin"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Configuration file versions for rollback capability
 */
export const fileVersions = mysqlTable("file_versions", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: int("userId").notNull(),
  commitMessage: text("commitMessage"),
  gitCommitHash: varchar("gitCommitHash", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileVersion = typeof fileVersions.$inferSelect;
export type InsertFileVersion = typeof fileVersions.$inferInsert;

/**
 * Audit log for all configuration changes
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "file_updated", "bgpalerter_restarted"
  resourceType: varchar("resourceType", { length: 50 }).notNull(), // e.g., "config_file", "system"
  resourceId: varchar("resourceId", { length: 255 }), // e.g., "config.yml"
  details: json("details"), // Additional context as JSON
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * System settings and configuration
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * BGPalerter monitoring cache for performance
 */
export const monitoringCache = mysqlTable("monitoring_cache", {
  id: int("id").autoincrement().primaryKey(),
  cacheKey: varchar("cacheKey", { length: 100 }).notNull().unique(),
  data: json("data").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonitoringCache = typeof monitoringCache.$inferSelect;
export type InsertMonitoringCache = typeof monitoringCache.$inferInsert;

/**
 * BGP alerts history for tracking and filtering
 */
export const bgpAlerts = mysqlTable("bgp_alerts", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g., "hijack", "rpki", "visibility", "path", "newprefix"
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).notNull(),
  prefix: varchar("prefix", { length: 50 }).notNull(),
  asn: varchar("asn", { length: 20 }),
  message: text("message").notNull(),
  details: json("details"), // Additional alert data
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedBy: int("acknowledgedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BgpAlert = typeof bgpAlerts.$inferSelect;
export type InsertBgpAlert = typeof bgpAlerts.$inferInsert;

/**
 * Notification settings for webhook integrations
 */
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Email settings
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  emailRecipients: json("emailRecipients").$type<string[]>(), // Array of email addresses
  
  // Microsoft Teams settings
  teamsEnabled: boolean("teamsEnabled").default(false).notNull(),
  teamsWebhookUrl: text("teamsWebhookUrl"),
  
  // Slack settings
  slackEnabled: boolean("slackEnabled").default(false).notNull(),
  slackWebhookUrl: text("slackWebhookUrl"),
  
  // Discord settings
  discordEnabled: boolean("discordEnabled").default(false).notNull(),
  discordWebhookUrl: text("discordWebhookUrl"),
  
  // Notification filters
  minSeverity: mysqlEnum("minSeverity", ["critical", "warning", "info"]).default("info").notNull(),
  alertTypes: json("alertTypes").$type<string[]>(), // Array of alert types to notify on
  
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

/**
 * Custom alert rules for advanced monitoring
 */
export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true).notNull(),
  
  // Rule conditions
  ruleType: mysqlEnum("ruleType", ["prefix_length", "as_path_pattern", "roa_mismatch", "announcement_rate", "custom"]).notNull(),
  conditions: json("conditions").notNull(), // Flexible JSON for rule conditions
  
  // Alert settings
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).notNull(),
  notificationChannels: json("notificationChannels").$type<string[]>(), // ["email", "teams", "slack", "discord"]
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastTriggered: timestamp("lastTriggered"),
  triggerCount: int("triggerCount").default(0).notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

/**
 * Prefix ownership records for hijack detection
 */
export const prefixOwnership = mysqlTable("prefix_ownership", {
  id: int("id").autoincrement().primaryKey(),
  prefix: varchar("prefix", { length: 50 }).notNull().unique(), // e.g., "203.0.113.0/24"
  asn: int("asn").notNull(), // Expected origin ASN
  description: text("description"),
  
  // Validation
  verified: boolean("verified").default(false).notNull(), // Manual verification flag
  source: varchar("source", { length: 50 }), // "manual", "whois", "irr", etc.
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSeen: timestamp("lastSeen"), // Last time prefix was announced correctly
});

export type PrefixOwnership = typeof prefixOwnership.$inferSelect;
export type InsertPrefixOwnership = typeof prefixOwnership.$inferInsert;

/**
 * Detected hijack incidents
 */
export const hijackIncidents = mysqlTable("hijack_incidents", {
  id: int("id").autoincrement().primaryKey(),
  prefix: varchar("prefix", { length: 50 }).notNull(),
  expectedAsn: int("expectedAsn").notNull(),
  announcedAsn: int("announcedAsn").notNull(),
  
  // Detection details
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  status: mysqlEnum("status", ["active", "resolved", "false_positive"]).default("active").notNull(),
  
  // Alert details
  alertId: int("alertId"), // Link to bgp_alerts
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).default("critical").notNull(),
  
  // Investigation
  notes: text("notes"),
  resolvedBy: int("resolvedBy"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HijackIncident = typeof hijackIncidents.$inferSelect;
export type InsertHijackIncident = typeof hijackIncidents.$inferInsert;

/**
 * Performance metrics for monitoring system health
 */
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // BGP update metrics
  bgpUpdateRate: int("bgpUpdateRate"), // Updates per minute
  alertsGenerated: int("alertsGenerated"), // Alerts created in last minute
  
  // API performance
  apiLatency: int("apiLatency"), // Average API response time in ms
  apiErrorRate: decimal("apiErrorRate", { precision: 5, scale: 2 }), // Error rate percentage
  
  // System resources
  cpuUsage: decimal("cpuUsage", { precision: 5, scale: 2 }), // CPU usage percentage
  memoryUsage: decimal("memoryUsage", { precision: 5, scale: 2 }), // Memory usage percentage
  
  // Database performance
  dbQueryTime: int("dbQueryTime"), // Average query time in ms
  dbConnections: int("dbConnections"), // Active database connections
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
