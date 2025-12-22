import { logger } from '../_core/logger';
import { createBgpAlert } from '../db';

/**
 * Email notification service for BGPalerter integration
 * 
 * BGPalerter sends email reports via reportEmail module.
 * This service parses those emails and stores alerts in the database.
 * 
 * Configuration in BGPalerter config.yml:
 * reports:
 *   - file: reportEmail
 *     channels:
 *       - hijack
 *       - newprefix
 *       - visibility
 *       - path
 *       - misconfiguration
 *       - rpki
 *     params:
 *       showPaths: 5
 *       senderEmail: bgpalerter@example.com
 *       smtp:
 *         host: smtp.example.com
 *         port: 587
 *         secure: false
 *         auth:
 *           user: user@example.com
 *           pass: password
 *       notifiedEmails:
 *         - admin@example.com
 *         - ops@example.com
 */

export interface EmailAlert {
  subject: string;
  body: string;
  timestamp: Date;
  from: string;
}

export interface ParsedAlert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  prefix: string;
  asn?: string;
  message: string;
  details?: any;
}

/**
 * Parse BGPalerter email alert and extract structured data
 */
export function parseEmailAlert(email: EmailAlert): ParsedAlert | null {
  try {
    const { subject, body } = email;

    // Determine alert type from subject
    let type = 'unknown';
    let severity: 'critical' | 'warning' | 'info' = 'info';

    if (subject.includes('hijack') || subject.includes('Hijack')) {
      type = 'hijack';
      severity = 'critical';
    } else if (subject.includes('RPKI') || subject.includes('rpki')) {
      type = 'rpki';
      severity = 'warning';
    } else if (subject.includes('visibility') || subject.includes('Visibility')) {
      type = 'visibility';
      severity = 'warning';
    } else if (subject.includes('path') || subject.includes('Path')) {
      type = 'path';
      severity = 'info';
    } else if (subject.includes('new prefix') || subject.includes('New prefix')) {
      type = 'newprefix';
      severity = 'info';
    }

    // Extract prefix from subject or body
    const prefixMatch = subject.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})/);
    const prefix = prefixMatch ? prefixMatch[1] : 'unknown';

    // Extract ASN from subject or body
    const asnMatch = subject.match(/AS(\d+)/i) || body.match(/AS(\d+)/i);
    const asn = asnMatch ? `AS${asnMatch[1]}` : undefined;

    // Use subject as message, body as details
    const message = subject;
    const details = {
      emailBody: body,
      from: email.from,
      receivedAt: email.timestamp.toISOString(),
    };

    return {
      type,
      severity,
      prefix,
      asn,
      message,
      details,
    };
  } catch (error: any) {
    logger.error('Failed to parse email alert', {
      service: 'email',
      error: error.message,
    });
    return null;
  }
}

/**
 * Process incoming email alert and store in database
 */
export async function processEmailAlert(email: EmailAlert): Promise<boolean> {
  try {
    const parsed = parseEmailAlert(email);
    if (!parsed) {
      logger.warn('Failed to parse email alert', {
        service: 'email',
        subject: email.subject,
      });
      return false;
    }

    // Store alert in database
    const alert = await createBgpAlert({
      timestamp: email.timestamp,
      type: parsed.type,
      severity: parsed.severity,
      prefix: parsed.prefix,
      asn: parsed.asn,
      message: parsed.message,
      details: parsed.details,
    });

    if (!alert) {
      logger.error('Failed to store email alert in database', {
        service: 'email',
        type: parsed.type,
      });
      return false;
    }

    logger.info('Email alert processed and stored', {
      service: 'email',
      alertId: alert.id,
      type: parsed.type,
      severity: parsed.severity,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to process email alert', {
      service: 'email',
      error: error.message,
    });
    return false;
  }
}

/**
 * Get email configuration template for BGPalerter config.yml
 */
export function getEmailConfigTemplate(params: {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  senderEmail: string;
  notifiedEmails: string[];
}): string {
  return `reports:
  - file: reportEmail
    channels:
      - hijack
      - newprefix
      - visibility
      - path
      - misconfiguration
      - rpki
    params:
      showPaths: 5
      senderEmail: ${params.senderEmail}
      smtp:
        host: ${params.smtpHost}
        port: ${params.smtpPort}
        secure: ${params.smtpSecure}
        auth:
          user: ${params.smtpUser}
          pass: ${params.smtpPass}
      notifiedEmails:
${params.notifiedEmails.map(email => `        - ${email}`).join('\n')}`;
}

export const emailService = {
  parseEmailAlert,
  processEmailAlert,
  getEmailConfigTemplate,
};
