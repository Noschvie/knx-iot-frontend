# KNX IoT 3rd-Party API — GUI Specification

> **Status:** Adapted for semantic-knx-gateway (Datapoint + Semantic Web-focused)  
> **Purpose:** Define a GUI for KNX IoT 3rd-Party API with vendor endpoints  
> **Last Updated:** 2026-07-30  
> **API Version:** v2 (JSON:API + WebSocket)

---

## Executive Summary

This document provides a complete GUI specification for an Angular-based KNX IoT monitoring application integrated with the **semantic-knx-gateway** backend. The design centers on **Datapoints** and **Semantic Functions** as primary organizational units, enabling rich KNX IoT monitoring with vendor-specific endpoints.

**Key Features of Semantic KNX Gateway:**
- **Core Entities:** Datapoint, Device, Function (Semantic Layer), Location (Hierarchy)
- **API Model:** Semantic Functions → IoT Devices → Datapoints → Values/History/Timeseries
- **Real-Time Streaming:** WebSocket subscriptions (JSON:API) + bulk value updates
- **Vendor Integration:** Semantic Layer bridges custom vendor endpoints to standard KNX IoT API
- **Advanced Features:** Functions API, Multi-location hierarchy, Installation management
- **Security:** OAuth2 Bearer Token (RFC 6749) + JSON:API compliance

---

## 1. Architecture Overview

### 1.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Angular 20 (Standalone Components) | Type safety, reactive, modern |
| **UI Library** | Angular Material + Custom KNX design system | Consistent theming, accessibility |
| **Data Grid** | AG-Grid Community or KnxTable (custom virtual scroller) | Handle 1000+ datapoints |
| **Charting** | ECharts (Apache 2.0) | Time-series, real-time, dark theme support |
| **Real-Time** | WebSocket (JSON:API subscriptions) | Datapoint value streams via vendor gateway |
| **HTTP** | HttpClient (Angular) | REST API calls to KNX IoT gateway |
| **State** | RxJS (Observables) | Reactive data flow, async operators |
| **Styling** | SCSS with CSS variables | Dark theme as primary, accessibility |
| **API Format** | JSON:API (1.0) | KNX IoT specification compliance

### 1.2 App Layers

```
┌──────────────────────────────────────────────────────────┐
│ Features (Smart Components)                              │
│ - Dashboard, Live Monitor, History, Charts               │
│ - Datapoint Manager, Device Browser                      │
│ - Function Browser (Semantic Functions)                  │
│ - Location Hierarchy, Settings, Logs                     │
├──────────────────────────────────────────────────────────┤
│ Core Services (Singletons)                               │
│ - AuthService (OAuth2 Bearer Token)                      │
│ - WebSocketService / SubscriptionsService                │
│ - ApiService (HTTP + JSON:API)                           │
│ - DatapointService (CRUD + values/timeseries)            │
│ - FunctionService (Semantic functions)                   │
│ - LocationService (Hierarchy)                            │
│ - SettingsService                                        │
├──────────────────────────────────────────────────────────┤
│ Shared Components (Dumb)                                 │
│ - KnxTable, DatapointCards                               │
│ - Charts, Dialogs, Forms                                 │
│ - Interceptors, Guards, Pipes                            │
│ - JSON:API Resource transformer                          │
├──────────────────────────────────────────────────────────┤
│ Models & DTOs (no deps)                                  │
│ - Datapoint, Device, Function, Location, Value           │
│ - JSON:API Resource shapes                               │
│ - Query parameters (filters, pagination)                 │
└──────────────────────────────────────────────────────────┘
```

### 1.3 Routing Structure

```typescript
// App Routes
setup                  # First-time setup (API connection, auth)
login                  # JWT login
/                      # (Protected, authGuard)
  ├─ dashboard         # Real-time summary, key metrics
  ├─ live-view         # All datapoint values streaming
  ├─ history           # Past values (archive query)
  ├─ charts            # Time-series visualization
  ├─ devices           # Device browser + location tree
  ├─ datapoints        # Flat list / tree of all datapoints
  ├─ logs              # Application & API logs
  ├─ settings          # Configuration, connection, user prefs
  └─ (default)         # → /dashboard
```

---

## 2. Core Data Models (DTOs)

### 2.1 Datapoint (JSON:API Resource)

Represents a single KNX datapoint or IoT endpoint in JSON:API format.

```typescript
export interface DatapointResource {
  // JSON:API Structure
  type: 'datapoint';
  id: string;  // KNX group address (e.g., "1/2/3") or vendor ID
  
  // Attributes
  attributes: {
    title: string;            // "Temperature_Living_Room"
    description?: string;     // Optional
    
    // Datapoint Type
    meta?: {
      '@type': string;        // "9.001" (DPT), "temperature" (semantic)
      '@encoding'?: string;   // "boolean" | "unsigned" | "signed"
      "@unit"?: string;       // "°C" | "%" | "lux"
    };
    
    // Value Information
    value?: string;           // Current decoded value
    valueRaw?: string;        // Hex representation (if applicable)
    lastUpdated?: string;     // ISO-8601 timestamp
    
    // Capabilities
    readable?: boolean;       // Can be read?
    writable?: boolean;       // Can be written?
    
    // Status
    qualityValid?: boolean;   // Is value trustworthy?
  };
  
  // Relationships (links to related resources)
  relationships?: {
    device?: {
      data: { type: 'device'; id: string };
    };
    location?: {
      data: { type: 'location'; id: string };
    };
    function?: {
      data: { type: 'function'; id: string };
    };
    subscriptions?: {
      data: Array<{ type: 'subscription'; id: string }>;
    };
  };
}
```

### 2.2 Device (JSON:API Resource)

```typescript
export interface DeviceResource {
  type: 'device';
  id: string;  // e.g., "sensor-1" or physical address
  
  attributes: {
    title: string;
    description?: string;
    
    // Hardware Info
    meta?: {
      'knx:manufacturer'?: string;
      'knx:product'?: string;
      'knx:serialNumber'?: string;
    };
    
    // Network Info
    physicalAddress?: string;  // "1.2.3" for KNX
    ipAddress?: string;        // For IP-based devices
    
    // Status
    status?: 'online' | 'offline' | 'unknown';
    lastSeen?: string;         // ISO-8601
    datapointCount?: number;
  };
  
  relationships?: {
    location?: {
      data: { type: 'location'; id: string };
    };
    datapoints?: {
      data: Array<{ type: 'datapoint'; id: string }>;
    };
  };
}
```

### 2.3 Location (Hierarchy)

```typescript
export interface LocationResource {
  type: 'location';
  id: string;
  
  attributes: {
    title: string;
    description?: string;
    type?: string;  // "Building", "Floor", "Room", "Zone"
  };
  
  relationships?: {
    parentLocation?: {
      data: { type: 'location'; id: string } | null;
    };
    childLocations?: {
      data: Array<{ type: 'location'; id: string }>;
    };
    devices?: {
      data: Array<{ type: 'device'; id: string }>;
    };
    datapoints?: {
      data: Array<{ type: 'datapoint'; id: string }>;
    };
  };
}
```

### 2.4 Function (Semantic Layer)

```typescript
export interface FunctionResource {
  type: 'function';
  id: string;  // e.g., "temp-monitoring", "light-control"
  
  attributes: {
    title: string;
    description?: string;
    
    // Semantic Info
    meta?: {
      '@type'?: string;       // e.g., "knx:TemperatureFunction"
      '@category'?: string;   // "monitoring" | "control" | "hvac"
    };
  };
  
  relationships?: {
    datapoints?: {
      data: Array<{ type: 'datapoint'; id: string }>;
    };
    location?: {
      data: { type: 'location'; id: string };
    };
  };
}
```

### 2.5 Value (Real-Time)

Represents a datapoint value change event.

```typescript
export interface DatapointValueEvent {
  // Identification
  type: 'datapoint_updated';
  id: string;                // Same as datapoint ID
  
  // Timestamp & Value
  timestamp: string;         // ISO-8601
  value: string;             // Decoded value
  valueRaw?: string;         // Hex (if applicable)
  
  // Source (for diagnostics)
  sourceAddress?: string;    // "1.2.3" or device ID
  
  // Quality Indicators
  qualityValid?: boolean;    // Whether the value is trustworthy
}
```

### 2.6 Subscription (WebSocket)

```typescript
export interface SubscriptionResource {
  type: 'subscription';
  id: string;
  
  attributes: {
    filter?: string;        // KNX IoT filter expression
    notificationUrl?: string; // Callback URL or ws:// address
    createdAt: string;      // ISO-8601
  };
  
  relationships?: {
    datapoints?: {
      data: Array<{ type: 'datapoint'; id: string }>;
    };
  };
}
```

---

## 3. Page & Component Specifications

### 3.1 Dashboard

**Purpose:** Real-time summary of the system state.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Top Bar: Connection Status | # Devices | # Datapoints│
├──────────────────────────────────────────────────────┤
│ Key Metrics                                          │
│  ┌─────────┬─────────┬─────────┬──────────┐         │
│  │ Values  │ Changes │  Errors │ Warnings │         │
│  │ 1,234   │   15/m  │    0    │    2     │         │
│  └─────────┴─────────┴─────────┴──────────┘         │
├──────────────────────────────────────────────────────┤
│ Recent Activity (Last 24h)                           │
│  ┌──────────────────────────────────────────────┐   │
│  │ Timeline / Activity Feed                     │   │
│  │  10:34  Living Room Temp  21.5 → 21.8 °C    │   │
│  │  10:32  Front Door        OPEN              │   │
│  │  10:30  Kitchen Light     100% → 50%        │   │
│  └──────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────┤
│ Quick Access Tiles (User-Configurable)              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Favorite   │ │ Favorite   │ │ Favorite   │      │
│  │ Datapoint  │ │ Datapoint  │ │ Datapoint  │      │
│  │ 21.5°C ↓   │ │ 45% ↑      │ │ ON         │      │
│  └────────────┘ └────────────┘ └────────────┘      │
└──────────────────────────────────────────────────────┘
```

**Components:**
- **ConnectionStatusBadge** — Real-time connection health (green/yellow/red)
- **MetricsCard** — Static counter (values, changes, errors)
- **ActivityFeed** — Timeline of recent datapoint changes
- **QuickTile** — Favorite datapoint with live value + sparkline

**Data Source:**
- Initial: `GET /api/v2/datapoints/values?page[limit]=100&sort=-lastUpdated`
- Real-time: WebSocket subscription (JSON:API format)

**Interactions:**
- Click tile → Navigate to datapoint detail
- Manage favorites → Settings dialog
- Filter by device/location → Refine view (uses `?filter[...]` params)

---

### 3.2 Live View

**Purpose:** Monitor all datapoint values in real-time with optional filtering.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Toolbar: [LIVE|ARCHIVE] [Pause] [AutoScroll]            │
│ Search: [______________________] [Filters] [Columns]    │
│ Status: Connected (1234 msgs/s) │ 5,678 matching        │
├─────────────────────────────────────────────────────────┤
│ TABLE (Virtual Scrolling: 1000+ rows)                   │
│ ┌─────────┬──────────────┬──────────┬────────┬─────┐   │
│ │ Time    │ Datapoint    │ Device   │ Value  │ Dpt │   │
│ ├─────────┼──────────────┼──────────┼────────┼─────┤   │
│ │ 10:34:15│ Temp_LivRM   │ Sensor_1 │ 21.5°C │ 9.1 │   │
│ │ 10:34:12│ Light_Kitchen│ Dimmer_2 │ 50%    │ 5.1 │   │
│ │ 10:34:08│ Door_Front   │ Contact_3│ OPEN   │ 1.1 │   │
│ │ ...     │ ...          │ ...      │ ...    │ ... │   │
│ └─────────┴──────────────┴──────────┴────────┴─────┘   │
├─────────────────────────────────────────────────────────┤
│ [Export CSV] [Clear] [Scroll to Top (FAB)]              │
└─────────────────────────────────────────────────────────┘
```

**Columns (Configurable):**
- Timestamp (sortable)
- Datapoint Name
- Device Name
- Location
- Value (decoded)
- Value Raw (hex)
- Datapoint Type
- Message Type (write/read/update)
- Priority

**Features:**
- **Quick Filter** — Free-text search across fields
- **Advanced Filter Bar** (collapsible on mobile):
  - Device selector (multi-select)
  - Location selector (multi-select)
  - Datapoint Type filter
  - Value range (for numeric types)
  - Time range (last hour / 24h / 7d / custom)
  - Data quality (show errors?)
- **Pause Button** — Freezes incoming updates
- **Auto-Scroll** — Newest rows at top; toggle on/off
- **Export CSV** — Download current view + filters
- **Column Manager** — Persist visible columns to localStorage

**Components:**
- **KnxTable** (custom virtual-scroll grid)
- **DatapointValueCards** (mobile-friendly card layout)
- **QuickFilterBar**
- **AdvancedFilterPanel**
- **ColumnManagerDialog**

**Data Source:**
- Initial: `GET /api/v2/datapoints/values?page[limit]=100&sort=-lastUpdated`
- Real-time: WebSocket subscription to `datapoint_updated` messages
- Buffer Service (singleton) maintains 1000-row sliding window
- Filter logic applied client-side using JSON:API filter syntax

**Performance Notes:**
- Virtual scrolling: render only visible rows
- WebSocket: gateway may throttle/batch (>100/sec → batch message)
- Debounce filter inputs (300ms)
- Filters use KNX IoT standard: `?filter[meta.@type]=9.001`

---

### 3.3 History / Archive

**Purpose:** Query and analyze historical datapoint values.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Toolbar: [LIVE|ARCHIVE▲] [Export CSV] [Clear History]  │
│ Filters (always expanded on Archive):                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ From: [____/____/____] To: [____/____/____]     │   │
│  │ Datapoint: [Dropdown ↓]                         │   │
│  │ Device: [Multi-Select]                          │   │
│  │ Value Range: [___] to [___]                     │   │
│  │ Message Type: [☑ Write] [☑ Read] [☑ Update]   │   │
│  │ Quality: [☑ Valid] [☑ Invalid]                  │   │
│  │ [Apply] [Reset]                                 │   │
│  └─────────────────────────────────────────────────┘   │
│ Status: 45 days available │ 1,234 rows matching         │
├─────────────────────────────────────────────────────────┤
│ TABLE (Keyset pagination)                               │
│ Same columns as Live View                               │
├─────────────────────────────────────────────────────────┤
│ [Previous] [Next] (Server-side pagination)              │
└─────────────────────────────────────────────────────────┘
```

**Query Parameters:**
```typescript
interface HistoryQueryParams {
  filter?: string;          // KNX IoT filters (e.g., "filter[id]=1/2/3")
  page?: {
    offset?: number;        // Offset for pagination
    limit?: number;         // Items per page (default 50)
  };
  sort?: string;            // "timestamp" or "-timestamp" (descending)
  'filter[timestamp][ge]'?: string;  // From (ISO-8601)
  'filter[timestamp][le]'?: string;  // To (ISO-8601)
}
```

**API Endpoints:**
- `GET /api/v2/datapoints/:id/history` → Historical data with keyset pagination
- `GET /api/v2/datapoints/:id/timeseries` → Aggregated time-series (for graphs)

**Pagination:**
- **Offset-based** pagination with `page[offset]` and `page[limit]`
- First call: `?page[limit]=50`, get results + `meta.pageInfo.nextOffset`
- Subsequent calls: include `page[offset]` to fetch next page

**Features:**
- **Date Picker** — Calendar widget for from/to
- **Multi-Device Filter** — Search and select devices
- **Value Range Slider** — For numeric datapoints
- **Keyset Pagination** — Efficient for large datasets
- **Export CSV** — Download filtered data
- **Clear History** (with confirmation) — Admin only

**Components:**
- **HistoryFilterPanel** (sticky top on desktop; sticky bottom on mobile)
- **KnxTable** (same as Live View)
- **DatePickerDialog**
- **PaginationControls** (keyset-based)
- **ExportDialog** (async job monitoring)

---

### 3.4 Charts & Time-Series Visualization

**Purpose:** Visualize trends and patterns over time.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Toolbar: [Line] [Bar] [Area] | [Last 24h] [7d] [30d]   │
│ Datapoint Selector: [Temp_LivRM] [Remove]               │
│                     [Light_Kitchen] [Remove]             │
│          [+ Add Datapoint]                              │
├─────────────────────────────────────────────────────────┤
│ Chart Area (ECharts)                                    │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 25°C┤                                                ││
│ │ 20°C┤  ╱╲    ╱╲    ╱╲                                ││
│ │ 15°C┼─╱  ╲──╱  ╲──╱  ╲──                             ││
│ │     │                                                ││
│ │ 100%┤╱╲                                              ││
│ │  50%┼  ╲╱╲╱╲╱                                        ││
│ │     └─────────────────────────────────────────────────┤
│ │     00:00      12:00      23:59                       │
│ └─────────────────────────────────────────────────────┘│
│ Legend: [■ Temp_LivRM] [■ Light_Kitchen]               │
├─────────────────────────────────────────────────────────┤
│ Stats (Tabular):                                        │
│ Datapoint      | Min   | Max   | Avg   | Changes        │
│ Temp_LivRM     | 18.2  | 22.1  | 20.5  | 45             │
│ Light_Kitchen  | 0%    | 100%  | 65%   | 23             │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- **Multi-Datapoint Overlay** — Compare trends
- **Chart Type Toggle** — Line, Bar, Area, Candlestick (OHLC)
- **Time Range Picker** — Last 1h, 24h, 7d, 30d, custom
- **Legend Toggle** — Click to show/hide series
- **Zoom & Pan** — Mouse wheel / drag
- **Tooltip Hover** — Display value + timestamp
- **Export Chart** — PNG/SVG
- **Statistics Table** — Min/max/avg/count per series
- **Moving Average** — Smooth trend lines (optional)

**Chartable Datapoint Types:**
- Numeric DPTs (5, 6, 7, 8, 9, 12, 13, 14) = continuous values
- Boolean (DPT 1) = bar chart or on/off timeline
- Exclude: text, date/time, raw data

**API Endpoints:**
- `GET /api/v2/datapoints/:id/timeseries` → Aggregated time-series data
  ```typescript
  interface TimeSeriesPoint {
    timestamp: string;      // ISO-8601
    value: number;          // Aggregated value
    count?: number;         // For count aggregations
  }
  ```

**Components:**
- **ChartsComponent** (main container)
- **EchartsWrapper** (thin wrapper around Apache ECharts)
- **SeriesSelectorPanel** (add/remove datapoints)
- **TimeRangePicker**
- **StatsTable**

---

### 3.5 Datapoints Browser (Flat List)

**Purpose:** Browse and manage all datapoints; test read/write.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Search: [_______________________]                       │
│ Filters: Device [▼] | Type [▼] | [Writable Only] [Readable Only]
│ View: [Tree▼] [Flat]                                    │
│ Status: 1,234 datapoints                                │
├─────────────────────────────────────────────────────────┤
│ TABLE (Virtual Scrolling)                               │
│ ┌─────────────┬───────────┬────────┬───────┬────────┐   │
│ │ Name        │ Device    │ Dpt    │ Write │ Actions│   │
│ ├─────────────┼───────────┼────────┼───────┼────────┤   │
│ │ Temp_LivRM  │ Sensor_1  │ 9.1    │ No    │ [Spk]  │   │
│ │   └─ Flags  │           │        │       │        │   │
│ │      C,R,U  │           │        │       │        │   │
│ │   └─ Last   │           │        │       │        │   │
│ │      21.5°C │           │        │       │        │   │
│ │   └─ (1h ago)           │        │       │        │   │
│ ├─────────────┼───────────┼────────┼───────┼────────┤   │
│ │ Light_Kit   │ Dimmer_2  │ 5.1    │ Yes   │ [Spk]  │   │
│ │   Write:    │           │        │       │        │   │
│ │   [_0___100] │           │        │       │        │   │
│ │   [SEND]    │           │        │       │        │   │
│ │   Reading...│           │        │       │        │   │
│ └─────────────┴───────────┴────────┴───────┴────────┘   │
├─────────────────────────────────────────────────────────┤
│ [Chart] [History] [Export List]                         │
└─────────────────────────────────────────────────────────┘
```

**Columns:**
- Name (searchable)
- Device Name
- Location (breadcrumb)
- Datapoint Type (DPT)
- Flags (C/R/W/T/U/I badges)
- Last Value
- Last Update (relative time)
- Writable? (icon)
- Actions (chart, history, write dialog)

**Features:**
- **Search** — Datapoint name, device, location
- **Filter by Type** — Numeric, Boolean, Text, etc.
- **Filter by Device** — Single or multi-select
- **Show Writable Only** — Toggle
- **Tree / Flat Views** — Toggle between:
  - **Tree:** Device → Datapoint → flags/value
  - **Flat:** Simple list, sortable by any column
- **Per-Row Write Interface** (if writable):
  - Boolean: On/Off buttons
  - Numeric: Slider + input field
  - Enum: Dropdown
  - Text: Text input
  - [SEND] button + busy indicator
  - Response message (success/error)
- **Read Test** — Manually request the current value
  - Button → `POST /api/datapoints/:id/read`
  - Pending indicator (3s timeout)
  - "No answer" or value returned
- **Quick Actions:**
  - Chart icon → Open charts with this datapoint
  - History icon → Jump to history, filter this datapoint
  - Speaker icon → Real-time indicator (blinking if changed)

**API Endpoints:**
- `GET /api/v2/datapoints?page[limit]=100&filter[...]` (paginated with filters)
- `PUT /api/v2/datapoints/values` → Write multiple datapoints
  ```json
  {
    "data": [
      { "type": "datapoint", "id": "1/2/3", "attributes": { "value": "50" } }
    ]
  }
  ```
- `GET /api/v2/datapoints/:id/timeseries` → Get chart data for datapoint

**Components:**
- **DatapointsListComponent** (main)
- **DatapointRowComponent** (expandable, per-row write)
- **SearchAndFilterBar**
- **WriteDialogComponent** (modal for complex values)

---

### 3.6 Devices Browser (Topology)

**Purpose:** View device hierarchy and locations; manage device metadata.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Search: [_______________________] [Expand All] [Collapse All]
│ View: [Map/Tree▼]                                       │
├─────────────────────────────────────────────────────────┤
│ TREE VIEW                                               │
│ [+] Building A                                          │
│     [+] Floor 2                                         │
│         [+] Living Room                                 │
│             ├─ Sensor_1 (Temperature)                  │
│             │  └─ 5 datapoints                          │
│             │     Last seen: 5 min ago                  │
│             ├─ Dimmer_2 (Light Control)                │
│             │  └─ 3 datapoints                          │
│             └─ Contact_3 (Door)                         │
│                └─ 1 datapoint                           │
│         [+] Kitchen                                     │
│             └─ ...                                      │
│     [+] Floor 1                                         │
│         └─ ...                                          │
│ [-] Building B                                          │
│ Unassigned Devices (4)                                  │
│     ├─ Device_x                                         │
│     └─ ...                                              │
├─────────────────────────────────────────────────────────┤
│ [Selected: Sensor_1]                                    │
│ Properties: [Edit]                                      │
│  Name: Sensor_1                                         │
│  Type: Temperature Sensor                               │
│  Manufacturer: Siemens                                  │
│  Product: KX310                                         │
│  IP Address: 192.168.1.50                              │
│  Last Seen: 2026-07-30 10:34:15                         │
│  Datapoints: 5                                          │
│  Status: ✓ Online                                       │
│                                                         │
│ Datapoints on this device:                              │
│  [Temp_LivRM] [Humidity_LivRM] [CO2_LivRM]             │
│  [Switch_LivRM] [Brightness_LivRM]                     │
│                                                         │
│ [Edit Metadata] [View History] [Delete Device]          │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- **Location Tree** — Hierarchical browser (Building → Floor → Room → Device)
- **Device Cards** — Click to expand and see:
  - Name, Type, Manufacturer
  - Physical Address / IP
  - Last Seen (online/offline indicator)
  - Datapoint count
  - Related datapoints (quick links)
- **Search** — Filter by device name or location
- **Edit Metadata** — Dialog to update device properties
- **Device Health** — Online/offline status + last seen
- **Unassigned Devices** — Section for devices without a location
- **Map View (Optional)** — Visualize devices on a floor plan (future)

**API Endpoints:**
- `GET /api/v2/locations` → Get all locations (hierarchical)
- `GET /api/v2/locations/:id` → Get location details
- `GET /api/v2/locations/:id/childlocations` → Get child locations
- `GET /api/v2/locations/:id/parentlocation` → Get parent location
- `GET /api/v2/locations/:id/devices` → Get devices at location
- `GET /api/v2/devices/:id` → Get device details

**Components:**
- **DevicesTopologyComponent** (main)
- **LocationTree** (recursive tree)
- **DeviceDetailsPanel** (right sidebar)
- **EditDeviceDialogComponent**

---

### 3.7 Settings

**Purpose:** Application configuration, user preferences, and system diagnostics.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Settings                                                 │
├──────────────────────────────────────────────────────────┤
│ [Tabs: Connection | Recording | Appearance | Diagnostics]
├──────────────────────────────────────────────────────────┤
│ CONNECTION TAB                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ API Endpoint Configuration                        │  │
│ │ Base URL: [https://api.knx-iot.example.com___]   │  │
│ │ API Key (optional): [_____________________]       │  │
│ │ Timeout (ms): [____]                             │  │
│ │ Retry Attempts: [__]                             │  │
│ │ Connection Status: ✓ Connected (v1.2.3)           │  │
│ │ [Test Connection] [Refresh]                      │  │
│ │                                                    │  │
│ │ Current User: admin@example.com                  │  │
│ │ [Change Password] [Logout All Devices]           │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ RECORDING TAB                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ History Retention                                  │  │
│ │ [☑] Enable Recording                              │  │
│ │ Max Days to Keep: [___]                           │  │
│ │ Compression: [☑] Enabled                          │  │
│ │ Database Size: 1.2 GB                             │  │
│ │ [Clear History Older Than...] [View Archives]    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ APPEARANCE TAB                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Theme: [Dark ▼] (Light not recommended for monitoring)
│ │ Density: [Compact ▼]                              │  │
│ │ Language: [English ▼]                             │  │
│ │ Live Refresh Rate: [30] Hz                        │  │
│ │ Auto-Scroll on Live View: [☑]                    │  │
│ │                                                    │  │
│ │ Preview of current theme:                         │  │
│ │ [Dark preview box]                                │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ DIAGNOSTICS TAB                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Logs (Last 100)                                   │  │
│ │ [Filter: All ▼] [Clear] [Export]                 │  │
│ │ ┌────────────────────────────────────────────┐    │  │
│ │ │ 10:34:15 INFO  [SignalR] Connected         │    │  │
│ │ │ 10:34:12 WARN  [Api] Slow response: 500ms  │    │  │
│ │ │ 10:34:10 ERROR [Http] 503 Service Unavail. │    │  │
│ │ │ ...                                        │    │  │
│ │ └────────────────────────────────────────────┘    │  │
│ │                                                    │  │
│ │ [Create Diagnostics Bundle] (ZIP: logs, config, stats)
│ │ [View Raw Config] [Download as JSON]             │  │
│ │                                                    │  │
│ │ App Version: 2.0.0 ([Check for Updates])         │  │
│ │ Build Date: 2026-07-30                           │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Sections:**

#### 3.7.1 Connection Settings
- **Base URL** — Editable (validate on change)
- **API Key** — Optional; if set, use `X-API-Key` header instead of JWT
- **Timeout** — HTTP request timeout in ms
- **Retry Attempts** — On transient failures
- **Connection Status** — Live indicator + version info
- **Test Connection** — Button to verify connectivity
- **User Info** — Current logged-in user
- **Change Password** — Dialog
- **Logout All Devices** — Revoke all JWT tokens

#### 3.7.2 Recording Settings
- **Enable Recording** — Checkbox
- **Max Days Retention** — How long to keep history
- **Compression** — SQLite WAL compression
- **Database Size** — Current size display
- **Clear Old Records** — Dialog with date picker
- **View Archives** — Link to available archive days

#### 3.7.3 Appearance
- **Theme** — Dark (primary), Light
- **Density** — Compact, Normal, Spacious
- **Language** — en, de, fr, etc.
- **Live Refresh Rate** — Hz (default 30)
- **Auto-Scroll** — Toggle for live view
- **Theme Preview** — Live demo

#### 3.7.4 Diagnostics
- **Log Viewer** — Filterable, scrollable, paginated
- **Export Logs** — JSON or CSV
- **Diagnostics Bundle** — Create ZIP with:
  - Last N log entries
  - App config (sanitized)
  - Statistics snapshot
  - Browser info
- **Raw Config Viewer** — JSON display (read-only)
- **Version Info** — App version, build date, API version

**API Endpoints:**
- `GET /.well-known/knx` → Gateway discovery
- `GET /info` → API information
- `GET /health` → Health status
- `POST /oauth/access` → OAuth2 token endpoint (RFC 6749)
- `GET /api/v1/node` → Node/gateway information

**Components:**
- **SettingsComponent** (main container with tabs)
- **ConnectionSettingsPanel**
- **RecordingSettingsPanel**
- **AppearanceSettingsPanel**
- **DiagnosticsPanel**
- **LogViewerComponent** (reusable)

---

### 3.8 Logs

**Purpose:** Real-time application and system logs (separate from History).

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Toolbar: [ALL ▼] [ERROR] [WARN] [INFO]                 │
│ Search: [_______________________]                       │
│ Auto-Scroll: [☑]  Pause: [Button]                       │
│ [Clear] [Export JSON] [Export CSV]                      │
├─────────────────────────────────────────────────────────┤
│ Logs (Real-time streaming via SignalR)                  │
│ ┌──────────┬──────────┬──────────────────────────────┐  │
│ │ Time     │ Level    │ Message                      │  │
│ ├──────────┼──────────┼──────────────────────────────┤  │
│ │ 10:34:15 │ INFO     │ [SignalR] Connected          │  │
│ │ 10:34:12 │ WARN     │ [Api] Timeout after 5s       │  │
│ │ 10:34:10 │ ERROR    │ [Http] 500 Internal Error    │  │
│ │ 10:34:08 │ DEBUG    │ [Datapoint] Updated #12345   │  │
│ │ ...      │ ...      │ ...                          │  │
│ └──────────┴──────────┴──────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│ [Previous] [Next] (Keyset pagination)                   │
│ Showing 50 of 1,234 total logs                          │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- **Level Filter** — All, Error, Warn, Info, Debug
- **Search** — Filter by message content
- **Real-Time Stream** — SignalR live logs
- **Auto-Scroll** — Newest at top
- **Pause** — Freeze and read
- **Export** — JSON or CSV download
- **Clear** — Erase log buffer (keep archive)

**Log Levels:**
```
ERROR   — Application or API errors
WARN    — Recoverable issues, slow responses
INFO    — State changes, connections
DEBUG   — Detailed trace information
```

**API Endpoints:**
- `GET /api/v1/events` → Get system events (paginated)
- `ws://gateway/messaging/ws` → WebSocket for real-time events

**Components:**
- **LogsComponent** (main)
- **LogViewerComponent** (shared with Settings)
- **LogFilterBar**

---

### 3.9 Login & Setup

**Purpose:** First-time setup and authentication.

**Layout (Setup Page):**
```
┌──────────────────────────────────────────────────────┐
│                 KNX IoT Monitor                       │
│                   v2.0.0                             │
├──────────────────────────────────────────────────────┤
│ Welcome! Let's get started.                          │
│                                                      │
│ Step 1: Connect to API                              │
│ ┌──────────────────────────────────────────────┐   │
│ │ API Endpoint: [https://api.____._________]   │   │
│ │ [Test Connection]  Status: ○ Testing...      │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Step 2: Create Admin User                           │
│ ┌──────────────────────────────────────────────┐   │
│ │ Username: [________________]                 │   │
│ │ Password: [________________]                 │   │
│ │ Confirm:  [________________]                 │   │
│ │ [Create Admin User]                         │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Step 3: Discover Devices                            │
│ ┌──────────────────────────────────────────────┐   │
│ │ [Discover Devices] (will query API)         │   │
│ │ Found: 12 devices, 234 datapoints           │   │
│ │ ✓ Ready to begin                            │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [Continue to Dashboard]                            │
└──────────────────────────────────────────────────────┘
```

**Layout (Login Page):**
```
┌──────────────────────────────────────────────────────┐
│                 KNX IoT Monitor                       │
│                   v2.0.0                             │
├──────────────────────────────────────────────────────┤
│ Sign In                                              │
│                                                      │
│ Username: [______________________]                  │
│ Password: [______________________]  [Show/Hide]     │
│                                                      │
│ [Sign In]  [Forgot Password?]                       │
│                                                      │
│ ────────── or ──────────────                         │
│ [Connect with API Key]                              │
│                                                      │
│ Error (if any): ⚠ Invalid credentials               │
│ Attempt 2/3                                         │
└──────────────────────────────────────────────────────┘
```

**Features:**
- **Setup Wizard** (on first visit):
  - Discover gateway via `/.well-known/knx`
  - Query `GET /info` for API capabilities
  - Initialize OAuth2 flow
- **OAuth2 Login Page** (RFC 6749):
  - Username + password (or client credentials)
  - Exchange for Bearer token via `POST /oauth/access`
  - Token stored in localStorage (secure: httpOnly cookie recommended)

**API Endpoints:**
- `GET /.well-known/knx` → KNX IoT discovery
- `GET /info` → API information
- `GET /health` → Health check
- `POST /oauth/access` → OAuth2 token endpoint
- `GET /api/v1/node` → Node/gateway details

**Components:**
- **InitialSetupComponent**
- **LoginComponent**
- **SetupWizardComponent** (multi-step)

---

## 4. Real-Time Architecture (WebSocket + JSON:API Subscriptions)

### 4.1 WebSocket Subscription Endpoint

**Endpoint:** `ws://gateway-host:3000/messaging/ws`  
**Subprotocol:** `gw.knx.org`  
**Authentication:** Bearer token in URL or Authorization header  
**Format:** JSON:API compliant subscription messages

**Example WebSocket URL:**
```
ws://localhost:3000/messaging/ws?token=<bearer-token>
```

Or with Authorization header:
```
ws://localhost:3000/messaging/ws
Header: Authorization: Bearer <token>
```

### 4.2 Subscribe to Datapoint Changes

**Create a subscription via REST API (HTTP POST):**
```bash
POST /api/v2/subscriptions
Content-Type: application/vnd.api+json
Authorization: Bearer <token>

{
  "data": {
    "type": "subscription",
    "attributes": {
      "filter": "filter[relationships.datapoint.id]=1/2/3",
      "notificationUrl": "ws://client-app/ws"
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "type": "subscription",
    "id": "sub-12345",
    "attributes": {
      "createdAt": "2026-07-30T10:34:15Z",
      "filter": "filter[relationships.datapoint.id]=1/2/3"
    }
  }
}
```

### 4.3 WebSocket Message Types

**Datapoint Value Update:**
```json
{
  "type": "datapoint_updated",
  "id": "1/2/3",
  "timestamp": "2026-07-30T10:34:15.123Z",
  "value": "21.5",
  "sourceAddress": "1.2.3",
  "deviceId": "sensor-1"
}
```

**Device Online/Offline:**
```json
{
  "type": "device_status_changed",
  "deviceId": "sensor-1",
  "status": "online|offline",
  "timestamp": "2026-07-30T10:34:15.123Z"
}
```

**Subscription Error:**
```json
{
  "type": "error",
  "status": "401",
  "message": "Unauthorized"
}
```

### 4.4 Batch Updates for High-Frequency Streams

When >100 updates/sec, the gateway may batch updates:
```json
{
  "type": "batch",
  "timestamp": "2026-07-30T10:34:15.123Z",
  "updates": [
    { "id": "1/2/3", "value": "21.5" },
    { "id": "1/2/4", "value": "45%" },
    { "id": "1/2/5", "value": "1200" }
  ]
}
```

### 4.5 LiveBufferService (Singleton)

Maintains a sliding window of recent datapoint values (client-side).

```typescript
@Injectable({ providedIn: 'root' })
export class LiveBufferService {
  private buffer: DatapointValue[] = [];
  private maxSize = 1000;
  private subscription: SubscriptionHandle;
  
  constructor(private webSocketService: WebSocketService) {}
  
  start(): void {
    this.webSocketService.connect().subscribe(message => {
      if (message.type === 'datapoint_updated') {
        this.push(this.transformMessage(message));
      } else if (message.type === 'batch') {
        message.updates.forEach(u => this.push(this.transformMessage(u)));
      }
    });
  }
  
  push(value: DatapointValue): void {
    this.buffer.unshift(value);  // Newest first
    if (this.buffer.length > this.maxSize) {
      this.buffer.pop();
    }
    this.bufferUpdated$.next(this.buffer);
  }
  
  getFiltered(filter: LiveFilterCriteria): DatapointValue[] {
    return this.buffer.filter(v => this.matches(v, filter));
  }
  
  clear(): void {
    this.buffer = [];
    this.bufferUpdated$.next(this.buffer);
  }
}
```

### 4.6 Performance Optimizations

- **Throttling:** Gateway samples high-frequency streams (>100/sec)
- **Client-side debounce:** Filter inputs debounced 300ms
- **Buffer size:** 1000 most recent updates
- **Subscription filters:** Use KNX IoT standard filters to reduce server load

---

## 5. State Management & Data Flow

### 5.1 Services Architecture

```
┌──────────────────────────────────────────────────────┐
│ Feature Components (Smart)                           │
├──────────────────────────────────────────────────────┤
│ DatapointService                                     │
│ ├─ getAll(filters?)  → GET /api/v2/datapoints       │
│ ├─ getById(id)       → GET /api/v2/datapoints/:id   │
│ ├─ getValues()       → GET /api/v2/datapoints/values│
│ ├─ getTimeseries()   → GET /api/v2/datapoints/:id/  │
│ │                       timeseries                   │
│ └─ writeValues()     → PUT /api/v2/datapoints/values│
├──────────────────────────────────────────────────────┤
│ WebSocketService (SubscriptionsService)              │
│ ├─ connect()         → ws://gateway/messaging/ws    │
│ ├─ createSubscription()  → POST /api/v2/subscriptions
│ ├─ datapoint$        → Observable stream            │
│ └─ onDeviceStatusChange()                           │
├──────────────────────────────────────────────────────┤
│ DeviceService                                        │
│ ├─ getAll()          → GET /api/v2/devices          │
│ └─ getById(id)       → GET /api/v2/devices/:id      │
├──────────────────────────────────────────────────────┤
│ LocationService (Hierarchy)                          │
│ ├─ getAll()          → GET /api/v2/locations        │
│ ├─ getParent(id)     → GET /api/v2/locations/:id/   │
│ │                       parentlocation              │
│ ├─ getChildren(id)   → GET /api/v2/locations/:id/   │
│ │                       childlocations              │
│ └─ getDevices(id)    → GET /api/v2/locations/:id/   │
│                         devices                     │
├──────────────────────────────────────────────────────┤
│ FunctionService (Semantic Layer)                     │
│ ├─ getAll()          → GET /api/v1/functions        │
│ ├─ getById(id)       → GET /api/v1/functions/:id    │
│ └─ getDatapoints(id) → GET /api/v1/functions/:id/   │
│                         datapoints                  │
├──────────────────────────────────────────────────────┤
│ AuthService (OAuth2)                                 │
│ ├─ login(user, pass) → POST /oauth/access           │
│ ├─ logout()                                          │
│ ├─ getToken()                                        │
│ └─ getCurrentUser()                                  │
├──────────────────────────────────────────────────────┤
│ SettingsService                                      │
│ ├─ getSettings()     → GET /api/v2/settings (custom)│
│ └─ updateSettings()  → PATCH /api/v2/settings       │
└──────────────────────────────────────────────────────┘
```


1. **Initialization:**
   - Component OnInit → Request 100 latest datapoint values
   - `DatapointService.getLatestValues()` → HTTP `GET /api/datapoints/values`
   - Populate table
   - Subscribe to `DatapointStreamService.datapoint$` (SignalR)

2. **Real-Time Updates:**
   - SignalR message arrives → `DatapointValueChanged`
   - `LiveBufferService.push(value)`
   - Filter applied (client-side)
   - Virtual table re-renders (only visible rows)
   - User sees new row at top in real-time

3. **User Filters:**
   - Input event (debounced 300ms)
   - `LiveBufferService.getFiltered(criteria)` → Filtered array
   - Virtual table updates
   - No HTTP call needed

4. **Pause/Resume:**
   - Pause button → Stop adding to buffer
   - Buffer frozen; table frozen
   - Resume → Resume subscription
   - Missed updates downloaded via `GET /api/datapoints/values` with `since=...` param

---

## 6. Component Checklist

### Navigation & Layout
- [ ] Layout (sidebar, top bar, router outlet)
- [ ] Navigation menu
- [ ] Auth guard + interceptor
- [ ] Theme toggle

### Feature Modules
- [ ] Dashboard
- [ ] Live View (`MonitorComponent` + `KnxTableComponent`)
- [ ] History (`HistoryComponent` with pagination)
- [ ] Charts (`ChartsComponent` with ECharts)
- [ ] Datapoints Browser
- [ ] Devices/Topology Browser
- [ ] Settings (with tabs)
- [ ] Logs

### Shared Components
- [ ] KnxTable (virtual scrolling)
- [ ] KnxCard (mobile layout)
- [ ] Dialogs (confirm, edit, write)
- [ ] Filters & search bars
- [ ] Charts (ECharts wrapper)
- [ ] Toast notifications
- [ ] Loading spinner, error state

### Services
- [ ] AuthService (JWT)
- [ ] ApiService (HTTP base)
- [ ] DatapointService (CRUD)
- [ ] DatapointStreamService (SignalR)
- [ ] HistoryService (Query, export)
- [ ] LiveBufferService (Singleton buffer)
- [ ] SettingsService (Config)
- [ ] LoggerService

### Utilities
- [ ] DptConverter (decode DPT values)
- [ ] TimeAgo pipe (relative dates)
- [ ] TranslatePipe (i18n)
- [ ] SafeHtml pipe
- [ ] Number formatter

---

## 7. API Contract Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/refresh` | POST | Refresh JWT token |
| `/api/datapoints` | GET | List all datapoints (paginated) |
| `/api/datapoints/:id` | GET | Get single datapoint details |
| `/api/datapoints/values` | GET | Latest values (limit, sort) |
| `/api/datapoints/:id/history/series` | GET | Time-series data for charts |
| `/api/datapoints/:id/write` | POST | Send a value to datapoint |
| `/api/datapoints/:id/read` | POST | Request current value |
| `/api/datapoints/history` | GET | Query historical data (keyset pagination) |
| `/api/datapoints/history/stats` | GET | Stats (min/max/avg) |
| `/api/devices` | GET | List devices with hierarchy |
| `/api/devices/:id` | GET | Device details |
| `/api/devices/:id/datapoints` | GET | Datapoints on device |
| `/api/settings` | GET | All settings |
| `/api/settings` | PATCH | Update settings |
| `/api/logs` | GET | Application logs (paginated) |
| `/api/version` | GET | Version info |
| `/hubs/datapoint-stream` | WebSocket | Real-time updates (SignalR) |

---

## 8. Design Guidelines

### 8.1 Visual Hierarchy

- **Primary:** Datapoint name, current value, timestamp
- **Secondary:** Device, location, datapoint type
- **Tertiary:** Flags, metadata, last update time

### 8.2 Colors & Theming

- **Dark theme primary** — Monitoring environments require reduced eye strain
- **Status indicators:**
  - 🟢 Green: Online, OK, normal
  - 🟡 Yellow: Warning, slow, connecting
  - 🔴 Red: Error, offline, critical
- **Charts:** Use colorblind-friendly palettes (e.g., Okabe-Ito)

### 8.3 Accessibility (WCAG 2.1 AA)

- [ ] Semantic HTML (nav, main, aside, article)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Focus visible (:focus-visible)
- [ ] Color not sole means of information
- [ ] Contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (UI)
- [ ] Screen reader tested

### 8.4 Responsive Design

- **Desktop (>1024px):** Full layout, sidebar always visible
- **Tablet (768–1024px):** Collapsible sidebar, stack components
- **Mobile (<768px):** Drawer navigation, vertical layout

### 8.5 Performance Targets

- **Page load:** <2s
- **Time to Interactive:** <3s
- **Live table (1000 rows):** 60 FPS with virtual scrolling
- **Chart render (1000 points):** <1s
- **API response:** <500ms (p95)

---

## 9. Internationalization (i18n)

**Supported Languages:** English (en), German (de)

**Translation files:**
```
frontend/src/assets/i18n/
├─ en.json
├─ de.json
└─ ...
```

**Key translation categories:**
- Common UI (buttons, labels, dialogs)
- Feature-specific (monitor, charts, settings)
- Error messages & toasts
- Help text & tooltips

---

## 10. Testing Strategy

### Unit Tests
- Services (mocked HTTP)
- Pipes & utilities
- Type safety (strict mode)

### Integration Tests
- Component + Service interactions
- Real SignalR simulation

### E2E Tests (Optional)
- Login flow
- Live view filtering
- History query + export

---

## 11. Migration Path from KNX-NG-Monitor

### Key Renames & Structural Changes

| Aspect | KNX-NG-Monitor | Semantic KNX Gateway |
|--------|---|---|
| **Central Entity** | Group Address (GA) | Datapoint + Semantic Function |
| **Hierarchy** | Project → GA Range → GA | Location → Device → Datapoint |
| **Import** | ETS file upload | API discovery (`/.well-known/knx`) |
| **API Format** | Custom JSON | JSON:API (v1.0) + KNX IoT Spec |
| **Real-Time** | SignalR hub | WebSocket (RFC 6455) + Subscriptions |
| **Authentication** | JWT | OAuth2 Bearer Token (RFC 6749) |
| **Value Write** | Hex to GA | Decoded value to Datapoint (PUT) |
| **Semantic Layer** | N/A | Functions API (vendor integration) |
| **History** | Archival (database) | Timeseries + History endpoints |

### Service Renames

| Old (KNX-NG-Monitor) | New (Semantic KNX) |
|-----|-----|
| `ProjectService` | `DatapointService` |
| `GroupAddressComponent` | `DatapointsComponent` |
| `TelegramHistoryService` | Integrated in `DatapointService` |
| `SignalRService` | `WebSocketService` + `SubscriptionsService` |
| `KnxConnectionService` | `ApiService` (HTTP) + `AuthService` (OAuth2) |
| `KnxTelegram` | `DatapointValueEvent` |

### New Components & Concepts

- **FunctionBrowserComponent** — Semantic functions (vendor extensions)
- **LocationHierarchyComponent** — Device locations & sites
- **SubscriptionManagerComponent** — Manage WebSocket subscriptions
- **JSON:API TransformerService** — Parse JSON:API resources

---

## 12. Future Enhancements (Out of Scope v2.0)

- [ ] Multi-project support (switch APIs at runtime)
- [ ] Advanced topology visualization (floor plans)
- [ ] Scheduled commands (cron-like rules)
- [ ] Alerts & notifications (Slack, email)
- [ ] Mobile app (React Native)
- [ ] Datapoint trending & ML anomalies
- [ ] Audit log (who changed what when)
- [ ] User roles & permissions (beyond admin/user)

---

## 13. Summary of Key Changes & Vendor API Integration

| Aspect | KNX-NG-Monitor | Semantic KNX Gateway | Vendor Extensions |
|--------|---|---|---|
| **Central Entity** | Group Address | Datapoint + Function | Semantic metadata |
| **Hierarchy** | Project → GA Range → GA | Location → Device → Datapoint | Vendor-specific tags |
| **Import** | ETS file upload + wizard | API discovery + OpenAPI | Auto-discovery via `/info` |
| **Telegrams** | Raw KNX L-Data | Datapoint value updates | JSON:API resource format |
| **Real-Time** | SignalR KnxTelegram | WebSocket subscriptions | Vendor event streams |
| **Write** | Hex value to GA | Decoded value to Datapoint | Vendor-specific formats |
| **Security** | Keyring decryption | OAuth2 Bearer Token | JWT/API Key fallback |
| **History** | Archival (days) | Timeseries API (configurable) | Vendor-specific aggregations |
| **Devices** | Communication Objects | Device + Datapoints + Functions | Vendor metadata in `meta` |
| **API Spec** | Proprietary | JSON:API 1.0 + KNX IoT v2.1 | Vendor extensions in `meta.*` |

### 13.1 Vendor Endpoint Integration

The **semantic-knx-gateway** provides vendor-specific endpoints while maintaining KNX IoT spec compliance:

**Vendor Functions:** `/api/v1/functions` — Semantic layer bridges vendor capabilities
**Vendor Metadata:** All resources include `meta.*` for vendor-specific fields
**Vendor Subscriptions:** WebSocket subscriptions use standard filters but support vendor extensions

Example vendor metadata:
```json
{
  "type": "datapoint",
  "id": "1/2/3",
  "attributes": {
    "title": "Temperature Sensor",
    "meta": {
      "@type": "9.001",
      "@vendor": "siemens",
      "@product": "KX310",
      "customField": "vendor-value"
    }
  }
}
```

---

**End of Specification**
