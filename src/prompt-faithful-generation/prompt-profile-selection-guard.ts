/**
 * Prompt-Faithful Generation V1 — profile selection guard.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProfileRankingResult } from '../build-profile-classification/profile-ranking-types.js';
import { isRealTaskTrackerPrompt } from '../project-context-switching/project-context-classifier-guard.js';
import { extractPromptFeatures } from './prompt-feature-extractor.js';
import {
  promptDescribesAssistiveCommunication,
  resolveAssistiveCommunicationProfile,
} from './assistive-communication-profile.js';
import {
  BANNED_FALLBACK_MODULES,
  KNOWN_FALLBACK_PROFILES,
  type PromptProfileGuardResult,
} from './prompt-faithful-generation-types.js';

const WEAK_GENERIC_TERMS = [
  'task',
  'project',
  'management',
  'report',
  'dashboard',
  'plan',
  'tasks',
  'projects',
];

const STRONG_CUSTOM_DOMAIN_TERMS = [
  'eye movement',
  'eye tracking',
  'blink',
  'blinks',
  'gaze',
  'locked-in syndrome',
  'locked in syndrome',
  'speech',
  'communication board',
  'caregiver',
  'calibration',
  'assistive communication',
  'text-to-speech',
  'text to speech',
  'accessibility',
  'lisa',
];

const NEGATION_PM_PATTERNS = [
  /\bno\s+(?:generic\s+)?project\s+management\b/i,
  /\bnot\s+(?:a\s+)?project\s+management\b/i,
  /\bwithout\s+project\s+management\b/i,
  /\bmust\s+not\s+(?:be|become)\s+project\s+management\b/i,
  /\bnever\s+(?:be|become)\s+project\s+management\b/i,
  /\bno\s+generic\s+.*fallback\b/i,
];

export function promptContainsNegatedProjectManagement(rawPrompt: string): boolean {
  return NEGATION_PM_PATTERNS.some((pattern) => pattern.test(rawPrompt));
}

export function countStrongCustomDomainTerms(rawPrompt: string): string[] {
  const lower = rawPrompt.toLowerCase();
  return STRONG_CUSTOM_DOMAIN_TERMS.filter((term) => lower.includes(term));
}

export function countWeakGenericTermsInRanking(ranking: ProfileRankingResult): string[] {
  const matched = ranking.matchedKeywords ?? [];
  return matched.filter((keyword) =>
    WEAK_GENERIC_TERMS.some(
      (weak) => keyword === weak || keyword.includes(weak) || weak.includes(keyword),
    ),
  );
}

function isStrongSupportedProfile(
  profile: GeneratedAppProfile,
  rawPrompt: string,
  ranking: ProfileRankingResult,
): boolean {
  if (profile === 'TASK_TRACKER_WEB_V1' && isRealTaskTrackerPrompt(rawPrompt)) return true;
  if (profile === 'EXPENSE_TRACKER_WEB_V1' || profile === 'FINANCE_TRACKER_WEB_V1') {
    if (/\bexpensetracker\b/i.test(rawPrompt) || /\bexpense tracker\b/i.test(rawPrompt)) return true;
    if (ranking.confidence === 'HIGH' && ranking.matchedKeywords.some((k) => /expense|finance/.test(k))) {
      return true;
    }
  }
  if (profile === 'CRM_WEB_V1' && /\bcrm\b/i.test(rawPrompt)) return true;
  if (profile === 'QR_APP' && /\b(smartqr|qr code|qrcode)\b/i.test(rawPrompt)) return true;
  if (profile === 'BOOKING_WEB_V1') {
    if (/\bcrop-calendar\b/i.test(rawPrompt) && !/\bbooking system\b/i.test(rawPrompt)) return false;
    if (/\bbooking system\b/i.test(rawPrompt) || /\bappointment\b/i.test(rawPrompt)) return true;
    return ranking.confidence === 'HIGH' && ranking.matchedKeywords.includes('booking system');
  }
  if (profile === 'HABIT_TRACKER_WEB_V1' && /\bhabit tracker\b/i.test(rawPrompt)) return true;
  if (profile === 'ASSISTIVE_COMMUNICATION_APP_V1' && promptDescribesAssistiveCommunication(rawPrompt)) {
    return true;
  }
  if (profile === 'PROJECT_MANAGEMENT_WEB_V1') {
    if (promptContainsNegatedProjectManagement(rawPrompt)) return false;
    if (/\bproject management system\b/i.test(rawPrompt) && ranking.confidence === 'HIGH') return true;
    if (/\bkanban\b/i.test(rawPrompt) && /\bproject management\b/i.test(rawPrompt)) return true;
    return false;
  }
  return ranking.confidence === 'HIGH';
}

export function shouldRejectKnownProfileForCustomPrompt(
  rawPrompt: string,
  ranking: ProfileRankingResult,
): { reject: boolean; reason: string | null } {
  const selected = ranking.selectedProfile;
  if (!selected) return { reject: false, reason: null };

  const extraction = extractPromptFeatures(rawPrompt);
  if (!extraction.isCustomDomainPrompt) return { reject: false, reason: null };

  if (
    extraction.explicitModulesProvided &&
    extraction.requiredModules.length >= 3 &&
    selected !== 'GENERIC_CUSTOM_APP_V1' &&
    selected !== 'ASSISTIVE_COMMUNICATION_APP_V1' &&
    !isStrongSupportedProfile(selected, rawPrompt, ranking)
  ) {
    const assistive = resolveAssistiveCommunicationProfile(rawPrompt);
    if (assistive) {
      return {
        reject: true,
        reason: `Explicit assistive communication modules require ${assistive} instead of ${selected}.`,
      };
    }
    return {
      reject: true,
      reason: `Explicit prompt modules (${extraction.requiredModules.join(', ')}) require GENERIC_CUSTOM_APP_V1 instead of ${selected}.`,
    };
  }

  if (!KNOWN_FALLBACK_PROFILES.includes(selected)) return { reject: false, reason: null };
  if (isStrongSupportedProfile(selected, rawPrompt, ranking)) return { reject: false, reason: null };

  const strongTerms = countStrongCustomDomainTerms(rawPrompt);
  const weakTerms = countWeakGenericTermsInRanking(ranking);

  if (promptContainsNegatedProjectManagement(rawPrompt) && selected === 'PROJECT_MANAGEMENT_WEB_V1') {
    return {
      reject: true,
      reason: `Negated project-management language detected while ${selected} was selected from weak keyword overlap.`,
    };
  }

  if (strongTerms.length >= 2 && weakTerms.length > 0 && ranking.confidence !== 'HIGH') {
    return {
      reject: true,
      reason: `Strong custom-domain terms (${strongTerms.join(', ')}) outweigh weak profile keywords (${weakTerms.join(', ')}).`,
    };
  }

  if (strongTerms.length >= 3 && KNOWN_FALLBACK_PROFILES.includes(selected)) {
    const assistive = resolveAssistiveCommunicationProfile(rawPrompt);
    if (assistive) {
      return {
        reject: true,
        reason: `Assistive communication domain evidence (${strongTerms.join(', ')}) requires ${assistive} instead of ${selected}.`,
      };
    }
    return {
      reject: true,
      reason: `Custom domain evidence (${strongTerms.join(', ')}) requires GENERIC_CUSTOM_APP_V1 instead of ${selected}.`,
    };
  }

  return { reject: false, reason: null };
}

export function applyPromptProfileSelectionGuard(
  rawPrompt: string,
  ranking: ProfileRankingResult,
): PromptProfileGuardResult {
  const assistiveProfile = resolveAssistiveCommunicationProfile(rawPrompt);
  if (assistiveProfile && (ranking.selectedProfile !== assistiveProfile || promptDescribesAssistiveCommunication(rawPrompt))) {
    return {
      readOnly: true,
      selectedProfile: assistiveProfile,
      originalProfile: ranking.selectedProfile,
      guardApplied: ranking.selectedProfile !== assistiveProfile,
      rejectedFallbackProfiles: ranking.selectedProfile && ranking.selectedProfile !== assistiveProfile
        ? [ranking.selectedProfile]
        : [],
      rejectionReason:
        ranking.selectedProfile !== assistiveProfile
          ? `Assistive communication domain detected — selected ${assistiveProfile} over ${ranking.selectedProfile ?? 'none'}.`
          : null,
    };
  }

  const rejection = shouldRejectKnownProfileForCustomPrompt(rawPrompt, ranking);
  if (!rejection.reject || !ranking.selectedProfile) {
    return {
      readOnly: true,
      selectedProfile: ranking.selectedProfile ?? 'GENERIC_CUSTOM_APP_V1',
      originalProfile: ranking.selectedProfile,
      guardApplied: false,
      rejectedFallbackProfiles: [],
      rejectionReason: null,
    };
  }

  const fallbackProfile = resolveAssistiveCommunicationProfile(rawPrompt) ?? 'GENERIC_CUSTOM_APP_V1';

  return {
    readOnly: true,
    selectedProfile: fallbackProfile,
    originalProfile: ranking.selectedProfile,
    guardApplied: true,
    rejectedFallbackProfiles: [ranking.selectedProfile],
    rejectionReason: rejection.reason,
  };
}
