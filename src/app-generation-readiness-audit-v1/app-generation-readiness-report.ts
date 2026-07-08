/**
 * App Generation Readiness Audit V1 — markdown report builder.
 *
 * Pure function: assessment in, markdown string out. No filesystem access here (the validator
 * script owns writing the report to disk), so this stays trivially deterministic and testable.
 */

import type {
  AppGenerationReadinessAuditAssessment,
  EvidenceCitation,
  Finding,
  FixSequenceStep,
  MissingAuthority,
  PipelineStageEvidence,
  RiskRankEntry,
  StateStoreEntry,
} from './app-generation-readiness-audit-types.js';

function citationLine(c: EvidenceCitation): string {
  const fn = c.function ? ` \`${c.function}\`` : '';
  const lines = c.lines ? ` (${c.lines})` : '';
  return `  - \`${c.file}\`${fn}${lines} — ${c.note}`;
}

function pipelineMapSection(stages: PipelineStageEvidence[]): string {
  const header = '| # | Stage | Owner | Unambiguous owner? | Primary files |\n|---|---|---|---|---|';
  const rows = stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => `| ${s.order} | ${s.name} | ${s.ownedBy} | ${s.hasUnambiguousOwner ? 'Yes' : 'No'} | ${s.primaryFiles.map((f) => `\`${f}\``).join(', ')} |`);
  const detail = stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(
      (s) =>
        `### ${s.order}. ${s.name}\n\n${s.description}\n\n- Primary functions: ${s.primaryFunctions.map((f) => `\`${f}\``).join(', ')}\n\n**Evidence:**\n\n${s.evidence.map(citationLine).join('\n')}`,
    )
    .join('\n\n');
  return `## 1. Pipeline Map\n\n${header}\n${rows.join('\n')}\n\n${detail}`;
}

function stateOwnershipSection(entries: StateStoreEntry[]): string {
  const header = '| Store | File | Scope key | Correctly scoped? | Risk |\n|---|---|---|---|---|';
  const rows = entries.map((e) => `| ${e.store} | \`${e.file}\` | ${e.scopeKey} | ${e.scopedCorrectly ? 'Yes' : 'No'} | ${e.risk} |`);
  const detail = entries.map((e) => `**${e.store}**\n\n${e.evidence.map(citationLine).join('\n')}`).join('\n\n');
  return `## 2. State Ownership Map\n\n${header}\n${rows.join('\n')}\n\n${detail}`;
}

function evidenceSourcesSection(title: string, citations: EvidenceCitation[]): string {
  return `## ${title}\n\n${citations.map(citationLine).join('\n')}`;
}

function findingsByCategorySection(title: string, order: number, findings: Finding[], categories: Finding['category'][]): string {
  const matched = findings.filter((f) => categories.includes(f.category));
  if (matched.length === 0) {
    return `## ${order}. ${title}\n\nNo findings recorded in this category.`;
  }
  const blocks = matched.map(
    (f) =>
      `### ${f.id} — ${f.title} (${f.severity})\n\n${f.summary}\n\n**Related stages:** ${f.relatedStages.join(', ')}\n\n**Files responsible:** ${f.filesResponsible.map((x) => `\`${x}\``).join(', ')}\n\n**Functions responsible:** ${f.functionsResponsible.map((x) => `\`${x}\``).join(', ')}\n\n**Evidence:**\n\n${f.evidence.map(citationLine).join('\n')}`,
  );
  return `## ${order}. ${title}\n\n${blocks.join('\n\n')}`;
}

function missingAuthoritiesSection(order: number, authorities: MissingAuthority[]): string {
  const blocks = authorities.map((a) => `### ${a.id} — ${a.title}\n\n${a.description}\n\n**Evidence:**\n\n${a.evidence.map(citationLine).join('\n')}`);
  return `## ${order}. Missing Engine Authorities\n\n${blocks.join('\n\n')}`;
}

function fixSequenceSection(order: number, steps: FixSequenceStep[]): string {
  const rows = steps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => `${s.order}. **${s.title}**\n   - Rationale: ${s.rationale}\n   - Addresses: ${s.addressesFindingIds.join(', ')}`);
  return `## ${order}. Recommended Fix Sequence\n\nThis audit does not implement any of the following. Sequencing rationale only.\n\n${rows.join('\n\n')}`;
}

function riskRankingSection(order: number, entries: RiskRankEntry[]): string {
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = entries.slice().sort((a, b) => severityOrder[a.risk] - severityOrder[b.risk]);
  const header = '| Finding | Risk | Justification |\n|---|---|---|';
  const rows = sorted.map((e) => `| ${e.findingId} | ${e.risk} | ${e.justification} |`);
  return `## ${order}. Risk Ranking\n\n${header}\n${rows.join('\n')}`;
}

function exactFilesFunctionsSection(order: number, findings: Finding[]): string {
  const fileToFunctions = new Map<string, Set<string>>();
  for (const f of findings) {
    for (const file of f.filesResponsible) {
      if (!fileToFunctions.has(file)) fileToFunctions.set(file, new Set());
      for (const fn of f.functionsResponsible) fileToFunctions.get(file)!.add(fn);
    }
  }
  const rows = Array.from(fileToFunctions.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, fns]) => `| \`${file}\` | ${Array.from(fns).sort().map((fn) => `\`${fn}\``).join(', ')} |`);
  return `## ${order}. Exact Files/Functions Likely Responsible\n\n| File | Functions |\n|---|---|\n${rows.join('\n')}`;
}

function evidencePerFindingSection(order: number, findings: Finding[]): string {
  const rows = findings.map((f) => `- **${f.id}** (${f.evidence.length} citation${f.evidence.length === 1 ? '' : 's'}): ${f.evidence.map((c) => `\`${c.file}\``).join(', ')}`);
  return `## ${order}. Evidence Index (per finding)\n\n${rows.join('\n')}`;
}

export function buildAppGenerationReadinessAuditReportMarkdown(assessment: AppGenerationReadinessAuditAssessment): string {
  const sections = [
    '# AiDevEngine V4 App Generation Readiness Audit V1',
    '',
    'This is an audit-only report. No generation behavior, validators, or product-specific logic were changed to produce it. Every finding below cites a specific file/function pair inspected directly in this repository; this report also verifies those files still exist on disk at audit time (see summary table).',
    '',
    '## Summary',
    '',
    `| Metric | Value |\n|---|---|\n| Stages covered | ${assessment.stagesCovered} / ${assessment.totalStagesRequired} |\n| Findings recorded | ${assessment.findings.length} |\n| Finding categories identified | ${assessment.categoriesIdentified.join(', ')} |\n| Missing authorities identified | ${assessment.missingAuthorities.length} |\n| Fix sequence steps | ${assessment.fixSequence.length} |\n| Files cited | ${assessment.filesInspected.length} |\n| Evidence files found on disk | ${assessment.evidenceFilesFound} / ${assessment.evidenceFilesChecked} (${(assessment.evidenceFileExistenceRatio * 100).toFixed(1)}%) |\n| Audit proof status | ${assessment.auditProofStatus} |`,
    '',
    pipelineMapSection(assessment.pipelineStages),
    stateOwnershipSection(assessment.stateOwnershipMap),
    evidenceSourcesSection('3. Current Prompt Evidence Sources', assessment.currentPromptEvidenceSources),
    evidenceSourcesSection('4. Previous Project Evidence Sources', assessment.previousProjectEvidenceSources),
    findingsByCategorySection('Places Where Stale Context Can Leak (includes project context isolation failures)', 5, assessment.findings, ['STALE_CONTEXT_CONTAMINATION', 'PROJECT_CONTEXT_ISOLATION']),
    findingsByCategorySection('Places Where Fallback Modules Can Be Appended', 6, assessment.findings, ['FALLBACK_MODULE_CONTAMINATION']),
    findingsByCategorySection('Places Where Generated Modules Can Drift From the Canonical Product Contract', 7, assessment.findings, ['CONTRACT_DRIFT']),
    findingsByCategorySection('Places Where Faithfulness Detects Failure Too Late', 8, assessment.findings, ['FAITHFULNESS_LATE_DETECTION']),
    findingsByCategorySection('Places Where Repair Is Only Reported But Not Applied', 9, assessment.findings, ['REPAIR_LIMITATION']),
    findingsByCategorySection('Places Where Runtime/Live Preview Can Stop Responding', 10, assessment.findings, ['RUNTIME_FAILURE_OWNERSHIP']),
    missingAuthoritiesSection(11, assessment.missingAuthorities),
    fixSequenceSection(12, assessment.fixSequence),
    riskRankingSection(13, assessment.riskRanking),
    exactFilesFunctionsSection(14, assessment.findings),
    evidencePerFindingSection(15, assessment.findings),
    '## Guarantees',
    '',
    `- No app-specific fixes implemented: ${assessment.noAppSpecificFixesApplied}\n- No product domains hardcoded into behavior: ${assessment.noProductDomainsHardcoded}\n- No existing generation behavior modified: ${assessment.noExistingBehaviorModified}\n- No validators weakened: ${assessment.noValidatorsWeakened}`,
    '',
    `Pass token: \`${assessment.passToken}\``,
  ];
  return sections.join('\n\n');
}
