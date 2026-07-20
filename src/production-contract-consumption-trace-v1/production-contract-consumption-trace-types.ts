/**
 * Production Contract Consumption Trace V1 — investigation only, no fix, no new authority.
 *
 * Pure types for the temporary [CONTRACT_CONSUMPTION_TRACE] diagnostic log lines this milestone
 * adds to a handful of real generation-path files. This module has no scoring, no gating, no
 * decision-making of any kind — it only shapes and prints evidence that already exists inside the
 * real pipeline, so a human (or a later, separate fix milestone) can see exactly where the
 * canonical contract stops being consumed and generic/legacy content starts being produced.
 */

/** Every stage this trace instruments, in the order the real orchestrator invokes them. */
export type ContractConsumptionStage =
  | 'PROMPT_FEATURE_EXTRACTION'
  | 'PROMPT_BOUNDED_MODULE_PLAN'
  | 'CANONICAL_PRODUCT_CONTRACT'
  | 'CBGA_REPAIRED_PLAN'
  | 'CUSTOM_DOMAIN_COPY_BUILDER'
  | 'FEATURE_APP_ROUTER_GENERATION'
  | 'WORKSPACE_MATERIALIZATION';

export interface ContractConsumptionTraceFields {
  readonly requestId: string;
  readonly buildId: string;
  readonly projectId: string;
  readonly promptHash: string;
  readonly stage: ContractConsumptionStage;
  readonly functionName: string;
  readonly sourceFile: string;
  readonly branchSelected: string;

  readonly inputProductIdentity: string | null;
  readonly outputProductIdentity: string | null;

  readonly inputModules: readonly string[];
  readonly outputModules: readonly string[];

  readonly inputRoutes: readonly string[];
  readonly outputRoutes: readonly string[];

  readonly inputNavigation: readonly string[];
  readonly outputNavigation: readonly string[];

  readonly inputVisibleText: readonly string[];
  readonly outputVisibleText: readonly string[];

  readonly fallbackSelected: boolean;
  readonly genericTemplateSelected: boolean;

  readonly contractConsumed: boolean;
  readonly cbgaPlanConsumed: boolean;
  readonly promptBoundedModulePlanConsumed: boolean;
  readonly universalFeatureContractConsumed: boolean;
  readonly profileFeatureDefinitionConsumed: boolean;
}

/** One row of the mandatory "contract consumption table" in the final report. */
export interface ContractConsumptionTableRow {
  readonly stage: string;
  readonly functionName: string;
  readonly receivesContract: 'YES' | 'NO' | 'PARTIAL';
  readonly consumesContract: 'YES' | 'NO' | 'PARTIAL';
  readonly consumesCbgaPlan: 'YES' | 'NO' | 'PARTIAL' | 'N/A';
  readonly usesLegacyTemplate: 'YES' | 'NO';
  readonly usesFallback: 'YES' | 'NO';
  readonly outputProductIdentity: string;
  readonly status: string;
}
