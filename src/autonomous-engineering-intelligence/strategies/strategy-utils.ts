/**
 * Autonomous Engineering Intelligence V1 — shared strategy execution context.
 */

import { createHash } from 'node:crypto';
import type { GeneratedWorkspaceFile } from '../../code-generation-engine/code-generation-engine-types.js';
import type {
  AutonomousEngineeringFinding,
  AutonomousEngineeringInput,
  RepairStrategyDescriptor,
  SourceMutationRecord,
} from '../autonomous-engineering-types.js';
import { isMutationPathAllowed } from '../autonomous-repair-mutation-policy.js';
import { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE } from '../autonomous-engineering-types.js';

export interface RepairStrategyExecutionContext {
  readonly input: AutonomousEngineeringInput;
  readonly finding: AutonomousEngineeringFinding;
  workspaceFiles: GeneratedWorkspaceFile[];
}

export interface RepairStrategyExecutionResult {
  readonly applied: boolean;
  readonly mutation: SourceMutationRecord | null;
  readonly error: string | null;
}

export function fingerprintContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function patchWorkspaceFile(
  ctx: RepairStrategyExecutionContext,
  relativePath: string,
  transform: (content: string) => string,
  meta: { strategyId: string; authority: string; mutationType: SourceMutationRecord['mutationType']; reason: string },
): RepairStrategyExecutionResult {
  if (!isMutationPathAllowed(relativePath)) {
    return { applied: false, mutation: null, error: 'repair_mutation_scope_denied' };
  }
  const idx = ctx.workspaceFiles.findIndex((f) => f.relativePath === relativePath);
  if (idx < 0) return { applied: false, mutation: null, error: 'target_missing' };
  const before = ctx.workspaceFiles[idx]!.content;
  const after = transform(before);
  if (after === before) return { applied: false, mutation: null, error: 'no_change' };
  ctx.workspaceFiles[idx] = { relativePath, content: after };
  return {
    applied: true,
    mutation: {
      mutationId: `mut-${meta.strategyId}-${relativePath}`,
      strategyId: meta.strategyId,
      targetPath: relativePath,
      targetAuthority: meta.authority,
      mutationType: meta.mutationType,
      expectedBeforeFingerprint: fingerprintContent(before),
      expectedAfterFingerprint: fingerprintContent(after),
      contributionIds: ctx.finding.contributionIds,
      requirementIds: ctx.finding.requirementIds,
      behaviorIds: ctx.finding.behaviorIds,
      reason: meta.reason,
      rollbackData: before,
      provenance: [AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE, meta.strategyId],
    },
    error: null,
  };
}

export function baseDescriptor(partial: Omit<RepairStrategyDescriptor, 'fingerprint'>): RepairStrategyDescriptor {
  const fingerprint = createHash('sha256')
    .update(`${partial.strategyId}@${partial.strategyVersion}`)
    .digest('hex')
    .slice(0, 16);
  return { ...partial, fingerprint };
}
