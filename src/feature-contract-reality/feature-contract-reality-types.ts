/**
 * Feature Contract Reality V1 — per-feature evidence types.
 */

export const FEATURE_CONTRACT_REALITY_V1_PASS_TOKEN = 'FEATURE_CONTRACT_REALITY_V1_PASS';

export const FEATURE_CONTRACT_REALITY_FILENAME = 'feature-contract-reality.json';

export const WORKSPACE_FEATURE_CONTRACT_REALITY_FILENAME = '.feature-contract-reality.json';

export type FeatureContractRealityStatus =
  | 'PASS'
  | 'FAIL'
  | 'PARTIAL'
  | 'PENDING'
  | 'DEGRADED_WITH_WORKSPACE_EVIDENCE';

export interface FeatureRealityRecord {
  readOnly: true;
  featureId: string;
  featureName: string;
  contractId: string;
  planned: boolean;
  generated: boolean;
  compiled: boolean;
  filesPresent: boolean;
  registryEntryPresent: boolean;
  routePresent: boolean;
  rendered: boolean;
  reachable: boolean;
  interactive: boolean;
  informationalOnly: boolean;
  validated: boolean;
  score: number;
  evidencePaths: string[];
  missingEvidence: string[];
  failureReasons: string[];
}

export interface FeatureContractRealityReport {
  readOnly: true;
  status: FeatureContractRealityStatus;
  overallScore: number;
  plannedFeatureCount: number;
  provenFeatureCount: number;
  featureRealityRecords: FeatureRealityRecord[];
  failureReasons: string[];
  informationalFeatureIds: string[];
  interactiveFeatureIds: string[];
  recordedAt: string;
  buildRunId: string;
  projectId: string;
  contractPath: string | null;
  artifactPath: string | null;
  persistentArtifactPath: string | null;
}

export interface FeatureContractRealityEvidence {
  readOnly: true;
  featureContractRealityStatus: FeatureContractRealityStatus;
  featureContractRealityScore: number;
  featureRealityRecords: FeatureRealityRecord[];
  featureRealityFailureReasons: string[];
  featureContractRealityArtifactPath: string | null;
  featureContractRealityPersistentArtifactPath: string | null;
  featureContractRealityRecordedAt: string;
}

export interface FeatureContractRealityRecordingResult {
  readOnly: true;
  report: FeatureContractRealityReport;
  evidence: FeatureContractRealityEvidence;
}
