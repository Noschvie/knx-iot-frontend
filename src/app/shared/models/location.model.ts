/**
 * Location Resource (JSON:API)
 * Hierarchical structure for locations/sites
 */

export interface LocationAttributes {
  title: string;
  description?: string;
  type?: string;  // "Building", "Floor", "Room", "Zone"
}

export interface LocationRelationship {
  data: { type: string; id: string } | { type: string; id: string }[] | null;
}

export interface LocationRelationships {
  parentLocation?: LocationRelationship;
  childLocations?: LocationRelationship;
  devices?: LocationRelationship;
  datapoints?: LocationRelationship;
}

export interface LocationResource {
  type: 'location';
  id: string;
  attributes: LocationAttributes;
  relationships?: LocationRelationships;
}

/**
 * Flattened DTO for UI
 */
export interface Location {
  id: string;
  title: string;
  description?: string;
  locationType?: string;

  // Relationships
  parentLocationId?: string;
  parentLocationTitle?: string;
  childLocationIds?: string[];
  deviceIds?: string[];
  datapointIds?: string[];

  // Computed
  path?: string;  // Breadcrumb path
  level?: number;
}

