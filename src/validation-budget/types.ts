/** DevPulse V2 Validation Budget Policy — types. */

export type ValidationMode =
  | 'FAST_FEATURE_CHECK'
  | 'FULL_STACK_CHECK'
  | 'PHASE_TRANSITION_CHECK';

export type ValidationTrigger =
  | 'FEATURE_LOCAL_CHANGE'
  | 'OWNERSHIP_REGISTRY_CHANGE'
  | 'ANSWER_AUTHORITY_CHANGE'
  | 'BROWSER_RUNNER_CHANGE'
  | 'TASK_GOVERNOR_CHANGE'
  | 'FOUNDATION_ENFORCEMENT_CHANGE'
  | 'PHASE_TRANSITION'
  | 'RELEASE_CHECKPOINT';

export interface ValidationRecommendation {
  recommendationId: string;
  mode: ValidationMode;
  requiredCommands: string[];
  forbiddenCommands: string[];
  reason: string;
  warnings: string[];
}

export type ValidatorScanStatus = 'PASS' | 'WARN' | 'FAIL';

export type ValidatorScriptMode = 'FAST_FEATURE_CHECK' | 'FULL_STACK_CHECK' | 'UNMARKED';

export interface NestedValidatorCall {
  file: string;
  line: number;
  pattern: string;
  targetScript?: string;
  scriptMode: ValidatorScriptMode;
}

export interface ValidatorScriptScanResult {
  scannedFiles: number;
  nestedValidatorCalls: NestedValidatorCall[];
  status: ValidatorScanStatus;
  riskyScripts: string[];
}

export interface ValidationBudgetState {
  ownerModule: string;
  lastTrigger: ValidationTrigger | null;
  lastRecommendation: ValidationRecommendation | null;
  lastScan: ValidatorScriptScanResult | null;
  warnings: string[];
  errors: string[];
}

export const POLICY_OWNER_MODULE = 'devpulse_v2_validation_budget_policy_authority';
export const POLICY_PASS_TOKEN = 'DEVPULSE_V2_VALIDATION_BUDGET_POLICY_V1_PASS';

export const FAST_REQUIRED_COMMANDS = [
  'npm run validate:<current-feature>',
  'npm run typecheck',
] as const;

export const FAST_FORBIDDEN_PATTERNS = [
  'nested npm run validate:* for unrelated systems',
  'execSync/spawnSync validate:* inside FAST_FEATURE_CHECK scripts',
  'Playwright runs inside normal feature validators',
] as const;

export const FULL_STACK_TRIGGERS: readonly ValidationTrigger[] = [
  'OWNERSHIP_REGISTRY_CHANGE',
  'ANSWER_AUTHORITY_CHANGE',
  'BROWSER_RUNNER_CHANGE',
  'TASK_GOVERNOR_CHANGE',
  'FOUNDATION_ENFORCEMENT_CHANGE',
  'RELEASE_CHECKPOINT',
] as const;

export const VALIDATION_MODE_MARKER_FAST = 'VALIDATION_MODE: FAST_FEATURE_CHECK';
export const VALIDATION_MODE_MARKER_FULL = 'VALIDATION_MODE: FULL_STACK_CHECK';
