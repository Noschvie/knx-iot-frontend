/**
 * Datapoint Resource (JSON:API)
 * Represents a single KNX datapoint or IoT endpoint
 */

export interface DatapointMeta {
  '@type'?: string;        // e.g., "9.001" (DPT)
  '@encoding'?: string;    // "boolean" | "unsigned" | "signed"
  '@unit'?: string;        // "°C" | "%" | "lux"
  [key: string]: any;      // Vendor extensions
}

export interface DatapointAttributes {
  title: string;
  description?: string;
  
  // Metadata
  meta?: DatapointMeta;
  
  // Value Information
  value?: string;          // Current decoded value
  valueRaw?: string;       // Hex representation
  lastUpdated?: string;    // ISO-8601 timestamp
  
  // Capabilities
  readable?: boolean;
  writable?: boolean;
  
  // Status
  qualityValid?: boolean;
}

export interface DatapointRelationship {
  data: { type: string; id: string } | { type: string; id: string }[] | null;
}

export interface DatapointRelationships {
  device?: DatapointRelationship;
  location?: DatapointRelationship;
  function?: DatapointRelationship;
  subscriptions?: DatapointRelationship;
}

export interface DatapointResource {
  type: 'datapoint';
  id: string;  // e.g., "1/2/3" or vendor ID
  attributes: DatapointAttributes;
  relationships?: DatapointRelationships;
}

/**
 * Flattened DTO for UI consumption
 * (after JSON:API transformation)
 */
export interface Datapoint {
  id: string;
  title: string;
  description?: string;
  
  // Value & metadata
  value?: string;
  valueRaw?: string;
  lastUpdated?: Date;
  dptType?: string;
  unit?: string;
  
  // Relationships
  deviceId?: string;
  deviceTitle?: string;
  locationId?: string;
  locationTitle?: string;
  functionId?: string;
  
  // Capabilities & status
  readable: boolean;
  writable: boolean;
  qualityValid: boolean;
}

/**
 * Query filters for datapoint list
 */
export interface DatapointFilterCriteria {
  search?: string;
  deviceId?: string;
  locationId?: string;
  dptType?: string;
  writable?: boolean;
  readable?: boolean;
}

