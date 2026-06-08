/** DevPulse V2 Self Vision — observation types (read-only, no execution). */

export type ObservationStatus =
  | 'VISIBLE'
  | 'HIDDEN'
  | 'CLICKABLE'
  | 'NOT_CLICKABLE'
  | 'UNKNOWN';

export interface ObservationRecord {
  observationId: string;
  createdAt: number;
  elementId: string;
  selector: string;
  status: ObservationStatus;
  sourceSystemId: string;
  warnings: string[];
  errors: string[];
}

export interface ObservationSession {
  sessionId: string;
  createdAt: number;
  observations: ObservationRecord[];
  warnings: string[];
  errors: string[];
}

export interface ObservationSummary {
  summaryId: string;
  sessionId: string;
  observationCount: number;
  visibleCount: number;
  hiddenCount: number;
  clickableCount: number;
  notClickableCount: number;
  unknownCount: number;
  summary: string;
  publishedAt: number;
  warnings: string[];
  errors: string[];
}

export interface SelfVisionReport {
  ownerModule: string;
  observationCount: number;
  visibleCount: number;
  hiddenCount: number;
  clickableCount: number;
  notClickableCount: number;
  sessionCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface SelfVisionAuthorityState {
  ownerModule: string;
  sessionCount: number;
  observationCount: number;
  warnings: string[];
  errors: string[];
}

export const SELF_VISION_OWNER_MODULE = 'devpulse_v2_self_vision_authority';
export const SELF_VISION_PASS_TOKEN = 'DEVPULSE_V2_SELF_VISION_FOUNDATION_V1_PASS';
