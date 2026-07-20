/**
 * AiDevEngine Universal App Blueprint v1.0 — compose blueprint with feature modules.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { UniversalBlueprintBuildInput } from './universal-app-blueprint-types.js';
import { buildUniversalBlueprintWorkspaceFiles } from './universal-app-blueprint-generator.js';

export function composeGeneratedAppWorkspaceFiles(input: {
  blueprint: UniversalBlueprintBuildInput;
  featureFiles: GeneratedWorkspaceFile[];
  sharedFiles?: GeneratedWorkspaceFile[];
}): GeneratedWorkspaceFile[] {
  const blueprintFiles = buildUniversalBlueprintWorkspaceFiles(input.blueprint);
  const byPath = new Map<string, GeneratedWorkspaceFile>();

  for (const file of blueprintFiles) {
    byPath.set(file.relativePath, file);
  }
  // Feature modules first, then shared infrastructure (registry/routes/App/router) so
  // CBGA-approved shell files always win over any accidental feature-layer duplicates.
  for (const file of input.featureFiles) {
    byPath.set(file.relativePath, file);
  }
  for (const file of input.sharedFiles ?? []) {
    byPath.set(file.relativePath, file);
  }

  return [...byPath.values()];
}
