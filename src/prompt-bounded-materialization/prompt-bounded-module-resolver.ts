/**
 * Prompt-Bounded Materialization — central module resolver.
 */

import { createHash } from 'node:crypto';
import { dedupeModuleIds } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';
import {
  detectSimpleUtilityAppKind,
  isSimpleUtilityAppPrompt,
  simpleUtilityFeatureModules,
  simpleUtilityRoutes,
} from '../simple-utility-app/simple-utility-app-registry.js';
import { extractDescriptorMetadataFromPrompt } from './descriptor-classification-engine.js';
import { collectAllModuleCandidates } from './module-candidate-collector.js';
import {
  buildGenericModuleEvidence,
  isGenericFallbackModuleTerm,
  profileJustifiesGenericModules,
  projectManagementProfileAllowsModule,
  promptExplicitlyJustifiesGenericModule,
} from './module-origin-evidence.js';
import { promptExplicitlyRequiresAuth } from '../universal-build-pipeline-verification/build-profile-policy.js';
import { partitionProductAndInfrastructureModules } from '../contract-to-module-traceability/contract-to-module-infrastructure-registry.js';
import type {
  BlockedModuleRecord,
  FeatureModuleCandidate,
  FeatureModuleOrigin,
  PromptBoundedModulePlan,
  PromptBoundedModulePlanInput,
  ResolvedMetadataConstraint,
} from './prompt-bounded-materialization-types.js';
import {
  ALLOWED_FEATURE_MODULE_ORIGINS,
  BLOCKED_FEATURE_MODULE_ORIGINS,
} from './prompt-bounded-materialization-types.js';

let planCounter = 0;

export function resetPromptBoundedModuleResolverForTests(): void {
  planCounter = 0;
}

function nextPlanId(): string {
  planCounter += 1;
  return `prompt-bounded-module-plan-${planCounter}`;
}

function hashPrompt(rawPrompt: string): string {
  return createHash('sha256').update(rawPrompt.trim()).digest('hex').slice(0, 16);
}

const ORIGIN_PRIORITY: Record<FeatureModuleOrigin, number> = {
  PROMPT_REQUIRED: 100,
  CAPABILITY_REQUIRED: 90,
  PROMPT_DERIVED: 80,
  PIM_DERIVED: 70,
  SYSTEM_SHELL_REQUIRED: 60,
  PROFILE_FALLBACK: 20,
  TEMPLATE_DEFAULT: 10,
  DEMO_DEFAULT: 10,
  SAMPLE_APP_DEFAULT: 10,
  GENERIC_PLACEHOLDER: 5,
};

function isAllowedOrigin(origin: FeatureModuleOrigin): boolean {
  return (ALLOWED_FEATURE_MODULE_ORIGINS as readonly string[]).includes(origin);
}

function evaluateCandidate(input: {
  candidate: FeatureModuleCandidate;
  rawPrompt: string;
  materializationProfile: string;
  extraction: PromptBoundedModulePlanInput['extraction'];
  promptModuleIds: Set<string>;
}): { allowed: boolean; upgradedOrigin?: FeatureModuleOrigin; reason: string; evidence: readonly string[] } {
  const { candidate, rawPrompt, materializationProfile, extraction, promptModuleIds } = input;
  const moduleId = candidate.moduleId;

  if (moduleId === 'auth' && !promptExplicitlyRequiresAuth(rawPrompt)) {
    return {
      allowed: false,
      reason: 'Auth module blocked — prompt does not explicitly require login/accounts/sessions.',
      evidence: candidate.sourceEvidence,
    };
  }

  if (
    input.extraction.isCustomDomainPrompt &&
    isGenericFallbackModuleTerm(moduleId) &&
    !promptExplicitlyJustifiesGenericModule(input.rawPrompt, moduleId) &&
    !projectManagementProfileAllowsModule(input.materializationProfile, moduleId)
  ) {
    return {
      allowed: false,
      reason: `Custom-domain build blocked generic fallback module "${moduleId}".`,
      evidence: candidate.sourceEvidence,
    };
  }

  if (candidate.classification !== 'FEATURE_MODULE' && candidate.classification !== 'SERVICE_MODULE') {
    return {
      allowed: false,
      reason: `Phrase classified as ${candidate.classification}, not a feature folder.`,
      evidence: candidate.sourceEvidence,
    };
  }

  if (candidate.origin === 'SYSTEM_SHELL_REQUIRED') {
    if (candidate.moduleId === 'auth' && !promptExplicitlyRequiresAuth(input.rawPrompt)) {
      return {
        allowed: false,
        reason: 'Auth shell blocked — prompt does not explicitly require login/accounts/sessions.',
        evidence: candidate.sourceEvidence,
      };
    }
    return { allowed: true, reason: 'System shell module required.', evidence: candidate.sourceEvidence };
  }

  if (promptModuleIds.has(moduleId)) {
    return {
      allowed: true,
      upgradedOrigin: extraction.rawExtractedModules.includes(moduleId) ? 'PROMPT_REQUIRED' : 'PROMPT_DERIVED',
      reason: 'Module required by prompt extraction.',
      evidence: [`Prompt module list includes ${moduleId}`, ...candidate.sourceEvidence],
    };
  }

  if (isAllowedOrigin(candidate.origin)) {
    if (isGenericFallbackModuleTerm(moduleId)) {
      const evidence = buildGenericModuleEvidence(rawPrompt, moduleId);
      if (evidence.length > 0 || projectManagementProfileAllowsModule(materializationProfile, moduleId)) {
        return {
          allowed: true,
          upgradedOrigin: evidence.length ? 'PROMPT_DERIVED' : 'PIM_DERIVED',
          reason: 'Generic module justified by prompt or domain profile evidence.',
          evidence,
        };
      }
      return {
        allowed: false,
        reason: `Generic module "${moduleId}" lacks prompt evidence.`,
        evidence,
      };
    }
    return { allowed: true, reason: candidate.reasonIncluded, evidence: candidate.sourceEvidence };
  }

  if ((BLOCKED_FEATURE_MODULE_ORIGINS as readonly string[]).includes(candidate.origin)) {
    if (promptExplicitlyJustifiesGenericModule(rawPrompt, moduleId)) {
      return {
        allowed: true,
        upgradedOrigin: 'PROMPT_DERIVED',
        reason: 'Blocked origin upgraded — prompt explicitly requests this module.',
        evidence: buildGenericModuleEvidence(rawPrompt, moduleId),
      };
    }
    if (profileJustifiesGenericModules(materializationProfile) && projectManagementProfileAllowsModule(materializationProfile, moduleId)) {
      return {
        allowed: true,
        upgradedOrigin: 'PIM_DERIVED',
        reason: `Profile ${materializationProfile} justifies domain-generic modules.`,
        evidence: [`Profile evidence: ${materializationProfile}`],
      };
    }
    if (extraction.isCustomDomainPrompt && isGenericFallbackModuleTerm(moduleId)) {
      return {
        allowed: false,
        reason: `Custom-domain build blocked generic fallback module "${moduleId}".`,
        evidence: candidate.sourceEvidence,
      };
    }
    return {
      allowed: false,
      reason: `Origin ${candidate.origin} blocked without prompt/capability/system evidence.`,
      evidence: candidate.sourceEvidence,
    };
  }

  return { allowed: false, reason: 'Unknown origin policy.', evidence: candidate.sourceEvidence };
}

export function resolvePromptBoundedModulePlan(input: PromptBoundedModulePlanInput): PromptBoundedModulePlan {
  const candidates = collectAllModuleCandidates(input);
  const promptModuleIds = new Set(dedupeModuleIds(input.extraction.requiredModules));
  const byModuleId = new Map<string, FeatureModuleCandidate>();
  const blockedModules: BlockedModuleRecord[] = [];
  const contaminationReasons: string[] = [];

  for (const candidate of candidates) {
    const verdict = evaluateCandidate({
      candidate,
      rawPrompt: input.rawPrompt,
      materializationProfile: input.materializationProfile,
      extraction: input.extraction,
      promptModuleIds,
    });

    if (!verdict.allowed) {
      blockedModules.push({
        readOnly: true,
        moduleId: candidate.moduleId,
        origin: candidate.origin,
        reason: verdict.reason,
        sourceEvidence: verdict.evidence,
      });
      if (isGenericFallbackModuleTerm(candidate.moduleId) || candidate.origin === 'PROFILE_FALLBACK') {
        contaminationReasons.push(
          `Blocked unjustified module: ${candidate.moduleId}. Origin: ${candidate.origin}. No prompt/capability/system evidence found.`,
        );
      }
      continue;
    }

    const resolved: FeatureModuleCandidate = {
      ...candidate,
      origin: verdict.upgradedOrigin ?? candidate.origin,
      sourceEvidence: verdict.evidence.length ? verdict.evidence : candidate.sourceEvidence,
      reasonIncluded: verdict.reason,
    };

    const existing = byModuleId.get(candidate.moduleId);
    if (!existing || ORIGIN_PRIORITY[resolved.origin] > ORIGIN_PRIORITY[existing.origin]) {
      byModuleId.set(candidate.moduleId, resolved);
    }
  }

  let approvedModules = [...byModuleId.values()].sort(
    (a, b) => ORIGIN_PRIORITY[b.origin] - ORIGIN_PRIORITY[a.origin],
  );
  if (isSimpleUtilityAppPrompt(input.rawPrompt)) {
    const kind = detectSimpleUtilityAppKind(input.rawPrompt);
    const allowed = new Set(kind ? simpleUtilityFeatureModules(kind) : []);
    approvedModules = approvedModules.filter((module) => allowed.has(module.moduleId));
  }
  const approvedModuleIds = dedupeModuleIds(approvedModules.map((m) => m.moduleId));
  const simpleKind = isSimpleUtilityAppPrompt(input.rawPrompt)
    ? detectSimpleUtilityAppKind(input.rawPrompt)
    : null;
  const routes = simpleKind
    ? simpleUtilityRoutes(simpleKind)
    : approvedModuleIds.map((moduleId) => (moduleId === 'auth' ? '/' : `/${moduleId}`));

  const metadataConstraints: ResolvedMetadataConstraint[] = extractDescriptorMetadataFromPrompt(input.rawPrompt).map(
    (item) => ({
      readOnly: true,
      label: item.label,
      category: item.category,
      sourceEvidence: [item.sourceEvidence],
    }),
  );

  const contaminationDetected = blockedModules.some(
    (b) => isGenericFallbackModuleTerm(b.moduleId) || b.origin === 'PROFILE_FALLBACK',
  );

  return {
    readOnly: true,
    planId: nextPlanId(),
    rawPromptHash: hashPrompt(input.rawPrompt),
    approvedModules,
    approvedModuleIds,
    routes,
    blockedModules,
    metadataConstraints,
    contaminationDetected,
    contaminationReasons,
    passedPreGenerationGuard: approvedModuleIds.length > 0,
  };
}

export function buildDefinitionFromModulePlan(
  baseDefinition: PromptBoundedModulePlanInput['profileDefinition'],
  plan: PromptBoundedModulePlan,
): PromptBoundedModulePlanInput['profileDefinition'] {
  const partitioned = partitionProductAndInfrastructureModules(plan.approvedModuleIds);
  const productSet = new Set(partitioned.productFeatureModules);
  const routes = plan.approvedModuleIds
    .map((moduleId, index) => ({ moduleId, route: plan.routes[index] }))
    .filter((entry) => productSet.has(entry.moduleId))
    .map((entry) => entry.route ?? (entry.moduleId === 'auth' ? '/' : `/${entry.moduleId}`));
  return {
    ...baseDefinition,
    featureModules: partitioned.productFeatureModules,
    routes,
  };
}
