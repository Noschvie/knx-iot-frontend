/**
 * TokenService - Handles OAuth2 token acquisition and refresh
 * Moved from frontend (OAuth2Service) to BFF for centralized token management
 */

import axios, { AxiosInstance } from 'axios';

export interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface TokenCache {
  read: string | null;
  readExpiresAt: number;
  write: string | null;
  writeExpiresAt: number;
  manage: string | null;
  manageExpiresAt: number;
}

export class TokenService {
  private apiBase: string;
  private tokenEndpoint: string;
  private clientId: string;
  private clientSecret: string;
  private client: AxiosInstance;
  private tokenCache: TokenCache = {
    read: null,
    readExpiresAt: 0,
    write: null,
    writeExpiresAt: 0,
    manage: null,
    manageExpiresAt: 0
  };
  private refreshTimeout?: NodeJS.Timeout;
  private readonly REFRESH_SKEW_SECONDS = 60;

  constructor(apiBase: string, tokenEndpoint: string, clientId: string, clientSecret: string) {
    this.apiBase = apiBase;
    this.tokenEndpoint = tokenEndpoint;
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    this.client = axios.create({
      baseURL: apiBase,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('[TokenService] Initialized with:');
    console.log(`  - apiBase: ${apiBase}`);
    console.log(`  - tokenEndpoint: ${tokenEndpoint}`);
    console.log(`  - clientId: ${clientId}`);
  }

  /**
   * Acquire read, write and manage tokens from the OAuth2 server
   */
  async acquireTokens(): Promise<{ read: string; write: string; manage: string }> {
    try {
      console.log('[TokenService] Acquiring OAuth2 tokens (read + write + manage)...');

      const [readToken, writeToken, manageToken] = await Promise.all([
        this.fetchToken('read'),
        this.fetchToken('write'),
        this.fetchToken('manage')
      ]);

      console.log('[TokenService] All tokens acquired successfully');
      console.log(`[TokenService] - Read token (expires in ${readToken.expires_in}s)`);
      console.log(`[TokenService] - Write token (expires in ${writeToken.expires_in}s)`);
      console.log(`[TokenService] - Manage token (expires in ${manageToken.expires_in}s)`);

      // Cache tokens
      this.tokenCache.read = readToken.access_token;
      this.tokenCache.readExpiresAt = Date.now() + readToken.expires_in * 1000;
      this.tokenCache.write = writeToken.access_token;
      this.tokenCache.writeExpiresAt = Date.now() + writeToken.expires_in * 1000;
      this.tokenCache.manage = manageToken.access_token;
      this.tokenCache.manageExpiresAt = Date.now() + manageToken.expires_in * 1000;

      // Schedule automatic refresh
      const minExpiresIn = Math.min(
        readToken.expires_in,
        writeToken.expires_in,
        manageToken.expires_in
      );
      this.scheduleRefresh(minExpiresIn);

      return {
        read: readToken.access_token,
        write: writeToken.access_token,
        manage: manageToken.access_token
      };
    } catch (error) {
      console.error('[TokenService] Failed to acquire tokens:', error);
      throw error;
    }
  }

  /**
   * Get a valid read token (refresh if needed)
   */
  getReadToken(): string | null {
    if (this.isTokenValid(this.tokenCache.readExpiresAt)) {
      return this.tokenCache.read;
    }
    console.warn('[TokenService] Read token expired or invalid');
    return null;
  }

  /**
   * Get a valid writing token (refresh if needed)
   */
  getWriteToken(): string | null {
    if (this.isTokenValid(this.tokenCache.writeExpiresAt)) {
      return this.tokenCache.write;
    }
    console.warn('[TokenService] Write token expired or invalid');
    return null;
  }

  /**
   * Get a valid manage token (refresh if needed)
   */
  getManageToken(): string | null {
    if (this.isTokenValid(this.tokenCache.manageExpiresAt)) {
      return this.tokenCache.manage;
    }
    console.warn('[TokenService] Manage token expired or invalid');
    return null;
  }

  /**
   * Check if the token is valid (not expired and not about to expire)
   */
  private isTokenValid(expiresAt: number): boolean {
    if (expiresAt <= 0) {
      return false;
    }
    const now = Date.now();
    const skewMs = this.REFRESH_SKEW_SECONDS * 1000;
    return now + skewMs < expiresAt;
  }

  /**
   * Fetch a single token (read or write scope)
   */
  private async fetchToken(scope: string): Promise<OAuthToken> {
    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        scope
      });

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const headers = {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      console.log(`[TokenService] Requesting ${scope} token from: ${this.apiBase}${this.tokenEndpoint}`);

      const response = await this.client.post<OAuthToken>(this.tokenEndpoint, body.toString(), { headers });

      console.log(`[TokenService] ${scope.toUpperCase()} token received (expires in ${response.data.expires_in}s)`);
      return response.data;
    } catch (error: any) {
      console.error(`[TokenService] Failed to fetch ${scope} token:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: `${this.apiBase}${this.tokenEndpoint}`
      });
      throw error;
    }
  }

  /**
   * Schedule automatic token refresh before expiration
   */
  private scheduleRefresh(expiresInSeconds: number): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    const delaySeconds = Math.max(expiresInSeconds - this.REFRESH_SKEW_SECONDS, this.REFRESH_SKEW_SECONDS);
    console.log(`[TokenService] Next token refresh scheduled in ${delaySeconds}s`);

    this.refreshTimeout = setTimeout(() => {
      console.log('[TokenService] Executing scheduled token refresh...');
      this.acquireTokens().catch((error) => {
        console.error('[TokenService] Scheduled refresh failed, will retry in 60s:', error);
        this.scheduleRefresh(this.REFRESH_SKEW_SECONDS);
      });
    }, delaySeconds * 1000);
  }

  /**
   * Cleanup - cancel scheduled refresh
   */
  destroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    console.log('[TokenService] Destroyed');
  }
}
