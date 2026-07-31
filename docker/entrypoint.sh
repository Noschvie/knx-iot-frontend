#!/bin/sh
cat <<EOF > /usr/share/nginx/html/assets/config.json
{
  "apiBase": "${API_BASE:-https://api.knx-iot.example.com}",
  "wsBase": "${WS_BASE:-wss://api.knx-iot.example.com}"
}
EOF
exec nginx -g "daemon off;"