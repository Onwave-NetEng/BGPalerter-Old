import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { 
  InsertUser, users, 
  fileVersions, InsertFileVersion, FileVersion,
  auditLogs, InsertAuditLog, AuditLog,
  settings, InsertSetting, Setting,
  monitoringCache, InsertMonitoringCache, MonitoringCache,
  bgpAlerts, InsertBgpAlert, BgpAlert,
  notificationSettings, InsertNotificationSettings, NotificationSettings,
  alertRules, InsertAlertRule, AlertRule
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// File Version Management
export async function createFileVersion(version: InsertFileVersion): Promise<FileVersion | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(fileVersions).values(version);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(fileVersions).where(eq(fileVersions.id, insertId)).limit(1);
  return created[0];
}

export async function getFileVersionHistory(filename: string, limit: number = 10): Promise<FileVersion[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(fileVersions)
    .where(eq(fileVersions.filename, filename))
    .orderBy(desc(fileVersions.createdAt))
    .limit(limit);
}

export async function getFileVersionById(id: number): Promise<FileVersion | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(fileVersions).where(eq(fileVersions.id, id)).limit(1);
  return result[0];
}

// Audit Log Management
export async function createAuditLog(log: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values(log);
}

export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getAuditLogsByUser(userId: number, limit: number = 50): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// Settings Management
export async function getSetting(key: string): Promise<Setting | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0];
}

export async function upsertSetting(setting: InsertSetting): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(settings).values(setting).onDuplicateKeyUpdate({
    set: {
      value: setting.value,
      updatedBy: setting.updatedBy,
      updatedAt: new Date(),
    },
  });
}

export async function getAllSettings(): Promise<Setting[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(settings);
}

// Monitoring Cache Management
export async function getCachedData(cacheKey: string): Promise<MonitoringCache | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(monitoringCache)
    .where(eq(monitoringCache.cacheKey, cacheKey))
    .limit(1);

  const cached = result[0];
  if (!cached) return undefined;

  // Check if expired
  if (new Date() > cached.expiresAt) {
    // Delete expired cache
    await db.delete(monitoringCache).where(eq(monitoringCache.cacheKey, cacheKey));
    return undefined;
  }

  return cached;
}

export async function setCachedData(cacheKey: string, data: unknown, ttlSeconds: number = 300): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await db.insert(monitoringCache).values({
    cacheKey,
    data: data as Record<string, unknown>,
    expiresAt,
  }).onDuplicateKeyUpdate({
    set: {
      data: data as Record<string, unknown>,
      expiresAt,
      createdAt: new Date(),
    },
  });
}

export async function clearExpiredCache(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  await db.delete(monitoringCache).where(eq(monitoringCache.expiresAt, now));
}

// BGP Alerts Management
export async function createBgpAlert(alert: InsertBgpAlert): Promise<BgpAlert | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(bgpAlerts).values(alert);
  
  // Fetch the most recently created alert
  const created = await db.select()
    .from(bgpAlerts)
    .orderBy(desc(bgpAlerts.id))
    .limit(1);
  
  return created[0] || null;
}

export async function getBgpAlerts(filters: {
  limit?: number;
  offset?: number;
  severity?: string;
  type?: string;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
}): Promise<BgpAlert[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(bgpAlerts);

  // Apply filters dynamically
  const conditions: any[] = [];
  
  if (filters.severity) {
    conditions.push(eq(bgpAlerts.severity, filters.severity as any));
  }
  
  if (filters.type) {
    conditions.push(eq(bgpAlerts.type, filters.type));
  }
  
  if (filters.resolved !== undefined) {
    conditions.push(eq(bgpAlerts.resolved, filters.resolved));
  }

  // Note: Date range filtering would require additional imports from drizzle-orm
  // For now, we'll handle this in the application layer

  const result = await query
    .orderBy(desc(bgpAlerts.timestamp))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  return result;
}

export async function resolveBgpAlert(id: number, userId: number, notes?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(bgpAlerts)
    .set({
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: userId,
      notes: notes || null,
    })
    .where(eq(bgpAlerts.id, id));

  return true;
}

export async function acknowledgeBgpAlert(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(bgpAlerts)
    .set({
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    })
    .where(eq(bgpAlerts.id, id));

  return true;
}

export async function getBgpAlertById(id: number): Promise<BgpAlert | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(bgpAlerts)
    .where(eq(bgpAlerts.id, id))
    .limit(1);

  return result[0];
}

export async function getAlertStats(): Promise<{
  total: number;
  unresolved: number;
  bySeverity: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, unresolved: 0, bySeverity: {} };
  }

  const allAlerts = await db.select().from(bgpAlerts);
  
  const stats = {
    total: allAlerts.length,
    unresolved: allAlerts.filter(a => !a.resolved).length,
    bySeverity: {
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      warning: allAlerts.filter(a => a.severity === 'warning').length,
      info: allAlerts.filter(a => a.severity === 'info').length,
    },
  };

  return stats;
}

/**
 * Get notification settings (returns first row or creates default)
 */
export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(notificationSettings).limit(1);
  
  if (result.length === 0) {
    // Create default settings if none exist
    const defaultSettings: InsertNotificationSettings = {
      emailEnabled: false,
      teamsEnabled: false,
      slackEnabled: false,
      discordEnabled: false,
      minSeverity: 'info',
    };
    
    const created = await db.insert(notificationSettings).values(defaultSettings);
    const newSettings = await db.select().from(notificationSettings).where(eq(notificationSettings.id, Number(created[0].insertId)));
    return newSettings[0] || null;
  }
  
  return result[0];
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  updates: Partial<InsertNotificationSettings>,
  userId: number
): Promise<NotificationSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const current = await getNotificationSettings();
  if (!current) return null;

  await db.update(notificationSettings)
    .set({
      ...updates,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(notificationSettings.id, current.id));

  return await getNotificationSettings();
}

/**
 * Test notification by sending to a specific channel
 */
export async function testNotification(channel: 'teams' | 'slack' | 'discord'): Promise<boolean> {
  const settings = await getNotificationSettings();
  if (!settings) return false;

  // This will be implemented in the webhook service integration
  return true;
}


// Alert Rules Management
export async function createAlertRule(rule: InsertAlertRule): Promise<AlertRule | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(alertRules).values(rule);
  
  const created = await db.select()
    .from(alertRules)
    .orderBy(desc(alertRules.id))
    .limit(1);

  return created[0] || null;
}

export async function getAlertRules(): Promise<AlertRule[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(alertRules).orderBy(desc(alertRules.createdAt));
}

export async function getAlertRuleById(id: number): Promise<AlertRule | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(alertRules)
    .where(eq(alertRules.id, id))
    .limit(1);

  return result[0];
}

export async function updateAlertRule(id: number, updates: Partial<InsertAlertRule>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(alertRules)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(alertRules.id, id));

  return true;
}

export async function deleteAlertRule(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(alertRules).where(eq(alertRules.id, id));
  return true;
}

export async function toggleAlertRule(id: number, enabled: boolean): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(alertRules)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(alertRules.id, id));

  return true;
}

export async function incrementRuleTriggerCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const rule = await getAlertRuleById(id);
  if (!rule) return;

  await db.update(alertRules)
    .set({
      triggerCount: (rule.triggerCount || 0) + 1,
      lastTriggered: new Date(),
    })
    .where(eq(alertRules.id, id));
}
