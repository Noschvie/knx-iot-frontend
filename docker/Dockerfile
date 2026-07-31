# Multi-stage build
FROM node:26-alpine AS build

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

COPY --from=build /build/dist/knx-iot-frontend/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
