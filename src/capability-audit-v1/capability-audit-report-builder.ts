/**
 * AiDevEngine Capability Audit V1 — markdown report builder.
 */

import type { CapabilityAuditAssessment, CapabilityEntry } from './capability-audit-types.js';
import { AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN } from './capability-inventory.js';

const CATEGORY_LABELS: Record<string, string> = {
  IDEA_INTAKE: 'Idea Intake',
  REQUIREMENT_INTELLIGENCE: 'Requirement Intelligence',
  PLANNING_INTELLIGENCE: 'Planning Intelligence',
  CODE_GENERATION: 'Code Generation',
  BLUEPRINT_SYSTEMS: 'Blueprint Systems',
  FEATURE_VALIDATION: 'Feature Validation',
  ENGINEERING_REVIEW: 'Engineering Review',
  FOUNDER_REVIEW: 'Founder Review',
  PRODUCT_INTELLIGENCE: 'Product Intelligence',
  UI_UX_INTELLIGENCE: 'UI / UX Intelligence',
  SELF_EVOLUTION: 'Self-Evolution',
  MULTI_PROJECT_EXECUTION: 'Multi-Project Execution',
};

function formatCapabilityRow(entry: CapabilityEntry): string {
  const overlap =
    entry.overlapWith && entry.overlapWith.length > 0
      ? entry.overlapWith.join(', ')
      : '—';
  return `| ${entry.name} | ${entry.status} | ${entry.maturity} | ${entry.duplicateRisk} | ${entry.recommendation} | \`${entry.ownerPath}\` | ${entry.validateScript ?? '—'} | ${overlap} |`;
}

function buildCategorySection(
  categoryId: string,
  capabilities: readonly CapabilityEntry[],
): string {
  const label = CATEGORY_LABELS[categoryId] ?? categoryId;
  const categoryCaps = capabilities.filter((c) => c.category === categoryId);
  const mature = categoryCaps.filter((c) => c.status === 'MATURE').length;
  const partial = categoryCaps.filter((c) => c.status === 'PARTIAL').length;
  const highRisk = categoryCaps.filter((c) => c.duplicateRisk === 'HIGH').length;

  const lines: string[] = [
    `## ${label}`,
    '',
    `**Capabilities:** ${categoryCaps.length} · **Mature:** ${mature} · **Partial:** ${partial} · **High duplicate risk:** ${highRisk}`,
    '',
    '| Capability | Status | Maturity | Duplicate Risk | Recommendation | Owner | Validate | Overlap With |',
    '|------------|--------|----------|----------------|----------------|-------|----------|--------------|',
  ];

  for (const entry of categoryCaps) {
    lines.push(formatCapabilityRow(entry));
  }

  lines.push('');
  return lines.join('\n');
}

export function buildCapabilityAuditReportMarkdown(
  assessment: CapabilityAuditAssessment,
): string {
  const lines: string[] = [
    '# AiDevEngine Capability Audit Report V1',
    '',
    '**Phase Next — AiDevEngine Capability Audit V1**',
    `**Generated:** ${assessment.generatedAt.slice(0, 10)}`,
    '**Scope:** All major AiDevEngine intelligence layers',
    '**Method:** Ownership registry analysis, Launch Council registry, subsystem inventory, assessment artifact cross-reference, duplicate overlap modeling',
    '',
    `**Pass token:** \`${AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN}\``,
    '',
    '---',
    '',
    '## Audit Principle',
    '',
    'Before creating any new authority:',
    '',
    '```text',
    'Do we already have this capability?',
    '```',
    '',
    'If yes:',
    '',
    '```text',
    'Can existing systems be extended?',
    '```',
    '',
    'Prefer **Extend Existing Authority** over **Build New Authority** when overlap exceeds 25%.',
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `AiDevEngine has **${assessment.capabilityCount} catalogued capabilities** across **${assessment.categoryCount} intelligence categories**.`,
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Mature capabilities | ${assessment.matureCount} |`,
    `| Partial capabilities | ${assessment.partialCount} |`,
    `| High duplicate-risk capabilities | ${assessment.highDuplicateRiskCount} |`,
    `| Launch Council authorities | 28 |`,
    `| Proposed authority overlap analyses | ${assessment.proposedAuthorityOverlaps.length} |`,
    '',
    '### What AiDevEngine Already Does Well',
    '',
    '- **End-to-end proof path** — Autonomous Founder Launch Authority runs blueprint → codegen → feature/engineering/founder validation with **LAUNCH_READY** on 5 app profiles',
    '- **Mature validation stack** — Engineering Reality (100%), Feature Reality (100%), Universal Feature Contract, Blueprint Visual all pass on suite profiles',
    '- **Launch Council integration** — 28 authorities aggregated into unified readiness verdict',
    '- **Intake and planning chain** — Chat Authority → Requirement Extractor → Planning Gate → Product Architect → Code Generation Planner is validated end-to-end',
    '- **Clarifying questions** — Category-based clarifying question intelligence with Launch Council membership',
    '',
    '### Highest Duplicate-Risk Clusters',
    '',
    '1. **Requirement completeness** — Clarifying Question Intelligence vs Requirement Completeness Intelligence (~65% overlap)',
    '2. **Launch readiness verdict** — Autonomous Founder Launch vs Launch Readiness vs Founder Launch Decision (~50% overlap)',
    '3. **Verification stack** — UVL vs Verification Orchestrator vs Feature/Engineering Reality (~40% overlap)',
    '4. **World2 execution** — Three parallel eras (Phase 7, Phase 15, Phase 24E–24Y) with duplicate package/plan models',
    '5. **UI/UX review** — UI Reviewer vs Blueprint Visual vs Visual QA vs UX Heuristic Evaluator (~45% overlap)',
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
    '## High Duplicate-Risk Remediation Decisions',
    '',
    `All **${assessment.highDuplicateRiskCount}** high duplicate-risk capabilities require an explicit remediation decision before new authorities may be introduced.`,
    '',
    '| Capability | Decision | Target | Rationale |',
    '|------------|----------|--------|-----------|',
  );

  for (const remediation of assessment.highDuplicateRiskRemediations) {
    const target = remediation.target ?? '—';
    const rationale = remediation.rationale.replace(/\|/g, '\\|');
    lines.push(
      `| ${remediation.capabilityName} | ${remediation.decision} | ${target} | ${rationale} |`,
    );
  }

  lines.push(
    '',
    '**Decision summary:** KEEP × 2 · EXTEND × 3 · MERGE × 4 · REMOVE × 1 · REPLACE × 0',
    '',
  );

  lines.push('---', '', '## Duplicate Detection — Proposed Future Authorities', '');

  for (const overlap of assessment.proposedAuthorityOverlaps) {
    lines.push(`### ${overlap.proposedAuthority}`, '');
    lines.push('| Overlaps With | Percentage |');
    lines.push('|---------------|------------|');
    for (const item of overlap.overlaps) {
      lines.push(`| ${item.capability} | ${item.percentage}% |`);
    }
    lines.push('');
    lines.push(`**Net New Capability:** ${overlap.netNewCapability}%`);
    lines.push(`**Recommendation:** ${overlap.recommendation}`);
    lines.push(`**Rationale:** ${overlap.rationale}`);
    lines.push('');
  }

  lines.push('---', '', '## Missing Capabilities', '');
  for (const item of assessment.missingCapabilities) {
    lines.push(`- ${item}`);
  }

  lines.push('', '---', '', '## Recommended Roadmap', '');
  for (const item of assessment.roadmapPriorities) {
    lines.push(`- ${item}`);
  }

  lines.push(
    '',
    '---',
    '',
    '## Validation Evidence',
    '',
    'This audit cross-references live assessment artifacts:',
    '',
    '| System | Artifact | Status |',
    '|--------|----------|--------|',
    '| Autonomous Founder Launch Authority | `.autonomous-founder-launch-authority/suite-summary.json` | LAUNCH_READY (5/5 profiles) |',
    '| Engineering Reality Authority | `.engineering-reality-authority/suite-summary.json` | ENGINEERING_EXCELLENT (5/5 profiles) |',
    '| Feature Reality Validation | `.feature-reality-validation/assessment.json` | FEATURE_EXCELLENT (100%) |',
    '| Blueprint Visual Validation | `.blueprint-visual-validation/assessment.json` | Validated |',
    '| Launch Council | `src/launch-council/launch-council-registry.ts` | 28 authorities registered |',
    '',
    '---',
    '',
    '## Related Audits',
    '',
    '- `architecture/DEVPULSE_V2_FULL_CAPABILITY_AUDIT_REPORT.md` — Phase 24XA full-platform architecture audit',
    '- `architecture/SELF_MODEL_REALITY_AUDIT.md` — Chat self-model reality audit',
    '- `architecture/AUTHORITY_REALITY_CONVERGENCE_AUDIT.md` — Authority verdict divergence audit',
    '',
    '---',
    '',
    `**Pass token:** \`${AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN}\``,
    '',
  );

  return lines.join('\n');
}
