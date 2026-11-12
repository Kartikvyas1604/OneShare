import type { FloorlinePosition } from "./floorline";

/**
 * Ephemeral client-side store for positions minted during this browsing
 * session. Client-side navigation shares this module instance, so a position
 * created on /create resolves on /vault/[id] without touching the chain.
 * Fixtures in floorline.ts remain the source for the recorded demo.
 */

const store = new Map<string, FloorlinePosition>();

export function pushSessionPosition(p: FloorlinePosition): void {
  store.set(p.hex_id.toLowerCase(), p);
}

export function getSessionPosition(rawId: string): FloorlinePosition | undefined {
  return store.get(rawId.toLowerCase());
}
