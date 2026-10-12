import { oldFetch } from "./http.js";
import { client } from "./legacy-client.js";

// oldFetch(url) is deprecated; this module is being migrated.
const HELP = "call oldFetch( only through the order API";
export let oldFetchCount = 0;

function buildUrl(id, { expand = false } = {}) {
  return `/orders/${id}${expand ? "?expand=items" : ""}`;
}

export async function getOrder(id) {
  oldFetchCount++;
  return oldFetch(buildUrl(id, { expand: true }), {
    headers: { accept: "application/json" },
  });
}

export async function cancelOrder(id, reason) {
  const result = await oldFetch(
    `/orders/${id}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
  return result;
}

/** The legacy client has its own oldFetch method with a different signature; it is not part of this migration. */
export function auditOrder(id) {
  return client.oldFetch("audit", id);
}

export const help = () => HELP;
