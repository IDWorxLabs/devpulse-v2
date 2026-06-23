/**
 * Phase 27.02 — Degradation root cause classifier (V1).
 */

import type {
  DegradationRootCauseClass,
  DegradationSignalKind,
  FounderSimulationAuthorityProfile,
  FounderSimulationDegradationFinding,
  FounderSimulationDegradationSignal,
  FounderSimulationSubstepProfile,
} from './founder-simulation-degradation-root-cause-types.js';

function classifySignalRootCause(signal: FounderSimulationDegradationSignal): DegradationRootCauseClass {
  switch (signal.kind) {
    case 'RUNTIME_EXCEEDS_BUDGET':
      return 'SIMULATION_BUDGET_EXCEEDED';
    case 'TIMEOUT_RECOVERY':
      return 'AUTHORITY_TIMEOUT';
    case 'RECURSION_GUARD':
      return 'RECURSION_GUARD_TRIGGERED';
    case 'FALLBACK_PATH':
      return 'FALLBACK_PATH_USED';
    case 'WARNING_COMPLETION':
      return 'WARNING_COMPLETION_PATH';
    case 'REPAIR_PLANNER':
    case 'PAYLOAD_GUARD_DEGRADED':
      return 'REPORT_GENERATION_OVERHEAD';
    case 'DEGRADED_COMPLETION_PATH':
      return 'WARNING_COMPLETION_PATH';
    default:
      return 'UNKNOWN';
  }
}

function recommendRepair(input: {
  rootCause: DegradationRootCauseClass;
  authority: string;
}): string {
  switch (input.rootCause) {
    case 'SIMULATION_BUDGET_EXCEEDED':
      return 'Reduce bounded chat stress scenarios or cache product readiness evidence before Founder Test run.';
    case 'AUTHORITY_TIMEOUT':
      return `Add timeout recovery boundary or cache prior assessment for ${input.authority}.`;
    case 'HEAVY_ORCHESTRATION':
      return `Cache hydrated execution proof input for ${input.authority} and skip redundant nested assess calls.`;
    case 'RECURSION_GUARD_TRIGGERED':
      return 'Break authority recursion by injecting pre-assessed bridge snapshots at sync boundaries.';
    case 'FALLBACK_PATH_USED':
      return `Replace fallback snapshot with live runtime bridge consumption in ${input.authority}.`;
    case 'WARNING_COMPLETION_PATH':
      return 'Resolve upstream warning source before allowing clean FOUNDER_SIMULATION_COMPLETE emission.';
    case 'BLOCKING_SYNC_OPERATION':
      return 'Move blocking sync orchestration off the Founder Simulation hot path.';
    case 'REPORT_GENERATION_OVERHEAD':
      return 'Defer non-critical report markdown assembly until after completion boundary emission.';
    case 'RESULT_STORE_DELAY':
      return 'Persist diagnostic handoff before heavy report generation begins.';
    default:
      return `Profile ${input.authority} with runtime trace capture and reduce hot-path work.`;
  }
}

export function classifyDegradationRootCauses(input: {
  signals: readonly FounderSimulationDegradationSignal[];
  slowestAuthority: FounderSimulationAuthorityProfile | null;
  slowestSubstep: FounderSimulationSubstepProfile | null;
  warningCompletionAuthority: string | null;
  totalRuntimeMs: number;
}): FounderSimulationDegradationFinding[] {
  const findings: FounderSimulationDegradationFinding[] = [];

  for (const signal of input.signals) {
    const rootCause = classifySignalRootCause(signal);
    const authority =
      signal.stageId === 'FOUNDER_SIMULATION_ENGINE'
        ? (input.warningCompletionAuthority ?? 'Founder Simulation Completion Boundary')
        : (input.slowestAuthority?.authorityName ?? signal.operationId ?? 'Unknown Authority');

    findings.push({
      readOnly: true,
      rootCause,
      authority,
      substep: signal.operationId,
      elapsedMs: input.slowestSubstep?.elapsedMs ?? input.slowestAuthority?.elapsedMs ?? 0,
      runtimePercent: input.slowestAuthority?.runtimePercent ?? 0,
      impact: `${rootCause} detected during Founder Simulation`,
      recommendedRepair: recommendRepair({ rootCause, authority }),
      warningPathEmitter: signal.kind === 'WARNING_COMPLETION' || signal.kind === 'DEGRADED_COMPLETION_PATH',
    });
  }

  if (input.slowestAuthority && input.slowestAuthority.runtimePercent >= 40) {
    findings.push({
      readOnly: true,
      rootCause: 'HEAVY_ORCHESTRATION',
      authority: input.slowestAuthority.authorityName,
      substep: input.slowestSubstep?.substepId ?? null,
      elapsedMs: input.slowestAuthority.elapsedMs,
      runtimePercent: input.slowestAuthority.runtimePercent,
      impact: `${Math.round(input.slowestAuthority.runtimePercent)}% of Founder Simulation runtime`,
      recommendedRepair: recommendRepair({
        rootCause: 'HEAVY_ORCHESTRATION',
        authority: input.slowestAuthority.authorityName,
      }),
      warningPathEmitter: false,
    });
  }

  if (!findings.length && input.slowestAuthority) {
    findings.push({
      readOnly: true,
      rootCause: 'UNKNOWN',
      authority: input.slowestAuthority.authorityName,
      substep: input.slowestSubstep?.substepId ?? null,
      elapsedMs: input.slowestAuthority.elapsedMs,
      runtimePercent: input.slowestAuthority.runtimePercent,
      impact: 'Degraded completion without explicit signal — inspect slowest authority',
      recommendedRepair: recommendRepair({
        rootCause: 'HEAVY_ORCHESTRATION',
        authority: input.slowestAuthority.authorityName,
      }),
      warningPathEmitter: false,
    });
  }

  return dedupeFindings(findings);
}

function dedupeFindings(findings: FounderSimulationDegradationFinding[]): FounderSimulationDegradationFinding[] {
  const seen = new Set<string>();
  const out: FounderSimulationDegradationFinding[] = [];
  for (const finding of findings) {
    const key = `${finding.rootCause}:${finding.authority}:${finding.substep ?? 'none'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}

export function resolveWarningCompletionAuthority(
  signals: readonly FounderSimulationDegradationSignal[],
): string | null {
  const warning = signals.find(
    (s) =>
      s.kind === 'WARNING_COMPLETION' &&
      (s.operationId === 'FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS' ||
        s.operationId === 'founder-simulation-payload-guard'),
  );
  if (warning?.operationId === 'founder-simulation-payload-guard') {
    return 'Founder Simulation Payload Guard';
  }
  if (warning) return 'Founder Simulation Completion Boundary';
  return null;
}
