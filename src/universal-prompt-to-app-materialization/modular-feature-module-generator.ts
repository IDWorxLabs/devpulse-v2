/**
 * Modular Feature Materialization V1 — per-module file generation.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProfileFeatureDefinition } from './profile-feature-map.js';
import { resolveDomainCopy } from './profile-feature-ui-generator.js';
import { contractConsumptionTrace, shortHashForTrace } from '../production-contract-consumption-trace-v1/index.js';
import {
  buildSafePaymentPlaceholderComponentTsx,
  isSafePaymentPlaceholderModule,
} from '../safe-payment-placeholder-policy/safe-payment-module-generator.js';
import type { ApprovedSampleDataPlan } from '../contract-bound-generation-authority-v4/approved-sample-data-plan.js';
import {
  buildCalculatorFeatureComponentTsx,
  buildCalculatorFeatureModuleCss,
} from '../simple-utility-app/calculator-feature-generator.js';
import {
  buildUniversalCrudSharedRuntimeFiles,
  buildUniversalCrudEntityModuleFiles,
  shouldGenerateUniversalCrudForModule,
  entityDescriptorFromApprovedModule,
} from '../universal-crud-generation-engine/index.js';
import { INFRASTRUCTURE_SHELL_MODULE_IDS } from '../contract-to-module-traceability/contract-to-module-infrastructure-registry.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { resolveMaterializationModuleIdsFromEnvelope } from '../contract-to-module-traceability/contract-to-module-materialization-gate.js';
import {
  augmentCrudComponentWithUniversalActions,
  buildActionMaterializationInputFromEnvelope,
  buildUniversalActionSharedRuntimeFiles,
  shouldMaterializeUniversalActionsForModule,
} from '../universal-action-materialization-engine/index.js';
import {
  augmentCrudComponentWithUniversalWorkflows,
  buildWorkflowMaterializationInputFromEnvelope,
  buildUniversalWorkflowSharedRuntimeFiles,
  shouldMaterializeUniversalWorkflowsForModule,
} from '../universal-workflow-generation-engine/index.js';
import {
  augmentCrudComponentWithUniversalRelationships,
  buildRelationshipMaterializationInputFromEnvelope,
  buildUniversalRelationshipSharedRuntimeFiles,
  materializeUniversalRelationshipsForModule,
  shouldMaterializeUniversalRelationshipsForModule,
} from '../universal-relationship-intelligence-engine/index.js';
import {
  augmentCrudComponentWithUniversalRuntime,
  buildRuntimeMaterializationInputFromEnvelope,
  buildUniversalRuntimeSharedRuntimeFiles,
  shouldMaterializeUniversalRuntimeForModule,
} from '../universal-runtime-state-engine/index.js';
import {
  augmentCrudModuleWithUniversalBusinessRules,
  buildBusinessRuleMaterializationInputFromEnvelope,
  buildUniversalBusinessRuleSharedRuntimeFiles,
  shouldMaterializeUniversalBusinessRulesForModule,
} from '../universal-business-rule-engine/index.js';
import {
  augmentWorkspaceFilesWithCapabilityPacks,
  buildCapabilityPackMaterializationInputFromEnvelope,
  buildCapabilityPackSharedRuntimeFiles,
  shouldMaterializeCapabilityPacks,
} from '../universal-capability-pack-framework/index.js';
import {
  buildBehaviorVerificationMaterializationInputFromEnvelope,
  buildBehaviorVerificationSharedRuntimeFiles,
  materializeBehaviorVerificationForWorkspace,
  shouldMaterializeBehavioralVerification,
} from '../universal-behavioral-verification/index.js';
import {
  augmentWorkspaceFilesWithCapabilityCoverage,
  buildCapabilityCoverageMaterializationInputFromEnvelope,
  buildCapabilityCoverageSharedRuntimeFiles,
  shouldMaterializeCapabilityCoverage,
} from '../universal-capability-coverage/index.js';
import {
  runUniversalCapabilityComposition,
  augmentWorkspaceFilesWithCapabilityComposition,
  buildCompositionMaterializationInputFromEnvelope,
  buildCompositionSharedRuntimeFiles,
  buildCapabilityPackMaterializationInputFromCompositionPlan,
  shouldMaterializeCapabilityComposition,
  type UniversalCapabilityCompositionPlan,
} from '../universal-capability-composition-engine/index.js';
import {
  augmentWorkspaceFilesWithProductionReadiness,
  buildProductionReadinessMaterializationInputFromEnvelope,
  buildProductionReadinessSharedRuntimeFiles,
  shouldMaterializeProductionReadiness,
} from '../universal-production-readiness/index.js';
import {
  augmentWorkspaceFilesWithAutonomousEngineering,
  buildAutonomousEngineeringSharedRuntimeFiles,
  shouldMaterializeAutonomousEngineering,
} from '../autonomous-engineering-intelligence/index.js';

export interface GeneratedFeatureModuleManifestEntry {
  readOnly: true;
  id: string;
  name: string;
  route: string;
  files: string[];
  componentPath: string;
  servicePath: string;
  typesPath: string;
  validationPath: string;
  sourceLines: number;
  promptTerms: string[];
  contractId: string;
  status: 'generated';
}

const INFRASTRUCTURE_MODULES = new Set<string>(INFRASTRUCTURE_SHELL_MODULE_IDS);
function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}

export function moduleIdToPascalCase(moduleId: string): string {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function moduleIdToDisplayName(moduleId: string): string {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveModuleRoute(
  moduleId: string,
  featureModules: string[],
  routes: string[],
): string {
  const index = featureModules.indexOf(moduleId);
  if (index >= 0 && routes[index]) return routes[index]!;
  if (moduleId === 'auth') return '/';
  return `/${moduleId}`;
}

export function materializableFeatureModules(
  definition: ProfileFeatureDefinition,
  approvedModuleIds?: readonly string[] | null,
): string[] {
  const candidates = definition.featureModules.filter((moduleId) => !INFRASTRUCTURE_MODULES.has(moduleId));
  if (approvedModuleIds === undefined || approvedModuleIds === null) return candidates;
  const approved = new Set(approvedModuleIds);
  return candidates.filter((moduleId) => approved.has(moduleId));
}

function modulePromptTerms(
  moduleId: string,
  definition: ProfileFeatureDefinition,
): string[] {
  const base = [moduleId.replace(/-/g, ' ')];
  for (const term of definition.requiredUiTerms) {
    const normalized = term.toLowerCase();
    if (
      moduleId.includes(normalized) ||
      normalized.includes(moduleId.replace(/-/g, '')) ||
      normalized.includes(moduleId.split('-')[0] ?? '')
    ) {
      base.push(term);
    }
  }
  return [...new Set(base)].slice(0, 6);
}

function buildFeatureComponentTsx(
  moduleId: string,
  appTitle: string,
  definition: ProfileFeatureDefinition,
  approvedSampleDataPlan?: ApprovedSampleDataPlan | null,
): string {
  const pascal = moduleIdToPascalCase(moduleId);
  const displayName = moduleIdToDisplayName(moduleId);
  const copy = resolveDomainCopy(definition, appTitle);
  const description = copy[moduleId] ?? `${displayName} module for ${appTitle}.`;
  const terms = modulePromptTerms(moduleId, definition);
  if (moduleId === 'calculator') {
    return buildCalculatorFeatureComponentTsx(appTitle);
  }

  const safePaymentComponent =
    definition.safePaymentPlaceholderActive === true
      ? buildSafePaymentPlaceholderComponentTsx(moduleId, appTitle, pascal, displayName, approvedSampleDataPlan)
      : null;

  if (safePaymentComponent) {
    return safePaymentComponent;
  }

  if (moduleId === 'calculator') {
    return buildCalculatorFeatureComponentTsx(appTitle);
  }

  const interactionControl = isInformationalFeatureModule(moduleId)
    ? ''
    : `
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage ${displayName}
        </button>`;

  return `import { useMemo } from 'react';
import type { ${pascal}Record } from './${moduleId}.types';
import { list${pascal}Records } from './${moduleId}.service';
import { ${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION } from './${moduleId}.validation';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const records = useMemo(() => list${pascal}Records(), []);
  const headline = useMemo(() => '${esc(description)}', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="${moduleId}"
      data-modular-feature-v1="true"
      data-prompt-terms="${esc(terms.join(','))}"
    >
      <header className="modular-feature-header">
        <h2>${displayName}</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>${esc(appTitle)} — ${displayName}</h3>
          <p>{headline}</p>${interactionControl}
          <p data-validation-rules={${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION.rules.length}>
            Validation rules: {${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION.rules.length}
          </p>
        </article>
        {records.length > 0 ? (
          <ul className="modular-feature-records">
            {records.map((record: ${pascal}Record) => (
              <li key={record.id}>{record.label}</li>
            ))}
          </ul>
        ) : (
          <p className="modular-feature-empty-state" data-empty-state="true">No ${esc(displayName)} recorded yet.</p>
        )}
      </div>
    </section>
  );
}
`;
}

function buildFeatureTypesTs(moduleId: string, appTitle: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  return `/** Types for ${moduleId} feature module — ${appTitle} */
export interface ${pascal}Record {
  id: string;
  label: string;
  createdAt: string;
}

export interface ${pascal}FormState {
  label: string;
}
`;
}

/**
 * Placeholder & Template Elimination Authority V1 (Part 2/5) — this generator must never invent
 * business records ("Sample X record", "X preview entry", or any equivalent fake/demo/example
 * business content). There is no approved data source to seed from at generation time, so the
 * constitutionally correct behavior is an empty result — the component renders an infrastructure
 * empty state (allowed; carries no business identity) instead of a generator-invented record.
 */
function buildFeatureServiceTs(moduleId: string, appTitle: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  return `/** Service adapter for ${moduleId} — ${appTitle} */
import type { ${pascal}Record } from './${moduleId}.types';

/**
 * No records are generated here — Placeholder & Template Elimination Authority V1 forbids
 * generator-invented business content (fake/sample/demo/preview records). Real records must come
 * from an approved data source once one exists.
 */
export function list${pascal}Records(): ${pascal}Record[] {
  return [];
}
`;
}

function buildFeatureValidationTs(moduleId: string, appTitle: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  const displayName = moduleIdToDisplayName(moduleId);
  const interactionMode = isInformationalFeatureModule(moduleId) ? 'informational' : 'interactive';
  return `/** Validation metadata for ${moduleId} — ${appTitle} */
export const ${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION = {
  moduleId: '${moduleId}',
  contractId: 'feature-${moduleId}',
  displayName: '${displayName}',
  interactionMode: '${interactionMode}',
  rules: [
    { field: 'label', rule: 'required', message: '${displayName} label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: '${displayName} label must be at least 2 characters' },
  ],
} as const;

export type ${pascal}ValidationRule = (typeof ${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION.rules)[number];
`;
}

function isInformationalFeatureModule(moduleId: string): boolean {
  return new Set(['dashboard', 'reports', 'charts', 'analytics', 'code-history', 'history']).has(moduleId);
}

function buildFeatureModuleCss(moduleId: string): string {
  if (moduleId === 'calculator') {
    return buildCalculatorFeatureModuleCss();
  }
  return `.modular-feature[data-feature-module="${moduleId}"] { width: 100%; }
.modular-feature-header h2 { margin: 0 0 0.35rem; text-transform: capitalize; }
.modular-feature-header p { margin: 0 0 1rem; color: #64748b; }
.modular-feature-body { display: grid; gap: 0.75rem; }
.modular-feature-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #fff; }
.modular-feature-records { margin: 0; padding-left: 1.25rem; }
`;
}

function buildFeatureIndexTs(moduleId: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  return `export { default } from './${pascal}Feature';
export * from './${moduleId}.types';
export * from './${moduleId}.service';
export * from './${moduleId}.validation';
`;
}

/** A CBGA-approved module entry's displayName/route — the subset `ApprovedModuleEntry` this generator actually needs, kept structural to avoid a cross-authority type import. */
export type ApprovedModuleMetadataEntry = { readonly moduleId: string; readonly displayName: string; readonly route: string };

export function buildModularFeatureModuleFiles(
  moduleId: string,
  appTitle: string,
  definition: ProfileFeatureDefinition,
  /**
   * Module Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-repaired
   * module plan's entries (`ApprovedModulePlan.moduleEntries`). When supplied and this moduleId is
   * covered, the manifest/registry entry's `name`/`route` are taken from it —
   * `moduleIdToDisplayName`/`resolveModuleRoute` only determine those values for modules the plan
   * does not cover (system-shell modules, or pre-CBGA/isolated/test-only callers).
   */
  approvedModuleEntries?: ReadonlyArray<ApprovedModuleMetadataEntry> | null,
  /**
   * Sample Data Computation Collapse V1 — the approved sample data plan for this build. When
   * supplied, safe-payment placeholder modules consume cart line items from the plan instead of
   * inventing sample products.
   */
  approvedSampleDataPlan?: ApprovedSampleDataPlan | null,
  approvedProductionBuildEnvelope?: ApprovedProductionBuildEnvelope | null,
  rawPrompt?: string | null,
): { files: GeneratedWorkspaceFile[]; manifestEntry: GeneratedFeatureModuleManifestEntry } {
  const approvedEntry = (approvedModuleEntries ?? []).find((entry) => entry.moduleId === moduleId) ?? null;
  const pascal = moduleIdToPascalCase(moduleId);
  const folder = `src/features/${moduleId}`;
  const displayName = approvedEntry?.displayName ?? moduleIdToDisplayName(moduleId);
  const route = approvedEntry?.route ?? resolveModuleRoute(moduleId, definition.featureModules, definition.routes);

  const useUniversalCrud = shouldGenerateUniversalCrudForModule(moduleId, {
    safePaymentPlaceholderActive: definition.safePaymentPlaceholderActive === true,
    isSafePaymentModule:
      definition.safePaymentPlaceholderActive === true && isSafePaymentPlaceholderModule(moduleId),
  });

  if (useUniversalCrud) {
    const descriptor = entityDescriptorFromApprovedModule({
      moduleId,
      displayName,
      route,
      contractId: `feature-${moduleId}`,
    });
    const built = buildUniversalCrudEntityModuleFiles({
      descriptor,
      appTitle,
      promptTerms: modulePromptTerms(moduleId, definition),
    });
    let files = [...built.files];
    if (approvedProductionBuildEnvelope && shouldMaterializeUniversalActionsForModule(moduleId)) {
      const actionInput = buildActionMaterializationInputFromEnvelope({
        envelope: approvedProductionBuildEnvelope,
        moduleId,
        moduleDisplayName: displayName,
        moduleRoute: route,
        appTitle,
        contractId: descriptor.contractId,
        crudBacked: true,
      });
      const componentFile = files.find((f) => f.relativePath === built.paths.componentPath);
      if (componentFile) {
        const augmented = augmentCrudComponentWithUniversalActions(
          componentFile.content,
          actionInput,
          approvedProductionBuildEnvelope,
        );
        files = files.map((f) =>
          f.relativePath === built.paths.componentPath
            ? { ...f, content: augmented.componentSource }
            : f,
        );
        files.push(...augmented.actionResult.files);
      }
    }
    if (approvedProductionBuildEnvelope && shouldMaterializeUniversalWorkflowsForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true })) {
      const workflowInput = buildWorkflowMaterializationInputFromEnvelope({
        envelope: approvedProductionBuildEnvelope,
        moduleId,
        moduleDisplayName: displayName,
        moduleRoute: route,
        appTitle,
        contractId: descriptor.contractId,
        crudBacked: true,
        actionBacked: true,
      });
      const componentFile = files.find((f) => f.relativePath === built.paths.componentPath);
      if (componentFile) {
        const augmentedWorkflow = augmentCrudComponentWithUniversalWorkflows(
          componentFile.content,
          workflowInput,
          approvedProductionBuildEnvelope,
        );
        files = files.map((f) =>
          f.relativePath === built.paths.componentPath
            ? { ...f, content: augmentedWorkflow.componentSource }
            : f,
        );
        files.push(...augmentedWorkflow.workflowResult.files);
      }
    }
    if (approvedProductionBuildEnvelope && shouldMaterializeUniversalRelationshipsForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true, rawPrompt: rawPrompt ?? undefined })) {
      const relationshipInput = buildRelationshipMaterializationInputFromEnvelope({
        envelope: approvedProductionBuildEnvelope,
        moduleId,
        moduleDisplayName: displayName,
        moduleRoute: route,
        appTitle,
        contractId: descriptor.contractId,
        crudBacked: true,
        actionBacked: true,
        workflowBacked: shouldMaterializeUniversalWorkflowsForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true }),
        rawPrompt: rawPrompt ?? undefined,
      });
      const componentFile = files.find((f) => f.relativePath === built.paths.componentPath);
      if (componentFile) {
        const augmentedRelationship = augmentCrudComponentWithUniversalRelationships(
          componentFile.content,
          relationshipInput,
          approvedProductionBuildEnvelope,
        );
        files = files.map((f) =>
          f.relativePath === built.paths.componentPath
            ? { ...f, content: augmentedRelationship.componentSource }
            : f,
        );
        files.push(...augmentedRelationship.relationshipResult.files);
      } else {
        // Still emit relationship hosts when the component host is absent so runtime imports resolve.
        const relationshipOnly = materializeUniversalRelationshipsForModule(
          relationshipInput,
          approvedProductionBuildEnvelope,
        );
        files.push(...relationshipOnly.files);
      }
    }
    if (approvedProductionBuildEnvelope && shouldMaterializeUniversalRuntimeForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true })) {
      const runtimeInput = buildRuntimeMaterializationInputFromEnvelope({
        envelope: approvedProductionBuildEnvelope,
        moduleId,
        moduleDisplayName: displayName,
        moduleRoute: route,
        appTitle,
        contractId: descriptor.contractId,
        crudBacked: true,
        actionBacked: shouldMaterializeUniversalActionsForModule(moduleId),
        workflowBacked: shouldMaterializeUniversalWorkflowsForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true }),
        relationshipBacked: shouldMaterializeUniversalRelationshipsForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true, rawPrompt: rawPrompt ?? undefined }),
      });
      const componentFile = files.find((f) => f.relativePath === built.paths.componentPath);
      if (componentFile) {
        const augmentedRuntime = augmentCrudComponentWithUniversalRuntime(
          componentFile.content,
          runtimeInput,
          approvedProductionBuildEnvelope,
        );
        files = files.map((f) =>
          f.relativePath === built.paths.componentPath
            ? { ...f, content: augmentedRuntime.componentSource }
            : f,
        );
        files.push(...augmentedRuntime.runtimeResult.files);
      }
    }
    if (approvedProductionBuildEnvelope && shouldMaterializeUniversalBusinessRulesForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true })) {
      const businessRuleInput = buildBusinessRuleMaterializationInputFromEnvelope({
        envelope: approvedProductionBuildEnvelope,
        moduleId,
        moduleDisplayName: displayName,
        moduleRoute: route,
        appTitle,
        contractId: descriptor.contractId,
        crudBacked: true,
        actionBacked: shouldMaterializeUniversalActionsForModule(moduleId),
        workflowBacked: shouldMaterializeUniversalWorkflowsForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true }),
        relationshipBacked: shouldMaterializeUniversalRelationshipsForModule(moduleId, approvedProductionBuildEnvelope, { crudBacked: true, rawPrompt: rawPrompt ?? undefined }),
        rawPrompt: rawPrompt ?? undefined,
      });
      const componentFile = files.find((f) => f.relativePath === built.paths.componentPath);
      const serviceFile = files.find((f) => f.relativePath === built.paths.servicePath);
      if (componentFile && serviceFile) {
        const augmentedRules = augmentCrudModuleWithUniversalBusinessRules(
          componentFile.content,
          serviceFile.content,
          businessRuleInput,
          approvedProductionBuildEnvelope,
        );
        files = files.map((f) => {
          if (f.relativePath === built.paths.componentPath) return { ...f, content: augmentedRules.componentSource };
          if (f.relativePath === built.paths.servicePath) return { ...f, content: augmentedRules.serviceSource };
          return f;
        });
        files.push(...augmentedRules.ruleResult.files);
      }
    }
    const sourceLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
    return {
      files,
      manifestEntry: {
        readOnly: true,
        id: moduleId,
        name: displayName,
        route,
        files: files.map((file) => file.relativePath),
        componentPath: built.paths.componentPath,
        servicePath: built.paths.servicePath,
        typesPath: built.paths.typesPath,
        validationPath: built.paths.validationPath,
        sourceLines,
        promptTerms: modulePromptTerms(moduleId, definition),
        contractId: descriptor.contractId,
        status: 'generated',
      },
    };
  }

  const componentPath = `${folder}/${pascal}Feature.tsx`;
  const typesPath = `${folder}/${moduleId}.types.ts`;
  const servicePath = `${folder}/${moduleId}.service.ts`;
  const validationPath = `${folder}/${moduleId}.validation.ts`;
  const cssPath = `${folder}/${moduleId}.module.css`;
  const indexPath = `${folder}/index.ts`;

  const componentContent = buildFeatureComponentTsx(moduleId, appTitle, definition, approvedSampleDataPlan);
  const cssContent =
    moduleId === 'calculator' ? buildCalculatorFeatureModuleCss() : buildFeatureModuleCss(moduleId);
  const files: GeneratedWorkspaceFile[] = [
    { relativePath: componentPath, content: componentContent },
    { relativePath: typesPath, content: buildFeatureTypesTs(moduleId, appTitle) },
    { relativePath: servicePath, content: buildFeatureServiceTs(moduleId, appTitle) },
    { relativePath: validationPath, content: buildFeatureValidationTs(moduleId, appTitle) },
    { relativePath: cssPath, content: cssContent },
    { relativePath: indexPath, content: buildFeatureIndexTs(moduleId) },
  ];

  const sourceLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);

  return {
    files,
    manifestEntry: {
      readOnly: true,
      id: moduleId,
      name: approvedEntry?.displayName ?? moduleIdToDisplayName(moduleId),
      route: approvedEntry?.route ?? resolveModuleRoute(moduleId, definition.featureModules, definition.routes),
      files: files.map((file) => file.relativePath),
      componentPath,
      servicePath,
      typesPath,
      validationPath,
      sourceLines,
      promptTerms: modulePromptTerms(moduleId, definition),
      contractId: `feature-${moduleId}`,
      status: 'generated',
    },
  };
}

export function buildAllModularFeatureModuleFiles(
  appTitle: string,
  definition: ProfileFeatureDefinition,
  approvedModuleEntries?: ReadonlyArray<ApprovedModuleMetadataEntry> | null,
  approvedSampleDataPlan?: ApprovedSampleDataPlan | null,
  approvedProductionBuildEnvelope?: ApprovedProductionBuildEnvelope | null,
  rawPrompt?: string | null,
): { files: GeneratedWorkspaceFile[]; manifestEntries: GeneratedFeatureModuleManifestEntry[] } {
  const modules =
    approvedProductionBuildEnvelope !== undefined && approvedProductionBuildEnvelope !== null
      ? resolveMaterializationModuleIdsFromEnvelope(definition, approvedProductionBuildEnvelope)
      : materializableFeatureModules(definition);
  const crudByModule: Record<string, boolean> = {};
  const actionByModule: Record<string, boolean> = {};
  const workflowByModule: Record<string, boolean> = {};
  const relationshipByModule: Record<string, boolean> = {};
  const runtimeByModule: Record<string, boolean> = {};
  const ruleByModule: Record<string, boolean> = {};

  for (const moduleId of modules) {
    const crudOpts = {
      safePaymentPlaceholderActive: definition.safePaymentPlaceholderActive === true,
      isSafePaymentModule:
        definition.safePaymentPlaceholderActive === true && isSafePaymentPlaceholderModule(moduleId),
    };
    crudByModule[moduleId] = shouldGenerateUniversalCrudForModule(moduleId, crudOpts);
    actionByModule[moduleId] =
      approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeUniversalActionsForModule(moduleId);
    workflowByModule[moduleId] =
      approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeUniversalWorkflowsForModule(moduleId, approvedProductionBuildEnvelope, {
        crudBacked: crudByModule[moduleId],
      });
    relationshipByModule[moduleId] =
      approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeUniversalRelationshipsForModule(moduleId, approvedProductionBuildEnvelope, {
        crudBacked: crudByModule[moduleId],
        rawPrompt: rawPrompt ?? undefined,
      });
    runtimeByModule[moduleId] =
      approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeUniversalRuntimeForModule(moduleId, approvedProductionBuildEnvelope, {
        crudBacked: crudByModule[moduleId],
      });
    ruleByModule[moduleId] =
      approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeUniversalBusinessRulesForModule(moduleId, approvedProductionBuildEnvelope, {
        crudBacked: crudByModule[moduleId],
      });
  }

  let compositionPlan: UniversalCapabilityCompositionPlan | null = null;
  if (
    approvedProductionBuildEnvelope &&
    shouldMaterializeCapabilityComposition(approvedProductionBuildEnvelope)
  ) {
    compositionPlan = runUniversalCapabilityComposition({
      envelope: approvedProductionBuildEnvelope,
      appTitle,
      moduleIds: modules,
      moduleEligibility: {
        crudByModule,
        actionByModule,
        workflowByModule,
        relationshipByModule,
        runtimeByModule,
        ruleByModule,
      },
      rawPrompt: rawPrompt ?? undefined,
    });
  }

  const crudEligible = compositionPlan?.nativeEngineEligibility.crud ?? modules.some((m) => crudByModule[m]);
  const actionEligible = compositionPlan?.nativeEngineEligibility.actions ?? modules.some((m) => actionByModule[m]);
  const workflowEligible = compositionPlan?.nativeEngineEligibility.workflows ?? modules.some((m) => workflowByModule[m]);
  const relationshipEligible =
    compositionPlan?.nativeEngineEligibility.relationships ?? modules.some((m) => relationshipByModule[m]);
  const runtimeEligible = compositionPlan?.nativeEngineEligibility.runtime ?? modules.some((m) => runtimeByModule[m]);
  const businessRuleEligible =
    compositionPlan?.nativeEngineEligibility.businessRules ?? modules.some((m) => ruleByModule[m]);
  const capabilityPackEligible =
    compositionPlan?.nativeEngineEligibility.capabilityPacks ??
    (approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeCapabilityPacks(approvedProductionBuildEnvelope, { crudBacked: crudEligible }));
  const behavioralVerificationEligible =
    compositionPlan?.nativeEngineEligibility.behavioralVerification ??
    (approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeBehavioralVerification(approvedProductionBuildEnvelope, { crudBacked: crudEligible }));
  const capabilityCoverageEligible =
    compositionPlan?.nativeEngineEligibility.capabilityCoverage ??
    (approvedProductionBuildEnvelope !== undefined &&
      approvedProductionBuildEnvelope !== null &&
      shouldMaterializeCapabilityCoverage(approvedProductionBuildEnvelope, {
        crudBacked: crudEligible,
        behavioralVerificationBacked: behavioralVerificationEligible,
      }));
  const productionReadinessEligible =
    compositionPlan !== null &&
    approvedProductionBuildEnvelope !== undefined &&
    approvedProductionBuildEnvelope !== null &&
    shouldMaterializeProductionReadiness(approvedProductionBuildEnvelope, {
      compositionBacked: compositionPlan !== null,
      behavioralVerificationBacked: behavioralVerificationEligible,
    });
  const autonomousEngineeringEligible =
    productionReadinessEligible &&
    shouldMaterializeAutonomousEngineering(approvedProductionBuildEnvelope, {
      compositionBacked: compositionPlan !== null,
      readinessBlocked: true,
    });
  const files: GeneratedWorkspaceFile[] = [
    ...(compositionPlan ? buildCompositionSharedRuntimeFiles() : []),
    ...(productionReadinessEligible ? buildProductionReadinessSharedRuntimeFiles() : []),
    ...(autonomousEngineeringEligible ? buildAutonomousEngineeringSharedRuntimeFiles() : []),
    ...(crudEligible ? buildUniversalCrudSharedRuntimeFiles() : []),
    ...(actionEligible ? buildUniversalActionSharedRuntimeFiles() : []),
    ...(workflowEligible ? buildUniversalWorkflowSharedRuntimeFiles() : []),
    ...(relationshipEligible ? buildUniversalRelationshipSharedRuntimeFiles() : []),
    ...(runtimeEligible ? buildUniversalRuntimeSharedRuntimeFiles() : []),
    ...(businessRuleEligible ? buildUniversalBusinessRuleSharedRuntimeFiles() : []),
    ...(capabilityPackEligible ? buildCapabilityPackSharedRuntimeFiles() : []),
    ...(behavioralVerificationEligible ? buildBehaviorVerificationSharedRuntimeFiles() : []),
    ...(capabilityCoverageEligible ? buildCapabilityCoverageSharedRuntimeFiles() : []),
  ];
  const manifestEntries: GeneratedFeatureModuleManifestEntry[] = [];

  for (const moduleId of modules) {
    const built = buildModularFeatureModuleFiles(
      moduleId,
      appTitle,
      definition,
      approvedModuleEntries,
      approvedSampleDataPlan,
      approvedProductionBuildEnvelope,
      rawPrompt,
    );
    files.push(...built.files);
    manifestEntries.push(built.manifestEntry);
  }

  // Prefer CBGA approved module order for home (`/`); rewrite duplicates so registry/route
  // audits never observe two hosts on `/` even when plan/definition order drifts.
  {
    const homeModuleId =
      (approvedModuleEntries ?? []).find((entry) => entry.route === '/')?.moduleId ??
      (approvedModuleEntries ?? [])[0]?.moduleId ??
      modules[0] ??
      null;
    for (let i = 0; i < manifestEntries.length; i++) {
      const entry = manifestEntries[i]!;
      const route = entry.id === homeModuleId ? '/' : `/${entry.id}`;
      if (entry.route !== route) {
        manifestEntries[i] = { ...entry, route };
      }
    }
  }

  if (capabilityPackEligible && approvedProductionBuildEnvelope) {
    const packInput = compositionPlan
      ? buildCapabilityPackMaterializationInputFromCompositionPlan({
          envelope: approvedProductionBuildEnvelope,
          appTitle,
          moduleIds: modules,
          plan: compositionPlan,
          rawPrompt: rawPrompt ?? undefined,
        })
      : buildCapabilityPackMaterializationInputFromEnvelope({
          envelope: approvedProductionBuildEnvelope,
          appTitle,
          moduleIds: modules,
          crudBacked: crudEligible,
          actionBacked: actionEligible,
          workflowBacked: workflowEligible,
          relationshipBacked: relationshipEligible,
          runtimeBacked: runtimeEligible,
          ruleBacked: businessRuleEligible,
          rawPrompt: rawPrompt ?? undefined,
        });
    const packResult = augmentWorkspaceFilesWithCapabilityPacks(files, approvedProductionBuildEnvelope, packInput);
    files.length = 0;
    files.push(...packResult.files);
  }

  if (behavioralVerificationEligible && approvedProductionBuildEnvelope) {
    const behaviorInput = buildBehaviorVerificationMaterializationInputFromEnvelope({
      envelope: approvedProductionBuildEnvelope,
      appTitle,
      moduleIds: modules,
      contractId: approvedProductionBuildEnvelope.traceability.contractId,
      crudBacked: crudEligible,
      actionBacked: actionEligible,
      workflowBacked: workflowEligible,
      relationshipBacked: relationshipEligible,
      runtimeBacked: runtimeEligible,
      ruleBacked: businessRuleEligible,
      capabilityPackBacked: capabilityPackEligible,
      rawPrompt: rawPrompt ?? undefined,
      definition,
    });
    // Navigation-reachability parity: B8 verifies each module's route against the feature
    // registry (`src/features/registry.ts`). That file is emitted by the app-materialization
    // engine AFTER this modular pass, so it is not yet present in `files` — which previously made
    // every `route-reachable` behavior check fail (a false negative that cascaded into
    // BEHAVIORAL_READINESS + CAPABILITY_READINESS blockers). Build the registry/routes
    // deterministically from the SAME manifest entries the app engine will use and hand them to
    // B8 for execution only. They are NOT persisted here (the app engine stays the sole emitter),
    // so no duplicate file is written to the workspace.
    const behaviorHomeModuleId =
      (approvedModuleEntries ?? []).find((entry) => entry.route === '/')?.moduleId ??
      (approvedModuleEntries ?? [])[0]?.moduleId ??
      modules[0] ??
      null;
    const navigationSurfaceFiles: GeneratedWorkspaceFile[] = [
      {
        relativePath: 'src/features/registry.ts',
        content: buildModularFeatureRegistryTs(manifestEntries, behaviorHomeModuleId),
      },
      { relativePath: 'src/features/routes.ts', content: buildModularFeatureRoutesTs() },
    ];
    const behaviorResult = materializeBehaviorVerificationForWorkspace(
      [...files, ...navigationSurfaceFiles],
      approvedProductionBuildEnvelope,
      behaviorInput,
    );
    files.push(...behaviorResult.files);
  }

  if (capabilityCoverageEligible && approvedProductionBuildEnvelope) {
    const coverageInput = buildCapabilityCoverageMaterializationInputFromEnvelope({
      envelope: approvedProductionBuildEnvelope,
      appTitle,
      moduleIds: modules,
      contractId: approvedProductionBuildEnvelope.traceability.contractId,
      crudBacked: crudEligible,
      actionBacked: actionEligible,
      workflowBacked: workflowEligible,
      relationshipBacked: relationshipEligible,
      runtimeBacked: runtimeEligible,
      ruleBacked: businessRuleEligible,
      capabilityPackBacked: capabilityPackEligible,
      behavioralVerificationBacked: behavioralVerificationEligible,
    });
    const coverageResult = augmentWorkspaceFilesWithCapabilityCoverage(
      files,
      approvedProductionBuildEnvelope,
      coverageInput,
    );
    files.length = 0;
    files.push(...coverageResult.files);
  }

  if (compositionPlan && approvedProductionBuildEnvelope) {
    const compositionInput = buildCompositionMaterializationInputFromEnvelope({
      envelope: approvedProductionBuildEnvelope,
      appTitle,
      moduleIds: modules,
      contractId: approvedProductionBuildEnvelope.traceability.contractId,
      compositionPlan,
      rawPrompt: rawPrompt ?? undefined,
    });
    const compositionResult = augmentWorkspaceFilesWithCapabilityComposition(
      files,
      approvedProductionBuildEnvelope,
      compositionPlan,
      compositionInput,
    );
    files.length = 0;
    files.push(...compositionResult.files);
  }

  if (productionReadinessEligible && approvedProductionBuildEnvelope && compositionPlan) {
    const readinessInput = buildProductionReadinessMaterializationInputFromEnvelope({
      envelope: approvedProductionBuildEnvelope,
      appTitle,
      moduleIds: modules,
      contractId: approvedProductionBuildEnvelope.traceability.contractId,
      compositionBacked: true,
      behavioralVerificationBacked: behavioralVerificationEligible,
      capabilityCoverageBacked: capabilityCoverageEligible,
    });
    const readinessResult = augmentWorkspaceFilesWithProductionReadiness(
      files,
      approvedProductionBuildEnvelope,
      readinessInput,
    );
    files.length = 0;
    files.push(...readinessResult.files);

    if (
      autonomousEngineeringEligible &&
      readinessResult.report.readinessVerdict !== 'PRODUCTION_READY'
    ) {
      const autonomousResult = augmentWorkspaceFilesWithAutonomousEngineering(
        files,
        approvedProductionBuildEnvelope,
        {
          envelope: approvedProductionBuildEnvelope,
          appTitle,
          moduleIds: modules,
          contractId: approvedProductionBuildEnvelope.traceability.contractId,
          compositionBacked: true,
          behavioralVerificationBacked: behavioralVerificationEligible,
          capabilityCoverageBacked: capabilityCoverageEligible,
        },
      );
      files.length = 0;
      files.push(...autonomousResult.files);
    }
  }

  return { files, manifestEntries };
}

export function buildModularFeatureRegistryTs(
  entries: GeneratedFeatureModuleManifestEntry[],
  preferredHomeModuleId?: string | null,
): string {
  const homeModuleId =
    preferredHomeModuleId ??
    entries.find((entry) => entry.route === '/')?.id ??
    entries[0]?.id ??
    null;
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    route: entry.id === homeModuleId ? '/' : `/${entry.id}`,
  }));
  const imports = normalizedEntries
    .map((entry) => `import ${moduleIdToPascalCase(entry.id)}Feature from './${entry.id}';`)
    .join('\n');

  const registryBody = normalizedEntries
    .map(
      (entry) => `  {
    id: '${entry.id}',
    name: '${entry.name}',
    route: '${entry.route}',
    component: ${moduleIdToPascalCase(entry.id)}Feature,
    sourcePath: '${entry.componentPath}',
    contractId: '${entry.contractId}',
    promptTerms: ${JSON.stringify(entry.promptTerms)},
    status: 'generated' as const,
  }`,
    )
    .join(',\n');

  return `/** Feature module registry — Modular Feature Materialization V1 */
${imports}

export const FEATURE_REGISTRY = [
${registryBody}
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
`;
}

export function buildModularFeatureRoutesTs(): string {
  return `/** Route registry — Modular Feature Materialization V1 */
import { FEATURE_REGISTRY } from './registry';

export const APP_ROUTES = FEATURE_REGISTRY.map((entry) => ({
  path: entry.route,
  moduleId: entry.id,
  name: entry.name,
  component: entry.component,
  sourcePath: entry.sourcePath,
})) as const;

export type AppRouteEntry = (typeof APP_ROUTES)[number];
export type AppRoutePath = AppRouteEntry['path'];
`;
}

/**
 * @param approvedDisplayName Identity Computation Collapse V1 — the single approved, CBGA-repaired
 * product identity (PPC-1207 No Parallel Truth). When supplied (the real production path), it is
 * the ONLY source for the rendered app title — the headline-split fallback below never runs.
 * Optional so pre-CBGA/isolated/test-only callers keep the existing draft-derivation behavior.
 * @param approvedNavItems Navigation Computation Collapse V1 — the approved, CBGA-repaired
 * navigation plan's items (`ApprovedNavigationPlan.navigationItems`), keyed by `moduleId`. When
 * supplied, every rendered nav button's LABEL is taken from this plan for the modules it covers —
 * `moduleIdToDisplayName(moduleId)` (an independent, contract-unaware slug→title-case derivation)
 * never determines a label the plan already approved. Which modules render as buttons at all, and
 * in what order, remains driven by `definition.featureModules` exactly as before (that set is
 * itself already CBGA-repaired upstream — see contract-bound-generation-adapter.ts) — this
 * parameter only collapses the independently-computed *label*, never the module/route selection.
 * Optional so pre-CBGA/isolated/test-only callers keep the existing draft-derivation behavior.
 * @param approvedModuleEntries Module Computation Collapse V1 — the approved, CBGA-repaired
 * module plan's entries (`ApprovedModulePlan.moduleEntries`), keyed by `moduleId`. Used as the
 * second-priority label source (after `approvedNavItems`, which is navigation-specific) — a
 * module the navigation plan does not label but the module plan does still renders its approved
 * displayName rather than the independent `moduleIdToDisplayName(moduleId)` derivation. Optional
 * so pre-CBGA/isolated/test-only callers keep the existing draft-derivation behavior.
 */
export function buildFeatureAppRouterTsx(
  definition: ProfileFeatureDefinition,
  approvedDisplayName?: string | null,
  approvedNavItems?: ReadonlyArray<{ readonly moduleId: string; readonly label: string }> | null,
  approvedModuleEntries?: ReadonlyArray<ApprovedModuleMetadataEntry> | null,
  materializedModuleIds?: readonly string[] | null,
): string {
  const navModules = (materializedModuleIds ?? materializableFeatureModules(definition)).filter(
    (moduleId) => moduleId !== 'auth',
  );
  const defaultModule =
    (approvedModuleEntries ?? []).find((entry) => entry.route === '/')?.moduleId ??
    (approvedModuleEntries ?? [])[0]?.moduleId ??
    navModules[0] ??
    'home';
  const orderedNavModules = (() => {
    if (!navModules.includes(defaultModule)) return navModules;
    return [defaultModule, ...navModules.filter((moduleId) => moduleId !== defaultModule)];
  })();
  const approvedNavLabelByModuleId = new Map(
    (approvedNavItems ?? []).map((item) => [item.moduleId, item.label] as const),
  );
  const approvedModuleDisplayNameByModuleId = new Map(
    (approvedModuleEntries ?? []).map((entry) => [entry.moduleId, entry.displayName] as const),
  );
  const navLabelFor = (moduleId: string): string =>
    approvedNavLabelByModuleId.get(moduleId) ??
    approvedModuleDisplayNameByModuleId.get(moduleId) ??
    moduleIdToDisplayName(moduleId);
  const copy = definition.customDomainCopy ?? {};
  const appTitle = approvedDisplayName && approvedDisplayName.trim().length > 0
    ? approvedDisplayName
    : copy.headline?.split(' — ')[0] ?? 'Custom App';
  const androidPreview = definition.androidPhonePreviewRequired === true;
  // Production Generator Contract Consumption Fix V1 — the assistive-communication header must
  // require an EXPLICIT contract/evidence signal (the profile resolver's own
  // `resolveAssistiveCommunicationProfile()` decision), never merely the presence of
  // `customDomainCopy` — every custom app has customDomainCopy, so that check treated ALL custom
  // apps as assistive apps regardless of actual domain evidence.
  const isAssistiveApp = definition.profile === 'ASSISTIVE_COMMUNICATION_APP_V1';

  const navButtons = orderedNavModules
    .map(
      (moduleId) =>
        `        <button
          type="button"
          className={\`modular-nav-item \${activeModuleId === '${moduleId}' ? 'is-active' : ''}\`}
          onClick={() => setActiveModuleId('${moduleId}')}
        >
          ${navLabelFor(moduleId)}
        </button>`,
    )
    .join('\n');

  const assistiveHeader = isAssistiveApp
    ? `
      <header className="assistive-app-header" data-communication-board="true">
        <h1>${esc(appTitle)}</h1>
        <p className="assistive-subtitle">Assistive communication board</p>
        <div className="assistive-status-row">
          <span data-blink-status="ready">Blink: ready</span>
          <span data-gaze-status="tracking">Gaze: tracking</span>
          <span data-speech-status="idle">Speech: idle</span>
        </div>
        <div className="assistive-controls">
          <button type="button" className="assistive-speak-btn" data-text-to-speech="true">Speak</button>
          <button type="button" className="assistive-emergency-btn" data-emergency-speech="true">Emergency speech</button>
        </div>
        <p className="assistive-safety-note">Large accessible tiles for assistive communication. Safety note: emergency speech is always visible.</p>
      </header>`
    : '';

  const routerClass = androidPreview
    ? 'feature-app-router android-phone-preview'
    : 'feature-app-router';

  // Identity Computation Collapse V1 — `appTitle` now prefers the approved, CBGA-repaired identity
  // passed in by the caller. The `customDomainCopy.headline`-splitting fallback below only runs for
  // pre-CBGA/isolated/test-only callers that omit `approvedDisplayName` entirely.
  contractConsumptionTrace({
    requestId: 'N/A',
    buildId: 'N/A',
    projectId: 'N/A',
    promptHash: shortHashForTrace(appTitle),
    stage: 'FEATURE_APP_ROUTER_GENERATION',
    functionName: 'buildFeatureAppRouterTsx',
    sourceFile: 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
    branchSelected: isAssistiveApp ? 'ASSISTIVE_HEADER_INJECTED' : 'NO_ASSISTIVE_HEADER',
    inputProductIdentity: copy.headline ?? null,
    outputProductIdentity: appTitle,
    inputModules: navModules,
    outputModules: navModules,
    inputRoutes: [],
    outputRoutes: [],
    inputNavigation: navModules,
    outputNavigation: navModules.map(navLabelFor),
    inputVisibleText: [copy.headline ?? ''],
    outputVisibleText: [appTitle, ...(isAssistiveApp ? ['Assistive communication board', 'Emergency speech'] : [])],
    fallbackSelected: appTitle === 'Custom App',
    genericTemplateSelected: isAssistiveApp,
    contractConsumed: Boolean(approvedDisplayName && approvedDisplayName.trim().length > 0),
    // Navigation Computation Collapse V1 — also true whenever the approved navigation plan's
    // items supplied at least one of this build's rendered nav labels (not only on identity).
    cbgaPlanConsumed: Boolean(
      (approvedDisplayName && approvedDisplayName.trim().length > 0) ||
        approvedNavLabelByModuleId.size > 0 ||
        approvedModuleDisplayNameByModuleId.size > 0,
    ),
    promptBoundedModulePlanConsumed: false,
    universalFeatureContractConsumed: false,
    profileFeatureDefinitionConsumed: true,
  });

  return `import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY } from './registry';
import './feature-app-router.css';

/** Modular feature router — renders registry modules dynamically */
export default function FeatureAppRouter() {
  const [activeModuleId, setActiveModuleId] = useState('${defaultModule}');
  const activeEntry = useMemo(
    () => FEATURE_REGISTRY.find((entry) => entry.id === activeModuleId) ?? FEATURE_REGISTRY[0],
    [activeModuleId],
  );
  const ActiveComponent = activeEntry?.component;

  return (
    <div
      className="${routerClass}"
      data-modular-feature-router="v1"
      data-materialization-profile="${definition.profile}"${androidPreview ? '\n      data-android-phone-preview="true"' : ''}
    >${assistiveHeader}
      <nav className="modular-nav" aria-label="Feature modules">
${navButtons}
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
`;
}

export function buildFeatureAppRouterCss(definition?: ProfileFeatureDefinition): string {
  const phoneCss = definition?.androidPhonePreviewRequired
    ? `
.android-phone-preview {
  max-width: 420px;
  min-height: 720px;
  margin: 0 auto;
  border: 12px solid #1e293b;
  border-radius: 28px;
  padding: 1rem;
  background: #f8fafc;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
}
.assistive-app-header { margin-bottom: 1rem; }
.assistive-app-header h1 { font-size: 1.35rem; margin: 0 0 0.25rem; }
.assistive-subtitle { margin: 0 0 0.75rem; color: #475569; font-weight: 600; }
.assistive-status-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.9rem; }
.assistive-controls { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.assistive-speak-btn, .assistive-emergency-btn {
  flex: 1;
  min-height: 48px;
  font-size: 1rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
}
.assistive-speak-btn { background: #2563eb; color: #fff; }
.assistive-emergency-btn { background: #dc2626; color: #fff; font-weight: 700; }
.assistive-safety-note { font-size: 0.85rem; color: #64748b; margin: 0; }
.modular-nav-item { min-height: 44px; font-size: 0.95rem; }
`
    : '';
  return `.feature-app-router { width: 100%; max-width: 960px; margin: 0 auto; }
.modular-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.modular-nav-item { border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 0.4rem 0.85rem; cursor: pointer; }
.modular-nav-item.is-active { background: #2563eb; color: #fff; border-color: transparent; }
.modular-active-feature { min-height: 240px; }
${phoneCss}`;
}
