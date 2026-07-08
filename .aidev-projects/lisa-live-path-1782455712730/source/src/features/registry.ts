/** Feature module registry — Modular Feature Materialization V1 */
import AuthFeature from './auth';
import OnboardingCalibrationFeature from './onboarding-calibration';
import EyeTrackingBoardFeature from './eye-tracking-board';
import BlinkInputEngineFeature from './blink-input-engine';
import GazeKeyboardFeature from './gaze-keyboard';
import TextToSpeechFeature from './text-to-speech';
import QuickPhrasesFeature from './quick-phrases';
import CaregiverDashboardFeature from './caregiver-dashboard';
import CommunicationHistoryFeature from './communication-history';
import AccessibilitySettingsFeature from './accessibility-settings';
import EmergencySpeechFeature from './emergency-speech';
import LockedInFeature from './locked-in';

export const FEATURE_REGISTRY = [
  {
    id: 'auth',
    name: 'Auth',
    route: '/',
    component: AuthFeature,
    sourcePath: 'src/features/auth/AuthFeature.tsx',
    contractId: 'feature-auth',
    promptTerms: ["auth"],
    status: 'generated' as const,
  },
  {
    id: 'onboarding-calibration',
    name: 'Onboarding Calibration',
    route: '/onboarding-calibration',
    component: OnboardingCalibrationFeature,
    sourcePath: 'src/features/onboarding-calibration/OnboardingCalibrationFeature.tsx',
    contractId: 'feature-onboarding-calibration',
    promptTerms: ["onboarding calibration"],
    status: 'generated' as const,
  },
  {
    id: 'eye-tracking-board',
    name: 'Eye Tracking Board',
    route: '/eye-tracking-board',
    component: EyeTrackingBoardFeature,
    sourcePath: 'src/features/eye-tracking-board/EyeTrackingBoardFeature.tsx',
    contractId: 'feature-eye-tracking-board',
    promptTerms: ["eye tracking board"],
    status: 'generated' as const,
  },
  {
    id: 'blink-input-engine',
    name: 'Blink Input Engine',
    route: '/blink-input-engine',
    component: BlinkInputEngineFeature,
    sourcePath: 'src/features/blink-input-engine/BlinkInputEngineFeature.tsx',
    contractId: 'feature-blink-input-engine',
    promptTerms: ["blink input engine","blink"],
    status: 'generated' as const,
  },
  {
    id: 'gaze-keyboard',
    name: 'Gaze Keyboard',
    route: '/gaze-keyboard',
    component: GazeKeyboardFeature,
    sourcePath: 'src/features/gaze-keyboard/GazeKeyboardFeature.tsx',
    contractId: 'feature-gaze-keyboard',
    promptTerms: ["gaze keyboard"],
    status: 'generated' as const,
  },
  {
    id: 'text-to-speech',
    name: 'Text To Speech',
    route: '/text-to-speech',
    component: TextToSpeechFeature,
    sourcePath: 'src/features/text-to-speech/TextToSpeechFeature.tsx',
    contractId: 'feature-text-to-speech',
    promptTerms: ["text to speech"],
    status: 'generated' as const,
  },
  {
    id: 'quick-phrases',
    name: 'Quick Phrases',
    route: '/quick-phrases',
    component: QuickPhrasesFeature,
    sourcePath: 'src/features/quick-phrases/QuickPhrasesFeature.tsx',
    contractId: 'feature-quick-phrases',
    promptTerms: ["quick phrases"],
    status: 'generated' as const,
  },
  {
    id: 'caregiver-dashboard',
    name: 'Caregiver Dashboard',
    route: '/caregiver-dashboard',
    component: CaregiverDashboardFeature,
    sourcePath: 'src/features/caregiver-dashboard/CaregiverDashboardFeature.tsx',
    contractId: 'feature-caregiver-dashboard',
    promptTerms: ["caregiver dashboard"],
    status: 'generated' as const,
  },
  {
    id: 'communication-history',
    name: 'Communication History',
    route: '/communication-history',
    component: CommunicationHistoryFeature,
    sourcePath: 'src/features/communication-history/CommunicationHistoryFeature.tsx',
    contractId: 'feature-communication-history',
    promptTerms: ["communication history"],
    status: 'generated' as const,
  },
  {
    id: 'accessibility-settings',
    name: 'Accessibility Settings',
    route: '/accessibility-settings',
    component: AccessibilitySettingsFeature,
    sourcePath: 'src/features/accessibility-settings/AccessibilitySettingsFeature.tsx',
    contractId: 'feature-accessibility-settings',
    promptTerms: ["accessibility settings"],
    status: 'generated' as const,
  },
  {
    id: 'emergency-speech',
    name: 'Emergency Speech',
    route: '/emergency-speech',
    component: EmergencySpeechFeature,
    sourcePath: 'src/features/emergency-speech/EmergencySpeechFeature.tsx',
    contractId: 'feature-emergency-speech',
    promptTerms: ["emergency speech"],
    status: 'generated' as const,
  },
  {
    id: 'locked-in',
    name: 'Locked In',
    route: '/locked-in',
    component: LockedInFeature,
    sourcePath: 'src/features/locked-in/LockedInFeature.tsx',
    contractId: 'feature-locked-in',
    promptTerms: ["locked in"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
