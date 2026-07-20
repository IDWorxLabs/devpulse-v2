/**
 * Universal Workflow Generation Engine V1 — approved workflow extraction from envelope.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { RawApprovedWorkflow } from './universal-workflow-types.js';

export interface ApprovedWorkflowExtractionInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly moduleId: string;
  readonly contractId: string;
}

export function extractApprovedWorkflowsFromEnvelope(input: ApprovedWorkflowExtractionInput): RawApprovedWorkflow[] {
  const { envelope, moduleId, contractId } = input;
  const workflows: RawApprovedWorkflow[] = [];
  const seen = new Set<string>();

  const moduleEntry = envelope.approvedModulePlan.moduleEntries.find((e) => e.moduleId === moduleId) ?? null;
  const moduleTokens = tokenize(moduleId, moduleEntry?.displayName ?? moduleId);

  for (const label of envelope.canonicalProductContract.primaryWorkflows) {
    const normalized = label.trim();
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    if (!workflowAppliesToModule(normalized, moduleTokens, moduleId, moduleEntry?.featureType)) continue;
    seen.add(normalized.toLowerCase());
    workflows.push({
      label: normalized,
      sourceEnvelopePath: `canonicalProductContract.primaryWorkflows[${normalized}]`,
      moduleId,
      contractId,
      featureType: moduleEntry?.featureType,
    });
  }

  if (moduleEntry?.featureType === 'CONTRACT_WORKFLOW' && moduleEntry.contractSource) {
    const source = moduleEntry.contractSource.trim();
    if (source && !seen.has(source.toLowerCase())) {
      workflows.push({
        label: source,
        sourceEnvelopePath: `approvedModulePlan.moduleEntries[${moduleId}].contractSource`,
        moduleId,
        contractId,
        featureType: 'CONTRACT_WORKFLOW',
      });
    }
  }

  return workflows;
}

function tokenize(moduleId: string, displayName: string): string[] {
  const tokens = new Set<string>();
  for (const part of moduleId.split('-')) if (part.length > 2) tokens.add(part.toLowerCase());
  for (const part of displayName.toLowerCase().split(/\s+/)) if (part.length > 2) tokens.add(part);
  return [...tokens];
}

function workflowAppliesToModule(
  label: string,
  moduleTokens: string[],
  moduleId: string,
  featureType?: string,
): boolean {
  if (featureType === 'CONTRACT_WORKFLOW') return true;
  const lower = label.toLowerCase();
  if (moduleTokens.some((t) => lower.includes(t))) return true;
  if (lower.includes(moduleId.replace(/-/g, ' '))) return true;
  return isGenericWorkflowLabel(lower);
}

function isGenericWorkflowLabel(lower: string): boolean {
  const hints = ['process', 'flow', 'step', 'stage', 'wizard', 'onboard', 'approval', 'review', 'submit'];
  return hints.some((h) => lower.includes(h));
}

export function countEnvelopeApprovedWorkflows(envelope: ApprovedProductionBuildEnvelope): number {
  return envelope.canonicalProductContract.primaryWorkflows.length;
}
