/**
 * Project Intent Analyzer — application type and purpose detection (V1).
 */

import type {
  ApplicationType,
  ConsolidatedIntakeEvidence,
  ProjectIntentAnalysis,
} from './unified-intake-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function joinEvidence(evidence: ConsolidatedIntakeEvidence): string {
  return [
    evidence.typedPromptExcerpt ?? '',
    ...evidence.platforms,
    ...evidence.workflows,
    ...evidence.integrations,
    ...evidence.screens,
    evidence.founderContext?.founderGoal ?? '',
    evidence.founderContext?.businessObjective ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

function detectApplicationType(text: string, evidence: ConsolidatedIntakeEvidence): ApplicationType {
  if (/\bmarketplace\b|\bvendor\b|\bseller\b|\bbuyer\b/.test(text)) return 'MARKETPLACE';
  if (/\be-?commerce\b|\bcheckout\b|\bshop\b|\bstore\b|\bstripe\b|\bpaypal\b/.test(text)) return 'E_COMMERCE_PLATFORM';
  if (/\bsocial\b|\bmessaging\b|\bfeed\b|\bnetwork\b/.test(text)) return 'SOCIAL_NETWORK';
  if (/\binternal tool\b|\badmin panel\b|\boperator\b/.test(text)) return 'INTERNAL_TOOL';
  if (/\bai product\b|\bopenai\b|\bllm\b|\bchatbot\b|\bagent\b/.test(text)) return 'AI_PRODUCT';
  if (/\bsaas\b|\bsubscription\b|\bbilling\b/.test(text)) return 'SAAS_PLATFORM';
  if (/\bmobile app\b|\bios\b|\bandroid\b/.test(text) || evidence.platforms.some((p) => /IOS|ANDROID|MOBILE/i.test(p))) {
    return 'MOBILE_APP';
  }
  if (/\bweb app\b|\bdashboard\b|\bweb\b/.test(text)) return 'WEB_APP';
  return 'UNKNOWN';
}

function normalizePlatforms(platforms: readonly string[]): string[] {
  const normalized = new Set<string>();
  for (const p of platforms) {
    const upper = p.toUpperCase();
    if (/IOS|IPHONE/.test(upper)) normalized.add('IOS');
    else if (/ANDROID/.test(upper)) normalized.add('ANDROID');
    else if (/WEB|BROWSER/.test(upper)) normalized.add('WEB');
    else if (/DESKTOP/.test(upper)) normalized.add('DESKTOP');
    else if (/MOBILE|CROSS/.test(upper)) normalized.add('MOBILE');
    else normalized.add(p);
  }
  return [...normalized];
}

export function analyzeProjectIntent(evidence: ConsolidatedIntakeEvidence): ProjectIntentAnalysis {
  const corpus = joinEvidence(evidence);
  const applicationType = detectApplicationType(corpus, evidence);
  const platformTargets = normalizePlatforms(evidence.platforms);

  let primaryPurpose = 'Deliver a software product for target users';
  if (applicationType === 'E_COMMERCE_PLATFORM') primaryPurpose = 'Enable users to browse, purchase, and manage orders';
  else if (applicationType === 'SAAS_PLATFORM') primaryPurpose = 'Provide subscription software value to customers';
  else if (applicationType === 'INTERNAL_TOOL') primaryPurpose = 'Support internal team operations and workflows';
  else if (applicationType === 'MOBILE_APP') primaryPurpose = 'Deliver a mobile-first user experience';
  else if (applicationType === 'AI_PRODUCT') primaryPurpose = 'Provide AI-assisted product capabilities';
  else if (evidence.workflows.length > 0) primaryPurpose = `Support workflows: ${evidence.workflows.slice(0, 3).join(', ')}`;

  const targetUsers =
    evidence.userRoles.length > 0
      ? evidence.userRoles
      : evidence.founderContext?.targetUsers.length
        ? evidence.founderContext.targetUsers
        : ['general users'];

  const businessObjective =
    evidence.founderContext?.businessObjective ??
    evidence.founderContext?.founderGoal ??
    (applicationType !== 'UNKNOWN'
      ? `Launch a ${applicationType.replace(/_/g, ' ').toLowerCase()}`
      : 'Define and validate product value for target users');

  let confidence = 40;
  confidence += Math.min(20, evidence.activeSources.length * 6);
  confidence += applicationType !== 'UNKNOWN' ? 12 : 0;
  confidence += platformTargets.length > 0 ? 8 : 0;
  confidence += evidence.workflows.length >= 2 ? 8 : 0;
  confidence += evidence.userRoles.length >= 1 ? 5 : 0;

  return {
    readOnly: true,
    applicationType,
    platformTargets,
    primaryPurpose,
    targetUsers,
    businessObjective,
    confidence: clamp(confidence),
    evidence: evidence.activeSources.map((s) => `SOURCE_${s}`),
  };
}
