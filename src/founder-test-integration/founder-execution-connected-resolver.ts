/**
 * Phase 25.34 — Resolve bounded executionConnected from Founder Execution Proof (25.31).
 * Read-only — no optimistic pass logic.
 */

import type { FounderExecutionProofAssessment } from '../founder-execution-proof/founder-execution-proof-types.js';
import type { AssessFounderExecutionProofInput } from '../founder-execution-proof/founder-execution-proof-types.js';
import { assessFounderExecutionProof } from '../founder-execution-proof/founder-execution-proof-authority.js';
import { isControlledBuilderExecutionConnected } from '../controlled-builder-execution-engine/controlled-builder-execution-authority.js';
import {
  hydrateRuntimeFounderExecutionProofInput,
  hydrateRuntimeFounderExecutionProofInputSync,
  type HydratedRuntimeFounderExecutionProofInput,
  type RuntimeFounderExecutionProofHydration,
} from './runtime-founder-execution-proof-hydration.js';

export type {
  HydratedRuntimeFounderExecutionProofInput,
  RuntimeFounderExecutionProofHydration,
  RuntimeProofHydrationSource,
} from './runtime-founder-execution-proof-hydration.js';

export interface ResolveFounderExecutionConnectedInput {
  founderExecutionProofAssessment?: FounderExecutionProofAssessment | null;
  founderExecutionProofInput?: AssessFounderExecutionProofInput;
}

export interface ResolvedFounderExecutionConnected {
  readOnly: true;
  executionConnected: boolean;
  source:
    | 'founder-execution-proof-25.31'
    | 'founder-execution-proof-25.31-with-controlled-builder'
    | 'not-proven'
    | 'missing-proof';
  proofId: string | null;
  founderExecutionProven: boolean;
  resolvedAt: string;
}

function hasCriticalExecutionProofBlocker(assessment: FounderExecutionProofAssessment): boolean {
  if (assessment.report.founderExecutionState === 'FOUNDER_EXECUTION_BLOCKED') {
    return true;
  }
  if (assessment.report.blockingReasons.some((reason) => /critical|blocked|failed/i.test(reason))) {
    return true;
  }
  return assessment.report.topBlockers.some((blocker) =>
    /critical|blocked|not proven|insufficient/i.test(blocker),
  );
}

function isBoundedFounderExecutionProven(
  assessment: FounderExecutionProofAssessment,
): boolean {
  const answers = assessment.report.questionAnswers;
  const bundle = assessment.report.proofBundle;

  const allStagesProven =
    bundle.workspaceEvidence.proven &&
    bundle.buildEvidence.proven &&
    bundle.runtimeEvidence.proven &&
    bundle.previewEvidence.proven &&
    bundle.verificationEvidence.proven;

  return (
    answers.founderExecutionProven === true &&
    answers.executionChainConnected === true &&
    allStagesProven &&
    !hasCriticalExecutionProofBlocker(assessment)
  );
}

/**
 * Returns true only when bounded Founder Execution Proof confirms the full chain.
 * Controlled builder connectivity alone is insufficient.
 */
export function resolveFounderExecutionConnected(
  input: ResolveFounderExecutionConnectedInput,
): ResolvedFounderExecutionConnected {
  const resolvedAt = new Date().toISOString();
  const assessment = input.founderExecutionProofAssessment ?? null;

  if (!assessment) {
    return {
      readOnly: true,
      executionConnected: false,
      source: 'missing-proof',
      proofId: null,
      founderExecutionProven: false,
      resolvedAt,
    };
  }

  const founderExecutionProven = isBoundedFounderExecutionProven(assessment);

  if (!founderExecutionProven) {
    return {
      readOnly: true,
      executionConnected: false,
      source: 'not-proven',
      proofId: assessment.report.proofId,
      founderExecutionProven: false,
      resolvedAt,
    };
  }

  const controlledConnected = isControlledBuilderExecutionConnected();

  return {
    readOnly: true,
    executionConnected: true,
    source: controlledConnected
      ? 'founder-execution-proof-25.31-with-controlled-builder'
      : 'founder-execution-proof-25.31',
    proofId: assessment.report.proofId,
    founderExecutionProven: true,
    resolvedAt,
  };
}

/** Runtime/API proof input — hydrates from in-process connected assessments when available (sync Priority A). */
export function buildRuntimeFounderExecutionProofInput(
  rootDir: string,
  overrides: AssessFounderExecutionProofInput = {},
): AssessFounderExecutionProofInput {
  return hydrateRuntimeFounderExecutionProofInputSync(rootDir, overrides).input;
}

/** Full async hydration including bounded reassessment when controlled builder evidence exists. */
export async function buildRuntimeFounderExecutionProofInputAsync(
  rootDir: string,
  overrides: AssessFounderExecutionProofInput = {},
): Promise<HydratedRuntimeFounderExecutionProofInput> {
  return hydrateRuntimeFounderExecutionProofInput(rootDir, overrides);
}

/** Resolve executionConnected for product workspace snapshot and status surfaces. */
export function resolveExecutionConnectedForRoot(
  rootDir: string,
  founderExecutionProofInput?: AssessFounderExecutionProofInput,
): ResolvedFounderExecutionConnected {
  const input =
    founderExecutionProofInput ?? buildRuntimeFounderExecutionProofInput(rootDir);
  const proof = assessFounderExecutionProof({
    rootDir,
    ...input,
  });
  return resolveFounderExecutionConnected({ founderExecutionProofAssessment: proof });
}

export function resolveExecutionConnectedFromHydration(
  hydration: RuntimeFounderExecutionProofHydration,
  founderExecutionProven: boolean,
): RuntimeFounderExecutionProofHydration['executionConnectedSource'] {
  if (founderExecutionProven && hydration.hydrated) {
    return 'hydrated-proof';
  }
  return 'not-proven';
}
