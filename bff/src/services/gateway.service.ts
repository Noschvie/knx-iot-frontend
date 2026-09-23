/**
 * GatewayService - Handles communication with KNX Gateway
 */

import axios, { AxiosInstance } from 'axios';
import { GatewayDatapoint, GatewayCommand } from '../models';
import { TokenService } from './token.service';

/**
 * API Version - centralized configuration
 * Ensures all requests use the same API version
 */
const API_VERSION = '/api/v2';

export class GatewayService {
  private client: AxiosInstance;
  private tokenService: TokenService;
  private gaToDatapointId: Map<string, string> = new Map();

  constructor(gatewayUrl: string, tokenService: TokenService) {
    this.tokenService = tokenService;
    this.client = axios.create({
      baseURL: gatewayUrl
    });
  }

  /**
   * Get the full API endpoint URL including a version
   * e.g., /api/v2 or /api/v2/datapoints
   */
  private getApiEndpoint(path: string = ''): string {
    return `${API_VERSION}${path}`;
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

      // Query each GA individually to avoid URL length issues
      for (const ga of gasToDiscover) {
        try {
          const response = await this.client.get(this.getApiEndpoint('/datapoints'), {
            params: { 'filter[ga]': ga },
            headers: { 
              Authorization: `Bearer ${readToken}`,
              Accept: 'application/vnd.api+json'
            }
          });
          
          const datapoints: GatewayDatapoint[] = response.data.data || [];
          for (const dp of datapoints) {
            // The datapoints API returns JSON:API resources whose top-level `id`
            // is the vendor datapoint UUID; the group address is not present as a
            // top-level `groupAddress` field. Since we query one GA at a time, the
            // queried `ga` is the correct key for the returned datapoint(s).
            this.gaToDatapointId.set(ga, dp.id);
            console.log(`[GatewayService] Mapped GA ${ga} → DP ${dp.id}`);
          }
        } catch (error) {
          console.warn(`[GatewayService] Failed to initialize datapoint for GA ${ga}:`, error);
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

      await this.client.put(this.getApiEndpoint('/datapoints/values'), command, {
        headers: {
          Authorization: `Bearer ${writeToken}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
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

      const response = await this.client.get(this.getApiEndpoint(`/datapoints/${datapointId}`), {
        headers: {
          Authorization: `Bearer ${readToken}`,
          Accept: 'application/vnd.api+json'
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
