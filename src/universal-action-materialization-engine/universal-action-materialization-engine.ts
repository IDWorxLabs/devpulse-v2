/**
 * Universal Action Materialization Engine V1 — orchestrator.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { extractApprovedActionsFromEnvelope } from './approved-action-extractor.js';
import { normalizeApprovedActions } from './action-normalization-engine.js';
import { classifyActionSupport } from './action-support-classifier.js';
import { buildActionDescriptors } from './action-descriptor-builder.js';
import { generateActionHandlersSource, generateActionDescriptorsSource } from './action-handler-generator.js';
import { generateActionToolbarJsx, generateActionModuleCss } from './action-control-generator.js';
import { generateConfirmationPanelJsx } from './action-confirmation-generator.js';
import { generateFeedbackPanelJsx } from './action-feedback-generator.js';
import { generateUndoRetryJsx } from './action-undo-retry-generator.js';
import {
  verifyUniversalActionBehavior,
  type ActionGeneratedSources,
} from './action-behavior-verification.js';
import {
  buildUniversalActionMaterializationReport,
  renderUniversalActionMaterializationReportMarkdown,
  computeUniversalActionCapabilityCoverageScore,
} from './action-materialization-report.js';
import { buildUniversalActionSharedRuntimeFiles } from './action-shared-runtime.js';
import type {
  RawApprovedAction,
  UniversalActionDescriptor,
  UniversalActionMaterializationInput,
  UniversalActionMaterializationReport,
} from './universal-action-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';
import { escActionString } from './universal-action-types.js';

export interface UniversalActionModuleMaterializationResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly descriptors: UniversalActionDescriptor[];
  readonly report: UniversalActionMaterializationReport;
  readonly componentAugmentation: string;
}

export function buildActionMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  moduleId: string;
  moduleDisplayName: string;
  moduleRoute: string;
  appTitle: string;
  contractId: string;
  crudBacked: boolean;
}): UniversalActionMaterializationInput {
  const routes = input.envelope.approvedModulePlan.moduleEntries.map((e) => e.route);
  return {
    moduleId: input.moduleId,
    moduleDisplayName: input.moduleDisplayName,
    moduleRoute: input.moduleRoute,
    appTitle: input.appTitle,
    contractId: input.contractId,
    crudBacked: input.crudBacked,
    approvedRoutes: routes,
    canonicalProductContract: input.envelope.canonicalProductContract,
    approvedModulePlan: input.envelope.approvedModulePlan,
    buildId: input.envelope.buildId,
    promptHash: input.envelope.promptHash,
  };
}

export function materializeUniversalActionsForModule(
  materializationInput: UniversalActionMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): UniversalActionModuleMaterializationResult {
  let rawActions = extractApprovedActionsFromEnvelope({
    envelope,
    moduleId: materializationInput.moduleId,
    contractId: materializationInput.contractId,
    includeAllContractActions: materializationInput.crudBacked,
  });
  if (materializationInput.crudBacked) {
    rawActions = ensureCrudBackedBaselineActions(rawActions, materializationInput);
  }
  const normalized = normalizeApprovedActions(rawActions);
  const classifications = normalized.map((n) =>
    classifyActionSupport({
      normalized: n,
      crudBacked: materializationInput.crudBacked,
      approvedRoutes: materializationInput.approvedRoutes,
    }),
  );
  const descriptors = buildActionDescriptors(normalized, classifications, materializationInput);

  const handlersSource = generateActionHandlersSource(descriptors, materializationInput);
  const descriptorsSource = generateActionDescriptorsSource(descriptors, materializationInput);
  const toolbarJsx = generateActionToolbarJsx(descriptors);
  const confirmationJsx = generateConfirmationPanelJsx(descriptors);
  const feedbackJsx = generateFeedbackPanelJsx();
  const undoJsx = generateUndoRetryJsx(descriptors);

  const componentAugmentation = `${toolbarJsx}${confirmationJsx}${feedbackJsx}${undoJsx}`;

  const verifications = descriptors.map((descriptor) => {
    const sources: ActionGeneratedSources = {
      handlers: handlersSource,
      descriptors: descriptorsSource,
      componentFragment: componentAugmentation,
    };
    return verifyUniversalActionBehavior(descriptor, sources);
  });

  const report = buildUniversalActionMaterializationReport({
    moduleId: materializationInput.moduleId,
    descriptors,
    verifications,
  });

  const moduleId = materializationInput.moduleId;
  const pascal = moduleIdToPascalCase(moduleId);
  const files: GeneratedWorkspaceFile[] = [
    { relativePath: `src/features/${moduleId}/${moduleId}.action-handlers.ts`, content: handlersSource },
    { relativePath: `src/features/${moduleId}/${moduleId}.universal-actions.ts`, content: descriptorsSource },
    {
      relativePath: `src/features/${moduleId}/${moduleId}.action-report.json`,
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
  ];

  if (materializationInput.crudBacked) {
    files.push({
      relativePath: `src/features/${moduleId}/${moduleId}.action-toolbar.module.css`,
      content: generateActionModuleCss(),
    });
  }

  return { files, descriptors, report, componentAugmentation };
}

/** Injects action toolbar + handlers into B1 CRUD component source. */
export function augmentCrudComponentWithUniversalActions(
  componentSource: string,
  materializationInput: UniversalActionMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): { componentSource: string; actionResult: UniversalActionModuleMaterializationResult } {
  const actionResult = materializeUniversalActionsForModule(materializationInput, envelope);
  const pascal = moduleIdToPascalCase(materializationInput.moduleId);
  const moduleId = materializationInput.moduleId;

  let augmented = componentSource;
  if (!augmented.includes('use' + pascal + 'ActionHandlers')) {
    augmented = augmented.replace(
      `import { use${pascal}CrudRuntime } from './${moduleId}.runtime-state';`,
      `import { use${pascal}CrudRuntime } from './${moduleId}.runtime-state';
import { use${pascal}ActionHandlers } from './${moduleId}.action-handlers';`,
    );
    augmented = augmented.replace(
      `const crud = use${pascal}CrudRuntime(10);`,
      `const crud = use${pascal}CrudRuntime(10);
  const actions = use${pascal}ActionHandlers(crud);`,
    );
  }

  if (!augmented.includes('data-universal-action-engine')) {
    augmented = augmented.replace(
      'data-universal-crud-engine="v1"',
      'data-universal-crud-engine="v1"\n      data-universal-action-engine="v1"',
    );
  }

  const injectionPoint = '<header className="modular-feature-header">';
  if (augmented.includes(injectionPoint) && actionResult.componentAugmentation.trim()) {
    augmented = augmented.replace(
      injectionPoint,
      `${injectionPoint}\n${actionResult.componentAugmentation}`,
    );
  } else if (actionResult.descriptors.length > 0) {
    augmented = augmented.replace(
      '</section>',
      `${actionResult.componentAugmentation}\n    </section>`,
    );
  }

  return { componentSource: augmented, actionResult };
}

/** Generates standalone action-driven feature for non-CRUD modules. */
export function buildStandaloneActionFeatureSource(
  materializationInput: UniversalActionMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): { files: GeneratedWorkspaceFile[]; report: UniversalActionMaterializationReport } {
  const actionResult = materializeUniversalActionsForModule(materializationInput, envelope);
  const pascal = moduleIdToPascalCase(materializationInput.moduleId);
  const moduleId = materializationInput.moduleId;
  const displayName = escActionString(materializationInput.moduleDisplayName);

  const featureSource = `import { use${pascal}ActionHandlers } from './${moduleId}.action-handlers';
import './${moduleId}.action-toolbar.module.css';

const noopCrud = {
  items: [],
  selectedIds: [],
  refresh: () => {},
  toggleSelection: () => {},
  clearSelection: () => {},
  create: () => {},
  update: () => {},
  requestDelete: () => {},
  undoDelete: () => {},
  undoSnapshot: null,
  error: null,
  success: null,
} as never;

export default function ${pascal}Feature() {
  const actions = use${pascal}ActionHandlers(noopCrud);
  return (
    <section
      className="modular-feature universal-action-feature"
      data-feature-module="${moduleId}"
      data-universal-action-engine="v1"
      data-interaction-control="true"
    >
      <header className="modular-feature-header">
        <h2>${displayName}</h2>
      </header>
      ${actionResult.componentAugmentation}
    </section>
  );
}
`;

  const files: GeneratedWorkspaceFile[] = [
    ...actionResult.files,
    { relativePath: `src/features/${moduleId}/${pascal}Feature.tsx`, content: featureSource },
    { relativePath: `src/features/${moduleId}/${moduleId}.action-toolbar.module.css`, content: generateActionModuleCss() },
  ];

  return { files, report: actionResult.report };
}

export function shouldMaterializeUniversalActionsForModule(
  moduleId: string,
  options?: { isExcludedShell?: boolean },
): boolean {
  const excluded = new Set(['auth', 'persistence', 'calculator', 'navigation-router']);
  if (excluded.has(moduleId)) return false;
  if (options?.isExcludedShell) return false;
  return true;
}

function ensureCrudBackedBaselineActions(
  rawActions: RawApprovedAction[],
  input: UniversalActionMaterializationInput,
): RawApprovedAction[] {
  const baseline = ['Create', 'Refresh', 'Export'];
  const existing = new Set(rawActions.map((a) => a.label.toLowerCase()));
  const merged = [...rawActions];
  for (const label of baseline) {
    if ([...existing].some((e) => e.includes(label.toLowerCase()))) continue;
    merged.push({
      label,
      sourceEnvelopePath: 'universal-action-engine.crud-baseline',
      moduleId: input.moduleId,
      contractId: input.contractId,
    });
    existing.add(label.toLowerCase());
  }
  return merged;
}

export {
  buildUniversalActionSharedRuntimeFiles,
  buildUniversalActionMaterializationReport,
  renderUniversalActionMaterializationReportMarkdown,
  computeUniversalActionCapabilityCoverageScore,
  extractApprovedActionsFromEnvelope,
  verifyUniversalActionBehavior,
};

export { diagnoseUniversalActionMaterializationGaps } from './action-behavior-verification.js';
export { UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_VERSION, UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_SOURCE } from './universal-action-types.js';
