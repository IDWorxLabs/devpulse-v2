/**
 * Engineering Intelligence Runtime V1 — prompt-to-feature fidelity checker.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  capabilitiesMissingFromModules,
  contractRequiresProductModules,
  isGenericOnlyModuleSet,
  missingContractModules,
} from './module-contract-synthesizer.js';
import type {
  EngineeringFeatureContract,
  ModuleContractStatus,
  PromptToFeatureFidelityResult,
  RequiredCapability,
} from './engineering-intelligence-types.js';

const GENERIC_COLLAPSE_MODULES = new Set(['dashboard', 'settings']);

function readWorkspaceText(workspaceDir: string, relativePath: string): string {
  const full = join(workspaceDir, relativePath);
  if (!existsSync(full)) return '';
  try {
    return readFileSync(full, 'utf8');
  } catch {
    return '';
  }
}

function detectAppRoutesProductFeatures(workspaceDir: string, requiredModules: readonly string[]): boolean {
  const router = readWorkspaceText(workspaceDir, 'src/features/routes.ts');
  const registry = readWorkspaceText(workspaceDir, 'src/features/registry.ts');
  const appRouter = readWorkspaceText(workspaceDir, 'src/features/feature-app-router.tsx');
  const appTsx = readWorkspaceText(workspaceDir, 'src/App.tsx');
  const combined = `${router}\n${registry}\n${appRouter}\n${appTsx}`;
  if (!combined.trim()) return requiredModules.length === 0;
  return requiredModules.some((moduleId) => combined.includes(moduleId));
}

function detectProfileContamination(
  selectedProfile: string,
  generatedModules: readonly string[],
  contract: EngineeringFeatureContract,
): boolean {
  if (contract.productDomain === 'crm' && /CRM_WEB/i.test(selectedProfile)) return false;
  if (contract.productDomain === 'finance-expense' && /EXPENSE/i.test(selectedProfile)) return false;
  if (contract.productDomain === 'hr-admin' && generatedModules.some((m) => ['deals', 'leads', 'customers'].includes(m))) {
    return true;
  }
  if (contract.productDomain === 'ai-chat' && generatedModules.some((m) => ['dashboard', 'settings'].includes(m)) &&
    !generatedModules.some((m) => ['conversations', 'chat-input', 'responses', 'history'].includes(m))) {
    return true;
  }
  return false;
}

function computeFidelityScore(input: {
  contract: EngineeringFeatureContract;
  generatedModules: readonly string[];
  missingCapabilities: readonly RequiredCapability[];
  genericCollapseDetected: boolean;
  profileContaminationDetected: boolean;
  appRoutesProductFeatures: boolean;
}): number {
  const requiredCount = Math.max(input.contract.requiredCapabilities.filter((c) => !c.optional).length, 1);
  const mappedCount = requiredCount - input.missingCapabilities.filter((c) => !c.optional).length;
  let score = Math.round((mappedCount / requiredCount) * 100);

  if (input.genericCollapseDetected) score = Math.min(score, 35);
  if (input.profileContaminationDetected) score = Math.min(score, 45);
  if (!input.appRoutesProductFeatures && input.contract.requiredModules.length > 0) score = Math.min(score, 50);
  if (input.missingCapabilities.length === 0 && !input.genericCollapseDetected) score = Math.max(score, 85);

  return Math.max(0, Math.min(100, score));
}

function deriveModuleContractStatus(input: {
  genericCollapseDetected: boolean;
  profileContaminationDetected: boolean;
  missingCapabilities: readonly RequiredCapability[];
  contract: EngineeringFeatureContract;
}): ModuleContractStatus {
  if (input.genericCollapseDetected) return 'COLLAPSED_TO_GENERIC';
  if (input.profileContaminationDetected) return 'PROFILE_CONTAMINATED';
  if (input.missingCapabilities.some((c) => !c.optional)) return 'PARTIAL';
  if (input.contract.requiredModules.length === 0) return 'SATISFIED';
  return 'SATISFIED';
}

export function checkPromptToFeatureFidelity(input: {
  rawPrompt: string;
  workspaceDir?: string | null;
  generatedModules: readonly string[];
  approvedModuleIds: readonly string[];
  selectedProfile: string;
  contract: EngineeringFeatureContract;
}): PromptToFeatureFidelityResult {
  const generated = input.generatedModules.length > 0 ? input.generatedModules : input.approvedModuleIds;
  const missingModules = missingContractModules(input.contract, generated);
  const missingCapabilities = capabilitiesMissingFromModules(input.contract, generated);
  const genericCollapseDetected =
    contractRequiresProductModules(input.contract) &&
    (isGenericOnlyModuleSet(generated) ||
      (generated.filter((m) => !['persistence', 'auth'].includes(m)).every((m) => GENERIC_COLLAPSE_MODULES.has(m)) &&
        missingModules.length > 0));
  const profileContaminationDetected = detectProfileContamination(
    input.selectedProfile,
    generated,
    input.contract,
  );
  const appRoutesProductFeatures = input.workspaceDir
    ? detectAppRoutesProductFeatures(input.workspaceDir, input.contract.requiredModules)
    : generated.some((m) => input.contract.requiredModules.includes(m));

  const moduleContractStatus = deriveModuleContractStatus({
    genericCollapseDetected,
    profileContaminationDetected,
    missingCapabilities,
    contract: input.contract,
  });

  const productFidelityScore = computeFidelityScore({
    contract: input.contract,
    generatedModules: generated,
    missingCapabilities,
    genericCollapseDetected,
    profileContaminationDetected,
    appRoutesProductFeatures,
  });

  const passed =
    productFidelityScore >= 80 &&
    missingCapabilities.filter((c) => !c.optional).length === 0 &&
    !genericCollapseDetected &&
    appRoutesProductFeatures;

  const verdict = passed ? 'PASS' : productFidelityScore >= 50 ? 'REPAIR' : 'GAPS_REMAINING';

  const mappedCapabilities = input.contract.requiredCapabilities
    .filter((capability) => capability.moduleIds.some((moduleId) => generated.includes(moduleId)))
    .map((capability) => capability.capabilityId);

  const reasoningParts = [
    `Fidelity score: ${productFidelityScore}/100.`,
    `Module contract status: ${moduleContractStatus}.`,
    missingModules.length ? `Missing modules: ${missingModules.join(', ')}.` : 'All required modules present.',
    genericCollapseDetected ? 'Generic dashboard/settings collapse detected.' : '',
    profileContaminationDetected ? 'Profile contamination detected in module plan.' : '',
  ].filter(Boolean);

  return {
    readOnly: true,
    passed,
    verdict,
    productFidelityScore,
    moduleContractStatus,
    mappedCapabilities,
    missingCapabilities,
    missingModules,
    genericCollapseDetected,
    profileContaminationDetected,
    appRoutesProductFeatures,
    reasoning: reasoningParts.join(' '),
  };
}
