/**
 * Checkpoint selector — logical checkpoint foundation (no Git, no file restoration).
 */

import type {
  Checkpoint,
  CheckpointConfidence,
  CheckpointType,
  FailureScenario,
} from './types.js';

function createCheckpointId(): string {
  return `checkpoint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const CHECKPOINT_BY_SCENARIO: Record<
  FailureScenario,
  { type: CheckpointType; reason: string; confidence: CheckpointConfidence }
> = {
  NONE: {
    type: 'GOVERNANCE_CHAIN_START',
    reason: 'No failure — baseline governance chain start',
    confidence: 'HIGH',
  },
  MISSING_RUNTIME: {
    type: 'GOVERNANCE_CHAIN_START',
    reason: 'Restore to governance chain start before missing runtime',
    confidence: 'MEDIUM',
  },
  MISSING_VERIFICATION: {
    type: 'LAST_TRUSTED_VERIFICATION',
    reason: 'Restore to last trusted verification boundary',
    confidence: 'MEDIUM',
  },
  WRONG_GATE_MAPPING: {
    type: 'APPROVAL_GATE',
    reason: 'Restore to pre-gate-mapping approval boundary',
    confidence: 'HIGH',
  },
  CONTRADICTION_PRESENT: {
    type: 'REALITY_VALIDATION',
    reason: 'Restore to last reality-validated checkpoint before contradiction',
    confidence: 'MEDIUM',
  },
  FAILED_REALITY_VALIDATION: {
    type: 'REALITY_VALIDATION',
    reason: 'Restore to last passing reality validation checkpoint',
    confidence: 'HIGH',
  },
  APPROVAL_MISSING: {
    type: 'APPROVAL_GATE',
    reason: 'Hold at approval gate checkpoint until founder approval',
    confidence: 'HIGH',
  },
  AUTONOMY_FAILURE: {
    type: 'PRE_FAILURE',
    reason: 'Restore to pre-autonomy-failure checkpoint',
    confidence: 'LOW',
  },
};

export class CheckpointStore {
  private readonly checkpoints = new Map<string, Checkpoint>();
  private readonly byPackage = new Map<string, string[]>();

  registerCheckpoint(checkpoint: Checkpoint): Checkpoint {
    this.checkpoints.set(checkpoint.checkpointId, { ...checkpoint });
    const list = this.byPackage.get(checkpoint.packageId) ?? [];
    list.push(checkpoint.checkpointId);
    this.byPackage.set(checkpoint.packageId, list);
    return { ...checkpoint };
  }

  selectCheckpoint(packageId: string, scenario: FailureScenario): Checkpoint {
    const template = CHECKPOINT_BY_SCENARIO[scenario];
    const checkpoint: Checkpoint = {
      checkpointId: createCheckpointId(),
      checkpointType: template.type,
      checkpointReason: template.reason,
      confidence: template.confidence,
      packageId,
    };
    return this.registerCheckpoint(checkpoint);
  }

  getCheckpoints(packageId: string): Checkpoint[] {
    const ids = this.byPackage.get(packageId) ?? [];
    return ids
      .map((id) => this.checkpoints.get(id))
      .filter((c): c is Checkpoint => c !== undefined)
      .map((c) => ({ ...c }));
  }

  lookupCheckpoint(checkpointId: string): Checkpoint | null {
    const cp = this.checkpoints.get(checkpointId);
    return cp ? { ...cp } : null;
  }

  clear(): void {
    this.checkpoints.clear();
    this.byPackage.clear();
  }
}

export function buildAdditionalCheckpoints(packageId: string, store: CheckpointStore): Checkpoint[] {
  const extras: Checkpoint[] = [
    {
      checkpointId: createCheckpointId(),
      checkpointType: 'PRE_FAILURE',
      checkpointReason: 'Secondary pre-failure logical boundary',
      confidence: 'MEDIUM',
      packageId,
    },
    {
      checkpointId: createCheckpointId(),
      checkpointType: 'GOVERNANCE_CHAIN_START',
      checkpointReason: 'Secondary governance chain start boundary',
      confidence: 'HIGH',
      packageId,
    },
  ];
  return extras.map((c) => store.registerCheckpoint(c));
}
