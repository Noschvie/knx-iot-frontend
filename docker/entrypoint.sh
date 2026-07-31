#!/bin/sh

# Write Angular runtime config
cat <<EOF > /usr/share/nginx/html/assets/config.json
{
  "apiBase": "${API_BASE:-http://localhost:3000}",
  "wsBase": "${WS_BASE:-ws://localhost:3000}"
}
EOF

exec nginx -g "daemon off;"