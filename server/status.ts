import { RequestStatus } from '../src/types/lifelink';

/** Terminal request states (§5, §27, §35). Frozen once reached. */
export const TERMINAL_REQUEST_STATES: RequestStatus[] = [
  'FULFILLED',
  'FULFILMENT_CONFIRMED_BY_CENTRE',
  'CANCELLED',
  'CANCELLED_BY_HOSPITAL',
  'EXPIRED',
  'CLOSED_OTHER_REASON',
];

export function isTerminalRequestState(status: RequestStatus): boolean {
  // Defensive: unknown statuses are treated as terminal for safety (fail-closed).
  return TERMINAL_REQUEST_STATES.includes(status);
}

/** Lifecycle transition when a request's fulfilled/reserved unit counts change. */
export function nextStatusAfterUnitsChange(
  current: RequestStatus,
  unitsFulfilled: number,
  unitsRequired: number,
): RequestStatus {
  if (unitsFulfilled >= unitsRequired) {
    return 'FULFILMENT_CONFIRMED_BY_CENTRE';
  }
  if (unitsFulfilled > 0) {
    return 'PARTIALLY_FULFILLED';
  }
  return current;
}
