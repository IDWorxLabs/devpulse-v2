/** DevPulse V2 AiDev Engine — types. */

export type AiDevRequestStatus =
  | 'RECEIVED'
  | 'ANALYZING'
  | 'READY_FOR_PLANNING'
  | 'REJECTED';

export interface AiDevRequest {
  requestId: string;
  createdAt: number;
  userInput: string;
  normalizedInput: string;
  status: AiDevRequestStatus;
  intentId?: string;
  warnings: string[];
  errors: string[];
}

export interface AiDevEngineState {
  engineId: string;
  requestCount: number;
  warnings: string[];
  errors: string[];
}

export interface AiDevSummary {
  requestId: string;
  status: AiDevRequestStatus;
  summary: string;
  publishedAt: number;
}

export interface IntentAttachmentSummary {
  requestId: string;
  intentId: string;
  intentSummary: string;
}

export interface AiDevEngineReport {
  ownerModule: string;
  totalRequests: number;
  receivedCount: number;
  analyzingCount: number;
  readyCount: number;
  rejectedCount: number;
  latestRequest: AiDevRequest | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const AIDEV_OWNER_MODULE = 'devpulse_v2_aidev_engine_authority';
export const AIDEV_PASS_TOKEN = 'DEVPULSE_V2_AIDEV_ENGINE_FOUNDATION_V1_PASS';
