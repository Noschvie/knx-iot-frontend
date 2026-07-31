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

exec nginx -g "daemon off;"