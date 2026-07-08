/**
 * Autonomous Engineering Orchestrator V1 — reporting.
 *
 * Builds the founder-facing plain-English explanation and a markdown engineering report from an
 * AeoOrchestratorReport. The user-facing summary never just says "Build failed." — it always
 * explains what failed, what AiDevEngine checked, whether that repair was sufficient, and what
 * (if anything) is missing.
 */

import type {
  AeoFailureClassification,
  AeoMissingCapabilityRecommendation,
  AeoOrchestratorReport,
  AeoRepairAttemptRecord,
  AeoRepairPlan,
} from './autonomous-engineering-orchestrator-types.js';
import { renderCapabilityMatrixMarkdown } from '../engineering-intelligence-activation-authority-v1/activation-report.js';

function humanizeFailureClass(failureClass: string): string {
  return failureClass.toLowerCase().replace(/_/g, ' ');
}

export function buildAeoPlainEnglishSummary(input: {
  classification: AeoFailureClassification;
  repairPlan: AeoRepairPlan;
  missingCapability: AeoMissingCapabilityRecommendation | null;
  repairResult: 'REPAIRED' | 'NOT_APPLIED' | 'FAILED' | null;
  applied: boolean;
  engineeringIntelligenceActivationDecision?: string | null;
  engineeringIntelligenceInvoked?: boolean;
}): string {
  const { classification, repairPlan, missingCapability, repairResult, applied } = input;
  const whatFailed = `Build failed because of ${humanizeFailureClass(classification.failureClass)}${
    classification.evidence[0] ? ` (${classification.evidence[0].detail})` : ''
  }.`;

  const eiaaNote = (() => {
    if (!missingCapability || !input.engineeringIntelligenceActivationDecision) return '';
    if (input.engineeringIntelligenceActivationDecision === 'ALLOW_ENGINEERING_INTELLIGENCE') {
      return input.engineeringIntelligenceInvoked
        ? ' The Engineering Intelligence Activation Authority authorized capability generation, and the Engineering Intelligence Runtime was invoked (output remains separately validated before installation).'
        : ' The Engineering Intelligence Activation Authority authorized capability generation, but no execution host was connected, so the Engineering Intelligence Runtime was not invoked yet.';
    }
    if (input.engineeringIntelligenceActivationDecision === 'REQUIRE_HUMAN_REVIEW') {
      return ' The Engineering Intelligence Activation Authority requires human review before any capability generation may be authorized.';
    }
    return ' The Engineering Intelligence Activation Authority denied capability generation for this failure — AiDevEngine will not invoke the Engineering Intelligence Runtime.';
  })();

  if (repairResult === 'REPAIRED') {
    const capabilityName = repairPlan.matchedCapability?.displayName ?? 'an existing repair capability';
    return `${whatFailed} AiDevEngine checked existing repair capability ${capabilityName}, applied it, and confirmed the build recovered.`;
  }

  const capabilityName = repairPlan.matchedCapability?.displayName ?? repairPlan.consideredCapabilities[0]?.displayName ?? null;

  if (repairPlan.decision === 'RUN_TARGETED_REPAIR' && !applied) {
    return `${whatFailed} AiDevEngine checked existing repair capability ${capabilityName} — it is production-wired and safe to run automatically for this failure, but no execution channel is connected at this build stage yet, so it was not run automatically. No repair was applied.`;
  }

  if (repairPlan.decision === 'RUN_TARGETED_REPAIR' && applied) {
    return `${whatFailed} AiDevEngine checked existing repair capability ${capabilityName}, applied it, but could not confirm the build recovered (no revalidation evidence available). AiDevEngine never marks a build as recovered without evidence.`;
  }

  if (!capabilityName) {
    return `${whatFailed} AiDevEngine checked its existing repair capabilities and found none registered for this failure class. Missing capability ${
      missingCapability?.missingCapabilityName ?? 'unknown'
    } is required to continue automatically.${eiaaNote}`;
  }

  const sufficiencyNote = `${capabilityName} is not production-wired / not sufficient to safely repair this automatically (${repairPlan.reason}).`;
  const missingNote = missingCapability
    ? ` Missing capability ${missingCapability.missingCapabilityName} is required to continue.`
    : '';

  return `${whatFailed} AiDevEngine checked existing repair capability ${capabilityName}. ${sufficiencyNote}${missingNote}${eiaaNote}`;
}

export function renderAeoOrchestratorReportMarkdown(report: AeoOrchestratorReport): string {
  const lines: string[] = [];
  lines.push('# Autonomous Engineering Orchestrator V1 — Report');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push(`Final state: **${report.finalState}**`);
  lines.push(`Build recovered: **${report.buildRecovered}**`);
  lines.push('');
  lines.push('## Plain-English summary');
  lines.push(report.plainEnglishSummary);
  lines.push('');
  lines.push('## Failure classification');
  lines.push(`- Class: ${report.classification.failureClass}`);
  lines.push(`- Severity: ${report.classification.severity}`);
  lines.push(`- Confidence: ${report.classification.confidence}`);
  lines.push(`- Likely owner system: ${report.classification.likelyOwnerSystem}`);
  lines.push(`- Affected stages: ${report.classification.affectedStages.join(', ') || 'none'}`);
  for (const e of report.classification.evidence) {
    lines.push(`  - Evidence (${e.source}): ${e.detail}`);
  }
  lines.push('');
  lines.push('## Repair plan');
  if (report.repairPlan) {
    lines.push(`- Decision: ${report.repairPlan.decision}`);
    lines.push(`- Matched capability: ${report.repairPlan.matchedCapability?.displayName ?? 'none'}`);
    lines.push(`- Production-wired: ${report.repairWasProductionWired}`);
    lines.push(`- Safe to auto-run: ${report.repairWasSafeToAutoRun}`);
    lines.push(`- Retry scope: ${report.repairPlan.retryScope}`);
    lines.push(`- Target stage: ${report.retryStage ?? 'none'}`);
    lines.push(`- Reason: ${report.repairPlan.reason}`);
  } else {
    lines.push('- No repair plan was produced.');
  }
  lines.push('');
  lines.push('## Repair attempt history');
  if (report.repairAttemptHistory.length === 0) {
    lines.push('- No repair attempts were made.');
  } else {
    for (const a of report.repairAttemptHistory) {
      lines.push(
        `- Cycle ${a.cycle}: ${a.failureClass} via ${a.capabilityId ?? 'none'} — decision=${a.decision}, applied=${a.applied}, succeeded=${a.succeeded} — ${a.detail}`,
      );
    }
  }
  lines.push('');
  lines.push('## Missing capability');
  if (report.missingCapability) {
    lines.push(`- ${report.missingCapability.missingCapabilityId}: ${report.missingCapability.missingCapabilityName}`);
    lines.push(`- Failure class requiring it: ${report.missingCapability.failureClassRequiringIt}`);
    for (const reason of report.missingCapability.whyExistingCapabilitiesAreInsufficient) {
      lines.push(`  - ${reason}`);
    }
    lines.push(`- Recommended next milestone: ${report.missingCapability.recommendedNextMilestonePromptSummary}`);
  } else {
    lines.push('- None — no missing capability was routed for this build.');
  }
  lines.push('');
  lines.push('## Engineering Intelligence Activation');
  if (report.engineeringIntelligenceActivation) {
    const eiaa = report.engineeringIntelligenceActivation;
    lines.push(`- Activation decision: **${eiaa.decision}**`);
    lines.push(`- Decision confidence: ${eiaa.confidence}`);
    lines.push(`- Reason: ${eiaa.reason}`);
    lines.push(`- Runtime invocation status: ${report.engineeringIntelligenceInvoked ? 'INVOKED' : 'NOT INVOKED'}`);
    if (report.engineeringIntelligenceInvocationDetail) {
      lines.push(`- Invocation detail: ${report.engineeringIntelligenceInvocationDetail}`);
    }
    lines.push('- Satisfied policy checks:');
    for (const c of eiaa.satisfiedChecks) lines.push(`  - ✓ ${c.checkId}: ${c.detail}`);
    lines.push('- Rejected/failed policy checks:');
    if (eiaa.failedChecks.length === 0) lines.push('  - (none)');
    for (const c of eiaa.failedChecks) lines.push(`  - ✗ ${c.checkId}: ${c.detail}`);
    if (eiaa.rejectedActivationReasons.length > 0) {
      lines.push('- Rejected activation reasons:');
      for (const r of eiaa.rejectedActivationReasons) lines.push(`  - ${r}`);
    }
  } else {
    lines.push('- Not consulted — no missing capability was routed for this build.');
  }
  if (report.humanReviewReason) {
    lines.push('');
    lines.push(`## Human review required`);
    lines.push(report.humanReviewReason);
  }
  lines.push('');
  lines.push('## Capability Matrix');
  lines.push('');
  lines.push(renderCapabilityMatrixMarkdown());
  return lines.join('\n');
}

export function summarizeAttemptHistoryForForensics(history: readonly AeoRepairAttemptRecord[]): string[] {
  return history.map(
    (a) => `Cycle ${a.cycle}: ${a.failureClass} via ${a.capabilityId ?? 'none'} (${a.decision}) — ${a.applied ? 'applied' : 'not applied'}, ${a.succeeded ? 'succeeded' : 'did not succeed'}.`,
  );
}
