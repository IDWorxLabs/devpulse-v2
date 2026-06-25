/**
 * Universal CRUD app generator — delegates to Universal Prompt-to-App Materialization V1.
 */

import type { GeneratedWorkspaceFile, GeneratedAppProfile } from './code-generation-engine-types.js';
import { detectUniversalAppProfile } from '../universal-feature-contract-intelligence/universal-feature-contract-builder.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../universal-prompt-to-app-materialization/universal-app-materialization-engine.js';

export function buildUniversalCrudWorkspaceFiles(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
  profile?: GeneratedAppProfile;
  buildRunId?: string;
}): GeneratedWorkspaceFile[] {
  return buildUniversalMaterializedWorkspaceFiles({
    contractId: input.contractId,
    ideaId: input.ideaId,
    buildUnits: input.buildUnits,
    rawPrompt: input.rawPrompt,
    profile: input.profile,
    buildRunId: input.buildRunId,
  });
}

export function resolveUniversalGeneratedAppProfile(rawPrompt: string): GeneratedAppProfile {
  return detectUniversalAppProfile(rawPrompt) ?? 'GENERIC_CUSTOM_APP_V1';
}
