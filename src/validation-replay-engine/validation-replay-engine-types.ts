/**
 * Validation Replay Engine — types and pass token.
 */

export const VALIDATION_REPLAY_ENGINE_OWNER_MODULE = 'devpulse_v2_validation_replay_engine';
export const VALIDATION_REPLAY_ENGINE_V1_PASS_TOKEN = 'VALIDATION_REPLAY_ENGINE_V1_PASS';

export interface ValidationReplayHost {
  replayValidation?: () => { ok: boolean; detail: string };
  clearValidationCache?: () => void;
}

export interface ValidationReplayInput {
  failureStage: string;
  failureReason: string;
  recoveryExecutionId: string;
  host?: ValidationReplayHost;
}

export interface ValidationReplayResult {
  readOnly: true;
  replayId: string;
  passed: boolean;
  mandatory: true;
  detail: string;
  replayedAt: number;
  evidenceRefs: readonly string[];
}
