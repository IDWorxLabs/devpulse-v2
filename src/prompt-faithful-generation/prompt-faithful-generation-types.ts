/**
 * Prompt-Faithful Generation V1 — shared types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';

export type PromptFaithfulnessStatus = 'PASS' | 'FAIL' | 'WARN' | 'PENDING';

export const BANNED_FALLBACK_MODULES = [
  'projects',
  'tasks',
  'team',
  'timeline',
  'deals',
  'leads',
  'expenses',
  'inventory',
] as const;

export type BannedFallbackModule = (typeof BANNED_FALLBACK_MODULES)[number];

export const KNOWN_FALLBACK_PROFILES: GeneratedAppProfile[] = [
  'PROJECT_MANAGEMENT_WEB_V1',
  'TASK_TRACKER_WEB_V1',
  'CRM_WEB_V1',
  'EXPENSE_TRACKER_WEB_V1',
  'FINANCE_TRACKER_WEB_V1',
  'INVENTORY_WEB_V1',
];

export interface PromptFeatureExtraction {
  readOnly: true;
  appName: string;
  domain: string;
  targetUsers: string[];
  primaryPlatform: string;
  corePurpose: string;
  requiredModules: string[];
  requiredInteractions: string[];
  safetyNotes: string[];
  previewRequirements: string[];
  androidPhonePreviewRequired: boolean;
  isCustomDomainPrompt: boolean;
  explicitModulesProvided: boolean;
}

export interface PromptProfileGuardResult {
  readOnly: true;
  selectedProfile: MaterializationProfile;
  originalProfile: GeneratedAppProfile | null;
  guardApplied: boolean;
  rejectedFallbackProfiles: string[];
  rejectionReason: string | null;
}

export interface PromptFaithfulnessVerdict {
  readOnly: true;
  status: PromptFaithfulnessStatus;
  score: number;
  promptDerivedAppName: string;
  promptDerivedDomain: string;
  promptDerivedModules: string[];
  promptDerivedInteractions: string[];
  rejectedFallbackProfiles: string[];
  bannedFallbackModulesDetected: string[];
  promptFaithfulnessFailureReasons: string[];
  androidPhonePreviewRequired: boolean;
  androidPhonePreviewStatus: 'PASS' | 'FAIL' | 'PENDING';
  generatedModules: string[];
  selectedProfile: string;
}

export interface PromptFaithfulnessManifestFields {
  promptFaithfulnessStatus: PromptFaithfulnessStatus;
  promptFaithfulnessScore: number;
  promptDerivedAppName: string;
  promptDerivedDomain: string;
  promptDerivedModules: string[];
  promptDerivedInteractions: string[];
  rejectedFallbackProfiles: string[];
  bannedFallbackModulesDetected: string[];
  promptFaithfulnessFailureReasons: string[];
  androidPhonePreviewRequired: boolean;
  androidPhonePreviewStatus: 'PASS' | 'FAIL' | 'PENDING';
}
