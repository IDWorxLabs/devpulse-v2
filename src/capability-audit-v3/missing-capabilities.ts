/**
 * AiDevEngine Capability Audit V3 — missing capabilities report.
 */

import type { MissingCapabilitiesReport } from './capability-audit-types.js';

export const MISSING_CAPABILITIES_V3: readonly MissingCapabilitiesReport['entries'][number][] = [
  {
    capability: 'UVL full verification execution',
    severity: 'BLOCKING',
    focusArea: 'Verification Systems',
    detail:
      'Real Build Execution V1.1: verifiedCount 0/15 despite 100% build/preview/launch proof. UVL Hub operational coverage ~6%.',
  },
  {
    capability: 'Production readiness gate',
    severity: 'BLOCKING',
    focusArea: 'Production Readiness',
    detail: 'Launch readiness validates blueprint suites; production deployment readiness unvalidated.',
  },
  {
    capability: 'Cloud runtime production deployment',
    severity: 'BLOCKING',
    focusArea: 'Cloud Execution',
    detail: 'No validated cloud execution or production deployment path.',
  },
  {
    capability: 'General-purpose code generation beyond CRUD profiles',
    severity: 'HIGH',
    focusArea: 'Code Generation',
    detail: 'Code Generation Engine V1 limited to 5 web CRUD profiles; blocks 58-category diversity.',
  },
  {
    capability: 'Large-scale pipeline integration with Real Build Execution',
    severity: 'HIGH',
    focusArea: 'Multi-Project Scale',
    detail:
      'Large-scale validation shows 0% buildSuccessRate in its harness despite Real Build Execution V1.1 proving 100% for 15 categories.',
  },
  {
    capability: 'World2 real filesystem instantiation',
    severity: 'HIGH',
    focusArea: 'World2',
    detail: 'Dry-run composer bridge sets realExecutionPerformed=false; execution proven outside World2 boundary.',
  },
  {
    capability: 'Canonical ownership registration for V2/V3 modules',
    severity: 'MEDIUM',
    focusArea: 'Self-Evolution',
    detail:
      'Real Build Execution Pipeline V1/V1.1, CQI Maturity V1, Capability Audit V2 not in ownership registry.',
  },
  {
    capability: 'Mobile runtime validation at scale',
    severity: 'HIGH',
    focusArea: 'Mobile Runtime Validation',
    detail: 'Mobile preview modes exist; no large-scale mobile runtime validation harness.',
  },
  {
    capability: 'Self-modification execution',
    severity: 'HIGH',
    focusArea: 'Self-Evolution',
    detail: 'Self-evolution and gap detection are advisory; no automated capability modification.',
  },
  {
    capability: 'Parallel build execution',
    severity: 'MEDIUM',
    focusArea: 'Multi-Project Scale',
    detail: 'Parallel Build Orchestration is planning-only; no concurrent build execution.',
  },
  {
    capability: 'Operational monitoring for deployed apps',
    severity: 'MEDIUM',
    focusArea: 'Production Readiness',
    detail: 'No observability stack for generated applications in production.',
  },
  {
    capability: 'Unified failure escalation authority',
    severity: 'MEDIUM',
    focusArea: 'Self-Evolution',
    detail: 'Partial coverage via repair loop and self-evolution triggers; no single escalation owner.',
  },
];

export function buildMissingCapabilitiesReport(): MissingCapabilitiesReport {
  return {
    generatedAt: new Date().toISOString(),
    blockingVision: MISSING_CAPABILITIES_V3.filter((e) => e.severity === 'BLOCKING').map(
      (e) => e.capability,
    ),
    stillWeak: MISSING_CAPABILITIES_V3.filter(
      (e) => e.severity === 'HIGH' || e.severity === 'MEDIUM',
    ).map((e) => e.capability),
    entries: MISSING_CAPABILITIES_V3,
    highestPriorityGap: 'UVL full verification execution',
  };
}
