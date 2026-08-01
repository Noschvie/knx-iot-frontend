#!/usr/bin/env node

/**
 * Syslog UDP Bridge Service
 *
 * Receives HTTP POST requests and forwards them to Syslog server via UDP.
 * This allows the frontend to send logs to Syslog without direct UDP support.
 *
 * Usage:
 *   POST /syslog
 *   {
 *     "priority": 134,
 *     "timestamp": "14:32:45.123",
 *     "level": "LOG",
 *     "hostname": "eibesthal",
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

// Create UDP client for Syslog
const syslogClient = dgram.createSocket('udp4');

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/syslog') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const logData = JSON.parse(body);

        // Format RFC 5424 syslog message
        const { priority, timestamp, hostname, tag, level, message } = logData;
        const syslogMessage = `<${priority}>${timestamp} ${hostname} ${tag}[${level}]: ${message}`;

        // Send to Syslog server via UDP
        syslogClient.send(syslogMessage, 0, syslogMessage.length, SYSLOG_PORT, SYSLOG_HOST, (err) => {
          if (err) {
            console.error(`[Syslog Bridge] Error sending to ${SYSLOG_HOST}:${SYSLOG_PORT}:`, err.message);
          } else {
            console.log(`[Syslog Bridge] ✓ Sent to Syslog: <${priority}> ${tag}[${level}]: ${message.substring(0, 50)}...`);
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
  console.log('=== Syslog UDP Bridge Started ===');
  console.log(`Listening on: 0.0.0.0:${LISTEN_PORT}`);
  console.log(`Syslog Server: ${SYSLOG_HOST}:${SYSLOG_PORT}`);
  console.log('Health Check: GET /health');
  console.log('==================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Syslog Bridge] Shutting down...');
  server.close(() => {
    syslogClient.close();
    process.exit(0);
  });
});
