/**
 * Universal Runtime State Engine V1 — orchestrator.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { buildRuntimeStateDescriptors } from './runtime-state-descriptor-builder.js';
import { buildUniversalRuntimeSharedRuntimeFiles } from './runtime-store-generator.js';
import { generateModuleUniversalRuntimeSource } from './runtime-b1-crud-integration.js';
import {
  verifyUniversalRuntimeBehavior,
  type RuntimeGeneratedSources,
} from './runtime-behavior-verification.js';
import { buildUniversalRuntimeMaterializationReport } from './runtime-generation-report.js';
import type {
  UniversalRuntimeMaterializationInput,
  UniversalRuntimeMaterializationReport,
  UniversalRuntimeStateDescriptor,
} from './universal-runtime-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

export interface UniversalRuntimeModuleMaterializationResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly descriptors: UniversalRuntimeStateDescriptor[];
  readonly report: UniversalRuntimeMaterializationReport;
  readonly componentAugmentation: string;
}

export function buildRuntimeMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  moduleId: string;
  moduleDisplayName: string;
  moduleRoute: string;
  appTitle: string;
  contractId: string;
  crudBacked: boolean;
  actionBacked: boolean;
  workflowBacked: boolean;
  relationshipBacked: boolean;
}): UniversalRuntimeMaterializationInput {
  return {
    moduleId: input.moduleId,
    moduleDisplayName: input.moduleDisplayName,
    moduleRoute: input.moduleRoute,
    appTitle: input.appTitle,
    contractId: input.contractId,
    crudBacked: input.crudBacked,
    actionBacked: input.actionBacked,
    workflowBacked: input.workflowBacked,
    relationshipBacked: input.relationshipBacked,
    buildId: input.envelope.buildId,
    promptHash: input.envelope.promptHash,
  };
}

export function materializeUniversalRuntimeForModule(
  materializationInput: UniversalRuntimeMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): UniversalRuntimeModuleMaterializationResult {
  const descriptors = buildRuntimeStateDescriptors({ envelope, input: materializationInput });
  const runtimeSource = descriptors.length > 0 ? generateModuleUniversalRuntimeSource(descriptors, materializationInput) : '';
  const descriptorsSource = generateRuntimeDescriptorsSource(descriptors, materializationInput);

  const sharedStoreSnippet = buildUniversalRuntimeSharedRuntimeFiles().find((f) => f.relativePath.endsWith('store.ts'))?.content ?? '';

  const verifications = descriptors.map((descriptor) => {
    const sources: RuntimeGeneratedSources = {
      runtime: runtimeSource,
      sharedStore: sharedStoreSnippet,
      componentFragment: '',
      descriptors: descriptorsSource,
    };
    return verifyUniversalRuntimeBehavior(descriptor, sources);
  });

  const report = buildUniversalRuntimeMaterializationReport({
    moduleId: materializationInput.moduleId,
    descriptors,
    verifications,
  });

  const moduleId = materializationInput.moduleId;
  const files: GeneratedWorkspaceFile[] = [];
  if (runtimeSource) {
    files.push(
      { relativePath: `src/features/${moduleId}/${moduleId}.universal-runtime.ts`, content: runtimeSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.runtime-descriptors.ts`, content: descriptorsSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.runtime-report.json`, content: `${JSON.stringify(report, null, 2)}\n` },
    );
  }

  return { files, descriptors, report, componentAugmentation: '' };
}

function generateRuntimeDescriptorsSource(
  descriptors: readonly UniversalRuntimeStateDescriptor[],
  input: UniversalRuntimeMaterializationInput,
): string {
  return `/** Universal runtime descriptors — ${input.moduleDisplayName} */
export const ${moduleIdToPascalCase(input.moduleId)}_RUNTIME_DESCRIPTORS = ${JSON.stringify(
    descriptors.map((d) => ({
      runtimeScopeId: d.runtimeScopeId,
      stateKind: d.stateKind,
      stateKey: d.stateKey,
      supportClassification: d.supportClassification,
      cachePolicy: d.cachePolicy,
    })),
    null,
    2,
  )} as const;
`;
}

export function augmentCrudComponentWithUniversalRuntime(
  componentSource: string,
  materializationInput: UniversalRuntimeMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): { componentSource: string; runtimeResult: UniversalRuntimeModuleMaterializationResult } {
  const runtimeResult = materializeUniversalRuntimeForModule(materializationInput, envelope);
  const pascal = moduleIdToPascalCase(materializationInput.moduleId);
  const moduleId = materializationInput.moduleId;

  let augmented = componentSource;
  if (runtimeResult.descriptors.length > 0 && !augmented.includes(`use${pascal}UniversalRuntime`)) {
    const importLine = `import { use${pascal}UniversalRuntime } from './${moduleId}.universal-runtime';`;
    if (augmented.includes('from \'react\'')) {
      augmented = augmented.replace(
        /import \{([^}]+)\} from 'react';/,
        (match, imports) => `import {${imports}} from 'react';\n${importLine}`,
      );
    } else {
      augmented = `${importLine}\n${augmented}`;
    }
    if (augmented.includes(`use${pascal}CrudRuntime(`)) {
      augmented = augmented.replace(
        `const crud = use${pascal}CrudRuntime(pageSize);`,
        `const universalRuntime = use${pascal}UniversalRuntime(pageSize);
  const crud = universalRuntime.crud;`,
      );
      if (!augmented.includes(`use${pascal}UniversalRuntime(`)) {
        augmented = augmented.replace(
          `const crud = use${pascal}CrudRuntime(10);`,
          `const universalRuntime = use${pascal}UniversalRuntime(10);
  const crud = universalRuntime.crud;`,
        );
      }
    }
  }

  if (!augmented.includes('data-universal-runtime-engine')) {
    augmented = augmented.replace(
      'data-universal-crud-engine="v1"',
      'data-universal-crud-engine="v1"\n      data-universal-runtime-engine="v1"',
    );
  }

  return { componentSource: augmented, runtimeResult };
}

export function shouldMaterializeUniversalRuntimeForModule(
  moduleId: string,
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { crudBacked?: boolean },
): boolean {
  const excluded = new Set(['auth', 'persistence', 'calculator', 'navigation-router']);
  if (excluded.has(moduleId)) return false;
  if (!envelope) return false;
  return options?.crudBacked === true;
}

export { buildUniversalRuntimeSharedRuntimeFiles } from './runtime-store-generator.js';
export {
  buildUniversalRuntimeMaterializationReport,
  computeUniversalRuntimeCapabilityCoverageScore,
} from './runtime-generation-report.js';
export {
  verifyUniversalRuntimeBehavior,
  diagnoseUniversalRuntimeGenerationGaps,
  detectStaticRuntimeStateShell,
} from './runtime-behavior-verification.js';
export {
  UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION,
  UNIVERSAL_RUNTIME_STATE_ENGINE_SOURCE,
  stableRuntimeScopeId,
  stableQueryKey,
} from './universal-runtime-types.js';
