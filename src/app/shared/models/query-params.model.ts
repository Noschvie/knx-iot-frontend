/**
 * Query Parameters for API requests
 * Follows JSON:API spec + KNX IoT extensions
 */

export interface PaginationParams {
  offset?: number;
  limit?: number;
}

export interface SortParams {
  sort?: string;  // e.g., "title" or "-lastUpdated"
}

export interface FilterParams {
  [key: string]: string | string[];
  // Examples:
  // 'filter[device.id]': '1/2/3'
  // 'filter[status]': 'online'
  // 'filter[timestamp][ge]': '2026-07-30T00:00:00Z'
}

export interface QueryOptions extends SortParams {
  page?: PaginationParams;
  filter?: FilterParams | string;  // Can be object or query string
  fields?: Record<string, string[]>;  // Sparse fieldsets
  include?: string[];  // Related resources to include
}

/**
 * Common history query params
 */
export interface HistoryQueryParams extends QueryOptions {
  'filter[timestamp][ge]'?: string;  // From (ISO-8601)
  'filter[timestamp][le]'?: string;  // To (ISO-8601)
}

/**
 * Time-series query params
 */
export interface TimeSeriesQueryParams extends QueryOptions {
  aggregation?: 'hourly' | 'daily' | 'raw';
  'filter[timestamp][ge]'?: string;
  'filter[timestamp][le]'?: string;
}

/**
 * Helper to build query string
 */
export function buildQueryString(options: QueryOptions): string {
  const params = new URLSearchParams();

  if (options.page?.offset !== undefined) {
    params.append('page[offset]', options.page.offset.toString());
  }
  if (options.page?.limit !== undefined) {
    params.append('page[limit]', options.page.limit.toString());
  }

  if (options.sort) {
    params.append('sort', options.sort);
  }

  if (options.filter) {
    if (typeof options.filter === 'string') {
      params.append('filter', options.filter);
    } else {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`filter[${key}]`, v));
        } else {
          params.append(`filter[${key}]`, value);
        }
      });
    }
  }

  if (options.include && options.include.length > 0) {
    params.append('include', options.include.join(','));
  }

  return params.toString();
}

