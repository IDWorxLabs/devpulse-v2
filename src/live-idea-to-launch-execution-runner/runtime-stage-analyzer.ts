/**
 * RUNTIME stage analyzer — runtime activation, preview, health checks.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
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

export function analyzeRuntimeStage(input: {
  runtimeProof: RuntimeActivationProofReport | null;
  previewProof: PreviewExperienceProofReport | null;
  executionProof: AutonomousBuildExecutionProofReport | null;
  validationConfirmed: boolean;
}): StageAnalysis {
  const evidence: StageEvidenceEntry[] = [];
  const missingEvidence: string[] = [];
  const weakEvidence: string[] = [];
  const sources: string[] = [];
  let score = 0;

  if (!input.validationConfirmed) {
    missingEvidence.push('VALIDATION stage not confirmed — runtime cannot be proven');
  }

  if (input.runtimeProof) {
    sources.push('connected-runtime-activation-proof');
    evidence.push(
      entry(
        'Runtime proof level',
        input.runtimeProof.runtimeProofLevel,
        input.runtimeProof.runtimeProofLevel === 'PROVEN',
        'connected-runtime-activation-proof',
      ),
      entry(
        'Process observed',
        input.runtimeProof.process.processState,
        input.runtimeProof.process.processState === 'STARTED',
        'connected-runtime-activation-proof',
      ),
      entry(
        'Health check',
        input.runtimeProof.health.healthState,
        input.runtimeProof.health.healthState === 'HEALTHY',
        'connected-runtime-activation-proof',
      ),
      entry(
        'Runtime linkage',
        String(input.runtimeProof.linkage.runtimeLinkageConnected),
        input.runtimeProof.linkage.runtimeLinkageConnected,
        'connected-runtime-activation-proof',
      ),
    );
    if (input.runtimeProof.runtimeProofLevel === 'PROVEN') score += 40;
    else if (input.runtimeProof.runtimeProofLevel === 'PARTIAL') score += 22;
    else missingEvidence.push('Runtime activation not proven');
    missingEvidence.push(...input.runtimeProof.missingEvidence.slice(0, 2));
  } else {
    missingEvidence.push('Connected runtime activation proof not assessed');
    weakEvidence.push('Build artifact alone does not confirm runtime');
  }

  if (input.previewProof) {
    sources.push('connected-preview-experience-proof');
    evidence.push(
      entry(
        'Preview proof level',
        input.previewProof.previewProofLevel,
        input.previewProof.previewProofLevel === 'PROVEN',
        'connected-preview-experience-proof',
      ),
      entry(
        'Preview URL reachable',
        String(input.previewProof.url.urlReachable),
        input.previewProof.url.urlReachable,
        'connected-preview-experience-proof',
      ),
    );
    if (input.previewProof.previewProofLevel === 'PROVEN') score += 35;
    else if (input.previewProof.previewProofLevel === 'PARTIAL') score += 18;
  } else {
    missingEvidence.push('Connected preview experience proof not assessed');
  }

  const runtimeStage = input.executionProof?.stageProofs.find((s) => s.stage === 'RUNTIME');
  const previewStage = input.executionProof?.stageProofs.find((s) => s.stage === 'PREVIEW');
  if (runtimeStage || previewStage) {
    sources.push('autonomous-build-execution-proof');
    if (runtimeStage) {
      evidence.push(entry('Execution proof RUNTIME', runtimeStage.proofLevel, runtimeStage.proofLevel === 'PROVEN', 'autonomous-build-execution-proof'));
      if (runtimeStage.proofLevel === 'PROVEN') score = Math.max(score, 85);
    }
    if (previewStage) {
      evidence.push(entry('Execution proof PREVIEW', previewStage.proofLevel, previewStage.proofLevel === 'PROVEN', 'autonomous-build-execution-proof'));
      if (previewStage.proofLevel === 'PROVEN') score = Math.max(score, 90);
    }
  }

  score = Math.min(100, score);
  let evidenceLevel: StageEvidenceLevel = 'MISSING';
  if (!input.validationConfirmed) evidenceLevel = 'BLOCKED';
  else if (score >= STAGE_CONFIRM_THRESHOLD) evidenceLevel = 'CONFIRMED';
  else if (score >= STAGE_PARTIAL_THRESHOLD) evidenceLevel = 'PARTIAL';

  const confirmed =
    evidenceLevel === 'CONFIRMED' &&
    input.runtimeProof?.runtimeProofLevel === 'PROVEN' &&
    input.previewProof?.previewProofLevel === 'PROVEN';

  return {
    readOnly: true,
    stage: 'RUNTIME',
    evidenceLevel,
    confirmed,
    score,
    sourceAuthorities: [...new Set(sources)],
    evidence,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 8),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 6),
    recommendedFix: confirmed
      ? 'Runtime and preview confirmed — proceed to launch readiness proof.'
      : 'Prove connected runtime activation and preview experience with session evidence.',
  };
}
