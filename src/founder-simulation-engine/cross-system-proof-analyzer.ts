/**
 * Cross-System Proof Analyzer — system-wide integration proof (V1).
 */

import type {
  FounderSimulationStageResult,
  SystemIntegrationProof,
} from './founder-simulation-types.js';

const STAGE_TO_AUTHORITY: Record<string, string> = {
  UPLOAD_SYSTEM: 'upload-system',
  VISUAL_REFERENCE_INTELLIGENCE: 'visual-reference-intelligence',
  VOICE_NOTES_INTELLIGENCE: 'voice-notes-intelligence',
  REQUIREMENT_COMPLETENESS_INTELLIGENCE: 'requirement-completeness-intelligence',
  UNIFIED_INTAKE_INTELLIGENCE: 'unified-intake-intelligence',
  PLANNING_GATE_AUTHORITY: 'planning-gate-authority',
  PLANNING_BRIEF_GENERATOR: 'planning-brief-generator',
  ARCHITECTURE_BRIEF_GENERATOR: 'architecture-brief-generator',
  BUILD_PLAN_GENERATOR: 'build-plan-generator',
  FOUNDER_TEST_AUTOMATION: 'founder-test-automation',
  FINAL_FOUNDER_READINESS_VERDICT: 'founder-simulation-engine',
};

export function buildSystemIntegrationProof(
  stageResults: readonly FounderSimulationStageResult[],
): SystemIntegrationProof {
  const authoritiesReached: string[] = [];
  const authoritiesPassed: string[] = [];
  const authoritiesFailed: string[] = [];
  const weakLinks: string[] = [];
  const strongestEvidence: string[] = [];
  const launchBlockers: string[] = [];

  for (const stage of stageResults) {
    const authority = STAGE_TO_AUTHORITY[stage.stageId] ?? stage.stageId;
    if (stage.status === 'SKIPPED') continue;
    authoritiesReached.push(authority);
    if (stage.status === 'PASSED') {
      authoritiesPassed.push(authority);
      if ((stage.confidence ?? 0) >= 75) strongestEvidence.push(`${authority}:${stage.confidence}`);
    } else if (stage.status === 'FAILED' || stage.status === 'BLOCKED') {
      authoritiesFailed.push(authority);
      launchBlockers.push(`${authority}: ${stage.failureReason ?? stage.status}`);
    } else if (stage.status === 'LOW_CONFIDENCE') {
      weakLinks.push(`${authority}: confidence ${stage.confidence ?? 'unknown'}`);
      authoritiesPassed.push(authority);
    }
  }

  const expectedAuthorities = Object.values(STAGE_TO_AUTHORITY).filter((a) => a !== 'founder-simulation-engine');
  const missingIntegrations = expectedAuthorities.filter((a) => !authoritiesReached.includes(a));

  return {
    readOnly: true,
    authoritiesReached,
    authoritiesPassed,
    authoritiesFailed,
    missingIntegrations,
    weakLinks,
    strongestEvidence,
    launchBlockers,
  };
}

export function mergeSystemIntegrationProofs(
  proofs: readonly SystemIntegrationProof[],
): SystemIntegrationProof {
  const mergeUnique = (lists: readonly (readonly string[])[]) => [...new Set(lists.flat())];
  return {
    readOnly: true,
    authoritiesReached: mergeUnique(proofs.map((p) => p.authoritiesReached)),
    authoritiesPassed: mergeUnique(proofs.map((p) => p.authoritiesPassed)),
    authoritiesFailed: mergeUnique(proofs.map((p) => p.authoritiesFailed)),
    missingIntegrations: mergeUnique(proofs.map((p) => p.missingIntegrations)),
    weakLinks: mergeUnique(proofs.map((p) => p.weakLinks)),
    strongestEvidence: mergeUnique(proofs.map((p) => p.strongestEvidence)).slice(0, 10),
    launchBlockers: mergeUnique(proofs.map((p) => p.launchBlockers)),
  };
}
