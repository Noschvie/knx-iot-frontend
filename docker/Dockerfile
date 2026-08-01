# Multi-stage build
FROM node:26-alpine AS build

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

# Install timezone data for Alpine Linux to support TZ environment variable
RUN apk add --no-cache tzdata

COPY --from=build /build/dist/knx-iot-frontend/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
