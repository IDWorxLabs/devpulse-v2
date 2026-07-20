/**
 * Universal Business Rule Engine V1 — canonical rule descriptor construction.
 *
 * Builds domain-neutral executable descriptors from:
 * 1. B1's approved CRUD validation declarations (consolidation, not duplication)
 * 2. normalized rules extracted from the approved envelope
 *
 * Descriptor identity is a stable deterministic rule ID — never a display label.
 */

import { extractApprovedBusinessRulesFromEnvelope } from './approved-business-rule-extractor.js';
import { normalizeBusinessRules, type NormalizedBusinessRule } from './business-rule-normalization-engine.js';
import { classifyBusinessRuleSupport } from './business-rule-support-classifier.js';
import type { RuleExpression } from './business-rule-expression-model.js';
import {
  stableBusinessRuleId,
  UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION,
  UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE,
  type BusinessRuleDescriptorBuildContext,
  type RuleEnforcementPoint,
  type RuleInputDefinition,
  type RuleValueType,
  type UniversalBusinessRuleDescriptor,
  type UniversalBusinessRuleKind,
} from './universal-business-rule-types.js';

interface DescriptorSeed {
  readonly discriminator: string;
  readonly label: string;
  readonly description: string;
  readonly ruleKind: UniversalBusinessRuleKind;
  readonly fieldId: string | null;
  readonly inputDefinitions: readonly RuleInputDefinition[];
  readonly outputType: RuleValueType;
  readonly expression: RuleExpression;
  readonly dependencies: readonly string[];
  readonly enforcementPoints: readonly RuleEnforcementPoint[];
  readonly errorCode: string;
  readonly userFeedback: string;
  readonly provenance: readonly string[];
  readonly sourceEnvelopePaths: readonly string[];
}

export function buildBusinessRuleDescriptors(
  context: BusinessRuleDescriptorBuildContext,
): UniversalBusinessRuleDescriptor[] {
  const { input } = context;
  if (!input.crudBacked) return [];

  const descriptors: UniversalBusinessRuleDescriptor[] = [];

  // --- Baseline B1 consolidation: CRUD validation declarations become B6 descriptors.
  for (const seed of buildCrudValidationSeeds(input.moduleId)) {
    descriptors.push(materializeSeed(input.moduleId, seed, 'VALIDATION_SUPPORTED'));
  }

  // --- Structural capability rules derived from generated B1–B4 descriptors.
  descriptors.push(
    materializeSeed(input.moduleId, buildCollectionCountSeed(input.moduleId), 'AGGREGATION_SUPPORTED'),
  );

  if (input.actionBacked) {
    descriptors.push(
      materializeSeed(input.moduleId, buildActionEligibilitySeed(input.moduleId), 'ACTION_ELIGIBILITY_SUPPORTED'),
    );
  }
  if (input.workflowBacked) {
    descriptors.push(
      materializeSeed(input.moduleId, buildWorkflowGuardSeed(input.moduleId), 'WORKFLOW_GUARD_SUPPORTED'),
    );
  }
  if (input.relationshipBacked) {
    descriptors.push(
      materializeSeed(input.moduleId, buildRelationshipConstraintSeed(input.moduleId), 'RELATIONSHIP_RULE_SUPPORTED'),
    );
  }

  // --- Envelope-extracted rules (normalized + classified).
  const raws = extractApprovedBusinessRulesFromEnvelope({
    envelope: context.envelope,
    moduleId: input.moduleId,
    supplementalTexts: input.rawPrompt
      ? [{ text: input.rawPrompt, path: 'approvedProductionBuildEnvelope.promptEvidence' }]
      : [],
  });
  const normalized = normalizeBusinessRules(raws);

  const seenDiscriminators = new Set(descriptors.map((d) => d.ruleId));
  for (const rule of normalized) {
    const descriptor = buildExtractedRuleDescriptor(input.moduleId, rule);
    if (descriptor && !seenDiscriminators.has(descriptor.ruleId)) {
      seenDiscriminators.add(descriptor.ruleId);
      descriptors.push(descriptor);
    }
  }

  return descriptors;
}

function materializeSeed(
  moduleId: string,
  seed: DescriptorSeed,
  classification: UniversalBusinessRuleDescriptor['supportClassification'],
  blockedReason?: string,
): UniversalBusinessRuleDescriptor {
  return {
    ruleId: stableBusinessRuleId(moduleId, seed.ruleKind, seed.discriminator),
    label: seed.label,
    description: seed.description,
    ruleKind: seed.ruleKind,
    moduleId,
    entityId: moduleId,
    fieldId: seed.fieldId,
    inputDefinitions: seed.inputDefinitions,
    outputType: seed.outputType,
    expression: seed.expression,
    dependencies: seed.dependencies,
    nullPolicy: 'FAIL',
    precisionPolicy: seed.outputType === 'number' ? 'FIXED_2' : seed.outputType === 'integer' ? 'INTEGER' : 'PRESERVE',
    roundingPolicy: seed.outputType === 'number' || seed.outputType === 'integer' ? 'ROUND_HALF_UP' : 'NONE',
    divisionByZeroPolicy: 'FAIL',
    enforcementPoints: seed.enforcementPoints,
    severity: 'ERROR',
    errorCode: seed.errorCode,
    userFeedback: seed.userFeedback,
    provenance: seed.provenance,
    sourceEnvelopePaths: seed.sourceEnvelopePaths,
    supportClassification: classification,
    blockedReason,
    version: UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION,
  };
}

function buildCrudValidationSeeds(moduleId: string): DescriptorSeed[] {
  const labelInput: RuleInputDefinition[] = [{ name: 'label', type: 'string', optional: false }];
  return [
    {
      discriminator: 'label_required',
      label: 'Label is required',
      description: 'Approved CRUD contract requires a non-blank label before persistence',
      ruleKind: 'FIELD_VALIDATION',
      fieldId: 'label',
      inputDefinitions: labelInput,
      outputType: 'boolean',
      expression: {
        kind: 'op',
        op: 'NOT',
        args: [{ kind: 'safe-function', functionId: 'IS_BLANK', args: [{ kind: 'input', name: 'label' }] }],
      },
      dependencies: ['field:label'],
      enforcementPoints: ['FORM_SUBMIT', 'SERVICE_CREATE', 'SERVICE_UPDATE', 'PERSISTENCE_COMMIT'],
      errorCode: 'rule_label_required',
      userFeedback: 'Label is required',
      provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, 'UNIVERSAL_CRUD_GENERATION_ENGINE_V1.validation'],
      sourceEnvelopePaths: ['approvedModulePlan.moduleEntries.crudValidation.required'],
    },
    {
      discriminator: 'label_length_bounds',
      label: 'Label length within approved bounds',
      description: 'Approved CRUD contract bounds label length between 2 and 200 characters',
      ruleKind: 'FIELD_VALIDATION',
      fieldId: 'label',
      inputDefinitions: labelInput,
      outputType: 'boolean',
      expression: {
        kind: 'safe-function',
        functionId: 'TEXT_LENGTH_BETWEEN',
        args: [
          { kind: 'input', name: 'label' },
          { kind: 'literal', value: 2 },
          { kind: 'literal', value: 200 },
        ],
      },
      dependencies: ['field:label'],
      enforcementPoints: ['FORM_SUBMIT', 'SERVICE_CREATE', 'SERVICE_UPDATE', 'PERSISTENCE_COMMIT'],
      errorCode: 'rule_label_length',
      userFeedback: 'Label must be between 2 and 200 characters',
      provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, 'UNIVERSAL_CRUD_GENERATION_ENGINE_V1.validation'],
      sourceEnvelopePaths: ['approvedModulePlan.moduleEntries.crudValidation.length'],
    },
    {
      discriminator: 'label_safe_characters',
      label: 'Label contains no control characters',
      description: 'Approved CRUD contract rejects control characters in the label',
      ruleKind: 'FIELD_VALIDATION',
      fieldId: 'label',
      inputDefinitions: labelInput,
      outputType: 'boolean',
      expression: {
        kind: 'safe-function',
        functionId: 'MATCHES_SAFE_PATTERN',
        args: [{ kind: 'input', name: 'label' }],
      },
      dependencies: ['field:label'],
      enforcementPoints: ['FORM_SUBMIT', 'SERVICE_CREATE', 'SERVICE_UPDATE', 'PERSISTENCE_COMMIT'],
      errorCode: 'rule_label_pattern',
      userFeedback: 'Label contains invalid characters',
      provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, 'UNIVERSAL_CRUD_GENERATION_ENGINE_V1.validation'],
      sourceEnvelopePaths: ['approvedModulePlan.moduleEntries.crudValidation.pattern'],
    },
  ];
}

function buildCollectionCountSeed(moduleId: string): DescriptorSeed {
  return {
    discriminator: 'record_count',
    label: 'Record count over actual collection',
    description: 'Derived count aggregation over the real record collection (never a placeholder literal)',
    ruleKind: 'AGGREGATION',
    fieldId: null,
    inputDefinitions: [{ name: 'records', type: 'collection', optional: false }],
    outputType: 'integer',
    expression: { kind: 'aggregate', op: 'COUNT', collection: { kind: 'collection-input', name: 'records' } },
    dependencies: ['collection:records'],
    enforcementPoints: ['DERIVED_STATE'],
    errorCode: 'rule_record_count',
    userFeedback: 'Record count could not be computed',
    provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, 'UNIVERSAL_CRUD_GENERATION_ENGINE_V1.repository'],
    sourceEnvelopePaths: ['approvedModulePlan.moduleEntries.crudCollection'],
  };
}

function buildActionEligibilitySeed(moduleId: string): DescriptorSeed {
  return {
    discriminator: 'selection_required_for_action',
    label: 'Record-scoped action requires a selection',
    description: 'A record-scoped approved action is eligible only when a target record exists',
    ruleKind: 'ACTION_ELIGIBILITY',
    fieldId: null,
    inputDefinitions: [{ name: 'selectionCount', type: 'integer', optional: false }],
    outputType: 'boolean',
    expression: {
      kind: 'op',
      op: 'GREATER_THAN',
      args: [
        { kind: 'input', name: 'selectionCount' },
        { kind: 'literal', value: 0 },
      ],
    },
    dependencies: ['runtime:selection'],
    enforcementPoints: ['ACTION_PRECONDITION'],
    errorCode: 'rule_selection_required',
    userFeedback: 'Select at least one record first',
    provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, 'UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_V1.preconditions'],
    sourceEnvelopePaths: ['canonicalProductContract.coreActions'],
  };
}

function buildWorkflowGuardSeed(moduleId: string): DescriptorSeed {
  return {
    discriminator: 'required_steps_complete',
    label: 'Workflow completes only when required steps are done',
    description: 'Approved workflow completion requires every required step to be complete',
    ruleKind: 'WORKFLOW_GUARD',
    fieldId: null,
    inputDefinitions: [{ name: 'requiredStepsComplete', type: 'collection', optional: false }],
    outputType: 'boolean',
    expression: { kind: 'aggregate', op: 'ALL', collection: { kind: 'collection-input', name: 'requiredStepsComplete' } },
    dependencies: ['workflow:steps'],
    enforcementPoints: ['WORKFLOW_GUARD', 'WORKFLOW_COMPLETION'],
    errorCode: 'rule_workflow_completion',
    userFeedback: 'Complete all required steps first',
    provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, 'UNIVERSAL_WORKFLOW_GENERATION_ENGINE_V1.completion'],
    sourceEnvelopePaths: ['canonicalProductContract.primaryWorkflows'],
  };
}

function buildRelationshipConstraintSeed(moduleId: string): DescriptorSeed {
  return {
    discriminator: 'restrict_delete_with_links',
    label: 'Delete restricted while related links exist',
    description: 'Approved relationship lifecycle policy restricts deletion while active links exist',
    ruleKind: 'RELATIONSHIP_RULE',
    fieldId: null,
    inputDefinitions: [{ name: 'relatedLinkCount', type: 'integer', optional: false }],
    outputType: 'boolean',
    expression: {
      kind: 'op',
      op: 'EQUAL',
      args: [
        { kind: 'input', name: 'relatedLinkCount' },
        { kind: 'literal', value: 0 },
      ],
    },
    dependencies: ['relationship:links'],
    enforcementPoints: ['SERVICE_DELETE', 'RELATIONSHIP_UNLINK'],
    errorCode: 'rule_delete_restricted',
    userFeedback: 'Cannot delete while related records exist',
    provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, 'UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_V1.lifecycle'],
    sourceEnvelopePaths: ['canonicalProductContract.coreEntities'],
  };
}

function buildExtractedRuleDescriptor(
  moduleId: string,
  rule: NormalizedBusinessRule,
): UniversalBusinessRuleDescriptor | null {
  const decision = classifyBusinessRuleSupport(rule);
  const discriminator = `${rule.semantic}_${rule.raw.label.slice(0, 48)}`;

  const base: Omit<DescriptorSeed, 'inputDefinitions' | 'outputType' | 'expression' | 'enforcementPoints'> = {
    discriminator,
    label: rule.raw.label,
    description: `Approved envelope rule normalized as ${rule.semantic}`,
    ruleKind: rule.ruleKind,
    fieldId: null,
    dependencies: [],
    errorCode: `rule_${rule.semantic.toLowerCase()}`,
    userFeedback: rule.raw.label,
    provenance: [UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE, rule.raw.sourceEnvelopePath],
    sourceEnvelopePaths: [rule.raw.sourceEnvelopePath],
  };

  if (
    decision.classification === 'BLOCKED_BY_FUTURE_CAPABILITY' ||
    decision.classification === 'INVALID_RULE_CONTRACT' ||
    decision.classification === 'NOT_EXECUTABLE_INFORMATIONAL'
  ) {
    // Non-executable rules are retained as explicit evidence, never dropped.
    return materializeSeed(
      moduleId,
      {
        ...base,
        inputDefinitions: [],
        outputType: 'boolean',
        expression: { kind: 'literal', value: false },
        enforcementPoints: [],
      },
      decision.classification,
      decision.blockedReason,
    );
  }

  const seed = buildExecutableSeedForSemantic(rule, base);
  if (!seed) return null;
  return materializeSeed(moduleId, seed, decision.classification, decision.blockedReason);
}

function buildExecutableSeedForSemantic(
  rule: NormalizedBusinessRule,
  base: Omit<DescriptorSeed, 'inputDefinitions' | 'outputType' | 'expression' | 'enforcementPoints'>,
): DescriptorSeed | null {
  switch (rule.semantic) {
    case 'REQUIRED':
      return {
        ...base,
        inputDefinitions: [{ name: 'value', type: 'string', optional: true }],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: 'NOT',
          args: [{ kind: 'safe-function', functionId: 'IS_BLANK', args: [{ kind: 'input', name: 'value' }] }],
        },
        enforcementPoints: ['FORM_SUBMIT', 'SERVICE_CREATE', 'SERVICE_UPDATE'],
      };
    case 'GREATER_THAN':
    case 'NON_NEGATIVE':
      return {
        ...base,
        inputDefinitions: [{ name: 'value', type: 'number', optional: false }],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: rule.semantic === 'NON_NEGATIVE' ? 'GREATER_THAN_OR_EQUAL' : 'GREATER_THAN',
          args: [
            { kind: 'input', name: 'value' },
            { kind: 'literal', value: 0 },
          ],
        },
        enforcementPoints: ['FORM_SUBMIT', 'SERVICE_CREATE', 'SERVICE_UPDATE'],
      };
    case 'LESS_THAN':
      return {
        ...base,
        inputDefinitions: [
          { name: 'value', type: 'number', optional: false },
          { name: 'limit', type: 'number', optional: false },
        ],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: 'LESS_THAN_OR_EQUAL',
          args: [
            { kind: 'input', name: 'value' },
            { kind: 'input', name: 'limit' },
          ],
        },
        enforcementPoints: ['FORM_SUBMIT', 'SERVICE_CREATE', 'SERVICE_UPDATE'],
      };
    case 'CROSS_FIELD_COMPARISON':
      return {
        ...base,
        ruleKind: 'CROSS_FIELD',
        inputDefinitions: [
          { name: 'startValue', type: 'date', optional: false },
          { name: 'endValue', type: 'date', optional: false },
        ],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: 'BEFORE',
          args: [
            { kind: 'input', name: 'startValue' },
            { kind: 'input', name: 'endValue' },
          ],
        },
        enforcementPoints: ['FORM_SUBMIT', 'SERVICE_CREATE', 'SERVICE_UPDATE'],
      };
    case 'SUM_AGGREGATION':
      return {
        ...base,
        inputDefinitions: [{ name: 'values', type: 'collection', optional: false }],
        outputType: 'number',
        expression: { kind: 'aggregate', op: 'SUM', collection: { kind: 'collection-input', name: 'values' } },
        enforcementPoints: ['DERIVED_STATE'],
      };
    case 'COUNT_AGGREGATION':
      return {
        ...base,
        inputDefinitions: [{ name: 'values', type: 'collection', optional: false }],
        outputType: 'integer',
        expression: { kind: 'aggregate', op: 'COUNT', collection: { kind: 'collection-input', name: 'values' } },
        enforcementPoints: ['DERIVED_STATE'],
      };
    case 'AVERAGE_AGGREGATION':
      return {
        ...base,
        inputDefinitions: [{ name: 'values', type: 'collection', optional: false }],
        outputType: 'number',
        expression: {
          kind: 'conditional',
          condition: {
            kind: 'op',
            op: 'GREATER_THAN',
            args: [
              { kind: 'aggregate', op: 'COUNT', collection: { kind: 'collection-input', name: 'values' } },
              { kind: 'literal', value: 0 },
            ],
          },
          whenTrue: { kind: 'aggregate', op: 'AVERAGE', collection: { kind: 'collection-input', name: 'values' } },
          whenFalse: { kind: 'literal', value: 0 },
        },
        enforcementPoints: ['DERIVED_STATE'],
      };
    case 'PERCENTAGE_CALCULATION':
      return {
        ...base,
        inputDefinitions: [
          { name: 'percent', type: 'number', optional: false },
          { name: 'base', type: 'number', optional: false },
        ],
        outputType: 'number',
        expression: {
          kind: 'safe-function',
          functionId: 'PERCENTAGE_OF',
          args: [
            { kind: 'input', name: 'percent' },
            { kind: 'input', name: 'base' },
          ],
        },
        enforcementPoints: ['DERIVED_STATE'],
      };
    case 'GENERIC_CALCULATION':
      return {
        ...base,
        inputDefinitions: [{ name: 'values', type: 'collection', optional: false }],
        outputType: 'number',
        expression: { kind: 'aggregate', op: 'SUM', collection: { kind: 'collection-input', name: 'values' } },
        enforcementPoints: ['DERIVED_STATE'],
      };
    case 'DERIVED_CLASSIFICATION':
      return {
        ...base,
        inputDefinitions: [
          { name: 'score', type: 'number', optional: false },
          { name: 'threshold', type: 'number', optional: false },
        ],
        outputType: 'string',
        expression: {
          kind: 'conditional',
          condition: {
            kind: 'op',
            op: 'GREATER_THAN_OR_EQUAL',
            args: [
              { kind: 'input', name: 'score' },
              { kind: 'input', name: 'threshold' },
            ],
          },
          whenTrue: { kind: 'literal', value: 'above-threshold' },
          whenFalse: { kind: 'literal', value: 'below-threshold' },
        },
        enforcementPoints: ['DERIVED_STATE'],
      };
    case 'UNIQUENESS_CONSTRAINT':
      return {
        ...base,
        ruleKind: 'CROSS_RECORD',
        inputDefinitions: [
          { name: 'candidate', type: 'string', optional: false },
          { name: 'existingValues', type: 'collection', optional: false },
        ],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: 'NOT',
          args: [
            {
              kind: 'op',
              op: 'CONTAINS',
              args: [
                { kind: 'collection-input', name: 'existingValues' },
                { kind: 'input', name: 'candidate' },
              ],
            },
          ],
        },
        enforcementPoints: ['SERVICE_CREATE', 'SERVICE_UPDATE', 'PERSISTENCE_COMMIT'],
      };
    case 'RELATIONSHIP_CONSTRAINT':
      return {
        ...base,
        inputDefinitions: [{ name: 'relatedLinkCount', type: 'integer', optional: false }],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: 'EQUAL',
          args: [
            { kind: 'input', name: 'relatedLinkCount' },
            { kind: 'literal', value: 0 },
          ],
        },
        enforcementPoints: ['SERVICE_DELETE', 'RELATIONSHIP_UNLINK'],
      };
    case 'ACTION_ELIGIBILITY':
      return {
        ...base,
        inputDefinitions: [{ name: 'validationPassed', type: 'boolean', optional: false }],
        outputType: 'boolean',
        expression: { kind: 'input', name: 'validationPassed' },
        enforcementPoints: ['ACTION_PRECONDITION'],
      };
    case 'WORKFLOW_COMPLETION_RULE':
      return {
        ...base,
        inputDefinitions: [{ name: 'requiredStepsComplete', type: 'collection', optional: false }],
        outputType: 'boolean',
        expression: { kind: 'aggregate', op: 'ALL', collection: { kind: 'collection-input', name: 'requiredStepsComplete' } },
        enforcementPoints: ['WORKFLOW_GUARD', 'WORKFLOW_COMPLETION'],
      };
    case 'STATE_TRANSITION_RULE':
      return {
        ...base,
        inputDefinitions: [
          { name: 'currentState', type: 'string', optional: false },
          { name: 'allowedSourceStates', type: 'collection', optional: false },
        ],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: 'CONTAINS',
          args: [
            { kind: 'collection-input', name: 'allowedSourceStates' },
            { kind: 'input', name: 'currentState' },
          ],
        },
        enforcementPoints: ['WORKFLOW_GUARD'],
      };
    case 'THRESHOLD_POLICY': {
      const threshold = Number(/\b(\d+(?:\.\d+)?)\b/.exec(rule.raw.label)?.[1] ?? '0');
      return {
        ...base,
        ruleKind: 'POLICY',
        inputDefinitions: [{ name: 'value', type: 'number', optional: false }],
        outputType: 'boolean',
        expression: {
          kind: 'op',
          op: 'LESS_THAN_OR_EQUAL',
          args: [
            { kind: 'input', name: 'value' },
            { kind: 'literal', value: threshold },
          ],
        },
        enforcementPoints: ['SERVICE_CREATE', 'SERVICE_UPDATE', 'ACTION_PRECONDITION'],
      };
    }
    case 'INFORMATIONAL':
    default:
      return null;
  }
}
