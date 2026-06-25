export const AIDEVENGINE_BUILD_PROOF_V1_4_PASS_TOKEN = 'AIDEVENGINE_BUILD_PROOF_V1_4_PASS';
export const AIDEVENGINE_BUILD_PROOF_V1_4_ARTIFACT_DIR = '.aidevengine-build-proof-v1-4';
export const AIDEVENGINE_BUILD_PROOF_V1_4_REPORT_TITLE = 'AIDEVENGINE_BUILD_PROOF_V1_4_REPORT.md';

/** Known V1.3 baseline for regression comparison in reports. */
export const AIDEVENGINE_BUILD_PROOF_V1_3_BASELINE = {
  uvlCoverage: 96,
  uvlConfidence: 96,
  blueprintVisualScore: 100,
  featureRealityScore: 100,
  engineeringRealityScore: 100,
  productArchitectureScore: 0,
  productArchitectureCriticalGaps: 6,
  aflaVerdict: 'NEEDS_AUTOFIX',
  aflaScore: 80,
  founderLaunchVerdict: 'NOT_LAUNCH_READY',
} as const;
