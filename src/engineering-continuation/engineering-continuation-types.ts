/**
 * Engineering Continuation Engine — types and pass token.
 */

export const ENGINEERING_CONTINUATION_OWNER_MODULE = 'devpulse_v2_engineering_continuation';
export const ENGINEERING_CONTINUATION_V1_PASS_TOKEN = 'ENGINEERING_CONTINUATION_V1_PASS';

export interface EngineeringContinuationHost {
  continuePipeline?: () => { ok: boolean; detail: string };
  continueBuild?: () => { ok: boolean; detail: string };
  continueValidation?: () => { ok: boolean; detail: string };
}

export interface EngineeringContinuationInput {
  projectId: string;
  failureStage: string;
  recoveryExecutionId: string;
  validationReplayId: string;
  host?: EngineeringContinuationHost;
}

export interface EngineeringContinuationResult {
  readOnly: true;
  continuationId: string;
  continued: boolean;
  userActionRequired: false;
  detail: string;
  continuedAt: number;
  nextStage: string | null;
}
