/**
 * Universal Behavioral Verification Engine V1 — approved behavior extraction.
 *
 * Reads only ApprovedProductionBuildEnvelope and B1–B7 descriptor sources.
 * Prompt text never authorizes executable behavior.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { extractApprovedActionsFromEnvelope } from '../universal-action-materialization-engine/approved-action-extractor.js';
import { extractApprovedWorkflowsFromEnvelope } from '../universal-workflow-generation-engine/approved-workflow-extractor.js';
import { extractApprovedRelationshipsFromEnvelope } from '../universal-relationship-intelligence-engine/approved-relationship-extractor.js';
import { extractApprovedBusinessRulesFromEnvelope } from '../universal-business-rule-engine/approved-business-rule-extractor.js';
import { extractCapabilityRequirementsFromEnvelope } from '../universal-capability-pack-framework/approved-capability-requirement-extractor.js';
import { shouldGenerateUniversalCrudForModule } from '../universal-crud-generation-engine/index.js';
import { isSafePaymentPlaceholderModule } from '../safe-payment-placeholder-policy/safe-payment-module-generator.js';
import type { RawApprovedBehavior } from './universal-behavior-types.js';
import { UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE } from './universal-behavior-types.js';

export interface ApprovedBehaviorExtractionInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly workflowBacked: boolean;
  readonly relationshipBacked: boolean;
  readonly ruleBacked: boolean;
  readonly capabilityPackBacked: boolean;
  readonly definition?: {
    readonly safePaymentPlaceholderActive?: boolean;
  };
}

const CRUD_OPERATIONS = ['create', 'read', 'update', 'delete', 'list', 'search'] as const;

export function extractApprovedBehaviorsFromEnvelope(
  input: ApprovedBehaviorExtractionInput,
): RawApprovedBehavior[] {
  const { envelope, moduleIds, contractId } = input;
  const results: RawApprovedBehavior[] = [];

  for (const moduleId of moduleIds) {
    const moduleEntry = envelope.approvedModulePlan.moduleEntries.find((e) => e.moduleId === moduleId);
    const entityId = moduleId;

    if (
      input.crudBacked &&
      shouldGenerateUniversalCrudForModule(moduleId, {
        safePaymentPlaceholderActive: input.definition?.safePaymentPlaceholderActive === true,
        isSafePaymentModule:
          input.definition?.safePaymentPlaceholderActive === true &&
          isSafePaymentPlaceholderModule(moduleId),
      })
    ) {
      for (const op of CRUD_OPERATIONS) {
        results.push({
          label: `${op} ${moduleEntry?.displayName ?? moduleId}`,
          behaviorCategory: 'CRUD',
          sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].crud.${op}`,
          moduleId,
          entityId,
          criticality: op === 'create' || op === 'read' ? 'REQUIRED' : 'OPTIONAL',
        });
      }
      results.push({
        label: `persist ${moduleEntry?.displayName ?? moduleId}`,
        behaviorCategory: 'PERSISTENCE',
        sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].persistence`,
        moduleId,
        entityId,
        criticality: 'REQUIRED',
      });
      for (const runtimeOp of ['filter', 'sort', 'paginate', 'select'] as const) {
        results.push({
          label: `${runtimeOp} ${moduleEntry?.displayName ?? moduleId}`,
          behaviorCategory: runtimeOp === 'filter' ? 'FILTERING' : runtimeOp === 'sort' ? 'SORTING' : runtimeOp === 'paginate' ? 'PAGINATION' : 'SELECTION',
          sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].runtime.${runtimeOp}`,
          moduleId,
          entityId,
          criticality: 'OPTIONAL',
        });
      }
    }

    if (input.actionBacked) {
      for (const action of extractApprovedActionsFromEnvelope({
        envelope,
        moduleId,
        contractId,
        includeAllContractActions: true,
      })) {
        results.push({
          label: action.label,
          behaviorCategory: 'ACTION',
          sourceEnvelopePath: action.sourceEnvelopePath,
          moduleId,
          actionId: action.label.toLowerCase().replace(/\s+/g, '-'),
          criticality: 'OPTIONAL',
        });
      }
    }

    if (input.workflowBacked) {
      const extracted = extractApprovedWorkflowsFromEnvelope({ envelope, moduleId, contractId });
      const workflows =
        extracted.length > 0
          ? extracted
          : [
              {
                label: `${moduleEntry?.displayName ?? moduleId} lifecycle workflow`,
                sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].baselineWorkflow`,
                moduleId,
                contractId,
              },
            ];
      for (const workflow of workflows) {
        results.push({
          label: workflow.label,
          behaviorCategory: 'WORKFLOW',
          sourceEnvelopePath: workflow.sourceEnvelopePath,
          moduleId,
          workflowId: workflow.label.toLowerCase().replace(/\s+/g, '-'),
          criticality: 'OPTIONAL',
        });
      }
    }

    if (input.relationshipBacked) {
      const extracted = extractApprovedRelationshipsFromEnvelope({ envelope, moduleId });
      const relationships =
        extracted.length > 0
          ? extracted
          : [
              {
                label: `${moduleEntry?.displayName ?? moduleId} association`,
                sourceEntityLabel: moduleEntry?.displayName ?? moduleId,
                targetEntityLabel: 'record',
                cardinalityHint: 'MANY_TO_ONE' as const,
                sourceOptional: false,
                targetOptional: false,
                sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].baselineRelationship`,
                ordered: false,
              },
            ];
      for (const rel of relationships) {
        results.push({
          label: rel.label,
          behaviorCategory: 'RELATIONSHIP',
          sourceEnvelopePath: rel.sourceEnvelopePath,
          moduleId,
          relationshipId: `${rel.sourceEntityLabel}-${rel.targetEntityLabel}`.toLowerCase().replace(/\s+/g, '-'),
          criticality: 'OPTIONAL',
        });
      }
    }

    if (input.ruleBacked) {
      const extracted = extractApprovedBusinessRulesFromEnvelope({ envelope, moduleId });
      const rules =
        extracted.length > 0
          ? extracted
          : [
              {
                label: `${moduleEntry?.displayName ?? moduleId} required field validation`,
                ruleKind: 'FIELD_VALIDATION' as const,
                sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].baselineRule`,
                moduleId,
              },
            ];
      for (const rule of rules) {
        results.push({
          label: rule.label,
          behaviorCategory: 'BUSINESS_RULE',
          sourceEnvelopePath: rule.sourceEnvelopePath,
          moduleId,
          // ruleKind must participate in the behavior identity: one source sentence can legitimately
          // match multiple rule patterns of DIFFERENT kinds (e.g. "authentication required" is both a
          // FIELD_VALIDATION and a POLICY rule) and yield the same label. Keying the behavior on label
          // alone collapses those genuinely-distinct rules onto one behaviorId, which the registry
          // rejects as a duplicate. Prefixing with ruleKind keeps each distinct rule verifiable.
          ruleId: `${rule.ruleKind.toLowerCase()}-${rule.label.toLowerCase().replace(/\s+/g, '-')}`.slice(0, 80),
          criticality: 'OPTIONAL',
        });
      }
    }

    if (input.crudBacked) {
      results.push({
        label: `runtime refresh ${moduleEntry?.displayName ?? moduleId}`,
        behaviorCategory: 'RUNTIME_STATE',
        sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].runtime.refresh`,
        moduleId,
        entityId,
        criticality: 'OPTIONAL',
      });
      results.push({
        label: `validate ${moduleEntry?.displayName ?? moduleId}`,
        behaviorCategory: 'VALIDATION',
        sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].validation`,
        moduleId,
        entityId,
        criticality: 'REQUIRED',
      });
      results.push({
        label: `recover ${moduleEntry?.displayName ?? moduleId}`,
        behaviorCategory: 'RECOVERY',
        sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].recovery`,
        moduleId,
        entityId,
        criticality: 'OPTIONAL',
      });
    }
  }

  for (const nav of envelope.approvedNavigationPlan.navigationItems) {
    results.push({
      label: `Navigate to ${nav.label}`,
      behaviorCategory: 'NAVIGATION',
      sourceEnvelopePath: `approvedNavigationPlan.navigationItems[${nav.moduleId}]`,
      moduleId: nav.moduleId,
      routePath: nav.path ?? `/${nav.moduleId}`,
      criticality: 'REQUIRED',
    });
  }

  if (input.capabilityPackBacked) {
    for (const req of extractCapabilityRequirementsFromEnvelope({ envelope })) {
      const category = capabilityCategoryForKey(req.capabilityKey);
      results.push({
        label: req.label,
        behaviorCategory: category,
        sourceEnvelopePath: req.sourceEnvelopePaths[0] ?? 'capabilityRequirement',
        moduleId: req.moduleIds[0],
        capabilityKey: req.capabilityKey,
        criticality: req.criticality,
        supportClassification:
          req.criticality === 'INFORMATIONAL'
            ? 'NOT_REQUIRED'
            : req.supportClassification === 'NOT_REQUIRED'
              ? 'NOT_REQUIRED'
              : 'EXECUTABLE',
      });
    }
  }

  return results;
}

function capabilityCategoryForKey(key: string): RawApprovedBehavior['behaviorCategory'] {
  if (key.startsWith('preferences.')) return 'PREFERENCES';
  if (key.startsWith('audit.')) return 'AUDIT';
  if (key.startsWith('export.')) return 'EXPORT';
  if (key.startsWith('authentication.')) return 'AUTHENTICATION';
  if (key.startsWith('authorization.')) return 'AUTHORIZATION';
  if (key.startsWith('notification.')) return 'NOTIFICATION';
  if (key.startsWith('scheduling.')) return 'SCHEDULING';
  if (key.startsWith('file.')) return 'FILE_OPERATION';
  if (key.startsWith('reporting.')) return 'REPORTING';
  if (key.startsWith('search.')) return 'SEARCH';
  if (key.startsWith('realtime.')) return 'RUNTIME_STATE';
  return 'CUSTOM';
}

export function collectBehaviorExtractionProvenance(): readonly string[] {
  return [
    UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE,
    'ApprovedProductionBuildEnvelope',
    'B1_UNIVERSAL_CRUD_GENERATION_ENGINE',
    'B2_UNIVERSAL_ACTION_MATERIALIZATION_ENGINE',
    'B3_UNIVERSAL_WORKFLOW_GENERATION_ENGINE',
    'B4_UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE',
    'B5_UNIVERSAL_RUNTIME_STATE_ENGINE',
    'B6_UNIVERSAL_BUSINESS_RULE_ENGINE',
    'B7_UNIVERSAL_CAPABILITY_PACK_FRAMEWORK',
  ];
}
