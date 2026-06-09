/**
 * Code generation strategy selector — advisory strategy only.
 */

import type { CodeGenerationStrategy } from './code-generation-runtime-types.js';

export function selectGenerationStrategy(query: string): CodeGenerationStrategy {
  const lower = query.toLowerCase();

  if (lower.includes('test') || lower.includes('validation')) {
    return 'TEST_FIRST_PROPOSAL';
  }
  if (lower.includes('interface') || lower.includes('types')) {
    return 'INTERFACE_FIRST';
  }
  if (lower.includes('adapter') || lower.includes('bridge')) {
    return 'ADAPTER_LAYER';
  }
  if (lower.includes('incremental') || lower.includes('module')) {
    return 'INCREMENTAL_MODULE';
  }

  return 'SIMULATION_STUB';
}

export function strategyDescription(strategy: CodeGenerationStrategy): string {
  const map: Record<CodeGenerationStrategy, string> = {
    INCREMENTAL_MODULE: 'Propose incremental module additions with isolated boundaries',
    INTERFACE_FIRST: 'Propose interfaces and types before implementation artifacts',
    TEST_FIRST_PROPOSAL: 'Propose validation and test artifacts before implementation',
    ADAPTER_LAYER: 'Propose adapter layer between existing systems and new capability',
    SIMULATION_STUB: 'Propose simulation stubs — no real code written to project files',
  };
  return map[strategy];
}
