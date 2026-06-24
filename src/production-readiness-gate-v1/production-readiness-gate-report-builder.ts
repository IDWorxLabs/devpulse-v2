/**
 * Production Readiness Gate V1 — markdown report builder.
 */

import type { ProductionReadinessGateV1Assessment } from './production-readiness-gate-v1-types.js';
import { PRODUCTION_READINESS_GATE_V1_PASS_TOKEN } from './production-readiness-gate-v1-bounds.js';
import { formatProductionMatrixText } from './production-matrix-builder.js';

export function buildProductionReadinessGateV1ReportMarkdown(
  assessment: ProductionReadinessGateV1Assessment,
): string {
  const lines: string[] = [
    '# Production Readiness Gate V1 Report',
    '',
    `**Generated:** ${assessment.generatedAt.slice(0, 19)}Z`,
    '**Canonical Owner:** Production Readiness Gate V1',
    '',
    `**Pass token:** \`${PRODUCTION_READINESS_GATE_V1_PASS_TOKEN}\``,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `Production Readiness Gate V1 evaluates whether generated applications can safely move from **Launch Ready** to **Production Ready** for public deployment.`,
    '',
    `AFLA answers *Should this launch?* Production Readiness answers *Can this safely operate in the real world?*`,
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Production Readiness Score | ${assessment.productionReadinessScore}/100 |`,
    `| Production Readiness Verdict | ${assessment.productionReadinessVerdict} |`,
    `| Categories Evaluated | ${assessment.categoriesEvaluated} |`,
    `| Categories Production Ready | ${assessment.categoriesProductionReady}/${assessment.categoriesEvaluated} |`,
    `| Production Proof Status | ${assessment.productionProofStatus} |`,
    '',
    '---',
    '',
    '## Domain Scores',
    '',
    '| Domain | Score | Status |',
    '|--------|-------|--------|',
  ];

  for (const domain of assessment.domainScores.domains) {
    lines.push(`| ${domain.label} | ${domain.score}/100 | ${domain.status} |`);
  }

  lines.push(
    '',
    '---',
    '',
    '## Production Readiness Matrix',
    '',
    '```',
    formatProductionMatrixText(assessment.productionMatrix),
    '```',
    '',
    '---',
    '',
    '## Production Risk Summary',
    '',
  );

  const riskCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const risk of assessment.riskAnalysis) {
    riskCounts[risk.riskLevel] += 1;
  }

  lines.push(
    `| Risk Level | Count |`,
    `|------------|-------|`,
    `| CRITICAL | ${riskCounts.CRITICAL} |`,
    `| HIGH | ${riskCounts.HIGH} |`,
    `| MEDIUM | ${riskCounts.MEDIUM} |`,
    `| LOW | ${riskCounts.LOW} |`,
    '',
    '---',
    '',
    '## Hardening Recommendations',
    '',
    ...assessment.hardeningRecommendations.map((item) => `- ${item}`),
    '',
    '---',
    '',
    '## Audit Answers',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    '| Can it build software? | Yes (Real Build Execution V1.1) |',
    '| Can it verify software? | Yes (UVL Verification Execution V1) |',
    '| Can it review software? | Yes (Product Architect + Founder Review) |',
    '| Can it launch software? | Yes (AFLA Trust Calibration) |',
    `| Can it safely deploy software into production? | ${assessment.productionProofStatus === 'PROVEN' ? 'Proven' : 'Partial — hardening required'} |`,
    '',
    '---',
    '',
    `**Pass token:** \`${PRODUCTION_READINESS_GATE_V1_PASS_TOKEN}\``,
    '',
  );

  return lines.join('\n');
}
