# GUI Frontend API — Adaptation Summary

> **Document:** Mapping between GUI-frontend-api.md specification and semantic-knx-gateway implementation  
> **Date:** 2026-07-30  
> **Status:** Updated for v2.1.0 API compliance

---

## Executive Summary

The **GUI-frontend-api.md** specification has been updated to accurately reflect the **semantic-knx-gateway** REST API implementation. Key changes include:

1. **API Format:** JSON:API 1.0 (KNX IoT spec-compliant) instead of custom JSON
2. **Real-Time:** WebSocket subscriptions instead of SignalR
3. **Authentication:** OAuth2 Bearer Token (RFC 6749) instead of JWT
4. **Hierarchy:** Location + Device + Datapoint + Semantic Functions
5. **Vendor Integration:** Functions API + metadata fields for vendor extensions

---

## Quick Reference: API Endpoint Mapping

### Before (Spec as originally written)
```
/api/datapoints                    (custom auth)
/api/devices                       (custom auth)
/hubs/datapoint-stream             (SignalR)
```

### After (Actual implementation)
```
/api/v2/datapoints                 (JSON:API, OAuth2)
/api/v2/devices                    (JSON:API, OAuth2)
/api/v2/locations                  (NEW: Hierarchy)
/api/v1/functions                  (NEW: Semantic layer)
/api/v2/subscriptions              (NEW: WebSocket subscriptions)
ws://gateway/messaging/ws          (WebSocket, gw.knx.org subprotocol)
```

---

## Key Implementation Changes

### 1. Data Models

#### Datapoint (JSON:API Format)
```typescript
// Before (custom DTO)
{
  id: 123,
  externalId: "1/2/3",
  name: "Temperature",
  lastValue: "21.5"
}

// After (JSON:API Resource)
{
  type: "datapoint",
  id: "1/2/3",
  attributes: {
    title: "Temperature",
    value: "21.5",
    meta: { "@type": "9.001" }
  },
  relationships: {
    device: { data: { type: "device", id: "sensor-1" } },
    function: { data: { type: "function", id: "temp-monitoring" } }
  }
}
```

#### New Entities
- **Location** — Hierarchical building/floor/room/zone structure
- **Function** — Semantic functions (vendor bridge layer)
- **Subscription** — WebSocket subscription configuration

### 2. Authentication

#### Before
- JWT token via `POST /api/auth/login`
- Custom refresh logic
- Single token in localStorage

#### After (OAuth2)
```typescript
// 1. Request token
POST /oauth/access
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=user&password=pass&client_id=...

// 2. Response
{
  access_token: "eyJhbGc...",
  token_type: "Bearer",
  expires_in: 3600
}

// 3. Use token in headers
Authorization: Bearer <access_token>
```

### 3. Real-Time Updates

#### Before (SignalR)
```typescript
// Connect
signalR.on("DatapointValueChanged", (id, value) => {
  // Update UI
});
```

#### After (WebSocket + JSON:API)
```typescript
// 1. Create subscription (optional)
POST /api/v2/subscriptions
{
  "data": {
    "type": "subscription",
    "attributes": {
      "filter": "filter[relationships.datapoint.id]=1/2/3"
    }
  }
}

// 2. Connect to WebSocket
ws://gateway/messaging/ws?token=<bearer>
Subprotocol: gw.knx.org

// 3. Receive messages
{
  "type": "datapoint_updated",
  "id": "1/2/3",
  "timestamp": "2026-07-30T10:34:15.123Z",
  "value": "21.5"
}

// 4. Or batch updates for high frequency
{
  "type": "batch",
  "updates": [
    { "id": "1/2/3", "value": "21.5" },
    { "id": "1/2/4", "value": "45%" }
  ]
}
```

### 4. Query Parameters

#### Before (Proprietary)
```
GET /api/datapoints?search=temp&device=sensor-1&type=9.001
```

#### After (KNX IoT Standard)
```
GET /api/v2/datapoints
  ?filter[meta.@type]=9.001
  &filter[relationships.device.id]=sensor-1
  &filter[title]=temp
  &page[offset]=0
  &page[limit]=50
  &sort=-lastUpdated
```

---

## New Component Requirements

### 1. FunctionBrowserComponent (NEW)
**Purpose:** Browse semantic functions (vendor integration layer)

```typescript
// UI: Show functions with associated datapoints
GET /api/v1/functions
GET /api/v1/functions/:id/datapoints
GET /api/v1/functions/:id/location
```

### 2. LocationHierarchyComponent (NEW/EXPANDED)
**Purpose:** Navigate device hierarchy through locations

```typescript
// UI: Tree of Building → Floor → Room → Device → Datapoint
GET /api/v2/locations
GET /api/v2/locations/:id/childlocations
GET /api/v2/locations/:id/devices
```

### 3. SubscriptionManagerComponent (NEW)
**Purpose:** Manage WebSocket subscriptions for real-time updates

```typescript
// UI: Create/update/delete subscriptions
POST /api/v2/subscriptions
PATCH /api/v2/subscriptions/:id
DELETE /api/v2/subscriptions/:id
```

### 4. JSON:API TransformerService (NEW)
**Purpose:** Convert JSON:API resources to internal types

```typescript
// Transform JSON:API datapoint resource
transformDatapoint(resource: JsonApiResource): DatapointViewModel

// Transform included relationships
resolveIncludes(data: JsonApiDocument): Map<string, Resource>
```

---

## Service Layer Updates

### Before
```typescript
@Injectable()
class ProjectService {
  getAllDatapoints(): Observable<DatapointDto[]>
  writeDatapoint(id: number, value: string): Observable<void>
}

@Injectable()
class SignalRService {
  datapoint$: Observable<DatapointValueChanged>
}
```

### After
```typescript
@Injectable()
class DatapointService {
  getAll(filters?: string): Observable<JsonApiDocument>
  getById(id: string): Observable<JsonApiResource>
  getValues(): Observable<JsonApiDocument>
  getTimeseries(id: string): Observable<TimeSeriesPoint[]>
  writeValues(updates: DatapointUpdate[]): Observable<void>
}

@Injectable()
class WebSocketService {
  connect(): Observable<WebSocketMessage>
  createSubscription(filter: string): Observable<SubscriptionResource>
}

@Injectable()
class FunctionService {
  getAll(): Observable<JsonApiDocument>
  getDatapoints(id: string): Observable<JsonApiDocument>
}

@Injectable()
class LocationService {
  getAll(): Observable<JsonApiDocument>
  getHierarchy(id: string): Observable<LocationHierarchy>
}

@Injectable()
class AuthService {
  login(username: string, password: string): Observable<OAuthToken>
  getToken(): string
  isTokenValid(): boolean
}
```

---

## HTTP Interceptor Updates

### Before
```typescript
// Add JWT to every request
headers.set('Authorization', `Bearer ${jwt}`);
```

### After
```typescript
// Add OAuth2 Bearer token
headers.set('Authorization', `Bearer ${oauthToken}`);

// Ensure Accept header is JSON:API compliant
headers.set('Accept', 'application/vnd.api+json');

// Set Content-Type for POST/PUT/PATCH
headers.set('Content-Type', 'application/vnd.api+json');
```

---

## Error Handling

### Before (Custom)
```json
{
  "success": false,
  "message": "Invalid request",
  "errors": []
}
```

### After (JSON:API Format)
```json
{
  "errors": [
    {
      "title": "Bad Request",
      "status": "400",
      "detail": "Invalid filter syntax",
      "links": {
        "about": "https://schema.knx.org/2020/api"
      }
    }
  ]
}
```

---

## Pagination Updates

### Before (Offset-based, custom)
```
GET /api/datapoints?skip=0&limit=50&sort=timestamp:desc
```

### After (JSON:API standard)
```
GET /api/v2/datapoints?page[offset]=0&page[limit]=50&sort=-timestamp
```

---

## Feature Completeness Checklist

### Real-Time Features
- [ ] WebSocket connection to `ws://gateway/messaging/ws`
- [ ] Subscribe to datapoint updates
- [ ] Handle batch updates (>100/sec)
- [ ] Reconnection logic (exponential backoff)
- [ ] Subscription management (create/update/delete)

### Query Features
- [ ] JSON:API filter syntax
- [ ] Multi-field search
- [ ] Pagination with offset/limit
- [ ] Sorting by any attribute
- [ ] Include relationships (JSON:API `include` parameter)

### Vendor Integration
- [ ] Parse `meta.*` fields
- [ ] Display vendor-specific properties
- [ ] Function browser (semantic layer)
- [ ] Location hierarchy navigation
- [ ] Custom metadata rendering

### Authentication
- [ ] OAuth2 token request flow
- [ ] Token storage and refresh
- [ ] Bearer token header injection
- [ ] Logout & token revocation
- [ ] Error handling for 401 responses

---

## Testing Scenarios

### 1. DatapointService Tests
```typescript
// Test JSON:API parsing
expect(service.getAll()).toContain({
  type: 'datapoint',
  attributes: { title: 'Temp' },
  relationships: { device: { data: { type: 'device' } } }
});

// Test filter construction
expect(httpClient.get).toHaveBeenCalledWith(
  '/api/v2/datapoints',
  { params: { 'filter[meta.@type]': '9.001' } }
);
```

### 2. WebSocket Tests
```typescript
// Test subscription creation
expect(http.post).toHaveBeenCalledWith(
  '/api/v2/subscriptions',
  { data: { type: 'subscription', ... } }
);

// Test message parsing
expect(buffer.push).toHaveBeenCalledWith({
  id: '1/2/3',
  value: '21.5',
  timestamp: '2026-07-30T...'
});
```

### 3. OAuth2 Tests
```typescript
// Test token exchange
expect(http.post).toHaveBeenCalledWith(
  '/oauth/access',
  'grant_type=password&...',
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);

// Test token storage
expect(localStorage.setItem).toHaveBeenCalledWith('access_token', '...');
```

---

## Performance Considerations

### 1. JSON:API Overhead
- Include relationships in a single request: `?include=device,function`
- Reduces N+1 query problem
- Trade-off: Larger payload

### 2. WebSocket Batching
- Gateway throttles >100 updates/sec
- Client receives `batch` messages instead of individual updates
- LiveBufferService unpacks batch automatically

### 3. Virtual Scrolling
- Render only visible rows (1000-row buffer)
- Debounce filter inputs (300ms)
- Use `CDK virtual scroll` for performance

### 4. Subscription Filters
- Server-side filtering reduces WebSocket traffic
- Use KNX IoT standard filters: `filter[meta.@type]=9.001`
- Client-side filtering as fallback

---

## Migration Checklist (from KNX-NG-Monitor)

- [ ] Replace `ProjectService` with `DatapointService`
- [ ] Migrate `SignalRService` to `WebSocketService`
- [ ] Update `AuthService` to use OAuth2
- [ ] Add `JSON:API TransformerService`
- [ ] Implement `FunctionService` (semantic layer)
- [ ] Implement `LocationService` (hierarchy)
- [ ] Update HTTP interceptor for JSON:API
- [ ] Update error handling to JSON:API format
- [ ] Update pagination to use `page[offset]`/`page[limit]`
- [ ] Add subscription management UI
- [ ] Test all endpoints with the actual gateway

---

## References

- **KNX IoT Specification:** https://schema.knx.org/2020/api
- **JSON:API Specification:** https://jsonapi.org/
- **OAuth2 RFC 6749:** https://tools.ietf.org/html/rfc6749
- **WebSocket RFC 6455:** https://tools.ietf.org/html/rfc6455

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-30  
**Author:** Semantic KNX Gateway Development Team
