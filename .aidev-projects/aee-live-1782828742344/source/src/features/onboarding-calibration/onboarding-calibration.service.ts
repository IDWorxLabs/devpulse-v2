/** Service adapter for onboarding-calibration — LISA — Locked In Syndrome App */
import type { OnboardingCalibrationRecord } from './onboarding-calibration.types';

const DEMO_ONBOARDING_CALIBRATION_RECORDS: OnboardingCalibrationRecord[] = [
  { id: 'onboarding-calibration-1', label: 'Sample Onboarding Calibration record', createdAt: new Date().toISOString() },
  { id: 'onboarding-calibration-2', label: 'Onboarding Calibration preview entry', createdAt: new Date().toISOString() },
];

export function listOnboardingCalibrationRecords(): OnboardingCalibrationRecord[] {
  return DEMO_ONBOARDING_CALIBRATION_RECORDS;
}
