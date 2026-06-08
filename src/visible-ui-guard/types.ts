/** DevPulse V2 Visible UI Guard — types. */

export type VisibleUiElementType =
  | 'PANEL'
  | 'BUTTON'
  | 'CARD'
  | 'FORM'
  | 'INPUT'
  | 'FEED_BLOCK'
  | 'PREVIEW'
  | 'APPROVAL_CONTROL'
  | 'OTHER';

export type VisibleUiCheckStatus = 'PASS' | 'WARN' | 'FAIL';

export interface VisibleUiElementRecord {
  elementId: string;
  ownerSystemId: string;
  ownerModule: string;
  type: VisibleUiElementType;
  label: string;
  mountTarget: string;
  expectedSelector: string;
  interactive: boolean;
  requiredForPhase: boolean;
  createdAt: number;
  warnings: string[];
  errors: string[];
}

export interface VisibleUiElementInput {
  elementId: string;
  ownerSystemId: string;
  ownerModule: string;
  type: VisibleUiElementType;
  label: string;
  mountTarget: string;
  expectedSelector: string;
  interactive?: boolean;
  requiredForPhase?: boolean;
}

export interface VisibleUiCheckResult {
  checkId: string;
  elementId: string;
  visible: boolean;
  clickable: boolean;
  mountTargetFound: boolean;
  status: VisibleUiCheckStatus;
  warnings: string[];
  errors: string[];
}

export interface VisibleUiRegistryState {
  ownerModule: string;
  elementCount: number;
  interactiveCount: number;
  snapshotCount: number;
  warnings: string[];
  errors: string[];
}

export interface VisibleUiSnapshot {
  snapshotId: string;
  capturedAt: number;
  elementCount: number;
  elements: VisibleUiElementRecord[];
}

export interface VisibleUiGuardReport {
  ownerModule: string;
  registeredElementCount: number;
  interactiveElementCount: number;
  missingMountTargetCount: number;
  missingSelectorCount: number;
  visibilityFailCount: number;
  clickabilityFailCount: number;
  latestRegisteredElement: VisibleUiElementRecord | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface BrowserUiCheckDefinition {
  elementId: string;
  label: string;
  expectedSelector: string;
  mountTarget: string;
  interactive: boolean;
  checkType: 'visibility' | 'clickability';
}

export const GUARD_OWNER_MODULE = 'devpulse_v2_visible_ui_guard_authority';
export const GUARD_PASS_TOKEN = 'DEVPULSE_V2_VISIBLE_UI_CLICKABILITY_GUARD_V1_PASS';
