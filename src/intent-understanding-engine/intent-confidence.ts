/**
 * Intent Understanding Engine — confidence calculation per category.
 */

import type {
  AccessibilityUnderstanding,
  ArchitectureHintUnderstanding,
  BehaviorModelUnderstanding,
  CategoryConfidence,
  DataModelUnderstanding,
  FeatureRequirementUnderstanding,
  IntentConfidenceReport,
  InteractionModelUnderstanding,
  NavigationUnderstanding,
  PerformanceUnderstanding,
  PlatformUnderstanding,
  ProductIdentityUnderstanding,
  SafetyUnderstanding,
  SuccessCriteriaUnderstanding,
  UserGoalsUnderstanding,
  UserPersona,
  UserWorkflowUnderstanding,
  VisualDesignUnderstanding,
} from './intent-understanding-types.js';

interface PartialProductModel {
  product: ProductIdentityUnderstanding;
  users: readonly UserPersona[];
  goals: UserGoalsUnderstanding;
  features: readonly FeatureRequirementUnderstanding[];
  workflows: readonly UserWorkflowUnderstanding[];
  interactions: InteractionModelUnderstanding;
  navigation: NavigationUnderstanding;
  accessibility: AccessibilityUnderstanding;
  architecture: ArchitectureHintUnderstanding;
  behavior: BehaviorModelUnderstanding;
  platform: PlatformUnderstanding;
  dataModel: DataModelUnderstanding;
  visualDesign: VisualDesignUnderstanding;
  safety: SafetyUnderstanding;
  performance: PerformanceUnderstanding;
  successCriteria: SuccessCriteriaUnderstanding;
}

function scoreFromEvidence(
  evidenceCount: number,
  baseScore: number,
  minEvidence = 1,
  optionalCategory = false,
): number {
  if (evidenceCount < minEvidence) {
    if (optionalCategory) return Math.max(0.75, baseScore - 0.1);
    return Math.max(0.4, baseScore - 0.3);
  }
  if (evidenceCount >= 3) return Math.min(1, baseScore + 0.05);
  return baseScore;
}

function buildCategory(
  category: string,
  score: number,
  evidenceCount: number,
  categoryThreshold: number,
): CategoryConfidence {
  const normalized = Math.round(Math.min(1, Math.max(0, score)) * 100) / 100;
  return {
    readOnly: true,
    category,
    score: normalized,
    evidenceCount,
    meetsThreshold: normalized >= categoryThreshold,
  };
}

export function calculateIntentConfidence(
  model: PartialProductModel,
  options: { overallThreshold: number; categoryThreshold: number },
): IntentConfidenceReport {
  const categories: CategoryConfidence[] = [
    buildCategory(
      'Product',
      scoreFromEvidence(model.product.evidence.length, model.product.productType !== 'UNKNOWN' ? 0.99 : 0.65),
      model.product.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Users',
      scoreFromEvidence(model.users.length, model.users.some((u) => u.isPrimary) ? 0.98 : 0.7, 1),
      model.users.reduce((sum, u) => sum + u.evidence.length, 0),
      options.categoryThreshold,
    ),
    buildCategory(
      'Goals',
      scoreFromEvidence(model.goals.evidence.length, model.goals.successCriteria.length >= 2 ? 0.95 : 0.75),
      model.goals.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Features',
      scoreFromEvidence(
        model.features.length,
        model.features.some((f) => f.priority === 'REQUIRED') ? 1.0 : 0.8,
        1,
      ),
      model.features.reduce((sum, f) => sum + f.evidence.length, 0),
      options.categoryThreshold,
    ),
    buildCategory(
      'Workflows',
      scoreFromEvidence(model.workflows.length, model.workflows[0]?.steps.length >= 4 ? 0.96 : 0.72, 1),
      model.workflows.reduce((sum, w) => sum + w.evidence.length, 0),
      options.categoryThreshold,
    ),
    buildCategory(
      'Interactions',
      scoreFromEvidence(model.interactions.modes.length, model.interactions.modes.length >= 1 ? 0.97 : 0.5),
      model.interactions.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Navigation',
      scoreFromEvidence(model.navigation.patterns.length, model.navigation.navigationGraph.length > 0 ? 0.94 : 0.7),
      model.navigation.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Accessibility',
      scoreFromEvidence(
        model.accessibility.requirements.length,
        model.accessibility.mandatoryConstraints.length > 0 ? 1.0 : 0.88,
        1,
        model.accessibility.mandatoryConstraints.length === 0,
      ),
      model.accessibility.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Platform',
      scoreFromEvidence(model.platform.targets.length, model.platform.targets.length >= 1 ? 0.93 : 0.6),
      model.platform.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Behavior',
      scoreFromEvidence(model.behavior.behaviors.length, model.behavior.primaryFlow.length >= 4 ? 0.92 : 0.7),
      model.behavior.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'DataModel',
      scoreFromEvidence(model.dataModel.entities.length, model.dataModel.entities.length >= 1 ? 0.9 : 0.55),
      model.dataModel.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'VisualDesign',
      scoreFromEvidence(model.visualDesign.styles.length, model.visualDesign.styles.length >= 1 ? 0.88 : 0.6),
      model.visualDesign.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Safety',
      scoreFromEvidence(
        model.safety.evidence.length + model.safety.disclaimers.length,
        0.9,
        1,
        model.safety.disclaimers.length === 0 && model.safety.warnings.length === 0,
      ),
      model.safety.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Performance',
      scoreFromEvidence(model.performance.evidence.length, 0.85),
      model.performance.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'SuccessCriteria',
      scoreFromEvidence(model.successCriteria.completionCriteria.length, 0.95),
      model.successCriteria.evidence.length,
      options.categoryThreshold,
    ),
    buildCategory(
      'Architecture',
      scoreFromEvidence(
        model.architecture.moduleIds.length,
        model.architecture.suggestedProfile ? 0.96 : 0.65,
        1,
      ),
      model.architecture.evidence.length,
      options.categoryThreshold,
    ),
  ];

  const overallConfidence =
    Math.round((categories.reduce((sum, c) => sum + c.score, 0) / categories.length) * 100) / 100;

  const allCategoriesMeetThreshold = categories.every((c) => c.meetsThreshold);

  return {
    readOnly: true,
    categories,
    overallConfidence,
    meetsOverallThreshold: overallConfidence >= options.overallThreshold && allCategoriesMeetThreshold,
    thresholdUsed: options.overallThreshold,
    categoryThresholdUsed: options.categoryThreshold,
  };
}
