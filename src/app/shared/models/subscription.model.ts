/**
 * Subscription Resource (JSON:API)
 * WebSocket subscriptions
 */

export interface SubscriptionAttributes {
  filter?: string;        // KNX IoT filter expression
  notificationUrl?: string; // Callback URL or ws:// address
  createdAt: string;      // ISO-8601
}

export interface SubscriptionRelationship {
  data: { type: string; id: string } | { type: string; id: string }[] | null;
}

export interface SubscriptionRelationships {
  datapoints?: SubscriptionRelationship;
}

export interface SubscriptionResource {
  type: 'subscription';
  id: string;
  attributes: SubscriptionAttributes;
  relationships?: SubscriptionRelationships;
}

/**
 * Flattened DTO
 */
export interface Subscription {
  id: string;
  filter?: string;
  notificationUrl?: string;
  createdAt: Date;
  datapointIds?: string[];
}

