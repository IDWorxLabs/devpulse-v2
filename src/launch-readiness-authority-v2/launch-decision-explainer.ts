/**
 * Launch Readiness Authority V2 — decision explanation.
 */

import type {
  LaunchBlockerRecord,
  LaunchDecisionExplanation,
  LaunchEvidenceCollectionResult,
  LaunchReadinessVerdict,
  LaunchRoutingTarget,
  LaunchVerdictResult,
} from './launch-readiness-types.js';

const SOURCE_HEADINGS: Record<LaunchEvidenceCollectionResult['sources'][number]['sourceId'], string> = {
  INTENT_UNDERSTANDING: 'Intent Understanding',
  PROMPT_FAITHFULNESS: 'Prompt Faithfulness',
  CAPABILITY_PLANNING: 'Capability Planning',
  MISSING_CAPABILITY_EVOLUTION: 'Missing Capability Evolution',
  INCREMENTAL_BUILD: 'Incremental Build',
  BEHAVIOR_SIMULATION: 'Behavior Simulation',
  VIRTUAL_USER: 'Virtual User',
  VIRTUAL_DEVICE: 'Virtual Device',
  INTERACTION_PROOF: 'Interaction Proof',
  AUTONOMOUS_DEBUGGING: 'Autonomous Debugging',
  CONTINUOUS_IMPROVEMENT: 'Continuous Product Improvement',
  FOUNDER_TEST: 'Founder Test',
  UVL: 'Universal Validation Layer',
  EXECUTION_TRACE: 'Execution Trace',
  WORKSPACE_REALITY: 'Workspace Reality',
  MATERIALIZATION_REALITY: 'Materialization Reality',
  FEATURE_REALITY: 'Feature Reality',
  BUILD_REALITY: 'Build Reality',
  SECURITY_VALIDATION: 'Security Validation',
  PERFORMANCE_VALIDATION: 'Performance Validation',
  ACCESSIBILITY_VALIDATION: 'Accessibility Validation',
};

export function explainLaunchDecision(input: {
  evidence: LaunchEvidenceCollectionResult;
  blockers: readonly LaunchBlockerRecord[];
  verdict: LaunchVerdictResult;
}): LaunchDecisionExplanation {
  const summaryLines: string[] = [];

  if (input.verdict.verdict === 'LAUNCH_READY') {
    summaryLines.push('Evidence validated.');
    summaryLines.push('No blockers.');
    summaryLines.push(`High confidence (${input.verdict.confidence.overallConfidence}).`);
    summaryLines.push('Verdict: LAUNCH_READY');
    summaryLines.push('Live Preview unlocked.');
  } else if (input.verdict.verdict === 'BLOCKED') {
    summaryLines.push('Evidence validation fails.');
    summaryLines.push(`Reason: ${input.verdict.primaryReason}`);
    summaryLines.push(`Verdict: ${input.verdict.verdict}`);
  } else {
    summaryLines.push('Launch blocked because:');
  }

  const grouped = new Map<string, string[]>();
  for (const blocker of input.blockers) {
    const heading = SOURCE_HEADINGS[blocker.sourceId] ?? blocker.sourceId;
    const lines = grouped.get(heading) ?? [];
    lines.push(blocker.summary);
    grouped.set(heading, lines);
  }

  for (const source of input.evidence.sources) {
    if (source.blockers.length && !grouped.has(SOURCE_HEADINGS[source.sourceId] ?? source.sourceId)) {
      grouped.set(SOURCE_HEADINGS[source.sourceId] ?? source.sourceId, [...source.blockers]);
    }
  }

  const blockingSections = [...grouped.entries()].map(([heading, lines]) => ({
    heading,
    lines,
  }));

  return {
    readOnly: true,
    verdict: input.verdict.verdict,
    summaryLines,
    blockingSections,
    recommendedNextAction: input.verdict.requiredNextStep,
    routingTarget: input.verdict.routingTarget,
  };
}

export function formatLaunchDecisionExplanation(explanation: LaunchDecisionExplanation): string {
  const lines = [...explanation.summaryLines];
  if (explanation.blockingSections.length) {
    for (const section of explanation.blockingSections) {
      lines.push('', `${section.heading}:`, ...section.lines.map((l) => `- ${l}`));
    }
  }
  lines.push('', 'Recommended next action:', explanation.recommendedNextAction);
  return lines.join('\n');
}

export function routeUnresolvedIssue(verdict: LaunchReadinessVerdict): LaunchRoutingTarget | null {
  const map: Partial<Record<LaunchReadinessVerdict, LaunchRoutingTarget>> = {
    NEEDS_CAPABILITY_EVOLUTION: 'MISSING_CAPABILITY_EVOLUTION',
    NEEDS_AUTONOMOUS_REPAIR: 'AUTONOMOUS_DEBUGGING',
    NEEDS_HUMAN_REVIEW: 'HUMAN_REVIEW',
    NOT_LAUNCH_READY: 'CONTINUOUS_IMPROVEMENT',
    BLOCKED: 'AUTONOMOUS_DEBUGGING',
  };
  return map[verdict] ?? null;
}
