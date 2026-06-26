/**
 * Intent Understanding Engine — Product Intelligence Model builder.
 */

import { createHash } from 'node:crypto';
import { rankBuildProfiles } from '../build-profile-classification/profile-ranking-engine.js';
import { applyPromptProfileSelectionGuard } from '../prompt-faithful-generation/prompt-profile-selection-guard.js';
import {
  buildCustomProfileFeatureDefinition,
  shouldUseCustomFeatureDefinition,
} from '../prompt-faithful-generation/custom-feature-contract-builder.js';
import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
} from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { extractDomainUnderstanding } from './domain-understanding.js';
import { extractUserPersonas } from './user-persona-extractor.js';
import { extractUserGoals, extractFeatureRequirements } from './requirement-understanding.js';
import { extractWorkflows } from './workflow-extractor.js';
import { buildInteractionModel } from './interaction-model-builder.js';
import { extractPlatformUnderstanding } from './platform-understanding.js';
import { extractNavigationUnderstanding } from './navigation-understanding.js';
import { extractAccessibilityUnderstanding } from './accessibility-understanding.js';
import { buildBehaviorModel } from './behavior-understanding.js';
import { calculateIntentConfidence } from './intent-confidence.js';
import type {
  ArchitectureHintUnderstanding,
  DataModelUnderstanding,
  DataEntityUnderstanding,
  PerformanceUnderstanding,
  ProductIntelligenceModel,
  SafetyUnderstanding,
  SuccessCriteriaUnderstanding,
  UnderstandingEvidence,
  VisualDesignUnderstanding,
  VisualStyle,
} from './intent-understanding-types.js';
import {
  DEFAULT_CATEGORY_CONFIDENCE_THRESHOLD,
  DEFAULT_INTENT_CONFIDENCE_THRESHOLD,
} from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

let modelCounter = 0;

export function resetProductModelBuilderForTests(): void {
  modelCounter = 0;
}

function nextModelId(): string {
  modelCounter += 1;
  return `pim-${modelCounter}-${Date.now()}`;
}

function hashPrompt(rawPrompt: string): string {
  return createHash('sha256').update(rawPrompt).digest('hex').slice(0, 16);
}

function buildDataModel(rawPrompt: string, moduleIds: string[]): DataModelUnderstanding {
  const entities: DataEntityUnderstanding[] = [];
  let entityIndex = 0;

  const addEntity = (label: string, ops: DataEntityUnderstanding['operations']): void => {
    entityIndex += 1;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    entities.push({
      readOnly: true,
      entityId: `entity-${entityIndex}`,
      label,
      pluralLabel: `${label}s`,
      operations: ops,
    });
    void slug;
  };

  if (/communication[\s-]?history|message history/i.test(rawPrompt)) {
    addEntity('Communication Message', ['CREATE', 'READ', 'SEARCH', 'FILTER']);
  }
  if (/caregiver/i.test(rawPrompt)) {
    addEntity('Caregiver Session', ['READ', 'UPDATE']);
  }

  for (const moduleId of moduleIds.slice(0, 6)) {
    const label = moduleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (!entities.some((e) => e.label.toLowerCase() === label.toLowerCase())) {
      addEntity(label, ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SEARCH', 'FILTER', 'SORT']);
    }
  }

  if (!entities.length) {
    addEntity('Record', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SEARCH', 'FILTER', 'SORT']);
  }

  return {
    readOnly: true,
    entities,
    relationships: entities.length > 1
      ? [{ fromEntityId: entities[0].entityId, toEntityId: entities[1].entityId, type: 'references' }]
      : [],
    historyRequired: /history|audit|log/i.test(rawPrompt),
    storageType: /offline|local/i.test(rawPrompt) ? 'local-first' : 'browser-local-storage',
    synchronizationRequired: /sync|cloud/i.test(rawPrompt),
    cachingRequired: /offline|cache/i.test(rawPrompt),
    evidence: [evidence('data_inference', `${entities.length} entities inferred`, 0.8)],
  };
}

function buildVisualDesign(rawPrompt: string): VisualDesignUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const styles = new Set<VisualStyle>();
  const evidenceItems: UnderstandingEvidence[] = [];

  const styleSignals: Array<{ pattern: RegExp; style: VisualStyle }> = [
    { pattern: /\bmedical|assistive/i, style: 'MEDICAL' },
    { pattern: /\bcorporate|enterprise/i, style: 'CORPORATE' },
    { pattern: /\bconsumer|personal/i, style: 'CONSUMER' },
    { pattern: /\bprofessional/i, style: 'PROFESSIONAL' },
    { pattern: /\bminimal|clean/i, style: 'MINIMAL' },
    { pattern: /\bdashboard/i, style: 'DASHBOARD' },
    { pattern: /\bphone[\s-]?frame|android phone/i, style: 'PHONE_FRAME' },
    { pattern: /\btablet/i, style: 'TABLET_LAYOUT' },
  ];

  for (const signal of styleSignals) {
    if (signal.pattern.test(rawPrompt)) {
      styles.add(signal.style);
      evidenceItems.push(evidence('visual_signal', signal.style, 0.85));
    }
  }

  if (!styles.size) styles.add('PROFESSIONAL');

  return {
    readOnly: true,
    styles: [...styles],
    colorRequirements: extraction.designRequirements.filter((d) => /contrast|color/i.test(d)),
    layoutRequirements: extraction.designRequirements.filter((d) => /layout|mobile|gaze/i.test(d)),
    spacingRequirements: extraction.designRequirements.filter((d) => /spacing|touch target/i.test(d)),
    brandingNotes: extraction.appName ? [`Product branding: ${extraction.appName}`] : [],
    evidence: evidenceItems,
  };
}

function buildSafetyUnderstanding(rawPrompt: string): SafetyUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const warnings: string[] = [];
  const disclaimers: string[] = [...extraction.safetyNotes];
  const medicalLimitations: string[] = [];
  const privacyRequirements: string[] = [];
  const securityRequirements: string[] = [];
  const complianceNotes: string[] = [];
  const riskStatements: string[] = [];

  if (/medical|health|patient|assistive/i.test(rawPrompt)) {
    medicalLimitations.push('Not a substitute for professional medical advice unless formally validated');
    disclaimers.push('Assistive communication tool — not a certified medical device unless approved');
  }
  if (/privacy|gdpr|hipaa/i.test(rawPrompt)) {
    privacyRequirements.push('User data privacy protections required');
    if (/hipaa/i.test(rawPrompt)) complianceNotes.push('HIPAA considerations may apply');
    if (/gdpr/i.test(rawPrompt)) complianceNotes.push('GDPR compliance required');
  }
  if (/security|encrypt|auth/i.test(rawPrompt)) {
    securityRequirements.push('Secure authentication and data handling');
  }
  if (/emergency/i.test(rawPrompt)) {
    warnings.push('Emergency speech features require clear user understanding of limitations');
    riskStatements.push('Emergency features must not replace professional emergency services');
  }

  return {
    readOnly: true,
    warnings,
    disclaimers,
    medicalLimitations,
    privacyRequirements,
    securityRequirements,
    complianceNotes,
    riskStatements,
    evidence: extraction.safetyNotes.map((n) => evidence('safety_note', n, 1)),
  };
}

function buildPerformanceUnderstanding(rawPrompt: string): PerformanceUnderstanding {
  return {
    readOnly: true,
    realTimeRequired: /real[\s-]?time|live|instant/i.test(rawPrompt),
    offlineRequired: /offline/i.test(rawPrompt),
    largeDatasetSupport: /large dataset|thousands|millions/i.test(rawPrompt),
    lowLatencyRequired: /low[\s-]?latency|fast response/i.test(rawPrompt),
    fastStartupRequired: /fast startup|quick load/i.test(rawPrompt),
    memoryLimits: /memory|low[\s-]?end device/i.test(rawPrompt) ? ['Optimize for constrained devices'] : [],
    deviceLimits: /android|mobile|phone/i.test(rawPrompt) ? ['Mobile device performance constraints'] : [],
    evidence: [evidence('performance_inference', 'Performance expectations from prompt signals', 0.75)],
  };
}

function buildSuccessCriteria(rawPrompt: string, features: { moduleId: string | null }[]): SuccessCriteriaUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const moduleList = features.map((f) => f.moduleId).filter(Boolean).join(', ');

  return {
    readOnly: true,
    completionCriteria: [
      'All REQUIRED features implemented and navigable',
      'Primary user workflow completable end-to-end',
      moduleList ? `Feature modules present: ${moduleList}` : 'Core functionality operational',
      'Accessibility mandatory constraints satisfied',
    ],
    generationStopCriteria: [
      'Product Intelligence Model confidence meets threshold',
      'All REQUIRED features materialized',
      'Prompt faithfulness validation passes',
    ],
    launchApprovalCriteria: [
      'Founder Test passes for primary workflows',
      'Workspace reality audit confirms feature presence',
      'No banned fallback modules in custom domain builds',
      extraction.androidPhonePreviewRequired ? 'Android phone preview container present' : 'Preview loads successfully',
    ],
    evidence: [evidence('success_criteria', 'Derived from product understanding', 0.9)],
  };
}

function buildArchitectureHints(rawPrompt: string): ArchitectureHintUnderstanding {
  const ranking = rankBuildProfiles(rawPrompt);
  const guardResult = applyPromptProfileSelectionGuard(rawPrompt, ranking);
  const extraction = extractPromptFeatures(rawPrompt);

  let materializationProfile = guardResult.guardApplied
    ? 'GENERIC_CUSTOM_APP_V1' as const
    : resolveMaterializationProfile(
        guardResult.selectedProfile,
        rawPrompt,
      );

  if (
    extraction.explicitModulesProvided &&
    shouldUseCustomFeatureDefinition(extraction, 'GENERIC_CUSTOM_APP_V1')
  ) {
    materializationProfile = 'GENERIC_CUSTOM_APP_V1';
  }

  let definition;
  if (shouldUseCustomFeatureDefinition(extraction, materializationProfile)) {
    definition = buildCustomProfileFeatureDefinition(extraction);
  } else {
    definition = getProfileFeatureDefinition(materializationProfile, rawPrompt);
  }

  return {
    readOnly: true,
    suggestedProfile: materializationProfile,
    suggestedGeneratedProfile: (guardResult.guardApplied
      ? null
      : guardResult.selectedProfile) as GeneratedAppProfile | null,
    moduleIds: definition.featureModules,
    routes: definition.routes,
    evidence: [
      evidence('profile_classifier', `Profile: ${materializationProfile}`, 0.85),
      evidence('feature_definition', `Modules: ${definition.featureModules.join(', ')}`, 0.9),
    ],
  };
}

export function buildProductIntelligenceModel(
  rawPrompt: string,
  options?: { confidenceThreshold?: number; categoryThreshold?: number },
): ProductIntelligenceModel {
  const product = extractDomainUnderstanding(rawPrompt);
  const users = extractUserPersonas(rawPrompt);
  const goals = extractUserGoals(rawPrompt);
  const features = extractFeatureRequirements(rawPrompt);
  const workflows = extractWorkflows(rawPrompt);
  const interactions = buildInteractionModel(rawPrompt);
  const navigation = extractNavigationUnderstanding(rawPrompt);
  const accessibility = extractAccessibilityUnderstanding(rawPrompt);
  const architecture = buildArchitectureHints(rawPrompt);
  const behavior = buildBehaviorModel(rawPrompt);
  const platform = extractPlatformUnderstanding(rawPrompt);
  const dataModel = buildDataModel(rawPrompt, architecture.moduleIds);
  const visualDesign = buildVisualDesign(rawPrompt);
  const safety = buildSafetyUnderstanding(rawPrompt);
  const performance = buildPerformanceUnderstanding(rawPrompt);
  const successCriteria = buildSuccessCriteria(rawPrompt, features);

  const partialModel = {
    product,
    users,
    goals,
    features,
    workflows,
    interactions,
    navigation,
    accessibility,
    architecture,
    behavior,
    platform,
    dataModel,
    visualDesign,
    safety,
    performance,
    successCriteria,
  };

  const confidence = calculateIntentConfidence(partialModel, {
    overallThreshold: options?.confidenceThreshold ?? DEFAULT_INTENT_CONFIDENCE_THRESHOLD,
    categoryThreshold: options?.categoryThreshold ?? DEFAULT_CATEGORY_CONFIDENCE_THRESHOLD,
  });

  return {
    readOnly: true,
    modelId: nextModelId(),
    sourcePromptHash: hashPrompt(rawPrompt),
    createdAt: Date.now(),
    ...partialModel,
    confidence,
  };
}
