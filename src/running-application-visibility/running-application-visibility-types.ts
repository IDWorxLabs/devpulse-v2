/**
 * Running Application Visibility — founder-facing build/output state model.
 */

export const RUNNING_APPLICATION_VISIBILITY_PASS_TOKEN = 'RUNNING_APPLICATION_VISIBILITY_PASS';
export const RUNNING_APPLICATION_VISIBILITY_OWNER_MODULE = 'aidevengine_running_application_visibility';

export type RunningAppOutputState =
  | 'NO_RUNNING_APP'
  | 'OUTPUT_STARTING'
  | 'OUTPUT_VISIBLE'
  | 'OUTPUT_INTERACTIVE'
  | 'OUTPUT_STALE'
  | 'OUTPUT_DEGRADED'
  | 'OUTPUT_READY_FOR_TESTING';

export type RequestAlignmentState =
  | 'ALIGNED'
  | 'PARTIALLY_ALIGNED'
  | 'UNKNOWN'
  | 'STALE'
  | 'NOT_ALIGNED';

export type TestReadinessState =
  | 'NOT_TESTABLE'
  | 'STARTING'
  | 'TESTABLE_WITH_WARNINGS'
  | 'TESTABLE'
  | 'STALE_TEST_TARGET';

export type BuildOutputType =
  | 'none'
  | 'static_shell'
  | 'preview_app'
  | 'generated_app'
  | 'degraded_output';

export interface ActiveApplicationInfo {
  projectId: string | null;
  projectName: string | null;
  previewTargetName: string | null;
  activeRouteView: string;
  sessionId: string | null;
}

export interface BuildOutputInfo {
  lastBuildLabel: string;
  buildState: string;
  lastUpdatedAt: number | null;
  outputType: BuildOutputType;
  changeSummary: string;
}

export interface RunningApplicationVisibilityInput {
  generatedAt: number;
  previewRealityState: string;
  previewReality: {
    validationReady: boolean;
    freshness: { passed: boolean; reason: string };
    interactivity: { passed: boolean; reason: string };
    loadReality: { passed: boolean; reason: string };
    problems: string[];
  };
  activeSession: {
    previewSessionId: string;
    projectId: string;
    previewState: string;
    previewUrl: string | null;
    previewTargetName: string;
    createdAt: number;
    warnings: string[];
    blockedReasons: string[];
  } | null;
  previewUrl: string | null;
  buildStatus: string;
  latestProjectId: string | null;
  projectCount: number;
  projectName: string | null;
  recentChangeSummary: string | null;
  targetType: string | null;
}

export interface RunningApplicationFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
  evidence?: string;
}

export interface RunningApplicationVisibilityAssessment {
  outputState: RunningAppOutputState;
  outputStateLabel: string;
  activeApplication: ActiveApplicationInfo;
  buildOutput: BuildOutputInfo;
  requestAlignment: RequestAlignmentState;
  alignmentReason: string;
  testReadiness: TestReadinessState;
  testReadinessReason: string;
  recommendedAction: string;
  runningAppTitle: string;
  summaryLines: string[];
  warnings: string[];
  operatorFeedEvents: RunningApplicationFeedEvent[];
  identifiable: boolean;
  outputStateExplicit: boolean;
  buildOutputVisible: boolean;
  alignmentHonest: boolean;
  testReadinessExplicit: boolean;
  staleDetected: boolean;
  degradedDetected: boolean;
  readyForTesting: boolean;
}
