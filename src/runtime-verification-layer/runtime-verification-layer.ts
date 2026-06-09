/**
 * Runtime Verification Layer Foundation — Phase 14.6 orchestrator.
 * Creates verification reports — does NOT execute runtime actions.
 */

import { publishRuntimeVerificationFeedStages } from '../operator-feed/runtime-verification-feed-bridge.js';
import { buildRuntimeVerificationReport } from './runtime-verification-report-builder.js';
import { parseVerificationRequest } from './runtime-verification-request-parser.js';
import {
  getRuntimeVerificationDiagnostics,
  updateRuntimeVerificationDiagnostics,
} from './runtime-verification-diagnostics.js';
import { satisfiedEvidenceCount } from './verification-evidence-builder.js';
import {
  isDuplicateVerificationBrainQuestion,
  type RuntimeVerificationDiagnostics,
  type RuntimeVerificationReport,
  type RuntimeVerificationResult,
} from './runtime-verification-types.js';

function composeResponse(query: string, report: RuntimeVerificationReport): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Runtime Verification Layer Foundation Response', ''];

  if (isDuplicateVerificationBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push(
      'Why: Phase 14.6 Runtime Verification Layer extends verification architecture — do not create verification_brain, verification_runtime_v2, or apply_engine duplicates.',
    );
    lines.push('Next safe action: Extend Runtime Verification Layer through Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('runtime chain verified') || lower.includes('is the runtime chain verified')) {
    lines.push(`Verification: ${report.verificationId} — ${report.title}`);
    lines.push(`State: ${report.state}`);
    lines.push(`Score: ${report.verificationScore}/100`);
    lines.push(`Confidence: ${report.confidence}`);
    lines.push(`Trust: ${report.trustAssessment.trustLevel} — ${report.trustAssessment.summary}`);
    lines.push(`Evidence satisfied: ${satisfiedEvidenceCount(report.evidence)}/${report.evidence.length}`);
    lines.push(`Gaps: ${report.gaps.length}`);
    lines.push('');
    lines.push('Simulation-only — no runtime actions executed, no files modified.');
    lines.push('Approval/future execution gates are required before any governed runtime.');
  } else if (lower.includes('verification evidence') || lower.includes('what verification exists')) {
    lines.push('Verification evidence:');
    for (const e of report.evidence) {
      lines.push(`• [${e.category}] ${e.statement} — satisfied: ${e.satisfied}`);
    }
  } else if (lower.includes('verification gaps') || lower.includes('what prevents verification')) {
    lines.push('Verification gaps:');
    for (const g of report.gaps) {
      lines.push(`• [${g.severity}] ${g.summary}`);
    }
  } else if (lower.includes('verification score')) {
    lines.push(`Verification score: ${report.verificationScore}/100`);
    lines.push(`Confidence: ${report.confidence}`);
    lines.push(`Blocked: ${report.blocked}`);
  } else if (lower.includes('trust assessment') || lower.includes('how trustworthy')) {
    lines.push(`Trust level: ${report.trustAssessment.trustLevel}`);
    lines.push(report.trustAssessment.summary);
    lines.push('Trust factors:');
    for (const f of report.trustAssessment.factors) {
      lines.push(`• ${f}`);
    }
  } else if (lower.includes('verified next') || lower.includes('should be verified next')) {
    lines.push(`Recommended next action: ${report.recommendedNextAction}`);
  } else {
    lines.push(`Report ${report.verificationId}: ${report.title}`);
    lines.push(`State: ${report.state} | Score: ${report.verificationScore}`);
    lines.push(`Evidence: ${report.evidence.length} | Gaps: ${report.gaps.length}`);
    lines.push(`Linked: exec=${report.linkedExecutionId}, build=${report.linkedBuildTaskId}, gen=${report.linkedGenerationId}, test=${report.linkedTestingId}, fix=${report.linkedFixId}`);
    lines.push(`Recommended: ${report.recommendedNextAction}`);
  }

  lines.push('');
  lines.push('Verification only — no execution, no test runs, no fix application, no file writes.');
  lines.push('Execution remains blocked. Generation proposal-only. Testing and auto-fix simulation-only.');
  return lines.join('\n');
}

export function processRuntimeVerificationRequest(query: string): RuntimeVerificationResult {
  publishRuntimeVerificationFeedStages(query);
  const request = parseVerificationRequest(query);
  const report = buildRuntimeVerificationReport(query);
  updateRuntimeVerificationDiagnostics(query, report);

  return {
    query,
    request,
    report,
    responseText: composeResponse(query, report),
  };
}

export function getRuntimeVerificationContext(query: string): {
  result: RuntimeVerificationResult;
  diagnostics: RuntimeVerificationDiagnostics;
  verificationBlockers: string[];
  verificationReadiness: string;
} {
  const result = processRuntimeVerificationRequest(query);
  return {
    result,
    diagnostics: getRuntimeVerificationDiagnostics(),
    verificationBlockers: result.report.blockers,
    verificationReadiness: result.report.readiness,
  };
}
