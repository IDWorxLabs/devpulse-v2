/**
 * LAUNCH stage analyzer — launch council, founder sweep, launch readiness assessments.
 */

import type { ConnectedLaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import type { FounderTestLaunchReadinessReport } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import { STAGE_CONFIRM_THRESHOLD, STAGE_PARTIAL_THRESHOLD } from './live-idea-to-launch-execution-runner-registry.js';
import type {
  StageAnalysis,
  StageEvidenceEntry,
  StageEvidenceLevel,
} from './live-idea-to-launch-execution-runner-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeLaunchStage(input: {
  launchReadinessProof: ConnectedLaunchReadinessProofReport | null;
  founderLaunchReadiness: FounderTestLaunchReadinessReport | null;
  executionProof: AutonomousBuildExecutionProofReport | null;
  runtimeConfirmed: boolean;
}): StageAnalysis {
  const evidence: StageEvidenceEntry[] = [];
  const missingEvidence: string[] = [];
  const weakEvidence: string[] = [];
  const sources: string[] = [];
  let score = 0;

  if (!input.runtimeConfirmed) {
    missingEvidence.push('RUNTIME stage not confirmed — launch readiness cannot be proven');
  }

  if (input.launchReadinessProof) {
    sources.push('connected-launch-readiness-proof');
    evidence.push(
      entry(
        'Launch proof level',
        input.launchReadinessProof.launchProofLevel,
        input.launchReadinessProof.launchProofLevel === 'PROVEN',
        'connected-launch-readiness-proof',
      ),
      entry(
        'Launch state',
        input.launchReadinessProof.launchState,
        input.launchReadinessProof.launchState === 'READY' ||
          input.launchReadinessProof.launchState === 'READY_WITH_WARNINGS',
        'connected-launch-readiness-proof',
      ),
      entry(
        'Critical blockers',
        String(input.launchReadinessProof.blockers.criticalCount),
        input.launchReadinessProof.blockers.criticalCount === 0,
        'connected-launch-readiness-proof',
      ),
      entry(
        'Launch linkage',
        String(input.launchReadinessProof.linkage.launchLinkageConnected),
        input.launchReadinessProof.linkage.launchLinkageConnected,
        'connected-launch-readiness-proof',
      ),
    );
    if (input.launchReadinessProof.launchProofLevel === 'PROVEN') score += 50;
    else if (input.launchReadinessProof.launchProofLevel === 'PARTIAL') score += 28;
    else missingEvidence.push('Launch readiness proof not proven');
    if (input.launchReadinessProof.blockers.criticalCount > 0) {
      weakEvidence.push(`${input.launchReadinessProof.blockers.criticalCount} critical launch blocker(s)`);
    }
    missingEvidence.push(...input.launchReadinessProof.missingEvidence.slice(0, 3));
  } else {
    missingEvidence.push('Connected launch readiness proof not assessed');
  }

  if (input.founderLaunchReadiness) {
    sources.push('founder-test-launch-readiness');
    evidence.push(
      entry(
        'Founder launch verdict',
        input.founderLaunchReadiness.launchReadinessVerdict,
        input.founderLaunchReadiness.launchReadinessVerdict.startsWith('LAUNCH_READY'),
        'founder-test-launch-readiness',
      ),
      entry(
        'Execution chain connected',
        String(input.founderLaunchReadiness.executionChainConnected),
        input.founderLaunchReadiness.executionChainConnected,
        'founder-test-launch-readiness',
      ),
    );
    if (input.founderLaunchReadiness.launchReadinessVerdict === 'LAUNCH_READY') score += 25;
    else if (input.founderLaunchReadiness.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS') score += 15;
    if (input.founderLaunchReadiness.topBlockers.length > 0) {
      weakEvidence.push(`${input.founderLaunchReadiness.topBlockers.length} founder test blocker(s)`);
    }
  }

  const launchStage = input.executionProof?.stageProofs.find((s) => s.stage === 'LAUNCH');
  if (launchStage) {
    sources.push('autonomous-build-execution-proof');
    evidence.push(
      entry('Execution proof LAUNCH stage', launchStage.proofLevel, launchStage.proofLevel === 'PROVEN', 'autonomous-build-execution-proof'),
    );
    if (launchStage.proofLevel === 'PROVEN') score = Math.max(score, 95);
  }

  score = Math.min(100, score);
  let evidenceLevel: StageEvidenceLevel = 'MISSING';
  if (!input.runtimeConfirmed) evidenceLevel = 'BLOCKED';
  else if (score >= STAGE_CONFIRM_THRESHOLD) evidenceLevel = 'CONFIRMED';
  else if (score >= STAGE_PARTIAL_THRESHOLD) evidenceLevel = 'PARTIAL';

  const confirmed =
    evidenceLevel === 'CONFIRMED' &&
    input.launchReadinessProof?.launchProofLevel === 'PROVEN' &&
    input.launchReadinessProof.blockers.criticalCount === 0;

  return {
    readOnly: true,
    stage: 'LAUNCH',
    evidenceLevel,
    confirmed,
    score,
    sourceAuthorities: [...new Set(sources)],
    evidence,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 8),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 6),
    recommendedFix: confirmed
      ? 'Launch readiness proven with connected evidence.'
      : 'Resolve launch blockers and prove connected launch readiness before release claims.',
  };
}
