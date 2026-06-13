/**
 * Connected Preview Experience Proof — preview evidence models.
 * Read-only — no synthetic preview claims; bounded fixture evidence only.
 */

import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';

export type PreviewProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export type PreviewExperienceState =
  | 'NOT_STARTED'
  | 'SESSION_OBSERVED'
  | 'URL_REACHABLE'
  | 'RENDERED'
  | 'INTERACTIVE';

export type PreviewSessionState = 'NOT_OBSERVED' | 'PARTIAL' | 'OBSERVED';

export type PreviewUrlState = 'NOT_OBSERVED' | 'OBSERVED' | 'REACHABLE';

export type PreviewRenderState = 'NOT_RENDERED' | 'PARTIAL' | 'RENDERED';

export type PreviewInteractionState = 'NOT_INTERACTIVE' | 'PARTIAL' | 'INTERACTIVE';

export type PreviewCaptureState = 'NOT_CAPTURED' | 'PARTIAL' | 'CAPTURED';

export interface PreviewSessionAssessment {
  readOnly: true;
  sessionState: PreviewSessionState;
  sessionObserved: boolean;
  sessionId: string | null;
  workspaceLinked: boolean;
  runtimeLinked: boolean;
  previewTimestamp: string | null;
  previewSource: string | null;
  confidence: number;
}

export interface PreviewUrlAssessment {
  readOnly: true;
  urlState: PreviewUrlState;
  urlObserved: boolean;
  urlReachable: boolean;
  previewUrl: string | null;
  host: string | null;
  port: number | null;
  protocol: string | null;
  confidence: number;
}

export interface PreviewRenderAssessment {
  readOnly: true;
  renderState: PreviewRenderState;
  renderObserved: boolean;
  applicationRendered: boolean;
  renderEvidence: string[];
  applicationTitle: string | null;
  applicationRoot: string | null;
  confidence: number;
}

export interface PreviewInteractionAssessment {
  readOnly: true;
  interactionState: PreviewInteractionState;
  interactionObserved: boolean;
  interactiveElements: string[];
  interactionEvidence: string[];
  confidence: number;
}

export interface PreviewCaptureAssessment {
  readOnly: true;
  captureState: PreviewCaptureState;
  captureObserved: boolean;
  captureCount: number;
  capturePaths: string[];
  confidence: number;
}

export interface PreviewManifestAssessment {
  readOnly: true;
  manifestExists: boolean;
  runtimeLinked: boolean;
  workspaceLinked: boolean;
  previewLinked: boolean;
  contractLinked: boolean;
  traceabilityScore: number;
}

export interface PreviewLinkageAnalysis {
  readOnly: true;
  previewLinkageConnected: boolean;
  firstBrokenPreviewLink: string | null;
  missingLinks: string[];
  traceabilityScore: number;
  contractToWorkspace: boolean;
  workspaceToRuntime: boolean;
  runtimeToPreviewSession: boolean;
  previewSessionToUrl: boolean;
  urlToRender: boolean;
  renderToInteraction: boolean;
}

export interface PreviewExperienceFounderQuestions {
  readOnly: true;
  canFounderSeeApp: boolean;
  canFounderInteractWithApp: boolean;
  whatPreviewEvidenceExists: string[];
  whatEvidenceMissing: string[];
  whatShouldBeBuiltNext: string[];
}

/** Step-by-step preview activation contract evidence (Phase 26.75). */
export interface PreviewActivationEvidence {
  readOnly: true;
  workspaceId: string;
  workspacePath: string;
  previewUrl: string | null;
  runtimePort: number | null;
  previewDetected: boolean;
  generatedAt: string;
  urlChecked: boolean;
  httpStatus: number | null;
  reachable: boolean;
  checkedAt: string | null;
  renderEvidenceType: string | null;
  renderObserved: boolean;
  responseLength: number | null;
  contentType: string | null;
  renderCheckedAt: string | null;
  proofLevel: PreviewProofLevel;
  firstBrokenPreviewLink: string | null;
}

export interface PreviewExperienceProofReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  previewProofLevel: PreviewProofLevel;
  previewState: PreviewExperienceState;
  runtimeActivationProven: boolean;
  session: PreviewSessionAssessment;
  url: PreviewUrlAssessment;
  render: PreviewRenderAssessment;
  interaction: PreviewInteractionAssessment;
  captures: PreviewCaptureAssessment;
  manifest: PreviewManifestAssessment;
  linkage: PreviewLinkageAnalysis;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  founderQuestions: PreviewExperienceFounderQuestions;
  activationEvidence: PreviewActivationEvidence | null;
  cacheKey: string;
}

export interface PreviewExperienceProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'PREVIEW_EXPERIENCE_PROOF_COMPLETE' | 'PREVIEW_EXPERIENCE_PROOF_FAILED';
  report: PreviewExperienceProofReport;
}

/** Injectable bounded preview session evidence for validation fixtures. */
export interface PreviewSessionEvidence {
  previewSessionId?: string;
  workspaceId?: string;
  runtimeSessionId?: string;
  previewTimestamp?: string;
  previewSource?: string;
  previewUrl?: string;
  host?: string;
  port?: number;
  protocol?: string;
  urlReachable?: boolean;
  urlChecked?: boolean;
  httpStatus?: number;
  responseCode?: number;
  responseLength?: number;
  contentType?: string;
  renderEvidenceType?: string;
  renderObserved?: boolean;
  renderCheckedAt?: string;
  checkedAt?: string;
  generatedAt?: string;
  proofLevel?: PreviewProofLevel;
  htmlResponse?: boolean;
  applicationTitle?: string;
  applicationRoot?: string;
  domSnapshot?: string;
  renderCapturePath?: string;
  interactiveElements?: string[];
  interactionEvidence?: string[];
  capturePaths?: string[];
}

export interface AssessConnectedPreviewExperienceProofInput {
  rootDir?: string;
  runtimeActivationProof?: RuntimeActivationProofReport | null;
  previewSessionEvidence?: PreviewSessionEvidence;
  /** Skip bounded gap activation (fixtures / tests). */
  skipPreviewProofGapActivation?: boolean;
}

export interface PreviewExperienceProofHistoryEntry {
  timestamp: string;
  assessmentId: string;
  previewProofLevel: PreviewProofLevel;
  previewState: PreviewExperienceState;
  previewLinkageConnected: boolean;
}

export interface PreviewExperienceProofHistorySummary {
  totalAssessments: number;
  provenPreviews: number;
  partialPreviews: number;
  notProvenPreviews: number;
}

export interface PreviewExperienceProofArtifacts {
  previewExperienceProofAssessment: PreviewExperienceProofAssessment;
  previewExperienceProofReportMarkdown: string;
}
