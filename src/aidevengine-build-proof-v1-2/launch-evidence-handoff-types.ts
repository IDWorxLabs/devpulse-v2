/**
 * AIDEVENGINE_BUILD_PROOF_V1_2 — launch evidence handoff types.
 */

import type { CqiMaturityAssessment } from '../clarifying-question-intelligence/cqi-maturity-types.js';

export type UvlBehaviourKey =
  | 'addTask'
  | 'markComplete'
  | 'deleteTask'
  | 'filterAllActiveCompleted'
  | 'activeCountUpdates'
  | 'browserBuildArtifactExists';

export interface UvlBehaviourEvidenceItem {
  readOnly: true;
  behaviour: UvlBehaviourKey;
  passed: boolean;
  detail: string;
  source: 'generated-source' | 'build-artifact';
}

export interface EnrichedRequirementsEvidence {
  readOnly: true;
  productRequest: string;
  enrichedPrompt: string;
  initialConfidence: number;
  enrichedConfidence: number;
  initialOpenQuestions: number;
  enrichedOpenQuestions: number;
  canProceedToPlanning: boolean;
  clarificationAnswers: readonly string[];
  cqiInitial: CqiMaturityAssessment;
  cqiEnriched: CqiMaturityAssessment;
}

export interface BuildMaterializationEvidence {
  readOnly: true;
  workspacePath: string | null;
  generatedFileCount: number;
  npmBuildExitCode: number | null;
  npmBuildOk: boolean;
  previewArtifactPath: string | null;
  previewArtifactExists: boolean;
  buildReadyContractId: string | null;
}

export interface UvlBehaviourEvidenceRecord {
  readOnly: true;
  workspacePath: string | null;
  behaviours: readonly UvlBehaviourEvidenceItem[];
  passedCount: number;
  totalCount: number;
  allBehavioursPresent: boolean;
}

export interface BuildProofMaterializationHandoff {
  readOnly: true;
  workspaceMaterialized: boolean;
  npmBuildOk: boolean;
  previewArtifactExists: boolean;
  generatedFileCount: number;
}

export interface LaunchEvidenceBundle {
  readOnly: true;
  generatedAt: string;
  profile: string;
  productName: string;
  enrichedRequirements: EnrichedRequirementsEvidence;
  buildMaterialization: BuildMaterializationEvidence;
  uvlBehaviour: UvlBehaviourEvidenceRecord;
  materializationHandoff: BuildProofMaterializationHandoff;
}

export interface AuthorityConsumptionEntry {
  readOnly: true;
  authority: string;
  consumed: boolean;
  fieldsUsed: readonly string[];
  fieldsIgnored: readonly string[];
  fieldsUnsupported: readonly string[];
  detail: string;
}

export interface AuthorityConsumptionMap {
  readOnly: true;
  generatedAt: string;
  entries: readonly AuthorityConsumptionEntry[];
}
