/**
 * AiDevEngine Capability Audit V3 — canonical inventory (read-only).
 */

import type { CapabilityEntryV2 } from '../capability-audit-v2/capability-audit-types.js';
import {
  CAPABILITY_INVENTORY_V2,
  PRIOR_PASS_TOKENS as V2_PRIOR_PASS_TOKENS,
} from '../capability-audit-v2/index.js';
import { resolveAuthoritativeOwner } from '../canonical-capability-ownership/index.js';
import type {
  AuditCategoryId,
  CapabilityAuditV3Assessment,
  CapabilityEntryV3,
  CategoryAssessment,
} from './capability-audit-types.js';
import { buildCodeGenerationAssessment } from './code-generation-assessment.js';
import { buildOperationalMaturityReport } from './operational-maturity.js';
import { buildProductionReadinessAssessment } from './production-readiness-assessment.js';
import { buildRecommendedRoadmap } from './recommended-roadmap.js';
import { buildMissingCapabilitiesReport } from './missing-capabilities.js';
import { V2_INVENTORY_UPGRADES } from './v2-inventory-upgrades.js';
import { loadLargeScalePipelineIntegrationSnapshot } from '../large-scale-pipeline-integration-v1/index.js';
import { isWorld2RealInstantiationProven } from '../world2-real-instantiation-v1/index.js';

export const AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS_TOKEN =
  'AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS';

export const AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN =
  'AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS';

export const CAPABILITY_AUDIT_V3_REPORT_TITLE = 'AIDEVENGINE_CAPABILITY_AUDIT_V3_REPORT.md';

export const AUDIT_CATEGORIES_V3: readonly AuditCategoryId[] = [
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
  'PRODUCTION_READINESS',
] as const;

export const PRIOR_PASS_TOKENS: readonly string[] = [
  ...V2_PRIOR_PASS_TOKENS,
  'AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS',
  'REAL_BUILD_EXECUTION_PIPELINE_V1_PASS',
  'REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS',
  'UVL_VERIFICATION_EXECUTION_V1_PASS',
] as const;

export const REQUIRED_INVENTORY_V3: readonly string[] = [
  'CQI Maturity V1',
  'UVL Verification Hub V1',
  'AFLA Trust Calibration V1',
  'Founder Review Operator Dashboard V1',
  'Large-Scale Multi-App Validation V1',
  'Product Architect Intelligence V1',
  'Real Build Execution Pipeline V1',
  'Real Build Execution Pipeline V1.1',
  'UVL Verification Execution V1',
  'Canonical Capability Ownership V1',
  'Capability Audit V2',
] as const;

const UPGRADE_BY_NAME = new Map(V2_INVENTORY_UPGRADES.map((u) => [u.name, u.patch]));

function toV3Entry(entry: CapabilityEntryV2): CapabilityEntryV3 {
  const upgrade = UPGRADE_BY_NAME.get(entry.name);
  return {
    name: entry.name,
    category: entry.category as AuditCategoryId,
    status: entry.status,
    maturity: entry.maturity,
    duplicateRisk: entry.duplicateRisk,
    recommendation: entry.recommendation,
    ownerPath: entry.ownerPath,
    validateScript: entry.validateScript,
    summary: entry.summary,
    overlapWith: entry.overlapWith,
    canonicalOwner: entry.canonicalOwner,
    ...upgrade,
  };
}

export const NEW_V3_CAPABILITIES: readonly CapabilityEntryV3[] = [
  {
    name: 'CQI Maturity V1',
    category: 'REQUIREMENT_INTELLIGENCE',
    status: 'MATURE',
    maturity: 91,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/clarifying-question-intelligence/',
    validateScript: 'validate:clarifying-question-intelligence-maturity-v1',
    summary:
      'Domain registry, requirement gap detection, adaptive question generation, coverage matrix; extends Clarifying Question Intelligence.',
    overlapWith: ['Clarifying Question Intelligence', 'Requirement Completeness Intelligence'],
    canonicalOwner: 'Clarifying Question Intelligence',
  },
  {
    name: 'Real Build Execution Pipeline V1',
    category: 'ENGINEERING_REVIEW',
    status: 'MATURE',
    maturity: 92,
    duplicateRisk: 'MEDIUM',
    recommendation: 'KEEP',
    ownerPath: 'src/real-build-execution-pipeline-v1/',
    validateScript: 'validate:real-build-execution-pipeline-v1',
    summary:
      'Real build execution for 15 categories: generation → materialization → build → preview; closes V2 largest operational gap.',
    overlapWith: ['Connected Build Execution', 'Execution Reality Validation', 'Code Generation Engine V1'],
    canonicalOwner: 'Real Build Execution Pipeline V1',
  },
  {
    name: 'Real Build Execution Pipeline V1.1',
    category: 'ENGINEERING_REVIEW',
    status: 'MATURE',
    maturity: 94,
    duplicateRisk: 'MEDIUM',
    recommendation: 'KEEP',
    ownerPath: 'src/real-build-execution-pipeline-v1-1/',
    validateScript: 'validate:real-build-execution-pipeline-v1-1',
    summary:
      'Full 15/15 build/preview/AFLA proof coverage; execution generalization 96/100; UVL Verification Execution V1 provides separate verification proof.',
    overlapWith: ['Real Build Execution Pipeline V1', 'Connected Execution Proof Chain'],
    canonicalOwner: 'Real Build Execution Pipeline V1.1',
  },
  {
    name: 'UVL Verification Execution V1',
    category: 'VERIFICATION_SYSTEMS',
    status: 'MATURE',
    maturity: 93,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/uvl-verification-execution-v1/',
    validateScript: 'validate:uvl-verification-execution-v1',
    summary:
      '15/15 category verification against live preview runtime; 100% verification coverage and 100/100 confidence; closes Capability Audit V3 verification gap.',
    overlapWith: ['UVL Verification Hub V1', 'Unified Verification Lab (UVL)'],
    canonicalOwner: 'Unified Verification Lab (UVL)',
  },
  {
    name: 'Capability Audit V2',
    category: 'SELF_EVOLUTION',
    status: 'MATURE',
    maturity: 88,
    duplicateRisk: 'LOW',
    recommendation: 'KEEP',
    ownerPath: 'src/capability-audit-v2/',
    validateScript: 'validate:capability-audit-v2',
    summary:
      'Prior capability audit baseline; 87 capabilities, 15 categories; identified Real Build Execution as rank-1 gap (now closed).',
  },
];

export const PRODUCTION_READINESS_CAPABILITIES: readonly CapabilityEntryV3[] = [
  {
    name: 'Production Readiness Gate',
    category: 'PRODUCTION_READINESS',
    status: 'MATURE',
    maturity: 88,
    duplicateRisk: 'LOW',
    recommendation: 'EXTEND',
    ownerPath: 'src/production-readiness-gate-v1/',
    validateScript: 'validate:production-readiness-gate-v1',
    summary:
      'Production Readiness Gate V1 evaluates security, reliability, deployment, recovery, and observability before public deployment.',
    overlapWith: ['Launch Readiness Authority', 'Autonomous Founder Launch Authority'],
    canonicalOwner: 'Production Readiness Gate V1',
  },
  {
    name: 'Deployment Readiness',
    category: 'PRODUCTION_READINESS',
    status: 'PARTIAL',
    maturity: 82,
    duplicateRisk: 'MEDIUM',
    recommendation: 'EXTEND',
    ownerPath: 'src/production-readiness-gate-v1/',
    validateScript: 'validate:production-readiness-gate-v1',
    summary: 'Deployment readiness domain scored across 15-category production matrix.',
    overlapWith: ['Production Readiness Gate'],
    canonicalOwner: 'Production Readiness Gate V1',
  },
  {
    name: 'Monitoring',
    category: 'PRODUCTION_READINESS',
    status: 'PARTIAL',
    maturity: 72,
    duplicateRisk: 'LOW',
    recommendation: 'EXTEND',
    ownerPath: 'src/production-readiness-gate-v1/',
    validateScript: 'validate:production-readiness-gate-v1',
    summary: 'Observability readiness domain tracks logging, error reporting, and health indicators.',
  },
  {
    name: 'Rollback',
    category: 'PRODUCTION_READINESS',
    status: 'PARTIAL',
    maturity: 76,
    duplicateRisk: 'LOW',
    recommendation: 'EXTEND',
    ownerPath: 'src/production-readiness-gate-v1/',
    validateScript: 'validate:production-readiness-gate-v1',
    summary: 'Recovery readiness domain validates restart resilience and documents recovery gaps.',
  },
  {
    name: 'Release Approval',
    category: 'PRODUCTION_READINESS',
    status: 'PARTIAL',
    maturity: 72,
    duplicateRisk: 'MEDIUM',
    recommendation: 'EXTEND',
    ownerPath: 'src/autonomous-founder-launch-authority/',
    validateScript: 'validate:autonomous-founder-launch-authority-v1',
    summary: 'AFLA provides launch approval for blueprint suites; production release approval absent.',
    overlapWith: ['Autonomous Founder Launch Authority', 'Launch Council'],
    canonicalOwner: 'Autonomous Founder Launch Authority',
  },
  {
    name: 'Operational Safeguards',
    category: 'PRODUCTION_READINESS',
    status: 'PARTIAL',
    maturity: 58,
    duplicateRisk: 'LOW',
    recommendation: 'EXTEND',
    ownerPath: 'src/execution-readiness-gate/',
    validateScript: 'validate:execution-readiness-gate',
    summary: 'Execution readiness and planning gates provide pre-build safeguards; production ops safeguards missing.',
  },
];

const V2_DERIVED: readonly CapabilityEntryV3[] = CAPABILITY_INVENTORY_V2.map(toV3Entry);

export const CAPABILITY_INVENTORY_V3: readonly CapabilityEntryV3[] = [
  ...V2_DERIVED,
  ...NEW_V3_CAPABILITIES,
  ...PRODUCTION_READINESS_CAPABILITIES,
];

function deriveCategoryStatus(
  avgMaturity: number,
  missingCount: number,
  matureRatio: number,
): CategoryAssessment['status'] {
  if (missingCount > 0 && avgMaturity < 20) return 'MISSING';
  if (avgMaturity >= 85 && matureRatio >= 0.5) return 'MATURE';
  if (avgMaturity >= 55) return 'PARTIAL';
  return 'EXPERIMENTAL';
}

export function buildCategoryAssessments(
  capabilities: readonly CapabilityEntryV3[],
): readonly CategoryAssessment[] {
  return AUDIT_CATEGORIES_V3.map((categoryId) => {
    const entries = capabilities.filter((c) => c.category === categoryId);
    const matureCount = entries.filter((c) => c.status === 'MATURE').length;
    const partialCount = entries.filter((c) => c.status === 'PARTIAL').length;
    const experimentalCount = entries.filter((c) => c.status === 'EXPERIMENTAL').length;
    const missingCount = entries.filter((c) => c.status === 'MISSING').length;
    const maturityScore =
      entries.length > 0
        ? Math.round(entries.reduce((sum, e) => sum + e.maturity, 0) / entries.length)
        : 0;
    const matureRatio = entries.length > 0 ? matureCount / entries.length : 0;

    return {
      categoryId,
      capabilityCount: entries.length,
      maturityScore,
      status: deriveCategoryStatus(maturityScore, missingCount, matureRatio),
      matureCount,
      partialCount,
      experimentalCount,
      missingCount,
    };
  });
}

export function buildCapabilityAuditV3Assessment(projectRootDir?: string): CapabilityAuditV3Assessment {
  const capabilities = CAPABILITY_INVENTORY_V3;
  const matureCount = capabilities.filter((c) => c.status === 'MATURE').length;
  const partialCount = capabilities.filter((c) => c.status === 'PARTIAL').length;
  const experimentalCount = capabilities.filter((c) => c.status === 'EXPERIMENTAL').length;
  const missingCount = capabilities.filter((c) => c.status === 'MISSING').length;
  const highDuplicateRiskCount = capabilities.filter((c) => c.duplicateRisk === 'HIGH').length;
  const categoryAssessments = buildCategoryAssessments(capabilities);
  const operationalMaturity = buildOperationalMaturityReport(projectRootDir);
  const productionReadiness = buildProductionReadinessAssessment(projectRootDir);
  const codeGeneration = buildCodeGenerationAssessment({ projectRootDir });
  const missingCapabilities = buildMissingCapabilitiesReport({
    projectRootDir,
    productionReadinessScore: productionReadiness.productionReadinessScore,
    codeGenerationMaturityScore: codeGeneration.codeGenerationMaturityScore,
  });
  const { nextPriority } = buildRecommendedRoadmap({
    projectRootDir,
    productionReadinessScore: productionReadiness.productionReadinessScore,
    codeGenerationMaturityScore: codeGeneration.codeGenerationMaturityScore,
  });
  const uvlComplete = operationalMaturity.uvlEvidenceRefresh.uvlVerificationExecutionComplete;
  const pipelineIntegration = loadLargeScalePipelineIntegrationSnapshot(projectRootDir);

  const closedGapsSinceV2 = [
    'Real build execution beyond simulation (Real Build Execution Pipeline V1/V1.1 PASS)',
    '15/15 category proof chain: Generated → Built → Previewed → Reviewed → Launch Evaluated',
    'Execution generalization score 96/100 (threshold 85)',
  ];
  if (uvlComplete) {
    closedGapsSinceV2.push(
      'UVL verification execution (UVL Verification Execution V1 PASS: 15/15 verified, 100% coverage, 100/100 confidence)',
    );
  }
  if (pipelineIntegration.integrationComplete) {
    closedGapsSinceV2.push(
      `Large-scale pipeline integration (authoritative build ${pipelineIntegration.assessment.metrics.buildSuccessRate}%, verification ${pipelineIntegration.assessment.metrics.verificationSuccessRate}%)`,
    );
  }
  if (projectRootDir && isWorld2RealInstantiationProven(projectRootDir)) {
    closedGapsSinceV2.push('World2 real filesystem instantiation (World2 Real Instantiation V1 PASS)');
  }

  const world2Gaps = [
    'Dry-run composer bridge sets realExecutionPerformed=false',
    'Real Build Execution proven outside World2 isolation boundary',
    'Phase 7, Phase 15, and Phase 24E–24Y eras still parallel',
  ];
  if (!projectRootDir || !isWorld2RealInstantiationProven(projectRootDir)) {
    world2Gaps.push('World2 execution proof not established — dry-run only');
  }
  world2Gaps.push('Cloud execution path absent');

  const world2Rationale = uvlComplete
    ? `${nextPriority} is the highest-priority gap after UVL Verification Execution V1 closed verification at 15/15. World2 should follow production readiness and canonical ownership registration.`
    : 'UVL Verification Execution is the highest-priority gap — Real Build Execution V1.1 proves build/preview/launch at 100% but UVL verification evidence is incomplete. World2 should follow verification wiring and canonical ownership registration.';

  return {
    version: uvlComplete ? 'V3.1' : 'V3',
    generatedAt: new Date().toISOString(),
    passToken: uvlComplete
      ? AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN
      : AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS_TOKEN,
    readOnly: true,
    priorAuditVersion: 'V2',
    categoryCount: AUDIT_CATEGORIES_V3.length,
    capabilityCount: capabilities.length,
    matureCount,
    partialCount,
    experimentalCount,
    missingCount,
    highDuplicateRiskCount,
    categories: AUDIT_CATEGORIES_V3,
    categoryAssessments,
    capabilities,
    world2Assessment: {
      pipelineName: 'World2 Disposable Workspace Pipeline (24E–24Y)',
      currentMaturity: 64,
      status: 'PARTIAL',
      moduleCount: capabilities.filter((c) => c.category === 'WORLD2').length,
      gaps: world2Gaps,
      shouldBeNextPhase: false,
      nextPhaseRationale: world2Rationale,
      operationalReadiness: 'PARTIAL',
    },
    productionReadiness,
    codeGeneration,
    operationalMaturity,
    priorPassTokensValidated: PRIOR_PASS_TOKENS,
    closedGapsSinceV2,
    highestPriorityGap: missingCapabilities.highestPriorityGap,
    uvlEvidenceRefresh: operationalMaturity.uvlEvidenceRefresh,
  };
}

export { HIGH_DUPLICATE_RISK_REMEDIATIONS } from '../capability-audit-v1/index.js';
