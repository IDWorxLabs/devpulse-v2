/** DevPulse V2 Browser Verification Harness — types. */

export type VerificationStatus = 'PENDING' | 'PASS' | 'WARN' | 'FAIL';

export type CheckStatus = 'PASS' | 'WARN' | 'FAIL';

export type BrowserRunnerMode = 'real-browser' | 'simulated-html';

export type RealBrowserRunnerStatus = 'ATTACHED' | 'PACKAGE_REQUIRED' | 'FAILED';

export interface BrowserRealityCheck {
  checkId: string;
  name: string;
  status: CheckStatus;
  expected: string;
  actual: string;
  latencyMs?: number;
  evidence: string[];
}

export interface BrowserVerificationResult {
  verificationId: string;
  startedAt: number;
  completedAt?: number;
  status: VerificationStatus;
  checks: BrowserRealityCheck[];
  warnings: string[];
  errors: string[];
  runnerUsed: BrowserRunnerMode;
  realBrowserRunnerStatus: RealBrowserRunnerStatus;
}

export interface BrowserVerificationReportSummary {
  verificationId: string;
  totalChecks: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  visibleTargetStatus: CheckStatus | 'N/A';
  clickableTargetStatus: CheckStatus | 'N/A';
  chatAnswerVisible: boolean;
  inlineFeedVisible: boolean;
  realBrowserRunnerAttached: boolean;
  runnerUsed: BrowserRunnerMode;
  realBrowserRunnerStatus: RealBrowserRunnerStatus;
  warnings: string[];
  errors: string[];
  recommendation: string;
  summary: string;
}

export const HARNESS_OWNER_MODULE = 'devpulse_v2_browser_verification_harness';
export const HARNESS_PASS_TOKEN = 'DEVPULSE_V2_BROWSER_VERIFICATION_HARNESS_FOUNDATION_V1_PASS';

export const REAL_BROWSER_OWNER_MODULE = 'devpulse_v2_real_browser_runner_adapter';
export const REAL_BROWSER_PASS_TOKEN = 'DEVPULSE_V2_REAL_BROWSER_RUNNER_ATTACHMENT_V1_PASS';

export const VISIBLE_TARGET_MS = 800;
export const CLICKABLE_TARGET_MS = 2000;

export const FOUNDATION_FEED_STAGE_COUNT = 5;
