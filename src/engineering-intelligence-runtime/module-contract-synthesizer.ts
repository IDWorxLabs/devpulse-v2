/**
 * Engineering Intelligence Runtime V1 — module contract synthesis from capabilities.
 */

import { extractRequiredCapabilities, listCapabilityModuleIds } from './capability-extraction-engine.js';
import { classifyProductDomain, domainExpectsRichProductModules } from './product-domain-classifier.js';
import type { EngineeringFeatureContract, RequiredCapability } from './engineering-intelligence-types.js';
import { promptExplicitlyRequiresAuth } from '../universal-build-pipeline-verification/build-profile-policy.js';
import { dedupeModuleIds } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';

const GENERIC_FALLBACK_ONLY = new Set(['dashboard', 'settings', 'persistence', 'auth']);
const INFRASTRUCTURE_MODULES = new Set(['persistence', 'navigation', 'router']);
const CONDITIONAL_MODULES: Array<{ moduleId: string; requires: RegExp }> = [
  { moduleId: 'auth', requires: /\b(login|sign[\s-]?in|accounts?|sessions?|roles?|authentication)\b/i },
  { moduleId: 'export', requires: /\b(csv|export|reporting)\b/i },
  { moduleId: 'filter-ui', requires: /\b(filter|search|sort)\b/i },
];

function shouldRejectModule(moduleId: string, rawPrompt: string): string | null {
  if (moduleId === 'auth' && !promptExplicitlyRequiresAuth(rawPrompt)) {
    return 'Auth not explicitly requested.';
  }
  for (const conditional of CONDITIONAL_MODULES) {
    if (conditional.moduleId === moduleId && !conditional.requires.test(rawPrompt)) {
      return `${moduleId} not justified by prompt evidence.`;
    }
  }
  return null;
}

function isGenericFallbackModule(moduleId: string): boolean {
  return GENERIC_FALLBACK_ONLY.has(moduleId);
}

export function synthesizeEngineeringFeatureContract(input: {
  rawPrompt: string;
  extractionRequiredModules?: readonly string[];
}): EngineeringFeatureContract {
  const classification = classifyProductDomain(input.rawPrompt);
  const requiredCapabilities = extractRequiredCapabilities({
    rawPrompt: input.rawPrompt,
    domain: classification.domain,
    extractionRequiredModules: input.extractionRequiredModules,
  });

  const requiredModules = dedupeModuleIds(listCapabilityModuleIds(requiredCapabilities));
  const supportModules: string[] = [];
  const rejectedModules: string[] = [];

  if (/\bpersist|storage|save|offline\b/i.test(input.rawPrompt)) {
    supportModules.push('persistence');
  }

  for (const moduleId of [...requiredModules, ...supportModules]) {
    const rejection = shouldRejectModule(moduleId, input.rawPrompt);
    if (rejection) rejectedModules.push(`${moduleId}: ${rejection}`);
  }

  const filteredRequired = requiredModules.filter(
    (moduleId) => !rejectedModules.some((r) => r.startsWith(`${moduleId}:`)),
  );
  const filteredSupport = supportModules.filter(
    (moduleId) =>
      INFRASTRUCTURE_MODULES.has(moduleId) &&
      !rejectedModules.some((r) => r.startsWith(`${moduleId}:`)),
  );

  const reasoningParts = [
    `Detected domain: ${classification.domain} (${Math.round(classification.confidence * 100)}% confidence).`,
    `Extracted ${requiredCapabilities.length} required capabilities.`,
    `Required modules: ${filteredRequired.join(', ') || 'none'}.`,
  ];

  if (domainExpectsRichProductModules(classification.domain)) {
    const productModules = filteredRequired.filter((m) => !INFRASTRUCTURE_MODULES.has(m));
    if (productModules.length === 0) {
      reasoningParts.push('Warning: rich product domain but no product-specific modules synthesized.');
    }
    const genericOnly =
      productModules.length > 0 &&
      productModules.every((m) => isGenericFallbackModule(m));
    if (genericOnly) {
      reasoningParts.push('Rejected generic-only module collapse for rich product prompt.');
    }
  }

  return {
    readOnly: true,
    productDomain: classification.domain,
    requiredCapabilities,
    requiredModules: filteredRequired,
    supportModules: filteredSupport,
    rejectedModules,
    confidence: classification.confidence,
    reasoning: reasoningParts.join(' '),
  };
}

export function contractRequiresProductModules(contract: EngineeringFeatureContract): boolean {
  return domainExpectsRichProductModules(contract.productDomain);
}

export function isGenericOnlyModuleSet(moduleIds: readonly string[]): boolean {
  const productModules = moduleIds.filter((m) => !INFRASTRUCTURE_MODULES.has(m));
  return productModules.length > 0 && productModules.every((m) => isGenericFallbackModule(m));
}

export function missingContractModules(
  contract: EngineeringFeatureContract,
  presentModuleIds: readonly string[],
): string[] {
  const present = new Set(presentModuleIds);
  return contract.requiredModules.filter((moduleId) => !present.has(moduleId));
}

export function capabilitiesMissingFromModules(
  contract: EngineeringFeatureContract,
  presentModuleIds: readonly string[],
): RequiredCapability[] {
  const present = new Set(presentModuleIds);
  return contract.requiredCapabilities.filter((capability) =>
    capability.moduleIds.every((moduleId) => !present.has(moduleId)),
  );
}
