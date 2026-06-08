/** DevPulse V2 Product Architect — types. */

export type ArchitectureComponentType =
  | 'SCREEN'
  | 'FLOW'
  | 'MODULE'
  | 'DATA_MODEL'
  | 'INTEGRATION'
  | 'PERMISSION'
  | 'SERVICE';

export interface ArchitectureComponent {
  componentId: string;
  createdAt: number;
  type: ArchitectureComponentType;
  name: string;
  description: string;
  sourceRequirementIds: string[];
  warnings: string[];
  errors: string[];
}

export interface ArchitectureBlueprint {
  blueprintId: string;
  createdAt: number;
  requestId: string;
  components: ArchitectureComponent[];
  warnings: string[];
  errors: string[];
}

export interface ArchitectureSummary {
  blueprintId: string;
  requestId: string;
  componentCount: number;
  summary: string;
  publishedAt: number;
}

export interface ProductArchitectState {
  architectId: string;
  blueprintCount: number;
  warnings: string[];
  errors: string[];
}

export interface ProductArchitectReport {
  ownerModule: string;
  totalBlueprints: number;
  componentCount: number;
  screenCount: number;
  moduleCount: number;
  integrationCount: number;
  duplicateRiskCount: number;
  latestBlueprint: ArchitectureBlueprint | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface GenerateBlueprintInput {
  requestId: string;
  requirements: Array<{
    requirementId: string;
    category: string;
    value: string;
  }>;
}

export interface DuplicateDetectionContext {
  brainSummaries: string[];
  vaultCapabilities: string[];
}

export const ARCHITECT_OWNER_MODULE = 'devpulse_v2_product_architect_authority';
export const ARCHITECT_PASS_TOKEN = 'DEVPULSE_V2_PRODUCT_ARCHITECT_FOUNDATION_V1_PASS';

export const DUPLICATE_CHECK_TYPES: ArchitectureComponentType[] = [
  'MODULE',
  'SCREEN',
  'FLOW',
  'INTEGRATION',
  'SERVICE',
];

export const DUPLICATE_RISK_PREFIX = 'DUPLICATE_RISK';
