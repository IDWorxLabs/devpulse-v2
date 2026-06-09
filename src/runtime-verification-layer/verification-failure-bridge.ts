/**
 * Verification failure bridge — surfaces verification gaps without full plan chain.
 */

import { isRuntimeVerificationLayerQuestion } from './runtime-verification-types.js';

export interface VerificationFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildVerificationFailureContext(query: string): VerificationFailureContext[] {
  if (!isRuntimeVerificationLayerQuestion(query)) return [];

  const lower = query.toLowerCase();

  const records: VerificationFailureContext[] = [
    {
      title: 'Verification gap: Phase 14.6 simulation only',
      description: 'Runtime verification forbids execution, test runs, and fix application',
      sourceSystem: 'runtime_verification_layer',
      severity: 'CRITICAL',
    },
    {
      title: 'Verification gap: Future execution gates required',
      description: 'Full runtime chain verification requires founder approval before governed execution',
      sourceSystem: 'unified_decision_layer',
      severity: 'HIGH',
    },
    {
      title: 'Verification gap: executionAllowed must remain false',
      description: 'Execution packet must stay blocked during Phase 14 advisory verification',
      sourceSystem: 'execution_runtime',
      severity: 'HIGH',
    },
  ];

  if (lower.includes('gaps') || lower.includes('prevents')) {
    records.push({
      title: 'Verification gap: Unsatisfied evidence in runtime chain',
      description: 'Some Phase 14 runtime evidence items remain unsatisfied until future gates pass',
      sourceSystem: 'runtime_verification_layer',
      severity: 'MEDIUM',
    });
  }

  return records;
}
