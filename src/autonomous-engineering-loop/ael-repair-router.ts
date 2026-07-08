/**
 * AEL Repair Router — routes findings to AutoFix, CER, Preview Recovery, or Engineering Intelligence.
 */

import type { AelDecision } from './ael-types.js';
import type { CapabilityEvolutionRuntimeResult } from './capability-evolution-runtime.js';
import { runCapabilityEvolutionRuntime } from './capability-evolution-runtime.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';

export interface AelRepairRouterInput {
  decision: AelDecision;
  rawPrompt: string;
  workspaceDir: string;
  projectRootDir: string;
  workspaceId: string;
  missingCapabilities: readonly string[];
  definition: ProfileFeatureDefinition;
  existingModules: readonly string[];
  capabilityEvolutionAttempts: number;
  runAutofix?: () => Promise<{ resolved: boolean; attempts: number }>;
  runPreviewRecovery?: () => Promise<{ resolved: boolean; attempts: number }>;
}

export interface AelRepairRouterResult {
  readOnly: true;
  action: string;
  resolved: boolean;
  npmBuildOk: boolean;
  previewOk: boolean;
  autofixAttemptsDelta: number;
  previewRecoveryAttemptsDelta: number;
  capabilityEvolutionResult: CapabilityEvolutionRuntimeResult | null;
  evolvedModules: readonly string[];
  humanReviewRequired: boolean;
  evidence: readonly string[];
}

export async function routeAelRepair(input: AelRepairRouterInput): Promise<AelRepairRouterResult> {
  const base = {
    readOnly: true as const,
    resolved: false,
    npmBuildOk: true,
    previewOk: false,
    autofixAttemptsDelta: 0,
    previewRecoveryAttemptsDelta: 0,
    capabilityEvolutionResult: null as CapabilityEvolutionRuntimeResult | null,
    evolvedModules: [] as readonly string[],
    humanReviewRequired: false,
    evidence: [] as readonly string[],
    action: 'none',
  };

  switch (input.decision) {
    case 'RUN_AUTOFIX': {
      if (!input.runAutofix) {
        return { ...base, action: 'RUN_AUTOFIX_SKIPPED', evidence: ['No AutoFix handler wired — AEE spine required'] };
      }
      const autofix = await input.runAutofix();
      return {
        ...base,
        action: 'RUN_AUTOFIX',
        resolved: autofix.resolved,
        npmBuildOk: autofix.resolved,
        autofixAttemptsDelta: autofix.attempts,
        evidence: [`AutoFix attempts: ${autofix.attempts}`, autofix.resolved ? 'Build repaired' : 'AutoFix unresolved'],
      };
    }
    case 'RUN_CAPABILITY_EVOLUTION': {
      const cer = runCapabilityEvolutionRuntime({
        rawPrompt: input.rawPrompt,
        workspaceDir: input.workspaceDir,
        projectRootDir: input.projectRootDir,
        workspaceId: input.workspaceId,
        missingCapabilities: input.missingCapabilities,
        definition: input.definition,
        existingModules: input.existingModules,
        attemptBudget: Math.max(1, 2 - input.capabilityEvolutionAttempts),
      });
      return {
        ...base,
        action: 'RUN_CAPABILITY_EVOLUTION',
        resolved: cer.evolvedModules.length > 0,
        npmBuildOk: cer.npmBuildOk,
        capabilityEvolutionResult: cer,
        evolvedModules: cer.evolvedModules,
        humanReviewRequired: cer.humanReviewRequired,
        evidence: [
          `CER evolved: ${cer.evolvedModules.join(', ') || 'none'}`,
          ...cer.attempts.flatMap((a) => a.evidence),
        ],
      };
    }
    case 'RUN_PREVIEW_RECOVERY': {
      if (!input.runPreviewRecovery) {
        return {
          ...base,
          action: 'RUN_PREVIEW_RECOVERY_SKIPPED',
          evidence: ['No preview recovery handler wired — AEE preview recovery required'],
        };
      }
      const recovery = await input.runPreviewRecovery();
      return {
        ...base,
        action: 'RUN_PREVIEW_RECOVERY',
        resolved: recovery.resolved,
        previewOk: recovery.resolved,
        previewRecoveryAttemptsDelta: recovery.attempts,
        evidence: [`Preview recovery attempts: ${recovery.attempts}`],
      };
    }
    default:
      return { ...base, action: 'NO_REPAIR', evidence: ['No repair routed'] };
  }
}
