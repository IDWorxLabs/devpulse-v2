/**
 * Requirement evidence consolidator — merges typed, voice, visual, and vault inputs (V1).
 */

import type {
  AssessRequirementCompletenessInput,
  ConsolidatedRequirementEvidence,
  ProjectVaultContextSnapshot,
  TypedRequirementsInput,
} from './requirement-completeness-types.js';

function dedupe(items: readonly string[]): string[] {
  return [...new Set(items.map((i) => i.trim()).filter(Boolean))];
}

function extractFromPrompt(prompt: string): Partial<ConsolidatedRequirementEvidence> {
  const text = prompt.trim();
  if (!text) return {};

  const screens: string[] = [];
  const workflows: string[] = [];
  const integrations: string[] = [];
  const auth: string[] = [];
  const roles: string[] = [];
  const entities: string[] = [];
  const notifications: string[] = [];
  const platforms: string[] = [];
  const rules: string[] = [];

  const patterns: Array<{ bucket: string[]; regex: RegExp }> = [
    { bucket: screens, regex: /\b(login|dashboard|settings|onboarding|checkout|profile|home|admin)\s*(screen|page)?\b/gi },
    { bucket: workflows, regex: /\b(sign[- ]?up|onboarding|checkout|approval|billing|authentication)\b/gi },
    { bucket: integrations, regex: /\b(stripe|paypal|google|openai|slack|firebase|twilio)\b/gi },
    { bucket: auth, regex: /\b(oauth|sso|password|login|signup|sign[- ]?up|social auth)\b/gi },
    { bucket: roles, regex: /\b(admin|customer|user|manager|vendor)\b/gi },
    { bucket: entities, regex: /\b(user|order|product|invoice|subscription|payment)s?\b/gi },
    { bucket: notifications, regex: /\b(email|push notification|sms|in-app notification)\b/gi },
    { bucket: platforms, regex: /\b(ios|android|web|desktop|mobile app)\b/gi },
    { bucket: rules, regex: /\b(must|should not|only if|required to)\b[^.!?]{0,80}/gi },
  ];

  for (const { bucket, regex } of patterns) {
    for (const match of text.matchAll(regex)) {
      bucket.push((match[1] ?? match[0]).trim());
    }
  }

  return {
    screens: dedupe(screens),
    workflows: dedupe(workflows),
    integrations: dedupe(integrations),
    authentication: dedupe(auth),
    userRoles: dedupe(roles),
    dataEntities: dedupe(entities),
    notifications: dedupe(notifications),
    platformTargets: dedupe(platforms),
    businessRules: dedupe(rules),
  };
}

function mergeLists(...lists: (readonly string[] | undefined)[]): string[] {
  return dedupe(lists.flatMap((l) => l ?? []));
}

export function consolidateRequirementEvidence(input: {
  typedRequirements?: TypedRequirementsInput | null;
  voiceNotesAnalysis?: AssessRequirementCompletenessInput['voiceNotesAnalysis'];
  visualReferenceAnalysis?: AssessRequirementCompletenessInput['visualReferenceAnalysis'];
  projectVaultContext?: ProjectVaultContextSnapshot | null;
  fixture?: Partial<ConsolidatedRequirementEvidence> | null;
}): ConsolidatedRequirementEvidence {
  const sources: string[] = [];
  const typed = input.typedRequirements;
  const promptExtract = typed?.rawPrompt ? extractFromPrompt(typed.rawPrompt) : {};

  if (typed?.rawPrompt) sources.push('TYPED_PROMPT');
  if (typed?.screens?.length) sources.push('TYPED_SCREENS');
  if (typed?.workflows?.length) sources.push('TYPED_WORKFLOWS');

  const voice = input.voiceNotesAnalysis;
  if (voice) {
    sources.push('VOICE_NOTES_INTELLIGENCE');
  }

  const visual = input.visualReferenceAnalysis;
  if (visual) {
    sources.push('VISUAL_REFERENCE_INTELLIGENCE');
  }

  const vault = input.projectVaultContext;
  if (vault && vault.facts.length > 0) {
    sources.push('PROJECT_VAULT_CONTEXT');
  }

  if (input.fixture) sources.push('REQUIREMENT_EVIDENCE_FIXTURE');

  const vaultScreens = vault?.facts.filter((f) => /screen|page|ui/i.test(f.label + f.value)).map((f) => f.value) ?? [];
  const vaultWorkflows = vault?.facts.filter((f) => /workflow|flow|process/i.test(f.label + f.value)).map((f) => f.value) ?? [];
  const vaultIntegrations = vault?.facts.filter((f) => /integration|stripe|api/i.test(f.label + f.value)).map((f) => f.value) ?? [];
  const vaultPlatforms = vault?.facts.filter((f) => /platform|ios|android|web/i.test(f.label + f.value)).map((f) => f.value) ?? [];

  const evidence: ConsolidatedRequirementEvidence = {
    readOnly: true,
    sources: dedupe(sources),
    screens: mergeLists(
      typed?.screens ?? [],
      promptExtract.screens,
      voice?.requirements.screens,
      visual ? visual.inferredFlows.map((f) => f.flow) : [],
      vaultScreens,
      input.fixture?.screens,
    ),
    userRoles: mergeLists(
      typed?.userRoles ?? [],
      promptExtract.userRoles,
      voice?.requirements.userRoles,
      input.fixture?.userRoles,
    ),
    workflows: mergeLists(
      typed?.workflows ?? [],
      promptExtract.workflows,
      voice?.requirements.workflows,
      voice?.projectUnderstanding.keyWorkflows,
      visual?.inferredFlows.map((f) => f.flow),
      vaultWorkflows,
      input.fixture?.workflows,
    ),
    businessRules: mergeLists(
      typed?.businessRules ?? [],
      promptExtract.businessRules,
      voice?.requirements.businessRules,
      input.fixture?.businessRules,
    ),
    integrations: mergeLists(
      typed?.integrations ?? [],
      promptExtract.integrations,
      voice?.requirements.integrations,
      vaultIntegrations,
      input.fixture?.integrations,
    ),
    notifications: mergeLists(
      typed?.notifications ?? [],
      promptExtract.notifications,
      voice?.requirements.notifications,
      input.fixture?.notifications,
    ),
    authentication: mergeLists(
      typed?.authentication ?? [],
      promptExtract.authentication,
      voice?.requirements.authentication,
      visual?.inferredFlows.filter((f) => f.flow === 'AUTHENTICATION').map((f) => f.flow),
      input.fixture?.authentication,
    ),
    dataEntities: mergeLists(
      typed?.dataEntities ?? [],
      promptExtract.dataEntities,
      voice?.requirements.dataEntities,
      input.fixture?.dataEntities,
    ),
    platformTargets: mergeLists(
      typed?.platformTargets ?? [],
      promptExtract.platformTargets,
      voice?.projectUnderstanding.platformTargets.filter((p) => p !== 'UNKNOWN'),
      visual ? [visual.screenDetection.platform] : [],
      vaultPlatforms,
      input.fixture?.platformTargets,
    ),
    inferredFlows: mergeLists(
      visual?.inferredFlows.map((f) => f.flow) ?? [],
      voice?.requirements.workflows,
      input.fixture?.inferredFlows,
    ),
    visualComponents: mergeLists(
      visual?.detectedComponents.map((c) => c.token) ?? [],
      input.fixture?.visualComponents,
    ),
    productType: voice?.projectUnderstanding.productType ?? input.fixture?.productType ?? null,
  };

  return evidence;
}

export function hasMinimumEvidence(evidence: ConsolidatedRequirementEvidence): boolean {
  return (
    evidence.sources.length > 0 &&
    (evidence.screens.length +
      evidence.workflows.length +
      evidence.userRoles.length +
      evidence.dataEntities.length +
      evidence.integrations.length) >=
      1
  );
}
