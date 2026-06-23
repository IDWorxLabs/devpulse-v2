/**
 * Autonomous Founder Launch Authority V1 — invisible automatic trigger gate.
 */

import { getLastEngineeringRealityAssessment } from '../engineering-reality-authority/index.js';
import { getLastFeatureRealityAssessment } from '../feature-reality-validation/index.js';
import { getLastBlueprintVisualAssessment } from '../universal-app-blueprint-visual/index.js';
import { getLastUniversalFeatureContractAssessment } from '../universal-feature-contract-intelligence/index.js';
import { collectFounderLaunchEvidence } from './founder-evidence-collector.js';

export interface InvisibleFounderLaunchTriggerResult {
  readOnly: true;
  shouldRun: boolean;
  missingPrerequisites: string[];
  userFacingPhases: readonly string[];
}

export function evaluateInvisibleFounderLaunchTrigger(input: {
  projectRootDir?: string | null;
  workspaceDir?: string | null;
}): InvisibleFounderLaunchTriggerResult {
  const evidence = collectFounderLaunchEvidence({
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: input.workspaceDir ?? null,
    synthesizeLaunchReadiness: true,
  });

  const blueprintVisual = getLastBlueprintVisualAssessment();
  const featureReality = getLastFeatureRealityAssessment();
  const universalFeature = getLastUniversalFeatureContractAssessment();
  const engineering = getLastEngineeringRealityAssessment();

  const missingPrerequisites: string[] = [];
  if (!evidence.buildReality.passed) missingPrerequisites.push('Build Reality PASS');
  if (!evidence.blueprintStructure.passed) missingPrerequisites.push('Blueprint Structure PASS');
  if (!blueprintVisual?.passed) missingPrerequisites.push('Blueprint Visual PASS');
  if (!(featureReality?.passed || universalFeature?.passed)) {
    missingPrerequisites.push('Feature Reality PASS');
  }
  if (!universalFeature?.passed) missingPrerequisites.push('Universal Feature Contract PASS');
  if (!engineering?.passed) missingPrerequisites.push('Engineering Reality PASS');

  return {
    readOnly: true,
    shouldRun: missingPrerequisites.length === 0,
    missingPrerequisites,
    userFacingPhases: ['Building...', 'Testing...', 'Fixing Issues...', 'Final Launch Review...'],
  };
}
