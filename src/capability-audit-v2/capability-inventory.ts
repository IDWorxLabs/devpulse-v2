/**
 * AiDevEngine Capability Audit V2 — canonical inventory (read-only).
 */

import type { CapabilityStatus } from '../capability-audit-v1/capability-audit-types.js';
import {
  CAPABILITY_INVENTORY as V1_INVENTORY,
  HIGH_DUPLICATE_RISK_REMEDIATIONS,
} from '../capability-audit-v1/index.js';
import { resolveAuthoritativeOwner } from '../canonical-capability-ownership/index.js';
import type {
  AuditCategoryId,
  CapabilityAuditV2Assessment,
  CapabilityEntryV2,
  CapabilityMaturityStatus,
} from './capability-audit-types.js';
import { remapV1Category } from './v1-category-remap.js';

export const AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN =
  'AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS';

export const CAPABILITY_AUDIT_V2_REPORT_TITLE = 'AIDEVENGINE_CAPABILITY_AUDIT_V2_REPORT.md';

export const AUDIT_CATEGORIES_V2: readonly AuditCategoryId[] = [
  'IDEA_INTAKE',
  'REQUIREMENT_INTELLIGENCE',
  'PLANNING_INTELLIGENCE',
  'PRODUCT_ARCHITECT_INTELLIGENCE',
  'CODE_GENERATION',
  'BLUEPRINT_SYSTEMS',
  'FEATURE_VALIDATION',
  'ENGINEERING_REVIEW',
  'VERIFICATION_SYSTEMS',
  'FOUNDER_REVIEW',
  'LAUNCH_READINESS',
  'SELF_EVOLUTION',
  'MULTI_PROJECT_EXECUTION',
  'WORLD2',
  'OPERATOR_SYSTEMS',
] as const;

export const PRIOR_PASS_TOKENS: readonly string[] = [
  'AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS',
  'CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS',
  'CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS',
  'UVL_MATURITY_VERIFICATION_HUB_V1_PASS',
  'AFLA_TRUST_CALIBRATION_V1_PASS',
  'LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS',
  'PRODUCT_ARCHITECT_INTELLIGENCE_V1_PASS',
] as const;

function mapV1Status(status: CapabilityStatus, maturity: number): CapabilityMaturityStatus {
  if (status === 'NOT_PRESENT') return 'MISSING';
  if (status === 'MATURE') return 'MATURE';
  if (status === 'PARTIAL') return maturity >= 50 ? 'PARTIAL' : 'EXPERIMENTAL';
  if (status === 'IMPLEMENTED') {
    if (maturity >= 88) return 'MATURE';
    if (maturity >= 65) return 'PARTIAL';
    return 'EXPERIMENTAL';
  }
  return 'PARTIAL';
}

function toV2Entry(
  entry: (typeof V1_INVENTORY)[number],
  categoryOverride?: AuditCategoryId,
): CapabilityEntryV2 {
  const category = categoryOverride ?? remapV1Category(entry.name, entry.category);
  return {
    name: entry.name,
    category,
    status: mapV1Status(entry.status, entry.maturity),
    maturity: entry.maturity,
    duplicateRisk: entry.duplicateRisk,
    recommendation: entry.recommendation,
    ownerPath: entry.ownerPath,
    validateScript: entry.validateScript,
    summary: entry.summary,
    overlapWith: entry.overlapWith,
    canonicalOwner: resolveAuthoritativeOwner(entry.name),
  };
}

const V1_EXCLUDED_FROM_V2 = new Set([
  'World2 Execution Engine',
  'World2 Disposable Workspace Pipeline (24E–24Y)',
]);

export const V1_DERIVED_INVENTORY: readonly CapabilityEntryV2[] = V1_INVENTORY.filter(
  (entry) => !V1_EXCLUDED_FROM_V2.has(entry.name),
).map((entry) => toV2Entry(entry));

export const NEW_V2_CAPABILITIES: readonly CapabilityEntryV2[] = [
  {
    name: 'Product Architect Intelligence V1',
    category: 'PRODUCT_ARCHITECT_INTELLIGENCE',
    status: 'MATURE',
    maturity: 91,
    duplicateRisk: 'MEDIUM',
    recommendation: 'KEEP',
    ownerPath: 'src/product-architect-intelligence-v1/',
    validateScript: 'validate:product-architect-intelligence-v1',
    summary:
      'Product completeness scoring: missing screens, workflow gaps, user journeys, gap reports; integrates CQI/UVL/AFLA/large-scale.',
    overlapWith: ['Product Architect', 'Workflow Review', 'Product Experience Verification Engine'],
    canonicalOwner: 'Product Architect Intelligence V1',
  },
  {
    name: 'UVL Verification Hub V1',
    category: 'VERIFICATION_SYSTEMS',
    status: 'PARTIAL',
    maturity: 72,
    duplicateRisk: 'MEDIUM',
    recommendation: 'EXTEND',
    ownerPath: 'src/unified-verification-lab/',
    validateScript: 'validate:uvl-maturity-verification-hub-v1',
    summary:
      'UVL maturity hub: coverage assessment, gap detection, confidence scoring; module mature but operational coverage ~6%.',
    overlapWith: ['Unified Verification Lab (UVL)', 'Verification Orchestrator'],
    canonicalOwner: 'Unified Verification Lab (UVL)',
  },
  {
    name: 'AFLA Trust Calibration V1',
    category: 'LAUNCH_READINESS',
    status: 'MATURE',
    maturity: 88,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/afla-trust-calibration-v1/',
    validateScript: 'validate:afla-trust-calibration-v1',
    summary:
      'Trust calibration for AFLA: false positive/negative detection, verdict stability, reviewer alignment, trust score.',
    overlapWith: ['Autonomous Founder Launch Authority'],
    canonicalOwner: 'Autonomous Founder Launch Authority',
  },
  {
    name: 'Large-Scale Multi-App Validation V1',
    category: 'VERIFICATION_SYSTEMS',
    status: 'PARTIAL',
    maturity: 70,
    duplicateRisk: 'LOW',
    recommendation: 'EXTEND',
    ownerPath: 'src/large-scale-multi-app-validation-v1/',
    validateScript: 'validate:large-scale-multi-app-validation-v1',
    summary:
      '58-category multi-app validation harness; generalization score 83 but downstream build/blueprint pipeline 0% success.',
    overlapWith: ['Feature Reality Validation', 'Engineering Reality Authority'],
  },
  {
    name: 'Founder Review Operator Dashboard V1',
    category: 'OPERATOR_SYSTEMS',
    status: 'MATURE',
    maturity: 87,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/founder-review-operator-dashboard/',
    validateScript: 'validate:founder-review-operator-dashboard-v1',
    summary:
      'Founder Reality operator dashboard: founder review panel, AFLA cache integration, planning/execution/verification views.',
    overlapWith: ['Command Center Brain', 'Inline Operator Feed'],
  },
  {
    name: 'Canonical Capability Ownership V1',
    category: 'SELF_EVOLUTION',
    status: 'MATURE',
    maturity: 90,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/canonical-capability-ownership/',
    validateScript: 'validate:canonical-capability-ownership-v1',
    summary:
      'One capability = one canonical owner; 5/5 consolidation groups complete; meta-governance for duplicate prevention.',
  },
  {
    name: 'Founder Reality Surface',
    category: 'OPERATOR_SYSTEMS',
    status: 'MATURE',
    maturity: 86,
    duplicateRisk: 'MEDIUM',
    recommendation: 'KEEP',
    ownerPath: 'public/founder-reality/',
    validateScript: 'validate:founder-reality-surface',
    summary:
      'Unified operator UI hosting verification hub, product architect, trust calibration, large-scale validation panels.',
    overlapWith: ['Founder Review Operator Dashboard V1', 'Command Center Brain'],
  },
];

export const WORLD2_MODULE_CAPABILITIES: readonly CapabilityEntryV2[] = [
  {
    name: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    category: 'WORLD2',
    status: 'PARTIAL',
    maturity: 68,
    duplicateRisk: 'HIGH',
    recommendation: 'EXTEND',
    ownerPath: 'src/world2-disposable-workspace/',
    validateScript: 'validate:world2-disposable-workspace',
    summary: 'Canonical World2 disposable workspace orchestration; registered in ownership registry.',
    overlapWith: ['World2 Execution Engine', 'World2 Controlled Execution Runtime'],
    canonicalOwner: 'World2 Disposable Workspace Pipeline (24E–24Y)',
  },
  {
    name: 'World2 Execution Engine',
    category: 'WORLD2',
    status: 'PARTIAL',
    maturity: 58,
    duplicateRisk: 'HIGH',
    recommendation: 'MERGE',
    ownerPath: 'src/world2-execution-engine/',
    validateScript: 'validate:world2-execution-engine',
    summary: 'Execution modes, queue, scope boundaries; merged into disposable pipeline per ownership registry.',
    overlapWith: ['World2 Disposable Workspace Pipeline (24E–24Y)'],
    canonicalOwner: 'World2 Disposable Workspace Pipeline (24E–24Y)',
  },
  {
    name: 'World2 Workspace Foundation',
    category: 'WORLD2',
    status: 'PARTIAL',
    maturity: 72,
    duplicateRisk: 'MEDIUM',
    recommendation: 'KEEP',
    ownerPath: 'src/world2-workspace-foundation/',
    validateScript: 'validate:world2-workspace-foundation',
    summary: 'Workspace isolation, identity, governance bridge for World2.',
  },
  {
    name: 'World2 Execution Planner',
    category: 'WORLD2',
    status: 'PARTIAL',
    maturity: 70,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/world2-execution-planner/',
    validateScript: 'validate:world2-execution-planner',
    summary: 'Execution plan generation from workspace state.',
  },
  {
    name: 'World2 Simulation Runtime',
    category: 'WORLD2',
    status: 'PARTIAL',
    maturity: 68,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/world2-simulation-runtime/',
    validateScript: 'validate:world2-simulation-runtime',
    summary: 'Pre-execution stage simulation; simulation-first boundary.',
  },
  {
    name: 'World2 Dry Run Execution Composer',
    category: 'WORLD2',
    status: 'PARTIAL',
    maturity: 66,
    duplicateRisk: 'MEDIUM',
    recommendation: 'EXTEND',
    ownerPath: 'src/world2-dry-run-execution-composer/',
    validateScript: 'validate:world2-dry-run-execution-composer',
    summary: 'Compose dry-run execution packages; bridge to real execution not yet closed.',
    overlapWith: ['World2 Dry Run Execution Verifier'],
  },
  {
    name: 'World2 Controlled Execution Runtime',
    category: 'WORLD2',
    status: 'EXPERIMENTAL',
    maturity: 52,
    duplicateRisk: 'HIGH',
    recommendation: 'MERGE',
    ownerPath: 'src/world2-controlled-execution-runtime/',
    validateScript: 'validate:world2-controlled-execution-runtime',
    summary: 'Phase 24 controlled execution; overlaps Phase 15 chain and disposable pipeline.',
    overlapWith: ['World2 Builder Packet Execution', 'World2 Controlled Apply Runtime'],
    canonicalOwner: 'World2 Disposable Workspace Pipeline (24E–24Y)',
  },
  {
    name: 'World2 Completion Runtime',
    category: 'WORLD2',
    status: 'EXPERIMENTAL',
    maturity: 55,
    duplicateRisk: 'MEDIUM',
    recommendation: 'EXTEND',
    ownerPath: 'src/world2-completion-runtime/',
    validateScript: 'validate:world2-completion-runtime',
    summary: 'Phase 15.6 completion criteria; not wired to real build outcomes.',
  },
  {
    name: 'World2 Learning Loop',
    category: 'WORLD2',
    status: 'EXPERIMENTAL',
    maturity: 48,
    duplicateRisk: 'LOW',
    recommendation: 'EXTEND',
    ownerPath: 'src/world2-learning-loop/',
    validateScript: 'validate:world2-learning-loop',
    summary: 'Failure/success pattern learning from verification; advisory only.',
  },
];

export const CAPABILITY_INVENTORY_V2: readonly CapabilityEntryV2[] = [
  ...V1_DERIVED_INVENTORY,
  ...NEW_V2_CAPABILITIES,
  ...WORLD2_MODULE_CAPABILITIES,
];

export function buildCapabilityAuditV2Assessment(): CapabilityAuditV2Assessment {
  const matureCount = CAPABILITY_INVENTORY_V2.filter((c) => c.status === 'MATURE').length;
  const partialCount = CAPABILITY_INVENTORY_V2.filter((c) => c.status === 'PARTIAL').length;
  const experimentalCount = CAPABILITY_INVENTORY_V2.filter((c) => c.status === 'EXPERIMENTAL').length;
  const missingCount = CAPABILITY_INVENTORY_V2.filter((c) => c.status === 'MISSING').length;
  const highDuplicateRiskCount = CAPABILITY_INVENTORY_V2.filter(
    (c) => c.duplicateRisk === 'HIGH',
  ).length;

  return {
    version: 'V2',
    generatedAt: new Date().toISOString(),
    passToken: AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN,
    readOnly: true,
    priorAuditVersion: 'V1',
    categoryCount: AUDIT_CATEGORIES_V2.length,
    capabilityCount: CAPABILITY_INVENTORY_V2.length,
    matureCount,
    partialCount,
    experimentalCount,
    missingCount,
    highDuplicateRiskCount,
    categories: AUDIT_CATEGORIES_V2,
    capabilities: CAPABILITY_INVENTORY_V2,
    world2Assessment: {
      pipelineName: 'World2 Disposable Workspace Pipeline (24E–24Y)',
      currentMaturity: 62,
      status: 'PARTIAL',
      moduleCount: WORLD2_MODULE_CAPABILITIES.length,
      gaps: [
        'Real filesystem instantiation not closed end-to-end',
        'Phase 7, Phase 15, and Phase 24E–24Y eras still parallel',
        'Dry-run composer does not activate real build execution',
        'Large-scale validation shows 0% downstream build success',
        'Cloud execution path absent',
      ],
      shouldBeNextPhase: false,
      nextPhaseRationale:
        'Real Build Execution Pipeline must precede World2 Maturity — World2 modules validate in isolation but cannot deliver production builds without connected execution.',
    },
    priorPassTokensValidated: PRIOR_PASS_TOKENS,
  };
}

export { HIGH_DUPLICATE_RISK_REMEDIATIONS };
