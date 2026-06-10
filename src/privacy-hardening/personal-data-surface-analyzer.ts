/**
 * Privacy Hardening — personal data surface analyzer.
 * Never prints raw personal data.
 */

import type { PersonalDataSurfaceAnalysis, PersonalDataSurfaceType, PrivacyHardeningInput } from './privacy-hardening-types.js';
import { redactPrivateData } from './privacy-hardening-types.js';
import { getCachedPersonalDataSurfaceAnalysis, setCachedPersonalDataSurfaceAnalysis } from './privacy-hardening-cache.js';

let surfaceAnalysisCount = 0;

const CONTENT_PATTERNS: Array<{ surface: PersonalDataSurfaceType; pattern: RegExp; warning: string }> = [
  { surface: 'user_prompts', pattern: /@[a-z0-9._%+-]+\.[a-z]{2,}/i, warning: 'email_in_prompt_surface' },
  { surface: 'user_prompts', pattern: /\+?\d[\d\s().-]{8,}\d/, warning: 'phone_in_prompt_surface' },
  { surface: 'future_account_profile', pattern: /passport[:\s]+[A-Z0-9]{6,}/i, warning: 'id_in_profile_surface' },
  { surface: 'future_billing_package', pattern: /package[=:]\s*['"]?pro_[a-z0-9]+/i, warning: 'billing_in_surface' },
];

export function analyzePersonalDataSurfaces(input: PrivacyHardeningInput): PersonalDataSurfaceAnalysis {
  const cacheKey = [
    input.userPromptSurfaceRisk,
    input.logSurfaceRisk,
    input.operatorFeedSurfaceRisk,
    (input.scanContent ?? []).length,
  ].join('|');

  const cached = getCachedPersonalDataSurfaceAnalysis(cacheKey);
  if (cached) return cached;

  surfaceAnalysisCount += 1;
  const personalDataSurfaces: PersonalDataSurfaceType[] = [];
  const surfaceWarnings: string[] = [];
  const missingSignals: string[] = [];
  let penalty = 0;

  const flags: Array<[boolean | undefined, PersonalDataSurfaceType, string]> = [
    [input.userPromptSurfaceRisk, 'user_prompts', 'user_prompt_surface_risk'],
    [input.uploadedFileSurfaceRisk, 'uploaded_files', 'uploaded_file_surface_risk'],
    [input.projectDescriptionSurfaceRisk, 'project_descriptions', 'project_description_surface_risk'],
    [input.projectSourceCodeSurfaceRisk, 'project_source_code', 'project_source_code_surface_risk'],
    [input.logSurfaceRisk, 'logs', 'log_surface_risk'],
    [input.reportSurfaceRisk, 'reports', 'report_surface_risk'],
    [input.notificationSurfaceRisk, 'notifications', 'notification_surface_risk'],
    [input.operatorFeedSurfaceRisk, 'operator_feed_entries', 'operator_feed_surface_risk'],
    [input.mobileCommandSurfaceRisk, 'mobile_command_messages', 'mobile_command_surface_risk'],
    [input.cloudMetadataSurfaceRisk, 'cloud_execution_metadata', 'cloud_metadata_surface_risk'],
    [input.futureAccountProfileSurfaceRisk, 'future_account_profile', 'future_account_profile_surface_risk'],
    [input.futureBillingPackageSurfaceRisk, 'future_billing_package', 'future_billing_package_surface_risk'],
    [input.futureOrganizationSurfaceRisk, 'future_organization_team', 'future_organization_surface_risk'],
  ];

  for (const [flag, surface, warning] of flags) {
    if (flag === true) {
      personalDataSurfaces.push(surface);
      surfaceWarnings.push(warning);
      penalty += 6;
    }
  }

  for (const content of input.scanContent ?? []) {
    for (const { surface, pattern, warning } of CONTENT_PATTERNS) {
      if (pattern.test(content)) {
        if (!personalDataSurfaces.includes(surface)) personalDataSurfaces.push(surface);
        surfaceWarnings.push(warning);
        redactPrivateData(content.match(pattern)?.[0] ?? 'detected');
        penalty += 8;
      }
    }
  }

  if (input.scanContent === undefined && input.userPromptSurfaceRisk === undefined) {
    missingSignals.push('personal_data_scan_signals');
  }

  const personalDataSurfaceScore = Math.max(0, Math.min(100, Math.round(92 - penalty - missingSignals.length * 3)));

  const result: PersonalDataSurfaceAnalysis = {
    personalDataSurfaceScore,
    personalDataSurfaces: [...new Set(personalDataSurfaces)],
    surfaceWarnings: [...new Set(surfaceWarnings)],
    missingSignals,
  };

  setCachedPersonalDataSurfaceAnalysis(cacheKey, result);
  return result;
}

export function getPersonalDataSurfaceAnalysisCount(): number {
  return surfaceAnalysisCount;
}

export function resetPersonalDataSurfaceAnalyzerForTests(): void {
  surfaceAnalysisCount = 0;
}
