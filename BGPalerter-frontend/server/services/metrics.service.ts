import { getDb } from "../db";
import { performanceMetrics } from "../../drizzle/schema";
import { desc, gte } from "drizzle-orm";
import { logger } from "../_core/logger";

export interface MetricsSnapshot {
  bgpUpdateRate?: number;
  alertsGenerated?: number;
  apiLatency?: number;
  apiErrorRate?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  dbQueryTime?: number;
  dbConnections?: number;
}

/**
 * Record a performance metrics snapshot
 */
export async function recordMetrics(metrics: MetricsSnapshot): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      logger.warn("Cannot record metrics: database not available", {
        service: "metrics",
      });
      return false;
    }

    await db.insert(performanceMetrics).values({
      timestamp: new Date(),
      bgpUpdateRate: metrics.bgpUpdateRate,
      alertsGenerated: metrics.alertsGenerated,
      apiLatency: metrics.apiLatency,
      apiErrorRate: metrics.apiErrorRate?.toString(),
      cpuUsage: metrics.cpuUsage?.toString(),
      memoryUsage: metrics.memoryUsage?.toString(),
      dbQueryTime: metrics.dbQueryTime,
      dbConnections: metrics.dbConnections,
    });

    logger.debug("Metrics recorded", {
      service: "metrics",
      ...metrics,
    });

    return true;
  } catch (error) {
    logger.error("Failed to record metrics", {
      service: "metrics",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get metrics for the last N hours
 */
export async function getMetrics(hours: number = 24) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const since = new Date();
    since.setHours(since.getHours() - hours);

    return await db
      .select()
      .from(performanceMetrics)
      .where(gte(performanceMetrics.timestamp, since))
      .orderBy(desc(performanceMetrics.timestamp))
      .limit(1000); // Limit to prevent excessive data
  } catch (error) {
    logger.error("Failed to get metrics", {
      service: "metrics",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get current system metrics
 */
export async function getCurrentMetrics(): Promise<MetricsSnapshot> {
  const metrics: MetricsSnapshot = {};

  try {
    // Get memory usage
    const memUsage = process.memoryUsage();
    metrics.memoryUsage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    // CPU usage would require more complex tracking
    // For now, we'll leave it undefined and can add later if needed
    
    logger.debug("Current metrics collected", {
      service: "metrics",
      ...metrics,
    });
  } catch (error) {
    logger.error("Failed to collect current metrics", {
      service: "metrics",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return metrics;
}

/**
 * Get metrics summary statistics
 */
export async function getMetricsSummary(hours: number = 24) {
  const metrics = await getMetrics(hours);

  if (metrics.length === 0) {
    return {
      avgApiLatency: 0,
      avgMemoryUsage: 0,
      totalAlerts: 0,
      avgBgpUpdateRate: 0,
    };
  }

  const sum = metrics.reduce(
    (acc, m) => ({
      apiLatency: acc.apiLatency + (m.apiLatency || 0),
      memoryUsage: acc.memoryUsage + (parseFloat(m.memoryUsage || "0")),
      alerts: acc.alerts + (m.alertsGenerated || 0),
      bgpUpdates: acc.bgpUpdates + (m.bgpUpdateRate || 0),
    }),
    { apiLatency: 0, memoryUsage: 0, alerts: 0, bgpUpdates: 0 }
  );

  return {
    avgApiLatency: Math.round(sum.apiLatency / metrics.length),
    avgMemoryUsage: Math.round(sum.memoryUsage / metrics.length),
    totalAlerts: sum.alerts,
    avgBgpUpdateRate: Math.round(sum.bgpUpdates / metrics.length),
  };
}
