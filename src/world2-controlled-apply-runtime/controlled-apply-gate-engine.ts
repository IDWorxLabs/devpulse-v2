/**
 * Controlled apply gate engine — evaluates governance gates without applying.
 */

export interface ControlledApplyGate {
  gateId: string;
  name: string;
  required: boolean;
  satisfied: boolean;
  summary: string;
}

export interface ControlledApplyGateReport {
  gates: ControlledApplyGate[];
  allRequiredSatisfied: boolean;
  passedCount: number;
  blockers: string[];
}

let gateCounter = 0;

function nextGateId(): string {
  gateCounter += 1;
  return `cagate-${gateCounter.toString().padStart(3, '0')}`;
}

export function resetControlledApplyGateCounterForTests(): void {
  gateCounter = 0;
}

export function evaluateControlledApplyGates(opts: {
  activationExists: boolean;
  activationState: string | null;
  builderPacketValid: boolean;
  executionPacketExists: boolean;
  world2Isolated: boolean;
  world1Protected: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  runtimeVerificationPassed: boolean;
  duplicateAuthorityDetected: boolean;
  targetWorld: 'WORLD_1' | 'WORLD_2';
}): ControlledApplyGateReport {
  const gates: ControlledApplyGate[] = [
    {
      gateId: nextGateId(),
      name: 'World 2 Activation',
      required: true,
      satisfied: opts.activationExists,
      summary: 'Phase 15.1 World 2 execution activation must exist',
    },
    {
      gateId: nextGateId(),
      name: 'Builder Packet Validation',
      required: true,
      satisfied: opts.builderPacketValid,
      summary: 'Phase 15.2 builder packet execution must be valid',
    },
    {
      gateId: nextGateId(),
      name: 'Execution Packet Exists',
      required: true,
      satisfied: opts.executionPacketExists,
      summary: 'Execution packet required as controlled apply input',
    },
    {
      gateId: nextGateId(),
      name: 'Workspace Isolation',
      required: true,
      satisfied: opts.world2Isolated,
      summary: 'World 2 workspace must be isolated',
    },
    {
      gateId: nextGateId(),
      name: 'World 1 Protection',
      required: true,
      satisfied: opts.world1Protected && opts.targetWorld !== 'WORLD_1',
      summary: 'World 1 must remain protected — no World 1 apply target',
    },
    {
      gateId: nextGateId(),
      name: 'Constitution',
      required: true,
      satisfied: opts.constitutionPassed,
      summary: 'Constitutional enforcement must pass',
    },
    {
      gateId: nextGateId(),
      name: 'Task Governor',
      required: true,
      satisfied: opts.taskGovernorPassed,
      summary: 'Task Governor scheduling check must pass',
    },
    {
      gateId: nextGateId(),
      name: 'Founder Approval',
      required: true,
      satisfied: opts.founderApprovalRecorded,
      summary: 'Founder approval requirement must be recorded',
    },
    {
      gateId: nextGateId(),
      name: 'Runtime Verification',
      required: true,
      satisfied: opts.runtimeVerificationPassed,
      summary: 'Phase 14.6 runtime verification linkage required',
    },
    {
      gateId: nextGateId(),
      name: 'Duplicate Authority Detection',
      required: true,
      satisfied: !opts.duplicateAuthorityDetected,
      summary: 'No duplicate execution authority may exist',
    },
  ];

  const blockers: string[] = [];
  for (const gate of gates.filter((g) => g.required && !g.satisfied)) {
    blockers.push(`Gate unsatisfied: ${gate.name} — ${gate.summary}`);
  }

  const passedCount = gates.filter((g) => g.satisfied).length;

  return {
    gates,
    allRequiredSatisfied: blockers.length === 0,
    passedCount,
    blockers,
  };
}
