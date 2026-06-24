/**
 * Capability Audit V3.1 — gap priority recalculation from current evidence.
 */

import type { MissingCapabilityEntry, RoadmapPriority } from './capability-audit-types.js';
import type { UvlEvidenceSnapshot } from './uvl-evidence-loader.js';
import { loadLargeScalePipelineIntegrationSnapshot } from '../large-scale-pipeline-integration-v1/index.js';
import { isWorld2RealInstantiationProven } from '../world2-real-instantiation-v1/index.js';
import { isMobileRuntimeValidationProven } from '../mobile-runtime-validation-at-scale-v1/index.js';

const PHASE_BY_CAPABILITY: Readonly<Record<string, string>> = {
  'Production readiness gate': 'Production Readiness Gate',
  'Cloud runtime production deployment': 'Cloud Execution Path',
  'General-purpose code generation beyond CRUD profiles': 'General-Purpose Code Generation',
  'Large-scale pipeline integration with Real Build Execution': 'Large-Scale Pipeline Integration',
  'World2 real filesystem instantiation': 'World2 Real Instantiation',
  'Canonical ownership registration for V2/V3 modules': 'Canonical Ownership V2 Registration',
  'Mobile runtime validation at scale': 'Mobile Runtime Validation at Scale',
  'Self-modification execution': 'Self-Evolution Execution',
  'Parallel build execution': 'Multi-Project Concurrent Execution',
  'Operational monitoring for deployed apps': 'Production Readiness Gate',
  'Unified failure escalation authority': 'Self-Evolution Execution',
};

const ROADMAP_TEMPLATES: Readonly<
  Record<string, Omit<RoadmapPriority, 'rank'> & { gapCapability?: string }>
> = {
  'Production Readiness Gate': {
    phase: 'Production Readiness Gate',
    action: 'BUILD',
    rationale:
      'Launch readiness validates blueprint suites; production deployment, monitoring, and rollback remain unvalidated.',
    impact: 'CRITICAL',
    dependencies: ['Real Build Execution Pipeline V1.1', 'UVL Verification Execution'],
    gapCapability: 'Production readiness gate',
  },
  'Canonical Ownership V2 Registration': {
    phase: 'Canonical Ownership V2 Registration',
    action: 'REGISTER',
    rationale:
      'Real Build Execution V1/V1.1, CQI Maturity V1, UVL Verification Execution V1, Capability Audit V2/V3, and Production Readiness Gate need constitutional registration.',
    impact: 'HIGH',
    dependencies: ['Canonical Capability Ownership V1'],
    gapCapability: 'Canonical ownership registration for V2/V3 modules',
  },
  'General-Purpose Code Generation': {
    phase: 'General-Purpose Code Generation',
    action: 'EXTEND',
    rationale:
      'Real Build Execution and UVL verification prove 15 CRUD-adjacent categories at 100%; Code Generation Engine still limited to 5 profiles.',
    impact: 'HIGH',
    dependencies: ['Real Build Execution Pipeline V1.1', 'UVL Verification Execution'],
    gapCapability: 'General-purpose code generation beyond CRUD profiles',
  },
  'Large-Scale Pipeline Integration': {
    phase: 'Large-Scale Pipeline Integration',
    action: 'EXTEND',
    rationale:
      'Large-scale validation harness shows 0% buildSuccessRate despite Real Build Execution proving 100%. Wire harness to RBEP proof chain.',
    impact: 'HIGH',
    dependencies: ['Real Build Execution Pipeline V1.1', 'Large-Scale Multi-App Validation V1'],
    gapCapability: 'Large-scale pipeline integration with Real Build Execution',
  },
  'World2 Real Instantiation': {
    phase: 'World2 Real Instantiation',
    action: 'EXTEND',
    rationale:
      'World2 modules validate in isolation; dry-run bridge does not activate real execution. Connect to Real Build Execution after verification and ownership registration.',
    impact: 'HIGH',
    dependencies: ['UVL Verification Execution', 'Real Build Execution Pipeline V1.1'],
    gapCapability: 'World2 real filesystem instantiation',
  },
  'Self-Evolution Execution': {
    phase: 'Self-Evolution Execution',
    action: 'EXTEND',
    rationale:
      'Self-evolution is advisory only. Wire gap detection → capability research → build → verify loop with human approval gate.',
    impact: 'MEDIUM',
    dependencies: ['Canonical Ownership V2 Registration', 'UVL Verification Execution'],
    gapCapability: 'Self-modification execution',
  },
  'Mobile Runtime Validation at Scale': {
    phase: 'Mobile Runtime Validation at Scale',
    action: 'BUILD',
    rationale:
      'Mobile preview modes exist; large-scale mobile runtime validation harness needed for cross-platform vision.',
    impact: 'HIGH',
    dependencies: ['UVL Verification Execution', 'Large-Scale Multi-App Validation V1'],
    gapCapability: 'Mobile runtime validation at scale',
  },
  'Multi-Project Concurrent Execution': {
    phase: 'Multi-Project Concurrent Execution',
    action: 'EXTEND',
    rationale:
      'Multi-project foundation and tabs are mature; parallel build orchestration must move from planning to execution.',
    impact: 'MEDIUM',
    dependencies: ['World2 Real Instantiation', 'Real Build Execution Pipeline V1.1'],
    gapCapability: 'Parallel build execution',
  },
  'Cloud Execution Path': {
    phase: 'Cloud Execution Path',
    action: 'BUILD',
    rationale:
      'No validated cloud runtime or production deployment. Defer until production readiness gate is proven locally.',
    impact: 'HIGH',
    dependencies: ['Production Readiness Gate', 'UVL Verification Execution'],
    gapCapability: 'Cloud runtime production deployment',
  },
};

const SEVERITY_WEIGHT: Record<MissingCapabilityEntry['severity'], number> = {
  BLOCKING: 1000,
  HIGH: 700,
  MEDIUM: 400,
  LOW: 200,
};

export function scoreGapPriority(
  entry: MissingCapabilityEntry,
  context: {
    productionReadinessScore: number;
    codeGenerationMaturityScore: number;
  },
): number {
  let score = SEVERITY_WEIGHT[entry.severity];

  if (entry.capability.includes('Production readiness')) {
    score += 100 - context.productionReadinessScore;
  }
  if (entry.capability.includes('Canonical ownership')) {
    score += 60;
  }
  if (entry.capability.includes('General-purpose code generation')) {
    score += 100 - context.codeGenerationMaturityScore;
  }
  if (entry.capability.includes('Large-scale pipeline')) {
    score += 35;
  }
  if (entry.capability.includes('World2')) {
    score += 25;
  }
  if (entry.capability.includes('Cloud runtime')) {
    score += 40;
  }

  return score;
}

export function computeHighestPriorityGap(
  entries: readonly MissingCapabilityEntry[],
  context: {
    productionReadinessScore: number;
    codeGenerationMaturityScore: number;
  },
): string {
  if (entries.length === 0) {
    return 'No remaining blocking gaps — maintain operational evidence freshness';
  }

  const ranked = [...entries].sort(
    (a, b) =>
      scoreGapPriority(b, context) - scoreGapPriority(a, context) ||
      a.capability.localeCompare(b.capability),
  );

  const top = ranked[0];
  const phase = PHASE_BY_CAPABILITY[top.capability] ?? top.capability;
  return `${phase} — ${top.detail}`;
}

export function buildRoadmapFromEvidence(input: {
  missingEntries: readonly MissingCapabilityEntry[];
  productionReadinessScore: number;
  codeGenerationMaturityScore: number;
  uvlEvidence: UvlEvidenceSnapshot;
  projectRootDir?: string;
}): {
  priorities: readonly RoadmapPriority[];
  world2IsNextPhase: boolean;
  nextPriority: string;
} {
  const completePhases: RoadmapPriority[] = [
    {
      rank: 0,
      phase: 'Real Build Execution Pipeline',
      action: 'COMPLETE',
      rationale:
        'V1 and V1.1 PASS: 15/15 proof coverage, execution generalization 96/100. Closed largest V2 operational gap.',
      impact: 'CRITICAL',
      dependencies: [],
    },
  ];

  if (input.uvlEvidence.uvlVerificationExecutionComplete) {
    completePhases.push({
      rank: 0,
      phase: 'UVL Verification Execution',
      action: 'COMPLETE',
      rationale: `UVL Verification Execution V1 PASS: ${input.uvlEvidence.uvlVerifiedCount}/${input.uvlEvidence.suiteCoverage.categoriesRequired} verified, ${input.uvlEvidence.suiteCoverage.verificationCoveragePercent}% coverage, ${input.uvlEvidence.suiteCoverage.verificationConfidenceScore}/100 confidence.`,
      impact: 'CRITICAL',
      dependencies: ['UVL Verification Hub V1', 'Real Build Execution Pipeline V1.1'],
    });
  }

  const pipelineIntegration = loadLargeScalePipelineIntegrationSnapshot(input.projectRootDir);
  if (pipelineIntegration.integrationComplete) {
    completePhases.push({
      rank: 0,
      phase: 'Large-Scale Pipeline Integration',
      action: 'COMPLETE',
      rationale: `Large-Scale Pipeline Integration V1 PASS: authoritative build ${pipelineIntegration.assessment.metrics.buildSuccessRate}%, verification ${pipelineIntegration.assessment.metrics.verificationSuccessRate}%, pipeline score ${pipelineIntegration.assessment.pipelineScore.score}/100.`,
      impact: 'HIGH',
      dependencies: [
        'Real Build Execution Pipeline V1.1',
        'UVL Verification Execution V1',
        'Large-Scale Multi-App Validation V1',
      ],
    });
  }

  if (input.projectRootDir && isWorld2RealInstantiationProven(input.projectRootDir)) {
    completePhases.push({
      rank: 0,
      phase: 'World2 Real Instantiation',
      action: 'COMPLETE',
      rationale:
        'World2 Real Instantiation V1 PASS: 3/3 disposable worlds instantiated, executed, isolated, with promotion and destruction paths proven.',
      impact: 'HIGH',
      dependencies: [
        'World2 Disposable Workspace Pipeline (24E–24Y)',
        'Real Build Execution Pipeline V1.1',
        'Cloud Execution Path V1',
      ],
    });
  }

  if (input.projectRootDir && isMobileRuntimeValidationProven(input.projectRootDir)) {
    completePhases.push({
      rank: 0,
      phase: 'Mobile Runtime Validation at Scale',
      action: 'COMPLETE',
      rationale:
        'Mobile Runtime Validation at Scale V1 PASS: 10/10 categories mobile-proven across ANDROID_PHONE, ANDROID_TABLET, IPHONE, and IPAD profiles.',
      impact: 'HIGH',
      dependencies: [
        'Real Build Execution Pipeline V1.1',
        'World2 Real Instantiation V1',
        'UVL Verification Execution V1',
      ],
    });
  }

  const context = {
    productionReadinessScore: input.productionReadinessScore,
    codeGenerationMaturityScore: input.codeGenerationMaturityScore,
  };

  const rankedGaps = [...input.missingEntries].sort(
    (a, b) => scoreGapPriority(b, context) - scoreGapPriority(a, context),
  );

  const activePhases = new Set<string>();
  for (const gap of rankedGaps) {
    const phase = PHASE_BY_CAPABILITY[gap.capability];
    if (phase) activePhases.add(phase);
  }

  const activePriorities: RoadmapPriority[] = [];
  let rank = 1;
  for (const gap of rankedGaps) {
    const phase = PHASE_BY_CAPABILITY[gap.capability];
    if (!phase || !ROADMAP_TEMPLATES[phase]) continue;
    if (activePriorities.some((p) => p.phase === phase)) continue;

    const template = ROADMAP_TEMPLATES[phase];
    activePriorities.push({
      rank,
      phase: template.phase,
      action: template.action,
      rationale: `${template.rationale} Current gap: ${gap.detail}`,
      impact: template.impact,
      dependencies: template.dependencies,
    });
    rank += 1;
  }

  const priorities = [
    ...activePriorities,
    ...completePhases.map((p, index) => ({ ...p, rank: activePriorities.length + index + 1 })),
  ];

  const nextPriority = activePriorities[0]?.phase ?? 'Maintain operational evidence freshness';
  const world2IsNextPhase = nextPriority === 'World2 Real Instantiation';

  return { priorities, world2IsNextPhase, nextPriority };
}
