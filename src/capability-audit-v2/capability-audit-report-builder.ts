/**
 * AiDevEngine Capability Audit V2 — markdown report builder.
 */

import { HIGH_DUPLICATE_RISK_REMEDIATIONS } from '../capability-audit-v1/index.js';
import type { CapabilityAuditV2Assessment, CapabilityEntryV2 } from './capability-audit-types.js';
import { AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN } from './capability-inventory.js';
import type { DuplicateRiskAnalysis } from './capability-audit-types.js';
import type { MissingCapabilitiesReport } from './capability-audit-types.js';
import type { RoadmapPriority } from './capability-audit-types.js';
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
};

function formatCapabilityRow(entry: CapabilityEntryV2): string {
  const overlap =
    entry.overlapWith && entry.overlapWith.length > 0 ? entry.overlapWith.join(', ') : '—';
  const owner = entry.canonicalOwner ?? '—';
  return `| ${entry.name} | ${entry.status} | ${entry.maturity} | ${entry.duplicateRisk} | ${entry.recommendation} | \`${entry.ownerPath}\` | ${owner} | ${overlap} |`;
}

function buildCategorySection(
  categoryId: string,
  capabilities: readonly CapabilityEntryV2[],
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

export function buildCapabilityAuditV2ReportMarkdown(input: {
  assessment: CapabilityAuditV2Assessment;
  duplicateRisk: DuplicateRiskAnalysis;
  missingCapabilities: MissingCapabilitiesReport;
  roadmap: readonly RoadmapPriority[];
}): string {
  const { assessment, duplicateRisk, missingCapabilities, roadmap } = input;
  const maturitySummary = buildMaturitySummary(assessment);
  const w2 = assessment.world2Assessment;

  const lines: string[] = [
    '# AiDevEngine Capability Audit Report V2',
    '',
    '**Phase Next — Capability Audit Refresh V2**',
    `**Generated:** ${assessment.generatedAt.slice(0, 10)}`,
    '**Scope:** Full re-assessment of AiDevEngine capabilities against current codebase and architecture',
    '**Method:** V1 inventory refresh, new V1 module integration, canonical ownership cross-reference, operational artifact analysis, duplicate risk recalculation, evidence-based roadmap',
    '',
    `**Pass token:** \`${AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN}\``,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `Since Capability Audit V1, AiDevEngine gained **six major new capabilities** (Product Architect Intelligence, UVL Verification Hub, AFLA Trust Calibration, Large-Scale Multi-App Validation, Founder Review Operator Dashboard, Canonical Capability Ownership) plus a **27-module World2 pipeline**.`,
    '',
    `The refreshed audit catalogues **${assessment.capabilityCount} capabilities** across **${assessment.categoryCount} categories** with an overall average maturity of **${maturitySummary.overallAvgMaturity}**.`,
    '',
    '| Metric | V1 Baseline | V2 Current |',
    '|--------|-------------|------------|',
    '| Categories | 12 | 15 |',
    '| Capabilities | 73 | ' + assessment.capabilityCount + ' |',
    '| Mature | 23 | ' + assessment.matureCount + ' |',
    '| Partial | 14 | ' + assessment.partialCount + ' |',
    '| High duplicate risk | 10 | ' + assessment.highDuplicateRiskCount + ' |',
    '',
    '### Prior Phase Pass Tokens (Validated Baseline)',
    '',
    ...assessment.priorPassTokensValidated.map((token) => `- \`${token}\``),
    '',
    '### Key Findings',
    '',
    '1. **Structural maturity exceeds operational maturity** — new V1 modules pass validators but runtime artifacts show low verification coverage (~6%) and 0% large-scale build success.',
    '2. **Canonical ownership is 5/5 complete for V1 consolidations** but six new V1 capabilities are not yet registered.',
    '3. **World2 should NOT be the next phase** — Real Build Execution Pipeline must precede World2 Maturity.',
    '4. **One Capability = One Canonical Owner** holds for core domains (CQI, UVL, AFLA, Product Architect, World2).',
    '5. **Six new overlap clusters** introduced by recent phases (see Duplicate Risk Analysis).',
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
    '## New Capability Inventory (Since V1)',
    '',
    '| Capability | Category | Status | Maturity | Validate Script |',
    '|------------|----------|--------|----------|-----------------|',
    '| Product Architect Intelligence V1 | Product Architect Intelligence | MATURE | 91 | validate:product-architect-intelligence-v1 |',
    '| UVL Verification Hub V1 | Verification Systems | PARTIAL | 72 | validate:uvl-maturity-verification-hub-v1 |',
    '| AFLA Trust Calibration V1 | Launch Readiness | MATURE | 88 | validate:afla-trust-calibration-v1 |',
    '| Large-Scale Multi-App Validation V1 | Verification Systems | PARTIAL | 70 | validate:large-scale-multi-app-validation-v1 |',
    '| Founder Review Operator Dashboard V1 | Operator Systems | MATURE | 87 | validate:founder-review-operator-dashboard-v1 |',
    '| Canonical Capability Ownership V1 | Self-Evolution | MATURE | 90 | validate:canonical-capability-ownership-v1 |',
    '',
    '---',
    '',
    '## Duplicate Risk Analysis',
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

  lines.push('', '### New Overlaps Since V1', '');
  for (const overlap of duplicateRisk.newOverlapsSinceV1) {
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
    '## Capability Maturity Assessment',
    '',
    '| Category | Count | Mature | Partial | Experimental | Missing | Avg Maturity |',
    '|----------|-------|--------|---------|--------------|---------|--------------|',
  );

  for (const [categoryId, summary] of Object.entries(maturitySummary.byCategory)) {
    const label = CATEGORY_LABELS[categoryId] ?? categoryId;
    lines.push(
      `| ${label} | ${summary.count} | ${summary.mature} | ${summary.partial} | ${summary.experimental} | ${summary.missing} | ${summary.avgMaturity} |`,
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## Missing Capability Report',
    '',
    '### What is still missing?',
    '',
    ...missingCapabilities.blockingVision.map((item) => `- **BLOCKING:** ${item}`),
    '',
    '### What remains weak?',
    '',
    ...missingCapabilities.stillWeak.map((item) => `- ${item}`),
    '',
    '### What is blocking the vision?',
    '',
    '- Real build execution (0% large-scale downstream success)',
    '- UVL operational verification coverage (~6%)',
    '- Cloud/production deployment path (absent)',
    '- World2 real instantiation (simulation-first)',
    '',
    '---',
    '',
    '## World2 Assessment',
    '',
    `**Pipeline:** ${w2.pipelineName}`,
    `**Current Maturity:** ${w2.currentMaturity} (${w2.status})`,
    `**Module Count:** ${w2.moduleCount}`,
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
    '## Recommended Roadmap',
    '',
    '*Fresh roadmap from audit evidence — World2 Maturity is NOT the highest priority.*',
    '',
    '| Rank | Phase | Action | Impact | Rationale |',
    '|------|-------|--------|--------|-----------|',
  );

  for (const priority of roadmap) {
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
    '| Autonomous Founder Launch Authority | `.autonomous-founder-launch-authority/suite-summary.json` | LAUNCH_READY (5/5) |',
    '| AFLA Trust Calibration V1 | `.afla-trust-calibration-v1/assessment.json` | Trust score 80 |',
    '| UVL Verification Hub V1 | `.unified-verification-lab-v1/assessment.json` | ~6% coverage |',
    '| Large-Scale Multi-App Validation | `.large-scale-multi-app-validation/assessment.json` | Gen 83%, build 0% |',
    '| Product Architect Intelligence V1 | `.product-architect-intelligence-v1/assessment.json` | Validated |',
    '| Canonical Capability Ownership V1 | `.canonical-capability-ownership-v1/assessment.json` | 5/5 groups |',
    '| Capability Audit V1 | `.capability-audit-v1/assessment.json` | Prior baseline |',
    '',
    '---',
    '',
    '## Audit Answers',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    `| What capabilities exist? | ${assessment.capabilityCount} across ${assessment.categoryCount} categories |`,
    `| What capabilities are mature? | ${assessment.matureCount} MATURE |`,
    `| What capabilities are missing? | ${assessment.missingCount} MISSING; ${missingCapabilities.entries.length} documented gaps |`,
    `| What capabilities overlap? | ${duplicateRisk.duplicateRiskCount} with duplicate risk; ${duplicateRisk.newOverlapsSinceV1.length} new since V1 |`,
    '| What should be built next? | Real Build Execution Pipeline (not World2 Maturity) |',
    '',
    '---',
    '',
    `**Pass token:** \`${AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN}\``,
    '',
  );

  return lines.join('\n');
}
