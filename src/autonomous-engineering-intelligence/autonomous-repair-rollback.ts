/**
 * Autonomous Engineering Intelligence V1 — repair rollback.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { SourceMutationRecord } from './autonomous-engineering-types.js';

export function rollbackMutation(
  workspaceFiles: GeneratedWorkspaceFile[],
  mutation: SourceMutationRecord,
): { restored: boolean; reason?: string } {
  const idx = workspaceFiles.findIndex((f) => f.relativePath === mutation.targetPath);
  if (mutation.mutationType === 'CREATE_GENERATED_FILE') {
    if (idx >= 0) {
      workspaceFiles.splice(idx, 1);
      return { restored: true };
    }
    return { restored: false, reason: 'target_missing' };
  }
  if (idx < 0) return { restored: false, reason: 'target_missing' };
  workspaceFiles[idx] = { relativePath: mutation.targetPath, content: mutation.rollbackData };
  return { restored: true };
}

export function rollbackMutations(
  workspaceFiles: GeneratedWorkspaceFile[],
  mutations: readonly SourceMutationRecord[],
): SourceMutationRecord[] {
  const rolledBack: SourceMutationRecord[] = [];
  for (const mutation of [...mutations].reverse()) {
    const result = rollbackMutation(workspaceFiles, mutation);
    if (result.restored) rolledBack.push(mutation);
  }
  return rolledBack;
}
