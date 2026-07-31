#!/bin/sh

# Resolve API_BASE and WS_BASE with defaults
API_BASE="${API_BASE:-http://localhost:3000}"
WS_BASE="${WS_BASE:-http://localhost:3000}"

# Write Angular runtime config
cat <<EOF > /usr/share/nginx/html/assets/config.json
{
  "apiBase": "${API_BASE}",
  "wsBase": "${WS_BASE}"
}
EOF

# Substitute placeholders in nginx.conf
sed -i "s|NGINX_API_BASE|${API_BASE}|g" /etc/nginx/nginx.conf
sed -i "s|NGINX_WS_BASE|${WS_BASE}|g" /etc/nginx/nginx.conf

exec nginx -g "daemon off;"