#!/bin/sh

# Create directory if it does not exist
mkdir -p /usr/share/nginx/html/assets/config

# Write Angular runtime config (both paths so the local fallback does not serve the SPA HTML)
CONFIG_JSON=$(cat <<EOF
{
  "apiBase": "${API_BASE:-http://localhost:3000}",
  "wsBase": "${WS_BASE:-ws://localhost:3000}"
}
EOF
)

echo "$CONFIG_JSON" > /usr/share/nginx/html/assets/config/app-config.json
echo "$CONFIG_JSON" > /usr/share/nginx/html/assets/config/app-config.local.json

# Log startup information for debugging
echo "=== KNX IoT Frontend Container Started ==="
echo "API_BASE: ${API_BASE:-http://localhost:3000}"
echo "WS_BASE: ${WS_BASE:-ws://localhost:3000}"
echo "TZ (Timezone): ${TZ:-UTC}"
echo "SYSLOG_HOST: ${SYSLOG_HOST}"
echo "SYSLOG_PORT: ${SYSLOG_PORT}"
echo "Nginx is starting in foreground mode..."
echo "============================================"

exec nginx -g "daemon off;"