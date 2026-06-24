/**
 * Validation Runtime Audit V1 — static script analysis for work patterns.
 */

import { readFileSync } from 'node:fs';
import type { ValidatorCategory, WorkPatternCounts } from './validation-runtime-audit-types.js';

const CATEGORY_RULES: Array<{ pattern: RegExp; category: ValidatorCategory }> = [
  { pattern: /capability-audit/, category: 'CAPABILITY_AUDIT' },
  { pattern: /clarifying-question|cqi-/, category: 'CQI' },
  { pattern: /uvl-|unified-verification|verification-hub|verification-execution/, category: 'UVL' },
  { pattern: /afla-|autonomous-founder-launch|founder-launch/, category: 'AFLA' },
  { pattern: /product-architect-intelligence/, category: 'PAI' },
  { pattern: /real-build-execution/, category: 'REAL_BUILD_EXECUTION' },
  { pattern: /launch-council|launch-readiness|launch-verdict/, category: 'LAUNCH' },
  { pattern: /engineering-reality|repository-typecheck/, category: 'ENGINEERING' },
  { pattern: /universal-app-blueprint|blueprint/, category: 'BLUEPRINT' },
  { pattern: /feature-reality|universal-feature-contract/, category: 'FEATURE_REALITY' },
  { pattern: /world2-/, category: 'WORLD2' },
  { pattern: /founder-review-operator|command-center|operator-feed|founder-reality/, category: 'OPERATOR' },
  { pattern: /connected-(build|runtime|preview|verification|launch)/, category: 'CONNECTED_PIPELINE' },
  { pattern: /foundation|shell|task-governor|chat-authority/, category: 'FOUNDATION' },
];

export function classifyValidatorCategory(validatorName: string, scriptFile: string): ValidatorCategory {
  const haystack = `${validatorName} ${scriptFile}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }
  return 'OTHER';
}

export function detectValidationMode(content: string): 'FAST_FEATURE_CHECK' | 'FULL_STACK_CHECK' | 'UNMARKED' {
  if (content.includes('VALIDATION_MODE: FULL_STACK_CHECK')) return 'FULL_STACK_CHECK';
  if (content.includes('VALIDATION_MODE: FAST_FEATURE_CHECK')) return 'FAST_FEATURE_CHECK';
  return 'UNMARKED';
}

export function extractMaxRuntimeBoundMs(content: string): number | null {
  const match = content.match(/MAX_RUNTIME_MS\s*=\s*([\d_]+)/);
  if (!match?.[1]) return null;
  return Number(match[1].replace(/_/g, ''));
}

export function analyzeWorkPatterns(content: string): WorkPatternCounts {
  const count = (regex: RegExp): number => (content.match(regex) ?? []).length;

  return {
    npmInstallCount:
      count(/npm\s+install/gi) +
      count(/execSync\s*\([^)]*install/gi) +
      count(/['"]install['"]/gi),
    npmBuildCount:
      count(/npm\s+run\s+build/gi) +
      count(/runNpmBuild/gi) +
      count(/['"]build['"]/gi),
    previewServerCount:
      count(/startGeneratedAppDevServer/gi) +
      count(/startDistPreviewServer/gi) +
      count(/executePreviewActivation/gi) +
      count(/createFounderRealityServer/gi) +
      count(/preview-activation/gi),
    playwrightExecutionCount:
      count(/playwright/gi) +
      count(/chromium\.launch/gi) +
      count(/createPlaywright/gi),
    workspaceMaterializationCount:
      count(/materializeGeneratedApplication/gi) +
      count(/materializeBuildProofGapArtifacts/gi) +
      count(/runRealBuildForCategory/gi),
    uvlExecutionCount:
      count(/runUvlVerificationExecution/gi) +
      count(/executeVerificationExecution/gi) +
      count(/assessUvlMaturity/gi),
    aflaExecutionCount:
      count(/runAutonomousFounderLaunchAuthority/gi) +
      count(/assessAfla/gi) +
      count(/afla-trust-calibration/gi),
    auditExecutionCount:
      count(/buildCapabilityAudit/gi) +
      count(/runRealBuildExecutionPipeline/gi),
    realBuildPipelineCount:
      count(/runRealBuildExecutionPipelineV11/gi) +
      count(/runRealBuildExecutionPipeline\(/gi),
    nestedValidatorCount:
      count(/execSync\s*\([^)]*npm run validate:/gi) +
      count(/spawnSync\s*\([^)]*validate:/gi),
  };
}

export function extractNestedValidatorTargets(content: string): string[] {
  const targets: string[] = [];
  const regex = /validate:([a-z0-9-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const name = `validate:${match[1]}`;
    if (!targets.includes(name)) targets.push(name);
  }
  return targets;
}

export function readValidatorScriptContent(scriptPath: string): string {
  try {
    return readFileSync(scriptPath, 'utf8');
  } catch {
    return '';
  }
}
