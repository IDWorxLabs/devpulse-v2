/**
 * Universal CRUD Generation Engine V1 — orchestrator.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type {
  UniversalCrudEntityGenerationInput,
  UniversalCrudGenerationReport,
} from './universal-crud-types.js';
import { UNIVERSAL_CRUD_GENERATION_ENGINE_VERSION } from './universal-crud-types.js';
import { moduleIdToPascalCase } from './universal-crud-types.js';
import { buildUniversalCrudSharedRuntimeFiles } from './crud-persistence-abstraction.js';
import { generateCrudRepositorySource } from './crud-repository-generator.js';
import { generateCrudServiceSource } from './crud-service-generator.js';
import { generateCrudTypesSource, generateCrudValidationSource } from './crud-validation-generator.js';
import { generateCrudRuntimeStateSource } from './crud-runtime-state-generator.js';
import {
  generateCrudIndexSource,
  generateCrudModuleCss,
  generateCrudUiHandlerSource,
} from './crud-ui-handler-generator.js';
import {
  verifyUniversalCrudBehavior,
  type CrudGeneratedSources,
} from './crud-behavior-verification.js';

const INFORMATIONAL_MODULE_IDS = new Set([
  'dashboard',
  'reports',
  'charts',
  'analytics',
  'code-history',
  'history',
]);

const EXCLUDED_MODULE_IDS = new Set(['auth', 'persistence', 'calculator', 'navigation-router']);

/** Returns true when the universal CRUD engine should replace the legacy static shell for this module. */
export function shouldGenerateUniversalCrudForModule(
  moduleId: string,
  options?: { safePaymentPlaceholderActive?: boolean; isSafePaymentModule?: boolean },
): boolean {
  if (EXCLUDED_MODULE_IDS.has(moduleId)) return false;
  if (INFORMATIONAL_MODULE_IDS.has(moduleId)) return false;
  if (moduleId === 'calculator') return false;
  if (options?.safePaymentPlaceholderActive && options?.isSafePaymentModule) return false;
  return true;
}

export function buildUniversalCrudEntityModuleFiles(
  input: UniversalCrudEntityGenerationInput,
): { files: GeneratedWorkspaceFile[]; sources: CrudGeneratedSources; paths: Record<string, string> } {
  const { descriptor } = input;
  const pascal = moduleIdToPascalCase(descriptor.entityId);
  const folder = `src/features/${descriptor.entityId}`;

  const typesSource = generateCrudTypesSource(input);
  const repositorySource = generateCrudRepositorySource(input);
  const serviceSource = generateCrudServiceSource(input);
  const validationSource = generateCrudValidationSource(input);
  const runtimeStateSource = generateCrudRuntimeStateSource(input);
  const componentSource = generateCrudUiHandlerSource(input);
  const cssSource = generateCrudModuleCss(descriptor);
  const indexSource = generateCrudIndexSource(descriptor);

  const paths = {
    componentPath: `${folder}/${pascal}Feature.tsx`,
    typesPath: `${folder}/${descriptor.entityId}.types.ts`,
    repositoryPath: `${folder}/${descriptor.entityId}.repository.ts`,
    servicePath: `${folder}/${descriptor.entityId}.service.ts`,
    validationPath: `${folder}/${descriptor.entityId}.validation.ts`,
    runtimeStatePath: `${folder}/${descriptor.entityId}.runtime-state.ts`,
    cssPath: `${folder}/${descriptor.entityId}.module.css`,
    indexPath: `${folder}/index.ts`,
  };

  const sources: CrudGeneratedSources = {
    entityId: descriptor.entityId,
    repository: repositorySource,
    service: serviceSource,
    validation: validationSource,
    runtimeState: runtimeStateSource,
    component: componentSource,
  };

  const files: GeneratedWorkspaceFile[] = [
    { relativePath: paths.componentPath, content: componentSource },
    { relativePath: paths.typesPath, content: typesSource },
    { relativePath: paths.repositoryPath, content: repositorySource },
    { relativePath: paths.servicePath, content: serviceSource },
    { relativePath: paths.validationPath, content: validationSource },
    { relativePath: paths.runtimeStatePath, content: runtimeStateSource },
    { relativePath: paths.cssPath, content: cssSource },
    { relativePath: paths.indexPath, content: indexSource },
  ];

  return { files, sources, paths };
}

export function buildUniversalCrudGenerationReport(input: {
  entities: UniversalCrudEntityGenerationInput[];
  entitySources: CrudGeneratedSources[];
}): UniversalCrudGenerationReport {
  const sharedRuntimeFiles = buildUniversalCrudSharedRuntimeFiles().map((f) => f.relativePath);
  const behaviorVerifications = input.entities.map((entityInput, index) =>
    verifyUniversalCrudBehavior(entityInput.descriptor, input.entitySources[index]!),
  );
  return {
    readOnly: true,
    engineVersion: UNIVERSAL_CRUD_GENERATION_ENGINE_VERSION,
    entityCount: input.entities.length,
    sharedRuntimeFiles,
    entities: input.entities.map((e) => e.descriptor),
    behaviorVerifications,
    allPassed: behaviorVerifications.every((v) => v.passed),
  };
}

export { buildUniversalCrudSharedRuntimeFiles };
