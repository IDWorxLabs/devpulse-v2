/**
 * Production Pipeline Constitution V1 — structured constitution data.
 *
 * A machine-readable mirror of `docs/production-pipeline-constitution-v1.md`. Every array below
 * corresponds to one numbered section (or the root-cause mapping / roadmap) of that document, so
 * the validator can assert the constitution is structurally complete, not merely that headings
 * exist in the markdown file.
 *
 * Read-only, additive, documentation-only: this module defines rules for FUTURE milestones to
 * implement. It does not audit, gate, repair, or generate anything itself, and it changes no
 * behavior of GPCA/CBGA/Product Faithfulness/AEO/EIAA/VERE or any production generator.
 */

import type {
  AmendmentLogEntry,
  CapabilityRegistryEntry,
  ClassificationBoundaryEntry,
  ConstitutionalInvariantEntry,
  ConstitutionVersionEntry,
  ConstitutionalTestMatrixEntry,
  ContinuationRuleEntry,
  DependencyGraphEntry,
  EnforcementAuthorityDefinition,
  FinalResultLabelEntry,
  GeneratorRuleEntry,
  GovernanceRuleEntry,
  IllegalPipelineTransitionEntry,
  ImmutableArtifactEntry,
  InterfaceFieldDefinition,
  PipelineDataContractEntry,
  PipelineStateEntry,
  PipelineTransitionEntry,
  PreviewRuleEntry,
  ReauditTriggerEntry,
  RepairCategoryEntry,
  RoadmapTierEntry,
  RootCauseMappingEntry,
  RuleDocumentationExample,
  RuleIdGroup,
  RuleMetadataFieldDefinition,
  RuleRegistryEntry,
  SingleSourceOfTruthRegistryEntry,
  StageOwnershipEntry,
  StagePermissionEntry,
  TraceabilityChainStep,
  ViolationTaxonomyEntry,
} from './production-pipeline-constitution-types.js';

// ===================================================================================================
// 1. Authority ownership
// ===================================================================================================
export const STAGE_OWNERSHIP: readonly StageOwnershipEntry[] = [
  { concept: 'product identity', owningStage: 'CBGA', consumers: ['Blueprint generator', 'Modular feature generator', 'Materialization engine', 'GPCA'] },
  { concept: 'product purpose', owningStage: 'Product Faithfulness (Canonical Product Contract)', consumers: ['CBGA', 'GPCA'] },
  { concept: 'product concepts', owningStage: 'Product Faithfulness (Canonical Product Contract)', consumers: ['CBGA', 'GPCA'] },
  { concept: 'module plan', owningStage: 'CBGA', consumers: ['Materialization engine', 'Blueprint generator', 'GPCA'] },
  { concept: 'feature plan', owningStage: 'Prompt-Bounded Module Plan (repaired by CBGA)', consumers: ['Modular feature generator'] },
  { concept: 'route plan', owningStage: 'CBGA', consumers: ['Blueprint generator', 'Router generator', 'GPCA'] },
  { concept: 'navigation plan', owningStage: 'CBGA', consumers: ['Blueprint product-surface generator', 'GPCA'] },
  { concept: 'visible copy', owningStage: 'Blueprint contract-copy derivation (fed by CBGA-repaired identity/module plan)', consumers: ["Blueprint generator's rendering functions"] },
  { concept: 'sample data', owningStage: 'Modular feature generator (DEMO_DATA-tagged only)', consumers: ['GPCA (classification only)'] },
  { concept: 'validation data', owningStage: 'Modular feature generator (from approved module/field definition)', consumers: ['GPCA (classification only)'] },
  { concept: 'manifest', owningStage: 'Materialization engine (write-once per build)', consumers: ['GPCA', 'downstream tooling'] },
  { concept: 'workspace files', owningStage: 'Materialization engine (initial write) + registered repair systems (post-write)', consumers: ['GPCA', 'dev server', 'preview'] },
  { concept: 'preview evidence', owningStage: 'Live Preview Gate (sourced from a fresh GPCA report)', consumers: ['End user / interaction proof'] },
  { concept: 'repair authority', owningStage: 'AEO (dispatches to registered repair capabilities)', consumers: ['GPCA (must re-audit after)'] },
  { concept: 'mutation authority', owningStage: 'Materialization engine (initial write) + explicitly registered repair capabilities', consumers: [] },
  { concept: 'final build result', owningStage: 'Build outcome policy / AEE final report', consumers: ['API response', 'Chat response', 'UI'] },
];

// ===================================================================================================
// 2. Immutable artifacts
// ===================================================================================================
export const IMMUTABLE_ARTIFACTS: readonly ImmutableArtifactEntry[] = [
  { artifact: 'CanonicalProductContract', approvedBy: 'Product Faithfulness (buildCanonicalProductContract)', immutableFrom: 'The moment it is returned to the orchestrator' },
  { artifact: 'CBGA-repaired generation plan (CbgaGenerationReport + patched build plan)', approvedBy: 'CBGA (applyContractBoundGenerationToBuildPlan)', immutableFrom: 'The moment CBGA returns its report' },
  { artifact: 'Approved module plan (modulePlan.approvedModuleIds)', approvedBy: 'CBGA', immutableFrom: 'Same as CBGA-repaired generation plan' },
  { artifact: 'Approved route plan (modulePlan.routes)', approvedBy: 'CBGA', immutableFrom: 'Same as CBGA-repaired generation plan' },
  { artifact: 'Approved navigation plan (navigationPlan)', approvedBy: 'CBGA', immutableFrom: 'Same as CBGA-repaired generation plan' },
  { artifact: 'Approved surface/copy plan (deriveBlueprintContractCopy output)', approvedBy: 'Blueprint contract-copy derivation (fed only by the CBGA-approved plan)', immutableFrom: 'The moment it is computed for this build' },
  { artifact: 'Approved provenance map (BLUEPRINT_PRODUCT_SURFACE_PROVENANCE, blueprint artifact provenance)', approvedBy: 'Materialization engine, at write time', immutableFrom: 'The moment the file is written' },
];

// ===================================================================================================
// 3. Stage permissions
// ===================================================================================================
export const STAGE_PERMISSIONS: readonly StagePermissionEntry[] = [
  {
    stage: 'Intent Understanding / Prompt Extraction',
    allowedInputs: ['Raw prompt'],
    forbiddenInputs: ["Prior workspace state", "Prior build's contract"],
    allowedOutputs: ['Draft extraction (candidate app name/domain/modules) — explicitly a draft'],
    forbiddenOutputs: ['Anything labeled "final"/"approved"'],
    inferenceAllowed: true,
    fallbackAllowed: true,
    mutationAllowed: false,
    repairAllowed: false,
    previewAllowed: false,
  },
  {
    stage: 'Product Faithfulness (Canonical Product Contract)',
    allowedInputs: ['Raw prompt', 'Optional architecture/PIM context'],
    forbiddenInputs: ['Existing workspace files'],
    allowedOutputs: ['CanonicalProductContract'],
    forbiddenOutputs: ['Module/route/navigation plans (not its job)'],
    inferenceAllowed: true,
    fallbackAllowed: true,
    mutationAllowed: false,
    repairAllowed: false,
    previewAllowed: false,
  },
  {
    stage: 'CBGA',
    allowedInputs: ['CanonicalProductContract (required, never optional)', 'Proposed build plan'],
    forbiddenInputs: ['Raw prompt directly for identity (must go through the contract)'],
    allowedOutputs: ['Repaired build plan', 'navigationPlan', 'modulePlan', 'routePlan', 'repaired identity'],
    forbiddenOutputs: ['Anything that bypasses the contract'],
    inferenceAllowed: false,
    fallbackAllowed: true,
    mutationAllowed: false,
    repairAllowed: true,
    previewAllowed: false,
  },
  {
    stage: 'Materialization / Blueprint / Modular Generators',
    allowedInputs: ['CBGA-repaired build plan (required, non-optional)', 'Approved navigation labels', 'Approved provenance'],
    forbiddenInputs: ['Raw prompt as a product-meaning source', 'Existing workspace file content as evidence'],
    allowedOutputs: ['Workspace files', 'Manifests'],
    forbiddenOutputs: ['A second, independently-derived contract/feature-contract for the same product'],
    inferenceAllowed: false,
    fallbackAllowed: false,
    mutationAllowed: true,
    repairAllowed: false,
    previewAllowed: false,
  },
  {
    stage: 'GPCA',
    allowedInputs: ['Canonical contract', 'CBGA report', 'Build plan', 'Current on-disk generated files'],
    forbiddenInputs: ['A cached/stale report as if it were current'],
    allowedOutputs: ['Compliance report', 'Gate outcome'],
    forbiddenOutputs: ['Any write to the workspace'],
    inferenceAllowed: false,
    fallbackAllowed: false,
    mutationAllowed: false,
    repairAllowed: false,
    previewAllowed: false,
  },
  {
    stage: 'Repair systems (AEO-dispatched)',
    allowedInputs: ['The specific failure class they are registered for', 'Read access to workspace'],
    forbiddenInputs: ["The right to relabel a GPCA verdict"],
    allowedOutputs: ['File writes (real-mutation repairs)', 'In-memory evidence updates (evidence-only repairs) — never both conflated'],
    forbiddenOutputs: ['A GPCA "ALLOWED" verdict produced without GPCA re-running'],
    inferenceAllowed: false,
    fallbackAllowed: false,
    mutationAllowed: true,
    repairAllowed: true,
    previewAllowed: false,
  },
  {
    stage: 'Live Preview Gate',
    allowedInputs: ['The most recent GPCA report', 'Current workspace path'],
    forbiddenInputs: ['A GPCA report older than the last workspace mutation'],
    allowedOutputs: ['Unlock / lock decision'],
    forbiddenOutputs: ['Unlock decision based on pipeline evidence alone without GPCA'],
    inferenceAllowed: false,
    fallbackAllowed: false,
    mutationAllowed: false,
    repairAllowed: false,
    previewAllowed: true,
  },
  {
    stage: 'Preview / Dev Server',
    allowedInputs: ['Approved workspaceDir'],
    forbiddenInputs: ['A different/stale workspace path'],
    allowedOutputs: ['Running preview URL'],
    forbiddenOutputs: ['Serving content from a directory GPCA did not audit'],
    inferenceAllowed: false,
    fallbackAllowed: false,
    mutationAllowed: false,
    repairAllowed: false,
    previewAllowed: true,
  },
];

// ===================================================================================================
// 4. Generator rules
// ===================================================================================================
export const GENERATOR_RULES: readonly GeneratorRuleEntry[] = [
  { id: 'GEN-1', rule: 'Generators must consume approved inputs; any fallback to a prompt-re-derivation function on a contract-shaped parameter is a constitutional violation.' },
  { id: 'GEN-2', rule: 'Generators may not derive identity from raw prompt; app name/domain/purpose must come from the CBGA-repaired plan.' },
  { id: 'GEN-3', rule: 'Generators may not derive navigation from file existence; a nav item is visible only if present in the CBGA-approved navigation plan.' },
  { id: 'GEN-4', rule: 'Generators may not invent sample records without provenance; seed/demo/sample data must carry a DEMO_DATA provenance marker.' },
  { id: 'GEN-5', rule: 'Generators may not emit default shell product labels unconditionally; default-shell labels may only render when present in the CBGA-approved navigation plan.' },
  { id: 'GEN-6', rule: 'Generators may not use profile templates as product truth; profile-keyed copy is a last-resort fallback, never a substitute for available contract-derived copy.' },
  { id: 'GEN-7', rule: 'Generators may not use stale workspace files as evidence; file content from a previous build may never be read to infer product meaning for a new build.' },
  { id: 'GEN-8', rule: 'Generators may not mutate a workspace after GPCA without triggering re-audit before that workspace may be served to preview.' },
];

// ===================================================================================================
// 5. Repair rules
// ===================================================================================================
export const REPAIR_CATEGORIES: readonly RepairCategoryEntry[] = [
  {
    categoryId: 'EVIDENCE_ONLY',
    label: 'Evidence-only repair',
    allowedScope: "Reconciling in-memory audit/report objects when the same evidence already exists elsewhere in the build's own evidence set",
    forbiddenScope: 'Claiming a concept was "fixed" when no file changed; relabeling a build outcome as if regeneration occurred',
    canMutateFiles: false,
    gpcaReauditRequired: false,
    productFaithfulnessReauditRequired: false,
    previewMayProceedAfter: 'Unaffected — preview status must not change because of an evidence-only repair',
  },
  {
    categoryId: 'GENERATION',
    label: 'Generation repair',
    allowedScope: 'Repairing the plan before materialization',
    forbiddenScope: 'Repairing already-materialized files directly',
    canMutateFiles: false,
    gpcaReauditRequired: false,
    productFaithfulnessReauditRequired: false,
    previewMayProceedAfter: 'Not applicable (runs before first materialization)',
  },
  {
    categoryId: 'WORKSPACE',
    label: 'Workspace repair',
    allowedScope: 'Structural workspace fixes (missing config files, malformed manifests)',
    forbiddenScope: 'Rewriting product content, copy, navigation, or identity',
    canMutateFiles: true,
    gpcaReauditRequired: true,
    productFaithfulnessReauditRequired: false,
    previewMayProceedAfter: 'Only after GPCA re-audit passes',
  },
  {
    categoryId: 'COMPILER',
    label: 'Compiler repair',
    allowedScope: 'Fixing TypeScript/build errors in already-generated files',
    forbiddenScope: 'Introducing new product content, new navigation, new copy',
    canMutateFiles: true,
    gpcaReauditRequired: true,
    productFaithfulnessReauditRequired: false,
    previewMayProceedAfter: 'Only after GPCA re-audit passes',
  },
  {
    categoryId: 'RUNTIME',
    label: 'Runtime repair',
    allowedScope: 'Re-running a failed command',
    forbiddenScope: 'Modifying source file content',
    canMutateFiles: false,
    gpcaReauditRequired: false,
    productFaithfulnessReauditRequired: false,
    previewMayProceedAfter: 'Unaffected',
  },
  {
    categoryId: 'MISSING_CAPABILITY',
    label: 'Missing-capability repair',
    allowedScope: 'Generating a genuinely new capability/module GPCA/AEO proved the generator cannot produce',
    forbiddenScope: 'Bypassing GPCA to add the capability, or adding it without contract justification',
    canMutateFiles: true,
    gpcaReauditRequired: true,
    productFaithfulnessReauditRequired: true,
    previewMayProceedAfter: 'Only after both GPCA and Product Faithfulness re-audits pass',
  },
];

// ===================================================================================================
// 6. Re-audit rules
// ===================================================================================================
export const REAUDIT_TRIGGERS: readonly ReauditTriggerEntry[] = [
  { id: 'REAUDIT-1', trigger: 'After materialization' },
  { id: 'REAUDIT-2', trigger: 'After workspace stabilizer writes' },
  { id: 'REAUDIT-3', trigger: 'After build autofix writes' },
  { id: 'REAUDIT-4', trigger: 'After engineering intelligence writes' },
  { id: 'REAUDIT-5', trigger: 'After capability evolution writes' },
  { id: 'REAUDIT-6', trigger: 'After continuation workspace reuse' },
  { id: 'REAUDIT-7', trigger: 'Immediately before preview activation' },
];

// ===================================================================================================
// 7. Continuation rules
// ===================================================================================================
export const CONTINUATION_RULES: readonly ContinuationRuleEntry[] = [
  { id: 'CONT-1', rule: 'Existing workspace cannot be trusted by presence alone; compliance must still be proven by a fresh GPCA audit every time.' },
  { id: 'CONT-2', rule: 'The file list GPCA audits on continuation must include all generated product and blueprint artifacts, not just feature modules and App.tsx.' },
  { id: 'CONT-3', rule: 'Stale workspace files must not become generation evidence for a new build plan.' },
  { id: 'CONT-4', rule: 'The same module ID with a different meaning across builds must force regeneration or revalidation.' },
  { id: 'CONT-5', rule: 'Continuation must use the same constitution as fresh builds; there is no lighter compliance tier for continuation.' },
];

// ===================================================================================================
// 8. Traceability rules
// ===================================================================================================
export const TRACEABILITY_CHAIN: readonly TraceabilityChainStep[] = [
  { order: 1, step: 'Prompt' },
  { order: 2, step: 'CanonicalProductContract' },
  { order: 3, step: 'CBGA plan' },
  { order: 4, step: 'generator input' },
  { order: 5, step: 'file/content output' },
  { order: 6, step: 'GPCA evidence' },
  { order: 7, step: 'preview evidence' },
];

// ===================================================================================================
// 9. Classification rules
// ===================================================================================================
export const CLASSIFICATION_BOUNDARIES: readonly ClassificationBoundaryEntry[] = [
  { boundary: 'Infrastructure vs product', rule: 'Infrastructure may contain zero business identity; any business-facing prose makes a file product or mixed, never infrastructure.' },
  { boundary: 'Navigation vs sample data', rule: 'A label field is navigation only if part of a data structure explicitly marked as navigation (e.g. shellPrimaryNavItems, navigationPlan-sourced); never a feature module record/seed field.' },
  { boundary: 'Module content vs navigation', rule: "A module's internal display name is module content; only CBGA-approved navigationPlan entries are navigation, even if string values match." },
  { boundary: 'Preview entries vs business records', rule: 'Demonstration/seed/sample content must carry a distinguishing marker and never be evaluated as real business content during faithfulness/compliance auditing.' },
  { boundary: 'Pages vs features', rule: 'A top-level routed screen (page) and a reusable contract-bound functionality unit (feature module) are different artifact kinds and must not collapse into a single PRODUCT bucket.' },
  { boundary: 'Metadata vs product evidence', rule: 'Build metadata (manifests, package.json, provenance JSON) is never product-content evidence and must be excluded from content-based classification.' },
  { boundary: 'Shell structure vs visible product copy', rule: 'The container (nav slot, layout, routing logic) is shell structure; strings rendered inside it are visible product copy, classified per-string where the two are mixed.' },
];

// ===================================================================================================
// 10. Preview rules
// ===================================================================================================
export const PREVIEW_RULES: readonly PreviewRuleEntry[] = [
  { id: 1, rule: 'GPCA report is fresh — produced after the most recent write to the workspace.' },
  { id: 2, rule: 'Workspace has not been mutated after GPCA, or a passing re-audit has completed since.' },
  { id: 3, rule: 'Preview path equals audited workspace path — byte-identical resolved absolute path.' },
  { id: 4, rule: 'Live Preview Gate has current GPCA evidence as a required evidence source, not merely other pipeline evidence.' },
  { id: 5, rule: 'Interaction proof tests the audited app, not stale server output from a reused process serving a different build.' },
];

// ===================================================================================================
// 11. Final result rules
// ===================================================================================================
export const FINAL_RESULT_LABELS: readonly FinalResultLabelEntry[] = [
  { id: 1, label: 'BUILT_SUCCESSFULLY', description: 'Materialized, GPCA-compliant, preview-verified.' },
  { id: 2, label: 'BUILT_BUT_CONTRACT_BLOCKED', description: 'GPCA blocked before materialization/preview could be attempted.' },
  { id: 3, label: 'BUILT_BUT_PREVIEW_BLOCKED', description: 'Materialization succeeded and was GPCA-compliant, but the Live Preview Gate could not unlock.' },
  { id: 4, label: 'BUILT_AFTER_REAL_REPAIR', description: 'A file-mutating repair ran and a fresh GPCA (and, if applicable, Product Faithfulness) re-audit passed afterward.' },
  { id: 5, label: 'FAILED_AFTER_EVIDENCE_ONLY_REPAIR', description: 'An evidence-only repair ran but the underlying failure was not resolved because no file changed; must never share wording with label 4.' },
  { id: 6, label: 'FAILED_MISSING_CAPABILITY', description: 'AEO/EIAA correctly determined the generator lacks a capability the contract requires, and no auto-repair path exists.' },
  { id: 7, label: 'FAILED_CONSTITUTION_VIOLATION', description: 'A generator produced output this constitution forbids (independently-derived identity, unapproved navigation, stale-content reuse) — distinct from a content-quality block.' },
];

// ===================================================================================================
// Root cause mapping — Production Generation Architecture Audit V1
// ===================================================================================================
export const ROOT_CAUSE_MAPPINGS: readonly RootCauseMappingEntry[] = [
  {
    code: 'A',
    name: 'Contract inputs are optional everywhere',
    constitutionalRule: '§3 Stage Permissions (Materialization/Blueprint/Modular Generators: Fallback allowed = No); §4 Generator Rule GEN-1',
    stagesAffected: ['materializeGeneratedApplication', 'buildUniversalMaterializedWorkspaceFiles', 'buildUniversalFeatureContract', 'resolvePromptBoundedModulePlan'],
    implementationImplication: 'Every contract-shaped parameter currently optional with a prompt-re-derivation fallback must become required, or the fallback path must be classified as a constitutional violation rather than silently succeeding.',
    suggestedMilestone: 'Contract Parameter Enforcement V1 (Roadmap Tier 3/4)',
  },
  {
    code: 'B',
    name: 'Multiple independent identity computations',
    constitutionalRule: '§1 Authority Ownership (product identity owned solely by CBGA); §4 Generator Rule GEN-2',
    stagesAffected: ['extractAppName', 'extractPromptAppTitle', "buildCanonicalProductContract's productIdentity", "CBGA's identity repair", "buildFeatureAppRouterTsx's headline-split", "UFCI's productName"],
    implementationImplication: 'Collapse ~6 independent identity-deriving functions into calls to a single resolved (CBGA-repaired) value.',
    suggestedMilestone: 'Identity Computation Collapse V1 (Roadmap Tier 3)',
  },
  {
    code: 'C',
    name: 'GPCA audits a snapshot, not an invariant',
    constitutionalRule: '§6 Re-Audit Rules (all seven triggers); §10 Preview Rules 1-2',
    stagesAffected: ['workspace stabilizer', 'AEE build-autofix loop', 'Engineering Intelligence Runtime', 'AEL capability-evolution runtime', "orchestrator's final pre-preview gate"],
    implementationImplication: 'Every file-mutating stage after the first GPCA audit must trigger a fresh audit before control returns to the preview-activation path.',
    suggestedMilestone: 'GPCA Invariant Enforcement V1 (Roadmap Tier 1)',
  },
  {
    code: 'D',
    name: 'Traceability is plan lookup and word overlap, not provenance',
    constitutionalRule: '§8 Traceability Rules (emitted provenance primary, heuristic matching secondary only)',
    stagesAffected: ['contract-traceability.ts (navigationTraceability, surfaceTraceability)', 'rendered-content-fingerprints.ts (referencesContractVocabulary)'],
    implementationImplication: 'Extend GPCA to read generators\u2019 emitted provenance tags as the primary traceability signal.',
    suggestedMilestone: 'Provenance-Backed Traceability V1 (Roadmap Tier 5)',
  },
  {
    code: 'E',
    name: 'Regex-shape-specific extraction bugs',
    constitutionalRule: '§8 Traceability Rules (provenance over heuristic re-derivation); §9 Classification Rules (classification must not miss content due to syntax shape)',
    stagesAffected: ['extractQuotedFieldValues', 'extractNavigationLabels', 'extractAllVisibleTextNodes', 'other rendered-content-fingerprints.ts extractors'],
    implementationImplication: 'Replace field-shape-specific regexes with a single shared, shape-tolerant literal extractor or minimal structural (AST-based) extraction.',
    suggestedMilestone: 'Structural Extraction Replacement V1 (Roadmap Tier 4)',
  },
  {
    code: 'F',
    name: 'Repairs patch evidence, not reality',
    constitutionalRule: '§5 Repair Rules (Evidence-only repair category); §11 Final Result Rule label 5 and mislabeling prohibition',
    stagesAffected: ["Product Faithfulness V2's repairAndReaudit", 'build-result-normalizer relabeling', 'AEE preview-gate synthesis', 'AEE failure-reason/profile-mismatch suppression'],
    implementationImplication: 'Audit every repair code path\u2019s reporting language; ensure none imply file regeneration when none occurred.',
    suggestedMilestone: 'Evidence-Only Repair Labeling Clarity V1 (Roadmap Tier 6)',
  },
  {
    code: 'G',
    name: 'Infrastructure/product boundary tension',
    constitutionalRule: '§9 Classification Rules (Infrastructure vs product; Shell structure vs visible product copy)',
    stagesAffected: ['Welcome/Onboarding/Auth/Profile/Settings/Help/Feedback/Legal blueprint pages', '~15 downstream authorities requiring these files to exist'],
    implementationImplication: 'Accepted, previously-scoped trade-off; per-string classification may eventually reduce residue without requiring file removal.',
    suggestedMilestone: 'No new milestone mandated by this document (remains an accepted, documented trade-off).',
  },
  {
    code: 'H',
    name: 'Continuation-path GPCA audits incomplete file list',
    constitutionalRule: '§7 Continuation Rule CONT-2',
    stagesAffected: ['listExistingWorkspaceGeneratedFilePaths in one-prompt-build-orchestrator.ts'],
    implementationImplication: 'Extend the enumerator to include src/blueprint/** and any other top-level generated directory.',
    suggestedMilestone: 'Continuation File-List Completeness Fix V1 (Roadmap Tier 0)',
  },
];

// ===================================================================================================
// Implementation roadmap
// ===================================================================================================
export const ROADMAP_TIERS: readonly RoadmapTierEntry[] = [
  {
    tier: 0,
    name: 'Close the continuation file-list gap',
    objective: 'Make continuation-path GPCA audits see every generated product and blueprint artifact, not just feature modules and App.tsx.',
    affectedSystems: ['listExistingWorkspaceGeneratedFilePaths (one-prompt-build-orchestrator.ts)'],
    whyBeforeLater: 'Every other tier assumes GPCA is auditing complete evidence; improving how or when GPCA reasons does not matter for files it never reads.',
    blockersEliminated: 'Silent continuation-path bypass of nav/shell-content compliance, including Contract-Bound Navigation Shell Fix V1.',
    validationStrategy: "A validator proving the enumerator's output set includes every path fresh materialization's generatedFiles would include for an equivalent build.",
  },
  {
    tier: 1,
    name: 'Make GPCA a final invariant after every post-audit mutation',
    objective: 'Re-run GPCA after every mutating stage (stabilizer, build-autofix, Engineering Intelligence, AEL) and make the final pre-preview gate consult a guaranteed-fresh report.',
    affectedSystems: ['one-prompt-build-orchestrator.ts', 'workspace-materialization-stabilizer-v1', 'aee-build-autofix-loop.ts', 'engineering-intelligence-runtime', 'autonomous-engineering-loop'],
    whyBeforeLater: 'Closes the mechanism by which a compliant build can still serve non-compliant content; fixing generator content later is pointless if this can silently undo it.',
    blockersEliminated: 'The entire class of "GPCA said ALLOWED but the browser shows something else" bugs.',
    validationStrategy: 'A validator simulating a post-audit mutation for each of the four mutating stages, proving re-audit or a preview block occurs.',
  },
  {
    tier: 2,
    name: 'Remove self-inflicted placeholder/template text blocks',
    objective: 'Remove the literal word "placeholder" and equivalent always-generic wording from Settings/Legal/Profile/Help Center shell pages.',
    affectedSystems: ['universal-app-blueprint-generator.ts (build*Page functions)'],
    whyBeforeLater: 'Small and isolated; clears noise so later tiers\u2019 validation results are conclusive rather than confounded by this leftover wording.',
    blockersEliminated: "GPCA's own placeholder-fingerprint self-block on otherwise-compliant builds.",
    validationStrategy: 'Re-run the existing GPCA Rendered Content Evidence fingerprint checks against modified page output; confirm zero matches remain.',
  },
  {
    tier: 3,
    name: 'Collapse parallel identity computations',
    objective: 'Make every site that re-derives app name/identity/domain from raw prompt instead consume the single CBGA-repaired identity.',
    affectedSystems: ['prompt-feature-extractor.ts', 'prompt-app-metadata.ts', 'modular-feature-module-generator.ts', 'universal-feature-contract-builder.ts'],
    whyBeforeLater: 'Direct fix for the recurring wrong-identity bug class; doing this before Tier 4/5 means those tiers extend a genuinely single-source system.',
    blockersEliminated: 'The recurring "wrong product identity/domain in one specific generator" bug class, including future instances shaped like it.',
    validationStrategy: 'A validator asserting all identity-consuming call sites resolve to the same value for a representative set of synthetic prompts.',
  },
  {
    tier: 4,
    name: 'Replace regex extraction with structural extraction',
    objective: "Replace GPCA's field-shape-specific regexes with a single shared, shape-tolerant extraction approach.",
    affectedSystems: ['rendered-content-fingerprints.ts', 'rendered-content-collector.ts'],
    whyBeforeLater: "Tier 5's provenance-based traceability still needs a reliable secondary signal for artifact classes without provenance tags.",
    blockersEliminated: 'The "same bug, different field" recurrence pattern already found once for navigation label: and found again for 5+ other fields.',
    validationStrategy: 'A validator exercising every extractor against every quoting/key-style variant for every currently-extracted field.',
  },
  {
    tier: 5,
    name: 'Move traceability from heuristic matching to emitted provenance',
    objective: "Make GPCA consume generators' emitted provenance tags as the primary traceability signal.",
    affectedSystems: ['contract-traceability.ts', "blueprint/modular generators' provenance-emission code"],
    whyBeforeLater: "Largest blast radius of the substantive tiers; sequenced after Tiers 0-4 remove the false-positive/negative pressure that would otherwise confound its validation.",
    blockersEliminated: 'False-pass traceability (substring/word-overlap collisions) and false-fail traceability (exact-string/JSX-invisible content).',
    validationStrategy: "A validator comparing outcomes under the new mechanism against the old across the audit's documented false-pass/false-fail scenarios.",
  },
  {
    tier: 6,
    name: 'Clarify evidence-only repair wording',
    objective: 'Ensure no reporting layer describes an evidence-only repair using language implying real file regeneration.',
    affectedSystems: ['generation-faithfulness-repair.ts', 'build-result-normalizer.ts', 'aee-preview-contract.ts', 'aee-production-response.ts'],
    whyBeforeLater: 'Lowest severity, no dependency relationship with other tiers; sequenced last purely by severity, not by blocking relationship.',
    blockersEliminated: 'Operator/user-facing false confidence that a build was "repaired" when nothing on disk changed.',
    validationStrategy: 'A validator asserting every evidence-only-repair code path never emits "repaired"/"fixed"/"resolved" wording.',
  },
];

// =====================================================================================================
// Amendment Set 1 (2026-07-09) — Rule IDs, Rule Metadata, Invariants, State Machine, PPCEA, Governance
// =====================================================================================================

// -----------------------------------------------------------------------------------------------------
// Amendment 2 — permanent rule-ID hundred-block groups. Never renumbered; never reused.
// -----------------------------------------------------------------------------------------------------
export const RULE_ID_GROUPS: readonly RuleIdGroup[] = [
  { prefix: 'PPC-1xx', name: 'Authority Ownership', sectionAnchor: 'PPC-100' },
  { prefix: 'PPC-2xx', name: 'Immutable Artifacts', sectionAnchor: 'PPC-200' },
  { prefix: 'PPC-3xx', name: 'Stage Permissions & Read/Write/Mutate Boundaries', sectionAnchor: 'PPC-300' },
  { prefix: 'PPC-4xx', name: 'Generator Rules', sectionAnchor: 'PPC-400' },
  { prefix: 'PPC-5xx', name: 'Repair Rules', sectionAnchor: 'PPC-500' },
  { prefix: 'PPC-6xx', name: 'Re-Audit Rules', sectionAnchor: 'PPC-600' },
  { prefix: 'PPC-7xx', name: 'Continuation Rules', sectionAnchor: 'PPC-700' },
  { prefix: 'PPC-8xx', name: 'Traceability Rules', sectionAnchor: 'PPC-800' },
  { prefix: 'PPC-9xx', name: 'Classification Rules', sectionAnchor: 'PPC-900' },
  { prefix: 'PPC-10xx', name: 'Preview Rules', sectionAnchor: 'PPC-1000' },
  { prefix: 'PPC-11xx', name: 'Final Result Rules', sectionAnchor: 'PPC-1100' },
  { prefix: 'PPC-12xx', name: 'Constitutional Invariants', sectionAnchor: 'PPC-1200' },
  { prefix: 'PPC-13xx', name: 'Canonical Pipeline State Machine', sectionAnchor: 'PPC-1300' },
  { prefix: 'PPC-14xx', name: 'Constitution Enforcement Authority (PPCEA)', sectionAnchor: 'PPC-1400' },
  { prefix: 'PPC-15xx', name: 'Constitution Governance', sectionAnchor: 'PPC-1500' },
  { prefix: 'PPC-16xx', name: 'Single Source of Truth Registry', sectionAnchor: 'PPC-1600' },
  { prefix: 'PPC-17xx', name: 'Canonical Pipeline Data Contract', sectionAnchor: 'PPC-1700' },
  { prefix: 'PPC-18xx', name: 'Generator Interface Standard', sectionAnchor: 'PPC-1800' },
  { prefix: 'PPC-19xx', name: 'Authority Interface Standard', sectionAnchor: 'PPC-1900' },
  { prefix: 'PPC-20xx', name: 'Constitutional Capability Registry', sectionAnchor: 'PPC-2000' },
  { prefix: 'PPC-21xx', name: 'Violation Taxonomy', sectionAnchor: 'PPC-2100' },
  { prefix: 'PPC-22xx', name: 'Constitutional Dependency Graph', sectionAnchor: 'PPC-2200' },
  { prefix: 'PPC-23xx', name: 'Constitution Versioning', sectionAnchor: 'PPC-2300' },
  { prefix: 'PPC-24xx', name: 'Constitutional Test Matrix', sectionAnchor: 'PPC-2400' },
];

// -----------------------------------------------------------------------------------------------------
// Amendment 3 — Rule Metadata Standard (the six fields every rule ID carries).
// -----------------------------------------------------------------------------------------------------
export const RULE_METADATA_FIELDS: readonly RuleMetadataFieldDefinition[] = [
  { field: 'Rule ID', description: 'Permanent identifier in the form PPC-<group><sequence>. Never renumbered, never reused, even after deprecation.' },
  { field: 'Owner', description: 'The authority accountable for upholding the rule. For rules constraining a specific stage, the owner is that stage; for cross-stage invariants, the owner is PPCEA (§PPC-1400) once implemented, or self-accountable per-authority until then.' },
  { field: 'Validator', description: 'The concrete mechanism that would detect a violation today (an existing GPCA/CBGA/milestone validator) or "PPCEA (planned)" if no automated check exists yet.' },
  { field: 'Severity', description: 'BLOCKING (must prevent build/preview from proceeding), STRUCTURAL (an architectural violation that must be fixed but is not itself a live safety gate), or ADVISORY (documentation/consistency guidance without an automatic gate).' },
  { field: 'Auto-fix Eligibility', description: 'YES (a registered repair category, §PPC-500, may deterministically fix a violation), NO (requires regeneration or a human/architectural decision), or PARTIAL.' },
  { field: 'Rationale', description: 'A one-line reason the rule exists, expandable into the full Purpose/History/Expected-Failure-Prevented format (Amendment 7) as historical record accumulates.' },
];

// -----------------------------------------------------------------------------------------------------
// PPC-100 — Authority Ownership (permanent IDs for STAGE_OWNERSHIP, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_100: readonly RuleRegistryEntry[] = STAGE_OWNERSHIP.map((entry, i) => ({
  id: `PPC-${101 + i}`,
  group: 'PPC-1xx',
  statement: `${entry.concept} is owned exclusively by: ${entry.owningStage}.`,
  owner: entry.owningStage,
  validator: 'PPCEA (planned)',
  severity: 'STRUCTURAL' as const,
  autoFixEligible: 'NO' as const,
  rationale: `Exactly one authority may author "${entry.concept}"; every other stage listed under Authority Ownership is a read-only consumer.`,
}));

// -----------------------------------------------------------------------------------------------------
// PPC-200 — Immutable Artifacts (permanent IDs for IMMUTABLE_ARTIFACTS, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_200: readonly RuleRegistryEntry[] = IMMUTABLE_ARTIFACTS.map((entry, i) => ({
  id: `PPC-${201 + i}`,
  group: 'PPC-2xx',
  statement: `${entry.artifact} becomes immutable ${entry.immutableFrom.toLowerCase()}; downstream systems may only consume or fail against it.`,
  owner: entry.approvedBy,
  validator: 'PPCEA (planned)',
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Re-deriving or silently rewriting an already-approved artifact is the direct mechanism behind identity/navigation/copy drift documented in the Architecture Audit (Part 2).',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-300 — Stage Permissions & Read/Write/Mutate Boundaries (Amendment 4).
// Permanent IDs for STAGE_PERMISSIONS, in the same order, expanded into explicit R/W/Mutate boundaries.
// -----------------------------------------------------------------------------------------------------
export interface StageReadWriteMutateBoundary {
  readonly id: string;
  readonly stage: string;
  readonly mayRead: readonly string[];
  readonly mustNeverRead: readonly string[];
  readonly mayWrite: readonly string[];
  readonly mustNeverWrite: readonly string[];
  readonly mayMutate: readonly string[];
  readonly mustNeverMutate: readonly string[];
}

export const STAGE_READ_WRITE_MUTATE_BOUNDARIES: readonly StageReadWriteMutateBoundary[] = STAGE_PERMISSIONS.map((p, i) => ({
  id: `PPC-${301 + i}`,
  stage: p.stage,
  mayRead: p.allowedInputs,
  mustNeverRead: p.forbiddenInputs,
  mayWrite: p.allowedOutputs,
  mustNeverWrite: p.forbiddenOutputs,
  mayMutate: p.mutationAllowed ? p.allowedOutputs : [],
  mustNeverMutate: p.mutationAllowed
    ? ['Files outside this stage\u2019s own registered scope']
    : ['Any workspace file (this stage has no mutation authority)'],
}));

export const RULE_REGISTRY_PPC_300: readonly RuleRegistryEntry[] = STAGE_READ_WRITE_MUTATE_BOUNDARIES.map((b) => ({
  id: b.id,
  group: 'PPC-3xx',
  statement: `${b.stage}: May Read [${b.mayRead.join('; ')}]. Must Never Read [${b.mustNeverRead.join('; ')}]. May Write [${b.mayWrite.join('; ')}]. Must Never Write [${b.mustNeverWrite.join('; ')}]. May Mutate [${b.mayMutate.join('; ') || 'nothing'}]. Must Never Mutate [${b.mustNeverMutate.join('; ')}].`,
  owner: b.stage,
  validator: 'PPCEA (planned)',
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Eliminates ambiguity about what each stage is structurally permitted to touch, independent of what it happens to do correctly today.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-400 — Generator Rules (permanent IDs for GENERATOR_RULES, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_400: readonly RuleRegistryEntry[] = GENERATOR_RULES.map((entry, i) => ({
  id: `PPC-${401 + i}`,
  group: 'PPC-4xx',
  statement: entry.rule,
  owner: 'Materialization / Blueprint / Modular Generators',
  validator:
    i === 2
      ? 'Contract-Bound Navigation Shell Fix V1 validator (existing, partial coverage) / PPCEA (planned, full coverage)'
      : 'PPCEA (planned)',
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Generator-rule violations are the single largest documented source of product-identity, navigation, and copy drift (Architecture Audit Root Causes A, B, G).',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-500 — Repair Rules (permanent IDs for REPAIR_CATEGORIES, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_500: readonly RuleRegistryEntry[] = REPAIR_CATEGORIES.map((entry, i) => ({
  id: `PPC-${501 + i}`,
  group: 'PPC-5xx',
  statement: `${entry.label}: allowed scope = ${entry.allowedScope}; forbidden scope = ${entry.forbiddenScope}; can mutate files = ${entry.canMutateFiles ? 'YES' : 'NO'}; GPCA re-audit required after = ${entry.gpcaReauditRequired ? 'YES' : 'NO'}.`,
  owner: 'AEO (dispatch) + the specific repair capability',
  validator: 'PPCEA (planned)',
  severity: entry.canMutateFiles ? ('BLOCKING' as const) : ('STRUCTURAL' as const),
  autoFixEligible: entry.categoryId === 'EVIDENCE_ONLY' ? ('NO' as const) : ('PARTIAL' as const),
  rationale: 'Conflating evidence-only repair with real, file-mutating repair is the exact mechanism behind Architecture Audit Root Cause F (repairs patch evidence, not reality).',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-600 — Re-Audit Rules (permanent IDs for REAUDIT_TRIGGERS, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_600: readonly RuleRegistryEntry[] = REAUDIT_TRIGGERS.map((entry, i) => ({
  id: `PPC-${601 + i}`,
  group: 'PPC-6xx',
  statement: `GPCA must re-run: ${entry.trigger}.`,
  owner: 'GPCA',
  validator: 'PPCEA (planned) — no production trigger currently enforces all seven uniformly (Architecture Audit Root Cause C)',
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'A GPCA report is only valid for the exact workspace state it audited; treating an older report as current is the exact mechanism behind Architecture Audit Root Cause C.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-700 — Continuation Rules (permanent IDs for CONTINUATION_RULES, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_700: readonly RuleRegistryEntry[] = CONTINUATION_RULES.map((entry, i) => ({
  id: `PPC-${701 + i}`,
  group: 'PPC-7xx',
  statement: entry.rule,
  owner: 'One-Prompt Build Orchestrator (continuation branch)',
  validator: i === 1 ? 'PPCEA (planned) — this is the exact gap documented as Architecture Audit Root Cause H' : 'PPCEA (planned)',
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Continuation is not a lighter compliance tier; every continuation rule exists to prevent a stale or incompletely-audited workspace from reaching preview.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-800 — Traceability Rules.
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_800: readonly RuleRegistryEntry[] = [
  {
    id: 'PPC-801',
    group: 'PPC-8xx',
    statement:
      'Every generated artifact must prove the ancestry chain Prompt \u2192 CanonicalProductContract \u2192 CBGA plan \u2192 generator input \u2192 file/content output \u2192 GPCA evidence \u2192 preview evidence, in order, with no link skipped. If any link is missing, generation must fail.',
    owner: 'GPCA',
    validator: 'PPCEA (planned)',
    severity: 'BLOCKING',
    autoFixEligible: 'NO',
    rationale: 'A partial ancestry chain is indistinguishable from a fabricated one; both must be treated as a failure, not a pass.',
  },
  {
    id: 'PPC-802',
    group: 'PPC-8xx',
    statement: 'Ancestry must be provable by emitted provenance (a tag recording which approved-plan field a generator used), not solely by re-derived heuristics.',
    owner: 'Materialization / Blueprint / Modular Generators (emit) + GPCA (consume)',
    validator: 'PPCEA (planned) — see Roadmap Tier 5',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Heuristic-only traceability (plan lookup, word overlap) is the exact mechanism behind Architecture Audit Root Cause D.',
  },
  {
    id: 'PPC-803',
    group: 'PPC-8xx',
    statement: 'Heuristic matching (plan-membership lookup, word-overlap scoring) remains an acceptable secondary, defense-in-depth check, but must never be the only mechanism proving traceability once emitted provenance is available for a given artifact class.',
    owner: 'GPCA',
    validator: 'PPCEA (planned)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Demoting (not deleting) heuristic matching preserves defense-in-depth while removing it as a single point of failure.',
  },
];

// -----------------------------------------------------------------------------------------------------
// PPC-900 — Classification Rules (permanent IDs for CLASSIFICATION_BOUNDARIES, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_900: readonly RuleRegistryEntry[] = CLASSIFICATION_BOUNDARIES.map((entry, i) => ({
  id: `PPC-${901 + i}`,
  group: 'PPC-9xx',
  statement: `${entry.boundary}: ${entry.rule}`,
  owner: 'GPCA / Infrastructure vs Product Boundary Authority',
  validator: i === 0 ? 'Infrastructure vs Product Boundary Authority V1 (existing)' : 'PPCEA (planned)',
  severity: 'STRUCTURAL' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'A single shared extractor applied uniformly across a whole file is what causes classification boundaries to blur into MIXED/UNKNOWN misclassification.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-1000 — Preview Rules (permanent IDs for PREVIEW_RULES, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_1000: readonly RuleRegistryEntry[] = PREVIEW_RULES.map((entry, i) => ({
  id: `PPC-${1001 + i}`,
  group: 'PPC-10xx',
  statement: entry.rule,
  owner: 'Live Preview Gate',
  validator: 'PPCEA (planned)',
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'All five conditions must hold simultaneously; any single failing condition invalidates the others regardless of how many stages otherwise reported success.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-1100 — Final Result Rules (permanent IDs for FINAL_RESULT_LABELS, in the same order).
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY_PPC_1100: readonly RuleRegistryEntry[] = FINAL_RESULT_LABELS.map((entry, i) => ({
  id: `PPC-${1101 + i}`,
  group: 'PPC-11xx',
  statement: `${entry.label}: ${entry.description}`,
  owner: 'Build outcome policy / AEE final report',
  validator: entry.label === 'FAILED_AFTER_EVIDENCE_ONLY_REPAIR' ? 'PPCEA (planned) — see Roadmap Tier 6' : 'PPCEA (planned)',
  severity: 'STRUCTURAL' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Mislabeling outcome 5 as outcome 4 (Architecture Audit Root Cause F) produces false operator/user confidence that a real repair occurred.',
}));

// -----------------------------------------------------------------------------------------------------
// Amendment 6 — PPC-1200 Constitutional Invariants.
// -----------------------------------------------------------------------------------------------------
export const CONSTITUTIONAL_INVARIANTS: readonly ConstitutionalInvariantEntry[] = [
  { id: 'PPC-1201', statement: 'Exactly one owner exists for every product concept.', relatedRuleGroup: 'PPC-1xx (Authority Ownership)' },
  { id: 'PPC-1202', statement: 'Every generated artifact has one ancestry chain.', relatedRuleGroup: 'PPC-8xx (Traceability Rules)' },
  { id: 'PPC-1203', statement: 'Every workspace mutation invalidates the previous GPCA report.', relatedRuleGroup: 'PPC-6xx (Re-Audit Rules)' },
  { id: 'PPC-1204', statement: 'Generators consume only approved inputs.', relatedRuleGroup: 'PPC-4xx (Generator Rules)' },
  { id: 'PPC-1205', statement: 'Preview never occurs without a fresh GPCA audit.', relatedRuleGroup: 'PPC-10xx (Preview Rules)' },
  { id: 'PPC-1206', statement: 'Every repair is classified into exactly one repair category.', relatedRuleGroup: 'PPC-5xx (Repair Rules)' },
  {
    id: 'PPC-1207',
    statement:
      'No Parallel Truth: a production fact may exist in exactly one authoritative form; every downstream stage must reference that authoritative source, never independently reconstruct an equivalent fact.',
    relatedRuleGroup: 'PPC-16xx (Single Source of Truth Registry) and PPC-17xx (Canonical Pipeline Data Contract)',
  },
  {
    id: 'PPC-1208',
    statement: 'Every constitutional violation belongs to exactly one primary Violation Taxonomy category.',
    relatedRuleGroup: 'PPC-21xx (Violation Taxonomy)',
  },
];

export const RULE_REGISTRY_PPC_1200: readonly RuleRegistryEntry[] = CONSTITUTIONAL_INVARIANTS.map((entry) => ({
  id: entry.id,
  group: 'PPC-12xx',
  statement: entry.statement,
  owner: 'PPCEA (planned); self-accountable per-authority until implemented',
  validator: 'PPCEA (planned)',
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: `Timeless architectural truth underlying ${entry.relatedRuleGroup}; any future implementation must preserve it even as individual rules within that group are amended.`,
}));

// -----------------------------------------------------------------------------------------------------
// Amendment 5 — PPC-1300 Canonical Pipeline State Machine.
// -----------------------------------------------------------------------------------------------------
export const PIPELINE_STATES: readonly PipelineStateEntry[] = [
  { state: 'NEW', description: 'A build request has been received; nothing has been resolved yet.', terminal: false },
  { state: 'INTENT_RESOLVED', description: 'Intent Understanding has produced a draft extraction from the raw prompt.', terminal: false },
  { state: 'CONTRACT_APPROVED', description: 'Product Faithfulness has produced the immutable CanonicalProductContract.', terminal: false },
  { state: 'PLAN_APPROVED', description: 'CBGA has repaired and approved the generation plan (modules, routes, navigation, identity) from the contract.', terminal: false },
  { state: 'GENERATION_ALLOWED', description: 'All pre-materialization conditions are satisfied; generators are cleared to write.', terminal: false },
  { state: 'WORKSPACE_MATERIALIZED', description: 'Generators have written workspace files from the approved plan.', terminal: false },
  { state: 'GPCA_VERIFIED', description: 'GPCA has freshly audited the current workspace state and found it compliant.', terminal: false },
  { state: 'PREVIEW_VERIFIED', description: 'The Live Preview Gate has unlocked and interaction proof has run against the audited workspace.', terminal: false },
  { state: 'COMPLETED', description: 'Final result recorded as built successfully (Final Result Rule PPC-1101).', terminal: true },
  { state: 'CONTRACT_BLOCKED', description: 'GPCA or CBGA blocked before materialization/preview could be attempted (Final Result Rule PPC-1102).', terminal: true },
  { state: 'PREVIEW_BLOCKED', description: 'Materialization was GPCA-compliant, but the Live Preview Gate could not unlock (Final Result Rule PPC-1103).', terminal: true },
  { state: 'MISSING_CAPABILITY', description: 'AEO/EIAA determined the generator lacks a required capability and no auto-repair path exists (Final Result Rule PPC-1106).', terminal: true },
  { state: 'CONSTITUTION_VIOLATED', description: 'A generator produced output this constitution forbids (Final Result Rule PPC-1107).', terminal: true },
];

export const PIPELINE_LEGAL_TRANSITIONS: readonly PipelineTransitionEntry[] = [
  { from: 'NEW', to: 'INTENT_RESOLVED', condition: 'Intent Understanding produces a draft extraction.' },
  { from: 'INTENT_RESOLVED', to: 'CONTRACT_APPROVED', condition: 'Product Faithfulness approves the CanonicalProductContract.' },
  { from: 'CONTRACT_APPROVED', to: 'PLAN_APPROVED', condition: 'CBGA repairs and approves the generation plan.' },
  { from: 'CONTRACT_APPROVED', to: 'CONTRACT_BLOCKED', condition: 'CBGA cannot produce a constitutionally-valid plan from the contract.' },
  { from: 'PLAN_APPROVED', to: 'GENERATION_ALLOWED', condition: 'All PPC-3xx pre-materialization permissions are satisfied.' },
  { from: 'GENERATION_ALLOWED', to: 'WORKSPACE_MATERIALIZED', condition: 'Generators write workspace files from the approved plan only.' },
  { from: 'WORKSPACE_MATERIALIZED', to: 'GPCA_VERIFIED', condition: 'GPCA audits the current workspace and passes.' },
  { from: 'WORKSPACE_MATERIALIZED', to: 'CONTRACT_BLOCKED', condition: 'GPCA audits the current workspace and blocks (GENERATION_PIPELINE_NON_COMPLIANT).' },
  { from: 'GPCA_VERIFIED', to: 'PREVIEW_VERIFIED', condition: 'Live Preview Gate unlocks and interaction proof passes against the audited workspace.' },
  { from: 'GPCA_VERIFIED', to: 'PREVIEW_BLOCKED', condition: 'Dev server/build fails, or interaction proof fails, after a compliant audit.' },
  { from: 'PREVIEW_VERIFIED', to: 'COMPLETED', condition: 'Final result recorded.' },
  { from: 'WORKSPACE_MATERIALIZED', to: 'WORKSPACE_MATERIALIZED', condition: 'A file-mutating repair (PPC-5xx, canMutateFiles=YES) writes to the workspace; state regresses here even if it was previously GPCA_VERIFIED or later (PPC-1203).' },
  { from: 'GPCA_VERIFIED', to: 'MISSING_CAPABILITY', condition: 'AEO/EIAA determines a required capability is missing and no auto-repair path exists.' },
  { from: 'WORKSPACE_MATERIALIZED', to: 'CONSTITUTION_VIOLATED', condition: 'A generator is proven to have violated PPC-4xx (e.g. independent identity derivation) even where GPCA content checks alone would not have caught it.' },
];

export const PIPELINE_ILLEGAL_TRANSITIONS: readonly IllegalPipelineTransitionEntry[] = [
  { from: 'PLAN_APPROVED', to: 'PREVIEW_VERIFIED', reason: 'Skips GENERATION_ALLOWED, WORKSPACE_MATERIALIZED, and GPCA_VERIFIED — preview without generation is illegal.' },
  { from: 'GENERATION_ALLOWED', to: 'GPCA_VERIFIED', reason: 'Skips WORKSPACE_MATERIALIZED — GPCA cannot audit content that was never written.' },
  { from: 'WORKSPACE_MATERIALIZED', to: 'PREVIEW_VERIFIED', reason: 'Skips GPCA_VERIFIED — preview must never activate against an unaudited workspace (PPC-1001).' },
  { from: 'GPCA_VERIFIED', to: 'COMPLETED', reason: 'Skips PREVIEW_VERIFIED — a compliant workspace that was never preview-verified is not "completed" (PPC-1101 requires preview-verified).' },
  { from: 'NEW', to: 'CONTRACT_APPROVED', reason: 'Skips INTENT_RESOLVED — the contract must be built from resolved intent, not directly from an unresolved request.' },
  { from: 'GPCA_VERIFIED', to: 'GPCA_VERIFIED', reason: 'Re-entering GPCA_VERIFIED after any mutation without first regressing through WORKSPACE_MATERIALIZED for a fresh audit is a stale-evidence transition (PPC-1203).' },
  { from: 'WORKSPACE_MATERIALIZED', to: 'GPCA_VERIFIED', reason: 'On a continuation build, illegal unless this specific transition is backed by a fresh audit of the COMPLETE current file list (PPC-702) — an audit against a partial file list does not satisfy this edge.' },
];

// PPC-1300 — Canonical Pipeline State Machine, expressed as permanently-IDed rules (Amendment 2/5).
export const RULE_REGISTRY_PPC_1300: readonly RuleRegistryEntry[] = [
  {
    id: 'PPC-1301',
    group: 'PPC-13xx',
    statement: 'The canonical pipeline state list (NEW, INTENT_RESOLVED, CONTRACT_APPROVED, PLAN_APPROVED, GENERATION_ALLOWED, WORKSPACE_MATERIALIZED, GPCA_VERIFIED, PREVIEW_VERIFIED, COMPLETED, plus the terminal blocked states) is fixed; every implementation must model its own progress in terms of these states.',
    owner: 'One-Prompt Build Orchestrator',
    validator: 'PPCEA (planned)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'A shared state vocabulary is required before "illegal transition" can be a meaningful, checkable concept.',
  },
  {
    id: 'PPC-1302',
    group: 'PPC-13xx',
    statement: 'Only the transitions listed in PIPELINE_LEGAL_TRANSITIONS may occur; any implementation-specific extra state must be modeled as a sub-state of one listed state, never as a shortcut between two non-adjacent listed states.',
    owner: 'One-Prompt Build Orchestrator',
    validator: 'PPCEA (planned)',
    severity: 'BLOCKING',
    autoFixEligible: 'NO',
    rationale: 'Without an explicit legal-transition allowlist, "the orchestrator got there some other way" cannot be distinguished from a constitutional violation.',
  },
  {
    id: 'PPC-1303',
    group: 'PPC-13xx',
    statement: 'The transitions listed in PIPELINE_ILLEGAL_TRANSITIONS must never occur, most importantly reaching PREVIEW_VERIFIED or COMPLETED without passing through GPCA_VERIFIED against the current workspace state.',
    owner: 'Live Preview Gate',
    validator: 'PPCEA (planned)',
    severity: 'BLOCKING',
    autoFixEligible: 'NO',
    rationale: 'Names the exact class of shortcut (skipping generation, skipping audit, skipping preview verification) responsible for compliant-report/non-compliant-preview mismatches.',
  },
  {
    id: 'PPC-1304',
    group: 'PPC-13xx',
    statement: 'Any file-mutating action taken while in or after WORKSPACE_MATERIALIZED regresses the state machine back to WORKSPACE_MATERIALIZED, regardless of which later state the pipeline had already reached; GPCA_VERIFIED and PREVIEW_VERIFIED may only be re-entered via a fresh traversal of their normal legal transitions.',
    owner: 'GPCA',
    validator: 'PPCEA (planned)',
    severity: 'BLOCKING',
    autoFixEligible: 'NO',
    rationale: 'Directly operationalizes Invariant PPC-1203 as a state-machine rule rather than only as prose.',
  },
];

// -----------------------------------------------------------------------------------------------------
// Amendment 1 — PPC-1400 Constitution Enforcement Authority (PPCEA).
// -----------------------------------------------------------------------------------------------------
export const ENFORCEMENT_AUTHORITY: EnforcementAuthorityDefinition = {
  name: 'Production Pipeline Constitution Enforcement Authority',
  abbreviation: 'PPCEA',
  implemented: false,
  mandate:
    'PPCEA is an architectural authority defined by this constitution now, whose future responsibility is to verify that every production authority operates within the limits this constitution defines, referencing violations by permanent rule ID (e.g. "PPC-204") rather than free-form prose. PPCEA\u2019s implementation is deferred to a future milestone (see Roadmap, Part 3); its constitutional ownership and mandate are not deferred.',
  validates: [
    'Product Faithfulness',
    'CBGA',
    'Blueprint Generator',
    'Modular Feature Generator',
    'Materialization Engine',
    'GPCA',
    'Live Preview Gate',
    'Repair Systems',
    'Final Reporting',
  ],
  doesNotReplace:
    'PPCEA does not replace, weaken, or duplicate any authority\u2019s own logic. It only verifies constitutional compliance of each authority\u2019s observable inputs/outputs against the rule registry (PPC-1xx through PPC-11xx). It reads; until a future constitutional amendment explicitly grants it gating power, it never mutates, generates, repairs, or gates on its own authority.',
};

export const RULE_REGISTRY_PPC_1400: readonly RuleRegistryEntry[] = [
  {
    id: 'PPC-1401',
    group: 'PPC-14xx',
    statement: ENFORCEMENT_AUTHORITY.mandate,
    owner: 'This constitution (ownership established now; implementation deferred)',
    validator: 'N/A (PPCEA is not yet implemented; this rule establishes that it will be)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'The constitution previously defined rules but not who enforces them; this closes that gap architecturally ahead of any implementation.',
  },
  {
    id: 'PPC-1402',
    group: 'PPC-14xx',
    statement: `PPCEA will eventually validate: ${ENFORCEMENT_AUTHORITY.validates.join(', ')}.`,
    owner: 'This constitution',
    validator: 'N/A',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Naming the exact validation surface now prevents future scope disputes about what PPCEA is and is not responsible for.',
  },
  {
    id: 'PPC-1403',
    group: 'PPC-14xx',
    statement: ENFORCEMENT_AUTHORITY.doesNotReplace,
    owner: 'This constitution',
    validator: 'N/A',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Prevents PPCEA from ever being implemented as a competing/duplicate authority instead of a compliance verifier.',
  },
];

// -----------------------------------------------------------------------------------------------------
// Amendment 7 — Rule Documentation Format (Purpose / History / Expected Failure Prevented).
// Format is defined for ALL future rules; only a small number of worked examples are filled in now.
// -----------------------------------------------------------------------------------------------------
export const RULE_DOCUMENTATION_EXAMPLES: readonly RuleDocumentationExample[] = [
  {
    ruleId: 'PPC-402',
    purpose: 'Prevent independent identity derivation outside the CBGA-repaired plan.',
    history:
      'Introduced after Production Generation Architecture Audit V1 Root Cause B documented repeated identity drift (e.g. "Calculator / Arithmetic Utility" and "reusable components where" outputs traced to independent extractAppName/UFCI computations disagreeing with the CBGA-repaired identity) across four consecutive prior milestones.',
    expectedFailurePrevented: 'Identity Drift',
  },
  {
    ruleId: 'PPC-702',
    purpose: 'Prevent continuation builds from auditing an incomplete file list.',
    history:
      'Introduced after Production Generation Architecture Audit V1 Root Cause H documented that the continuation-path file enumerator omitted src/blueprint/**, allowing a non-compliant navigation shell to reach preview undetected on continuation builds even after Contract-Bound Navigation Shell Fix V1 shipped for fresh materialization.',
    expectedFailurePrevented: 'Continuation Compliance Bypass',
  },
];

// -----------------------------------------------------------------------------------------------------
// Amendment 9 — PPC-1500 Constitution Governance.
// -----------------------------------------------------------------------------------------------------
export const GOVERNANCE_RULES: readonly GovernanceRuleEntry[] = [
  {
    id: 'PPC-1501',
    rule: 'Any amendment must state which existing rule IDs it modifies, extends, or supersedes, versus which rule IDs are newly added. An amendment may never silently renumber an existing rule ID.',
  },
  {
    id: 'PPC-1502',
    rule: 'An amendment becomes ratified for this document the moment it is merged into docs/production-pipeline-constitution-v1.md with a corresponding Amendment Log entry (date, amendment-set name, summary). Ratification of a rule is independent of, and not conditioned on, any production authority already conforming to it — conformance is tracked separately via the Implementation Roadmap (Part 3), which is explicitly non-binding.',
  },
  {
    id: 'PPC-1503',
    rule: 'A rule may be marked DEPRECATED — never deleted — when superseded by a newer rule. Its text is retained with an explicit "Superseded by: <new rule ID>" annotation.',
  },
  {
    id: 'PPC-1504',
    rule: 'Deprecated/superseded rules remain visible in this document (moved to a Superseded Rules appendix if the active tables would otherwise become unreadable). They are never silently removed, preserving full historical traceability.',
  },
  {
    id: 'PPC-1505',
    rule: 'Rule IDs are never reused, even after deprecation. The next new rule introduced into an existing hundred-block group always takes the next unused sequence number within that group; a new rule category takes the next unused hundred-block.',
  },
  {
    id: 'PPC-1506',
    rule: 'Proposal. Any contributor may propose a new rule by drafting the concept, the gap it closes (ideally citing a Part 2 root cause or a new documented incident), and the proposed rule text in the standard Rule Metadata Standard shape (§PPC-100 preamble). A proposal is not a rule until it completes Review (PPC-1507) and Ratification (PPC-1502).',
  },
  {
    id: 'PPC-1507',
    rule: 'Review. An amendment is reviewed against four checks before ratification: (a) it does not silently renumber an existing rule ID (PPC-1501); (b) every new rule is placed in the correct hundred-block per the Rule ID Convention, or a new hundred-block is used if none fits; (c) every new rule carries the full six-field Rule Metadata Standard (§PPC-100 preamble); (d) a validator script proves the amendment\u2019s documentation completeness before merge.',
  },
  {
    id: 'PPC-1508',
    rule: 'Version release. A new constitution version (§PPC-2300) is released only when an amendment set completes Ratification (PPC-1502); the released version\u2019s Major/Minor/Patch fields are assigned per the Constitution Versioning policy (§PPC-2300), and the prior current version is marked SUPERSEDED, never deleted.',
  },
  {
    id: 'PPC-1509',
    rule: 'Archival. Superseded rules and superseded constitution versions are archived, not deleted: a rule is archived into this document\u2019s Superseded Rules appendix (PPC-1504) with its original ID, statement, and "Superseded by" annotation preserved verbatim; a superseded constitution version is archived into the Constitution Versioning table (§PPC-2300) with its "Superseded By" field pointing at the version that replaced it.',
  },
];

export const RULE_REGISTRY_PPC_1500: readonly RuleRegistryEntry[] = GOVERNANCE_RULES.map((entry) => ({
  id: entry.id,
  group: 'PPC-15xx',
  statement: entry.rule,
  owner: 'This constitution\u2019s maintainers',
  validator: 'validate-production-pipeline-constitution-v2.ts (documentation-completeness only)',
  severity: 'STRUCTURAL' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Without explicit change control, "amending the constitution" risks becoming indistinguishable from quietly rewriting it — undermining the permanence Amendment 2 establishes.',
}));

// -----------------------------------------------------------------------------------------------------
// Amendment Log (Amendment 9) — permanent, append-only history of this document.
// -----------------------------------------------------------------------------------------------------
export const AMENDMENT_LOG: readonly AmendmentLogEntry[] = [
  {
    amendmentSet: 'V1 Ratification',
    date: '2026-07-09',
    summary:
      'Initial ratification: the Enforced Pipeline Model, Authority Ownership, Immutable Artifacts, Stage Permissions, Generator/Repair/Re-Audit/Continuation/Traceability/Classification/Preview/Final Result Rules, the eight-root-cause Architecture Audit mapping, and the Tier 0-6 Implementation Roadmap.',
  },
  {
    amendmentSet: 'Amendment Set 1',
    date: '2026-07-09',
    summary:
      'Added the Constitution Enforcement Authority (PPCEA, PPC-14xx); permanent rule IDs across every section (PPC-1xx\u2013PPC-15xx); the Rule Metadata Standard; explicit Read/Write/Mutate boundaries per stage (PPC-3xx); the Canonical Pipeline State Machine (PPC-13xx); Constitutional Invariants (PPC-12xx); the Rule Documentation Format with two worked examples; Constitution Governance and this Amendment Log (PPC-15xx); and restructured the document into three parts (Constitution / Architecture Audit / Roadmap) so the roadmap is explicitly non-binding.',
  },
  {
    amendmentSet: 'Amendment Set 2',
    date: '2026-07-09',
    summary:
      'Added the Single Source of Truth Registry (PPC-16xx); the Canonical Pipeline Data Contract (PPC-17xx); the Generator Interface Standard (PPC-18xx); the Authority Interface Standard (PPC-19xx); the Constitutional Capability Registry (PPC-20xx); the Violation Taxonomy (PPC-21xx); the Constitutional Dependency Graph (PPC-22xx); Constitution Versioning (PPC-23xx); the No Parallel Truth invariant (PPC-1207) and the Violation Taxonomy completeness invariant (PPC-1208); the Constitutional Test Matrix (PPC-24xx), mechanically derived from RULE_REGISTRY; and extended Constitution Governance with Proposal, Review, Version Release, and Archival rules (PPC-1506\u2013PPC-1509).',
  },
];

// =====================================================================================================
// Amendment Set 2 (2026-07-09) — Single Source of Truth Registry, Pipeline Data Contract, Generator/
// Authority Interface Standards, Capability Registry, Violation Taxonomy, Dependency Graph, Versioning,
// No Parallel Truth, Constitutional Test Matrix.
// =====================================================================================================

// -----------------------------------------------------------------------------------------------------
// PPC-1600 — Single Source of Truth Registry (Amendment 1).
// Every production concept has exactly one constitutional owner. This registry is the definitive
// ownership map; it does not replace §PPC-100 (Authority Ownership) but generalizes it to every
// object that flows through the pipeline, not just the concepts §PPC-100 already enumerated.
// -----------------------------------------------------------------------------------------------------
export const SINGLE_SOURCE_OF_TRUTH_REGISTRY: readonly SingleSourceOfTruthRegistryEntry[] = [
  {
    concept: 'Canonical Product Contract',
    constitutionalOwner: 'Product Faithfulness (buildCanonicalProductContract)',
    consumers: ['CBGA', 'GPCA', 'PPCEA (planned)'],
    mayMutate: 'Product Faithfulness, once, at creation. Immutable thereafter (PPC-201).',
    validator: 'Product Faithfulness milestone validators',
    pipelineStage: 'CONTRACT_APPROVED',
    constitutionRuleIds: ['PPC-101', 'PPC-102', 'PPC-103', 'PPC-201', 'PPC-302'],
  },
  {
    concept: 'Navigation Plan',
    constitutionalOwner: 'CBGA (CbgaGenerationReport.navigationPlan)',
    consumers: ['Blueprint product-surface generator', 'GPCA', 'Infrastructure vs Product Boundary Authority'],
    mayMutate: 'CBGA, once, during plan repair. Immutable thereafter (PPC-205).',
    validator: 'Contract-Bound Navigation Shell Fix V1 validator; Contract-Bound Root Navigation Authority V1 validator',
    pipelineStage: 'PLAN_APPROVED',
    constitutionRuleIds: ['PPC-107', 'PPC-205', 'PPC-403'],
  },
  {
    concept: 'Route Plan',
    constitutionalOwner: 'CBGA (modulePlan.routes)',
    consumers: ['Blueprint generator', 'Router generator', 'GPCA'],
    mayMutate: 'CBGA, once, during plan repair. Immutable thereafter (PPC-204).',
    validator: 'PPCEA (planned)',
    pipelineStage: 'PLAN_APPROVED',
    constitutionRuleIds: ['PPC-106', 'PPC-204'],
  },
  {
    concept: 'Module Plan',
    constitutionalOwner: 'CBGA (modulePlan.approvedModuleIds)',
    consumers: ['Materialization engine', 'Blueprint generator', 'GPCA'],
    mayMutate: 'CBGA, once, during plan repair. Immutable thereafter (PPC-203).',
    validator: 'PPCEA (planned)',
    pipelineStage: 'PLAN_APPROVED',
    constitutionRuleIds: ['PPC-104', 'PPC-203'],
  },
  {
    concept: 'Blueprint Surface',
    constitutionalOwner: 'Blueprint contract-copy derivation (deriveBlueprintContractCopy), fed only by the CBGA-approved plan',
    consumers: ["Blueprint generator's rendering functions"],
    mayMutate: 'Blueprint contract-copy derivation, once per build. Immutable thereafter (PPC-206).',
    validator: 'Blueprint Generator Contract-Bound Replacement V1 validator; Blueprint Content Decomposition V1',
    pipelineStage: 'PLAN_APPROVED',
    constitutionRuleIds: ['PPC-108', 'PPC-206'],
  },
  {
    concept: 'Workspace',
    constitutionalOwner: 'Materialization engine (initial write) + explicitly registered repair capabilities (post-write mutation only)',
    consumers: ['GPCA', 'dev server', 'preview'],
    mayMutate: 'Materialization engine (first write); registered repair capabilities (§PPC-500, post-write only).',
    validator: 'PPCEA (planned)',
    pipelineStage: 'WORKSPACE_MATERIALIZED',
    constitutionRuleIds: ['PPC-112', 'PPC-115', 'PPC-304'],
  },
  {
    concept: 'Rendered Content',
    constitutionalOwner: 'GPCA rendered-content collector (read-only extraction from the current workspace)',
    consumers: ['GPCA scoring/detectors', 'Infrastructure vs Product Boundary Authority'],
    mayMutate: 'Nobody — this is a derived, read-only view recomputed fresh on every audit, never itself an authored artifact.',
    validator: 'GPCA Rendered Content Evidence Expansion V1 validator',
    pipelineStage: 'GPCA_VERIFIED',
    constitutionRuleIds: ['PPC-305'],
  },
  {
    concept: 'GPCA Report',
    constitutionalOwner: 'GPCA (buildGpcaPostMaterializationReport)',
    consumers: ['Live Preview Gate', 'AEO', 'Final build result'],
    mayMutate: 'GPCA only, by re-running against the current workspace (§PPC-600). A stale report is never edited in place — it is replaced by a fresh one.',
    validator: 'Production Pipeline Constitution Adoption Phase 1 validator',
    pipelineStage: 'GPCA_VERIFIED',
    constitutionRuleIds: ['PPC-305', 'PPC-601', 'PPC-1203'],
  },
  {
    concept: 'Preview Proof',
    constitutionalOwner: 'Live Preview Gate (interaction proof against the audited workspace)',
    consumers: ['Final build result', 'End user'],
    mayMutate: 'Live Preview Gate only, and only by re-running against a freshly GPCA-verified workspace.',
    validator: 'PPCEA (planned)',
    pipelineStage: 'PREVIEW_VERIFIED',
    constitutionRuleIds: ['PPC-113', 'PPC-1001', 'PPC-1005'],
  },
  {
    concept: 'Product Identity',
    constitutionalOwner: 'CBGA (repairs the Canonical Product Contract identity into the build plan)',
    consumers: ['Blueprint generator', 'modular feature generator', 'materialization engine', 'GPCA'],
    mayMutate: 'CBGA, once, during plan repair. Immutable thereafter (PPC-202).',
    validator: 'Production Generator Contract Consumption Fix V1 validator',
    pipelineStage: 'PLAN_APPROVED',
    constitutionRuleIds: ['PPC-101', 'PPC-202', 'PPC-402'],
  },
  {
    concept: 'Sample Data',
    constitutionalOwner: 'Modular feature generator, only when explicitly tagged DEMO_DATA provenance',
    consumers: ['GPCA (classification only, never as business-content evidence)'],
    mayMutate: 'Modular feature generator, at write time only.',
    validator: 'PPCEA (planned)',
    pipelineStage: 'WORKSPACE_MATERIALIZED',
    constitutionRuleIds: ['PPC-109', 'PPC-404', 'PPC-904'],
  },
  {
    concept: 'Manifest',
    constitutionalOwner: 'Materialization engine (write-once per build, from the approved plan)',
    consumers: ['GPCA', 'downstream tooling'],
    mayMutate: 'Materialization engine, once, at initial write. Never rewritten independently by a later stage.',
    validator: 'PPCEA (planned)',
    pipelineStage: 'WORKSPACE_MATERIALIZED',
    constitutionRuleIds: ['PPC-111', 'PPC-906'],
  },
  {
    concept: 'Feature Contract',
    constitutionalOwner: 'Universal Feature Contract Intelligence (UFCI), itself bound to the CBGA-repaired plan — never an independently-derived second contract',
    consumers: ['Modular feature generator'],
    mayMutate: 'UFCI, once per build, derived only from the CBGA-repaired plan.',
    validator: 'Production Contract Consumption Trace V1 (trace-only, no production change)',
    pipelineStage: 'PLAN_APPROVED',
    constitutionRuleIds: ['PPC-105', 'PPC-304'],
  },
  {
    concept: 'Diagnostics',
    constitutionalOwner: 'The authority that detected the condition (GPCA for compliance diagnostics, AEO for engineering diagnostics) — never re-derived independently by a consumer',
    consumers: ['AEO', 'AEE', 'final build result', 'operator-facing reporting'],
    mayMutate: 'The originating authority only, on its own next run.',
    validator: 'PPCEA (planned)',
    pipelineStage: 'GPCA_VERIFIED',
    constitutionRuleIds: ['PPC-801', 'PPC-1107'],
  },
  {
    concept: 'Repair Plan',
    constitutionalOwner: 'AEO (dispatches to the specific registered repair capability for the diagnosed failure class)',
    consumers: ['The dispatched repair capability', 'GPCA (must re-audit after execution)'],
    mayMutate: 'AEO, per repair cycle; the executing repair capability may only act within the scope AEO dispatched.',
    validator: 'PPCEA (planned)',
    pipelineStage: 'WORKSPACE_MATERIALIZED',
    constitutionRuleIds: ['PPC-114', 'PPC-501', 'PPC-506'],
  },
  {
    concept: 'Capability Request',
    constitutionalOwner: 'Engineering Intelligence Activation Authority (EIAA) / Missing-capability repair (§PPC-506) — raised only after GPCA/AEO prove the generator genuinely lacks the capability',
    consumers: ['Capability Evolution Runtime', 'GPCA (must re-audit after fulfillment)', 'final build result (PPC-1106)'],
    mayMutate: 'EIAA, once per diagnosed gap; never fabricated by a stage other than the one that proved the gap.',
    validator: 'PPCEA (planned)',
    pipelineStage: 'GPCA_VERIFIED',
    constitutionRuleIds: ['PPC-506', 'PPC-1106'],
  },
];

export const RULE_REGISTRY_PPC_1600: readonly RuleRegistryEntry[] = SINGLE_SOURCE_OF_TRUTH_REGISTRY.map((entry, i) => ({
  id: `PPC-${1601 + i}`,
  group: 'PPC-16xx',
  statement: `${entry.concept} has exactly one constitutional owner: ${entry.constitutionalOwner}. May mutate: ${entry.mayMutate}. No other stage may author or independently reconstruct this concept.`,
  owner: entry.constitutionalOwner,
  validator: entry.validator,
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Generalizes §PPC-100 Authority Ownership into a single definitive registry spanning every object the pipeline produces, so "who owns this?" always has exactly one answer, not one answer per section.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-1700 — Canonical Pipeline Data Contract (Amendment 2).
// Documents every immutable object that flows through the production pipeline, in producer order.
// Future implementations must consume these objects instead of independently reconstructing
// equivalent information (Invariant PPC-1207, No Parallel Truth).
// -----------------------------------------------------------------------------------------------------
export const PIPELINE_DATA_CONTRACT: readonly PipelineDataContractEntry[] = [
  {
    order: 1,
    object: 'Raw Prompt',
    owner: 'Intent Understanding / Prompt Extraction (read-only boundary)',
    producer: 'The requesting user/API caller',
    consumers: ['Intent Understanding', 'Product Faithfulness'],
    immutableFields: ['The literal prompt text, for the lifetime of this build request'],
    mutableFields: [],
    version: '1.0',
    validation: 'None required at this stage beyond basic request validation (non-empty, size limits).',
    provenance: 'Origin of the entire build; every downstream object must be traceable back to this exact string (§PPC-800).',
  },
  {
    order: 2,
    object: 'Canonical Product Contract',
    owner: 'Product Faithfulness',
    producer: 'buildCanonicalProductContract',
    consumers: ['CBGA', 'GPCA'],
    immutableFields: ['productIdentity', 'productPurpose', 'productConcepts'],
    mutableFields: [],
    version: '1.0',
    validation: 'Product Faithfulness milestone validators (V1, V2).',
    provenance: 'Derived solely from Raw Prompt (+ optional architecture/PIM context); immutable the moment returned (PPC-201).',
  },
  {
    order: 3,
    object: 'CBGA Generation Report',
    owner: 'CBGA',
    producer: 'applyContractBoundGenerationToBuildPlan',
    consumers: ['Materialization engine', 'Blueprint generator', 'GPCA'],
    immutableFields: ['navigationPlan', 'modulePlan', 'routePlan', 'repaired identity'],
    mutableFields: [],
    version: '4.0 (Contract-Bound Generation Authority v4)',
    validation: 'Contract-Bound Generation Authority v4 validators; Contract-Bound Navigation Shell Fix V1; Contract-Bound Root Navigation Authority V1.',
    provenance: 'Derived solely from the Canonical Product Contract (+ proposed build plan); immutable the moment returned (PPC-202).',
  },
  {
    order: 4,
    object: 'Approved Generation Plan',
    owner: 'CBGA (patched build plan)',
    producer: 'applyContractBoundGenerationToBuildPlan (same call as row 3; the plan is the build-plan-shaped projection of the report)',
    consumers: ['Materialization engine', 'Blueprint generator', 'Modular feature generator'],
    immutableFields: ['approvedModuleIds', 'routes', 'navigationPlan-derived labels'],
    mutableFields: [],
    version: '4.0',
    validation: 'Same as row 3.',
    provenance: 'Same as row 3 — the CBGA Generation Report and the Approved Generation Plan are two views of one immutable artifact, never two independently-produced objects.',
  },
  {
    order: 5,
    object: 'Blueprint Product Surface',
    owner: 'Blueprint contract-copy derivation',
    producer: 'deriveBlueprintContractCopy',
    consumers: ["Blueprint generator's rendering functions"],
    immutableFields: ['headline', 'tagline', 'core nav labels', 'welcome/home copy'],
    mutableFields: [],
    version: '1.0 (Blueprint Generator Contract-Bound Replacement V1 / Blueprint Content Decomposition V1)',
    validation: 'Blueprint Generator Contract-Bound Replacement V1 validator; Contract-Bound Root Navigation Authority V1 validator.',
    provenance: 'Derived solely from the Approved Generation Plan; immutable the moment computed for this build (PPC-206).',
  },
  {
    order: 6,
    object: 'Materialized Workspace',
    owner: 'Materialization engine (initial write); registered repair systems (post-write mutation)',
    producer: 'materializeGeneratedApplication / buildUniversalMaterializedWorkspaceFiles',
    consumers: ['GPCA', 'dev server', 'preview'],
    immutableFields: ['Provenance map (BLUEPRINT_PRODUCT_SURFACE_PROVENANCE) as of the moment each file is written'],
    mutableFields: ['File content — but only by the materialization engine (first write) or a registered repair capability (§PPC-500), never by any other code path'],
    version: '1.0',
    validation: 'GPCA post-materialization audit is the acceptance test for this object.',
    provenance: 'Derived solely from the Blueprint Product Surface + Approved Generation Plan; any mutation after first write must be attributable to a named repair capability (§PPC-500).',
  },
  {
    order: 7,
    object: 'GPCA Compliance Report',
    owner: 'GPCA',
    producer: 'buildGpcaPostMaterializationReport',
    consumers: ['Live Preview Gate', 'AEO', 'Final build result'],
    immutableFields: ['The report object itself, for the exact workspace state it audited'],
    mutableFields: [],
    version: '1.0 (GPCA Rendered Content Evidence Expansion V1 / GPCA Continuation Workspace Compliance Fix V1 / Infrastructure vs Product Boundary Authority V1)',
    validation: 'GPCA\u2019s own milestone validator chain; Production Pipeline Constitution Adoption Phase 1 (re-audit invariant).',
    provenance: 'Derived solely from the current Materialized Workspace + upstream contract/plan objects; perishable — invalidated by any subsequent workspace mutation (PPC-1203).',
  },
  {
    order: 8,
    object: 'Preview Proof',
    owner: 'Live Preview Gate',
    producer: 'Live Preview Gate unlock + interaction proof',
    consumers: ['Final build result', 'End user'],
    immutableFields: ['The proof object itself, for the exact GPCA report + workspace path it was produced against'],
    mutableFields: [],
    version: '1.0',
    validation: '§PPC-1000 Preview Rules (all five conditions).',
    provenance: 'Derived solely from a GPCA Compliance Report that is fresh relative to the workspace it references (PPC-1001-1002).',
  },
  {
    order: 9,
    object: 'Engineering Report',
    owner: 'Build outcome policy / AEE final report',
    producer: 'AEE final reporting layer',
    consumers: ['API response', 'Chat response', 'UI'],
    immutableFields: ['The final result label (§PPC-1100), once recorded'],
    mutableFields: [],
    version: '1.0',
    validation: '§PPC-1100 Final Result Rules (distinct, non-overlapping labels).',
    provenance: 'Derived solely from the Preview Proof (success path) or the earliest blocking report (failure path) — never independently re-assessed from raw pipeline state.',
  },
];

export const RULE_REGISTRY_PPC_1700: readonly RuleRegistryEntry[] = PIPELINE_DATA_CONTRACT.map((entry, i) => ({
  id: `PPC-${1701 + i}`,
  group: 'PPC-17xx',
  statement: `${entry.object} (owner: ${entry.owner}; producer: ${entry.producer}) is the single authoritative form of this pipeline stage's output. Consumers [${entry.consumers.join('; ')}] must consume it directly; none may independently reconstruct an equivalent object.`,
  owner: entry.owner,
  validator: entry.validation,
  severity: 'BLOCKING' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Names the exact immutable object at each pipeline stage so "consume the existing object" vs. "reconstruct an equivalent one" (the mechanism behind Root Cause B, Part 2) is always unambiguous.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-1800 — Generator Interface Standard (Amendment 3).
// -----------------------------------------------------------------------------------------------------
export const GENERATOR_INTERFACE_FIELDS: readonly InterfaceFieldDefinition[] = [
  { field: 'Inputs', description: 'The exact set of parameters the generator accepts, named and typed — never an untyped "context bag".' },
  { field: 'Consumed Contracts', description: 'Which immutable Pipeline Data Contract objects (§PPC-1700) the generator reads from. Every field the generator uses for product meaning must trace back to one of these.' },
  { field: 'Outputs', description: 'The exact artifacts produced (files, in-memory structures) and their shape.' },
  { field: 'Generated Artifacts', description: 'The concrete list of files/records this generator is responsible for producing for a given input, so ownership of any single output file is never ambiguous between two generators.' },
  { field: 'Produced Provenance', description: 'The provenance tags this generator emits recording which approved-plan field it used for each artifact (feeds §PPC-800 Traceability Rules).' },
  { field: 'Produced Diagnostics', description: 'What this generator reports when it cannot produce a required artifact from its Consumed Contracts (feeds Missing-capability repair, §PPC-506).' },
  { field: 'Mutation Scope', description: 'The exact file/directory scope this generator is permitted to write to; writing outside this scope is a constitutional violation regardless of correctness.' },
  { field: 'Validation', description: 'The concrete validator(s) that check this generator\u2019s conformance to its own declared interface.' },
  { field: 'Failure Modes', description: 'The named ways this generator is allowed to fail (e.g. MISSING_CAPABILITY) — inventing a fallback in place of a declared failure mode is itself a violation (PPC-304, PPC-401).' },
];

export const RULE_REGISTRY_PPC_1800: readonly RuleRegistryEntry[] = [
  {
    id: 'PPC-1801',
    group: 'PPC-18xx',
    statement:
      'Every generator (existing or future) must declare, in this exact schema, its Inputs, Consumed Contracts, Outputs, Generated Artifacts, Produced Provenance, Produced Diagnostics, Mutation Scope, Validation, and Failure Modes.',
    owner: 'Materialization / Blueprint / Modular Generators (and any future generator)',
    validator: 'PPCEA (planned)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'A shared interface schema is a prerequisite for PPCEA (§PPC-1400) to ever mechanically verify generator conformance rather than re-reading each generator\u2019s source by hand.',
  },
  {
    id: 'PPC-1802',
    group: 'PPC-18xx',
    statement: 'No generator may derive information outside its declared Consumed Contracts (§PPC-1800 field 2). A generator reading raw prompt text, stale workspace file content, or another generator\u2019s output for product meaning violates this rule even where PPC-401/PPC-402/PPC-407 do not separately name the exact input.',
    owner: 'Materialization / Blueprint / Modular Generators',
    validator: 'PPCEA (planned)',
    severity: 'BLOCKING',
    autoFixEligible: 'NO',
    rationale: 'Closes the general case of Root Causes A/B/G (Part 2) as a standing interface rule, not merely a list of specific historical instances.',
  },
];

// -----------------------------------------------------------------------------------------------------
// PPC-1900 — Authority Interface Standard (Amendment 4).
// -----------------------------------------------------------------------------------------------------
export const AUTHORITY_INTERFACE_FIELDS: readonly InterfaceFieldDefinition[] = [
  { field: 'Reads', description: 'The exact set of pipeline objects (§PPC-1700) this authority reads.' },
  { field: 'Writes', description: 'The exact set of pipeline objects this authority is the producer of, if any (most authorities read/gate/repair rather than author a new §PPC-1700 object).' },
  { field: 'Mutates', description: 'Whether, and under what exact registered scope, this authority is permitted to mutate workspace files (§PPC-500).' },
  { field: 'Blocks', description: 'The exact conditions under which this authority prevents the pipeline from advancing (a gate), and the terminal/blocked state it produces (§PPC-1300).' },
  { field: 'Repairs', description: 'Whether this authority dispatches or performs repairs, and which repair category (§PPC-500) each of its repair actions belongs to.' },
  { field: 'Produces Report', description: 'The concrete report object this authority returns, and which §PPC-1700 data-contract row (if any) it corresponds to.' },
  { field: 'Produces Violations', description: 'Whether this authority emits constitutional-violation records, and by which Violation Taxonomy category (§PPC-2100) they are classified.' },
  { field: 'Produces Diagnostics', description: 'The diagnostic detail this authority emits to help downstream repair/reporting stages act on its findings.' },
  { field: 'Produces Capability Requests', description: 'Whether this authority can raise a Capability Request (§PPC-506) when it proves a generator lacks a required capability.' },
  { field: 'Validator', description: 'The concrete validator script(s) that check this authority\u2019s own conformance to this constitution.' },
  { field: 'Constitution Rules Enforced', description: 'The exact list of PPC-nnn rule IDs this authority is the designated Owner/Validator for, per the Rule Metadata Standard (§PPC-100 preamble).' },
];

export const RULE_REGISTRY_PPC_1900: readonly RuleRegistryEntry[] = [
  {
    id: 'PPC-1901',
    group: 'PPC-19xx',
    statement:
      'Every authority (existing or future) must document itself in this exact schema: Reads, Writes, Mutates, Blocks, Repairs, Produces Report, Produces Violations, Produces Diagnostics, Produces Capability Requests, Validator, and Constitution Rules Enforced.',
    owner: 'PPCEA (planned); each authority is self-documenting until PPCEA exists',
    validator: 'PPCEA (planned)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Without a shared authority interface, "is this a new authority or a duplicate of an existing one\u2019s job" (the exact question the Constitutional Capability Registry, §PPC-2000, exists to answer) has no consistent basis for comparison.',
  },
  {
    id: 'PPC-1902',
    group: 'PPC-19xx',
    statement: 'A future authority must conform to this interface, and must be entered into the Constitutional Capability Registry (§PPC-2000), before any production stage may dispatch to it.',
    owner: 'PPCEA (planned)',
    validator: 'PPCEA (planned)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Prevents a new authority from silently entering the production pipeline without first being reconciled against the Single Source of Truth Registry (§PPC-1600) for the concepts it would read or write.',
  },
];

// -----------------------------------------------------------------------------------------------------
// PPC-2000 — Constitutional Capability Registry (Amendment 5).
// Every production capability must be registered exactly once. This is the canonical inventory of
// production capabilities; a capability absent from this registry has no constitutional standing to
// mutate, gate, or repair anything (PPC-1902).
// -----------------------------------------------------------------------------------------------------
export const CAPABILITY_REGISTRY: readonly CapabilityRegistryEntry[] = [
  {
    capability: 'GPCA (Generation Pipeline Compliance Authority)',
    owner: 'GPCA',
    purpose: 'Audits materialized workspace content for compliance with the approved contract/plan; gates preview.',
    pipelineStage: 'GPCA_VERIFIED',
    validator: 'GPCA milestone validator chain (Rendered Content Evidence Expansion V1, Continuation Workspace Compliance Fix V1, etc.)',
    autoFixEligible: 'NO',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['Canonical Product Contract', 'CBGA Generation Report', 'Materialized Workspace'],
  },
  {
    capability: 'CBGA (Contract-Bound Generation Authority)',
    owner: 'CBGA',
    purpose: 'Repairs the proposed build plan (identity, modules, routes, navigation) against the Canonical Product Contract.',
    pipelineStage: 'PLAN_APPROVED',
    validator: 'Contract-Bound Generation Authority v4 validator chain',
    autoFixEligible: 'PARTIAL',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['Canonical Product Contract'],
  },
  {
    capability: 'AEO (Autonomous Engineering Orchestrator)',
    owner: 'AEO',
    purpose: 'Coordinates diagnosis and dispatches repair to the correct registered repair capability.',
    pipelineStage: 'WORKSPACE_MATERIALIZED (repair loop)',
    validator: 'AEO milestone validator chain',
    autoFixEligible: 'PARTIAL',
    engineeringIntelligenceEligible: true,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['GPCA Compliance Report', 'AEE'],
  },
  {
    capability: 'EIAA (Engineering Intelligence Activation Authority)',
    owner: 'EIAA',
    purpose: 'Activates engineering intelligence / missing-capability repair once GPCA/AEO prove a genuine capability gap.',
    pipelineStage: 'GPCA_VERIFIED (missing-capability path)',
    validator: 'EIAA milestone validator chain',
    autoFixEligible: 'PARTIAL',
    engineeringIntelligenceEligible: true,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['GPCA Compliance Report', 'AEO'],
  },
  {
    capability: 'Build Reality AutoFix (AEE build-autofix loop)',
    owner: 'AEE',
    purpose: 'Compiler repair — fixes TypeScript/build errors in already-generated files without introducing new product content.',
    pipelineStage: 'WORKSPACE_MATERIALIZED (repair loop)',
    validator: 'PPCEA (planned)',
    autoFixEligible: 'PARTIAL',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['Materialized Workspace'],
  },
  {
    capability: 'Engineering Intelligence Runtime',
    owner: 'Engineering Intelligence Runtime',
    purpose: 'Missing-capability repair — generates a genuinely new capability/module GPCA/AEO proved the generator cannot produce.',
    pipelineStage: 'WORKSPACE_MATERIALIZED (repair loop)',
    validator: 'PPCEA (planned)',
    autoFixEligible: 'PARTIAL',
    engineeringIntelligenceEligible: true,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['GPCA Compliance Report', 'Capability Request', 'EIAA'],
  },
  {
    capability: 'VERE (Virtual Engineering Reality Engine)',
    owner: 'VERE',
    purpose: 'Documented in prior milestones\u2019 restriction lists; not actively developed by this constitution\u2019s amendment history.',
    pipelineStage: 'Not currently wired into the enforced pipeline model',
    validator: 'N/A — out of scope for this constitution\u2019s current amendments',
    autoFixEligible: 'NO',
    engineeringIntelligenceEligible: false,
    currentStatus: 'NOT_WIRED',
    dependencies: [],
  },
  {
    capability: 'Product Faithfulness',
    owner: 'Product Faithfulness',
    purpose: 'Produces the immutable Canonical Product Contract from the raw prompt (+ optional architecture/PIM context).',
    pipelineStage: 'CONTRACT_APPROVED',
    validator: 'Product Faithfulness V1/V2 validator chain',
    autoFixEligible: 'PARTIAL',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['Raw Prompt'],
  },
  {
    capability: 'Infrastructure vs Product Boundary Authority',
    owner: 'Infrastructure vs Product Boundary Authority',
    purpose: 'Classifies every generated file as INFRASTRUCTURE, PRODUCT, MIXED, or UNKNOWN so GPCA evaluates the correct thing per file.',
    pipelineStage: 'GPCA_VERIFIED (classification input)',
    validator: 'Infrastructure vs Product Boundary Authority V1 validator',
    autoFixEligible: 'NO',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['Materialized Workspace'],
  },
  {
    capability: 'Blueprint Generator',
    owner: 'Blueprint Generator',
    purpose: 'Materializes the structural application shell (AppShell, product-surface, root navigation) from the CBGA-approved plan and Blueprint Product Surface.',
    pipelineStage: 'WORKSPACE_MATERIALIZED',
    validator: 'Blueprint Generator Contract-Bound Replacement V1; Blueprint Content Decomposition V1; Contract-Bound Root Navigation Authority V1',
    autoFixEligible: 'NO',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED (PARTIAL — see Root Cause G, Part 2, for the accepted infrastructure/product boundary trade-off)',
    dependencies: ['Approved Generation Plan', 'Blueprint Product Surface'],
  },
  {
    capability: 'Materialization (Universal App Materialization Engine)',
    owner: 'Materialization engine',
    purpose: 'Writes the modular feature module, page, and manifest files that constitute the generated application.',
    pipelineStage: 'WORKSPACE_MATERIALIZED',
    validator: 'Production Generator Contract Consumption Fix V1 validator',
    autoFixEligible: 'NO',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['Approved Generation Plan'],
  },
  {
    capability: 'Preview Gate (Live Preview Gate)',
    owner: 'Live Preview Gate',
    purpose: 'Unlocks preview only against a workspace with a fresh, passing GPCA report; runs interaction proof.',
    pipelineStage: 'PREVIEW_VERIFIED',
    validator: 'Production Pipeline Constitution Adoption Phase 1 validator',
    autoFixEligible: 'NO',
    engineeringIntelligenceEligible: false,
    currentStatus: 'IMPLEMENTED',
    dependencies: ['GPCA Compliance Report', 'Materialized Workspace'],
  },
];

export const RULE_REGISTRY_PPC_2000: readonly RuleRegistryEntry[] = CAPABILITY_REGISTRY.map((entry, i) => ({
  id: `PPC-${2001 + i}`,
  group: 'PPC-20xx',
  statement: `${entry.capability} is a registered production capability owned by ${entry.owner}, for the purpose of: ${entry.purpose} No unregistered capability may perform an equivalent function without first being added to this registry (PPC-1902).`,
  owner: entry.owner,
  validator: entry.validator,
  severity: 'STRUCTURAL' as const,
  autoFixEligible: entry.autoFixEligible,
  rationale: 'The constitution becomes the canonical registry of every production capability so "does a capability for X already exist?" is always answerable by lookup, never by re-discovery.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-2100 — Violation Taxonomy (Amendment 6).
// Every constitutional violation belongs to exactly one primary category (Invariant PPC-1208).
// Future validators should report a taxonomy ID, not free-form prose.
// -----------------------------------------------------------------------------------------------------
export const VIOLATION_TAXONOMY: readonly ViolationTaxonomyEntry[] = [
  { id: 'VT-01', category: 'Ownership Violation', description: 'A concept in the Single Source of Truth Registry (§PPC-1600) or Authority Ownership table (§PPC-100) is authored by more than one stage, or by a stage that is not its registered owner.', exampleRuleIds: ['PPC-101', 'PPC-1201'] },
  { id: 'VT-02', category: 'Traceability Violation', description: 'A generated artifact is missing one or more links in the ancestry chain (§PPC-800), or its ancestry cannot be proven by emitted provenance or heuristic matching.', exampleRuleIds: ['PPC-801', 'PPC-802'] },
  { id: 'VT-03', category: 'Generator Violation', description: 'A generator derives information outside its declared Consumed Contracts (§PPC-1800), or otherwise violates a Generator Rule (§PPC-400).', exampleRuleIds: ['PPC-401', 'PPC-402', 'PPC-1802'] },
  { id: 'VT-04', category: 'Pipeline Violation', description: 'A build\u2019s progress does not correspond to a legal transition in the Canonical Pipeline State Machine (§PPC-1300).', exampleRuleIds: ['PPC-1302', 'PPC-1303'] },
  { id: 'VT-05', category: 'Repair Violation', description: 'A repair action is not classified into exactly one Repair Category (§PPC-500), or acts outside its category\u2019s allowed scope.', exampleRuleIds: ['PPC-501', 'PPC-1206'] },
  { id: 'VT-06', category: 'Preview Violation', description: 'Preview activates while one or more of the five Preview Rules (§PPC-1000) is false.', exampleRuleIds: ['PPC-1001', 'PPC-1002', 'PPC-1205'] },
  { id: 'VT-07', category: 'Runtime Violation', description: 'A runtime stage (dev server, preview process) serves content from, or executes against, a workspace path other than the one GPCA most recently audited.', exampleRuleIds: ['PPC-308', 'PPC-1003'] },
  { id: 'VT-08', category: 'Mutation Violation', description: 'A workspace file is written by a code path that is not the materialization engine\u2019s first write or an explicitly registered repair capability (§PPC-115).', exampleRuleIds: ['PPC-115', 'PPC-304', 'PPC-408'] },
  { id: 'VT-09', category: 'Governance Violation', description: 'An amendment renumbers or reuses an existing rule ID, skips Review, or is not recorded in the Amendment Log (§PPC-1500).', exampleRuleIds: ['PPC-1501', 'PPC-1505', 'PPC-1507'] },
  { id: 'VT-10', category: 'Capability Violation', description: 'A capability not present in the Constitutional Capability Registry (§PPC-2000) mutates, gates, or repairs production state.', exampleRuleIds: ['PPC-1902'] },
  { id: 'VT-11', category: 'State Machine Violation', description: 'A build reaches PREVIEW_VERIFIED or COMPLETED via a transition listed in PIPELINE_ILLEGAL_TRANSITIONS (§PPC-1303), most commonly by skipping GPCA_VERIFIED against the current workspace state.', exampleRuleIds: ['PPC-1303', 'PPC-1304'] },
];

export const RULE_REGISTRY_PPC_2100: readonly RuleRegistryEntry[] = VIOLATION_TAXONOMY.map((entry, i) => ({
  id: `PPC-${2101 + i}`,
  group: 'PPC-21xx',
  statement: `${entry.id} — ${entry.category}: ${entry.description}`,
  owner: 'PPCEA (planned); each authority self-classifies its own findings until implemented',
  validator: 'PPCEA (planned)',
  severity: 'STRUCTURAL' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'A closed, exhaustive taxonomy lets future validators report a stable category ID instead of re-describing the same violation shape in slightly different prose every time.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-2200 — Constitutional Dependency Graph (Amendment 7).
// Makes illegal execution order obvious: e.g. GPCA depends on Materialization depends on CBGA
// depends on the Canonical Product Contract. An authority run before its dependencies are satisfied
// is, by definition, operating on incomplete evidence.
// -----------------------------------------------------------------------------------------------------
export const DEPENDENCY_GRAPH: readonly DependencyGraphEntry[] = [
  {
    authority: 'Product Faithfulness',
    dependsOn: ['Raw Prompt'],
    requiredBefore: ['CBGA'],
    requiredAfter: ['Intent Understanding'],
    producesFor: ['CBGA', 'GPCA'],
    consumesFrom: ['Raw Prompt'],
    forbiddenDependencies: ['Materialized Workspace (must never read prior workspace content for identity)'],
  },
  {
    authority: 'CBGA',
    dependsOn: ['Canonical Product Contract'],
    requiredBefore: ['Materialization / Blueprint / Modular Generators'],
    requiredAfter: ['Product Faithfulness'],
    producesFor: ['Materialization engine', 'Blueprint generator', 'GPCA'],
    consumesFrom: ['Canonical Product Contract'],
    forbiddenDependencies: ['Raw Prompt directly (must go through the Canonical Product Contract)'],
  },
  {
    authority: 'Materialization / Blueprint Generator',
    dependsOn: ['CBGA Generation Report', 'Approved Generation Plan', 'Blueprint Product Surface'],
    requiredBefore: ['GPCA'],
    requiredAfter: ['CBGA'],
    producesFor: ['GPCA', 'dev server', 'preview'],
    consumesFrom: ['CBGA'],
    forbiddenDependencies: ['Raw Prompt as a product-meaning source', 'Existing workspace file content as evidence'],
  },
  {
    authority: 'GPCA',
    dependsOn: ['Materialized Workspace', 'Canonical Product Contract', 'CBGA Generation Report'],
    requiredBefore: ['Live Preview Gate'],
    requiredAfter: ['Materialization / Blueprint Generator'],
    producesFor: ['Live Preview Gate', 'AEO', 'Final build result'],
    consumesFrom: ['Materialization / Blueprint Generator', 'CBGA', 'Product Faithfulness'],
    forbiddenDependencies: ['A cached/stale GPCA report treated as current'],
  },
  {
    authority: 'Live Preview Gate',
    dependsOn: ['GPCA Compliance Report (fresh)'],
    requiredBefore: ['Final build result (BUILT_SUCCESSFULLY path)'],
    requiredAfter: ['GPCA'],
    producesFor: ['Final build result', 'End user'],
    consumesFrom: ['GPCA'],
    forbiddenDependencies: ['A GPCA report older than the last workspace mutation'],
  },
  {
    authority: 'Repair Systems (AEO-dispatched)',
    dependsOn: ['GPCA Compliance Report (for the diagnosed failure class)', 'AEO dispatch'],
    requiredBefore: ['GPCA re-audit (if the repair mutated files)'],
    requiredAfter: ['GPCA', 'AEO'],
    producesFor: ['GPCA (must re-audit after)'],
    consumesFrom: ['AEO'],
    forbiddenDependencies: ['The right to relabel a GPCA verdict without GPCA re-running'],
  },
  {
    authority: 'AEO',
    dependsOn: ['GPCA Compliance Report', 'AEE'],
    requiredBefore: ['The specific repair capability it dispatches to'],
    requiredAfter: ['GPCA'],
    producesFor: ['Repair Systems', 'Final build result diagnostics'],
    consumesFrom: ['GPCA'],
    forbiddenDependencies: ['Dispatching to a capability absent from the Constitutional Capability Registry (§PPC-2000)'],
  },
  {
    authority: 'EIAA',
    dependsOn: ['GPCA Compliance Report', 'AEO diagnosis of a genuine capability gap'],
    requiredBefore: ['Engineering Intelligence Runtime / Capability Evolution Runtime'],
    requiredAfter: ['GPCA', 'AEO'],
    producesFor: ['Engineering Intelligence Runtime', 'Final build result (PPC-1106 path)'],
    consumesFrom: ['AEO'],
    forbiddenDependencies: ['Raising a Capability Request without a prior GPCA/AEO-proved gap'],
  },
];

export const RULE_REGISTRY_PPC_2200: readonly RuleRegistryEntry[] = DEPENDENCY_GRAPH.map((entry, i) => ({
  id: `PPC-${2201 + i}`,
  group: 'PPC-22xx',
  statement: `${entry.authority} depends on [${entry.dependsOn.join('; ')}]; required before [${entry.requiredBefore.join('; ')}]; required after [${entry.requiredAfter.join('; ')}]; forbidden dependencies: [${entry.forbiddenDependencies.join('; ')}].`,
  owner: entry.authority,
  validator: 'PPCEA (planned)',
  severity: 'STRUCTURAL' as const,
  autoFixEligible: 'NO' as const,
  rationale: 'Makes illegal execution order (e.g. running GPCA before materialization, or CBGA before the contract exists) obvious by inspection rather than only discoverable by tracing call sites.',
}));

// -----------------------------------------------------------------------------------------------------
// PPC-2300 — Constitution Versioning (Amendment 8).
// Rule IDs are never reused (PPC-1505); this section versions the DOCUMENT itself, independent of
// individual rule IDs, so whole amendment sets remain traceable across releases.
// -----------------------------------------------------------------------------------------------------
export const CONSTITUTION_VERSION_HISTORY: readonly ConstitutionVersionEntry[] = [
  {
    version: 'V1.0',
    majorVersion: 1,
    minorVersion: 0,
    patchVersion: 0,
    ratificationDate: '2026-07-09',
    supersededBy: 'V1.1',
    historicalStatus: 'SUPERSEDED',
    summary: 'Initial ratification (see Amendment Log entry "V1 Ratification").',
  },
  {
    version: 'V1.1',
    majorVersion: 1,
    minorVersion: 1,
    patchVersion: 0,
    ratificationDate: '2026-07-09',
    supersededBy: 'V1.2',
    historicalStatus: 'SUPERSEDED',
    summary: 'Amendment Set 1 (see Amendment Log entry "Amendment Set 1").',
  },
  {
    version: 'V1.2',
    majorVersion: 1,
    minorVersion: 2,
    patchVersion: 0,
    ratificationDate: '2026-07-09',
    supersededBy: null,
    historicalStatus: 'CURRENT',
    summary: 'Amendment Set 2 (see Amendment Log entry "Amendment Set 2") — this version.',
  },
];

export const RULE_REGISTRY_PPC_2300: readonly RuleRegistryEntry[] = [
  {
    id: 'PPC-2301',
    group: 'PPC-23xx',
    statement: 'Every constitution version carries a Major.Minor.Patch triple, a Ratification Date, a Superseded-By pointer (or null if current), and a Historical Status of CURRENT, SUPERSEDED, or DRAFT.',
    owner: 'This constitution\u2019s maintainers',
    validator: 'validate-production-pipeline-constitution-amendment-set-2.ts (documentation-completeness only)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Without an explicit versioning schema, "which version of the constitution does this build\u2019s conformance report reference?" has no stable answer.',
  },
  {
    id: 'PPC-2302',
    group: 'PPC-23xx',
    statement: 'A Major version increments only for a restructuring that changes the meaning of existing rule IDs\u2019 groupings (e.g. Amendment 8\u2019s three-part split); a Minor version increments for a ratified amendment set that adds rules without restructuring; a Patch version increments for a wording clarification that changes no rule\u2019s substantive meaning. Rule IDs themselves are never renumbered or reused (PPC-1505) regardless of which version field changes.',
    owner: 'This constitution\u2019s maintainers',
    validator: 'PPCEA (planned)',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Distinguishes "the document was restructured" from "a rule\u2019s prose was clarified" from "new rules were added" so the version number itself communicates the nature of a change.',
  },
  {
    id: 'PPC-2303',
    group: 'PPC-23xx',
    statement: 'Exactly one constitution version has Historical Status CURRENT at any time; every prior version\u2019s Historical Status is SUPERSEDED and its Superseded-By field names the version that replaced it. No version is ever deleted from CONSTITUTION_VERSION_HISTORY.',
    owner: 'This constitution\u2019s maintainers',
    validator: 'validate-production-pipeline-constitution-amendment-set-2.ts',
    severity: 'BLOCKING',
    autoFixEligible: 'NO',
    rationale: 'Directly operationalizes No Parallel Truth (PPC-1207) at the level of the constitution\u2019s own version history: exactly one authoritative "current version" fact must exist.',
  },
];

// -----------------------------------------------------------------------------------------------------
// PPC-2400 — Constitutional Test Matrix (Amendment 10).
// Deliberately DERIVED from RULE_REGISTRY (never a second, independently-maintained list) so the
// matrix can never drift out of sync with the rule registry — the No Parallel Truth principle
// (PPC-1207) applied to the matrix's own construction. Provides Rule -> Validator -> Coverage
// traceability for every rule in the document, not merely a hand-picked sample.
// -----------------------------------------------------------------------------------------------------
export function buildConstitutionalTestMatrix(registry: readonly RuleRegistryEntry[]): readonly ConstitutionalTestMatrixEntry[] {
  return registry.map((rule) => {
    const validatorMentionsPlanned = /\(planned\)/i.test(rule.validator);
    const validatorIsNone = rule.validator === 'N/A' || /^N\/A/i.test(rule.validator);
    const validatorLooksReal = !validatorMentionsPlanned && !validatorIsNone;
    const coverageStatus: ConstitutionalTestMatrixEntry['coverageStatus'] = validatorIsNone ? 'NONE' : validatorLooksReal ? 'COMPLETE' : 'PARTIAL';
    const implementationStatus: ConstitutionalTestMatrixEntry['implementationStatus'] = validatorIsNone
      ? 'NOT_IMPLEMENTED'
      : validatorLooksReal
        ? 'IMPLEMENTED'
        : 'PARTIAL';
    return {
      ruleId: rule.id,
      validator: rule.validator,
      coverageStatus,
      implementationStatus,
      owner: rule.owner,
      pipelineStage: rule.group,
    };
  });
}

export const RULE_REGISTRY_PPC_2400: readonly RuleRegistryEntry[] = [
  {
    id: 'PPC-2401',
    group: 'PPC-24xx',
    statement:
      'Every constitutional rule ID in RULE_REGISTRY must have a corresponding row in the Constitutional Test Matrix, mapping Rule ID \u2192 Validator \u2192 Coverage Status \u2192 Implementation Status \u2192 Owner \u2192 Pipeline Stage. The matrix is generated mechanically (buildConstitutionalTestMatrix), never hand-maintained as a second list, so it cannot drift out of sync with the rule registry it describes.',
    owner: 'This constitution\u2019s maintainers',
    validator: 'validate-production-pipeline-constitution-amendment-set-2.ts',
    severity: 'STRUCTURAL',
    autoFixEligible: 'NO',
    rationale: 'Completes the traceability chain Rule \u2192 Implementation \u2192 Validator \u2192 Coverage for every rule in the document, not only for a hand-picked set of examples.',
  },
];

// -----------------------------------------------------------------------------------------------------
// Consolidated rule registry — every permanently-IDed rule in the document, for uniqueness/consistency
// checks. Order matches the document's PPC-1xx \u2192 PPC-24xx reading order.
// -----------------------------------------------------------------------------------------------------
export const RULE_REGISTRY: readonly RuleRegistryEntry[] = [
  ...RULE_REGISTRY_PPC_100,
  ...RULE_REGISTRY_PPC_200,
  ...RULE_REGISTRY_PPC_300,
  ...RULE_REGISTRY_PPC_400,
  ...RULE_REGISTRY_PPC_500,
  ...RULE_REGISTRY_PPC_600,
  ...RULE_REGISTRY_PPC_700,
  ...RULE_REGISTRY_PPC_800,
  ...RULE_REGISTRY_PPC_900,
  ...RULE_REGISTRY_PPC_1000,
  ...RULE_REGISTRY_PPC_1100,
  ...RULE_REGISTRY_PPC_1200,
  ...RULE_REGISTRY_PPC_1300,
  ...RULE_REGISTRY_PPC_1400,
  ...RULE_REGISTRY_PPC_1500,
  ...RULE_REGISTRY_PPC_1600,
  ...RULE_REGISTRY_PPC_1700,
  ...RULE_REGISTRY_PPC_1800,
  ...RULE_REGISTRY_PPC_1900,
  ...RULE_REGISTRY_PPC_2000,
  ...RULE_REGISTRY_PPC_2100,
  ...RULE_REGISTRY_PPC_2200,
  ...RULE_REGISTRY_PPC_2300,
  ...RULE_REGISTRY_PPC_2400,
];

/** Constitutional Test Matrix instance for the full, current RULE_REGISTRY (Amendment 10). */
export const CONSTITUTIONAL_TEST_MATRIX: readonly ConstitutionalTestMatrixEntry[] = buildConstitutionalTestMatrix(RULE_REGISTRY);
