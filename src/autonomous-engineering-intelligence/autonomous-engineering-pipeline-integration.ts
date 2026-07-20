/**
 * Autonomous Engineering Intelligence V1 — production pipeline integration.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import {
  augmentWorkspaceFilesWithProductionReadiness,
  buildProductionReadinessMaterializationInputFromEnvelope,
} from '../universal-production-readiness/index.js';
import {
  loadAutonomousEngineeringInput,
  runAutonomousEngineeringCycle,
  shouldRunAutonomousEngineering,
  buildAutonomousEngineeringWorkspaceArtifacts,
} from './autonomous-engineering-intelligence.js';
import type { AutonomousEngineeringExecutionResult, RepairOutcome } from './autonomous-engineering-types.js';
import { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE } from './autonomous-engineering-types.js';

export interface AutonomousEngineeringPipelineInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly appTitle: string;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
  readonly compositionBacked: boolean;
  readonly behavioralVerificationBacked: boolean;
  readonly capabilityCoverageBacked: boolean;
}

export interface AutonomousEngineeringPipelineResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly execution: AutonomousEngineeringExecutionResult | null;
  readonly outcome: RepairOutcome | 'SKIPPED';
  readonly ranAutonomousRepair: boolean;
}

export function shouldMaterializeAutonomousEngineering(
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { compositionBacked?: boolean; readinessBlocked?: boolean },
): boolean {
  if (!envelope) return false;
  return options?.compositionBacked === true && options?.readinessBlocked === true;
}

export function augmentWorkspaceFilesWithAutonomousEngineering(
  workspaceFiles: GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: AutonomousEngineeringPipelineInput,
): AutonomousEngineeringPipelineResult {
  const engineeringInput = loadAutonomousEngineeringInput({
    envelope,
    workspaceFiles,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
  });

  if (!shouldRunAutonomousEngineering(engineeringInput)) {
    // Return a fresh array (never the input reference). Every augment's contract is "returns a NEW
    // files array"; callers legitimately do `files.length = 0; files.push(...result.files)` to
    // mutate in place. If this SKIPPED path returned the same reference, that pattern would clear
    // the array and then spread the now-empty array — silently wiping the entire workspace
    // (including feature components). See modular-feature-module-generator autonomous branch.
    return { files: [...workspaceFiles], execution: null, outcome: 'SKIPPED', ranAutonomousRepair: false };
  }

  const cycle = runAutonomousEngineeringCycle(engineeringInput);
  let files = [...cycle.execution.workspaceFiles, ...buildAutonomousEngineeringWorkspaceArtifacts(cycle)];

  const readinessInput = buildProductionReadinessMaterializationInputFromEnvelope({
    envelope,
    appTitle: input.appTitle,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
    compositionBacked: input.compositionBacked,
    behavioralVerificationBacked: input.behavioralVerificationBacked,
    capabilityCoverageBacked: input.capabilityCoverageBacked,
  });
  const readinessResult = augmentWorkspaceFilesWithProductionReadiness(files, envelope, readinessInput);
  files = readinessResult.files;

  return {
    files,
    execution: cycle.execution,
    outcome: cycle.execution.outcome,
    ranAutonomousRepair: true,
  };
}

export function buildAutonomousEngineeringSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-source.ts',
      content: `/** ${AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE} */
export const AUTONOMOUS_ENGINEERING_INTELLIGENCE_VERSION = '1.0.0' as const;
`,
    },
  ];
}
