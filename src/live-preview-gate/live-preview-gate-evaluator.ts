/**
 * Live Preview Gate — gate evaluation.
 */

import type {
  LivePreviewEvidenceCollectionResult,
  LivePreviewEvidenceItem,
  LivePreviewEvidenceSourceId,
} from './live-preview-gate-types.js';

export interface LivePreviewGateEvaluationResult {
  readOnly: true;
  allRequiredPassed: boolean;
  primaryBlockingGate: LivePreviewEvidenceSourceId | null;
  blockingEvidence: readonly string[];
  passedGates: readonly string[];
  failedGates: readonly string[];
  warnings: readonly string[];
}

const REQUIRED_FOR_UNLOCK: readonly LivePreviewEvidenceSourceId[] = [
  'INTENT_UNDERSTANDING',
  'PROMPT_FAITHFULNESS',
  'CAPABILITY_PLANNING',
  'MISSING_CAPABILITY_EVOLUTION',
  'INCREMENTAL_BUILD',
  'BEHAVIOR_SIMULATION',
  'VIRTUAL_USER',
  'VIRTUAL_DEVICE',
  'INTERACTION_PROOF',
  'AUTONOMOUS_DEBUGGING',
  'CONTINUOUS_IMPROVEMENT',
  'LAUNCH_READINESS_AUTHORITY_V2',
];

function isGatePassed(item: LivePreviewEvidenceItem): boolean {
  if (item.source === 'MISSING_CAPABILITY_EVOLUTION' || item.source === 'AUTONOMOUS_DEBUGGING') {
    return item.status === 'PASS' || item.status === 'NOT_REQUIRED' || item.status === 'WARNING';
  }
  return item.status === 'PASS' || item.status === 'NOT_REQUIRED';
}

function isGateBlocking(item: LivePreviewEvidenceItem): boolean {
  return item.status === 'FAIL' || item.status === 'UNAVAILABLE' || item.status === 'INCOMPLETE';
}

export function evaluateLivePreviewGates(
  evidence: LivePreviewEvidenceCollectionResult,
): LivePreviewGateEvaluationResult {
  const passedGates: string[] = [];
  const failedGates: string[] = [];
  const warnings: string[] = [];
  let primaryBlockingGate: LivePreviewEvidenceSourceId | null = null;
  const blockingEvidence: string[] = [];

  for (const item of evidence.items) {
    if (isGatePassed(item)) {
      passedGates.push(item.sourceName);
    } else if (isGateBlocking(item)) {
      failedGates.push(item.sourceName);
      if (!primaryBlockingGate) primaryBlockingGate = item.source;
      blockingEvidence.push(...item.blockers.slice(0, 2));
    } else if (item.status === 'WARNING') {
      passedGates.push(item.sourceName);
      warnings.push(...item.warnings.slice(0, 2));
    }
  }

  for (const missing of evidence.missingSources) {
    failedGates.push(SOURCE_LABEL[missing] ?? missing);
    if (!primaryBlockingGate) primaryBlockingGate = missing;
    blockingEvidence.push(`${missing} evidence missing`);
  }

  const requiredItems = evidence.items.filter((i) => REQUIRED_FOR_UNLOCK.includes(i.source));
  const allRequiredPassed = requiredItems.every(isGatePassed) && evidence.missingSources.length === 0;

  return {
    readOnly: true,
    allRequiredPassed,
    primaryBlockingGate,
    blockingEvidence,
    passedGates,
    failedGates,
    warnings,
  };
}

const SOURCE_LABEL: Partial<Record<LivePreviewEvidenceSourceId, string>> = {
  INTENT_UNDERSTANDING: 'Intent Understanding Engine',
  PROMPT_FAITHFULNESS: 'Prompt Faithfulness Engine V2',
  CAPABILITY_PLANNING: 'Capability Planning Engine',
  MISSING_CAPABILITY_EVOLUTION: 'Missing Capability Evolution Engine',
  INCREMENTAL_BUILD: 'Incremental Autonomous Builder',
  BEHAVIOR_SIMULATION: 'Behavior Simulation Engine',
  VIRTUAL_USER: 'Virtual User Engine',
  VIRTUAL_DEVICE: 'Virtual Device Laboratory',
  INTERACTION_PROOF: 'Interaction Proof Engine',
  AUTONOMOUS_DEBUGGING: 'Autonomous Debugging Engine',
  CONTINUOUS_IMPROVEMENT: 'Continuous Product Improvement Engine',
  LAUNCH_READINESS_AUTHORITY_V2: 'Launch Readiness Authority V2',
  EXECUTION_TRACE: 'Execution Trace',
};

export function isLaunchAuthorityReady(evidence: LivePreviewEvidenceCollectionResult): boolean {
  const launch = evidence.items.find((i) => i.source === 'LAUNCH_READINESS_AUTHORITY_V2');
  return launch?.verdict === 'LAUNCH_READY' && launch.status === 'PASS';
}
