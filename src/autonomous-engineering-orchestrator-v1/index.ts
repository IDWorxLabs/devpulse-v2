/**
 * Autonomous Engineering Orchestrator V1 — barrel.
 *
 * Connects existing diagnosis, repair, AutoFix, and missing-capability systems into the real
 * one-prompt build path: build → observe failure → diagnose → classify → check repair capability
 * → apply safe repair if available → retry only the affected stage → route missing capability
 * when no safe repair exists → report clearly → continue only when safe.
 */

export * from './failure-taxonomy.js';
export * from './autonomous-engineering-orchestrator-types.js';
export * from './failure-diagnosis-adapter.js';
export * from './repair-capability-registry.js';
export * from './repair-execution-planner.js';
export * from './missing-capability-router.js';
export * from './autonomous-engineering-orchestrator.js';
export * from './autonomous-engineering-orchestrator-report.js';
