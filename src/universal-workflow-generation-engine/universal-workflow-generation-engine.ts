/**
 * Universal Workflow Generation Engine V1 — orchestrator.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { extractApprovedWorkflowsFromEnvelope } from './approved-workflow-extractor.js';
import { normalizeApprovedWorkflows } from './workflow-normalization-engine.js';
import { classifyWorkflowSupport } from './workflow-support-classifier.js';
import { buildWorkflowDescriptors } from './workflow-descriptor-builder.js';
import { validateWorkflowGraph } from './workflow-graph-validator.js';
import {
  generateWorkflowInstanceRepositorySource,
  generateWorkflowRuntimeHookSource,
} from './workflow-instance-persistence.js';
import { generateWorkflowPanelJsx, generateWorkflowModuleCss } from './workflow-ui-generator.js';
import {
  verifyUniversalWorkflowBehavior,
  type WorkflowGeneratedSources,
} from './workflow-behavior-verification.js';
import { buildUniversalWorkflowMaterializationReport } from './workflow-generation-report.js';
import { buildUniversalWorkflowSharedRuntimeFiles } from './workflow-state-machine-runtime.js';
import type {
  RawApprovedWorkflow,
  UniversalWorkflowDescriptor,
  UniversalWorkflowMaterializationInput,
  UniversalWorkflowMaterializationReport,
} from './universal-workflow-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';
import { escWorkflowString } from './universal-workflow-types.js';

export interface UniversalWorkflowModuleMaterializationResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly descriptors: UniversalWorkflowDescriptor[];
  readonly report: UniversalWorkflowMaterializationReport;
  readonly componentAugmentation: string;
}

export function buildWorkflowMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  moduleId: string;
  moduleDisplayName: string;
  moduleRoute: string;
  appTitle: string;
  contractId: string;
  crudBacked: boolean;
  actionBacked: boolean;
}): UniversalWorkflowMaterializationInput {
  return {
    moduleId: input.moduleId,
    moduleDisplayName: input.moduleDisplayName,
    moduleRoute: input.moduleRoute,
    appTitle: input.appTitle,
    contractId: input.contractId,
    crudBacked: input.crudBacked,
    actionBacked: input.actionBacked,
    approvedRoutes: input.envelope.approvedModulePlan.moduleEntries.map((e) => e.route),
    canonicalProductContract: input.envelope.canonicalProductContract,
    approvedModulePlan: input.envelope.approvedModulePlan,
    buildId: input.envelope.buildId,
    promptHash: input.envelope.promptHash,
  };
}

export function materializeUniversalWorkflowsForModule(
  materializationInput: UniversalWorkflowMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): UniversalWorkflowModuleMaterializationResult {
  let rawWorkflows = extractApprovedWorkflowsFromEnvelope({
    envelope,
    moduleId: materializationInput.moduleId,
    contractId: materializationInput.contractId,
  });
  rawWorkflows = ensureWorkflowBaseline(rawWorkflows, materializationInput, envelope);

  const normalized = normalizeApprovedWorkflows(rawWorkflows, materializationInput.canonicalProductContract);
  const classifications = normalized.map((n) => classifyWorkflowSupport(n));
  const descriptors = buildWorkflowDescriptors(normalized, classifications, materializationInput).map((descriptor) => {
    const graph = validateWorkflowGraph(descriptor);
    if (!graph.valid && descriptor.supportClassification !== 'BLOCKED_BY_FUTURE_CAPABILITY') {
      return {
        ...descriptor,
        supportClassification: 'INVALID_WORKFLOW_CONTRACT' as const,
        blockedReason: graph.errors.join('; '),
      };
    }
    return descriptor;
  });

  const primary = descriptors[0];
  const runtimeSource = primary ? generateWorkflowRuntimeHookSource(primary, materializationInput) : '';
  const repositorySource = primary ? generateWorkflowInstanceRepositorySource(primary, materializationInput) : '';
  const descriptorsSource = generateWorkflowDescriptorsSource(descriptors, materializationInput);
  const panelJsx = generateWorkflowPanelJsx(descriptors);
  const componentAugmentation = panelJsx;

  const verifications = descriptors.map((descriptor) => {
    const sources: WorkflowGeneratedSources = {
      runtime: runtimeSource,
      repository: repositorySource,
      componentFragment: componentAugmentation,
      descriptors: descriptorsSource,
    };
    return verifyUniversalWorkflowBehavior(descriptor, sources);
  });

  const report = buildUniversalWorkflowMaterializationReport({
    moduleId: materializationInput.moduleId,
    descriptors,
    verifications,
  });

  const moduleId = materializationInput.moduleId;
  const files: GeneratedWorkspaceFile[] = [];
  if (primary && runtimeSource) {
    files.push(
      { relativePath: `src/features/${moduleId}/${moduleId}.workflow-runtime.ts`, content: runtimeSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.workflow-instance.repository.ts`, content: repositorySource },
      { relativePath: `src/features/${moduleId}/${moduleId}.universal-workflows.ts`, content: descriptorsSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.workflow-report.json`, content: `${JSON.stringify(report, null, 2)}\n` },
      { relativePath: `src/features/${moduleId}/${moduleId}.workflow.module.css`, content: generateWorkflowModuleCss() },
    );
  }

  return { files, descriptors, report, componentAugmentation };
}

function generateWorkflowDescriptorsSource(
  descriptors: readonly UniversalWorkflowDescriptor[],
  input: UniversalWorkflowMaterializationInput,
): string {
  return `/** Universal workflow descriptors — ${escWorkflowString(input.moduleDisplayName)} */
export const ${moduleIdToPascalCase(input.moduleId)}_UNIVERSAL_WORKFLOWS = ${JSON.stringify(
    descriptors.map((d) => ({
      workflowId: d.workflowId,
      label: d.label,
      supportClassification: d.supportClassification,
      entryStateId: d.entryStateId,
      terminalStateIds: d.terminalStateIds,
      stepCount: d.steps.length,
      transitionCount: d.transitions.length,
      blockedReason: d.blockedReason ?? null,
    })),
    null,
    2,
  )} as const;
`;
}

export function augmentCrudComponentWithUniversalWorkflows(
  componentSource: string,
  materializationInput: UniversalWorkflowMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): { componentSource: string; workflowResult: UniversalWorkflowModuleMaterializationResult } {
  const workflowResult = materializeUniversalWorkflowsForModule(materializationInput, envelope);
  const pascal = moduleIdToPascalCase(materializationInput.moduleId);
  const moduleId = materializationInput.moduleId;

  let augmented = componentSource;
  if (workflowResult.descriptors.length > 0 && !augmented.includes(`use${pascal}WorkflowRuntime`)) {
    const importLine = `import { use${pascal}WorkflowRuntime } from './${moduleId}.workflow-runtime';`;
    if (augmented.includes('from \'react\'')) {
      augmented = augmented.replace(
        /import \{([^}]+)\} from 'react';/,
        (match, imports) => `import {${imports}} from 'react';\n${importLine}`,
      );
    } else {
      augmented = `${importLine}\n${augmented}`;
    }
    augmented = augmented.replace(
      /const \[createLabel, setCreateLabel\] = useState\(''\);/,
      `const workflow = use${pascal}WorkflowRuntime();
  const [workflowInput, setWorkflowInput] = useState('');
  const [createLabel, setCreateLabel] = useState('');`,
    );
    if (!augmented.includes(`use${pascal}WorkflowRuntime()`)) {
      augmented = augmented.replace(
        'const crud = use',
        `const workflow = use${pascal}WorkflowRuntime();
  const [workflowInput, setWorkflowInput] = useState('');
  const crud = use`,
      );
    }
  }

  if (!augmented.includes('data-universal-workflow-engine')) {
    augmented = augmented.replace(
      'data-universal-crud-engine="v1"',
      'data-universal-crud-engine="v1"\n      data-universal-workflow-engine="v1"',
    );
  }

  if (workflowResult.componentAugmentation.trim()) {
    const injectionPoint = '<header className="modular-feature-header">';
    if (augmented.includes(injectionPoint)) {
      augmented = augmented.replace(
        injectionPoint,
        `${injectionPoint}\n${workflowResult.componentAugmentation}`,
      );
    } else {
      augmented = augmented.replace('</section>', `${workflowResult.componentAugmentation}\n    </section>`);
    }
  }

  return { componentSource: augmented, workflowResult };
}

function ensureWorkflowBaseline(
  rawWorkflows: RawApprovedWorkflow[],
  input: UniversalWorkflowMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): RawApprovedWorkflow[] {
  if (rawWorkflows.length > 0) return rawWorkflows;
  if (envelope.canonicalProductContract.primaryWorkflows.length > 0) {
    const label = envelope.canonicalProductContract.primaryWorkflows[0]!;
    return [
      {
        label,
        sourceEnvelopePath: 'universal-workflow-engine.workflow-baseline',
        moduleId: input.moduleId,
        contractId: input.contractId,
      },
    ];
  }
  if (input.crudBacked && envelope.canonicalProductContract.coreActions.length > 0) {
    const label = envelope.canonicalProductContract.coreActions.slice(0, 4).join(' → ');
    return [
      {
        label,
        sourceEnvelopePath: 'universal-workflow-engine.action-chain-baseline',
        moduleId: input.moduleId,
        contractId: input.contractId,
      },
    ];
  }
  if (input.crudBacked) {
    return [
      {
        label: 'Universal Step Flow',
        sourceEnvelopePath: 'universal-workflow-engine.default-baseline',
        moduleId: input.moduleId,
        contractId: input.contractId,
      },
    ];
  }
  return rawWorkflows;
}

export function shouldMaterializeUniversalWorkflowsForModule(
  moduleId: string,
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { crudBacked?: boolean },
): boolean {
  const excluded = new Set(['auth', 'persistence', 'calculator', 'navigation-router']);
  if (excluded.has(moduleId)) return false;
  if (!envelope) return false;
  const entry = envelope.approvedModulePlan.moduleEntries.find((e) => e.moduleId === moduleId);
  if (entry?.featureType === 'CONTRACT_WORKFLOW') return true;
  if (!shouldGenerateWorkflowHostModule(moduleId)) return false;
  const hasExplicitWorkflowEvidence =
    envelope.canonicalProductContract.primaryWorkflows.length > 0 ||
    envelope.canonicalProductContract.coreActions.length > 0;
  if (hasExplicitWorkflowEvidence) return true;
  // CRUD-backed modules receive baseline universal step flow when envelope is present.
  return options?.crudBacked === true;
}

function shouldGenerateWorkflowHostModule(moduleId: string): boolean {
  const informational = new Set(['dashboard', 'reports', 'charts', 'analytics', 'history', 'code-history']);
  return !informational.has(moduleId);
}

export {
  buildUniversalWorkflowSharedRuntimeFiles,
} from './workflow-state-machine-runtime.js';
export {
  buildUniversalWorkflowMaterializationReport,
  renderUniversalWorkflowMaterializationReportMarkdown,
  computeUniversalWorkflowCapabilityCoverageScore,
} from './workflow-generation-report.js';
export {
  verifyUniversalWorkflowBehavior,
  diagnoseUniversalWorkflowGenerationGaps,
} from './workflow-behavior-verification.js';
export { extractApprovedWorkflowsFromEnvelope } from './approved-workflow-extractor.js';
export { detectStaticWorkflowShell } from './workflow-ui-generator.js';
export { UNIVERSAL_WORKFLOW_GENERATION_ENGINE_VERSION, UNIVERSAL_WORKFLOW_GENERATION_ENGINE_SOURCE } from './universal-workflow-types.js';
