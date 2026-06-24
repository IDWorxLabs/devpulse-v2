/**
 * AiDevEngine Capability Audit V2 — recommended roadmap (evidence-based, fresh).
 */

import type { RoadmapPriority } from './capability-audit-types.js';

export const RECOMMENDED_ROADMAP_V2: readonly RoadmapPriority[] = [
  {
    rank: 1,
    phase: 'Real Build Execution Pipeline',
    action: 'BUILD',
    rationale:
      'Large-scale validation proves category generation (83 generalization) but 0% downstream build success. This blocks the entire vision before World2 or cloud can matter.',
    impact: 'CRITICAL',
    dependencies: ['Code Generation Engine V1', 'Connected Build Execution'],
  },
  {
    rank: 2,
    phase: 'UVL Verification Execution',
    action: 'EXTEND',
    rationale:
      'UVL Hub V1 module is mature but operational coverage is ~6%. Wire full verification execution before expanding launch surface.',
    impact: 'CRITICAL',
    dependencies: ['UVL Verification Hub V1', 'Feature Reality Validation', 'Engineering Reality Authority'],
  },
  {
    rank: 3,
    phase: 'Canonical Ownership V2 Registration',
    action: 'REGISTER',
    rationale:
      'Six new V1 capabilities (PAI, UVL Hub, AFLA Trust Cal, Large-Scale, Founder Review Dashboard, Founder Reality) need constitutional registration.',
    impact: 'HIGH',
    dependencies: ['Canonical Capability Ownership V1'],
  },
  {
    rank: 4,
    phase: 'General-Purpose Code Generation',
    action: 'EXTEND',
    rationale:
      'Extend Code Generation Engine beyond 5 CRUD profiles to unlock large-scale category diversity.',
    impact: 'HIGH',
    dependencies: ['Real Build Execution Pipeline'],
  },
  {
    rank: 5,
    phase: 'Production Readiness Gate',
    action: 'BUILD',
    rationale:
      'Launch readiness validates blueprint suites; production deployment path and cloud runtime remain unvalidated.',
    impact: 'CRITICAL',
    dependencies: ['Real Build Execution Pipeline', 'UVL Verification Execution'],
  },
  {
    rank: 6,
    phase: 'World2 Real Instantiation',
    action: 'EXTEND',
    rationale:
      'World2 has 27 modules at PARTIAL/EXPERIMENTAL maturity. Consolidate Phase 7/15/24 eras and close dry-run → real execution bridge — but only after Real Build Execution Pipeline.',
    impact: 'HIGH',
    dependencies: ['Real Build Execution Pipeline', 'World2 Disposable Workspace Pipeline'],
  },
  {
    rank: 7,
    phase: 'Self-Evolution Execution',
    action: 'EXTEND',
    rationale:
      'Self-evolution is advisory only. Wire gap detection → capability research → build → verify loop with human approval gate.',
    impact: 'MEDIUM',
    dependencies: ['Real Build Execution Pipeline', 'Canonical Ownership V2 Registration'],
  },
  {
    rank: 8,
    phase: 'Mobile Runtime Validation at Scale',
    action: 'BUILD',
    rationale:
      'Mobile preview modes exist; large-scale mobile runtime validation harness needed for cross-platform vision.',
    impact: 'HIGH',
    dependencies: ['UVL Verification Execution', 'Large-Scale Multi-App Validation V1'],
  },
  {
    rank: 9,
    phase: 'Multi-Project Concurrent Execution',
    action: 'EXTEND',
    rationale:
      'Multi-project foundation and tabs are mature; parallel build orchestration must move from planning to execution.',
    impact: 'MEDIUM',
    dependencies: ['Real Build Execution Pipeline', 'World2 Real Instantiation'],
  },
  {
    rank: 10,
    phase: 'Cloud Execution Path',
    action: 'BUILD',
    rationale:
      'No validated cloud runtime or production deployment. Defer until local real build execution is proven.',
    impact: 'HIGH',
    dependencies: ['Production Readiness Gate', 'Real Build Execution Pipeline'],
  },
];

export function buildRecommendedRoadmap(): { priorities: readonly RoadmapPriority[]; world2IsNextPhase: boolean } {
  return {
    priorities: RECOMMENDED_ROADMAP_V2,
    world2IsNextPhase: false,
  };
}
