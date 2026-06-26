/**
 * Virtual Device Laboratory Era 3 Phase 7 — types.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';

export const VIRTUAL_DEVICE_LABORATORY_PASS_TOKEN = 'VIRTUAL_DEVICE_LABORATORY_V1_PASS';
export const VIRTUAL_DEVICE_LABORATORY_OWNER_MODULE = 'devpulse_v2_virtual_device_laboratory';
export const DEFAULT_MAX_DEVICE_HISTORY = 128;
export const DEFAULT_MAX_DEVICE_MATRIX_ENTRIES = 12;
export const DEFAULT_DEVICE_TIMEOUT_MS = 15_000;
export const DEFAULT_LOW_END_RENDER_THRESHOLD_MS = 2500;

export type DeviceType = 'PHONE' | 'TABLET' | 'DESKTOP';
export type DeviceOrientation = 'PORTRAIT' | 'LANDSCAPE';
export type ThemeMode = 'LIGHT' | 'DARK';
export type PerformanceTier = 'LOW_END' | 'STANDARD' | 'HIGH_END';
export type PerformanceStatus = 'PASS' | 'WARN' | 'FAIL';
export type DeviceVerdict = 'READY_FOR_PREVIEW' | 'NEEDS_REPAIR' | 'BLOCKED' | 'IN_PROGRESS';

export type DeviceFailureCategory =
  | 'BLANK_SCREEN'
  | 'RUNTIME_ERROR'
  | 'LAYOUT_OVERFLOW'
  | 'CLIPPED_CONTROL'
  | 'UNREACHABLE_ACTION'
  | 'NAVIGATION_HIDDEN'
  | 'ACCESSIBILITY_SCALE_BREAK'
  | 'THEME_CONTRAST_FAILURE'
  | 'TOUCH_TARGET_TOO_SMALL'
  | 'PERFORMANCE_DEGRADED'
  | 'ORIENTATION_FAILURE'
  | 'RESPONSIVE_COLLAPSE'
  | 'INPUT_MODE_FAILURE';

export interface DeviceProfile {
  readOnly: true;
  deviceId: string;
  deviceType: DeviceType;
  viewportWidth: number;
  viewportHeight: number;
  orientation: DeviceOrientation;
  inputMode: string;
  pixelRatio: number;
  themeMode: ThemeMode;
  accessibilityScaling: number;
  performanceTier: PerformanceTier;
  networkProfile: string;
  expectedLayoutConstraints: readonly string[];
  requiredWorkflows: readonly string[];
  requiredVirtualUserIds: readonly string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DeviceMatrixEntry {
  readOnly: true;
  profileId: string;
  deviceId: string;
  reasonIncluded: string;
  sourceRequirementIds: readonly string[];
  virtualUserLinks: readonly string[];
  behaviorScenarioLinks: readonly string[];
  validationScope: readonly string[];
  timeoutBudgetMs: number;
  passCriteria: readonly string[];
}

export interface EnvironmentLaunchPlan {
  readOnly: true;
  planId: string;
  profileId: string;
  viewport: { width: number; height: number };
  orientation: DeviceOrientation;
  theme: ThemeMode;
  accessibilityScaling: number;
  inputMethod: string;
  networkConditions: string;
  performanceTier: PerformanceTier;
  appRoute: string;
  requiredSetupState: readonly string[];
  requiredWorkflows: readonly string[];
  expectedRenderConstraints: readonly string[];
  timeoutBudgetMs: number;
}

export interface DeviceValidationCheck {
  readOnly: true;
  check: string;
  passed: boolean;
  detail: string;
}

export interface DevicePerformanceSample {
  readOnly: true;
  initialRenderMs: number;
  interactionResponseMs: number;
  routeTransitionMs: number;
  memoryRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  longTaskRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: PerformanceStatus;
}

export interface DeviceFailureReport {
  readOnly: true;
  failureId: string;
  profileId: string;
  featureSliceId: string;
  virtualUserId: string | null;
  behaviorScenarioId: string | null;
  target: string;
  expectedResult: string;
  observedResult: string;
  category: DeviceFailureCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  likelyCause: string;
  repairRecommendation: string;
}

export interface DeviceRepairRecommendation {
  readOnly: true;
  recommendationId: string;
  failureId: string;
  suggestedRepairScope: string;
  affectedDeviceProfiles: readonly string[];
  affectedFeatureSliceIds: readonly string[];
  affectedComponents: readonly string[];
  affectedStyles: readonly string[];
  affectedRoutes: readonly string[];
  affectedInteractionTargets: readonly string[];
  promptRequirementLinks: readonly string[];
  virtualUserLinks: readonly string[];
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  validationRequiredAfterRepair: readonly string[];
}

export interface DeviceProfileResult {
  readOnly: true;
  profileId: string;
  deviceId: string;
  launchPlan: EnvironmentLaunchPlan;
  renderChecks: readonly DeviceValidationCheck[];
  responsiveChecks: readonly DeviceValidationCheck[];
  navigationChecks: readonly DeviceValidationCheck[];
  reachabilityChecks: readonly DeviceValidationCheck[];
  accessibilityChecks: readonly DeviceValidationCheck[];
  themeChecks: readonly DeviceValidationCheck[];
  performance: DevicePerformanceSample;
  passed: boolean;
  failure: DeviceFailureReport | null;
  repairRecommendation: DeviceRepairRecommendation | null;
  skipJustification: string | null;
  durationMs: number;
}

export interface WholeAppDeviceSweepResult {
  readOnly: true;
  sweepId: string;
  passed: boolean;
  checks: readonly { check: string; passed: boolean; detail: string }[];
  blockedReason: string | null;
  resumedFromProfileId: string | null;
  completedProfileIds: readonly string[];
}

export interface VirtualDevicePipelineInput {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  sliceIdFilter?: string | null;
  simulateClippedButton?: boolean;
  simulateSlowLowEndRender?: boolean;
  simulateThemeContrastFailure?: boolean;
  resumeFromProfileId?: string | null;
}

export interface VirtualDevicePipelineResult {
  readOnly: true;
  pipelineId: string;
  profiles: readonly DeviceProfile[];
  matrix: readonly DeviceMatrixEntry[];
  launchPlans: readonly EnvironmentLaunchPlan[];
  profileResults: readonly DeviceProfileResult[];
  wholeAppSweep: WholeAppDeviceSweepResult;
  permissionVerdict: DeviceVerdict;
  blockedReason: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchVirtualDeviceEvidence {
  readOnly: true;
  requiredProfileCount: number;
  executedProfileCount: number;
  passedCount: number;
  failedCount: number;
  warnedCount: number;
  skippedWithJustificationCount: number;
  wholeAppSweepPassed: boolean;
  permissionVerdict: DeviceVerdict;
  blockers: readonly string[];
}

export interface VirtualDeviceReadinessResult {
  readOnly: true;
  ready: boolean;
  profileCount: number;
  matrixCount: number;
  blockedReason: string | null;
}

export interface LivePreviewVirtualDeviceGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  affectedDevice: string | null;
  affectedOrientationTheme: string | null;
  failedWorkflow: string | null;
  failureCategory: string | null;
  responsibleComponent: string | null;
  repairPlan: string | null;
  gateStatus: string;
}
