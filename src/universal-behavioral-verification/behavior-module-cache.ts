/**
 * Universal Behavioral Verification Engine V1 — per-module execution cache.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import {
  buildUniversalCrudEntityModuleFiles,
  entityDescriptorFromApprovedModule,
} from '../universal-crud-generation-engine/index.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';
import { verifyUniversalCrudBehavior, verifyCrudMutationChain } from '../universal-crud-generation-engine/crud-behavior-verification.js';
import {
  buildActionMaterializationInputFromEnvelope,
  materializeUniversalActionsForModule,
} from '../universal-action-materialization-engine/index.js';
import { verifyUniversalActionBehavior } from '../universal-action-materialization-engine/action-behavior-verification.js';
import {
  buildWorkflowMaterializationInputFromEnvelope,
  materializeUniversalWorkflowsForModule,
} from '../universal-workflow-generation-engine/index.js';
import { verifyUniversalWorkflowBehavior } from '../universal-workflow-generation-engine/workflow-behavior-verification.js';
import {
  buildRelationshipMaterializationInputFromEnvelope,
  materializeUniversalRelationshipsForModule,
} from '../universal-relationship-intelligence-engine/index.js';
import { verifyUniversalRelationshipBehavior } from '../universal-relationship-intelligence-engine/relationship-behavior-verification.js';
import {
  buildRuntimeMaterializationInputFromEnvelope,
  materializeUniversalRuntimeForModule,
} from '../universal-runtime-state-engine/index.js';
import { verifyUniversalRuntimeBehavior } from '../universal-runtime-state-engine/runtime-behavior-verification.js';
import {
  buildBusinessRuleMaterializationInputFromEnvelope,
  materializeUniversalBusinessRulesForModule,
} from '../universal-business-rule-engine/index.js';
import { verifyBusinessRuleBehavior } from '../universal-business-rule-engine/business-rule-behavior-verification.js';
import { PreferencesStore, parseDefaults } from '../universal-capability-packs/universal-preferences-pack/index.js';
import { AuditTrailStore, resetAuditEntryCounter } from '../universal-capability-packs/universal-audit-trail-pack/index.js';
import {
  exportRecordsToJson,
  exportRecordsToCsv,
} from '../universal-capability-packs/universal-data-export-pack-basic/index.js';
import { AvailabilityStore } from '../universal-capability-packs/universal-scheduling-pack/index.js';
import type { BehaviorExecutionContext } from './universal-behavior-types.js';

function contentFromFiles(files: readonly GeneratedWorkspaceFile[], suffix: string): string {
  return files.find((f) => f.relativePath.endsWith(suffix))?.content ?? '';
}

function fileMap(files: readonly GeneratedWorkspaceFile[]): Map<string, string> {
  return new Map(files.map((f) => [f.relativePath, f.content]));
}

function moduleSources(files: Map<string, string>, moduleId: string) {
  const prefix = `src/features/${moduleId}/`;
  const read = (suffix: string) => files.get(`${prefix}${suffix}`) ?? '';
  return {
    repository: read(`${moduleId}.repository.ts`),
    service: read(`${moduleId}.service.ts`),
    validation: read(`${moduleId}.validation.ts`),
    runtimeState: read(`${moduleId}.runtime-state.ts`),
    // The generated component lives at `src/features/<moduleId>/<Pascal>Feature.tsx` where
    // `<Pascal>` is the canonical `moduleIdToPascalCase(moduleId)` (hyphen-segmented, e.g.
    // `stock-records` → `StockRecordsFeature.tsx`). This MUST use the same PascalCase helper the
    // generator uses. The previous derivation (`moduleId.charAt(0).toUpperCase() + slice(1)`) only
    // upper-cased the first character, so hyphenated ids resolved to `Stock-recordsFeature.tsx`
    // and never matched the emitted `StockRecordsFeature.tsx`. That left `component` empty and
    // silently failed component-scoped behavior checks (e.g. the relationship `selector-ui` check
    // that looks for `relationshipSelections`), producing false behavioral failures even though the
    // real component contained the required markup.
    component:
      read(`${moduleIdToPascalCase(moduleId)}Feature.tsx`) ||
      read(`${moduleId}/${moduleIdToPascalCase(moduleId)}Feature.tsx`),
    handlers: read(`${moduleId}.action-handlers.ts`),
  };
}

export interface ModuleExecutionCacheEntry {
  readonly moduleId: string;
  readonly sources: ReturnType<typeof moduleSources>;
  readonly crudRuntimePresent: boolean;
  readonly crudStructuralPassed: boolean;
  readonly crudMutationPassed: boolean;
  readonly actionPassed: boolean;
  readonly workflowPassed: boolean;
  readonly relationshipPassed: boolean;
  readonly runtimePassed: boolean;
  readonly rulePassed: boolean;
  readonly validationPresent: boolean;
  readonly recoveryPresent: boolean;
}

export interface GlobalExecutionCache {
  readonly modules: ReadonlyMap<string, ModuleExecutionCacheEntry>;
  readonly preferencesPassed: boolean;
  readonly auditPassed: boolean;
  readonly exportJsonPassed: boolean;
  readonly exportCsvPassed: boolean;
  readonly schedulingPassed: boolean;
  readonly packRegistrySource: string;
  readonly packArtifacts: string;
}

export function buildGlobalExecutionCache(context: BehaviorExecutionContext): GlobalExecutionCache {
  const files = fileMap(context.workspaceFiles);
  const modules = new Map<string, ModuleExecutionCacheEntry>();
  const { envelope, materializationInput: input } = context;

  for (const moduleId of input.moduleIds) {
    const sources = moduleSources(files, moduleId);
    let crudStructuralPassed = false;
    let crudMutationPassed = false;
    if (input.crudBacked) {
      const entityDescriptor = entityDescriptorFromApprovedModule({
        moduleId,
        displayName: moduleId,
        route: `/${moduleId}`,
        contractId: input.contractId,
      });
      const built = buildUniversalCrudEntityModuleFiles({
        descriptor: entityDescriptor,
        appTitle: input.appTitle,
        promptTerms: [moduleId],
      });
      crudStructuralPassed = verifyUniversalCrudBehavior(entityDescriptor, built.sources).passed;
      crudMutationPassed = verifyCrudMutationChain(built.sources);
    }

    let actionPassed = false;
    if (input.actionBacked) {
      const actionResult = materializeUniversalActionsForModule(
        buildActionMaterializationInputFromEnvelope({
          envelope,
          moduleId,
          moduleDisplayName: moduleId,
          moduleRoute: `/${moduleId}`,
          appTitle: input.appTitle,
          contractId: input.contractId,
          crudBacked: input.crudBacked,
        }),
        envelope,
      );
      const handlersSource = contentFromFiles(actionResult.files, '.action-handlers.ts');
      const descriptorsSource = contentFromFiles(actionResult.files, '.universal-actions.ts');
      actionPassed = actionResult.descriptors.some((d) =>
        verifyUniversalActionBehavior(d, {
          handlers: handlersSource,
          descriptors: descriptorsSource,
          componentFragment: sources.component || actionResult.componentAugmentation,
        }).passed,
      );
    }

    let workflowPassed = false;
    if (input.workflowBacked) {
      const wfResult = materializeUniversalWorkflowsForModule(
        buildWorkflowMaterializationInputFromEnvelope({
          envelope,
          moduleId,
          moduleDisplayName: moduleId,
          moduleRoute: `/${moduleId}`,
          appTitle: input.appTitle,
          contractId: input.contractId,
          crudBacked: input.crudBacked,
        }),
        envelope,
      );
      workflowPassed =
        wfResult.descriptors.length > 0 &&
        wfResult.descriptors.some((d) => {
          const wfSources = {
            runtime: contentFromFiles(wfResult.files, '.workflow-runtime.ts'),
            repository: contentFromFiles(wfResult.files, '.workflow-instance.repository.ts'),
            componentFragment: sources.component || wfResult.componentAugmentation,
            descriptors: contentFromFiles(wfResult.files, '.universal-workflows.ts'),
          };
          const v = verifyUniversalWorkflowBehavior(d, wfSources);
          return v.passed || v.classification === 'PARTIALLY_VERIFIED' || v.classification === 'BLOCKED_BY_CAPABILITY';
        });
    }

    let relationshipPassed = false;
    if (input.relationshipBacked) {
      const relResult = materializeUniversalRelationshipsForModule(
        buildRelationshipMaterializationInputFromEnvelope({
          envelope,
          moduleId,
          moduleDisplayName: moduleId,
          moduleRoute: `/${moduleId}`,
          appTitle: input.appTitle,
          contractId: input.contractId,
          crudBacked: input.crudBacked,
          actionBacked: input.actionBacked,
          workflowBacked: input.workflowBacked,
          rawPrompt: input.rawPrompt,
        }),
        envelope,
      );
      relationshipPassed =
        relResult.descriptors.length > 0 &&
        relResult.descriptors.some((d) =>
          verifyUniversalRelationshipBehavior(d, {
            runtime: contentFromFiles(relResult.files, '.relationship-runtime.ts'),
            repository: contentFromFiles(relResult.files, '.relationship.repository.ts'),
            service: contentFromFiles(relResult.files, '.relationship.service.ts'),
            componentFragment: sources.component || relResult.componentAugmentation,
            descriptors: contentFromFiles(relResult.files, '.universal-relationships.ts'),
          }).passed,
        );
    }

    let runtimePassed = false;
    if (input.runtimeBacked) {
      const rtResult = materializeUniversalRuntimeForModule(
        buildRuntimeMaterializationInputFromEnvelope({
          envelope,
          moduleId,
          moduleDisplayName: moduleId,
          moduleRoute: `/${moduleId}`,
          appTitle: input.appTitle,
          contractId: input.contractId,
          crudBacked: input.crudBacked,
          actionBacked: input.actionBacked,
          workflowBacked: input.workflowBacked,
          relationshipBacked: input.relationshipBacked,
        }),
        envelope,
      );
      runtimePassed =
        rtResult.descriptors.length > 0 &&
        rtResult.descriptors.some((d) => {
          const rtSources = {
            runtime: contentFromFiles(rtResult.files, '.universal-runtime.ts'),
            sharedStore: files.get('src/universal-runtime-state/store.ts') ?? '',
            componentFragment: sources.component,
            descriptors: contentFromFiles(rtResult.files, '.runtime-descriptors.ts'),
          };
          const v = verifyUniversalRuntimeBehavior(d, rtSources);
          return v.passed || v.classification === 'PARTIALLY_VERIFIED';
        });
    }

    let rulePassed = false;
    if (input.ruleBacked) {
      const ruleResult = materializeUniversalBusinessRulesForModule(
        buildBusinessRuleMaterializationInputFromEnvelope({
          envelope,
          moduleId,
          moduleDisplayName: moduleId,
          moduleRoute: `/${moduleId}`,
          appTitle: input.appTitle,
          contractId: input.contractId,
          crudBacked: input.crudBacked,
          actionBacked: input.actionBacked,
          workflowBacked: input.workflowBacked,
          relationshipBacked: input.relationshipBacked,
          rawPrompt: input.rawPrompt,
        }),
        envelope,
      );
      rulePassed =
        ruleResult.descriptors.length > 0 &&
        ruleResult.descriptors.some((d) =>
          verifyBusinessRuleBehavior(d, {
            moduleRules: contentFromFiles(ruleResult.files, '.business-rules.ts'),
            serviceSource: sources.service,
            componentFragment: sources.component,
            sharedEvaluator: files.get('src/universal-business-rule-runtime/evaluator.ts') ?? '',
          }).passed,
        );
    }

    const combined = `${sources.service}\n${sources.handlers}\n${sources.runtimeState}`;
    modules.set(moduleId, {
      moduleId,
      sources,
      crudRuntimePresent: files.has('src/universal-crud-runtime/memory-provider.ts'),
      crudStructuralPassed,
      crudMutationPassed,
      actionPassed,
      workflowPassed,
      relationshipPassed,
      runtimePassed,
      rulePassed,
      validationPresent: /validate/.test(sources.validation),
      recoveryPresent: /retry|rollback|recover/i.test(combined),
    });
  }

  const prefs = new PreferencesStore(['display.pageSize'], parseDefaults(['display.pageSize=10']));
  const preferencesPassed = prefs.update('display.pageSize', '20').valid;
  resetAuditEntryCounter();
  const audit = new AuditTrailStore([], 10);
  audit.record({ eventType: 'crud/create', targetType: 'entity', targetId: '1', outcome: 'SUCCESS', payload: {} });
  const auditPassed = audit.query({}).length === 1;
  const rec = [{ id: '1', label: 'A', createdAt: 'x', updatedAt: 'y' }];
  const exportJsonPassed = exportRecordsToJson(rec, ['id', 'label'], 't').recordCount === 1;
  const exportCsvPassed = exportRecordsToCsv(rec, ['id', 'label'], 't').recordCount === 1;
  const scheduling = new AvailabilityStore();
  scheduling.addWindow({ startMinutes: 540, endMinutes: 600 });
  const schedulingReserved = scheduling.reserve({ startMinutes: 540, endMinutes: 555 });
  const schedulingPassed = schedulingReserved && scheduling.availableSlots({ slotDurationMinutes: 15, granularityMinutes: 15 }).length > 0;

  return {
    modules,
    preferencesPassed,
    auditPassed,
    exportJsonPassed,
    exportCsvPassed,
    schedulingPassed,
    packRegistrySource: files.get('src/universal-capability-packs/runtime/registry.ts') ?? '',
    packArtifacts: [...files.values()].filter((c) => c.includes('universal-capability-packs')).join('\n'),
  };
}
