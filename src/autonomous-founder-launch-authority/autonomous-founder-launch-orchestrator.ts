/**
 * Autonomous Founder Launch Authority V1 — orchestrator with autofix retry loop.
 */

import {
  AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN,
  DEFAULT_AUTOFIX_MAX_RETRIES,
} from './autonomous-founder-launch-authority-registry.js';
import type {
  AutonomousFounderLaunchAssessment,
  RunAutonomousFounderLaunchAuthorityInput,
} from './autonomous-founder-launch-authority-types.js';
import { formatAutonomousFounderLaunchReportMarkdown } from './autonomous-founder-launch-report.js';
import { dispatchFounderRemediationToAutofix } from './founder-autofix-integration.js';
import { collectFounderLaunchEvidence } from './founder-evidence-collector.js';
import { evaluateInvisibleFounderLaunchTrigger } from './founder-invisible-trigger.js';
import { resolveFounderLaunchPhaseDuringPipeline, resolveFounderLaunchUserLabel } from './founder-launch-user-surface.js';
import { buildFounderRemediationPlan } from './founder-remediation-plan.js';
import { runFounderReviewerPanel } from './founder-reviewer-engine.js';
import { buildAutonomousFounderLaunchAssessment } from './founder-verdict-engine.js';

let lastAssessment: AutonomousFounderLaunchAssessment | null = null;

export function getLastAutonomousFounderLaunchAssessment(): AutonomousFounderLaunchAssessment | null {
  return lastAssessment;
}

export function resetAutonomousFounderLaunchAssessmentForTests(): void {
  lastAssessment = null;
}

export function areFounderLaunchPrerequisitesMet(
  evidence: ReturnType<typeof collectFounderLaunchEvidence>,
): boolean {
  return evidence.allPrerequisitesPassed;
}

function emitPhase(
  input: RunAutonomousFounderLaunchAuthorityInput,
  phase: 'build' | 'test' | 'fix' | 'review',
): void {
  const userPhase = resolveFounderLaunchPhaseDuringPipeline(phase);
  const label = resolveFounderLaunchUserLabel(userPhase);
  input.onUserPhase?.(userPhase, label);
}

function assessOnce(input: RunAutonomousFounderLaunchAuthorityInput): AutonomousFounderLaunchAssessment {
  const evidence = collectFounderLaunchEvidence({
    projectRootDir: input.projectRootDir ?? process.cwd(),
    workspaceDir: input.workspaceDir ?? null,
    buildReality: input.buildReality,
    blueprintStructure: input.blueprintStructure,
    productPrompt: input.productPrompt ?? null,
    profile: input.profile ?? null,
    synthesizeLaunchReadiness: true,
    useRegisteredProductArchitecture: input.useRegisteredProductArchitecture,
    useRegisteredVerificationHub: input.useRegisteredVerificationHub,
  });

  const reviewers = runFounderReviewerPanel(evidence);
  const remediationPlan = buildFounderRemediationPlan({
    evidence,
    reviewers,
    maxRetries: input.maxAutofixRetries ?? DEFAULT_AUTOFIX_MAX_RETRIES,
    retryAttempt: 0,
  });

  const assessment = buildAutonomousFounderLaunchAssessment({
    evidence,
    reviewers,
    remediationPlan,
    contractId: input.contractId,
    productName: input.productName,
    reportMarkdown: '',
  });
  assessment.reportMarkdown = formatAutonomousFounderLaunchReportMarkdown(assessment);
  return assessment;
}

export function runAutonomousFounderLaunchAuthority(
  input: RunAutonomousFounderLaunchAuthorityInput = {},
): AutonomousFounderLaunchAssessment {
  emitPhase(input, 'review');

  const assessment = assessOnce(input);

  if (
    assessment.verdict === 'NEEDS_AUTOFIX' &&
    !input.skipAutofix &&
    assessment.remediationPlan
  ) {
    emitPhase(input, 'fix');
    dispatchFounderRemediationToAutofix(assessment.remediationPlan);
  }

  lastAssessment = assessment;
  return assessment;
}

/** Alias for callers expecting assess* naming. */
export const assessAutonomousFounderLaunchAuthority = runAutonomousFounderLaunchAuthority;

export async function runAutonomousFounderLaunchAuthorityWithRetries(
  input: RunAutonomousFounderLaunchAuthorityInput = {},
): Promise<AutonomousFounderLaunchAssessment> {
  const maxRetries = input.maxAutofixRetries ?? DEFAULT_AUTOFIX_MAX_RETRIES;
  let attempt = 0;
  let last = runAutonomousFounderLaunchAuthority({ ...input, skipAutofix: true });

  while (last.verdict === 'NEEDS_AUTOFIX' && attempt < maxRetries && !input.skipAutofix) {
    attempt += 1;
    if (last.remediationPlan) {
      emitPhase(input, 'fix');
      dispatchFounderRemediationToAutofix(last.remediationPlan);
    }
    last = runAutonomousFounderLaunchAuthority({
      ...input,
      skipAutofix: attempt >= maxRetries,
    });
  }

  lastAssessment = last;
  return last;
}

export function maybeRunAutonomousFounderLaunchAuthority(
  input: RunAutonomousFounderLaunchAuthorityInput = {},
): AutonomousFounderLaunchAssessment | null {
  emitPhase(input, 'test');

  const trigger = evaluateInvisibleFounderLaunchTrigger({
    projectRootDir: process.cwd(),
    workspaceDir: input.workspaceDir ?? null,
  });

  if (!trigger.shouldRun) {
    return null;
  }

  emitPhase(input, 'review');
  const assessment = runAutonomousFounderLaunchAuthority(input);
  lastAssessment = assessment;
  return assessment;
}

export { AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN };
