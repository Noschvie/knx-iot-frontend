#!/bin/sh

# Verzeichnis anlegen falls nicht vorhanden
mkdir -p /usr/share/nginx/html/assets/config

# Angular runtime config schreiben (Pfad passend zu ConfigService)
cat <<EOF > /usr/share/nginx/html/assets/config/app-config.json
{
  "apiBase": "${API_BASE:-http://localhost:3000}",
  "wsBase": "${WS_BASE:-ws://localhost:3000}"
}
EOF

exec nginx -g "daemon off;"