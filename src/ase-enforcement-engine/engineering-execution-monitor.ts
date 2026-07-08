/**
 * ASE Enforcement — execution monitoring for all engineering actions.
 */

import type {
  EngineeringActionRecord,
  EngineeringActionType,
  EngineeringExecutionStatus,
} from './ase-enforcement-engine-types.js';

let actionCounter = 0;
const executionLog: EngineeringActionRecord[] = [];

export function resetEngineeringExecutionMonitorForTests(): void {
  actionCounter = 0;
  executionLog.length = 0;
}

export function getEngineeringActionLog(): readonly EngineeringActionRecord[] {
  return executionLog;
}

export function recordEngineeringAction(
  actionType: EngineeringActionType,
  status: EngineeringExecutionStatus,
  detail: string,
): EngineeringActionRecord {
  const record: EngineeringActionRecord = {
    readOnly: true,
    actionId: `ase-action-${actionCounter + 1}-${Date.now()}`,
    actionType,
    status,
    startedAt: Date.now(),
    completedAt: status === 'COMPLETED' || status === 'FAILED' ? Date.now() : null,
    detail,
  };
  actionCounter += 1;
  executionLog.push(record);
  return record;
}

export function updateEngineeringActionStatus(
  actionId: string,
  status: EngineeringExecutionStatus,
  detail: string,
): void {
  const record = executionLog.find((r) => r.actionId === actionId);
  if (!record) return;
  record.status = status;
  record.detail = detail;
  if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
    record.completedAt = Date.now();
  }
}
