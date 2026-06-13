/**
 * Phase 25.36 — Hydrate runtime Founder Execution Proof input from in-process connected assessments.
 * Reuses 25.26–25.30 authorities only — no synthetic pass values.
 */

import { assessConnectedVerificationExecutionProof } from '../connected-verification-execution-proof/index.js';
import { resolveExecutionChainStageContext } from './connected-execution-chain-stage-resolver.js';
import { resolveConnectedExecutionChainTruth } from './connected-execution-chain-truth.js';
import { assessConnectedVerificationExecution } from '../connected-verification-execution/index.js';
import { assessConnectedPreviewExperienceProof } from '../connected-preview-experience-proof/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessConnectedRuntimeActivationProof } from '../connected-runtime-activation-proof/index.js';
import { getLatestConnectedLivePreviewExecutionAssessment } from '../connected-live-preview-execution/index.js';
import { getLatestConnectedRuntimeExecutionAssessment } from '../connected-runtime-execution/index.js';
import { getLatestConnectedVerificationExecutionAssessment } from '../connected-verification-execution/index.js';
import { getLatestConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/index.js';
import {
  extractBuildEvidence,
  extractPreviewEvidence,
  extractRuntimeEvidence,
  extractVerificationEvidence,
  extractWorkspaceEvidence,
} from '../founder-execution-proof/execution-proof-aggregator.js';
import type { AssessFounderExecutionProofInput } from '../founder-execution-proof/founder-execution-proof-types.js';
import {
  listBuilderExecutionSessions,
  listControlledExecutionEvidence,
} from '../controlled-builder-execution-engine/index.js';

export type RuntimeProofHydrationSource =
  | 'session-assessments'
  | 'bounded-reassessment'
  | 'insufficient-evidence';

export interface RuntimeFounderExecutionProofHydration {
  readOnly: true;
  hydrated: boolean;
  source: RuntimeProofHydrationSource;
  missing: string[];
  warnings: string[];
  executionConnectedSource: 'hydrated-proof' | 'not-proven' | 'unknown';
  stageProven: {
    workspace: boolean;
    build: boolean;
    runtime: boolean;
    preview: boolean;
    verification: boolean;
  };
}

export interface HydratedRuntimeFounderExecutionProofInput {
  readOnly: true;
  input: AssessFounderExecutionProofInput;
  hydration: RuntimeFounderExecutionProofHydration;
}

const CONNECTED_ASSESSMENT_KEYS = [
  'connectedWorkspaceCreationAssessment',
  'connectedRuntimeExecutionAssessment',
  'connectedLivePreviewExecutionAssessment',
  'connectedVerificationExecutionAssessment',
] as const;

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function hasConnectedAssessmentObjects(input: AssessFounderExecutionProofInput): boolean {
  return (
    input.connectedWorkspaceCreationAssessment != null ||
    input.connectedRuntimeExecutionAssessment != null ||
    input.connectedLivePreviewExecutionAssessment != null ||
    input.connectedVerificationExecutionAssessment != null
  );
}

function collectMissingConnectedAssessments(input: AssessFounderExecutionProofInput): string[] {
  const missing: string[] = [];
  if (!input.connectedWorkspaceCreationAssessment) {
    missing.push('connected-workspace-creation');
  }
  if (!input.connectedRuntimeExecutionAssessment?.report.inputSnapshot.connectedBuildExecutionContract) {
    missing.push('connected-build-execution');
  }
  if (!input.connectedRuntimeExecutionAssessment) {
    missing.push('connected-runtime-execution');
  }
  if (!input.connectedLivePreviewExecutionAssessment) {
    missing.push('connected-live-preview-execution');
  }
  if (!input.connectedVerificationExecutionAssessment) {
    missing.push('connected-verification-execution');
  }
  return missing;
}

function deriveStageProven(
  input: AssessFounderExecutionProofInput,
  rootDir?: string,
): RuntimeFounderExecutionProofHydration['stageProven'] {
  const workspace = input.connectedWorkspaceCreationAssessment ?? null;
  const runtime = input.connectedRuntimeExecutionAssessment ?? null;
  const preview = input.connectedLivePreviewExecutionAssessment ?? null;
  const verification = input.connectedVerificationExecutionAssessment ?? null;

  let buildProven = extractBuildEvidence(runtime).proven;
  let runtimeProven = extractRuntimeEvidence(runtime).proven;
  let previewProven = extractPreviewEvidence(preview).proven;

  let verificationProven = extractVerificationEvidence(verification).proven;
  let launchProven = false;

  if (rootDir && !buildProven) {
    const chainTruth = resolveConnectedExecutionChainTruth(
      resolveExecutionChainStageContext(rootDir),
    );
    if (chainTruth.buildProven) buildProven = true;
    if (chainTruth.runtimeProven) runtimeProven = true;
    if (chainTruth.previewProven) previewProven = true;
    if (chainTruth.verificationProven) verificationProven = true;
    if (chainTruth.launchProven) launchProven = true;
  }

  if (rootDir && !buildProven) {
    const buildMaterialization = assessConnectedBuildExecution({ rootDir }).report;
    buildProven = buildMaterialization.proofLevel === 'PROVEN';
    if (buildProven && !runtimeProven) {
      const runtimeReport = assessConnectedRuntimeActivationProof({
        rootDir,
        buildMaterializationReport: buildMaterialization,
      }).report;
      runtimeProven = runtimeReport.runtimeProofLevel === 'PROVEN';
      if (runtimeProven && !previewProven) {
        const previewReport = assessConnectedPreviewExperienceProof({
          rootDir,
          runtimeActivationProof: runtimeReport,
        }).report;
        previewProven = previewReport.previewProofLevel === 'PROVEN';
        if (previewProven && !verificationProven) {
          verificationProven =
            assessConnectedVerificationExecutionProof({
              rootDir,
              previewExperienceProof: previewReport,
            }).report.verificationProofLevel === 'PROVEN';
        }
      }
    }
  }

  return {
    workspace: extractWorkspaceEvidence(workspace).proven,
    build: buildProven,
    runtime: runtimeProven,
    preview: previewProven,
    verification: verificationProven,
  };
}

function buildStageWarnings(stageProven: RuntimeFounderExecutionProofHydration['stageProven']): string[] {
  const warnings: string[] = [];
  for (const [stage, proven] of Object.entries(stageProven)) {
    if (!proven) {
      warnings.push(`${stage} stage not proven by connected assessment contracts`);
    }
  }
  return warnings;
}

/** Priority A — latest in-process connected assessment objects (full objects, not history metadata). */
function hydrateFromSessionAssessments(): Partial<AssessFounderExecutionProofInput> {
  const verification = getLatestConnectedVerificationExecutionAssessment();
  if (verification) {
    const snap = verification.report.inputSnapshot;
    return {
      connectedVerificationExecutionAssessment: verification,
      connectedLivePreviewExecutionAssessment: snap.connectedLivePreviewExecutionAssessment,
      connectedRuntimeExecutionAssessment: snap.connectedRuntimeExecutionAssessment,
      connectedWorkspaceCreationAssessment: snap.connectedWorkspaceCreationAssessment ?? undefined,
    };
  }

  const preview = getLatestConnectedLivePreviewExecutionAssessment();
  if (preview) {
    const snap = preview.report.inputSnapshot;
    return {
      connectedLivePreviewExecutionAssessment: preview,
      connectedRuntimeExecutionAssessment: snap.connectedRuntimeExecutionAssessment,
      connectedWorkspaceCreationAssessment: snap.connectedWorkspaceCreationAssessment ?? undefined,
    };
  }

  const runtime = getLatestConnectedRuntimeExecutionAssessment();
  if (runtime) {
    const snap = runtime.report.inputSnapshot;
    return {
      connectedRuntimeExecutionAssessment: runtime,
      connectedWorkspaceCreationAssessment: snap.connectedWorkspaceCreationAssessment ?? undefined,
    };
  }

  const workspace = getLatestConnectedWorkspaceCreationAssessment();
  if (workspace) {
    return { connectedWorkspaceCreationAssessment: workspace };
  }

  return {};
}

function hasCompletedControlledBuilderEvidence(): boolean {
  const sessions = listBuilderExecutionSessions();
  const evidence = listControlledExecutionEvidence();
  const completedSession = sessions.some(
    (session) => session.state === 'COMPLETED' && session.evidenceCount > 0,
  );
  const substantiveEvidence = evidence.some(
    (record) =>
      record.evidenceType === 'SESSION_COMPLETED' ||
      record.evidenceType === 'FILE_CREATED' ||
      record.evidenceType === 'OUTPUT_GENERATED',
  );
  return completedSession && substantiveEvidence;
}

/** Priority B — re-run existing connected verification authority (dry-run chain) against bounded evidence. */
async function hydrateFromBoundedReassessment(
  rootDir: string,
): Promise<Partial<AssessFounderExecutionProofInput>> {
  if (!hasCompletedControlledBuilderEvidence()) {
    return {};
  }

  const verification = await assessConnectedVerificationExecution({
    rootDir,
    performRealVerification: false,
  });
  const snap = verification.report.inputSnapshot;

  return {
    connectedVerificationExecutionAssessment: verification,
    connectedLivePreviewExecutionAssessment: snap.connectedLivePreviewExecutionAssessment,
    connectedRuntimeExecutionAssessment: snap.connectedRuntimeExecutionAssessment,
    connectedWorkspaceCreationAssessment: snap.connectedWorkspaceCreationAssessment ?? undefined,
  };
}

function buildHydrationMetadata(
  input: AssessFounderExecutionProofInput,
  source: RuntimeProofHydrationSource,
  rootDir?: string,
): RuntimeFounderExecutionProofHydration {
  const hydrated = hasConnectedAssessmentObjects(input);
  const missing = collectMissingConnectedAssessments(input);
  const stageProven = deriveStageProven(input, rootDir);
  const warnings = buildStageWarnings(stageProven);
  const allProven = Object.values(stageProven).every(Boolean);

  return {
    readOnly: true,
    hydrated,
    source,
    missing,
    warnings,
    executionConnectedSource: allProven ? 'hydrated-proof' : 'not-proven',
    stageProven,
  };
}

export async function hydrateRuntimeFounderExecutionProofInput(
  rootDir: string,
  overrides: AssessFounderExecutionProofInput = {},
): Promise<HydratedRuntimeFounderExecutionProofInput> {
  if (
    overrides.connectedWorkspaceCreationAssessment != null ||
    overrides.connectedRuntimeExecutionAssessment != null ||
    overrides.connectedLivePreviewExecutionAssessment != null ||
    overrides.connectedVerificationExecutionAssessment != null
  ) {
    const input: AssessFounderExecutionProofInput = { rootDir, ...overrides };
    return {
      readOnly: true,
      input,
      hydration: buildHydrationMetadata(input, 'session-assessments', rootDir),
    };
  }

  const sessionPartial = hydrateFromSessionAssessments();
  if (hasConnectedAssessmentObjects({ rootDir, ...sessionPartial })) {
    const input: AssessFounderExecutionProofInput = { rootDir, ...sessionPartial, ...overrides };
    return {
      readOnly: true,
      input,
      hydration: buildHydrationMetadata(input, 'session-assessments', rootDir),
    };
  }

  const reassessmentPartial = await hydrateFromBoundedReassessment(rootDir);
  if (hasConnectedAssessmentObjects({ rootDir, ...reassessmentPartial })) {
    const input: AssessFounderExecutionProofInput = { rootDir, ...reassessmentPartial, ...overrides };
    return {
      readOnly: true,
      input,
      hydration: buildHydrationMetadata(input, 'bounded-reassessment', rootDir),
    };
  }

  const input: AssessFounderExecutionProofInput = { rootDir, ...overrides };
  const stageProven = deriveStageProven(input, rootDir);
  return {
    readOnly: true,
    input,
    hydration: {
      readOnly: true,
      hydrated: stageProven.build || stageProven.runtime || stageProven.preview,
      source: 'insufficient-evidence',
      missing: [
        'connected-workspace-creation',
        'connected-build-execution',
        'connected-runtime-execution',
        'connected-live-preview-execution',
        'connected-verification-execution',
      ],
      warnings: dedupeStrings([
        'No in-process connected execution assessment objects available',
        ...buildStageWarnings(stageProven),
      ]),
      executionConnectedSource: Object.values(stageProven).every(Boolean) ? 'hydrated-proof' : 'not-proven',
      stageProven,
    },
  };
}

/** Synchronous hydration for callers that cannot await (uses Priority A only). */
export function hydrateRuntimeFounderExecutionProofInputSync(
  rootDir: string,
  overrides: AssessFounderExecutionProofInput = {},
): HydratedRuntimeFounderExecutionProofInput {
  if (
    overrides.connectedWorkspaceCreationAssessment != null ||
    overrides.connectedRuntimeExecutionAssessment != null ||
    overrides.connectedLivePreviewExecutionAssessment != null ||
    overrides.connectedVerificationExecutionAssessment != null
  ) {
    const input: AssessFounderExecutionProofInput = { rootDir, ...overrides };
    return {
      readOnly: true,
      input,
      hydration: buildHydrationMetadata(input, 'session-assessments', rootDir),
    };
  }

  const sessionPartial = hydrateFromSessionAssessments();
  if (hasConnectedAssessmentObjects({ rootDir, ...sessionPartial })) {
    const input: AssessFounderExecutionProofInput = { rootDir, ...sessionPartial, ...overrides };
    return {
      readOnly: true,
      input,
      hydration: buildHydrationMetadata(input, 'session-assessments', rootDir),
    };
  }

  const input: AssessFounderExecutionProofInput = { rootDir, ...overrides };
  return {
    readOnly: true,
    input,
    hydration: {
      readOnly: true,
      hydrated: false,
      source: 'insufficient-evidence',
      missing: [
        'connected-workspace-creation',
        'connected-build-execution',
        'connected-runtime-execution',
        'connected-live-preview-execution',
        'connected-verification-execution',
      ],
      warnings: ['No in-process connected execution assessment objects available (sync path — Priority B skipped)'],
      executionConnectedSource: 'not-proven',
      stageProven: {
        workspace: false,
        build: false,
        runtime: false,
        preview: false,
        verification: false,
      },
    },
  };
}

export { CONNECTED_ASSESSMENT_KEYS };
