/**
 * Mobile Runtime Experience Reality — types (Phase 24C.5).
 * Phone image / roadmap / code mention ≠ proof.
 */

import type {
  AndroidRuntimeRealityLevel,
  CloudRuntimeRealityLevel,
  DeviceFrameRealityLevel,
  ExpoRuntimeRealityLevel,
  IosRuntimeRealityLevel,
  MobileExperienceCompletenessLevel,
  MobileRuntimeAreaId,
  MobileSimulationRealityLevel,
} from './mobile-runtime-experience-reality-analyzer-types.js';

export {
  MOBILE_RUNTIME_EXPERIENCE_REALITY_PASS_TOKEN,
  MOBILE_RUNTIME_EXPERIENCE_REALITY_OWNER_MODULE,
} from './mobile-runtime-experience-reality-bounds.js';

export type MobileRuntimeEvidenceLevel = 'CLAIMED' | 'OBSERVED' | 'PROVEN';

export interface MobileRuntimeEvidence {
  id: string;
  area: MobileRuntimeAreaId;
  level: MobileRuntimeEvidenceLevel;
  description: string;
  source: string;
}

export interface MobileRuntimeStage {
  area: MobileRuntimeAreaId;
  status: 'COMPLETE' | 'PARTIAL' | 'BLOCKED' | 'NOT_STARTED';
  detail: string;
}

export interface MobileRuntimeBlocker {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactRank: number;
  explanation: string;
  recommendation: string;
}

export interface MobileRuntimeMatrixRow {
  area: string;
  claimed: MobileRuntimeEvidenceLevel | 'NONE';
  observed: MobileRuntimeEvidenceLevel | 'NONE';
  proven: MobileRuntimeEvidenceLevel | 'NONE';
}

export interface MobileRuntimeSubscores {
  deviceFrames: number;
  simulation: number;
  androidRuntime: number;
  iosRuntime: number;
  expoRuntime: number;
  cloudRuntime: number;
  mobileExperience: number;
}

export interface MobileRuntimeAnalyzerResults {
  deviceFrameReality: DeviceFrameRealityLevel;
  mobileSimulationReality: MobileSimulationRealityLevel;
  androidRuntimeReality: AndroidRuntimeRealityLevel;
  iosRuntimeReality: IosRuntimeRealityLevel;
  expoRuntimeReality: ExpoRuntimeRealityLevel;
  cloudRuntimeReality: CloudRuntimeRealityLevel;
  mobileExperienceCompleteness: MobileExperienceCompletenessLevel;
}

export interface MobileRuntimeModulePresenceEvidence {
  hasMobilePreviewRuntime: boolean;
  hasMobileRuntimeExperienceReality: boolean;
  hasVisualQaMobileAnalyzer: boolean;
  hasLivePreviewGatekeeper: boolean;
  hasFounderInteractionSimulation: boolean;
  hasControlledBuilderExecutionEngine: boolean;
  hasExecutionFoundation: boolean;
  hasFounderRealityUi: boolean;
  mobilePreviewPolicyMetadata: boolean;
  mobileExtensionPointsReserved: boolean;
}

export interface MobileRuntimeWorkspaceSignals {
  deviceFramePreviewActive: boolean;
  touchSimulationEvidence: boolean;
  mobilePreviewLaunchEvidence: boolean;
  androidRuntimeLaunchEvidence: boolean;
  iosRuntimeLaunchEvidence: boolean;
  expoRuntimeLaunchEvidence: boolean;
  cloudDeviceSessionEvidence: boolean;
  testflightRuntimeEvidence: boolean;
  executionConnected: boolean;
}

export interface AssessMobileRuntimeExperienceRealityInput {
  rootDir: string;
  workspace: MobileRuntimeWorkspaceSignals;
  moduleEvidence: MobileRuntimeModulePresenceEvidence;
}

export interface MobileRuntimeReport {
  executiveSummary: string;
  capabilityMatrix: MobileRuntimeMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  mobileRuntimeBlockers: string[];
  founderConclusion: string;
  markdown: string;
}

export interface MobileRuntimeExperienceRealityAssessment {
  assessmentId: string;
  mobileRuntimeExperienceScore: number;
  portfolioSubscores: MobileRuntimeSubscores;
  analyzers: MobileRuntimeAnalyzerResults;
  stages: MobileRuntimeStage[];
  evidence: MobileRuntimeEvidence[];
  capabilityMatrix: MobileRuntimeMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  mobileRuntimeBlockers: MobileRuntimeBlocker[];
  founderConclusion: string;
  mobileRuntimeSummary: string;
  nextRequiredCapability: string;
  report: MobileRuntimeReport;
  assessedAt: number;
}
