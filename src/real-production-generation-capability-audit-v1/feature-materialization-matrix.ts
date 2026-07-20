/**
 * Real Production Generation Capability Audit V1 — feature materialization matrix builder.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { isApprovedProductionBuildEnvelopeValid } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import {
  moduleIdToPascalCase,
  materializableFeatureModules,
} from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { isInformationalFeatureModule } from '../feature-contract-reality/feature-interaction-reality-checker.js';
import type {
  AuditPromptScenario,
  FeatureMaterializationMatrixRow,
  FeatureMaterializationStatus,
  PromptAuditResult,
} from './real-production-generation-capability-types.js';

function fileMap(files: GeneratedWorkspaceFile[]): Map<string, string> {
  return new Map(files.map((f) => [f.relativePath.replace(/\\/g, '/'), f.content]));
}

function getContent(map: Map<string, string>, rel: string): string | null {
  return map.get(rel.replace(/\\/g, '/')) ?? null;
}

function parseRegistryIds(registrySource: string | null): Set<string> {
  if (!registrySource) return new Set();
  const ids = new Set<string>();
  const re = /id:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(registrySource)) !== null) ids.add(m[1]);
  return ids;
}

function parseRouterNavIds(routerSource: string | null): Set<string> {
  if (!routerSource) return new Set();
  const ids = new Set<string>();
  const re = /setActiveModuleId\(['"]([^'"]+)['"]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(routerSource)) !== null) ids.add(m[1]);
  const re2 = /activeModuleId\s*===\s*['"]([^'"]+)['"]/g;
  while ((m = re2.exec(routerSource)) !== null) ids.add(m[1]);
  return ids;
}

function detectStaticShell(componentSource: string): { staticShell: boolean; reason: string | null } {
  const hasButton = componentSource.includes('data-interaction-control') || componentSource.includes('<button');
  const hasOnClick = /onClick\s*=/.test(componentSource);
  const hasFormSubmit = /onSubmit\s*=/.test(componentSource) || /type="submit"/.test(componentSource);
  const emptyService = /return\s*\[\s*\]/.test(componentSource);
  if (hasButton && !hasOnClick && !hasFormSubmit) {
    return { staticShell: true, reason: 'Button/control present without onClick or form submit handler' };
  }
  if (emptyService && !isInformationalFeatureModule('')) {
    /* service files checked separately */
  }
  return { staticShell: false, reason: null };
}

function classifyModuleStatus(input: {
  approved: boolean;
  fileExists: boolean;
  inRegistry: boolean;
  inRouterNav: boolean;
  visibleUi: boolean;
  interactive: boolean;
  staticShell: boolean;
  blocked: boolean;
}): { status: FeatureMaterializationStatus; failureReason: string | null } {
  if (input.blocked && !input.approved) {
    return { status: 'NOT_MATERIALIZED', failureReason: 'Module blocked by prompt-bounded resolver' };
  }
  if (input.approved && !input.fileExists) {
    return { status: 'NOT_MATERIALIZED', failureReason: 'Approved module has no generated feature files' };
  }
  if (input.fileExists && !input.inRegistry) {
    return { status: 'PARTIALLY_MATERIALIZED', failureReason: 'Feature files exist but registry entry missing' };
  }
  if (input.inRegistry && !input.inRouterNav && !isInformationalFeatureModule('x')) {
    /* auth special case handled per-module */
  }
  if (input.fileExists && input.inRegistry && !input.inRouterNav) {
    return { status: 'GENERATED_BUT_UNREACHABLE', failureReason: 'Module not reachable via FeatureAppRouter navigation' };
  }
  if (input.visibleUi && input.staticShell) {
    return { status: 'REACHABLE_BUT_NONFUNCTIONAL', failureReason: 'Static UI shell — control without handler or persistence' };
  }
  if (input.visibleUi && input.interactive) {
    return { status: 'FUNCTIONAL_BUT_UNVERIFIED', failureReason: 'Structural interaction markers only — no runtime preview proof in audit' };
  }
  if (input.fileExists && input.inRegistry && input.inRouterNav) {
    return { status: 'FULLY_MATERIALIZED', failureReason: null };
  }
  return { status: 'PARTIALLY_MATERIALIZED', failureReason: 'Incomplete materialization signals' };
}

export function buildPromptMaterializationAudit(input: {
  scenario: AuditPromptScenario;
  envelope: ApprovedProductionBuildEnvelope | null | undefined;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  workspaceFiles: GeneratedWorkspaceFile[];
}): PromptAuditResult {
  const { scenario, buildPlan, workspaceFiles } = input;
  const envelope = input.envelope;
  const envelopeValid = isApprovedProductionBuildEnvelopeValid(envelope);
  const fileContent = fileMap(workspaceFiles);

  const envelopeModuleIds = envelopeValid
    ? envelope!.approvedModulePlan.moduleIds
    : buildPlan.modulePlan.approvedModuleIds;
  const buildPlanModuleIds = buildPlan.modulePlan.approvedModuleIds;
  const blockedIds = new Set(buildPlan.modulePlan.blockedModules?.map((b) => b.moduleId) ?? []);
  const materializableIds = materializableFeatureModules(buildPlan.definition);

  const registrySource = getContent(fileContent, 'src/features/registry.ts');
  const routerSource = getContent(fileContent, 'src/features/FeatureAppRouter.tsx');
  const registryIds = parseRegistryIds(registrySource);
  const routerNavIds = parseRouterNavIds(routerSource);

  const generatedModuleIds: string[] = [];
  for (const moduleId of envelopeModuleIds) {
    const pascal = moduleIdToPascalCase(moduleId);
    const featurePath = `src/features/${moduleId}/${pascal}Feature.tsx`;
    if (getContent(fileContent, featurePath)) generatedModuleIds.push(moduleId);
  }

  const matrixRows: FeatureMaterializationMatrixRow[] = [];

  for (const moduleId of envelopeModuleIds) {
    const pascal = moduleIdToPascalCase(moduleId);
    const featurePath = `src/features/${moduleId}/${pascal}Feature.tsx`;
    const servicePath = `src/features/${moduleId}/${moduleId}.service.ts`;
    const componentSource = getContent(fileContent, featurePath) ?? '';
    const serviceSource = getContent(fileContent, servicePath) ?? '';
    const fileExists = componentSource.length > 0;
    const inRegistry = registryIds.has(moduleId);
    const inRouterNav = routerNavIds.has(moduleId) || moduleId === 'auth';
    const visibleUi = fileExists && componentSource.includes('return (');
    const informational = isInformationalFeatureModule(moduleId);
    const { staticShell, reason: shellReason } = informational
      ? { staticShell: false, reason: null }
      : detectStaticShell(componentSource);
    const hasInteractionMarker =
      informational ||
      componentSource.includes('data-interaction-control') ||
      /onClick\s*=/.test(componentSource);
    const persistenceRuntime =
      !serviceSource.includes('return []') &&
      /localStorage|persist|save|create|update|delete/.test(serviceSource);
    const moduleEntry = envelopeValid
      ? envelope!.approvedModulePlan.moduleEntries.find((e) => e.moduleId === moduleId)
      : null;
    const route = moduleEntry?.route ?? buildPlan.modulePlan.routes[buildPlanModuleIds.indexOf(moduleId)] ?? null;

    const { status, failureReason } = classifyModuleStatus({
      approved: true,
      fileExists,
      inRegistry,
      inRouterNav: inRouterNav || informational,
      visibleUi,
      interactive: hasInteractionMarker && !staticShell,
      staticShell,
      blocked: blockedIds.has(moduleId),
    });

    let finalStatus = status;
    let finalReason = failureReason ?? shellReason;
    if (moduleId === 'persistence') {
      finalStatus = 'NOT_MATERIALIZED';
      finalReason = 'persistence is infrastructure — intentionally omitted from file generation';
    } else if (!materializableIds.includes(moduleId) && fileExists === false && envelopeModuleIds.includes(moduleId)) {
      finalStatus = 'NOT_MATERIALIZED';
      finalReason = 'Approved in plan but filtered by materializableFeatureModules (infrastructure)';
    } else if (staticShell) {
      finalStatus = 'REACHABLE_BUT_NONFUNCTIONAL';
      finalReason = shellReason;
    }

    matrixRows.push({
      promptId: scenario.id,
      promptLabel: scenario.label,
      approvedFeature: moduleId,
      featureKind: 'MODULE',
      envelopeSource: 'ApprovedModulePlan.moduleEntries',
      generatedFile: fileExists ? featurePath : null,
      route,
      navigation: inRouterNav || informational,
      visibleUi,
      interactionWorks: hasInteractionMarker && !staticShell && !informational,
      persistenceRuntime,
      previewVerified: 'NOT_RUN',
      status: finalStatus,
      failureReason: finalReason,
    });
  }

  if (envelopeValid) {
    for (const navItem of envelope!.approvedNavigationPlan.navigationItems) {
      const label = navItem.label;
      const inBlueprint =
        (getContent(fileContent, 'src/blueprint/product-surface.ts') ?? '').includes(label) ||
        (getContent(fileContent, 'src/blueprint/AppShell.tsx') ?? '').includes(label) ||
        (routerSource ?? '').includes(label);
      matrixRows.push({
        promptId: scenario.id,
        promptLabel: scenario.label,
        approvedFeature: label,
        featureKind: 'NAVIGATION',
        envelopeSource: 'ApprovedNavigationPlan.navigationItems',
        generatedFile: inBlueprint ? 'src/blueprint/AppShell.tsx | FeatureAppRouter.tsx' : null,
        route: navItem.route ?? null,
        navigation: inBlueprint,
        visibleUi: inBlueprint,
        interactionWorks: false,
        persistenceRuntime: false,
        previewVerified: 'NOT_RUN',
        status: inBlueprint ? 'FUNCTIONAL_BUT_UNVERIFIED' : 'NOT_MATERIALIZED',
        failureReason: inBlueprint ? null : 'Navigation label not found in generated shell/router',
      });
    }

    for (const action of envelope!.canonicalProductContract.coreActions.slice(0, 8)) {
      const actionPresent =
        workspaceFiles.some((f) => f.content.toLowerCase().includes(action.toLowerCase())) ||
        componentSourceIncludesAction(workspaceFiles, action);
      matrixRows.push({
        promptId: scenario.id,
        promptLabel: scenario.label,
        approvedFeature: action,
        featureKind: 'ACTION',
        envelopeSource: 'CanonicalProductContract.coreActions',
        generatedFile: actionPresent ? '(distributed in feature/blueprint files)' : null,
        route: null,
        navigation: false,
        visibleUi: actionPresent,
        interactionWorks: false,
        persistenceRuntime: false,
        previewVerified: 'NOT_RUN',
        status: actionPresent ? 'PARTIALLY_MATERIALIZED' : 'BLOCKED_BY_MISSING_CAPABILITY',
        failureReason: actionPresent
          ? 'Action term appears in generated copy — no dedicated action handler verified'
          : 'No generator path maps contract action to executable control',
      });
    }

    for (const workflow of envelope!.canonicalProductContract.primaryWorkflows.slice(0, 6)) {
      const workflowPresent = workspaceFiles.some((f) =>
        f.content.toLowerCase().includes(workflow.toLowerCase().replace(/-/g, ' ')),
      );
      matrixRows.push({
        promptId: scenario.id,
        promptLabel: scenario.label,
        approvedFeature: workflow,
        featureKind: 'WORKFLOW',
        envelopeSource: 'CanonicalProductContract.primaryWorkflows',
        generatedFile: workflowPresent ? '(label/copy only)' : null,
        route: null,
        navigation: false,
        visibleUi: workflowPresent,
        interactionWorks: false,
        persistenceRuntime: false,
        previewVerified: 'NOT_RUN',
        status: workflowPresent ? 'PARTIALLY_MATERIALIZED' : 'BLOCKED_BY_MISSING_CAPABILITY',
        failureReason: 'No workflow/state-machine generator — workflow appears as naming/copy at best',
      });
    }
  }

  return {
    scenario,
    envelopeValid,
    approvedModuleCount: envelopeModuleIds.length,
    materializedModuleCount: generatedModuleIds.length,
    blockedModuleCount: blockedIds.size,
    matrixRows,
    buildPlanModuleIds,
    envelopeModuleIds,
    generatedModuleIds,
  };
}

function componentSourceIncludesAction(files: GeneratedWorkspaceFile[], action: string): boolean {
  const needle = action.toLowerCase();
  return files.some(
    (f) =>
      f.relativePath.includes('Feature.tsx') &&
      f.content.toLowerCase().includes(needle) &&
      (f.content.includes('onClick') || f.content.includes('data-action')),
  );
}

export function buildSilentSkipInventory(): import('./real-production-generation-capability-types.js').SilentSkipFinding[] {
  return [
    {
      id: 'SKIP-001',
      location: 'prompt-bounded-module-resolver.ts#evaluateCandidate',
      pattern: 'continue on blocked candidate',
      affectedStage: 'PLANNING',
      severity: 'MEDIUM',
      description: 'Blocked modules are skipped silently; build continues if at least one module approved.',
      promptsAffected: ['*'],
    },
    {
      id: 'SKIP-002',
      location: 'modular-feature-module-generator.ts#materializableFeatureModules',
      pattern: 'filter persistence',
      affectedStage: 'MATERIALIZATION',
      severity: 'HIGH',
      description: 'persistence module never receives feature files even when approved in module plan.',
      promptsAffected: ['*'],
    },
    {
      id: 'SKIP-003',
      location: 'modular-feature-module-generator.ts#buildFeatureAppRouterTsx',
      pattern: 'filter auth from nav',
      affectedStage: 'MATERIALIZATION',
      severity: 'MEDIUM',
      description: 'auth module excluded from FeatureAppRouter navigation buttons.',
      promptsAffected: ['*'],
    },
    {
      id: 'SKIP-004',
      location: 'prompt-bounded-module-resolver.ts (simple utility branch)',
      pattern: 'approvedModules.filter(simpleUtilityFeatureModules)',
      affectedStage: 'PLANNING',
      severity: 'HIGH',
      description: 'Simple utility prompts drop all modules outside utility kind set without failing build.',
      promptsAffected: ['unit-conversion', 'calculator-like'],
    },
    {
      id: 'SKIP-005',
      location: 'approved-sample-data-plan default composition',
      pattern: 'approvedSamplesPresent: false',
      affectedStage: 'CBGA → MATERIALIZATION',
      severity: 'MEDIUM',
      description: 'Default sample data plan emits no business records — empty states by design.',
      promptsAffected: ['*'],
    },
    {
      id: 'SKIP-006',
      location: 'universal-app-blueprint-product-surface.ts',
      pattern: 'approvedNavigationLabels ?? []',
      affectedStage: 'BLUEPRINT',
      severity: 'LOW',
      description: 'Default shell labels omitted when not CBGA-approved — safe but reduces surface area.',
      promptsAffected: ['*'],
    },
    {
      id: 'SKIP-007',
      location: 'modular-feature-module-generator.ts service template',
      pattern: 'list*Records(): return []',
      affectedStage: 'MATERIALIZATION',
      severity: 'CRITICAL',
      description: 'All generic CRUD services return empty arrays — no persistence-backed data.',
      promptsAffected: ['*'],
    },
    {
      id: 'SKIP-008',
      location: 'one-prompt-build-orchestrator.ts continuation path',
      pattern: 'skip materialization when workspaceHasGeneratedFeatureModules',
      affectedStage: 'MATERIALIZATION',
      severity: 'HIGH',
      description: 'Continuation builds may skip fresh materialization — uses existing workspace files.',
      promptsAffected: ['continue-existing-project'],
    },
  ];
}

export function extractStaticShellFindings(
  promptResults: PromptAuditResult[],
  workspaceFilesByPrompt: Map<string, GeneratedWorkspaceFile[]>,
): import('./real-production-generation-capability-types.js').StaticShellFinding[] {
  const findings: import('./real-production-generation-capability-types.js').StaticShellFinding[] = [];
  let seq = 1;
  for (const result of promptResults) {
    const files = workspaceFilesByPrompt.get(result.scenario.id) ?? [];
    for (const file of files) {
      if (!file.relativePath.endsWith('Feature.tsx')) continue;
      const moduleMatch = file.relativePath.match(/src\/features\/([^/]+)\//);
      const moduleId = moduleMatch?.[1] ?? null;
      const hasButton = file.content.includes('data-interaction-control') || file.content.includes('<button');
      const hasHandler = /onClick\s*=/.test(file.content) || /onSubmit\s*=/.test(file.content);
      if (hasButton && !hasHandler && moduleId && !isInformationalFeatureModule(moduleId)) {
        findings.push({
          id: `SHELL-${seq++}`,
          promptId: result.scenario.id,
          featureId: moduleId,
          artifactPath: file.relativePath,
          shellKind: 'button_without_handler',
          severity: 'HIGH',
          description: 'Manage button or interaction control without onClick/onSubmit handler',
        });
      }
      if (file.content.includes('No ') && file.content.includes('recorded yet') && file.content.includes('data-empty-state')) {
        findings.push({
          id: `SHELL-${seq++}`,
          promptId: result.scenario.id,
          featureId: moduleId,
          artifactPath: file.relativePath,
          shellKind: 'empty_state_only',
          severity: 'MEDIUM',
          description: 'Infrastructure empty state — no sample records or persistence',
        });
      }
    }
    const serviceFiles = files.filter((f) => f.relativePath.endsWith('.service.ts'));
    for (const svc of serviceFiles) {
      if (/return\s*\[\s*\]/.test(svc.content) && !svc.content.includes('TODO')) {
        findings.push({
          id: `SHELL-${seq++}`,
          promptId: result.scenario.id,
          featureId: svc.relativePath.match(/features\/([^/]+)/)?.[1] ?? null,
          artifactPath: svc.relativePath,
          shellKind: 'empty_service_layer',
          severity: 'CRITICAL',
          description: 'Service layer returns empty array — no create/read/update/delete implementation',
        });
      }
    }
  }
  return findings;
}
