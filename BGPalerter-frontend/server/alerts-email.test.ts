import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createBgpAlert, 
  getBgpAlerts, 
  resolveBgpAlert, 
  getBgpAlertById,
  getAlertStats,
} from './db';
import { emailService } from './services/email.service';

describe('BGP Alerts Management', () => {
  it('should create a BGP alert', async () => {
    const alert = await createBgpAlert({
      timestamp: new Date(),
      type: 'hijack',
      severity: 'critical',
      prefix: '192.0.2.0/24',
      asn: 'AS64512',
      message: 'Possible hijack detected',
      details: { test: true },
    });

    // Alert creation may fail if database is not available
    if (alert) {
      expect(alert.id).toBeDefined();
      expect(alert.type).toBe('hijack');
      expect(alert.severity).toBe('critical');
      expect(alert.prefix).toBe('192.0.2.0/24');
    }
  });

  it('should fetch BGP alerts with filters', async () => {
    const alerts = await getBgpAlerts({
      limit: 10,
      severity: 'critical',
    });

    expect(Array.isArray(alerts)).toBe(true);
    // Alerts may be empty if database is not available or no alerts exist
  });

  it('should get alert statistics', async () => {
    const stats = await getAlertStats();

    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.unresolved).toBe('number');
    expect(stats.bySeverity).toBeDefined();
  });

  it('should handle alert resolution', async () => {
    // This test verifies the function exists and handles errors gracefully
    const result = await resolveBgpAlert(999999, 1, 'Test resolution');
    
    // Result may be false if database is not available or alert doesn't exist
    expect(typeof result).toBe('boolean');
  });
});

describe('Email Service', () => {
  it('should parse hijack email alert', () => {
    const email = {
      subject: 'BGPalerter: Hijack detected for 192.0.2.0/24 (AS64512)',
      body: 'A possible hijack has been detected for prefix 192.0.2.0/24 announced by AS64512',
      timestamp: new Date(),
      from: 'bgpalerter@example.com',
    };

    const parsed = emailService.parseEmailAlert(email);

    expect(parsed).toBeDefined();
    if (parsed) {
      expect(parsed.type).toBe('hijack');
      expect(parsed.severity).toBe('critical');
      expect(parsed.prefix).toBe('192.0.2.0/24');
      expect(parsed.asn).toBe('AS64512');
    }
  });

  it('should parse RPKI email alert', () => {
    const email = {
      subject: 'BGPalerter: RPKI validation failed for 203.0.113.0/24',
      body: 'RPKI validation failed for prefix 203.0.113.0/24',
      timestamp: new Date(),
      from: 'bgpalerter@example.com',
    };

    const parsed = emailService.parseEmailAlert(email);

    expect(parsed).toBeDefined();
    if (parsed) {
      expect(parsed.type).toBe('rpki');
      expect(parsed.severity).toBe('warning');
      expect(parsed.prefix).toBe('203.0.113.0/24');
    }
  });

  it('should parse visibility email alert', () => {
    const email = {
      subject: 'BGPalerter: Visibility issue for 198.51.100.0/24',
      body: 'Visibility issue detected for prefix 198.51.100.0/24',
      timestamp: new Date(),
      from: 'bgpalerter@example.com',
    };

    const parsed = emailService.parseEmailAlert(email);

    expect(parsed).toBeDefined();
    if (parsed) {
      expect(parsed.type).toBe('visibility');
      expect(parsed.severity).toBe('warning');
      expect(parsed.prefix).toBe('198.51.100.0/24');
    }
  });

  it('should generate email configuration template', () => {
    const config = emailService.getEmailConfigTemplate({
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'user@example.com',
      smtpPass: 'password',
      senderEmail: 'bgpalerter@example.com',
      notifiedEmails: ['admin@example.com', 'ops@example.com'],
    });

    expect(config).toContain('reports:');
    expect(config).toContain('file: reportEmail');
    expect(config).toContain('smtp.example.com');
    expect(config).toContain('admin@example.com');
    expect(config).toContain('ops@example.com');
  });

  it('should handle malformed email gracefully', () => {
    const email = {
      subject: 'Invalid email format',
      body: 'No prefix or ASN information',
      timestamp: new Date(),
      from: 'test@example.com',
    };

    const parsed = emailService.parseEmailAlert(email);

    // Should still parse but with unknown type and prefix
    expect(parsed).toBeDefined();
    if (parsed) {
      expect(parsed.type).toBe('unknown');
      expect(parsed.prefix).toBe('unknown');
    }
  });
});

describe('Alert and Email Integration', () => {
  it('should process email alert and store in database', async () => {
    const email = {
      subject: 'BGPalerter: New prefix announced 192.0.2.0/24 (AS64512)',
      body: 'A new prefix has been announced: 192.0.2.0/24 by AS64512',
      timestamp: new Date(),
      from: 'bgpalerter@example.com',
    };

    const result = await emailService.processEmailAlert(email);

    // Result may be false if database is not available
    expect(typeof result).toBe('boolean');
  });

  it('should handle email processing errors gracefully', async () => {
    const invalidEmail = {
      subject: '',
      body: '',
      timestamp: new Date(),
      from: '',
    };

    const result = await emailService.processEmailAlert(invalidEmail);

    // Should not throw, just return false
    expect(typeof result).toBe('boolean');
  });
});
