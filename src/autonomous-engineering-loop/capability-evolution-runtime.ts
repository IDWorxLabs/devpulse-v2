/**
 * Capability Evolution Runtime (CER) — generates missing engineering/product capabilities.
 * Distinct from AutoFix: CER adds missing capability, AutoFix repairs broken code.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { assessEvolutionSafety } from '../missing-capability-evolution-engine/evolution-safety-assessor.js';
import { isSafePaymentPlaceholderCapabilityName } from '../safe-payment-placeholder-policy/index.js';
import {
  buildFeatureAppRouterTsx,
  buildModularFeatureModuleFiles,
  buildModularFeatureRegistryTs,
  buildModularFeatureRoutesTs,
  type GeneratedFeatureModuleManifestEntry,
} from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { dedupeModuleIds } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';
import { extractPromptAppTitle } from '../universal-prompt-to-app-materialization/prompt-app-metadata.js';
import type { CapabilityEvolutionAttempt, CapabilityType } from './ael-types.js';
import { AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS } from './ael-types.js';

export function classifyCapabilityType(capabilityId: string): CapabilityType {
  if (/accessibility|calibration|gaze|blink|speech/i.test(capabilityId)) return 'ACCESSIBILITY';
  if (/checkout|payment|stripe|integration|api|webhook/i.test(capabilityId)) return 'INTEGRATION_PLACEHOLDER';
  if (/route|router|navigation/i.test(capabilityId)) return 'ROUTING';
  if (/model|schema|data/i.test(capabilityId)) return 'DATA_MODEL';
  if (/preview|verif/i.test(capabilityId)) return 'PREVIEW_VERIFICATION';
  if (/validat|test|lint/i.test(capabilityId)) return 'VALIDATION';
  if (/interact|reachab|click|input/i.test(capabilityId)) return 'INTERACTION';
  if (/safety|policy|guard/i.test(capabilityId)) return 'SAFETY_POLICY';
  return 'PRODUCT_FEATURE';
}

function writeWorkspaceFile(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
  content: string;
}): boolean {
  const operation = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: 'CREATE_FILE',
    requestedBy: 'autonomous-engineering-loop-cer',
    sourceActionId: 'capability-evolution',
    payload: input.content,
  });
  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation,
  });
  return Boolean(executed.result?.success);
}

function moduleIdFromCapability(capabilityId: string): string {
  return capabilityId
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40);
}

function buildPlaceholderModuleContent(moduleId: string, appTitle: string): string {
  const displayName = moduleId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `/**
 * Safe placeholder capability — ${moduleId}
 * Real integration requires explicit human-reviewed wiring.
 */
import React from 'react';

export function ${moduleId
    .split('-')
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('')}Feature() {
  return (
    <section data-capability="${moduleId}" data-placeholder="true" aria-label="${displayName}">
      <h2>${displayName}</h2>
      <p>Safe placeholder module for ${appTitle}. Real-world integration is not connected.</p>
      <p className="placeholder-notice">This is a simulated capability placeholder — not a live integration.</p>
    </section>
  );
}
`;
}

export interface CapabilityEvolutionRuntimeInput {
  rawPrompt: string;
  workspaceDir: string;
  projectRootDir: string;
  workspaceId: string;
  missingCapabilities: readonly string[];
  definition: ProfileFeatureDefinition;
  existingModules: readonly string[];
  attemptBudget?: number;
}

export interface CapabilityEvolutionRuntimeResult {
  readOnly: true;
  attempts: readonly CapabilityEvolutionAttempt[];
  evolvedModules: readonly string[];
  npmBuildOk: boolean;
  safetyGateBypassed: false;
  humanReviewRequired: boolean;
  remainingGaps: readonly string[];
}

export function runCapabilityEvolutionRuntime(
  input: CapabilityEvolutionRuntimeInput,
): CapabilityEvolutionRuntimeResult {
  const budget = input.attemptBudget ?? AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS;
  const attempts: CapabilityEvolutionAttempt[] = [];
  const evolvedModules: string[] = [];
  let humanReviewRequired = false;
  const remainingGaps: string[] = [];
  const appTitle = extractPromptAppTitle(input.rawPrompt);

  const targets = input.missingCapabilities.slice(0, budget);
  for (let i = 0; i < targets.length; i++) {
    const capabilityId = targets[i]!;
    const capabilityType = classifyCapabilityType(capabilityId);
    const moduleId = moduleIdFromCapability(capabilityId);

    const safety = assessEvolutionSafety({
      readOnly: true,
      missingCapabilityId: `ael-cap-${moduleId}`,
      capabilityName: capabilityId,
      reasonRequired: `Missing capability ${capabilityId} detected by AEL`,
      sourceRequirementIds: [`req-${moduleId}`],
      sourcePromptEvidence: [input.rawPrompt.slice(0, 200)],
      affectedFeatureSlices: [moduleId],
      affectedBehaviorScenarios: [],
      affectedVirtualUsers: [],
      affectedDeviceProfiles: [],
      affectedInteractions: [],
      expectedInterfaces: [],
      requiredValidation: [],
      riskHints: [],
      blockingGate: 'LAUNCH_AUTHORITY',
    });

    const safeToGenerate =
      safety.verdict === 'SAFE_TO_EVOLVE' || safety.verdict === 'SAFE_WITH_LIMITATIONS';

    if (
      safety.verdict === 'NEEDS_HUMAN_REVIEW' ||
      safety.verdict === 'BLOCKED_UNSAFE' ||
      safety.verdict === 'INSUFFICIENT_EVIDENCE'
    ) {
      humanReviewRequired = true;
      remainingGaps.push(`${capabilityId}: ${safety.blockedReason ?? safety.humanReviewReason ?? 'unsafe'}`);
      attempts.push({
        readOnly: true,
        attempt: i + 1,
        capabilityId,
        capabilityType,
        safeToGenerate: false,
        generated: false,
        placeholderOnly: false,
        safetyGateBypassed: false,
        humanReviewRequired: true,
        evidence: [`Safety verdict: ${safety.verdict}`],
      });
      continue;
    }

    if (input.existingModules.includes(moduleId) || existsSync(join(input.workspaceDir, 'src/features', moduleId))) {
      attempts.push({
        readOnly: true,
        attempt: i + 1,
        capabilityId,
        capabilityType,
        safeToGenerate: true,
        generated: false,
        placeholderOnly: false,
        safetyGateBypassed: false,
        humanReviewRequired: false,
        evidence: ['Module already present'],
      });
      continue;
    }

    const placeholderOnly =
      capabilityType === 'INTEGRATION_PLACEHOLDER' ||
      isSafePaymentPlaceholderCapabilityName(capabilityId) ||
      /payment|checkout|billing|medical|legal/i.test(capabilityId);

    let generated = false;
    const evidence: string[] = [];

    if (safeToGenerate) {
      const updatedDefinition: ProfileFeatureDefinition = {
        ...input.definition,
        featureModules: dedupeModuleIds([...input.existingModules, moduleId, ...input.definition.featureModules]),
        routes: dedupeModuleIds([...input.existingModules, moduleId]).map((id) =>
          id === 'auth' ? '/' : `/${id}`,
        ),
      };

      if (placeholderOnly) {
        const moduleDir = join(input.workspaceDir, 'src/features', moduleId);
        const componentPath = join(moduleDir, `${moduleId}.tsx`);
        writeWorkspaceFile({
          projectRootDir: input.projectRootDir,
          workspaceId: input.workspaceId,
          relativePath: `src/features/${moduleId}/${moduleId}.tsx`,
          content: buildPlaceholderModuleContent(moduleId, appTitle),
        });
        evidence.push('Safe placeholder module generated');
      } else {
        const built = buildModularFeatureModuleFiles(moduleId, appTitle, updatedDefinition);
        for (const file of built.files) {
          writeWorkspaceFile({
            projectRootDir: input.projectRootDir,
            workspaceId: input.workspaceId,
            relativePath: file.relativePath,
            content: file.content,
          });
        }
        evidence.push('Product feature module generated');
      }

      const allModuleIds = dedupeModuleIds([
        ...input.existingModules,
        moduleId,
        ...updatedDefinition.featureModules,
      ]);
      const manifestEntries: GeneratedFeatureModuleManifestEntry[] = [];
      for (const id of allModuleIds) {
        if (!existsSync(join(input.workspaceDir, 'src/features', id))) continue;
        const built = buildModularFeatureModuleFiles(id, appTitle, updatedDefinition);
        manifestEntries.push(built.manifestEntry);
      }

      writeWorkspaceFile({
        projectRootDir: input.projectRootDir,
        workspaceId: input.workspaceId,
        relativePath: 'src/features/registry.ts',
        content: buildModularFeatureRegistryTs(manifestEntries),
      });
      writeWorkspaceFile({
        projectRootDir: input.projectRootDir,
        workspaceId: input.workspaceId,
        relativePath: 'src/features/routes.ts',
        content: buildModularFeatureRoutesTs(),
      });
      writeWorkspaceFile({
        projectRootDir: input.projectRootDir,
        workspaceId: input.workspaceId,
        relativePath: 'src/features/feature-app-router.tsx',
        content: buildFeatureAppRouterTsx(updatedDefinition),
      });

      generated = true;
      evolvedModules.push(moduleId);
    }

    attempts.push({
      readOnly: true,
      attempt: i + 1,
      capabilityId,
      capabilityType,
      safeToGenerate,
      generated,
      placeholderOnly,
      safetyGateBypassed: false,
      humanReviewRequired: false,
      evidence,
    });
  }

  let npmBuildOk = true;
  try {
    execSync('npm run build', { cwd: input.workspaceDir, stdio: 'pipe', timeout: 120_000 });
  } catch {
    npmBuildOk = false;
    remainingGaps.push('npm build failed after capability evolution');
  }

  return {
    readOnly: true,
    attempts,
    evolvedModules,
    npmBuildOk,
    safetyGateBypassed: false,
    humanReviewRequired,
    remainingGaps,
  };
}
