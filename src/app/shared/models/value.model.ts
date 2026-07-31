/**
 * Datapoint Value Event
 * Represents a datapoint value change
 */

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
  deviceId?: string;

  // Quality Indicators
  qualityValid?: boolean;
}

/**
 * Device Status Event
 */
export interface DeviceStatusEvent {
  type: 'device_status_changed';
  deviceId: string;
  status: 'online' | 'offline';
  timestamp: string;         // ISO-8601
}

/**
 * Union type for all WebSocket events
 */
export type WebSocketEvent = DatapointValueEvent | DeviceStatusEvent | BatchEvent | ErrorEvent;

export interface BatchEvent {
  type: 'batch';
  timestamp: string;
  updates: Array<{ id: string; value: string; timestamp?: string }>;
}

export interface ErrorEvent {
  type: 'error';
  status: string;
  message: string;
}

/**
 * Time-series data point (for charts)
 */
export interface TimeSeriesPoint {
  timestamp: string;      // ISO-8601
  value: number;
  count?: number;
  min?: number;
  max?: number;
  avg?: number;
}

/**
 * Statistics for datapoint
 */
export interface DatapointStats {
  min: number;
  max: number;
  avg: number;
  count: number;
  changes: number;
  lastUpdate: Date;
}

