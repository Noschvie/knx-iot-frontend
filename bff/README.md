# BFF (Backend-for-Frontend) - KNX IoT

Zentralisierter Backend-Service für raffstore Befehle und Events.

## 📁 Struktur

```
bff/
├── src/
│   ├── index.ts                 # Main application & server setup
│   ├── models.ts                # TypeScript types & interfaces
│   ├── config/
│   │   └── raffstore-config.ts  # Default raffstore configuration
│   ├── services/
│   │   ├── gateway.service.ts   # KNX Gateway communication
│   │   └── raffstore.service.ts # Business logic & commands
│   └── routes/
│       ├── raffstore.routes.ts      # REST API endpoints
│       └── gateway-proxy.ts         # Same-origin gateway REST/WS proxy
├── package.json
├── tsconfig.json
└── .env.example
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Build
npm run build

# Production
npm start

# Watch for changes
npm run watch
```

## 📡 API Endpoints

### General
- `GET /health` - Health check
- `GET /info` - Server info

### Raffstores
- `GET /api/raffstores` - Get all
- `GET /api/raffstores/:id` - Get single
- `POST /api/raffstores/:id/moveUp` - Move up
- `POST /api/raffstores/:id/moveDown` - Move down
- `POST /api/raffstores/:id/stop` - Stop
- `PUT /api/raffstores/:id/height` - Set height
- `PUT /api/raffstores/:id/angle` - Set angle
- `PUT /api/raffstores/:id/position` - Set position
- `POST /api/raffstores/:id/favorite` - Apply favorite
- `POST /api/raffstores/group/:floor/:direction` - Group command
- `GET /api/raffstores/events` - Event stream (SSE)

## 🔐 Environment Variables

```bash
PORT=3000                           # Server port
GATEWAY_URL=http://localhost:8080   # KNX Gateway URL
CLIENT_ID=your-client-id            # OAuth client id for gateway
CLIENT_SECRET=your-client-secret    # OAuth client secret for gateway
LOG_LEVEL=debug                     # Logging level
NODE_ENV=development                # Node environment
```

## 🏗️ Architecture

```
Request Flow:
1. Browser → nginx frontend (same-origin)
2. nginx proxies /api/, /info and /messaging/ to the BFF
3. BFF obtains gateway OAuth tokens using CLIENT_ID/CLIENT_SECRET
4. BFF injects read tokens for safe methods and write tokens for mutations
5. BFF proxies native gateway REST (/api/v2/*) and WebSocket (/messaging/ws) to GATEWAY_URL
6. Raffstore routes continue to serve domain-specific commands and SSE events
```

## 🧪 Testing

```bash
# Test all endpoints
bash ../scripts/test-bff.sh

# Individual tests
curl http://localhost:3000/api/raffstores
curl -X POST http://localhost:3000/api/raffstores/rs-1/moveUp

# Event stream
curl -N http://localhost:3000/api/raffstores/events
```

## 📦 Dependencies

- **express** - Web framework
- **cors** - CORS middleware for local/direct BFF development
- **axios** - HTTP client for gateway communication
- **http-proxy-middleware** - Native gateway REST/WebSocket proxy
- **dotenv** - Environment variables

## 🐛 Troubleshooting

**BFF won't start**
```bash
# Check Node version
node --version  # Should be 18+

# Check env vars
echo $GATEWAY_URL
echo $CLIENT_ID
echo $CLIENT_SECRET

# Check gateway
curl http://localhost:8080/health
```

**Commands not working**
```bash
# Check BFF logs
npm run dev  # Will show detailed logs

# Test gateway connection
curl http://localhost:8080/api/v2/datapoints

# Verify OAuth credentials
echo $CLIENT_ID
echo $CLIENT_SECRET
```

**Events not received**
```bash
# Test SSE
curl -N http://localhost:3000/api/raffstores/events

# Should receive events when commands are sent
```

## 📚 More Information

- See `BFF-SETUP.md` for detailed setup guide
- See `INTEGRATION.md` for Angular integration steps
- See `../CHANGELOG.md` for version history
