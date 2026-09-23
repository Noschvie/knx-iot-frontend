/**
 * Gateway Proxy - transparently forwards KNX Gateway traffic through the BFF
 *
 * The Angular frontend talks to the BFF only (same-origin). Requests that the
 * BFF does not implement itself (the native gateway API `/api/v2/*` and the
 * messaging WebSocket `/messaging/ws`) are proxied to the gateway here, with the
 * OAuth bearer token injected server-side so the browser never needs it.
 */

import { createProxyMiddleware, fixRequestBody, RequestHandler } from 'http-proxy-middleware';
import type { Request, Response } from 'express';

/**
 * Returns a valid gateway token. `write` selects the write-scoped token for
 * mutating requests, otherwise the read-scoped token is used.
 */
export type TokenGetter = (write: boolean) => string | null;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * HTTP proxy for the native gateway REST API (`/api/v2/*`).
 */
export function createGatewayApiProxy(target: string, getToken: TokenGetter): RequestHandler {
  return createProxyMiddleware<Request, Response>({
    target,
    changeOrigin: true,
    pathFilter: '/api/v2/**',
    on: {
      proxyReq: (proxyReq, req) => {
        const method = (req.method || 'GET').toUpperCase();
        const token = getToken(!SAFE_METHODS.has(method));
        if (token) {
          proxyReq.setHeader('Authorization', `Bearer ${token}`);
        }
        // Re-stream the body that express.json() may already have consumed.
        fixRequestBody(proxyReq, req);
      },
    },
  });
}

/**
 * WebSocket proxy for the gateway messaging endpoint (`/messaging/ws`).
 * The gateway authenticates the upgrade via a `token` query parameter.
 */
export function createGatewayWsProxy(target: string, getToken: TokenGetter): RequestHandler {
  return createProxyMiddleware<Request, Response>({
    target,
    changeOrigin: true,
    ws: true,
    pathFilter: '/messaging/ws',
    pathRewrite: (path: string) => {
      const token = getToken(false);
      if (!token) {
        return path;
      }
      const separator = path.includes('?') ? '&' : '?';
      return `${path}${separator}token=${encodeURIComponent(token)}`;
    },
  });
}
