/**
 * PRODUCT_FAITHFULNESS_EVIDENCE_TRACE_V1 — barrel export.
 *
 * A debugging/tracing tool for the real Product Faithfulness pipeline. Not a protection layer,
 * not a new authority: it never blocks, purges, or repairs evidence — it only records, compares,
 * and reports.
 */

export * from './product-faithfulness-trace-types.js';
export * from './product-faithfulness-trace.js';
export * from './product-faithfulness-trace-report.js';
