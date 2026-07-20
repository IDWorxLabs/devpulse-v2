/**
 * Production Pipeline Constitution Adoption Phase 10 — constitutional state machine.
 *
 * Every production build advances through a single, ordered, non-repeatable state sequence.
 * Backward transitions and skipped transitions are constitutionally rejected.
 */

export const PRODUCTION_PIPELINE_STATE_ORDER = [
  'RAW_PROMPT',
  'CANONICAL_CONTRACT',
  'CBGA_APPROVED',
  'BUILD_ENVELOPE_CREATED',
  'MATERIALIZATION',
  'WORKSPACE_READY',
  'GPCA_APPROVED',
  'BUILD_VALIDATED',
  'PREVIEW_READY',
  'ENGINEERING_REPORT_COMPLETE',
] as const;

export type ProductionPipelineState = (typeof PRODUCTION_PIPELINE_STATE_ORDER)[number];

export interface ProductionPipelineStateTransition {
  readonly state: ProductionPipelineState;
  readonly enteredAt: string;
  readonly detail: string;
}

export interface ProductionPipelineStateSnapshot {
  readonly currentState: ProductionPipelineState;
  readonly transitions: readonly ProductionPipelineStateTransition[];
  readonly workspacePath: string | null;
  readonly workspaceFingerprint: string | null;
  readonly previewWorkspacePath: string | null;
  readonly manifestWorkspacePath: string | null;
  readonly engineeringReportWorkspacePath: string | null;
}

const STATE_INDEX = new Map<ProductionPipelineState, number>(
  PRODUCTION_PIPELINE_STATE_ORDER.map((state, index) => [state, index]),
);

export function productionPipelineStateIndex(state: ProductionPipelineState): number {
  return STATE_INDEX.get(state) ?? -1;
}

/** Returns true only for a forward move to the immediate next state or a same-index re-entry guard. */
export function isValidProductionPipelineStateTransition(
  from: ProductionPipelineState,
  to: ProductionPipelineState,
): boolean {
  const fromIndex = productionPipelineStateIndex(from);
  const toIndex = productionPipelineStateIndex(to);
  if (fromIndex < 0 || toIndex < 0) return false;
  if (toIndex < fromIndex) return false;
  if (toIndex === fromIndex) return false;
  return toIndex === fromIndex + 1;
}

export function assertProductionPipelineStateTransition(
  from: ProductionPipelineState,
  to: ProductionPipelineState,
): void {
  if (!isValidProductionPipelineStateTransition(from, to)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_2200: invalid production pipeline state transition ${from} → ${to}. Transitions must be single, forward, ordered, and non-repeatable.`,
    );
  }
}

export function createInitialProductionPipelineStateSnapshot(
  detail = 'Constitutional production pipeline initialized at BUILD_ENVELOPE_CREATED.',
): ProductionPipelineStateSnapshot {
  const enteredAt = new Date().toISOString();
  return {
    currentState: 'BUILD_ENVELOPE_CREATED',
    transitions: [{ state: 'BUILD_ENVELOPE_CREATED', enteredAt, detail }],
    workspacePath: null,
    workspaceFingerprint: null,
    previewWorkspacePath: null,
    manifestWorkspacePath: null,
    engineeringReportWorkspacePath: null,
  };
}

export function advanceProductionPipelineStateSnapshot(
  snapshot: ProductionPipelineStateSnapshot,
  nextState: ProductionPipelineState,
  detail: string,
): ProductionPipelineStateSnapshot {
  assertProductionPipelineStateTransition(snapshot.currentState, nextState);
  const enteredAt = new Date().toISOString();
  return {
    ...snapshot,
    currentState: nextState,
    transitions: [...snapshot.transitions, { state: nextState, enteredAt, detail }],
  };
}

export function productionPipelineStateMachineComplete(snapshot: ProductionPipelineStateSnapshot): boolean {
  return snapshot.currentState === 'ENGINEERING_REPORT_COMPLETE';
}

export function assertPreviewWorkspaceMatchesEnvelopeSnapshot(
  snapshot: ProductionPipelineStateSnapshot,
): void {
  const { workspacePath, workspaceFingerprint, previewWorkspacePath, manifestWorkspacePath, engineeringReportWorkspacePath } =
    snapshot;
  if (!workspacePath || !workspaceFingerprint) {
    throw new Error(
      'CONSTITUTIONAL_VIOLATION_PPC_2200: preview guarantee failed — workspace path/fingerprint not locked on envelope before preview.',
    );
  }
  const paths = [previewWorkspacePath, manifestWorkspacePath, engineeringReportWorkspacePath].filter(Boolean);
  for (const path of paths) {
    if (path !== workspacePath) {
      throw new Error(
        `CONSTITUTIONAL_VIOLATION_PPC_2200: preview guarantee failed — alternate workspace path "${path}" differs from audited workspace "${workspacePath}".`,
      );
    }
  }
}
