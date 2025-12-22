import axios, { AxiosInstance } from 'axios';

/**
 * Microsoft Teams Integration Service
 * Sends notifications to Teams channels via webhooks
 */

export interface TeamsNotification {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  facts?: Array<{ name: string; value: string }>;
  actionUrl?: string;
  actionText?: string;
}

class TeamsService {
  private client: AxiosInstance;
  private webhookUrl: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
    this.enabled = process.env.TEAMS_NOTIFICATIONS_ENABLED === 'true' && !!this.webhookUrl;

    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send a notification to Teams
   */
  async sendNotification(notification: TeamsNotification): Promise<boolean> {
    if (!this.enabled) {
      console.log('[Teams] Notifications disabled, skipping');
      return false;
    }

    try {
      const card = this.buildMessageCard(notification);
      await this.client.post(this.webhookUrl, card);
      return true;
    } catch (error) {
      console.error('[Teams] Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Build a MessageCard for Teams
   */
  private buildMessageCard(notification: TeamsNotification): any {
    const themeColor = this.getThemeColor(notification.severity);

    const card: any = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor,
      summary: notification.title,
      sections: [
        {
          activityTitle: notification.title,
          activitySubtitle: notification.message,
          activityImage: 'https://www.onwave.com/logo.png', // Onwave logo
          markdown: true,
        },
      ],
    };

    // Add facts if provided
    if (notification.facts && notification.facts.length > 0) {
      card.sections[0].facts = notification.facts;
    }

    // Add action button if provided
    if (notification.actionUrl && notification.actionText) {
      card.potentialAction = [
        {
          '@type': 'OpenUri',
          name: notification.actionText,
          targets: [
            {
              os: 'default',
              uri: notification.actionUrl,
            },
          ],
        },
      ];
    }

    return card;
  }

  /**
   * Get theme color based on severity
   */
  private getThemeColor(severity?: string): string {
    switch (severity) {
      case 'critical':
        return 'FF0000'; // Red
      case 'warning':
        return 'FFA500'; // Orange
      case 'info':
      default:
        return 'FF6B35'; // Onwave Orange
    }
  }

  /**
   * Send configuration change notification
   */
  async notifyConfigChange(data: {
    filename: string;
    action: string;
    author: string;
    timestamp: string;
  }): Promise<boolean> {
    return this.sendNotification({
      title: '⚙️ BGPalerter Configuration Updated',
      message: `Configuration file modified by ${data.author}`,
      severity: 'info',
      facts: [
        { name: 'File', value: data.filename },
        { name: 'Action', value: data.action },
        { name: 'Timestamp', value: data.timestamp },
      ],
      actionUrl: process.env.DASHBOARD_URL || 'http://localhost:8080',
      actionText: 'View Dashboard',
    });
  }

  /**
   * Send critical BGP alert notification
   */
  async notifyBGPAlert(data: {
    type: string;
    prefix: string;
    asn?: string;
    message: string;
    timestamp: string;
  }): Promise<boolean> {
    return this.sendNotification({
      title: '🚨 Critical BGP Alert',
      message: data.message,
      severity: 'critical',
      facts: [
        { name: 'Alert Type', value: data.type },
        { name: 'Prefix', value: data.prefix },
        ...(data.asn ? [{ name: 'Unauthorized AS', value: data.asn }] : []),
        { name: 'Detected', value: data.timestamp },
      ],
      actionUrl: process.env.DASHBOARD_URL || 'http://localhost:8080',
      actionText: 'View Dashboard',
    });
  }

  /**
   * Send system health warning
   */
  async notifySystemHealth(data: {
    component: string;
    status: string;
    message: string;
  }): Promise<boolean> {
    return this.sendNotification({
      title: '⚠️ System Health Warning',
      message: data.message,
      severity: 'warning',
      facts: [
        { name: 'Component', value: data.component },
        { name: 'Status', value: data.status },
      ],
      actionUrl: process.env.DASHBOARD_URL || 'http://localhost:8080',
      actionText: 'View Dashboard',
    });
  }

  /**
   * Test Teams webhook connectivity
   */
  async testConnection(): Promise<boolean> {
    return this.sendNotification({
      title: '✅ BGPalerter Dashboard Test',
      message: 'This is a test notification from BGPalerter Dashboard',
      severity: 'info',
      facts: [
        { name: 'Status', value: 'Connection Successful' },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });
  }

  /**
   * Check if Teams integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const teamsService = new TeamsService();
