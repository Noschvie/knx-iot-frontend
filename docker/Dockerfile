# Multi-stage build
FROM node:26-alpine AS build

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

# Install timezone data and Node.js (for Syslog bridge service)
RUN apk add --no-cache tzdata nodejs

COPY --from=build /build/dist/knx-iot-frontend/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/syslog-bridge.js /syslog-bridge.js
RUN chmod +x /entrypoint.sh /syslog-bridge.js

EXPOSE 80 9514

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:80/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["/entrypoint.sh"]
