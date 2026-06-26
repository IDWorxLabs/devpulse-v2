/**
 * Launch Readiness Authority V2 — launch blocker detection.
 * Blockers are never averaged away — a single blocker prevents approval.
 */

import type {
  LaunchBlockerKind,
  LaunchBlockerRecord,
  LaunchEvidenceCollectionResult,
  LaunchEvidenceSourceRecord,
  LaunchRoutingTarget,
} from './launch-readiness-types.js';

let blockerCounter = 0;

function nextBlockerId(): string {
  blockerCounter += 1;
  return `launch-blocker-${blockerCounter}`;
}

function addBlocker(input: {
  blockers: LaunchBlockerRecord[];
  kind: LaunchBlockerKind;
  severity: LaunchBlockerRecord['severity'];
  source: LaunchEvidenceSourceRecord;
  summary: string;
  routingTarget: LaunchRoutingTarget;
}): void {
  input.blockers.push({
    readOnly: true,
    blockerId: nextBlockerId(),
    kind: input.kind,
    severity: input.severity,
    sourceId: input.source.sourceId,
    evidenceId: input.source.evidenceId,
    summary: input.summary,
    affectedRequirements: input.source.affectedRequirements,
    affectedFeatures: input.source.affectedFeatures,
    routingTarget: input.routingTarget,
  });
}

export function resetLaunchBlockerDetectorForTests(): void {
  blockerCounter = 0;
}

export function detectLaunchBlockers(evidence: LaunchEvidenceCollectionResult): readonly LaunchBlockerRecord[] {
  const blockers: LaunchBlockerRecord[] = [];
  const byId = (id: LaunchEvidenceSourceRecord['sourceId']) =>
    evidence.sources.find((s) => s.sourceId === id);

  for (const source of evidence.sources) {
    if (source.status === 'UNAVAILABLE' || source.status === 'INCOMPLETE') {
      addBlocker({
        blockers,
        kind: source.sourceId === 'EXECUTION_TRACE' ? 'MISSING_EXECUTION_PROOF' : 'EVIDENCE_INCOMPLETE',
        severity: 'CRITICAL',
        source,
        summary: source.blockers[0] ?? `${source.sourceName} evidence incomplete`,
        routingTarget: 'AUTONOMOUS_DEBUGGING',
      });
      continue;
    }

    for (const blockerText of source.blockers) {
      const lower = blockerText.toLowerCase();
      let kind: LaunchBlockerKind = 'UNRESOLVED_REGRESSION';
      let routing: LaunchRoutingTarget = 'AUTONOMOUS_DEBUGGING';

      if (/prompt drift/i.test(lower)) {
        kind = 'PROMPT_DRIFT';
        routing = 'CAPABILITY_PLANNING';
      } else if (/human review|payment capability blocked/i.test(lower)) {
        kind = 'HUMAN_REVIEW_REQUIRED';
        routing = 'HUMAN_REVIEW';
      } else if (/capability evolution|unresolved capability|missing capability/i.test(lower)) {
        kind = 'MISSING_REQUIRED_CAPABILITY';
        routing = 'MISSING_CAPABILITY_EVOLUTION';
      } else if (/repair exhausted|autonomous debugging|unresolved debugging/i.test(lower)) {
        kind = 'UNRESOLVED_AUTONOMOUS_DEBUGGING_FAILURE';
        routing = 'AUTONOMOUS_DEBUGGING';
      } else if (/behavior|scenario/i.test(lower) || source.sourceId === 'BEHAVIOR_SIMULATION') {
        kind = 'FAILED_BEHAVIOR_SCENARIO';
        routing = 'BEHAVIOR_SIMULATION';
      } else if (/journey|virtual user|emergency workflow/i.test(lower) || source.sourceId === 'VIRTUAL_USER') {
        kind = 'FAILED_VIRTUAL_USER_JOURNEY';
        routing = 'VIRTUAL_USER';
      } else if (/device profile|virtual device/i.test(lower) || source.sourceId === 'VIRTUAL_DEVICE') {
        kind = 'FAILED_DEVICE_PROFILE';
        routing = 'VIRTUAL_DEVICE';
      } else if (/interaction|unreachable|button/i.test(lower) || source.sourceId === 'INTERACTION_PROOF') {
        kind = 'FAILED_INTERACTION_PROOF';
        routing = 'INTERACTION_PROOF';
      } else if (/accessibility/i.test(lower) || source.sourceId === 'ACCESSIBILITY_VALIDATION') {
        kind = 'CRITICAL_ACCESSIBILITY_ISSUE';
        routing = 'CONTINUOUS_IMPROVEMENT';
      } else if (/security|payment/i.test(lower) || source.sourceId === 'SECURITY_VALIDATION') {
        kind = 'CRITICAL_SECURITY_ISSUE';
        routing = 'HUMAN_REVIEW';
      } else if (/performance/i.test(lower)) {
        kind = 'CRITICAL_PERFORMANCE_ISSUE';
        routing = 'CONTINUOUS_IMPROVEMENT';
      } else if (/workspace/i.test(lower)) {
        kind = 'WORKSPACE_INCONSISTENCY';
        routing = 'INCREMENTAL_BUILDER';
      } else if (/materialization/i.test(lower)) {
        kind = 'MATERIALIZATION_FAILURE';
        routing = 'INCREMENTAL_BUILDER';
      } else if (/continuous improvement|improvement blocked/i.test(lower)) {
        kind = 'BLOCKED_CONTINUOUS_IMPROVEMENT';
        routing = 'CONTINUOUS_IMPROVEMENT';
      }

      addBlocker({
        blockers,
        kind,
        severity: kind.includes('CRITICAL') || kind === 'HUMAN_REVIEW_REQUIRED' ? 'CRITICAL' : 'HIGH',
        source,
        summary: blockerText,
        routingTarget: routing,
      });
    }

    if (source.status === 'FAIL' && source.blockers.length === 0) {
      const routingMap: Partial<Record<LaunchEvidenceSourceRecord['sourceId'], LaunchRoutingTarget>> = {
        CAPABILITY_PLANNING: 'MISSING_CAPABILITY_EVOLUTION',
        BEHAVIOR_SIMULATION: 'BEHAVIOR_SIMULATION',
        VIRTUAL_USER: 'VIRTUAL_USER',
        VIRTUAL_DEVICE: 'VIRTUAL_DEVICE',
        INTERACTION_PROOF: 'INTERACTION_PROOF',
        AUTONOMOUS_DEBUGGING: 'AUTONOMOUS_DEBUGGING',
        CONTINUOUS_IMPROVEMENT: 'CONTINUOUS_IMPROVEMENT',
        ACCESSIBILITY_VALIDATION: 'CONTINUOUS_IMPROVEMENT',
      };
      addBlocker({
        blockers,
        kind:
          source.sourceId === 'CAPABILITY_PLANNING'
            ? 'MISSING_REQUIRED_CAPABILITY'
            : source.sourceId === 'ACCESSIBILITY_VALIDATION'
              ? 'CRITICAL_ACCESSIBILITY_ISSUE'
              : 'UNRESOLVED_REGRESSION',
        severity: 'HIGH',
        source,
        summary: `${source.sourceName} failed without explicit blocker detail`,
        routingTarget: routingMap[source.sourceId] ?? 'AUTONOMOUS_DEBUGGING',
      });
    }
  }

  const cap = byId('CAPABILITY_PLANNING');
  if (
    cap &&
    cap.blockers.some((b) => /capability evolution|unresolved capability/i.test(b)) &&
    !blockers.some((b) => b.kind === 'MISSING_REQUIRED_CAPABILITY')
  ) {
    addBlocker({
      blockers,
      kind: 'MISSING_REQUIRED_CAPABILITY',
      severity: 'HIGH',
      source: cap,
      summary: cap.blockers[0] ?? 'Capability Planning reports unresolved capability',
      routingTarget: 'MISSING_CAPABILITY_EVOLUTION',
    });
  }

  for (const source of evidence.sources) {
    for (const risk of source.residualRisk.filter((r) => /\bHIGH\b/i.test(r))) {
      addBlocker({
        blockers,
        kind: 'RESIDUAL_HIGH_RISK',
        severity: 'CRITICAL',
        source,
        summary: risk,
        routingTarget: 'CONTINUOUS_IMPROVEMENT',
      });
    }
  }

  const unique = new Map<string, LaunchBlockerRecord>();
  for (const blocker of blockers) {
    unique.set(`${blocker.kind}:${blocker.summary}`, blocker);
  }

  return [...unique.values()];
}
