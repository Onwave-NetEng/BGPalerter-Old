import axios, { AxiosInstance } from 'axios';
import { logger } from '../_core/logger';

/**
 * BGPalerter API Service
 * Communicates with the BGPalerter REST API running on port 8011
 */

export interface BGPalerterStatus {
  warning: boolean;
  connectors: Array<{
    name: string;
    connected: boolean;
  }>;
  rpki: {
    data: boolean;
    stale: boolean;
    provider: string;
  };
  lastUpdated?: Date;
}

export interface MonitorStatus {
  name: string;
  type: string;
  active: boolean;
  lastCheck?: Date;
}

export interface BGPAlert {
  id: string;
  timestamp: Date;
  type: string;
  prefix: string;
  asn?: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolved: boolean;
}

export interface BGPMetrics {
  updates24h: number[];
  timestamps: string[];
  totalUpdates: number;
}

class BGPalerterService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // BGPalerter REST API endpoint
    this.baseURL = process.env.BGPALERTER_API_URL || 'http://127.0.0.1:8011';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get system status from BGPalerter
   */
  async getStatus(): Promise<BGPalerterStatus> {
    try {
      logger.debug('Fetching BGPalerter status', { service: 'bgpalerter', endpoint: '/status' });
      const response = await this.client.get<BGPalerterStatus>('/status');
      logger.info('BGPalerter status retrieved successfully', { 
        service: 'bgpalerter',
        warning: response.data.warning,
        connectorsCount: response.data.connectors?.length || 0,
      });
      return {
        ...response.data,
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        logger.warn('BGPalerter API connection refused', {
          service: 'bgpalerter',
          baseURL: this.baseURL,
          errorCode: error.code,
        });
      } else {
        logger.bgpalerterError('getStatus', error, {
          baseURL: this.baseURL,
          errorCode: error.code,
          statusCode: error.response?.status,
        });
      }
      throw new Error('Failed to connect to BGPalerter API');
    }
  }

  /**
   * Get monitor statuses
   * Note: This is derived from the status endpoint and config
   */
  async getMonitors(): Promise<MonitorStatus[]> {
    try {
      const status = await this.getStatus();
      
      // Default monitors based on standard BGPalerter config
      const monitors: MonitorStatus[] = [
        { name: 'Hijack Monitor', type: 'monitorHijack', active: true },
        { name: 'RPKI Validator', type: 'monitorRPKI', active: status.rpki.data },
        { name: 'Visibility Monitor', type: 'monitorVisibility', active: true },
        { name: 'Path Monitor', type: 'monitorPath', active: true },
        { name: 'New Prefix Monitor', type: 'monitorNewPrefix', active: true },
        { name: 'ROA Monitor', type: 'monitorROAS', active: status.rpki.data },
      ];

      return monitors;
    } catch (error: any) {
      logger.bgpalerterError('getMonitors', error);
      return [];
    }
  }

  /**
   * Get recent alerts from BGPalerter logs
   * Note: BGPalerter doesn't have a built-in alerts API, so we parse logs
   */
  async getRecentAlerts(limit: number = 10): Promise<BGPAlert[]> {
    // TODO: Implement log parsing or use reportFile output
    // For now, return mock data structure
    return [];
  }

  /**
   * Get BGP update metrics
   * Note: This would require custom implementation or log parsing
   */
  async getMetrics(): Promise<BGPMetrics> {
    // TODO: Implement metrics collection
    // For now, return mock structure
    return {
      updates24h: Array(24).fill(0).map(() => Math.floor(Math.random() * 2000)),
      timestamps: Array(24).fill(0).map((_, i) => {
        const hour = new Date();
        hour.setHours(hour.getHours() - (23 - i));
        return hour.toISOString();
      }),
      totalUpdates: 0,
    };
  }

  /**
   * Test connectivity to BGPalerter API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getStatus();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get AS path information (if available)
   * This would require custom BGPalerter extension or RIS data parsing
   */
  async getASPath(prefix: string): Promise<any> {
    // TODO: Implement AS path retrieval
    return null;
  }
}

export const bgpalerterService = new BGPalerterService();
