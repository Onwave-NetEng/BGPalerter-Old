import { logger } from '../_core/logger';

export interface WebhookAlert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  prefix: string;
  asn?: string;
  message: string;
  timestamp: Date;
  details?: any;
}

/**
 * Microsoft Teams webhook service
 * Sends adaptive cards to Teams channels
 */
export async function sendTeamsNotification(
  webhookUrl: string,
  alert: WebhookAlert
): Promise<boolean> {
  try {
    const color = alert.severity === 'critical' ? 'attention' : alert.severity === 'warning' ? 'warning' : 'good';
    
    const card = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: `BGP Alert: ${alert.type.toUpperCase()}`,
                weight: 'bolder',
                size: 'large',
                color: color,
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'Severity', value: alert.severity.toUpperCase() },
                  { title: 'Prefix', value: alert.prefix },
                  ...(alert.asn ? [{ title: 'ASN', value: alert.asn }] : []),
                  { title: 'Time', value: alert.timestamp.toISOString() },
                ],
              },
              {
                type: 'TextBlock',
                text: alert.message,
                wrap: true,
              },
            ],
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      logger.error('Teams webhook failed', {
        service: 'webhook',
        channel: 'teams',
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    logger.info('Teams notification sent', {
      service: 'webhook',
      channel: 'teams',
      alertType: alert.type,
      severity: alert.severity,
    });

    return true;
  } catch (error: any) {
    logger.error('Teams webhook error', {
      service: 'webhook',
      channel: 'teams',
      error: error.message,
    });
    return false;
  }
}

/**
 * Slack webhook service
 * Sends formatted messages to Slack channels
 */
export async function sendSlackNotification(
  webhookUrl: string,
  alert: WebhookAlert
): Promise<boolean> {
  try {
    const emoji = alert.severity === 'critical' ? ':rotating_light:' : alert.severity === 'warning' ? ':warning:' : ':information_source:';
    const color = alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';

    const message = {
      text: `${emoji} BGP Alert: ${alert.type.toUpperCase()}`,
      attachments: [
        {
          color: color,
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Prefix', value: alert.prefix, short: true },
            ...(alert.asn ? [{ title: 'ASN', value: alert.asn, short: true }] : []),
            { title: 'Time', value: alert.timestamp.toISOString(), short: true },
            { title: 'Message', value: alert.message, short: false },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      logger.error('Slack webhook failed', {
        service: 'webhook',
        channel: 'slack',
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    logger.info('Slack notification sent', {
      service: 'webhook',
      channel: 'slack',
      alertType: alert.type,
      severity: alert.severity,
    });

    return true;
  } catch (error: any) {
    logger.error('Slack webhook error', {
      service: 'webhook',
      channel: 'slack',
      error: error.message,
    });
    return false;
  }
}

/**
 * Discord webhook service
 * Sends embedded messages to Discord channels
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  alert: WebhookAlert
): Promise<boolean> {
  try {
    const color = alert.severity === 'critical' ? 0xdc2626 : alert.severity === 'warning' ? 0xf59e0b : 0x3b82f6;

    const embed = {
      embeds: [
        {
          title: `🚨 BGP Alert: ${alert.type.toUpperCase()}`,
          color: color,
          fields: [
            { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
            { name: 'Prefix', value: alert.prefix, inline: true },
            ...(alert.asn ? [{ name: 'ASN', value: alert.asn, inline: true }] : []),
            { name: 'Message', value: alert.message, inline: false },
          ],
          timestamp: alert.timestamp.toISOString(),
          footer: {
            text: 'BGPalerter Dashboard',
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });

    if (!response.ok) {
      logger.error('Discord webhook failed', {
        service: 'webhook',
        channel: 'discord',
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    logger.info('Discord notification sent', {
      service: 'webhook',
      channel: 'discord',
      alertType: alert.type,
      severity: alert.severity,
    });

    return true;
  } catch (error: any) {
    logger.error('Discord webhook error', {
      service: 'webhook',
      channel: 'discord',
      error: error.message,
    });
    return false;
  }
}

/**
 * Send alert notification to all enabled channels
 */
export async function sendAlertNotification(
  alert: WebhookAlert,
  settings: {
    teamsEnabled: boolean;
    teamsWebhookUrl?: string;
    slackEnabled: boolean;
    slackWebhookUrl?: string;
    discordEnabled: boolean;
    discordWebhookUrl?: string;
  }
): Promise<{ teams: boolean; slack: boolean; discord: boolean }> {
  const results = {
    teams: false,
    slack: false,
    discord: false,
  };

  // Send to Teams if enabled
  if (settings.teamsEnabled && settings.teamsWebhookUrl) {
    results.teams = await sendTeamsNotification(settings.teamsWebhookUrl, alert);
  }

  // Send to Slack if enabled
  if (settings.slackEnabled && settings.slackWebhookUrl) {
    results.slack = await sendSlackNotification(settings.slackWebhookUrl, alert);
  }

  // Send to Discord if enabled
  if (settings.discordEnabled && settings.discordWebhookUrl) {
    results.discord = await sendDiscordNotification(settings.discordWebhookUrl, alert);
  }

  return results;
}

export const webhookService = {
  sendTeamsNotification,
  sendSlackNotification,
  sendDiscordNotification,
  sendAlertNotification,
};
