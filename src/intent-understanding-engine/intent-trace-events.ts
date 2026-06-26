/**
 * Intent Understanding Engine — execution trace events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { ProductIntelligenceModel } from './intent-understanding-types.js';

export function buildIntentUnderstandingTraceEvents(
  model: ProductIntelligenceModel,
): ExecutionTraceEvent[] {
  const events: ExecutionTraceEvent[] = [];
  const ts = model.createdAt;
  let seq = 0;

  const push = (
    title: string,
    detail: string,
    metadata?: Record<string, string | number | boolean | string[] | null>,
    milestone = false,
  ): void => {
    seq += 1;
    events.push({
      eventId: `intent-understanding-${seq}`,
      runtimeStage: 'Planning',
      component: 'intent_understanding_engine',
      eventTitle: title,
      technicalDetail: detail,
      severity: 'INFO',
      status: 'Completed',
      timestamp: ts + seq,
      milestone,
      metadata: metadata ?? {},
    });
  };

  push('Intent Understanding Started', 'Constructing Product Intelligence Model from prompt evidence.', {
    modelId: model.modelId,
  }, true);

  push('Domain Understood', `${model.product.productName} — ${model.product.productType}`, {
    productName: model.product.productName,
    productType: model.product.productType,
    industry: model.product.industry,
  }, true);

  push('Users Identified', model.users.map((u) => u.role).join(', '), {
    personas: model.users.map((u) => u.role),
    primaryUser: model.users.find((u) => u.isPrimary)?.role ?? null,
  }, true);

  push('Workflows Built', `${model.workflows.length} workflow(s) with ${model.workflows[0]?.steps.length ?? 0} steps`, {
    workflowCount: model.workflows.length,
    primaryWorkflow: model.workflows[0]?.name ?? null,
  }, true);

  push('Interactions Identified', model.interactions.modes.join(', '), {
    interactionModes: model.interactions.modes,
    interactionCount: model.interactions.modes.length,
  }, true);

  push('Accessibility Requirements Extracted', `${model.accessibility.requirements.length} requirements, ${model.accessibility.mandatoryConstraints.length} mandatory`, {
    requirements: model.accessibility.requirements,
    mandatoryConstraints: model.accessibility.mandatoryConstraints,
    wcagLevel: model.accessibility.wcagLevel,
  }, true);

  push('Behavior Model Completed', model.behavior.primaryFlow.join(' → '), {
    behaviorSteps: model.behavior.behaviors.length,
    primaryFlow: model.behavior.primaryFlow,
  }, true);

  push('Product Intelligence Model Built', `Model ${model.modelId} — ${model.features.length} features, ${model.architecture.moduleIds.length} modules`, {
    modelId: model.modelId,
    featureCount: model.features.length,
    moduleIds: model.architecture.moduleIds,
    suggestedProfile: model.architecture.suggestedProfile,
  }, true);

  push('Intent Confidence Calculated', `Overall: ${Math.round(model.confidence.overallConfidence * 100)}%`, {
    overallConfidence: model.confidence.overallConfidence,
    meetsThreshold: model.confidence.meetsOverallThreshold,
    categories: model.confidence.categories.map((c) => `${c.category}:${Math.round(c.score * 100)}%`),
  }, true);

  push('Intent Understanding Complete', model.confidence.meetsOverallThreshold
    ? 'Product Intelligence Model verified — generation may proceed.'
    : 'Product Intelligence Model built — confidence below threshold.', {
    readyForGeneration: model.confidence.meetsOverallThreshold,
    overallConfidence: model.confidence.overallConfidence,
  }, true);

  return events;
}
