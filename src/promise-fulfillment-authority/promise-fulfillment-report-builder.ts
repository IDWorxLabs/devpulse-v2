/**
 * Promise Fulfillment Report Builder.
 */

import { PROMISE_FULFILLMENT_REPORT_TITLE } from './promise-fulfillment-bounds.js';
import type { PromiseAssessment, PromiseFulfillmentAssessment } from './promise-fulfillment-types.js';

function sectionForStatus(
  assessments: PromiseAssessment[],
  status: PromiseAssessment['status'],
  emptyLabel: string,
): string {
  const matches = assessments.filter((assessment) => assessment.status === status);
  if (!matches.length) return `${emptyLabel}\n`;
  return matches
    .map(
      (assessment) =>
        `- **${assessment.promise}** (${assessment.promiseId}) — confidence ${assessment.confidence}/100\n` +
        `  Supporting: ${assessment.supportingEvidence.join('; ') || 'None'}\n` +
        `  Contradictory: ${assessment.contradictoryEvidence.join('; ') || 'None'}`,
    )
    .join('\n');
}

function evidenceSection(assessments: PromiseAssessment[], kind: 'supporting' | 'contradictory'): string {
  const key = kind === 'supporting' ? 'supportingEvidence' : 'contradictoryEvidence';
  const lines = [...new Set(assessments.flatMap((assessment) => assessment[key]))];
  return lines.length ? lines.map((line) => `- ${line}`).join('\n') : '- None recorded.\n';
}

export function buildPromiseFulfillmentReportMarkdown(
  assessment: PromiseFulfillmentAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'FULFILLED'
      ? 'Observed reality largely supports the product claims — this is not a GO / NO GO decision.'
      : assessment.readinessState === 'PARTIAL'
        ? 'Some promises are supported, but important claims remain only partially proven.'
        : assessment.readinessState === 'RISK'
          ? 'Multiple promises remain unproven or weakly supported by authority evidence.'
          : 'Contradicted or unsupported claims block treating product promises as fulfilled.';

  return `# ${PROMISE_FULFILLMENT_REPORT_TITLE}

Generated: ${date}
Read-only promise-vs-reality evaluation — evidence from Launch Council authorities only

## Promise Fulfillment Summary

Fulfillment score: **${assessment.fulfillmentScore}/100**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Fulfilled: **${assessment.fulfilledCount}** | Partial: **${assessment.partiallyFulfilledCount}** | Unproven: **${assessment.unprovenCount}** | Contradicted: **${assessment.contradictedCount}**

Core question: **Does reality support what the product claims?**

## Fulfilled Promises

${sectionForStatus(assessment.promiseAssessments, 'FULFILLED', 'None fulfilled under current authority evidence.')}

## Partially Fulfilled Promises

${sectionForStatus(assessment.promiseAssessments, 'PARTIALLY_FULFILLED', 'None partially fulfilled.')}

## Unproven Promises

${sectionForStatus(assessment.promiseAssessments, 'UNPROVEN', 'None unproven.')}

## Contradicted Promises

${sectionForStatus(assessment.promiseAssessments, 'CONTRADICTED', 'None contradicted.')}

## Supporting Evidence

${evidenceSection(assessment.promiseAssessments, 'supporting')}

## Contradictory Evidence

${evidenceSection(assessment.promiseAssessments, 'contradictory')}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. If reality cannot prove the claim, treat the claim as not fulfilled.'}

## Promise Fulfillment Verdict

${verdict}
`;
}
