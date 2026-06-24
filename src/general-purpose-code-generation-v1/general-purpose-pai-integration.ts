/**
 * General-Purpose Code Generation V1 — Product Architect integration.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assessProductArchitecture } from '../product-architect-intelligence-v1/index.js';
import { resolveProductPattern } from '../product-architect-intelligence-v1/product-pattern-registry.js';
import type { ProductArchitectDomain } from '../product-architect-intelligence-v1/product-architect-intelligence-types.js';
import type { GeneralPurposeAppModel } from './general-purpose-code-generation-v1-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function assessGeneralPurposeProductArchitecture(input: {
  model: GeneralPurposeAppModel;
  workspaceDir: string | null;
  buildSuccess: boolean;
  previewSuccess: boolean;
}): {
  paiReviewPassed: boolean;
  productReadinessScore: number;
  missingWorkflows: readonly string[];
  missingScreens: readonly string[];
} {
  const manifestPath = input.workspaceDir
    ? join(input.workspaceDir, 'src', 'gpcg', 'GeneralPurposeManifest.json')
    : null;
  const manifestEvidence =
    manifestPath && existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : '';

  const observedEvidence = [
    input.model.prompt,
    input.model.workflows.map((wf) => `${wf.label}: ${wf.steps.join(' → ')}`).join('\n'),
    input.model.screens.map((screen) => screen.label).join(' '),
    input.model.roles.map((role) => role.label).join(' '),
    manifestEvidence,
  ].join('\n');

  const pai = assessProductArchitecture({
    profile: input.model.profile,
    productPrompt: input.model.prompt,
    productName: input.model.productName,
    observedEvidence,
    workspaceDir: input.workspaceDir,
  });

  const pattern = resolveProductPattern(input.model.domain as ProductArchitectDomain);
  const expectedCriticalScreens = pattern?.expectedScreens.filter((s) => s.critical).length ?? 0;
  const modelCriticalScreens = input.model.screens.filter((s) => s.critical).length;

  const modelWorkflowCoverage = input.model.workflows.some((wf) => wf.steps.length >= 3);
  const modelRoleCoverage = input.model.roles.length >= 2;
  const modelScreenCoverage = input.model.screens.length >= 3;
  const gpExtensionsPresent = Boolean(manifestPath && existsSync(manifestPath));

  const gpStructuralScore = clamp(
    (modelWorkflowCoverage ? 35 : 0) +
      (modelRoleCoverage ? 25 : 0) +
      (modelScreenCoverage ? 25 : 0) +
      (gpExtensionsPresent ? 15 : 0),
  );

  const productReadinessScore = Math.max(pai.scores.productReadinessScore, gpStructuralScore);

  const missingWorkflows = pai.workflowAnalysis
    .filter((wf) => !wf.complete)
    .map((wf) => wf.workflow);
  const missingScreens = pai.missingScreens.map((screen) => screen.screen);

  const paiReviewPassed =
    input.buildSuccess &&
    input.previewSuccess &&
    modelWorkflowCoverage &&
    modelRoleCoverage &&
    gpExtensionsPresent &&
    productReadinessScore >= 50 &&
    modelCriticalScreens >= Math.min(3, expectedCriticalScreens || 3);

  return {
    paiReviewPassed,
    productReadinessScore,
    missingWorkflows,
    missingScreens,
  };
}
