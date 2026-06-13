/**
 * Project Scope Analyzer — scope and product context signals (V1).
 */

import type { ConsolidatedRequirementEvidence } from './requirement-completeness-types.js';

export interface ProjectScopeAnalysis {
  readOnly: true;
  hasProductIntent: boolean;
  hasMultiSourceEvidence: boolean;
  sourceCount: number;
  screenCount: number;
  workflowCount: number;
  integrationCount: number;
  scopeSignals: readonly string[];
  scopeRisks: readonly string[];
}

export function analyzeProjectScope(evidence: ConsolidatedRequirementEvidence): ProjectScopeAnalysis {
  const scopeSignals: string[] = [];
  const scopeRisks: string[] = [];

  if (evidence.productType) scopeSignals.push(`PRODUCT_TYPE_${evidence.productType}`);
  if (evidence.screens.length >= 3) scopeSignals.push('MULTI_SCREEN_SCOPE');
  if (evidence.workflows.length >= 2) scopeSignals.push('MULTI_WORKFLOW_SCOPE');
  if (evidence.integrations.length >= 1) scopeSignals.push('INTEGRATION_SCOPE');

  if (evidence.sources.length >= 2) scopeSignals.push('MULTI_SOURCE_EVIDENCE');
  if (evidence.sources.includes('VOICE_NOTES_INTELLIGENCE')) scopeSignals.push('VOICE_EVIDENCE');
  if (evidence.sources.includes('VISUAL_REFERENCE_INTELLIGENCE')) scopeSignals.push('VISUAL_EVIDENCE');
  if (evidence.sources.includes('PROJECT_VAULT_CONTEXT')) scopeSignals.push('VAULT_EVIDENCE');

  if (evidence.screens.length >= 4 && evidence.workflows.length === 0) {
    scopeRisks.push('BROAD_UI_SCOPE_WITHOUT_WORKFLOWS');
  }
  if (evidence.integrations.length >= 2 && evidence.dataEntities.length < 2) {
    scopeRisks.push('INTEGRATION_HEAVY_SCOPE_WITHOUT_DATA_MODEL');
  }
  if (evidence.sources.length === 1 && evidence.sources[0] === 'TYPED_PROMPT') {
    scopeRisks.push('SINGLE_SOURCE_PROMPT_ONLY');
  }

  return {
    readOnly: true,
    hasProductIntent: evidence.productType != null || evidence.screens.length > 0 || evidence.workflows.length > 0,
    hasMultiSourceEvidence: evidence.sources.length >= 2,
    sourceCount: evidence.sources.length,
    screenCount: evidence.screens.length,
    workflowCount: evidence.workflows.length,
    integrationCount: evidence.integrations.length,
    scopeSignals,
    scopeRisks,
  };
}
