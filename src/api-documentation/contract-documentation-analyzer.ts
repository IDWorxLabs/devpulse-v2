/**
 * API Documentation — contract documentation analyzer.
 */

import type {
  ApiDocumentationInput,
  ContractDocumentationAnalysis,
} from './api-documentation-types.js';
import { getCachedContractAnalysis, setCachedContractAnalysis } from './api-documentation-cache.js';

export interface ContractDocumentationSnapshot {
  inputContractCount: number;
  outputContractCount: number;
  typeContractCount: number;
}

const BASE_CONTRACTS = [
  'input_contracts',
  'output_contracts',
  'type_contracts',
  'authority_contracts',
  'validation_contracts',
] as const;

let contractAnalysisCount = 0;

export function analyzeContractDocumentation(
  input: ApiDocumentationInput,
  snapshot: ContractDocumentationSnapshot,
): ContractDocumentationAnalysis {
  const cacheKey = [
    snapshot.inputContractCount,
    snapshot.outputContractCount,
    input.missingInputContractGuidance,
    input.missingOutputContractGuidance,
    ...(input.undocumentedContracts ?? []),
  ].join('|');

  const cached = getCachedContractAnalysis(cacheKey);
  if (cached) return cached;

  contractAnalysisCount += 1;
  const contractWarnings: string[] = [];
  const undocumentedContracts: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingInputContractGuidance, 'missing_input_contract_guidance', 'input_contracts'],
    [input.missingOutputContractGuidance, 'missing_output_contract_guidance', 'output_contracts'],
    [input.missingTypeContractGuidance, 'missing_type_contract_guidance', 'type_contracts'],
    [input.missingAuthorityContractGuidance, 'missing_authority_contract_guidance', 'authority_contracts'],
    [input.missingValidationContractGuidance, 'missing_validation_contract_guidance', 'validation_contracts'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      contractWarnings.push(warning);
      undocumentedContracts.push(area);
      penalty += 9;
    }
  }

  for (const contract of input.undocumentedContracts ?? []) {
    if (!undocumentedContracts.includes(contract)) {
      undocumentedContracts.push(contract);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.inputContractCount > 0 ? 10 : 0)
    + (snapshot.outputContractCount > 0 ? 9 : 0)
    + (snapshot.typeContractCount > 0 ? 8 : 0);
  const documented = BASE_CONTRACTS.length - undocumentedContracts.filter(
    (c) => BASE_CONTRACTS.includes(c as typeof BASE_CONTRACTS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_CONTRACTS.length) * 80 + systemBonus);
  const contractCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ContractDocumentationAnalysis = {
    contractCoverageScore,
    undocumentedContracts,
    contractWarnings,
  };
  setCachedContractAnalysis(cacheKey, result);
  return result;
}

export function getContractAnalysisCount(): number {
  return contractAnalysisCount;
}

export function resetContractDocumentationAnalyzerForTests(): void {
  contractAnalysisCount = 0;
}

export function listBaseContracts(): readonly string[] {
  return BASE_CONTRACTS;
}
