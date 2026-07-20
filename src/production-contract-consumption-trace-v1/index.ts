/**
 * Production Contract Consumption Trace V1 — investigation only, no fix, no new authority.
 * See production-contract-consumption-trace.ts for the temporary logging call and
 * production-contract-consumption-report.ts for the report-rendering helpers.
 */

export type {
  ContractConsumptionStage,
  ContractConsumptionTraceFields,
  ContractConsumptionTableRow,
} from './production-contract-consumption-trace-types.js';

export {
  CONTRACT_CONSUMPTION_TRACE_ENABLED,
  contractConsumptionTrace,
  shortHashForTrace,
} from './production-contract-consumption-trace.js';

export { PRODUCTION_CALL_GRAPH, renderCallGraph, renderConsumptionTable } from './production-contract-consumption-report.js';
