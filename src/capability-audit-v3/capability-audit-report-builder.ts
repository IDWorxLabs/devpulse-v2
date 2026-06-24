/**
 * AiDevEngine Capability Audit V3 — markdown report builder.
 */

import { HIGH_DUPLICATE_RISK_REMEDIATIONS } from '../capability-audit-v1/index.js';
import type {
  CapabilityAuditV3Assessment,
  CapabilityEntryV3,
  DuplicateRiskAnalysis,
  MissingCapabilitiesReport,
  RoadmapPriority,
} from './capability-audit-types.js';
import { buildMaturitySummary } from './maturity-matrix-builder.js';

const CATEGORY_LABELS: Record<string, string> = {
  IDEA_INTAKE: 'Idea Intake',
  REQUIREMENT_INTELLIGENCE: 'Requirement Intelligence',
  PLANNING_INTELLIGENCE: 'Planning Intelligence',
  PRODUCT_ARCHITECT_INTELLIGENCE: 'Product Architect Intelligence',
  CODE_GENERATION: 'Code Generation',
  BLUEPRINT_SYSTEMS: 'Blueprint Systems',
  FEATURE_VALIDATION: 'Feature Validation',
  ENGINEERING_REVIEW: 'Engineering Review',
  VERIFICATION_SYSTEMS: 'Verification Systems',
  FOUNDER_REVIEW: 'Founder Review',
  LAUNCH_READINESS: 'Launch Readiness',
  SELF_EVOLUTION: 'Self-Evolution',
  MULTI_PROJECT_EXECUTION: 'Multi-Project Execution',
  WORLD2: 'World2',
  OPERATOR_SYSTEMS: 'Operator Systems',
  PRODUCTION_READINESS: 'Production Readiness',
};

function formatCapabilityRow(entry: CapabilityEntryV3): string {
  const overlap =
    entry.overlapWith && entry.overlapWith.length > 0 ? entry.overlapWith.join(', ') : '—';
  const owner = entry.canonicalOwner ?? '—';
  return `| ${entry.name} | ${entry.status} | ${entry.maturity} | ${entry.duplicateRisk} | ${entry.recommendation} | \`${entry.ownerPath}\` | ${owner} | ${overlap} |`;
}

function buildCategorySection(
  categoryId: string,
  capabilities: readonly CapabilityEntryV3[],
): string {
  const label = CATEGORY_LABELS[categoryId] ?? categoryId;
  const categoryCaps = capabilities.filter((c) => c.category === categoryId);
  const mature = categoryCaps.filter((c) => c.status === 'MATURE').length;
  const partial = categoryCaps.filter((c) => c.status === 'PARTIAL').length;
  const experimental = categoryCaps.filter((c) => c.status === 'EXPERIMENTAL').length;

  const lines: string[] = [
    `## ${label}`,
    '',
    `**Capabilities:** ${categoryCaps.length} · **Mature:** ${mature} · **Partial:** ${partial} · **Experimental:** ${experimental}`,
    '',
    '| Capability | Status | Maturity | Duplicate Risk | Recommendation | Owner Path | Canonical Owner | Overlap With |',
    '|------------|--------|----------|----------------|----------------|------------|-----------------|--------------|',
  ];

  for (const entry of categoryCaps) {
    lines.push(formatCapabilityRow(entry));
  }

  lines.push('');
  return lines.join('\n');
}

export function buildCapabilityAuditV3ReportMarkdown(input: {
  assessment: CapabilityAuditV3Assessment;
  duplicateRisk: DuplicateRiskAnalysis;
  missingCapabilities: MissingCapabilitiesReport;
  roadmap: readonly RoadmapPriority[];
}): string {
  const { assessment, duplicateRisk, missingCapabilities, roadmap } = input;
  const maturitySummary = buildMaturitySummary(assessment);
  const w2 = assessment.world2Assessment;
  const ops = assessment.operationalMaturity;
  const prod = assessment.productionReadiness;
  const codegen = assessment.codeGeneration;
  const activeRoadmap = roadmap.filter((p) => p.action !== 'COMPLETE');
  const uvlComplete = ops.uvlEvidenceRefresh.uvlVerificationExecutionComplete;
  const coverage = ops.coverageEvidence;
  const uvlRefresh = ops.uvlEvidenceRefresh;

  const lines: string[] = [
    '# AiDevEngine Capability Audit Report V3',
    '',
    uvlComplete
      ? '**Phase Next — Capability Audit Refresh V3.1 (UVL Evidence Refresh)**'
      : '**Phase Next — Capability Audit Refresh V3**',
    `**Generated:** ${assessment.generatedAt.slice(0, 10)}`,
    uvlComplete
      ? '**Scope:** Re-assessment after UVL Verification Execution V1 PASS — consumes `.uvl-verification-execution-v1/` evidence'
      : '**Scope:** Full re-assessment after Real Build Execution Pipeline V1 and V1.1',
    '**Method:** V2 inventory refresh, RBEP V1.1 build/preview proof, UVL Verification Execution V1 verification proof, operational maturity scoring, fresh roadmap recalculation',
    '',
    `**Pass token:** \`${assessment.passToken}\``,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    uvlComplete
      ? 'Since Capability Audit V3, AiDevEngine closed the **verification gap**: UVL Verification Execution V1 now proves **15/15 categories verified** with **100% verification coverage** and **100/100 verification confidence** against live preview runtime evidence. Real Build Execution Pipeline V1.1 continues to prove **15/15 build/preview/AFLA** coverage.'
      : 'Since Capability Audit V2, AiDevEngine closed its **largest operational gap**: Real Build Execution Pipeline V1 and V1.1 now prove **15/15 categories** through Generated → Built → Previewed → Reviewed → Launch Evaluated with **100% proof coverage** and **96/100 execution generalization**.',
    '',
    `The refreshed audit catalogues **${assessment.capabilityCount} capabilities** across **${assessment.categoryCount} categories** with an overall average maturity of **${maturitySummary.overallAvgMaturity}**.`,
    '',
    '| Metric | V2 Baseline | V3 Current |',
    '|--------|-------------|------------|',
    '| Categories | 15 | ' + assessment.categoryCount + ' |',
    '| Capabilities | 87 | ' + assessment.capabilityCount + ' |',
    '| Mature | 28 | ' + assessment.matureCount + ' |',
    '| Partial | 54 | ' + assessment.partialCount + ' |',
    '| High duplicate risk | 11 | ' + assessment.highDuplicateRiskCount + ' |',
    '| Operational Maturity Score | — | ' + ops.operationalMaturityScore + ' |',
    '| Production Readiness Score | — | ' + prod.productionReadinessScore + ' |',
    '| Code Generation Maturity | — | ' + codegen.codeGenerationMaturityScore + ' |',
    '',
    '### Coverage Breakdown (Evidence-Driven)',
    '',
    `| Layer | Coverage | Source |`,
    `|-------|----------|--------|`,
    `| Build | ${coverage.buildCoverage.count}/${coverage.buildCoverage.required} (${coverage.buildCoverage.percent}%) | ${coverage.buildCoverage.source} |`,
    `| Preview | ${coverage.previewCoverage.count}/${coverage.previewCoverage.required} (${coverage.previewCoverage.percent}%) | ${coverage.previewCoverage.source} |`,
    `| Verification | ${coverage.verificationCoverage.count}/${coverage.verificationCoverage.required} (${coverage.verificationCoverage.percent}%) | ${coverage.verificationCoverage.source} |`,
    `| AFLA Review | ${coverage.aflaReviewCoverage.count}/${coverage.aflaReviewCoverage.required} (${coverage.aflaReviewCoverage.percent}%) | ${coverage.aflaReviewCoverage.source} |`,
    '',
    '### Prior Phase Pass Tokens (Validated Baseline)',
    '',
    ...assessment.priorPassTokensValidated.map((token) => `- \`${token}\``),
    '',
    '### Gaps Closed Since V2',
    '',
    ...assessment.closedGapsSinceV2.map((gap) => `- ${gap}`),
    '',
    '### Key Findings',
    '',
    '1. **Real Build Execution is proven** — V1/V1.1 PASS closes the V2 rank-1 gap; build/preview/launch at 100% for 15 categories.',
    uvlComplete
      ? '2. **UVL Verification Execution is proven** — UVL Verification Execution V1 PASS: verifiedCount 15/15, verification coverage 100%, confidence 100/100.'
      : '2. **Verification remains the blocking gap** — UVL Verification Execution V1 evidence incomplete; RBEP build/preview proof does not substitute for UVL verification proof.',
    uvlComplete
      ? `3. **${activeRoadmap[0]?.phase ?? 'Production Readiness Gate'} is the new highest-priority gap** — recalculated from current maturity and gap evidence after UVL verification closed.`
      : '3. **World2 should NOT be the next phase** — UVL Verification Execution must complete before World2 real instantiation.',
    '4. **Production Readiness is largely absent** — score 33/100; no production gate, monitoring, or deployment path.',
    '5. **Code generation remains CRUD-limited** — 5 profiles proven; complex workflows and domain-specific apps not yet supported.',
    '6. **One Capability = One Canonical Owner** holds for CQI, UVL, AFLA, PAI, and World2 domains.',
    '',
    '---',
    '',
    '## Updated Capability Inventory',
    '',
    '| Capability | Category | Status | Maturity | Validate Script |',
    '|------------|----------|--------|----------|-----------------|',
    '| CQI Maturity V1 | Requirement Intelligence | MATURE | 91 | validate:clarifying-question-intelligence-maturity-v1 |',
    '| UVL Verification Hub V1 | Verification Systems | PARTIAL | 82 | validate:uvl-maturity-verification-hub-v1 |',
    '| UVL Verification Execution V1 | Verification Systems | MATURE | 93 | validate:uvl-verification-execution-v1 |',
    '| AFLA Trust Calibration V1 | Launch Readiness | MATURE | 88 | validate:afla-trust-calibration-v1 |',
    '| Large-Scale Multi-App Validation V1 | Verification Systems | PARTIAL | 74 | validate:large-scale-multi-app-validation-v1 |',
    '| Founder Review Operator Dashboard V1 | Operator Systems | MATURE | 87 | validate:founder-review-operator-dashboard-v1 |',
    '| Product Architect Intelligence V1 | Product Architect Intelligence | MATURE | 91 | validate:product-architect-intelligence-v1 |',
    '| Real Build Execution Pipeline V1 | Engineering Review | MATURE | 92 | validate:real-build-execution-pipeline-v1 |',
    '| Real Build Execution Pipeline V1.1 | Engineering Review | MATURE | 94 | validate:real-build-execution-pipeline-v1-1 |',
    '| Canonical Capability Ownership V1 | Self-Evolution | MATURE | 90 | validate:canonical-capability-ownership-v1 |',
    '| Capability Audit V2 | Self-Evolution | MATURE | 88 | validate:capability-audit-v2 |',
    '',
    '---',
    '',
    '## Capability Inventory',
    '',
  ];

  for (const categoryId of assessment.categories) {
    lines.push(buildCategorySection(categoryId, assessment.capabilities));
  }

  lines.push(
    '---',
    '',
    '## Category Assessment',
    '',
    '| Category | Capability Count | Maturity Score | Status |',
    '|----------|------------------|----------------|--------|',
  );

  for (const cat of assessment.categoryAssessments) {
    const label = CATEGORY_LABELS[cat.categoryId] ?? cat.categoryId;
    lines.push(
      `| ${label} | ${cat.capabilityCount} | ${cat.maturityScore} | ${cat.status} |`,
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## Operational Reality Assessment',
    '',
    `**Operational Maturity Score:** ${ops.operationalMaturityScore}/100`,
    '',
    `**Proven categories:** ${ops.provenCategoryCount}/${ops.supportedCategoryCount} supported`,
    `**Execution generalization:** ${ops.executionGeneralizationScore}/100`,
    `**Build coverage:** ${coverage.buildCoverage.count}/${coverage.buildCoverage.required} (${coverage.buildCoverage.percent}%)`,
    `**Preview coverage:** ${coverage.previewCoverage.count}/${coverage.previewCoverage.required} (${coverage.previewCoverage.percent}%)`,
    `**Verification coverage:** ${coverage.verificationCoverage.count}/${coverage.verificationCoverage.required} (${coverage.verificationCoverage.percent}%) — source: ${coverage.verificationCoverage.source}`,
    `**AFLA review coverage:** ${coverage.aflaReviewCoverage.count}/${coverage.aflaReviewCoverage.required} (${coverage.aflaReviewCoverage.percent}%)`,
    '',
    '| Pipeline Stage | Proven | Success Rate | Status | Evidence |',
    '|----------------|--------|--------------|--------|----------|',
  );

  for (const stage of ops.pipelineStages) {
    lines.push(
      `| ${stage.stage} | ${stage.provenInSuite ? '✓' : '✗'} | ${stage.successRatePercent}% | ${stage.status} | ${stage.evidence.slice(0, 80)}… |`,
    );
  }

  lines.push(
    '',
    `**Full pipeline proven across suite:** ${ops.fullPipelineProvenAcrossSuite ? 'YES' : 'NO'}${uvlComplete ? '' : ' (verification blocks completion)'}`,
    '',
    '---',
    '',
    '## Duplicate Risk Analysis V3',
    '',
    `**Duplicate Risk Count:** ${duplicateRisk.duplicateRiskCount} (HIGH: ${duplicateRisk.highDuplicateRiskCount}, MEDIUM: ${duplicateRisk.mediumDuplicateRiskCount})`,
    '',
    `**One Capability = One Canonical Owner:** ${duplicateRisk.oneCapabilityOneOwnerValid ? 'VALID' : 'INVALID'}`,
    '',
    '### Authority Ownership Validation',
    '',
    '| Domain | Expected Owner | Valid | Detail |',
    '|--------|----------------|-------|--------|',
  );

  for (const check of duplicateRisk.authorityOwnershipChecks) {
    lines.push(
      `| ${check.domain} | ${check.expectedOwner} | ${check.valid ? '✓' : '✗'} | ${check.detail} |`,
    );
  }

  lines.push('', '### New Overlaps Since V2', '');
  for (const overlap of duplicateRisk.newOverlapsSinceV2) {
    lines.push(`- ${overlap}`);
  }

  lines.push(
    '',
    '---',
    '',
    '## High Duplicate-Risk Remediation Decisions',
    '',
    '| Capability | Decision | Target | Rationale |',
    '|------------|----------|--------|-----------|',
  );

  for (const remediation of HIGH_DUPLICATE_RISK_REMEDIATIONS) {
    const target = remediation.target ?? '—';
    const rationale = remediation.rationale.replace(/\|/g, '\\|');
    lines.push(
      `| ${remediation.capabilityName} | ${remediation.decision} | ${target} | ${rationale} |`,
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## Production Readiness Assessment',
    '',
    `**Production Readiness Score:** ${prod.productionReadinessScore}/100 (${prod.status})`,
    '',
    '| Dimension | Maturity | Status | Detail |',
    '|-----------|----------|--------|--------|',
  );

  for (const dim of prod.dimensions) {
    lines.push(`| ${dim.dimension} | ${dim.maturity} | ${dim.status} | ${dim.detail} |`);
  }

  lines.push(
    '',
    '---',
    '',
    '## General-Purpose Code Generation Assessment',
    '',
    `**Code Generation Maturity Score:** ${codegen.codeGenerationMaturityScore}/100 (${codegen.status})`,
    '',
    `**CRUD profiles:** ${codegen.crudProfileCount}`,
    `**Complex workflows:** ${codegen.supportsComplexWorkflows ? 'YES' : 'NO'}`,
    `**Multi-role systems:** ${codegen.supportsMultiRoleSystems ? 'YES' : 'NO'}`,
    `**Advanced business logic:** ${codegen.supportsAdvancedBusinessLogic ? 'YES' : 'NO'}`,
    `**Domain-specific applications:** ${codegen.supportsDomainSpecificApps ? 'YES' : 'NO'}`,
    '',
    codegen.detail,
    '',
    '---',
    '',
    '## World2 Assessment',
    '',
    `**Pipeline:** ${w2.pipelineName}`,
    `**Current Maturity:** ${w2.currentMaturity} (${w2.status})`,
    `**Module Count:** ${w2.moduleCount}`,
    `**Operational Readiness:** ${w2.operationalReadiness}`,
    `**Should World2 be next phase?** ${w2.shouldBeNextPhase ? 'YES' : 'NO'}`,
    '',
    '**Rationale:** ' + w2.nextPhaseRationale,
    '',
    '### Remaining Gaps',
    '',
    ...w2.gaps.map((gap) => `- ${gap}`),
    '',
    '---',
    '',
    '## Missing Capability Report',
    '',
    '### Highest-Priority Gap',
    '',
    `**${missingCapabilities.highestPriorityGap}**`,
    '',
    '### What is still missing (BLOCKING)?',
    '',
    ...missingCapabilities.blockingVision.map((item) => `- **BLOCKING:** ${item}`),
    '',
    '### What remains weak?',
    '',
    ...missingCapabilities.stillWeak.map((item) => `- ${item}`),
    '',
    '---',
    '',
    '## Recommended Roadmap V3',
    '',
    uvlComplete
      ? '*Fresh roadmap from V3.1 evidence — Real Build Execution and UVL Verification Execution are COMPLETE; priorities recalculated.*'
      : '*Fresh roadmap from V3 evidence — Real Build Execution is COMPLETE; UVL Verification Execution is rank 1.*',
    '',
    '| Rank | Phase | Action | Impact | Rationale |',
    '|------|-------|--------|--------|-----------|',
  );

  for (const priority of activeRoadmap) {
    const rationale = priority.rationale.replace(/\|/g, '\\|').slice(0, 120) + '…';
    lines.push(
      `| ${priority.rank} | ${priority.phase} | ${priority.action} | ${priority.impact} | ${rationale} |`,
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## Validation Evidence',
    '',
    '| System | Artifact | Status |',
    '|--------|----------|--------|',
    '| Real Build Execution V1.1 | `.real-build-execution-pipeline-v1-1/proof-coverage.json` | 15/15 build/preview/AFLA proof |',
    '| Real Build Execution V1.1 | `.real-build-execution-pipeline-v1-1/generalization-score.json` | 96/100 generalization |',
    `| UVL Verification Execution V1 | \`.uvl-verification-execution-v1/verification-coverage.json\` | ${uvlRefresh.verifiedCount}/${uvlRefresh.categoriesRequired} verified, ${uvlRefresh.verificationCoveragePercent}% coverage |`,
    `| UVL Verification Execution V1 | \`.uvl-verification-execution-v1/verification-confidence.json\` | ${uvlRefresh.verificationConfidenceScore}/100 confidence, ${uvlRefresh.verificationProofStatus} |`,
    '| Autonomous Founder Launch Authority | `.autonomous-founder-launch-authority/suite-summary.json` | LAUNCH_READY (5/5) |',
    '| UVL Verification Hub V1 | `.unified-verification-lab-v1/assessment.json` | maturity hub (operational proof from UVL Execution V1) |',
    '| Large-Scale Multi-App Validation | `.large-scale-multi-app-validation/assessment.json` | Gen 100%, build 0% in harness |',
    '| Capability Audit V2 | `.capability-audit-v2/assessment.json` | Prior baseline |',
    '',
    '---',
    '',
    '## Audit Answers',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    '| Is UVL Verification Execution still missing? | ' + (uvlComplete ? 'No' : 'Yes') + ' |',
    '| Verified Count | ' + `${uvlRefresh.verifiedCount}/${uvlRefresh.categoriesRequired}` + ' |',
    '| Verification Coverage | ' + `${uvlRefresh.verificationCoveragePercent}%` + ' |',
    '| Verification Confidence | ' + `${uvlRefresh.verificationConfidenceScore}/100` + ' |',
    `| What capabilities exist? | ${assessment.capabilityCount} across ${assessment.categoryCount} categories |`,
    `| What capabilities are mature? | ${assessment.matureCount} MATURE |`,
    `| What capabilities are incomplete? | ${assessment.partialCount} PARTIAL, ${assessment.experimentalCount} EXPERIMENTAL, ${assessment.missingCount} MISSING |`,
    `| What capabilities overlap? | ${duplicateRisk.duplicateRiskCount} with duplicate risk; ${duplicateRisk.newOverlapsSinceV2.length} new since V2 |`,
    `| Highest-priority remaining gap? | ${assessment.highestPriorityGap} |`,
    `| What should AiDevEngine build next? | ${activeRoadmap[0]?.phase ?? 'Production Readiness Gate'} |`,
    '',
    '---',
    '',
    `**Pass token:** \`${assessment.passToken}\``,
    '',
  );

  return lines.join('\n');
}
