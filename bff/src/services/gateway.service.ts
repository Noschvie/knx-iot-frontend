/**
 * GatewayService - Handles communication with KNX Gateway
 */

import axios, { AxiosInstance } from 'axios';
import { GatewayDatapoint, GatewayCommand } from '../models';
import { TokenService } from './token.service';

export class GatewayService {
  private gatewayUrl: string;
  private client: AxiosInstance;
  private tokenService: TokenService;
  private gaToDatapointId: Map<string, string> = new Map();

  constructor(gatewayUrl: string, tokenService: TokenService) {
    this.gatewayUrl = gatewayUrl;
    this.tokenService = tokenService;
    this.client = axios.create({
      baseURL: gatewayUrl
    });
  }

  /**
   * Initialize gateway datapoint mappings
   * Discovers all datapoints and maps GA → DatapointID
   */
  async initializeDatapoints(gasToDiscover: string[]): Promise<void> {
    try {
      console.log('[GatewayService] Discovering datapoints for GAs:', gasToDiscover);
      
      // Get valid read token
      const readToken = this.tokenService.getReadToken();
      if (!readToken) {
        throw new Error('No valid read token available');
      }

      // Get all datapoints from gateway with auth token
      const response = await this.client.get('/api/v2/datapoints', {
        headers: {
          Authorization: `Bearer ${readToken}`,
          Accept: 'application/json'
        }
      });
      const datapoints: GatewayDatapoint[] = response.data.data || [];

      // Build mapping GA → DatapointID
      for (const dp of datapoints) {
        if (gasToDiscover.includes(dp.groupAddress)) {
          this.gaToDatapointId.set(dp.groupAddress, dp.id);
          console.log(`[GatewayService] Mapped GA ${dp.groupAddress} → DP ${dp.id}`);
        }
      }

      console.log(`[GatewayService] Initialized ${this.gaToDatapointId.size} datapoint mappings`);
    } catch (error) {
      console.error('[GatewayService] Failed to initialize datapoints:', error);
      throw error;
    }
  }

  /**
   * Get DatapointID for a specific Group Address
   */
  getDatapointId(ga: string): string {
    const id = this.gaToDatapointId.get(ga);
    if (!id) {
      throw new Error(`No datapoint found for GA: ${ga}`);
    }
    return id;
  }

  /**
   * Send command to gateway
   */
  async sendCommand(command: GatewayCommand): Promise<void> {
    try {
      console.log('[GatewayService] Sending command:', JSON.stringify(command));
      
      const writeToken = this.tokenService.getWriteToken();
      if (!writeToken) {
        throw new Error('No valid write token available');
      }

      await this.client.put('/api/v2/datapoints/values', command, {
        headers: {
          Authorization: `Bearer ${writeToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log('[GatewayService] Command sent successfully');
    } catch (error) {
      console.error('[GatewayService] Failed to send command:', error);
      throw error;
    }
  }

  /**
   * Get status of a specific datapoint
   */
  async getDatapointValue(ga: string): Promise<string | number> {
    try {
      const datapointId = this.getDatapointId(ga);
      const readToken = this.tokenService.getReadToken();
      if (!readToken) {
        throw new Error('No valid read token available');
      }

      const response = await this.client.get(`/api/v2/datapoints/${datapointId}`, {
        headers: {
          Authorization: `Bearer ${readToken}`,
          Accept: 'application/json'
        }
      });
      return response.data.data.attributes.value;
    } catch (error) {
      console.error(`[GatewayService] Failed to get datapoint value for GA ${ga}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple datapoint values
   */
  async getDatapointValues(gas: string[]): Promise<Map<string, string | number>> {
    const result = new Map<string, string | number>();
    
    for (const ga of gas) {
      try {
        const value = await this.getDatapointValue(ga);
        result.set(ga, value);
      } catch (error) {
        console.warn(`[GatewayService] Could not get value for GA ${ga}`);
      }
    }

    return result;
  }
}
