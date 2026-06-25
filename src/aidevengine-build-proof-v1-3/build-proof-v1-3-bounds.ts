export const AIDEVENGINE_BUILD_PROOF_V1_3_PASS_TOKEN = 'AIDEVENGINE_BUILD_PROOF_V1_3_PASS';
export const AIDEVENGINE_BUILD_PROOF_V1_3_ARTIFACT_DIR = '.aidevengine-build-proof-v1-3';
export const AIDEVENGINE_BUILD_PROOF_V1_3_REPORT_TITLE = 'AIDEVENGINE_BUILD_PROOF_V1_3_REPORT.md';

/** Known V1.2 baseline for regression comparison in reports. */
export const AIDEVENGINE_BUILD_PROOF_V1_2_BASELINE = {
  uvlCoverage: 85,
  uvlConfidence: 84,
  blueprintVisualScore: 67,
  blueprintVisualPassed: false,
  aflaVerdict: 'NEEDS_AUTOFIX',
  aflaScore: 57,
  founderLaunchVerdict: 'NOT_LAUNCH_READY',
  criticalVisualRuntimeGap: 'Playwright viewport/runtime checks not run',
} as const;
