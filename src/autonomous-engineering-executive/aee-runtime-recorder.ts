/**
 * Autonomous Engineering Executive V1 — runtime recorder.
 */

import type { AeeDecision, AeeRuntimeRecord, AeeStage } from './aee-types.js';

const runtimeRecords = new Map<string, AeeRuntimeRecord[]>();
let lastRunId: string | null = null;

export function resetAeeRuntimeRecorderForTests(): void {
  runtimeRecords.clear();
  lastRunId = null;
}

export function recordAeeRuntimeEvent(input: {
  runId: string;
  projectId: string;
  stage: AeeStage;
  decision: AeeDecision;
  event: string | null;
  reasoning: string;
}): AeeRuntimeRecord {
  const record: AeeRuntimeRecord = {
    readOnly: true,
    runId: input.runId,
    projectId: input.projectId,
    stage: input.stage,
    decision: input.decision,
    event: input.event,
    reasoning: input.reasoning,
    timestamp: new Date().toISOString(),
  };
  const existing = runtimeRecords.get(input.runId) ?? [];
  existing.push(record);
  runtimeRecords.set(input.runId, existing);
  lastRunId = input.runId;
  return record;
}

export function getAeeRuntimeRecords(runId: string): readonly AeeRuntimeRecord[] {
  return runtimeRecords.get(runId) ?? [];
}

export function getLastAeeRuntimeRecords(): readonly AeeRuntimeRecord[] {
  if (!lastRunId) return [];
  return getAeeRuntimeRecords(lastRunId);
}

export function getLastAeeOverrideEvent(): string | null {
  const records = getLastAeeRuntimeRecords();
  for (let i = records.length - 1; i >= 0; i -= 1) {
    if (records[i]?.event) return records[i]!.event;
  }
  return null;
}
