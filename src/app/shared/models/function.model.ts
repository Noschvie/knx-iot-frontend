/**
 * Function Resource (JSON:API)
 * Semantic functions (vendor layer)
 */

export interface FunctionMeta {
  '@type'?: string;       // e.g., "knx:TemperatureFunction"
  '@category'?: string;   // "monitoring" | "control" | "hvac"
  [key: string]: any;
}

export interface FunctionAttributes {
  title: string;
  description?: string;

  // Semantic Info
  meta?: FunctionMeta;
}

export interface FunctionRelationship {
  data: { type: string; id: string } | { type: string; id: string }[] | null;
}

export interface FunctionRelationships {
  datapoints?: FunctionRelationship;
  location?: FunctionRelationship;
}

export interface FunctionResource {
  type: 'function';
  id: string;
  attributes: FunctionAttributes;
  relationships?: FunctionRelationships;
}

/**
 * Flattened DTO for UI
 */
export interface Function {
  id: string;
  title: string;
  description?: string;

  // Semantic
  semanticType?: string;
  category?: string;

  // Relationships
  datapointIds?: string[];
  locationId?: string;
}

