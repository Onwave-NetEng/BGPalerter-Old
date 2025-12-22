import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from '@trpc/server';
import { logger } from './_core/logger';
import { 
  checkPrefixOwnership,
  createHijackAlert,
  setPrefixOwnership,
  getMonitoredPrefixes,
} from './services/hijack-detection.service';
import { 
  createFileVersion, 
  getFileVersionHistory, 
  getFileVersionById,
  createAuditLog,
  getAuditLogs,
  getCachedData,
  setCachedData,
  createBgpAlert,
  getBgpAlerts,
  resolveBgpAlert,
  acknowledgeBgpAlert,
  getBgpAlertById,
  getAlertStats,
  getNotificationSettings,
  updateNotificationSettings,
  createAlertRule,
  getAlertRules,
  getAlertRuleById,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
} from './db';
import { bgpalerterService } from './services/bgpalerter.service';
import { githubService } from './services/github.service';
import { teamsService } from './services/teams.service';
import { fileService } from './services/file.service';
import { risService } from './services/ris.service';

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    logger.warn('Unauthorized admin access attempt', {
      userId: String(ctx.user.id),
      userRole: ctx.user.role,
      userName: ctx.user.name,
    });
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Operator or Admin procedure
const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'operator') {
    logger.warn('Unauthorized operator access attempt', {
      userId: String(ctx.user.id),
      userRole: ctx.user.role,
      userName: ctx.user.name,
    });
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Operator or Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // BGPalerter monitoring endpoints
  bgpalerter: router({
    status: protectedProcedure.query(async () => {
      try {
        // Try to get from cache first
        const cached = await getCachedData('bgpalerter_status');
        if (cached) {
          return cached.data;
        }

        // Fetch fresh data
        const status = await bgpalerterService.getStatus();
        
        // Cache for 30 seconds
        await setCachedData('bgpalerter_status', status, 30);
        
        return status;
      } catch (error: any) {
        // Return a graceful error response instead of throwing
        console.warn('[API] BGPalerter status unavailable:', error.message);
        return {
          warning: true,
          connectors: [],
          rpki: { data: false, stale: true, provider: 'unavailable' },
          error: 'BGPalerter API not accessible'
        };
      }
    }),

    monitors: protectedProcedure.query(async () => {
      try {
        const cached = await getCachedData('bgpalerter_monitors');
        if (cached) {
          return cached.data;
        }

        const monitors = await bgpalerterService.getMonitors();
        await setCachedData('bgpalerter_monitors', monitors, 30);
        
        return monitors;
      } catch (error: any) {
        console.warn('[API] BGPalerter monitors unavailable:', error.message);
        return [];
      }
    }),

    alerts: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        try {
          return await bgpalerterService.getRecentAlerts(input.limit);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch alerts',
          });
        }
      }),

    metrics: protectedProcedure.query(async () => {
      try {
        const cached = await getCachedData('bgpalerter_metrics');
        if (cached) {
          return cached.data;
        }

        const metrics = await bgpalerterService.getMetrics();
        await setCachedData('bgpalerter_metrics', metrics, 60);
        
        return metrics;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch metrics',
        });
      }
    }),

    refresh: protectedProcedure.mutation(async () => {
      try {
        // Clear all caches
        const keys = ['bgpalerter_status', 'bgpalerter_monitors', 'bgpalerter_metrics'];
        // Note: We don't have a bulk delete, so we'd need to implement that or just let them expire
        
        // Fetch fresh data (with graceful error handling)
        const results = await Promise.allSettled([
          bgpalerterService.getStatus(),
          bgpalerterService.getMonitors(),
          bgpalerterService.getMetrics(),
        ]);

        const status = results[0].status === 'fulfilled' ? results[0].value : null;
        const monitors = results[1].status === 'fulfilled' ? results[1].value : [];
        const metrics = results[2].status === 'fulfilled' ? results[2].value : null;

        return {
          success: true,
          timestamp: new Date().toISOString(),
          data: { status, monitors, metrics },
        };
      } catch (error: any) {
        console.warn('[API] Refresh failed:', error.message);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          error: 'BGPalerter API not accessible',
        };
      }
    }),
  }),

  // BGP Alerts History Management
  alerts: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        severity: z.enum(['critical', 'warning', 'info']).optional(),
        type: z.string().optional(),
        resolved: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const alerts = await getBgpAlerts(input);
          return alerts;
        } catch (error: any) {
          logger.trpcError('alerts.list', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch alert history',
          });
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          const alert = await getBgpAlertById(input.id);
          if (!alert) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Alert not found' });
          }
          return alert;
        } catch (error: any) {
          logger.trpcError('alerts.getById', error);
          throw error;
        }
      }),

    acknowledge: operatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const success = await acknowledgeBgpAlert(input.id, ctx.user.id);
          if (!success) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to acknowledge alert',
            });
          }

          logger.info('Alert acknowledged', {
            alertId: input.id,
            userId: String(ctx.user.id),
          });

          return { success: true, message: 'Alert acknowledged successfully' };
        } catch (error) {
          logger.error('Failed to acknowledge alert', {
            alertId: input.id,
            userId: String(ctx.user.id),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to acknowledge alert',
          });
        }
      }),

    resolve: operatorProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const success = await resolveBgpAlert(input.id, ctx.user.id, input.notes);
          if (!success) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to resolve alert',
            });
          }

          // Log the action
          await createAuditLog({
            userId: ctx.user.id,
            action: 'alert_resolved',
            resourceType: 'bgp_alert',
            resourceId: String(input.id),
            details: { notes: input.notes },
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.headers['user-agent'],
          });

          return { success: true };
        } catch (error: any) {
          logger.trpcError('alerts.resolve', error);
          throw error;
        }
      }),

    stats: protectedProcedure.query(async () => {
      try {
        return await getAlertStats();
      } catch (error: any) {
        logger.trpcError('alerts.stats', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch alert statistics',
        });
      }
    }),

    create: operatorProcedure
      .input(z.object({
        timestamp: z.date(),
        type: z.string(),
        severity: z.enum(['critical', 'warning', 'info']),
        prefix: z.string(),
        asn: z.string().optional(),
        message: z.string(),
        details: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const alert = await createBgpAlert(input);
          if (!alert) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create alert',
            });
          }

          // Send webhook notifications
          try {
            const settings = await getNotificationSettings();
            if (settings) {
              // Check if severity meets minimum threshold
              const severityLevels = { critical: 3, warning: 2, info: 1 };
              const alertSeverityLevel = severityLevels[input.severity];
              const minSeverityLevel = severityLevels[settings.minSeverity];

              if (alertSeverityLevel >= minSeverityLevel) {
                const { webhookService } = await import('./services/webhook.service');
                
                const webhookAlert = {
                  type: input.type,
                  severity: input.severity,
                  prefix: input.prefix,
                  asn: input.asn,
                  message: input.message,
                  timestamp: input.timestamp,
                  details: input.details,
                };

                await webhookService.sendAlertNotification(webhookAlert, {
                  teamsEnabled: settings.teamsEnabled,
                  teamsWebhookUrl: settings.teamsWebhookUrl || undefined,
                  slackEnabled: settings.slackEnabled,
                  slackWebhookUrl: settings.slackWebhookUrl || undefined,
                  discordEnabled: settings.discordEnabled,
                  discordWebhookUrl: settings.discordWebhookUrl || undefined,
                });

                logger.info('Webhook notifications sent for new alert', {
                  alertId: alert.id,
                  type: input.type,
                  severity: input.severity,
                });
              }
            }
          } catch (webhookError) {
            // Log webhook errors but don't fail the alert creation
            logger.error('Failed to send webhook notifications', {
              error: webhookError instanceof Error ? webhookError.message : 'Unknown error',
              alertId: alert.id,
            });
          }

          logger.info('BGP alert created', {
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity,
            userId: String(ctx.user.id),
          });

          return alert;
        } catch (error: any) {
          logger.trpcError('alerts.create', error);
          throw error;
        }
      }),
  }),

  // Configuration file management
  config: router({
    listFiles: protectedProcedure.query(async () => {
      try {
        return await fileService.listFiles();
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list configuration files',
        });
      }
    }),

    getFile: protectedProcedure
      .input(z.object({ filename: z.string() }))
      .query(async ({ input }) => {
        try {
          const file = await fileService.getFile(input.filename);
          if (!file) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `File ${input.filename} not found`,
            });
          }
          return file;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get file',
          });
        }
      }),

    saveFile: adminProcedure
      .input(z.object({
        filename: z.string(),
        content: z.string(),
        commitMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Get old content for version tracking
          const oldFile = await fileService.getFile(input.filename);
          
          // Save the file
          await fileService.saveFile(input.filename, input.content);

          // Create file version record
          const version = await createFileVersion({
            filename: input.filename,
            content: input.content,
            userId: ctx.user.id,
            commitMessage: input.commitMessage || `Updated ${input.filename}`,
          });

          // Commit to Git
          let gitCommitHash: string | undefined;
          try {
            gitCommitHash = await githubService.commitAndPush({
              filename: input.filename,
              message: input.commitMessage || `Updated ${input.filename}`,
              author: {
                name: ctx.user.name || 'Dashboard User',
                email: ctx.user.email || 'dashboard@onwave.com',
              },
            });
          } catch (gitError) {
            console.error('[Config] Git commit failed:', gitError);
            // Continue even if git fails
          }

          // Create audit log
          await createAuditLog({
            userId: ctx.user.id,
            action: 'file_updated',
            resourceType: 'config_file',
            resourceId: input.filename,
            details: {
              commitMessage: input.commitMessage,
              gitCommitHash,
              sizeChange: input.content.length - (oldFile?.content.length || 0),
            },
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.get('user-agent'),
          });

          // Send Teams notification
          if (teamsService.isEnabled()) {
            await teamsService.notifyConfigChange({
              filename: input.filename,
              action: 'Modified',
              author: ctx.user.name || 'Unknown',
              timestamp: new Date().toISOString(),
            });
          }

          return {
            success: true,
            versionId: version?.id,
            gitCommitHash,
          };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to save file',
          });
        }
      }),

    validateYAML: protectedProcedure
      .input(z.object({ content: z.string() }))
      .mutation(({ input }) => {
        return fileService.validateYAML(input.content);
      }),

    getHistory: protectedProcedure
      .input(z.object({
        filename: z.string(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        try {
          return await getFileVersionHistory(input.filename, input.limit);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get file history',
          });
        }
      }),

    restoreVersion: adminProcedure
      .input(z.object({ versionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const version = await getFileVersionById(input.versionId);
          if (!version) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Version not found',
            });
          }

          // Restore the file
          await fileService.saveFile(version.filename, version.content);

          // Create audit log
          await createAuditLog({
            userId: ctx.user.id,
            action: 'file_restored',
            resourceType: 'config_file',
            resourceId: version.filename,
            details: {
              restoredFromVersionId: version.id,
              restoredFromDate: version.createdAt,
            },
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.get('user-agent'),
          });

          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to restore version',
          });
        }
      }),
  }),

  // GitHub integration
  github: router({
    status: protectedProcedure.query(async () => {
      try {
        return await githubService.getStatus();
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Git status',
        });
      }
    }),

    history: protectedProcedure
      .input(z.object({
        filename: z.string(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        try {
          return await githubService.getFileHistory(input.filename, input.limit);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get Git history',
          });
        }
      }),

    testConnection: adminProcedure.mutation(async () => {
      try {
        const connected = await githubService.testConnection();
        return { success: connected };
      } catch (error) {
        return { success: false };
      }
    }),
  }),

  // System actions
  actions: router({
    restartBGPalerter: operatorProcedure.mutation(async ({ ctx }) => {
      try {
        // TODO: Implement actual restart logic using Docker API or systemctl
        // For now, just log the action
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'bgpalerter_restarted',
          resourceType: 'system',
          resourceId: 'bgpalerter',
          details: {},
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.get('user-agent'),
        });

        return { success: true, message: 'BGPalerter restart initiated' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to restart BGPalerter',
        });
      }
    }),

    testHealth: protectedProcedure.mutation(async () => {
      try {
        const connected = await bgpalerterService.testConnection();
        return { success: connected, message: connected ? 'BGPalerter is responding' : 'BGPalerter is not responding' };
      } catch (error) {
        return { success: false, message: 'Health check failed' };
      }
    }),

    testTeams: adminProcedure.mutation(async () => {
      try {
        const sent = await teamsService.testConnection();
        return { success: sent, message: sent ? 'Test notification sent to Teams' : 'Failed to send Teams notification' };
      } catch (error) {
        return { success: false, message: 'Teams test failed' };
      }
    }),
  }),

  // Notification settings
  notifications: router({
    getSettings: protectedProcedure.query(async () => {
      try {
        return await getNotificationSettings();
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get notification settings',
        });
      }
    }),

    updateSettings: adminProcedure
      .input(z.object({
        emailEnabled: z.boolean().optional(),
        emailRecipients: z.array(z.string()).optional(),
        teamsEnabled: z.boolean().optional(),
        teamsWebhookUrl: z.string().optional(),
        slackEnabled: z.boolean().optional(),
        slackWebhookUrl: z.string().optional(),
        discordEnabled: z.boolean().optional(),
        discordWebhookUrl: z.string().optional(),
        minSeverity: z.enum(['critical', 'warning', 'info']).optional(),
        alertTypes: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          logger.info('Updating notification settings', {
            userId: String(ctx.user.id),
            userName: ctx.user.name,
          });

          const updated = await updateNotificationSettings(input, ctx.user.id);

          await createAuditLog({
            userId: ctx.user.id,
            action: 'notification_settings_updated',
            resourceType: 'settings',
            resourceId: 'notifications',
            details: input,
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.get('user-agent'),
          });

          return updated;
        } catch (error) {
          logger.error('Failed to update notification settings', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update notification settings',
          });
        }
      }),

    testWebhook: adminProcedure
      .input(z.object({
        channel: z.enum(['teams', 'slack', 'discord']),
      }))
      .mutation(async ({ input }) => {
        try {
          const settings = await getNotificationSettings();
          if (!settings) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Notification settings not found',
            });
          }

          const { webhookService } = await import('./services/webhook.service');
          
          const testAlert = {
            type: 'test',
            severity: 'info' as const,
            prefix: '192.0.2.0/24',
            asn: 'AS64512',
            message: 'This is a test notification from BGPalerter Dashboard',
            timestamp: new Date(),
          };

          let success = false;
          if (input.channel === 'teams' && settings.teamsWebhookUrl) {
            success = await webhookService.sendTeamsNotification(settings.teamsWebhookUrl, testAlert);
          } else if (input.channel === 'slack' && settings.slackWebhookUrl) {
            success = await webhookService.sendSlackNotification(settings.slackWebhookUrl, testAlert);
          } else if (input.channel === 'discord' && settings.discordWebhookUrl) {
            success = await webhookService.sendDiscordNotification(settings.discordWebhookUrl, testAlert);
          }

          return { 
            success, 
            message: success ? `Test notification sent to ${input.channel}` : `Failed to send test notification to ${input.channel}` 
          };
        } catch (error) {
          logger.error('Webhook test failed', {
            channel: input.channel,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return { 
            success: false, 
            message: 'Webhook test failed' 
          };
        }
      }),
  }),

  // RIS Route Collector Integration
  ris: router({
    getAnnouncedPrefixes: protectedProcedure
      .input(z.object({ asn: z.string() }))
      .query(async ({ input }) => {
        try {
          return await risService.getAnnouncedPrefixes(input.asn);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch announced prefixes',
          });
        }
      }),

    getRoutingStatus: protectedProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async ({ input }) => {
        try {
          return await risService.getRoutingStatus(input.prefix);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch routing status',
          });
        }
      }),

    getASPathInfo: protectedProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async ({ input }) => {
        try {
          return await risService.getASPathInfo(input.prefix);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch AS path info',
          });
        }
      }),

    getBGPUpdates: protectedProcedure
      .input(z.object({ 
        asn: z.string(),
        hours: z.number().optional().default(24),
      }))
      .query(async ({ input }) => {
        try {
          return await risService.getBGPUpdates(input.asn, input.hours);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch BGP updates',
          });
        }
      }),

    testConnection: protectedProcedure.mutation(async () => {
      try {
        const connected = await risService.testConnection();
        return { success: connected, message: connected ? 'RIS API is responding' : 'RIS API is not responding' };
      } catch (error) {
        return { success: false, message: 'RIS connection test failed' };
      }
    }),
  }),

  // Alert Rules Management
  rules: router({
    list: protectedProcedure.query(async () => {
      try {
        return await getAlertRules();
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch alert rules',
        });
      }
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          const rule = await getAlertRuleById(input.id);
          if (!rule) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Alert rule not found',
            });
          }
          return rule;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch alert rule',
          });
        }
      }),

    create: operatorProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        enabled: z.boolean().default(true),
        ruleType: z.enum(['prefix_length', 'as_path_pattern', 'roa_mismatch', 'announcement_rate', 'custom']),
        conditions: z.any(),
        severity: z.enum(['critical', 'warning', 'info']),
        notificationChannels: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const rule = await createAlertRule({
            ...input,
            createdBy: ctx.user.id,
          });

          if (!rule) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create alert rule',
            });
          }

          logger.info('Alert rule created', {
            ruleId: rule.id,
            ruleName: rule.name,
            userId: String(ctx.user.id),
          });

          return rule;
        } catch (error) {
          logger.error('Failed to create alert rule', {
            userId: String(ctx.user.id),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create alert rule',
          });
        }
      }),

    update: operatorProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        enabled: z.boolean().optional(),
        ruleType: z.enum(['prefix_length', 'as_path_pattern', 'roa_mismatch', 'announcement_rate', 'custom']).optional(),
        conditions: z.any().optional(),
        severity: z.enum(['critical', 'warning', 'info']).optional(),
        notificationChannels: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { id, ...updates } = input;
          const success = await updateAlertRule(id, {
            ...updates,
            updatedBy: ctx.user.id,
          });

          if (!success) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to update alert rule',
            });
          }

          logger.info('Alert rule updated', {
            ruleId: id,
            userId: String(ctx.user.id),
          });

          return { success: true, message: 'Alert rule updated successfully' };
        } catch (error) {
          logger.error('Failed to update alert rule', {
            ruleId: input.id,
            userId: String(ctx.user.id),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update alert rule',
          });
        }
      }),

    delete: operatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const success = await deleteAlertRule(input.id);
          if (!success) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to delete alert rule',
            });
          }

          logger.info('Alert rule deleted', {
            ruleId: input.id,
            userId: String(ctx.user.id),
          });

          return { success: true, message: 'Alert rule deleted successfully' };
        } catch (error) {
          logger.error('Failed to delete alert rule', {
            ruleId: input.id,
            userId: String(ctx.user.id),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete alert rule',
          });
        }
      }),

    toggle: operatorProcedure
      .input(z.object({ id: z.number(), enabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const success = await toggleAlertRule(input.id, input.enabled);
          if (!success) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to toggle alert rule',
            });
          }

          logger.info('Alert rule toggled', {
            ruleId: input.id,
            enabled: input.enabled,
            userId: String(ctx.user.id),
          });

          return { success: true, message: `Alert rule ${input.enabled ? 'enabled' : 'disabled'} successfully` };
        } catch (error) {
          logger.error('Failed to toggle alert rule', {
            ruleId: input.id,
            userId: String(ctx.user.id),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to toggle alert rule',
          });
        }
      }),
  }),

  // Hijack detection
  hijack: router({
    // Get all monitored prefixes
    listPrefixes: protectedProcedure.query(async () => {
      try {
        return await getMonitoredPrefixes();
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch monitored prefixes',
        });
      }
    }),

    // Add or update prefix ownership
    setPrefixOwnership: operatorProcedure
      .input(z.object({
        prefix: z.string(),
        expectedAsn: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const success = await setPrefixOwnership(
            input.prefix,
            input.expectedAsn,
            input.description
          );

          if (!success) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to set prefix ownership',
            });
          }

          logger.info('Prefix ownership set', {
            prefix: input.prefix,
            expectedAsn: input.expectedAsn,
            userId: String(ctx.user.id),
          });

          return { success: true, message: 'Prefix ownership updated successfully' };
        } catch (error) {
          logger.error('Failed to set prefix ownership', {
            prefix: input.prefix,
            userId: String(ctx.user.id),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to set prefix ownership',
          });
        }
      }),

    // Check if a prefix announcement matches expected ownership
    checkPrefix: protectedProcedure
      .input(z.object({
        prefix: z.string(),
        announcedAsn: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const hijack = await checkPrefixOwnership(input.prefix, input.announcedAsn);
          
          if (hijack) {
            // Create alert for detected hijack
            const alertId = await createHijackAlert(hijack, ctx.user.id);
            
            logger.warn('Hijack detected and alert created', {
              prefix: input.prefix,
              announcedAsn: input.announcedAsn,
              expectedAsn: hijack.expectedAsn,
              alertId,
              userId: String(ctx.user.id),
            });

            return {
              hijackDetected: true,
              alertId,
              details: hijack,
            };
          }

          return {
            hijackDetected: false,
            message: 'Prefix ownership verified',
          };
        } catch (error) {
          logger.error('Failed to check prefix ownership', {
            prefix: input.prefix,
            userId: String(ctx.user.id),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to check prefix ownership',
          });
        }
      }),
  }),

  // Audit logs
  audit: router({
    getLogs: adminProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ input }) => {
        try {
          return await getAuditLogs(input.limit);
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get audit logs',
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
