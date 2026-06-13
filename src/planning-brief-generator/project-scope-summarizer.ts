/**
 * Project Scope Summarizer — project summary and platform targets (V1).
 */

import type {
  GeneratePlanningBriefInput,
  PlanningBriefEvidenceBundle,
  PlanningBriefProjectSummary,
  PlatformTarget,
} from './planning-brief-types.js';

const PLATFORM_SORT_ORDER: readonly PlatformTarget[] = [
  'WEB',
  'IOS',
  'ANDROID',
  'MOBILE',
  'IPAD',
  'ANDROID_TABLET',
  'TABLET',
  'DESKTOP',
];

function normalizeSpecificPlatform(value: string): PlatformTarget | null {
  const upper = value.toUpperCase().trim();
  if (upper === 'IOS' || upper.includes('IPHONE')) return 'IOS';
  if (upper.includes('ANDROID_TABLET') || upper.replace(/[^A-Z]/g, '') === 'ANDROIDTABLET') return 'ANDROID_TABLET';
  if (upper === 'ANDROID' || upper.includes('ANDROID')) return 'ANDROID';
  if (upper === 'IPAD') return 'IPAD';
  if (upper === 'WEB' || (/WEB|BROWSER|SAAS/.test(upper) && !/MOBILE|IOS|ANDROID/.test(upper))) return 'WEB';
  if (upper === 'DESKTOP' || /DESKTOP|WINDOWS|MAC|LINUX/.test(upper)) return 'DESKTOP';
  if (upper === 'MOBILE') return 'MOBILE';
  if (upper === 'TABLET') return 'TABLET';
  return null;
}

/** Preserve specific platform targets and add broad groupings — never collapse IOS+ANDROID to MOBILE only. */
export function propagatePlatformTargets(
  platforms: readonly string[],
  productType?: string | null,
): PlatformTarget[] {
  const specifics = new Set<PlatformTarget>();

  for (const platform of platforms) {
    const normalized = normalizeSpecificPlatform(platform);
    if (normalized) specifics.add(normalized);
  }

  const result = new Set<PlatformTarget>(specifics);

  if (specifics.has('IOS') || specifics.has('ANDROID') || specifics.has('MOBILE')) {
    result.add('MOBILE');
  }
  if (specifics.has('IPAD') || specifics.has('ANDROID_TABLET') || specifics.has('TABLET')) {
    result.add('TABLET');
  }

  if (result.size === 0 && productType && /MOBILE_APP/.test(productType)) {
    result.add('MOBILE');
  }
  if (result.size === 0 && productType && /WEB/.test(productType)) {
    result.add('WEB');
  }

  return PLATFORM_SORT_ORDER.filter((target) => result.has(target));
}

export function buildPlanningBriefEvidenceBundle(
  input: GeneratePlanningBriefInput,
): PlanningBriefEvidenceBundle | null {
  const intake = input.unifiedIntakeAnalysis;
  if (!intake) return null;

  const understanding = intake.projectUnderstanding;
  const intent = intake.projectIntent;

  const screens = new Set<string>(understanding.screens);
  const workflows = new Set<string>(understanding.workflows);
  const userRoles = new Set<string>(understanding.userRoles);
  const businessRules = new Set<string>(understanding.businessRules);
  const integrations = new Set<string>(understanding.integrations);
  const platforms = new Set<string>(understanding.platforms);

  for (const screen of input.voiceNotesAnalysis?.requirements.screens ?? []) screens.add(screen);
  for (const workflow of input.voiceNotesAnalysis?.requirements.workflows ?? []) workflows.add(workflow);
  for (const role of input.voiceNotesAnalysis?.requirements.userRoles ?? []) userRoles.add(role);
  for (const rule of input.voiceNotesAnalysis?.requirements.businessRules ?? []) businessRules.add(rule);
  for (const integration of input.voiceNotesAnalysis?.requirements.integrations ?? []) integrations.add(integration);

  for (const flow of input.visualReferenceAnalysis?.inferredFlows ?? []) {
    workflows.add(flow.flow.toLowerCase());
  }

  const completeness = input.requirementCompletenessAnalysis;
  if (completeness) {
    for (const screen of completeness.evidence.screens) screens.add(screen);
    for (const workflow of completeness.evidence.workflows) workflows.add(workflow);
    for (const role of completeness.evidence.userRoles) userRoles.add(role);
    for (const rule of completeness.evidence.businessRules) businessRules.add(rule);
    for (const integration of completeness.evidence.integrations) integrations.add(integration);
    for (const platform of completeness.evidence.platformTargets) platforms.add(platform);
  }

  const sources = [
    ...intake.evidence.activeSources,
    input.voiceNotesAnalysis ? 'VOICE_NOTES_INTELLIGENCE' : null,
    input.visualReferenceAnalysis ? 'VISUAL_REFERENCE_INTELLIGENCE' : null,
    completeness ? 'REQUIREMENT_COMPLETENESS_INTELLIGENCE' : null,
    input.founderContext ? 'FOUNDER_CONTEXT' : null,
    input.projectVaultContext?.facts.length ? 'PROJECT_VAULT_CONTEXT' : null,
  ].filter(Boolean) as string[];

  const founder = input.founderContext;
  const targetUsers = [
    ...new Set([
      ...intent.targetUsers,
      ...(founder?.targetUsers ?? []),
    ]),
  ];

  return {
    readOnly: true,
    sources: [...new Set(sources)],
    screens: [...screens],
    workflows: [...workflows],
    userRoles: [...userRoles],
    businessRules: [...businessRules],
    integrations: [...integrations],
    platforms: [...platforms],
    productType: understanding.productType,
    productName: input.projectVaultContext?.projectName ?? null,
    objective: founder?.businessObjective ?? intent.businessObjective ?? intent.primaryPurpose,
    targetUsers,
  };
}

export function summarizeProjectScope(
  bundle: PlanningBriefEvidenceBundle,
): PlanningBriefProjectSummary {
  return {
    readOnly: true,
    productName: bundle.productName,
    productType: bundle.productType,
    objective: bundle.objective,
    targetUsers: bundle.targetUsers,
  };
}

export function summarizePlatformTargets(bundle: PlanningBriefEvidenceBundle): PlatformTarget[] {
  return propagatePlatformTargets(bundle.platforms, bundle.productType);
}
