/**
 * JSON:API Response envelope
 * See https://jsonapi.org/
 */

export interface JsonApiResponse<T = any> {
  data: T | T[] | null;
  included?: any[];
  meta?: JsonApiMeta;
  links?: JsonApiLinks;
  errors?: JsonApiError[];
}

export interface JsonApiMeta {
  [key: string]: any;
  pageInfo?: {
    offset?: number;
    limit?: number;
    total?: number;
    nextOffset?: number;
  };
}

export interface JsonApiLinks {
  self?: string;
  first?: string;
  next?: string;
  prev?: string;
  last?: string;
  [key: string]: string | undefined;
}

export interface JsonApiError {
  status: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  meta?: Record<string, any>;
}

/**
 * API Info endpoint
 */
export interface ApiInfo {
  name: string;
  version: string;
  features: Record<string, boolean>;
  endpoints: Record<string, string>;
}

/**
 * Health check response
 */
export interface HealthStatus {
  status: 'up' | 'down';
  timestamp: string;
  version?: string;
  checks?: Record<string, boolean>;
}

