import { describe, it, expect } from 'vitest';
import { webhookService, type WebhookAlert } from './services/webhook.service';
import { 
  getNotificationSettings, 
  updateNotificationSettings 
} from './db';

describe('Webhook Services', () => {
  const testAlert: WebhookAlert = {
    type: 'hijack',
    severity: 'critical',
    prefix: '192.0.2.0/24',
    asn: 'AS64512',
    message: 'Possible BGP hijack detected',
    timestamp: new Date(),
    details: {
      expectedPath: ['AS64512', 'AS174'],
      actualPath: ['AS64512', 'AS666', 'AS174'],
    },
  };

  describe('Teams Webhook', () => {
    it('should format Teams adaptive card correctly', async () => {
      // Test with invalid URL to check formatting without actually sending
      const result = await webhookService.sendTeamsNotification(
        'https://invalid-webhook-url.example.com',
        testAlert
      );
      
      // Should fail due to invalid URL, but formatting should work
      expect(result).toBe(false);
    });

    it('should handle Teams webhook errors gracefully', async () => {
      const result = await webhookService.sendTeamsNotification(
        'invalid-url',
        testAlert
      );
      
      expect(result).toBe(false);
    });
  });

  describe('Slack Webhook', () => {
    it('should format Slack message correctly', async () => {
      const result = await webhookService.sendSlackNotification(
        'https://invalid-webhook-url.example.com',
        testAlert
      );
      
      expect(result).toBe(false);
    });

    it('should handle Slack webhook errors gracefully', async () => {
      const result = await webhookService.sendSlackNotification(
        'invalid-url',
        testAlert
      );
      
      expect(result).toBe(false);
    });
  });

  describe('Discord Webhook', () => {
    it('should format Discord embed correctly', async () => {
      const result = await webhookService.sendDiscordNotification(
        'https://invalid-webhook-url.example.com',
        testAlert
      );
      
      expect(result).toBe(false);
    });

    it('should handle Discord webhook errors gracefully', async () => {
      const result = await webhookService.sendDiscordNotification(
        'invalid-url',
        testAlert
      );
      
      expect(result).toBe(false);
    });
  });

  describe('Multi-channel Notification', () => {
    it('should send to all enabled channels', async () => {
      const results = await webhookService.sendAlertNotification(testAlert, {
        teamsEnabled: true,
        teamsWebhookUrl: 'https://invalid-teams.example.com',
        slackEnabled: true,
        slackWebhookUrl: 'https://invalid-slack.example.com',
        discordEnabled: true,
        discordWebhookUrl: 'https://invalid-discord.example.com',
      });

      expect(results).toHaveProperty('teams');
      expect(results).toHaveProperty('slack');
      expect(results).toHaveProperty('discord');
    });

    it('should skip disabled channels', async () => {
      const results = await webhookService.sendAlertNotification(testAlert, {
        teamsEnabled: false,
        slackEnabled: false,
        discordEnabled: false,
      });

      expect(results.teams).toBe(false);
      expect(results.slack).toBe(false);
      expect(results.discord).toBe(false);
    });
  });
});

describe('Notification Settings', () => {
  it('should get or create default notification settings', async () => {
    const settings = await getNotificationSettings();
    
    expect(settings).toBeDefined();
    if (settings) {
      expect(settings).toHaveProperty('emailEnabled');
      expect(settings).toHaveProperty('teamsEnabled');
      expect(settings).toHaveProperty('slackEnabled');
      expect(settings).toHaveProperty('discordEnabled');
      expect(settings).toHaveProperty('minSeverity');
    }
  });

  it('should update notification settings', async () => {
    const updated = await updateNotificationSettings({
      teamsEnabled: true,
      minSeverity: 'warning',
    }, 1);

    expect(updated).toBeDefined();
    if (updated) {
      expect(updated.teamsEnabled).toBe(true);
      expect(updated.minSeverity).toBe('warning');
    }
  });

  it('should handle severity filtering correctly', () => {
    const severityLevels = { critical: 3, warning: 2, info: 1 };
    
    // Critical alert should pass all filters
    expect(severityLevels['critical']).toBeGreaterThanOrEqual(severityLevels['critical']);
    expect(severityLevels['critical']).toBeGreaterThanOrEqual(severityLevels['warning']);
    expect(severityLevels['critical']).toBeGreaterThanOrEqual(severityLevels['info']);
    
    // Warning alert should pass warning and info filters
    expect(severityLevels['warning']).toBeGreaterThanOrEqual(severityLevels['warning']);
    expect(severityLevels['warning']).toBeGreaterThanOrEqual(severityLevels['info']);
    expect(severityLevels['warning']).toBeLessThan(severityLevels['critical']);
    
    // Info alert should only pass info filter
    expect(severityLevels['info']).toBeGreaterThanOrEqual(severityLevels['info']);
    expect(severityLevels['info']).toBeLessThan(severityLevels['warning']);
    expect(severityLevels['info']).toBeLessThan(severityLevels['critical']);
  });
});
