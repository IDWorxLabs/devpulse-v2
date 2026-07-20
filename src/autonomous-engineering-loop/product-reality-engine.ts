/**
 * Product Reality Engine (PRE) — evaluates whether generated software matches the requested product.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  contractRequiresProductModules,
  isGenericOnlyModuleSet,
  missingContractModules,
  synthesizeEngineeringFeatureContract,
} from '../engineering-intelligence-runtime/module-contract-synthesizer.js';
import { classifyProductDomain, domainExpectsRichProductModules } from '../engineering-intelligence-runtime/product-domain-classifier.js';
import { checkPromptToFeatureFidelity } from '../engineering-intelligence-runtime/prompt-to-feature-fidelity-checker.js';
import { listCapabilityModuleIds } from '../engineering-intelligence-runtime/capability-extraction-engine.js';
import type { ProductRealityReport } from './ael-types.js';

const GENERIC_SHELL_MODULES = new Set([
  'dashboard',
  'settings',
  'persistence',
  'auth',
  'navigation-router',
  'filter-ui',
]);

function readWorkspaceText(workspaceDir: string, relativePath: string): string {
  const full = join(workspaceDir, relativePath);
  if (!existsSync(full)) return '';
  try {
    return readFileSync(full, 'utf8');
  } catch {
    return '';
  }
}

function detectPlaceholderHonesty(workspaceDir: string): boolean {
  const combined = [
    'src/features',
    'src/data/demo-data.ts',
    'README.md',
  ]
    .map((p) => readWorkspaceText(workspaceDir, p))
    .join('\n');
  const hasPlaceholderMarker = /placeholder|not connected|simulated|mock integration|safe placeholder/i.test(
    combined,
  );
  const pretendsReal = /stripe\.com|live payment|real transaction|production api key/i.test(combined);
  return !pretendsReal || hasPlaceholderMarker;
}

function computeCoverage(modules: readonly string[], required: readonly string[]): number {
  if (required.length === 0) return 100;
  const present = required.filter((m) => modules.includes(m));
  return Math.round((present.length / required.length) * 100);
}

function detectInteractionCoverage(workspaceDir: string, requiredModules: readonly string[]): number {
  const interactionFiles = ['src/features/feature-app-router.tsx', 'src/App.tsx'];
  const combined = interactionFiles.map((f) => readWorkspaceText(workspaceDir, f)).join('\n');
  if (!combined.trim()) return requiredModules.length === 0 ? 100 : 0;
  const signals = requiredModules.filter((m) => combined.includes(m));
  return computeCoverage(signals, requiredModules);
}

function detectRouteCoverage(workspaceDir: string, requiredModules: readonly string[]): number {
  const router = readWorkspaceText(workspaceDir, 'src/features/routes.ts');
  const registry = readWorkspaceText(workspaceDir, 'src/features/registry.ts');
  const combined = `${router}\n${registry}`;
  if (!combined.trim()) return 0;
  const routed = requiredModules.filter((m) => combined.includes(m));
  return computeCoverage(routed, requiredModules);
}

function detectDataModelCoverage(workspaceDir: string, requiredModules: readonly string[]): number {
  const demoData = readWorkspaceText(workspaceDir, 'src/data/demo-data.ts');
  if (!demoData.trim()) return requiredModules.length === 0 ? 80 : 30;
  const present = requiredModules.filter((m) => demoData.includes(m));
  return computeCoverage(present, requiredModules);
}

export function evaluateProductReality(input: {
  rawPrompt: string;
  workspaceDir: string;
  generatedModules: readonly string[];
  approvedModuleIds?: readonly string[];
}): ProductRealityReport {
  const contract = synthesizeEngineeringFeatureContract({ rawPrompt: input.rawPrompt });
  const domainClassification = classifyProductDomain(input.rawPrompt);
  const modules =
    input.generatedModules.length > 0 ? input.generatedModules : (input.approvedModuleIds ?? []);

  const fidelity = checkPromptToFeatureFidelity({
    rawPrompt: input.rawPrompt,
    workspaceDir: input.workspaceDir,
    generatedModules: modules,
    approvedModuleIds: input.approvedModuleIds ?? modules,
    selectedProfile: domainClassification.domain,
    contract,
  });

  const productModules = modules.filter((m) => !GENERIC_SHELL_MODULES.has(m));
  const richDomain = domainExpectsRichProductModules(domainClassification.domain);
  const genericFallbackDetected =
    fidelity.genericCollapseDetected ||
    (richDomain &&
      contractRequiresProductModules(contract) &&
      (isGenericOnlyModuleSet(modules) ||
        (productModules.length <= 2 && modules.every((m) => GENERIC_SHELL_MODULES.has(m)))));

  const requiredCapabilities = contract.requiredCapabilities.map((c) => c.capabilityId);
  const coveredCapabilities = requiredCapabilities.filter((id) => {
    const moduleIds = listCapabilityModuleIds(
      contract.requiredCapabilities.filter((c) => c.capabilityId === id),
    );
    return moduleIds.some((m) => modules.includes(m));
  });
  let missingCapabilities = requiredCapabilities.filter((id) => !coveredCapabilities.includes(id));
  // End-to-End Autonomous Production Convergence V1 — the Autonomous Engineering Loop must never
  // evolve a capability into a brand-new top-level module/navigation surface that the CBGA envelope
  // never approved. That is exactly the post-preview drift GPCA rejects (observed: a "Records"
  // capability, a decomposition artifact of the approved "stock-records" module, was materialized as
  // an unapproved nav item). A capability is only an ACTIONABLE gap when its target module is part
  // of the approved module set (i.e. an approved module that failed to materialize). Capabilities
  // whose module is not approved are either already covered by an approved module under a different
  // decomposition or genuinely out of approved scope — both must be reported as gaps, never silently
  // materialized. Fully generic: it bounds evolution to the constitutional approved envelope.
  if (input.approvedModuleIds && input.approvedModuleIds.length > 0) {
    const approved = new Set(input.approvedModuleIds);
    missingCapabilities = missingCapabilities.filter((id) => {
      const moduleIds = listCapabilityModuleIds(
        contract.requiredCapabilities.filter((c) => c.capabilityId === id),
      );
      return moduleIds.some((m) => approved.has(m));
    });
  }

  const requiredModules = contract.requiredModules;
  const coreWorkflowCoverage = fidelity.productFidelityScore;
  const interactionCoverage = detectInteractionCoverage(input.workspaceDir, requiredModules);
  const routeCoverage = detectRouteCoverage(input.workspaceDir, requiredModules);
  const dataModelCoverage = detectDataModelCoverage(input.workspaceDir, requiredModules);

  const launchReadinessBlockers: string[] = [];
  if (genericFallbackDetected) {
    launchReadinessBlockers.push('Generic dashboard/settings fallback detected for rich product prompt.');
  }
  for (const missing of missingContractModules(contract, modules)) {
    launchReadinessBlockers.push(`Missing domain module: ${missing}`);
  }
  if (!detectPlaceholderHonesty(input.workspaceDir) && /\bcheckout|payment|billing\b/i.test(input.rawPrompt)) {
    launchReadinessBlockers.push('Placeholder pretends to be real integration without safe marking.');
  }
  if (coreWorkflowCoverage < 50 && richDomain) {
    launchReadinessBlockers.push('Core user workflow cannot be found in generated workspace.');
  }

  const repairRecommendations: string[] = [];
  if (genericFallbackDetected) {
    repairRecommendations.push('Evolve missing product feature modules via Capability Evolution Runtime.');
  }
  for (const cap of missingCapabilities.slice(0, 5)) {
    repairRecommendations.push(`Generate capability: ${cap}`);
  }
  if (interactionCoverage < 60) {
    repairRecommendations.push('Add interaction reachability for required workflows.');
  }

  let productRealityScore = Number.isFinite(fidelity.productFidelityScore)
    ? fidelity.productFidelityScore
    : 0;
  if (genericFallbackDetected) productRealityScore = Math.min(productRealityScore, 35);
  productRealityScore = Math.round(
    (productRealityScore + interactionCoverage + routeCoverage + dataModelCoverage) / 4,
  );
  if (!Number.isFinite(productRealityScore)) productRealityScore = 0;

  return {
    readOnly: true,
    productDomain: domainClassification.domain,
    productRealityScore,
    requiredCapabilities,
    coveredCapabilities,
    missingCapabilities,
    genericFallbackDetected,
    coreWorkflowCoverage,
    interactionCoverage,
    routeCoverage,
    dataModelCoverage,
    launchReadinessBlockers,
    repairRecommendations,
  };
}

export function productRealityPasses(report: ProductRealityReport): boolean {
  return (
    report.productRealityScore >= 70 &&
    !report.genericFallbackDetected &&
    report.launchReadinessBlockers.length === 0
  );
}
