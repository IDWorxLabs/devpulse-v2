/**
 * AIDEVENGINE_BUILD_PROOF_V1_4 — bounded product architecture evidence types.
 */

export type ProductArchitectureEvidenceCategory =
  | 'domain'
  | 'roles'
  | 'entities'
  | 'behaviours'
  | 'frontend'
  | 'state'
  | 'persistence'
  | 'deployment'
  | 'verification'
  | 'limitations';

export interface ProductArchitectureEvidenceItem {
  readOnly: true;
  id: string;
  category: ProductArchitectureEvidenceCategory;
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
  entity?: string;
}

export interface ProductArchitectureEvidence {
  readOnly: true;
  generatedAt: string;
  workspacePath: string | null;
  contractId: string | null;
  observedEvidence: string;
  items: readonly ProductArchitectureEvidenceItem[];
  knownLimitations: readonly string[];
  verificationLinks: readonly string[];
  passedCount: number;
  totalCount: number;
  taskEntityDetected: boolean;
  behavioursMappedToTask: boolean;
  frontendArchitectureDetected: boolean;
  buildTargetDetected: boolean;
  runtimeEvidenceLinked: boolean;
}

export interface ArchitectureConsumptionEntry {
  readOnly: true;
  authority: string;
  consumed: boolean;
  evidenceFieldsConsumed: readonly string[];
  scoreBefore: number | null;
  scoreAfter: number | null;
  verdictBefore: string | null;
  verdictAfter: string | null;
  missingFields: readonly string[];
  detail: string;
}

export interface ArchitectureConsumptionMap {
  readOnly: true;
  generatedAt: string;
  entries: readonly ArchitectureConsumptionEntry[];
}
