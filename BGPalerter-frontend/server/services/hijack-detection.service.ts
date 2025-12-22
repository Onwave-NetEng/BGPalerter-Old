import { getDb } from "../db";
import { logger } from "../_core/logger";
import { sendAlertNotification } from "./webhook.service";

export interface PrefixOwnership {
  id: number;
  prefix: string;
  expectedAsn: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HijackAlert {
  prefix: string;
  announcedAsn: number;
  expectedAsn: number;
  detectedAt: Date;
  severity: "critical";
}

/**
 * Check if a prefix announcement matches expected ownership
 */
export async function checkPrefixOwnership(
  prefix: string,
  announcedAsn: number
): Promise<HijackAlert | null> {
  const db = await getDb();
  if (!db) {
    logger.error("Database not available", { service: "hijack-detection" });
    return null;
  }

  try {
    // Query prefix ownership using raw SQL to avoid Drizzle type issues
    const ownership = await db.$client.execute(
      "SELECT * FROM prefix_ownership WHERE prefix = ? LIMIT 1",
      [prefix]
    );

    const rows = (ownership as any)[0] as any[];
    if (rows.length === 0) {
      // No ownership record - not monitoring this prefix
      return null;
    }

    const record = rows[0];
    const expectedAsn = record.expected_asn;

    if (announcedAsn !== expectedAsn) {
      logger.warn("Potential prefix hijack detected", {
        service: "hijack-detection",
        prefix,
        announcedAsn,
        expectedAsn,
      });

      return {
        prefix,
        announcedAsn,
        expectedAsn,
        detectedAt: new Date(),
        severity: "critical",
      };
    }

    return null;
  } catch (error) {
    logger.error("Error checking prefix ownership", {
      service: "hijack-detection",
      prefix,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Create alert for detected hijack and send notifications
 */
export async function createHijackAlert(
  hijack: HijackAlert,
  userId: number
): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    logger.error("Database not available", { service: "hijack-detection" });
    return null;
  }

  try {
    // Insert alert using raw SQL
    const result = await db.$client.execute(
      `INSERT INTO bgp_alerts (
        type, severity, message, details, timestamp, resolved, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "hijack",
        hijack.severity,
        `Potential prefix hijack detected: ${hijack.prefix}`,
        JSON.stringify({
          prefix: hijack.prefix,
          announcedAsn: hijack.announcedAsn,
          expectedAsn: hijack.expectedAsn,
          detectedAt: hijack.detectedAt.toISOString(),
        }),
        hijack.detectedAt,
        false,
        userId,
      ]
    );

    const insertResult = (result as any)[0] as any;
    const alertId = insertResult.insertId;

    logger.info("Hijack alert created", {
      service: "hijack-detection",
      alertId,
      prefix: hijack.prefix,
    });

    // Send webhook notifications (fetch settings from DB)
    const db2 = await getDb();
    if (db2) {
      try {
        const settingsResult = await db2.$client.execute(
          "SELECT * FROM notification_settings LIMIT 1"
        );
        const settings = ((settingsResult as any)[0] as any[])[0];
        
        if (settings) {
          await sendAlertNotification(
            {
              type: "hijack",
              severity: "critical",
              prefix: hijack.prefix,
              asn: hijack.announcedAsn.toString(),
              message: `Potential hijack detected - Expected ASN: ${hijack.expectedAsn}`,
              timestamp: hijack.detectedAt,
              details: {
                expectedAsn: hijack.expectedAsn,
                announcedAsn: hijack.announcedAsn,
              },
            },
            {
              teamsEnabled: settings.teams_enabled,
              teamsWebhookUrl: settings.teams_webhook_url,
              slackEnabled: settings.slack_enabled,
              slackWebhookUrl: settings.slack_webhook_url,
              discordEnabled: settings.discord_enabled,
              discordWebhookUrl: settings.discord_webhook_url,
            }
          );
        }
      } catch (error) {
        logger.error("Error sending webhook notifications", {
          service: "hijack-detection",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return alertId;
  } catch (error) {
    logger.error("Error creating hijack alert", {
      service: "hijack-detection",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Add or update prefix ownership record
 */
export async function setPrefixOwnership(
  prefix: string,
  expectedAsn: number,
  description?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    logger.error("Database not available", { service: "hijack-detection" });
    return false;
  }

  try {
    // Check if record exists
    const existing = await db.$client.execute(
      "SELECT id FROM prefix_ownership WHERE prefix = ? LIMIT 1",
      [prefix]
    );

    const rows = (existing as any)[0] as any[];

    if (rows.length > 0) {
      // Update existing record
      await db.$client.execute(
        "UPDATE prefix_ownership SET expected_asn = ?, description = ?, updated_at = NOW() WHERE prefix = ?",
        [expectedAsn, description || null, prefix]
      );
    } else {
      // Insert new record
      await db.$client.execute(
        "INSERT INTO prefix_ownership (prefix, expected_asn, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [prefix, expectedAsn, description || null]
      );
    }

    logger.info("Prefix ownership updated", {
      service: "hijack-detection",
      prefix,
      expectedAsn,
    });

    return true;
  } catch (error) {
    logger.error("Error setting prefix ownership", {
      service: "hijack-detection",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get all monitored prefixes
 */
export async function getMonitoredPrefixes(): Promise<PrefixOwnership[]> {
  const db = await getDb();
  if (!db) {
    logger.error("Database not available", { service: "hijack-detection" });
    return [];
  }

  try {
    const result = await db.$client.execute("SELECT * FROM prefix_ownership ORDER BY prefix");
    
    const prefixes = (result as any)[0] as any[];
    return prefixes.map((row) => ({
      id: row.id,
      prefix: row.prefix,
      expectedAsn: row.expected_asn,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    logger.error("Error fetching monitored prefixes", {
      service: "hijack-detection",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
