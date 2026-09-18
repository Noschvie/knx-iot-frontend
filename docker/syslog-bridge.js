#!/usr/bin/env node

/**
 * Syslog UDP Bridge Service
 *
 * Receives HTTP POST requests and forwards them to Syslog server via UDP.
 * This allows the frontend to send logs to Syslog without direct UDP support.
 *
 * Sanitizes Unicode characters to prevent issues with Syslog servers (RFC 3164).
 *
 * Usage:
 *   POST /syslog
 *   {
 *     "priority": 134,
 *     "timestamp": "14:32:45.123",
 *     "level": "LOG",
 *     "hostname": "syslog-server",
 *     "tag": "knx-iot-frontend",
 *     "message": "[AUTH] Starting OAuth2 login...",
 *     "userAgent": "Mozilla/5.0..."
 *   }
 */

const http = require('http');
const dgram = require('dgram');

const LISTEN_PORT = process.env.LOG_BRIDGE_PORT || 9514;
const SYSLOG_HOST = process.env.SYSLOG_HOST || 'localhost';
const SYSLOG_PORT = process.env.SYSLOG_PORT || 514;

// RFC 3164 limit: 1024 bytes
const MAX_SYSLOG_LENGTH = 1024;

/**
 * Sanitize a log message by removing/replacing Unicode characters
 * This prevents issues with Syslog servers that expect ASCII text (RFC 3164)
 */
function sanitizeForSyslog(message) {
  if (!message) return message;

  // Replace common Unicode symbols with ASCII equivalents
  let sanitized = message
    .replace(/✓/g, '[OK]')           // Check mark
    .replace(/✗/g, '[FAIL]')         // Cross mark
    .replace(/•/g, '*')              // Bullet point
    .replace(/→/g, '->')             // Right arrow
    .replace(/←/g, '<-')             // Left arrow
    .replace(/…/g, '...')            // Ellipsis
    .replace(/—/g, '--')             // Em dash
    .replace(/–/g, '-')              // En dash
    .replace(/"/g, '"')              // Left double quote
    .replace(/"/g, '"')              // Right double quote
    .replace(/'/g, "'")              // Left single quote
    .replace(/'/g, "'");             // Right single quote

  // Remove any remaining non-ASCII characters (keep only 32-126 and common whitespace)
  sanitized = sanitized.replace(/[^\x20-\x7E\t\n\r]/g, '?');

  return sanitized;
}

// Create UDP client for Syslog
const syslogClient = dgram.createSocket('udp4');

// Create HTTP server
const server = http.createServer((req, res) => {

  if (req.method === 'POST' && req.url === '/syslog') {
    console.log(`[Syslog Bridge] [OK] Received POST /syslog from ${req.socket.remoteAddress}`);
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const logData = JSON.parse(body);

        // Format RFC 5424 syslog message
        const { priority, timestamp, hostname, tag, level, message } = logData;

        // Sanitize the message to remove Unicode characters
        const sanitizedMessage = sanitizeForSyslog(message);
        const syslogMessage = `<${priority}>${timestamp} ${hostname} ${tag}[${level}]: ${sanitizedMessage}`;

        // Truncate if necessary to prevent message loss.
        const truncatedMessage = syslogMessage.length > MAX_SYSLOG_LENGTH
          ? syslogMessage.substring(0, MAX_SYSLOG_LENGTH - 4) + '...'
          : syslogMessage;

        // Send to Syslog server via UDP
        syslogClient.send(truncatedMessage, 0, truncatedMessage.length, SYSLOG_PORT, SYSLOG_HOST, (err) => {
          if (err) {
            console.error(`[Syslog Bridge] [ERR] Error: ${SYSLOG_HOST}:${SYSLOG_PORT} - ${err.message}`);
          }
        });

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } catch (err) {
        console.error('[Syslog Bridge] Error parsing JSON:', err.message);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid JSON');
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', syslog: `${SYSLOG_HOST}:${SYSLOG_PORT}` }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Error handling
syslogClient.on('error', (err) => {
  console.error('[Syslog Bridge] UDP Socket Error:', err);
});

// Start server
server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log('[Syslog Bridge] Started on 0.0.0.0:' + LISTEN_PORT);
  console.log('[Syslog Bridge] Forwarding to ' + SYSLOG_HOST + ':' + SYSLOG_PORT);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Syslog Bridge] Shutting down...');
  server.close(() => {
    syslogClient.close();
    process.exit(0);
  });
});
