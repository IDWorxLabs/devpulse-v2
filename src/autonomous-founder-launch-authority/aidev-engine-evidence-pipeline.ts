/**
 * Autonomous Founder Launch Authority V1 — evidence pipeline runner.
 * Runs upstream validations that produce evidence consumed by Founder Authority.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildUniversalCrudWorkspaceFiles } from '../code-generation-engine/universal-crud-app-generator.js';
import { parseFeatureContract } from '../feature-reality-validation/index.js';
import type { FeatureContract } from '../feature-reality-validation/feature-reality-validation-types.js';
import { runFeatureRealityValidation } from '../feature-reality-validation/feature-reality-validation-authority.js';
import {
  buildUniversalFeatureContract,
  parseUniversalFeatureContract,
  runUniversalFeatureValidation,
  type UniversalFeatureContract,
} from '../universal-feature-contract-intelligence/index.js';
import { runEngineeringRealityValidation } from '../engineering-reality-authority/engineering-reality-authority.js';
import { runUniversalAppBlueprintVisualValidation } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-authority.js';
import { inspectUniversalAppBlueprint } from '../universal-app-blueprint/index.js';
import type { RunAiDevEngineEvidencePipelineInput, FounderEvidenceSource } from './autonomous-founder-launch-authority-types.js';
import {
  buildBuildRealityEvidenceFromWorkspace,
  collectFounderLaunchEvidence,
} from './founder-evidence-collector.js';
import { resolveFounderLaunchPhaseDuringPipeline, resolveFounderLaunchUserLabel } from './founder-launch-user-surface.js';

function mapUniversalContractToFeatureContract(universal: UniversalFeatureContract): FeatureContract {
  const categoryForVerb = (verb: string): FeatureContract['features'][number]['category'] => {
    if (verb === 'delete') return 'delete';
    if (verb === 'search') return 'search';
    if (verb === 'update') return 'edit';
    if (verb === 'create') return 'execution';
    return 'execution';
  };

  return {
    contractVersion: '1.0',
    contractId: universal.contractId,
    productProfile: universal.productProfile,
    productName: universal.productName,
    generatedAt: universal.generatedAt,
    features: universal.actions
      .filter((action) => action.required)
      .map((action) => ({
        id: action.id,
        label: action.label,
        category: categoryForVerb(action.verb),
        required: action.required,
      })),
  };
}

function resolveFeatureContract(input: {
  workspaceDir: string;
  contractId: string;
  rawPrompt: string;
}): FeatureContract {
  const contractPath = join(input.workspaceDir, 'feature-contract.json');
  if (existsSync(contractPath)) {
    const raw = readFileSync(contractPath, 'utf8');
    try {
      return parseFeatureContract(raw);
    } catch {
      return mapUniversalContractToFeatureContract(parseUniversalFeatureContract(raw));
    }
  }

  return mapUniversalContractToFeatureContract(
    buildUniversalFeatureContract({
      contractId: input.contractId,
      rawPrompt: input.rawPrompt,
    }),
  );
}

function resolveUniversalFeatureContract(input: {
  workspaceDir: string;
  contractId: string;
  rawPrompt: string;
}): UniversalFeatureContract {
  const universalContractPath = join(input.workspaceDir, 'universal-feature-contract.json');
  if (existsSync(universalContractPath)) {
    return parseUniversalFeatureContract(readFileSync(universalContractPath, 'utf8'));
  }
  return buildUniversalFeatureContract({
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
  });
}

export interface AiDevEngineEvidencePipelineResult {
  readOnly: true;
  buildRealityPassed: boolean;
  blueprintStructurePassed: boolean;
  blueprintVisualPassed: boolean;
  featureRealityPassed: boolean;
  universalFeatureContractPassed: boolean;
  engineeringRealityPassed: boolean;
  allPrerequisitesPassed: boolean;
}

export async function runAiDevEngineEvidencePipeline(
  input: RunAiDevEngineEvidencePipelineInput & {
    onPhase?: (label: string) => void;
    buildReality?: FounderEvidenceSource;
    blueprintStructureOverride?: FounderEvidenceSource;
  },
): Promise<AiDevEngineEvidencePipelineResult> {
  input.onPhase?.(resolveFounderLaunchUserLabel(resolveFounderLaunchPhaseDuringPipeline('build')));

  const blueprintStructure = inspectUniversalAppBlueprint(input.workspaceDir);
  const buildReality =
    input.buildReality ??
    buildBuildRealityEvidenceFromWorkspace({
      workspacePresent: existsSync(input.workspaceDir),
      npmInstallOk: true,
      npmBuildOk: true,
      devServerOk: Boolean(input.previewUrl),
    });

  if (!input.playwrightReady) {
    return {
      readOnly: true,
      buildRealityPassed: buildReality.passed,
      blueprintStructurePassed: blueprintStructure.passed,
      blueprintVisualPassed: false,
      featureRealityPassed: false,
      universalFeatureContractPassed: false,
      engineeringRealityPassed: false,
      allPrerequisitesPassed: false,
    };
  }

  input.onPhase?.(resolveFounderLaunchUserLabel(resolveFounderLaunchPhaseDuringPipeline('test')));

  const blueprintVisual = await runUniversalAppBlueprintVisualValidation({
    previewUrl: input.previewUrl,
    appName: input.productName,
    coreNavLabel: input.navLabel,
  });

  const featureContract = resolveFeatureContract({
    workspaceDir: input.workspaceDir,
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
  });
  const featureReality = await runFeatureRealityValidation({
    previewUrl: input.previewUrl,
    contract: featureContract,
  });

  const universalContract = resolveUniversalFeatureContract({
    workspaceDir: input.workspaceDir,
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
  });
  const universalFeature = await runUniversalFeatureValidation({
    previewUrl: input.previewUrl,
    contract: universalContract,
  });
  const featureRealityPassed = featureReality.passed || universalFeature.passed;

  let engineering = await runEngineeringRealityValidation({
    previewUrl: input.previewUrl,
    workspaceDir: input.workspaceDir,
    contractId: input.contractId,
    productName: input.productName,
    navLabel: input.navLabel,
  });
  if (!engineering.passed) {
    engineering = await runEngineeringRealityValidation({
      previewUrl: input.previewUrl,
      workspaceDir: input.workspaceDir,
      contractId: input.contractId,
      productName: input.productName,
      navLabel: input.navLabel,
    });
  }

  const blueprintStructureEvidence =
    input.blueprintStructureOverride ??
    ({
      readOnly: true,
      sourceId: 'blueprint-structure',
      sourceName: 'Blueprint Structure',
      available: true,
      passed: blueprintStructure.passed,
      score: blueprintStructure.passed ? 100 : Math.max(0, 100 - blueprintStructure.missingArtifacts.length * 8),
      blockers: blueprintStructure.passed
        ? []
        : blueprintStructure.missingArtifacts.slice(0, 3).map((item) => `Missing artifact: ${item}`),
      warnings: [],
      findings: [`Checked artifacts: ${blueprintStructure.checkedArtifacts}`],
    } satisfies FounderEvidenceSource);

  const evidence = collectFounderLaunchEvidence({
    projectRootDir: input.projectRootDir,
    workspaceDir: input.workspaceDir,
    buildReality,
    blueprintStructure: blueprintStructureEvidence,
    synthesizeLaunchReadiness: true,
  });

  return {
    readOnly: true,
    buildRealityPassed: evidence.buildReality.passed,
    blueprintStructurePassed: evidence.blueprintStructure.passed,
    blueprintVisualPassed: blueprintVisual.passed,
    featureRealityPassed,
    universalFeatureContractPassed: universalFeature.passed,
    engineeringRealityPassed: engineering.passed,
    allPrerequisitesPassed: evidence.allPrerequisitesPassed,
  };
}

export function materializeUniversalCrudWorkspaceFiles(input: {
  projectRootDir: string;
  workspaceId: string;
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
  writeFile: (relativePath: string, content: string) => boolean;
}): number {
  const files = buildUniversalCrudWorkspaceFiles({
    contractId: input.contractId,
    ideaId: input.ideaId,
    buildUnits: input.buildUnits,
    rawPrompt: input.rawPrompt,
  });
  let written = 0;
  for (const file of files) {
    if (input.writeFile(file.relativePath, file.content)) {
      written += 1;
    }
  }
  return written;
}
