/**
 * Validation Runtime Governance V1 — markdown report builder.
 */

import type { ValidationRuntimeGovernanceAssessment } from './validation-runtime-governance-v1-types.js';
import { VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN } from './validation-runtime-governance-v1-bounds.js';
import { explainCapabilityImpact } from './capability-impact-graph.js';
import { planValidationRun } from './validation-run-planner.js';
import { explainValidationDecision } from './validation-run-planner.js';

export function buildValidationRuntimeGovernanceV1ReportMarkdown(
  assessment: ValidationRuntimeGovernanceAssessment,
  metrics: readonly { validatorName: string; runtimeSeconds: number; category: string }[],
): string {
  const { policy, tierAssignments, governanceMetrics, reuseStrategy } = assessment;

  const tierCounts = new Map<string, number>();
  for (const a of tierAssignments) {
    tierCounts.set(a.tier, (tierCounts.get(a.tier) ?? 0) + 1);
  }

  const tierRows = ['FAST', 'STANDARD', 'FULL', 'LAUNCH']
    .map((t) => `| ${t} | ${tierCounts.get(t) ?? 0} |`)
    .join('\n');

  const ruleRows = policy.rules
    .map((r) => `| ${r.id} | ${r.name} | ${r.enforced ? 'ACTIVE' : 'INACTIVE'} | ${r.description} |`)
    .join('\n');

  const metricsRows = `| Validation Overhead | ${governanceMetrics.baselineValidationOverheadPercent}% → ${governanceMetrics.projectedValidationOverheadPercent}% (target <${governanceMetrics.targetValidationOverheadPercent}%) |
| Duplicate Work | ${governanceMetrics.baselineDuplicateWorkPercent}% → ${governanceMetrics.projectedDuplicateWorkPercent}% (target <${governanceMetrics.targetDuplicateWorkPercent}%) |
| Cache Hit % | ${governanceMetrics.cacheHitPercent}% |
| Preview Reuse % | ${governanceMetrics.previewReusePercent}% |
| Build Reuse % | ${governanceMetrics.buildReusePercent}% |`;

  const slowestLaunch = tierAssignments
    .filter((a) => a.tier === 'LAUNCH')
    .slice(0, 8)
    .map((a) => `\`${a.validatorName}\``)
    .join(', ');

  const cqiExample = explainCapabilityImpact(
    ['src/clarifying-question-intelligence/index.ts'],
    assessment.capabilityImpactGraph,
  );

  const fastPlan = planValidationRun({
    tier: 'FAST',
    changedFiles: cqiExample.validators.length ? ['src/clarifying-question-intelligence/index.ts'] : [],
    capabilityImpactGraph: assessment.capabilityImpactGraph,
    tierAssignments,
    metrics: metrics as Parameters<typeof planValidationRun>[0]['metrics'],
  });

  const aflaDecision = explainValidationDecision({
    tier: 'STANDARD',
    validatorName: 'validate:autonomous-founder-launch-authority-v1',
  });

  const dupRows = policy.duplicatePreventionRules
    .map((r) => `| ${r.operation} | ${r.affectedValidatorCount} | ${r.blockWhenReusableEvidenceExists ? 'BLOCK' : 'WARN'} |`)
    .join('\n');

  return `# Validation Runtime Governance V1

**Generated:** ${assessment.generatedAt}  
**Governance Active:** ${assessment.governanceActive ? 'YES' : 'NO'}  
**Audit Baseline:** \`${assessment.auditBaselinePassToken}\`  
**Pass Token:** \`${VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN}\`

---

## Executive Summary

Validation Runtime Governance V1 transforms validation from **Run Everything** to **Run What Is Necessary** using evidence from Validation Runtime Audit V1.

| Principle | Status |
|-----------|--------|
| Bounded | Tier runtime targets enforced |
| Cached | Build output cache active |
| Reusable | Preview + Playwright pools active |
| Tiered | FAST / STANDARD / FULL / LAUNCH |
| Targeted | Capability impact graph active |

### Governance Metrics

${metricsRows}

---

## Validation Tiers

| Tier | Validators Assigned |
|------|---------------------|
${tierRows}

### Tier Targets

| Tier | Target Runtime | Use Case |
|------|----------------|----------|
| FAST | < 60s | During implementation |
| STANDARD | < 5 min | After feature completion |
| FULL | < 15 min | Milestone completion |
| LAUNCH | Maximum confidence | Launch candidate only |

**LAUNCH validators:** ${slowestLaunch || 'n/a'}

---

## Governance Rules

| ID | Rule | Status | Description |
|----|------|--------|-------------|
${ruleRows}

---

## Capability Impact Graph

**Example: CQI file changed**

| Categories | Validators to Run | Excluded |
|------------|-------------------|----------|
| ${cqiExample.categories.join(', ') || '—'} | ${cqiExample.validators.slice(0, 5).join(', ') || '—'} | ${cqiExample.excluded.join(', ')} |

FAST tier plan for CQI change: ${fastPlan.validatorsToRun.length} validators, ~${fastPlan.estimatedRuntimeSeconds}s

---

## Reuse Strategy

| Strategy | Enabled | Est. Savings |
|----------|---------|--------------|
| Preview server reuse | ${reuseStrategy.previewServerReuse.enabled} | ${reuseStrategy.previewServerReuse.estimatedSavingsMinutes} min |
| Build output cache | ${reuseStrategy.buildOutputCache.enabled} | ${reuseStrategy.buildOutputCache.estimatedSavingsMinutes} min |
| Playwright session reuse | ${reuseStrategy.playwrightSessionReuse.enabled} | ${reuseStrategy.playwrightSessionReuse.estimatedSavingsMinutes} min |
| Artifact reuse | ${reuseStrategy.artifactReuse.enabled} | — |

---

## Duplicate Prevention

| Operation | Affected Validators | Action |
|-----------|---------------------|--------|
${dupRows}

---

## AFLA Tiering

**STANDARD tier + AFLA:** ${aflaDecision.shouldRun ? 'RUN' : 'BLOCKED'} — ${aflaDecision.why}

---

## Answers

| Question | Answer |
|----------|--------|
| What validation should run? | Use tier + capability impact graph — e.g. FAST runs only affected validators |
| Why should it run? | Changed file → capability → validator mapping |
| Can existing evidence be reused? | Yes — build cache, preview pool, artifact registry |
| Can runtime be reduced without reducing confidence? | Yes — LAUNCH tier retains full UVL/PAI/AFLA confidence |

---

## Artifacts

- \`.validation-runtime-governance-v1/governance-policy.json\`
- \`.validation-runtime-governance-v1/tier-registry.json\`
- \`.validation-runtime-governance-v1/capability-impact-graph.json\`
- \`.validation-runtime-governance-v1/runtime-budget-registry.json\`
- \`.validation-runtime-governance-v1/reuse-strategy.json\`
- \`.validation-runtime-governance-v1/governance-metrics.json\`
`;
}
