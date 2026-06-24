/**
 * Validation Runtime Audit V1 — markdown report builder.
 */

import type { ValidationRuntimeAuditResult } from './validation-runtime-audit-assessor.js';
import { VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN } from './validation-runtime-audit-bounds.js';

function formatRankingTable(
  title: string,
  entries: ValidationRuntimeAuditResult['rankings']['slowest'],
): string {
  const rows = entries
    .map(
      (e) =>
        `| ${e.rank} | \`${e.validatorName}\` | ${e.runtimeSeconds}s | ${e.runtimeMinutes} min | ${e.costTier} | ${e.duplicateWorkPercent}% | ${e.category} |`,
    )
    .join('\n');

  return `### ${title}

| Rank | Validator | Runtime (s) | Runtime (min) | Cost | Dup % | Category |
|------|-----------|-------------|---------------|------|-------|----------|
${rows || '| — | — | — | — | — | — | — |'}
`;
}

export function buildValidationRuntimeAuditV1ReportMarkdown(
  result: ValidationRuntimeAuditResult,
): string {
  const { assessment, rankings, duplicateWork, dependencyGraph, bottlenecks, governanceRecommendations } =
    result;

  const categoryBreakdown = new Map<string, { count: number; seconds: number }>();
  for (const m of assessment.metrics.filter((x) => x.registeredInPackageJson)) {
    const cur = categoryBreakdown.get(m.category) ?? { count: 0, seconds: 0 };
    categoryBreakdown.set(m.category, {
      count: cur.count + 1,
      seconds: cur.seconds + m.runtimeSeconds,
    });
  }

  const categoryRows = [...categoryBreakdown.entries()]
    .sort((a, b) => b[1].seconds - a[1].seconds)
    .map(
      ([cat, data]) =>
        `| ${cat} | ${data.count} | ${Math.round(data.seconds)}s | ${Math.round((data.seconds / 60) * 10) / 10} min |`,
    )
    .join('\n');

  const bottleneckRows = bottlenecks
    .slice(0, 10)
    .map(
      (b) =>
        `| ${b.rank} | ${b.bottleneck} | ${b.affectedValidatorCount} | ${b.estimatedAggregateMinutes} min | ${b.impactScore} |`,
    )
    .join('\n');

  const govRows = governanceRecommendations
    .map(
      (g) =>
        `| ${g.action} | ${g.target} | ${g.estimatedSavingsMinutes} min | ${g.evidenceValidators.slice(0, 3).join(', ')} |`,
    )
    .join('\n');

  const nestedChainRows = dependencyGraph.nestedChains
    .slice(0, 15)
    .map((c) => `| ${c.circular ? '⚠ CIRCULAR' : 'nested'} | ${c.chain.join(' → ')} |`)
    .join('\n');

  const dupTop = duplicateWork.entries.slice(0, 15);
  const dupRows = dupTop
    .map(
      (d) =>
        `| \`${d.validatorName}\` | ${d.duplicateWorkPercent}% | ${d.duplicatedOperations.join(', ') || '—'} | ${d.overlappingValidators.slice(0, 3).join(', ') || '—'} |`,
    )
    .join('\n');

  const measuredCount = assessment.metrics.filter((m) => m.measurementSource === 'MEASURED').length;

  return `# Validation Runtime Audit V1

**Generated:** ${assessment.generatedAt}  
**Mode:** READ ONLY — MEASUREMENT ONLY  
**Pass Token:** \`${VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN}\`

---

## Executive Summary

AiDevEngine validation ecosystem runtime audit. This phase measures where time is spent before Validation Runtime Governance V1.

| Metric | Value |
|--------|-------|
| Total validators scanned | ${assessment.validatorCount} |
| Registered in package.json | ${assessment.registeredValidatorCount} |
| Measured baselines used | ${measuredCount} |
| Aggregate duplicate work | ${assessment.aggregateDuplicateWorkPercent}% |
| Sum of registered validator estimates | ${assessment.totalEstimatedRuntimeMinutes} min (${assessment.totalEstimatedRuntimeSeconds}s) |

### Typical Phase Overhead

| Phase | Minutes |
|-------|---------|
| Implementation (typical) | ${assessment.regressionChain.typicalImplementationMinutes} |
| Regression validation | ${assessment.regressionChain.typicalRegressionValidationMinutes} |
| **Validation overhead ratio** | **${assessment.regressionChain.validationOverheadRatio}%** |

Phase validators: ${assessment.regressionChain.phaseValidators.map((v) => `\`${v}\``).join(', ')}

---

## Category Runtime Breakdown

| Category | Validators | Est. Runtime | Est. Minutes |
|----------|------------|--------------|--------------|
${categoryRows}

---

## Top 20 Slowest Validators

${formatRankingTable('Slowest (by runtime seconds)', rankings.slowest)}

## Top 20 Most Expensive Validators

${formatRankingTable('Most expensive (cost tier × runtime)', rankings.mostExpensive)}

## Top 20 Highest Duplicate Validators

${formatRankingTable('Highest duplicate work %', rankings.highestDuplicate)}

---

## Duplicate Work Analysis

| Validator | Dup % | Duplicated Operations | Overlapping Validators |
|-----------|-------|----------------------|------------------------|
${dupRows}

---

## Runtime Bottlenecks

| Rank | Bottleneck | Affected Validators | Est. Aggregate | Impact |
|------|------------|---------------------|----------------|--------|
${bottleneckRows}

---

## Validation Dependency Graph

### Nested Chains

| Type | Chain |
|------|-------|
${nestedChainRows || '| — | — |'}

### Circular Validation Paths

${dependencyGraph.circularValidationPaths.length === 0 ? '_None detected._' : dependencyGraph.circularValidationPaths.map((p) => `- \`${p}\``).join('\n')}

### Repeated Validation Paths

${dependencyGraph.repeatedValidationPaths.length === 0 ? '_None detected._' : dependencyGraph.repeatedValidationPaths.map((p) => `- ${p}`).join('\n')}

---

## Governance Recommendations (Evidence Only — Not Implemented)

| Action | Target | Est. Savings | Evidence |
|--------|--------|--------------|----------|
${govRows}

> **Note:** These are measurement-derived recommendations only. No caching, merging, tiering, or validator changes were applied in this phase.

---

## Artifacts

- \`.validation-runtime-audit-v1/runtime-metrics.json\`
- \`.validation-runtime-audit-v1/validator-rankings.json\`
- \`.validation-runtime-audit-v1/duplicate-work-analysis.json\`
- \`.validation-runtime-audit-v1/dependency-graph.json\`
- \`.validation-runtime-audit-v1/bottlenecks.json\`
- \`.validation-runtime-audit-v1/governance-recommendations.json\`

---

## Answers

| Question | Answer |
|----------|--------|
| Which validators are slowest? | See Top 20 Slowest — leader: \`${rankings.slowest[0]?.validatorName ?? 'n/a'}\` (${rankings.slowest[0]?.runtimeSeconds ?? 0}s) |
| Which consume most resources? | See Top 20 Most Expensive — leader: \`${rankings.mostExpensive[0]?.validatorName ?? 'n/a'}\` (${rankings.mostExpensive[0]?.costTier}) |
| Which duplicate work? | See Duplicate Work — leader: \`${rankings.highestDuplicate[0]?.validatorName ?? 'n/a'}\` (${rankings.highestDuplicate[0]?.duplicateWorkPercent ?? 0}%) |
| Where is runtime lost? | See Bottlenecks — #1: ${bottlenecks[0]?.bottleneck ?? 'n/a'} |
| What to optimize first? | ${governanceRecommendations[0]?.action ?? 'KEEP'}: ${governanceRecommendations[0]?.target ?? 'n/a'} |
`;
}
