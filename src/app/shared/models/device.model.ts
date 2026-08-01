/**
 * Device Resource (JSON:API)
 */

export interface DeviceMeta {
  'knx:manufacturer'?: string;
  'knx:product'?: string;
  'knx:serialNumber'?: string;
  [key: string]: any;
}

export interface DeviceAttributes {
  title: string;
  description?: string;

  // Hardware Info - can be in meta (knx:) or direct attributes
  manufacturer?: string;      // Can be direct or in meta['knx:manufacturer']
  product?: string;           // Can be direct or in meta['knx:product']
  serialNumber?: string;      // Can be direct or in meta['knx:serialNumber']
  meta?: DeviceMeta;

  // Physical address
  physicalAddress?: string;   // "1.2.3" for KNX

  // Status
  status?: 'online' | 'offline' | 'unknown' | string;
  lastSeen?: string;          // ISO-8601
  datapointCount?: number;

  // Other attributes that may come from API
  [key: string]: any;
}

export interface DeviceRelationship {
  data: { type: string; id: string } | { type: string; id: string }[] | null;
}

export interface DeviceRelationships {
  location?: DeviceRelationship;
  datapoints?: DeviceRelationship;
}

export interface DeviceResource {
  type: 'device';
  id: string;
  attributes: DeviceAttributes;
  relationships?: DeviceRelationships;
}

/**
 * Flattened DTO for UI
 */
export interface Device {
  id: string;
  title: string;
  description?: string;

  // Hardware & Network
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  physicalAddress?: string;

  // Status
  status: 'online' | 'offline' | 'unknown';
  lastSeen?: Date;
  datapointCount: number;

  // Relationships
  locationId?: string;
  locationTitle?: string;
  datapointIds?: string[];
}

