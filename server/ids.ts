/** ID + timestamp helpers shared by the API handler. */

export function nowIso(): string {
  return new Date().toISOString();
}

let counter = 0;
export function uid(prefix: string): string {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(4, '0')}`;
}

/** Generate a LifeLink emergency request ID like LL-2026-000482. */
export function generateRequestId(seed: number): string {
  const year = new Date().getFullYear();
  const serial = String(184 + seed).padStart(6, '0');
  return `LL-${year}-${serial}`;
}
