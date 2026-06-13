/**
 * Intake Evidence Consolidator — merges all intake sources (V1).
 */

import type {
  AssessUnifiedIntakeInput,
  ConsolidatedIntakeEvidence,
  IntakeSourceId,
  UploadIntakeSnapshot,
} from './unified-intake-types.js';

function dedupe(items: readonly string[]): string[] {
  return [...new Set(items.map((i) => i.trim()).filter(Boolean))];
}

function merge(...lists: (readonly string[] | undefined | null)[]): string[] {
  return dedupe(lists.flatMap((l) => l ?? []));
}

function extractFromPrompt(prompt: string): Partial<ConsolidatedIntakeEvidence> {
  const text = prompt.trim();
  if (!text) return {};

  const extract = (regex: RegExp) => [...text.matchAll(regex)].map((m) => (m[1] ?? m[0]).trim());

  return {
    platforms: dedupe(extract(/\b(ios|android|web|desktop|mobile app|cross[- ]platform)\b/gi)),
    screens: dedupe(extract(/\b(login|dashboard|settings|onboarding|checkout|profile|home|admin)\s*(screen|page)?\b/gi)),
    workflows: dedupe(extract(/\b(sign[- ]?up|onboarding|checkout|approval|billing|authentication|messaging)\b/gi)),
    userRoles: dedupe(extract(/\b(admin|customer|user|manager|vendor|seller|buyer|founder)\b/gi)),
    integrations: dedupe(extract(/\b(stripe|paypal|google|openai|slack|firebase|twilio|shopify)\b/gi)),
    authentication: dedupe(extract(/\b(oauth|sso|password|login|signup|social auth)\b/gi)),
    dataEntities: dedupe(extract(/\b(user|order|product|invoice|subscription|payment|message)s?\b/gi)),
    notifications: dedupe(extract(/\b(email|push notification|sms|in-app notification)\b/gi)),
    businessRules: dedupe(extract(/\b(must|should not|only if|required to)\b[^.!?]{0,80}/gi)),
  };
}

function buildUploadSummary(
  records: AssessUnifiedIntakeInput['uploadRecords'],
): UploadIntakeSnapshot | null {
  if (!records || records.length === 0) return null;
  const accepted = records.filter((r) => r.verdict === 'UPLOAD_ACCEPTED');
  return {
    readOnly: true,
    acceptedUploads: accepted.length,
    imageUploads: accepted.filter((r) => r.fileCategory === 'IMAGE').length,
    documentUploads: accepted.filter((r) => r.fileCategory === 'DOCUMENT').length,
    videoUploads: accepted.filter((r) => r.fileCategory === 'VIDEO').length,
    recentFilenames: accepted.slice(0, 8).map((r) => r.filename),
  };
}

export function consolidateIntakeEvidence(input: AssessUnifiedIntakeInput): ConsolidatedIntakeEvidence | null {
  const activeSources: IntakeSourceId[] = [];
  const typed = input.typedPrompt;
  const promptExtract = typed?.rawPrompt ? extractFromPrompt(typed.rawPrompt) : {};

  if (typed?.rawPrompt) activeSources.push('TYPED_PROMPT');

  const voice = input.voiceNotesAnalysis;
  if (voice) activeSources.push('VOICE_NOTES_INTELLIGENCE');

  const visual = input.visualReferenceAnalysis;
  if (visual) activeSources.push('VISUAL_REFERENCE_INTELLIGENCE');

  const completeness = input.requirementCompletenessAnalysis;
  if (completeness) activeSources.push('REQUIREMENT_COMPLETENESS_INTELLIGENCE');

  const uploadSummary = buildUploadSummary(input.uploadRecords);
  if (uploadSummary && uploadSummary.acceptedUploads > 0) activeSources.push('UPLOAD_SYSTEM');

  const vault = input.projectVaultContext;
  if (vault && vault.facts.length > 0) activeSources.push('PROJECT_VAULT_CONTEXT');

  const founder = input.founderContext;
  if (founder && (founder.founderGoal || founder.businessObjective || founder.targetUsers.length > 0)) {
    activeSources.push('FOUNDER_CONTEXT');
  }

  const pluggable = input.pluggableSources ?? [];
  if (pluggable.length > 0) activeSources.push('CUSTOM_SOURCE');

  const vaultPlatforms =
    vault?.facts.filter((f) => /platform|ios|android|web|mobile/i.test(`${f.label} ${f.value}`)).map((f) => f.value) ?? [];
  const vaultWorkflows =
    vault?.facts.filter((f) => /workflow|flow|process/i.test(`${f.label} ${f.value}`)).map((f) => f.value) ?? [];
  const vaultIntegrations =
    vault?.facts.filter((f) => /integration|stripe|api|payment/i.test(`${f.label} ${f.value}`)).map((f) => f.value) ?? [];

  const platforms = merge(
    typed?.platformTargets,
    promptExtract.platforms,
    voice?.projectUnderstanding.platformTargets.filter((p) => p !== 'UNKNOWN'),
    visual ? [visual.screenDetection.platform] : [],
    completeness?.evidence.platformTargets,
    vaultPlatforms,
    ...pluggable.map((s) => s.platformTargets),
  );

  const screens = merge(
    typed?.screens,
    promptExtract.screens,
    voice?.requirements.screens,
    visual?.inferredFlows.map((f) => f.flow),
    completeness?.evidence.screens,
    ...pluggable.map((s) => s.screens),
  );

  const workflows = merge(
    typed?.workflows,
    promptExtract.workflows,
    voice?.requirements.workflows,
    voice?.projectUnderstanding.keyWorkflows,
    visual?.inferredFlows.map((f) => f.flow),
    completeness?.evidence.workflows,
    vaultWorkflows,
    ...pluggable.map((s) => s.workflows),
  );

  const userRoles = merge(
    typed?.userRoles,
    promptExtract.userRoles,
    voice?.requirements.userRoles,
    founder?.targetUsers,
    completeness?.evidence.userRoles,
    ...pluggable.map((s) => s.userRoles),
  );

  const integrations = merge(
    typed?.integrations,
    promptExtract.integrations,
    voice?.requirements.integrations,
    completeness?.evidence.integrations,
    vaultIntegrations,
    ...pluggable.map((s) => s.integrations),
  );

  const dataEntities = merge(
    typed?.dataEntities,
    promptExtract.dataEntities,
    voice?.requirements.dataEntities,
    completeness?.evidence.dataEntities,
    ...pluggable.map((s) => s.dataEntities),
  );

  const evidence: ConsolidatedIntakeEvidence = {
    readOnly: true,
    activeSources: dedupe(activeSources) as IntakeSourceId[],
    typedPromptExcerpt: typed?.rawPrompt?.slice(0, 240) ?? null,
    platforms,
    screens,
    workflows,
    userRoles,
    integrations,
    notifications: merge(typed?.notifications, promptExtract.notifications, voice?.requirements.notifications, completeness?.evidence.notifications),
    authentication: merge(typed?.authentication, promptExtract.authentication, voice?.requirements.authentication, completeness?.evidence.authentication),
    dataEntities,
    businessRules: merge(typed?.businessRules, promptExtract.businessRules, voice?.requirements.businessRules, completeness?.evidence.businessRules, ...pluggable.map((s) => s.businessRules)),
    visualComponents: merge(visual?.detectedComponents.map((c) => c.token), completeness?.evidence.visualComponents),
    inferredFlows: merge(visual?.inferredFlows.map((f) => f.flow), completeness?.evidence.inferredFlows),
    uploadSummary,
    founderContext: founder ?? null,
    sourceCount: activeSources.length,
    evidenceItemCount:
      platforms.length +
      screens.length +
      workflows.length +
      userRoles.length +
      integrations.length +
      dataEntities.length,
  };

  if (evidence.activeSources.length === 0) return null;
  if (
    evidence.platforms.length +
      evidence.screens.length +
      evidence.workflows.length +
      evidence.userRoles.length +
      evidence.integrations.length +
      evidence.dataEntities.length ===
    0
  ) {
    return null;
  }

  return evidence;
}

export function hasMinimumIntakeEvidence(evidence: ConsolidatedIntakeEvidence): boolean {
  return evidence.activeSources.length >= 1 && evidence.evidenceItemCount >= 1;
}
