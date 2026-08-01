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

CMD ["/entrypoint.sh"]
