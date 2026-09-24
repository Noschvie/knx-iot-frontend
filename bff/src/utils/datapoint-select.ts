/**
 * Shared datapoint selection logic used by both the GatewayService and the
 * StatusReceiverService so that the command path and the status path always
 * resolve a group address to the *same* datapoint.
 *
 * The gateway may return multiple datapoint resources for a single
 * `filter[ga]` query, e.g., a real vendor datapoint "GA-471" plus a derived
 * "ga-2-4-0". We deliberately prefer the canonical vendor id form (`GA-###`)
 * instead of relying on the array order (`data[0]`).
 */

export interface DatapointLike {
  id: string;
  meta?: {
    datapointId?: string;
    [key: string]: unknown;
  };
}

/** Vendor canonical datapoint id form, e.g. "GA-471". */
const CANONICAL_DATAPOINT_ID = /^GA-\d+$/;

/**
 * Resolve the human-friendly datapoint id: vendor `meta.datapointId`
 * (e.g. "GA-471") with the resource UUID as a fallback.
 */
export function datapointIdOf(dp: DatapointLike): string {
  return dp.meta?.datapointId ?? dp.id;
}

/**
 * Pick the canonical datapoint for a GA. Prefers an entry whose datapoint id
 * matches the vendor `GA-###` form; falls back to the first entry otherwise.
 * Returns the chosen datapoint plus any ignored ones for logging, or `null`
 * when the list is empty.
 */
export function selectCanonicalDatapoint<T extends DatapointLike>(
  datapoints: T[] | undefined | null
): { chosen: T; ignored: T[] } | null {
  if (!datapoints || datapoints.length === 0) {
    return null;
  }

  const preferred = datapoints.find((dp) => CANONICAL_DATAPOINT_ID.test(datapointIdOf(dp)));
  const chosen = preferred ?? datapoints[0];
  const ignored = datapoints.filter((dp) => dp !== chosen);
  return { chosen, ignored };
}
