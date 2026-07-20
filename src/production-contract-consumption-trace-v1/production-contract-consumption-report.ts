/**
 * Production Contract Consumption Trace V1 — investigation only, no fix, no new authority.
 *
 * Pure, read-only formatting helpers for the trace report. Nothing here scores, gates, blocks, or
 * decides anything about a build — it only renders a markdown table/call-graph from trace fields
 * that were already computed by the real pipeline. These helpers are used exclusively by
 * `scripts/trace-production-contract-consumption-v1.ts` and are safe to delete once that
 * investigation is closed out.
 */

import type { ContractConsumptionTableRow } from './production-contract-consumption-trace-types.js';

export const PRODUCTION_CALL_GRAPH: readonly string[] = [
  'runOnePromptLivePreviewBuild()                                        [src/one-prompt-live-preview/one-prompt-build-orchestrator.ts]',
  '  -> resolvePromptFaithfulBuildPlan(rawPrompt)                        [src/prompt-faithful-generation/index.ts]',
  '       -> runIntentUnderstandingEngine()                              [src/intent-understanding-engine/*]',
  '       -> runPromptFaithfulnessEngineV2()                             [src/prompt-faithful-generation/*]',
  '            -> extractAppName(rawPrompt)                              [src/prompt-faithful-generation/prompt-feature-extractor.ts]  *** STAGE: PROMPT_FEATURE_EXTRACTION ***',
  '       -> resolvePromptBoundedModulePlan(...)                         [src/prompt-bounded-materialization/*]  *** STAGE: PROMPT_BOUNDED_MODULE_PLAN ***',
  '  -> buildCanonicalProductContract({ prompt })                        [src/product-faithfulness-v2/canonical-product-contract.ts]  *** STAGE: CANONICAL_PRODUCT_CONTRACT ***',
  '       -> extractRequestedConcepts(input)                             [src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts]',
  '            -> classifyDomainEvidence(tokens)  (DOMAIN_GLOSSARY match) [src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts]',
  '  -> contractBoundGenerationAuthorityV4({ contract, buildPlan })       [src/contract-bound-generation-authority-v4/*]  *** STAGE: CBGA_REPAIRED_PLAN ***',
  '  -> buildGpcaPreMaterializationReport(...)                           [src/generation-pipeline-compliance-authority-v1/*]  (audit only, not a generator)',
  '  -> runWorkspaceMaterialization()  [fresh build] OR continuation-skip [existing workspace reused]',
  '       -> materializeBuildProofGapArtifacts(...)                      [src/materialization-evidence/*]',
  '            -> resolveDomainCopy() / buildPromptSpecificDomainCopy()   [src/prompt-faithful-generation/prompt-specific-ui-copy-builder.ts]  *** STAGE: CUSTOM_DOMAIN_COPY_BUILDER ***',
  '            -> buildFeatureAppRouterTsx(definition)                   [src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts]  *** STAGE: FEATURE_APP_ROUTER_GENERATION ***',
  '            -> per-module component/service/types/validation files    [src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts]',
  '       -> [continuation-skip] workspaceHasGeneratedFeatureModules()   [src/feature-contract-reality/feature-reality-workspace-fallback-collector.ts]  *** STAGE: WORKSPACE_MATERIALIZATION (branch=CONTINUATION_SKIP) ***',
  '  -> buildGpcaPostMaterializationReport(...)                          [src/generation-pipeline-compliance-authority-v1/*]  (audit only; now also runs on continuation-skip per GPCA Continuation Workspace Compliance Fix V1)',
  '  -> startGeneratedAppDevServer() -> live preview                     [src/one-prompt-live-preview/generated-dev-server-manager.ts]',
];

export function renderCallGraph(): string {
  return PRODUCTION_CALL_GRAPH.join('\n');
}

export function renderConsumptionTable(rows: readonly ContractConsumptionTableRow[]): string {
  const header =
    '| Stage | Function | Receives Contract | Consumes Contract | Consumes CBGA Plan | Uses Legacy Template | Uses Fallback | Output Product Identity | Status |';
  const divider = '|-------|----------|------------------|-------------------|--------------------|-----------------------|----------------|--------------------------|--------|';
  const body = rows.map(
    (r) =>
      `| ${r.stage} | ${r.functionName} | ${r.receivesContract} | ${r.consumesContract} | ${r.consumesCbgaPlan} | ${r.usesLegacyTemplate} | ${r.usesFallback} | ${r.outputProductIdentity} | ${r.status} |`,
  );
  return [header, divider, ...body].join('\n');
}
