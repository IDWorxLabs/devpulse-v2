/**
 * Universal CRUD app generator — delegates to Universal Prompt-to-App Materialization V1.
 */

import type { GeneratedWorkspaceFile, GeneratedAppProfile } from './code-generation-engine-types.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';

export function buildUniversalCrudWorkspaceFiles(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
  profile?: GeneratedAppProfile;
  buildRunId?: string;
  faithfulBuildPlan?: ResolvedPromptFaithfulBuildPlan;
}): GeneratedWorkspaceFile[] {
  return buildUniversalMaterializedWorkspaceFiles({
    contractId: input.contractId,
    ideaId: input.ideaId,
    buildUnits: input.buildUnits,
    rawPrompt: input.rawPrompt,
    profile: input.profile,
    buildRunId: input.buildRunId,
    faithfulBuildPlan: input.faithfulBuildPlan,
  });
}
