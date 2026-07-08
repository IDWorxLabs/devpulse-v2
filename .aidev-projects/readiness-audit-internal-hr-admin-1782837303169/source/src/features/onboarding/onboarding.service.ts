/** Service adapter for onboarding — CRM */
import type { OnboardingRecord } from './onboarding.types';

const DEMO_ONBOARDING_RECORDS: OnboardingRecord[] = [
  { id: 'onboarding-1', label: 'Sample Onboarding record', createdAt: new Date().toISOString() },
  { id: 'onboarding-2', label: 'Onboarding preview entry', createdAt: new Date().toISOString() },
];

export function listOnboardingRecords(): OnboardingRecord[] {
  return DEMO_ONBOARDING_RECORDS;
}
