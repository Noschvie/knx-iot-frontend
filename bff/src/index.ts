/**
 * BFF (Backend-for-Frontend) Main Application
 * Handles raffstore commands and events for Angular frontend
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GatewayService } from './services/gateway.service';
import { TokenService } from './services/token.service';
import { RaffstoreService } from './services/raffstore.service';
import { createRaffstoreRouter } from './routes/raffstore.routes';
import { createGatewayApiProxy, createGatewayWsProxy } from './routes/gateway-proxy';
import { DEFAULT_RAFFSTORE_CONFIG } from './config/raffstore-config';
import { BFFResponse } from './models';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const OAUTH_TOKEN_ENDPOINT = process.env.OAUTH_TOKEN_ENDPOINT || '/oauth/access';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Services
let tokenService: TokenService | null = null;
let raffstoreService: RaffstoreService | null = null;

/**
 * Returns a currently valid gateway token for proxied requests.
 */
const getGatewayToken = (write: boolean): string | null => {
  if (!tokenService) {
    return null;
  }
  return write ? tokenService.getWriteToken() : tokenService.getReadToken();
};

// Proxy native gateway traffic through the BFF (token injected server-side)
const gatewayWsProxy = createGatewayWsProxy(GATEWAY_URL, getGatewayToken);

/**
 * Initialize BFF services
 */
async function initializeServices(): Promise<void> {
  // Validate OAuth credentials
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('[BFF] Failed to initialize services: Missing OAuth credentials (CLIENT_ID or CLIENT_SECRET)');
    process.exit(1);
  }

  try {
    console.log('[BFF] Initializing services...');
    console.log(`[BFF] Gateway URL: ${GATEWAY_URL}`);

    // Create Token Service and acquire tokens
    tokenService = new TokenService(GATEWAY_URL, OAUTH_TOKEN_ENDPOINT, CLIENT_ID, CLIENT_SECRET);
    await tokenService.acquireTokens();

    // Create Gateway Service with token service
    const gatewayService = new GatewayService(GATEWAY_URL, tokenService);

    // Extract all GAs from config for initialization
    const allGAs = new Set<string>();
    for (const cfg of DEFAULT_RAFFSTORE_CONFIG) {
      allGAs.add(cfg.gaMove);
      allGAs.add(cfg.gaStep);
      allGAs.add(cfg.gaPositionSet);
      allGAs.add(cfg.gaLamellasSet);
      allGAs.add(cfg.gaStatusPosition);
      allGAs.add(cfg.gaStatusLamellas);
      allGAs.add(cfg.gaLock);
      allGAs.add(cfg.gaEndTop);
      allGAs.add(cfg.gaEndBottom);
    }

    console.log(`[BFF] Initializing ${allGAs.size} datapoints from gateway...`);
    await gatewayService.initializeDatapoints(Array.from(allGAs));

    // Create Raffstore Service
    raffstoreService = new RaffstoreService(gatewayService, DEFAULT_RAFFSTORE_CONFIG);

    console.log('[BFF] Services initialized successfully');
  } catch (error) {
    console.error('[BFF] Failed to initialize services:', error);
    process.exit(1);
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  const response: BFFResponse = {
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
    timestamp: Date.now()
  };
  res.json(response);
});

/**
 * Info endpoint
 */
app.get('/info', (req: Request, res: Response) => {
  const response: BFFResponse = {
    success: true,
    data: {
      name: 'KNX IoT BFF',
      version: '2.0.0',
      description: 'Backend-for-Frontend for KNX IoT Gateway',
      gatewayUrl: GATEWAY_URL
    },
    timestamp: Date.now()
  };
  res.json(response);
});

/**
 * Config endpoint - serves raffstore configuration
 */
app.get('/config/raffstore', (req: Request, res: Response) => {
  const response: BFFResponse = {
    success: true,
    data: {
      raffstores: DEFAULT_RAFFSTORE_CONFIG
    },
    timestamp: Date.now()
  };
  res.json(response);
});

/**
 * Setup Routes
 */

// Forward the native gateway REST API (/api/v2/*) and messaging WebSocket
app.use(createGatewayApiProxy(GATEWAY_URL, getGatewayToken));
app.use(gatewayWsProxy);

app.use('/api', (req: Request, res: Response, next) => {
  if (!raffstoreService) {
    return res.status(503).json({
      success: false,
      error: 'Service not initialized',
      timestamp: Date.now()
    });
  }
  next();
});

app.use('/api', createRaffstoreRouter(() => raffstoreService!));

/**
 * 404 Handlers
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    timestamp: Date.now()
  });
});

/**
 * Error Handler
 */
app.use((error: any, req: Request, res: Response, _next: any) => {
  console.error('[BFF] Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
    timestamp: Date.now()
  });
});

/**
 * Start Server
 */
async function start(): Promise<void> {
  try {
    await initializeServices();

    const server = app.listen(PORT, () => {
      console.log(`[BFF] Server running on http://localhost:${PORT}`);
      console.log(`[BFF] Raffstores API: http://localhost:${PORT}/api/raffstores`);
      console.log(`[BFF] Health check: http://localhost:${PORT}/health`);
      console.log(`[BFF] Info: http://localhost:${PORT}/info`);
    });

    // Proxy WebSocket upgrades (/messaging/ws) to the gateway
    server.on('upgrade', gatewayWsProxy.upgrade);
  } catch (error) {
    console.error('[BFF] Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[BFF] SIGTERM received, shutting down gracefully');
  if (tokenService) {
    tokenService.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[BFF] SIGINT received, shutting down gracefully');
  if (tokenService) {
    tokenService.destroy();
  }
  process.exit(0);
});

// Start the application
start();

export { app, raffstoreService };
