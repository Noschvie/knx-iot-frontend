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
  timestamp?: string;      // ISO-8601 timestamp (API spec)
  lastUpdated?: string;    // Alternative timestamp field
  unit?: string;           // Unit from API (e.g., "unit:PERCENT")

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
export interface IDatapoint {
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
 * Datapoint Class - Full domain model with helper methods
 */
export class Datapoint implements IDatapoint {
  id: string;
  title: string;
  description?: string;
  value?: string;
  valueRaw?: string;
  lastUpdated?: Date;
  dptType?: string;
  unit?: string;
  deviceId?: string;
  deviceTitle?: string;
  locationId?: string;
  locationTitle?: string;
  functionId?: string;
  readable: boolean;
  writable: boolean;
  qualityValid: boolean;

  constructor(data: IDatapoint) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.value = data.value;
    this.valueRaw = data.valueRaw;
    this.lastUpdated = data.lastUpdated;
    this.dptType = data.dptType;
    this.unit = data.unit;
    this.deviceId = data.deviceId;
    this.deviceTitle = data.deviceTitle;
    this.locationId = data.locationId;
    this.locationTitle = data.locationTitle;
    this.functionId = data.functionId;
    this.readable = data.readable;
    this.writable = data.writable;
    this.qualityValid = data.qualityValid;
  }

  /**
   * Get a display name (title with optional device/location)
   */
  getDisplayName(): string {
    if (this.deviceTitle) {
      return `${this.title} (${this.deviceTitle})`;
    }
    return this.title;
  }

  /**
   * Check if datapoint can be read
   */
  canRead(): boolean {
    return this.readable;
  }

  /**
   * Check if datapoint can be written
   */
  canWrite(): boolean {
    return this.writable;
  }

  /**
   * Check if the value is valid/trustworthy
   */
  isValueValid(): boolean {
    return this.qualityValid;
  }

  /**
   * Get formatted value with unit
   */
  getFormattedValue(): string {
    if (!this.value) {
      return 'N/A';
    }
    return this.unit ? `${this.value} ${this.unit}` : this.value;
  }

  /**
   * Check if datapoint has recent update
   * @param maxAgeMs Maximum age in milliseconds (default: 5 minutes)
   */
  hasRecentUpdate(maxAgeMs: number = 5 * 60 * 1000): boolean {
    if (!this.lastUpdated) {
      return false;
    }
    const now = new Date();
    const age = now.getTime() - new Date(this.lastUpdated).getTime();
    return age <= maxAgeMs;
  }
}

/**
 * Query filters for a datapoint list
 */
export interface DatapointFilterCriteria {
  search?: string;
  deviceId?: string;
  locationId?: string;
  dptType?: string;
  writable?: boolean;
  readable?: boolean;
}
