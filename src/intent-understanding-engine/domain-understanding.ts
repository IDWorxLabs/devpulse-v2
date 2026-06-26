/**
 * Intent Understanding Engine — domain and product identity extraction.
 */

import { rankBuildProfiles } from '../build-profile-classification/profile-ranking-engine.js';
import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type {
  ProductIdentityUnderstanding,
  ProductType,
  UnderstandingEvidence,
} from './intent-understanding-types.js';

const PROFILE_TO_PRODUCT_TYPE: Record<string, ProductType> = {
  EXPENSE_TRACKER_WEB_V1: 'EXPENSE_TRACKER',
  FINANCE_TRACKER_WEB_V1: 'FINANCE_TRACKER',
  CRM_WEB_V1: 'CRM',
  TASK_TRACKER_WEB_V1: 'TASK_TRACKER',
  QR_APP: 'QR_APP',
  INVENTORY_WEB_V1: 'INVENTORY',
  BOOKING_WEB_V1: 'BOOKING',
  HABIT_TRACKER_WEB_V1: 'HABIT_TRACKER',
  PROJECT_MANAGEMENT_WEB_V1: 'PROJECT_MANAGEMENT',
  SCHOOL_MANAGEMENT_WEB_V1: 'SCHOOL_MANAGEMENT',
  GENERIC_CUSTOM_APP_V1: 'CUSTOM_APPLICATION',
};

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

function inferIndustry(domain: string, productType: ProductType): string {
  if (productType === 'ASSISTIVE_COMMUNICATION') return 'Healthcare / Assistive Technology';
  if (productType === 'HOSPITAL_SYSTEM') return 'Healthcare';
  if (productType === 'EXPENSE_TRACKER' || productType === 'FINANCE_TRACKER') return 'Finance';
  if (productType === 'CRM') return 'Sales / Customer Relationship';
  if (productType === 'SCHOOL_MANAGEMENT') return 'Education';
  if (productType === 'CAD_PLATFORM') return 'Engineering / Design';
  if (/health|medical|assistive/i.test(domain)) return 'Healthcare';
  if (/recipe|culinary|food/i.test(domain)) return 'Food & Beverage';
  if (/farm|agricultur/i.test(domain)) return 'Agriculture';
  return 'General Software';
}

function resolveProductType(rawPrompt: string, selectedProfile: string | null): ProductType {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) return 'ASSISTIVE_COMMUNICATION';
  if (/hospital|clinic|patient management/i.test(rawPrompt)) return 'HOSPITAL_SYSTEM';
  if (/cad|3d model|design platform/i.test(rawPrompt)) return 'CAD_PLATFORM';
  if (/medical device|companion app/i.test(rawPrompt)) return 'MEDICAL_DEVICE_COMPANION';
  if (selectedProfile && PROFILE_TO_PRODUCT_TYPE[selectedProfile]) {
    return PROFILE_TO_PRODUCT_TYPE[selectedProfile];
  }
  const extraction = extractPromptFeatures(rawPrompt);
  if (extraction.isCustomDomainPrompt) return 'CUSTOM_APPLICATION';
  return 'UNKNOWN';
}

function extractSecondaryObjectives(rawPrompt: string): string[] {
  const objectives: string[] = [];
  if (/caregiver/i.test(rawPrompt)) objectives.push('Support caregiver oversight and monitoring');
  if (/history|audit/i.test(rawPrompt)) objectives.push('Maintain communication and activity history');
  if (/accessibility|wcag/i.test(rawPrompt)) objectives.push('Meet accessibility standards');
  if (/offline/i.test(rawPrompt)) objectives.push('Operate without network connectivity');
  if (/export|report/i.test(rawPrompt)) objectives.push('Enable data export and reporting');
  return objectives;
}

export function extractDomainUnderstanding(rawPrompt: string): ProductIdentityUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const ranking = rankBuildProfiles(rawPrompt);
  const selectedProfile = ranking.selectedProfile ?? null;
  const productType = resolveProductType(rawPrompt, selectedProfile);
  const industry = inferIndustry(extraction.domain, productType);
  const secondaryObjectives = extractSecondaryObjectives(rawPrompt);

  const evidenceItems: UnderstandingEvidence[] = [
    evidence('prompt_extraction', `App name: ${extraction.appName}`, 1),
    evidence('prompt_extraction', `Domain: ${extraction.domain}`, 1),
    evidence('prompt_extraction', `Core purpose: ${extraction.corePurpose}`, 1),
  ];
  if (selectedProfile) {
    evidenceItems.push(evidence('profile_classifier', `Profile candidate: ${selectedProfile}`, 0.8));
  }

  return {
    readOnly: true,
    productName: extraction.appName,
    productType,
    industry,
    purpose: extraction.corePurpose,
    primaryObjective: extraction.corePurpose,
    secondaryObjectives,
    coreValueProposition: `${extraction.appName} — ${extraction.corePurpose}`,
    evidence: evidenceItems,
  };
}
