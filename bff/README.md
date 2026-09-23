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
│       └── raffstore.routes.ts  # REST API endpoints
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
GATEWAY_TOKEN=your-token            # OAuth token for gateway
LOG_LEVEL=debug                     # Logging level
NODE_ENV=development                # Node environment
```

## 🏗️ Architecture

```
Request Flow:
1. Angular Client → POST /api/raffstores/:id/moveUp
2. BFF Routes → Validate & route to service
3. RaffstoreService → Create KNX command
4. GatewayService → HTTP PUT to /api/v2/datapoints/values
5. BFF → Update local state
6. BFF → Emit event to subscribers
7. Event Stream → Push to Angular via SSE
8. Response → Return updated raffstore
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
- **cors** - CORS middleware
- **axios** - HTTP client for gateway communication
- **dotenv** - Environment variables

## 🐛 Troubleshooting

**BFF won't start**
```bash
# Check Node version
node --version  # Should be 18+

# Check env vars
echo $GATEWAY_URL
echo $GATEWAY_TOKEN

# Check gateway
curl http://localhost:8080/health
```

**Commands not working**
```bash
# Check BFF logs
npm run dev  # Will show detailed logs

# Test gateway connection
curl http://localhost:8080/api/v2/datapoints

# Verify token
echo $GATEWAY_TOKEN
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
