/**
 * Production Contract Consumption Trace V1 — investigation only, no fix, no new authority.
 *
 * `contractConsumptionTrace()` is the single temporary logging call this milestone's instrumented
 * files use. It is env-gated (off unless `CONTRACT_CONSUMPTION_TRACE=1`), deterministic (JSON.stringify
 * with a stable field order via the type's declaration order), and side-effect-free beyond a single
 * `console.log('[CONTRACT_CONSUMPTION_TRACE]', json)` line. It does not change control flow, does
 * not read/write anything, and does not gate/score/authorize anything — it only observes and prints
 * whatever the real call site already computed. Remove this module and its call sites once the
 * production defects it traces are fixed by a separate, dedicated fix milestone.
 */

import { createHash } from 'node:crypto';
import type { ContractConsumptionTraceFields } from './production-contract-consumption-trace-types.js';

export const CONTRACT_CONSUMPTION_TRACE_ENABLED = process.env.CONTRACT_CONSUMPTION_TRACE === '1';

export function contractConsumptionTrace(fields: ContractConsumptionTraceFields): void {
  if (!CONTRACT_CONSUMPTION_TRACE_ENABLED) return;
  console.log('[CONTRACT_CONSUMPTION_TRACE]', JSON.stringify(fields));
}

/** Deterministic short correlation hash — lets independent trace lines from pure, context-free
 * functions (no buildId/requestId parameter) be joined back to the same build by prompt text alone. */
export function shortHashForTrace(text: string): string {
  return createHash('sha256').update(text ?? '').digest('hex').slice(0, 16);
}
