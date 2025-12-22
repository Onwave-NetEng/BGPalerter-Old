import { logger } from '../_core/logger';

/**
 * RIPE RIS (Routing Information Service) API client
 * Provides access to BGP routing data from route collectors
 * API Documentation: https://stat.ripe.net/docs/02.data-api/
 */

export interface RISPrefix {
  prefix: string;
  asn: string;
  timelines: {
    starttime: string;
    endtime: string | null;
  }[];
}

export interface RISAnnouncement {
  prefix: string;
  origin_asn: string;
  as_path: string[];
  peer_asn: string;
  collector: string;
  timestamp: string;
}

export interface RISRoutingStatus {
  prefix: string;
  announced: boolean;
  visibility: number; // percentage of route collectors seeing this prefix
  origins: string[]; // list of origin ASNs
  upstreams: string[]; // list of upstream ASNs
}

export interface RISASPathInfo {
  as_path: string[];
  prefix: string;
  origin: string;
  peer_count: number;
  collector_count: number;
}

class RISService {
  private readonly baseURL = 'https://stat.ripe.net/data';
  private readonly timeout = 10000; // 10 seconds

  /**
   * Get announced prefixes for an ASN
   */
  async getAnnouncedPrefixes(asn: string): Promise<RISPrefix[]> {
    try {
      logger.debug('Fetching announced prefixes from RIS', {
        service: 'ris',
        asn,
      });

      const cleanASN = asn.replace(/^AS/i, '');
      const url = `${this.baseURL}/announced-prefixes/data.json?resource=AS${cleanASN}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`RIS API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(`RIS API error: ${data.status_code || 'Unknown error'}`);
      }

      const prefixes: RISPrefix[] = data.data?.prefixes || [];

      logger.info('Announced prefixes fetched from RIS', {
        service: 'ris',
        asn,
        count: prefixes.length,
      });

      return prefixes;
    } catch (error: any) {
      logger.error('Failed to fetch announced prefixes from RIS', {
        service: 'ris',
        asn,
        error: error.message,
      });
      throw new Error(`Failed to fetch announced prefixes: ${error.message}`);
    }
  }

  /**
   * Get routing status for a specific prefix
   */
  async getRoutingStatus(prefix: string): Promise<RISRoutingStatus> {
    try {
      logger.debug('Fetching routing status from RIS', {
        service: 'ris',
        prefix,
      });

      const url = `${this.baseURL}/routing-status/data.json?resource=${encodeURIComponent(prefix)}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`RIS API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(`RIS API error: ${data.status_code || 'Unknown error'}`);
      }

      const statusData = data.data;
      const visibility = statusData.visibility || 0;
      const origins = statusData.origins?.map((o: any) => o.origin) || [];
      const upstreams = statusData.first_level_ases || [];

      const status: RISRoutingStatus = {
        prefix,
        announced: statusData.announced || false,
        visibility: Math.round(visibility * 100),
        origins,
        upstreams,
      };

      logger.info('Routing status fetched from RIS', {
        service: 'ris',
        prefix,
        announced: status.announced,
        visibility: status.visibility,
      });

      return status;
    } catch (error: any) {
      logger.error('Failed to fetch routing status from RIS', {
        service: 'ris',
        prefix,
        error: error.message,
      });
      throw new Error(`Failed to fetch routing status: ${error.message}`);
    }
  }

  /**
   * Get AS path information for a prefix
   */
  async getASPathInfo(prefix: string): Promise<RISASPathInfo[]> {
    try {
      logger.debug('Fetching AS path info from RIS', {
        service: 'ris',
        prefix,
      });

      const url = `${this.baseURL}/looking-glass/data.json?resource=${encodeURIComponent(prefix)}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`RIS API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(`RIS API error: ${data.status_code || 'Unknown error'}`);
      }

      const rrcs = data.data?.rrcs || [];
      const pathMap = new Map<string, RISASPathInfo>();

      // Aggregate paths from all route collectors
      for (const rrc of rrcs) {
        for (const peer of rrc.peers || []) {
          const asPath = peer.as_path?.split(' ') || [];
          if (asPath.length === 0) continue;

          const pathKey = asPath.join(',');
          const origin = asPath[asPath.length - 1];

          if (pathMap.has(pathKey)) {
            const existing = pathMap.get(pathKey)!;
            existing.peer_count++;
            existing.collector_count = new Set([...Array(existing.collector_count), rrc.rrc]).size;
          } else {
            pathMap.set(pathKey, {
              as_path: asPath,
              prefix,
              origin,
              peer_count: 1,
              collector_count: 1,
            });
          }
        }
      }

      const paths = Array.from(pathMap.values()).sort((a, b) => b.peer_count - a.peer_count);

      logger.info('AS path info fetched from RIS', {
        service: 'ris',
        prefix,
        uniquePaths: paths.length,
      });

      return paths;
    } catch (error: any) {
      logger.error('Failed to fetch AS path info from RIS', {
        service: 'ris',
        prefix,
        error: error.message,
      });
      throw new Error(`Failed to fetch AS path info: ${error.message}`);
    }
  }

  /**
   * Get BGP updates for an ASN (recent announcements/withdrawals)
   */
  async getBGPUpdates(asn: string, hours: number = 24): Promise<RISAnnouncement[]> {
    try {
      logger.debug('Fetching BGP updates from RIS', {
        service: 'ris',
        asn,
        hours,
      });

      const cleanASN = asn.replace(/^AS/i, '');
      const url = `${this.baseURL}/bgp-updates/data.json?resource=AS${cleanASN}&starttime=${hours}h`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`RIS API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(`RIS API error: ${data.status_code || 'Unknown error'}`);
      }

      const updates: RISAnnouncement[] = [];
      const updatesData = data.data?.updates || [];

      for (const update of updatesData) {
        if (update.type === 'announcement' && update.attrs) {
          updates.push({
            prefix: update.prefix,
            origin_asn: update.attrs.origin || '',
            as_path: update.attrs.path || [],
            peer_asn: update.attrs.peer || '',
            collector: update.rrc || '',
            timestamp: update.timestamp,
          });
        }
      }

      logger.info('BGP updates fetched from RIS', {
        service: 'ris',
        asn,
        count: updates.length,
      });

      return updates.slice(0, 100); // Limit to 100 most recent
    } catch (error: any) {
      logger.error('Failed to fetch BGP updates from RIS', {
        service: 'ris',
        asn,
        error: error.message,
      });
      throw new Error(`Failed to fetch BGP updates: ${error.message}`);
    }
  }

  /**
   * Test RIS API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseURL}/announced-prefixes/data.json?resource=AS3333`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const risService = new RISService();
