#!/bin/sh

# Create directory if it does not exist
mkdir -p /usr/share/nginx/html/assets/config

# Write Angular runtime config (both paths so the local fallback does not serve the SPA HTML).
# apiBase/wsBase are empty: the frontend talks same-origin to the BFF, which proxies the gateway.
CONFIG_JSON='{"apiBase":"","wsBase":""}'

echo "$CONFIG_JSON" > /usr/share/nginx/html/assets/config/app-config.json
echo "$CONFIG_JSON" > /usr/share/nginx/html/assets/config/app-config.local.json

# Log startup information for debugging
echo "=== KNX IoT Frontend Container Started ==="
echo "TZ (Timezone): ${TZ:-UTC}"
echo "SYSLOG_HOST: ${SYSLOG_HOST}"
echo "SYSLOG_PORT: ${SYSLOG_PORT:-514}"
echo "LOG_BRIDGE_PORT: ${LOG_BRIDGE_PORT:-9514}"
echo "============================================"

# Start Syslog UDP bridge service in background
echo "[Starting Syslog Bridge Service]"
node /syslog-bridge.js &
BRIDGE_PID=$!
echo "Syslog Bridge running with PID: $BRIDGE_PID"

# Wait for bridge to start
sleep 1

# Start nginx in foreground
echo "[Starting Nginx]"
exec nginx -g "daemon off;"
