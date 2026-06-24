/**
 * AiDevEngine Capability Audit V2 — missing capabilities report.
 */

import type { MissingCapabilitiesReport } from './capability-audit-types.js';

export const MISSING_CAPABILITIES_V2: readonly MissingCapabilitiesReport['entries'][number][] = [
  {
    capability: 'Real build execution beyond simulation',
    severity: 'BLOCKING',
    focusArea: 'Real Build Execution',
    detail:
      'Large-scale validation shows 0% build/blueprint/feature/engineering success; dry-run and simulation dominate.',
  },
  {
    capability: 'UVL full verification execution',
    severity: 'BLOCKING',
    focusArea: 'Verification Systems',
    detail: 'UVL Hub module passes but operational coverage ~6%; most categories NOT_RUN or Missing.',
  },
  {
    capability: 'General-purpose code generation beyond 5 CRUD profiles',
    severity: 'HIGH',
    focusArea: 'Code Generation',
    detail: 'Code Generation Engine V1 limited to 5 web CRUD profiles; blocks diverse app categories.',
  },
  {
    capability: 'World2 real filesystem instantiation',
    severity: 'HIGH',
    focusArea: 'World2',
    detail: '27 World2 modules validate individually; end-to-end disposable workspace → real build not closed.',
  },
  {
    capability: 'Cloud runtime production deployment',
    severity: 'BLOCKING',
    focusArea: 'Cloud Execution',
    detail: 'No validated cloud execution or production deployment path.',
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
    capability: 'Canonical ownership registration for V1 operator modules',
    severity: 'MEDIUM',
    focusArea: 'Production Readiness',
    detail:
      'PAI, UVL Hub, AFLA Trust Cal, Large-Scale Validation, Founder Review Dashboard not in ownership registry.',
  },
  {
    capability: 'Unified failure escalation authority',
    severity: 'MEDIUM',
    focusArea: 'Self-Evolution',
    detail: 'Partial coverage via repair loop and self-evolution triggers; no single escalation owner.',
  },
  {
    capability: 'Production readiness gate',
    severity: 'BLOCKING',
    focusArea: 'Production Readiness',
    detail: 'Launch readiness validates blueprint suites; production deployment readiness unvalidated.',
  },
  {
    capability: 'Multi-project concurrent execution at scale',
    severity: 'HIGH',
    focusArea: 'Multi-Project Scale',
    detail: 'Multi-project tabs and foundation exist; concurrent isolated execution not proven.',
  },
];

export function buildMissingCapabilitiesReport(): MissingCapabilitiesReport {
  return {
    generatedAt: new Date().toISOString(),
    blockingVision: MISSING_CAPABILITIES_V2.filter((e) => e.severity === 'BLOCKING').map(
      (e) => e.capability,
    ),
    stillWeak: MISSING_CAPABILITIES_V2.filter(
      (e) => e.severity === 'HIGH' || e.severity === 'MEDIUM',
    ).map((e) => e.capability),
    entries: MISSING_CAPABILITIES_V2,
  };
}
