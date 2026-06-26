/**
 * Blueprint Purity V1 — evidence types.
 */

export const BLUEPRINT_PURITY_V1_PASS_TOKEN = 'BLUEPRINT_PURITY_V1_PASS';

export interface BlueprintPurityFileScanResult {
  readOnly: true;
  relativePath: string;
  violations: string[];
  passed: boolean;
}

export interface BlueprintPurityEvidence {
  readOnly: true;
  blueprintPurityStatus: 'PASS' | 'FAIL';
  blueprintPurityCheckedFiles: string[];
  blueprintPurityViolationCount: number;
  blueprintPurityAllowedDomainSources: string[];
  blueprintPurityFailureReasons: string[];
  fileResults: BlueprintPurityFileScanResult[];
  shellPurityVerified: boolean;
  domainLanguageBoundaryVerified: boolean;
  scannedAt: string;
}
