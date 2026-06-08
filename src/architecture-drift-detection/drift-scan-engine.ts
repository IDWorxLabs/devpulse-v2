/**
 * Drift scan engine — scans expected rules vs observed signals for drift.
 * Detection only. No auto-fix.
 */

import type { DriftAnalysisInput, DriftSeverity, DriftType } from './types.js';
import { nextDriftFindingId, SIGNAL_TO_DRIFT_TYPE } from './types.js';
import type { DriftFinding } from './types.js';
import type { ExpectedRulesResult } from './expected-rules-engine.js';
import type { ObservedSignalsResult } from './observed-signals-engine.js';

export interface DriftScanResult {
  scanComplete: boolean;
  findings: DriftFinding[];
  cleanScan: boolean;
}

export function driftScanKey(findings: DriftFinding[]): string {
  return findings.map((f) => `${f.driftType}:${f.driftSeverity}`).sort().join(';') || 'no-drift';
}

function matchSignalToDrift(signal: string): { driftType: DriftType; defaultSeverity: DriftSeverity; matchedPattern: string } | null {
  const lower = signal.toLowerCase();
  for (const mapping of SIGNAL_TO_DRIFT_TYPE) {
    for (const pattern of mapping.patterns) {
      if (lower.includes(pattern)) {
        return { driftType: mapping.driftType, defaultSeverity: mapping.defaultSeverity, matchedPattern: pattern };
      }
    }
  }
  return null;
}

function extractAffectedSystems(signal: string, driftType: DriftType): string[] {
  const systems: string[] = [];
  const lower = signal.toLowerCase();

  const domainPatterns: Array<[string, string]> = [
    ['world2_learning', 'world2_learning_loop'],
    ['self_learning', 'self_learning_engine'],
    ['missing_capability', 'missing_capability_detector'],
    ['safe_capability', 'safe_capability_acquisition'],
    ['mobile_command', 'mobile_command_foundation'],
    ['mobile_chat', 'mobile_chat_interface'],
    ['mobile_preview', 'mobile_live_preview_foundation'],
    ['mobile_approval', 'mobile_approval_flow_foundation'],
    ['execution_authority', 'execution_authority'],
    ['controlled_execution', 'controlled_execution_bridge'],
    ['verification_gated', 'verification_gated_apply'],
    ['chat_authority', 'chat_authority'],
  ];

  for (const [pattern, system] of domainPatterns) {
    if (lower.includes(pattern)) systems.push(system);
  }

  if (systems.length === 0) {
    systems.push(driftType.replace('_DRIFT', '').toLowerCase());
  }

  return systems;
}

export function scanArchitectureDrift(
  input: DriftAnalysisInput,
  expected: ExpectedRulesResult,
  observed: ObservedSignalsResult,
  blocked: boolean,
): DriftScanResult {
  if (blocked) {
    return { scanComplete: false, findings: [], cleanScan: false };
  }

  const findings: DriftFinding[] = [];
  const seenTypes = new Set<DriftType>();

  for (const signal of observed.evaluatedSignals) {
    const match = matchSignalToDrift(signal);
    if (match && !seenTypes.has(match.driftType)) {
      seenTypes.add(match.driftType);
      findings.push({
        driftFindingId: nextDriftFindingId(),
        driftType: match.driftType,
        driftSeverity: match.defaultSeverity,
        driftReason: `Observed signal indicates ${match.driftType.replace(/_/g, ' ').toLowerCase()}: matched "${match.matchedPattern}"`,
        driftEvidence: [signal, `pattern:${match.matchedPattern}`],
        affectedSystems: extractAffectedSystems(signal, match.driftType),
        recommendedReview: `Review ${match.driftType.replace(/_/g, ' ').toLowerCase()} before it becomes dangerous`,
        recommendedAction: 'Human architecture review required — no auto-fix performed',
      });
    }
  }

  for (const violation of expected.ruleViolations) {
    const driftType: DriftType = violation.includes('owner') ? 'DUPLICATE_OWNERSHIP_DRIFT' : 'DEPENDENCY_DRIFT';
    if (!seenTypes.has(driftType)) {
      seenTypes.add(driftType);
      findings.push({
        driftFindingId: nextDriftFindingId(),
        driftType,
        driftSeverity: 'HIGH',
        driftReason: `Expected rule violation: ${violation}`,
        driftEvidence: [violation],
        affectedSystems: ['ownership-registry'],
        recommendedReview: 'Review ownership registry integrity',
        recommendedAction: 'Human architecture review required — no auto-fix performed',
      });
    }
  }

  const allClean = observed.signalFlags.every((f) => f.startsWith('CLEAN_SIGNAL'));
  if (findings.length === 0 && allClean) {
    return { scanComplete: true, findings: [], cleanScan: true };
  }

  return { scanComplete: true, findings, cleanScan: findings.length === 0 };
}
