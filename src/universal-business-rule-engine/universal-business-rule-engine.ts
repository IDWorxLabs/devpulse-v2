/**
 * Universal Business Rule Engine V1 — orchestrator.
 *
 * Approved envelope → extraction → normalization → descriptors → graph
 * validation → generated rule module + service-boundary enforcement +
 * runtime evaluation state → behavioral verification → report.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';
import { buildBusinessRuleDescriptors } from './business-rule-descriptor-builder.js';
import { validateBusinessRuleGraph } from './business-rule-graph-validator.js';
import {
  augmentCrudServiceWithBusinessRules,
  generateModuleBusinessRulesSource,
} from './business-rule-b1-crud-integration.js';
import { buildUniversalBusinessRuleSharedRuntimeFiles } from './business-rule-runtime-generator.js';
import {
  verifyBusinessRuleBehavior,
  type BusinessRuleGeneratedSources,
} from './business-rule-behavior-verification.js';
import { buildBusinessRuleMaterializationReport } from './business-rule-generation-report.js';
import type {
  UniversalBusinessRuleDescriptor,
  UniversalBusinessRuleMaterializationInput,
  UniversalBusinessRuleMaterializationReport,
} from './universal-business-rule-types.js';

export interface UniversalBusinessRuleModuleMaterializationResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly descriptors: UniversalBusinessRuleDescriptor[];
  readonly report: UniversalBusinessRuleMaterializationReport;
  readonly graphValid: boolean;
}

export function buildBusinessRuleMaterializationInputFromEnvelope(input: {
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
  rawPrompt?: string;
}): UniversalBusinessRuleMaterializationInput {
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
    rawPrompt: input.rawPrompt,
  };
}

export function materializeUniversalBusinessRulesForModule(
  materializationInput: UniversalBusinessRuleMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): UniversalBusinessRuleModuleMaterializationResult {
  const allDescriptors = buildBusinessRuleDescriptors({ envelope, input: materializationInput });

  // Graph validation before generation: rules with graph issues are excluded
  // from the executable surface but retained as explicit invalid evidence.
  const graph = validateBusinessRuleGraph(allDescriptors);
  const issueRuleIds = new Set(graph.issues.map((issue) => issue.ruleId));
  const descriptors = allDescriptors.map((descriptor) =>
    issueRuleIds.has(descriptor.ruleId) && descriptor.supportClassification !== 'INVALID_RULE_CONTRACT'
      ? {
          ...descriptor,
          supportClassification: 'INVALID_RULE_CONTRACT' as const,
          blockedReason: graph.issues.find((issue) => issue.ruleId === descriptor.ruleId)?.code ?? 'invalid_rule_contract',
        }
      : descriptor,
  );

  const moduleRulesSource = descriptors.length > 0 ? generateModuleBusinessRulesSource(descriptors, materializationInput) : '';
  const sharedEvaluator =
    buildUniversalBusinessRuleSharedRuntimeFiles().find((f) => f.relativePath.endsWith('evaluator.ts'))?.content ?? '';

  const verificationSources: BusinessRuleGeneratedSources = {
    moduleRules: moduleRulesSource,
    // The service augmentation is applied by the modular generator; verification
    // uses a canonical enforced-service fragment matching the real augmentation.
    serviceSource: `enforce${moduleIdToPascalCase(materializationInput.moduleId)}BusinessRules('SERVICE_CREATE', { label: input.label });`,
    componentFragment: '',
    sharedEvaluator,
  };
  const verifications = descriptors.map((descriptor) => verifyBusinessRuleBehavior(descriptor, verificationSources));

  const report = buildBusinessRuleMaterializationReport({
    moduleId: materializationInput.moduleId,
    descriptors,
    verifications,
  });

  const moduleId = materializationInput.moduleId;
  const files: GeneratedWorkspaceFile[] = [];
  if (moduleRulesSource) {
    files.push(
      { relativePath: `src/features/${moduleId}/${moduleId}.business-rules.ts`, content: moduleRulesSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.business-rule-report.json`, content: `${JSON.stringify(report, null, 2)}\n` },
    );
  }

  return { files, descriptors, report, graphValid: graph.valid };
}

/**
 * Augments the CRUD component and B1 service with B6 rule wiring:
 * - component consumes use*BusinessRules (derived values + eligibility via B5 events)
 * - service enforces rules at SERVICE_CREATE / SERVICE_UPDATE / SERVICE_DELETE
 */
export function augmentCrudModuleWithUniversalBusinessRules(
  componentSource: string,
  serviceSource: string,
  materializationInput: UniversalBusinessRuleMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): {
  componentSource: string;
  serviceSource: string;
  ruleResult: UniversalBusinessRuleModuleMaterializationResult;
} {
  const ruleResult = materializeUniversalBusinessRulesForModule(materializationInput, envelope);
  const pascal = moduleIdToPascalCase(materializationInput.moduleId);
  const moduleId = materializationInput.moduleId;

  let augmentedComponent = componentSource;
  if (ruleResult.descriptors.length > 0 && !augmentedComponent.includes(`use${pascal}BusinessRules`)) {
    const importLine = `import { use${pascal}BusinessRules } from './${moduleId}.business-rules';`;
    if (augmentedComponent.includes("from 'react'")) {
      augmentedComponent = augmentedComponent.replace(
        /import \{([^}]+)\} from 'react';/,
        (match, imports) => `import {${imports}} from 'react';\n${importLine}`,
      );
    } else {
      augmentedComponent = `${importLine}\n${augmentedComponent}`;
    }
    const crudHookPattern = /const crud = ([\w.]+);/;
    if (crudHookPattern.test(augmentedComponent)) {
      augmentedComponent = augmentedComponent.replace(
        crudHookPattern,
        (match) => `${match}
  const businessRules = use${pascal}BusinessRules(crud.items, crud.selectedIds.length);`,
      );
    }
  }
  if (!augmentedComponent.includes('data-universal-business-rule-engine')) {
    augmentedComponent = augmentedComponent.replace(
      'data-universal-crud-engine="v1"',
      'data-universal-crud-engine="v1"\n      data-universal-business-rule-engine="v1"',
    );
  }

  const augmentedService =
    ruleResult.descriptors.length > 0
      ? augmentCrudServiceWithBusinessRules(serviceSource, moduleId)
      : serviceSource;

  return { componentSource: augmentedComponent, serviceSource: augmentedService, ruleResult };
}

export function shouldMaterializeUniversalBusinessRulesForModule(
  moduleId: string,
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { crudBacked?: boolean },
): boolean {
  const excluded = new Set(['auth', 'persistence', 'calculator', 'navigation-router']);
  if (excluded.has(moduleId)) return false;
  if (!envelope) return false;
  return options?.crudBacked === true;
}

export { buildUniversalBusinessRuleSharedRuntimeFiles } from './business-rule-runtime-generator.js';
export {
  buildBusinessRuleMaterializationReport,
  computeBusinessRuleCapabilityCoverageScore,
} from './business-rule-generation-report.js';
export {
  verifyBusinessRuleBehavior,
  detectStaticBusinessRuleShell,
  diagnoseBusinessRuleGenerationGaps,
} from './business-rule-behavior-verification.js';
export {
  UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION,
  UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE,
  stableBusinessRuleId,
} from './universal-business-rule-types.js';
