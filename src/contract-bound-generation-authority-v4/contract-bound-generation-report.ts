/**
 * Contract-Bound Generation Authority V4 — reporting.
 *
 * Renders the module/route/navigation plan tables, surface plan summary, unsupported-items-removed
 * lists, repairs applied, final gate outcome, and the mandatory capability matrix.
 */

import type {
  CbgaGenerationReport,
  CbgaModulePlanEntry,
  CbgaNavigationPlanItem,
  CbgaRoutePlanEntry,
  CbgaSurfacePlan,
} from './contract-bound-generation-types.js';

export interface CapabilityMatrixRow {
  capability: string;
  status: string;
  productionWired: string;
  autoRun: string;
  activationAllowed: string;
  notes: string;
}

/** The mandatory capability matrix — includes at minimum the 11 capabilities the milestone requires. */
export const CBGA_CAPABILITY_MATRIX_ROWS: CapabilityMatrixRow[] = [
  {
    capability: 'Contract-Bound Generation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (module/route/nav/surface repair from contract)',
    activationAllowed: 'YES',
    notes: 'Gates + repairs generator inputs against the canonical product contract before materialization.',
  },
  {
    capability: 'Autonomous Engineering Orchestrator',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (matched, safe repairs only)',
    activationAllowed: 'YES',
    notes: 'Diagnoses build failures, applies safe repairs, routes missing capabilities.',
  },
  {
    capability: 'Engineering Intelligence Activation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'NO (decision authority only)',
    activationAllowed: 'CONDITIONAL (8-point policy)',
    notes: 'Decides whether the Engineering Intelligence Runtime may be invoked for a missing capability.',
  },
  {
    capability: 'Engineering Intelligence Runtime',
    status: 'IMPLEMENTED',
    productionWired: 'PARTIAL',
    autoRun: 'NO (gated by EIAA)',
    activationAllowed: 'CONDITIONAL',
    notes: 'Generates missing capabilities; never installs automatically, always separately validated.',
  },
  {
    capability: 'Product Faithfulness',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'N/A (audit)',
    activationAllowed: 'N/A',
    notes: 'Builds the canonical product contract and audits generation-pipeline concept drift.',
  },
  {
    capability: 'Product Faithfulness Repair',
    status: 'IMPLEMENTED',
    productionWired: 'SIMULATED',
    autoRun: 'NO',
    activationAllowed: 'NO',
    notes: 'In-memory stage-evidence reconciliation only — never regenerates workspace files.',
  },
  {
    capability: 'Fresh Build Artifact Isolation',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Purges stale prior-build artifacts before planning/materialization for a NEW_BUILD.',
  },
  {
    capability: 'Project Context Isolation',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Prevents cross-project/prior-prompt context bleed into the active build.',
  },
  {
    capability: 'Build Reality AutoFix',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (targeted retries)',
    activationAllowed: 'N/A',
    notes: 'Repairs compiler/build failures during the AEE build-autofix loop.',
  },
  {
    capability: 'Build Execution Stabilizer',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Stabilizes npm install/build execution before/after materialization.',
  },
  {
    capability: 'Live Preview Gate',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Blocks preview activation until live-preview proof requirements are satisfied.',
  },
  {
    capability: 'Identity Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Enforces PPC-1207 No Parallel Truth for product identity after CBGA approval. CBGA (this authority) now packages its already-repaired appTitle + the contract\'s productIdentity into a single, typed, immutable ApprovedProductIdentity handoff (approved-product-identity.ts, source=CBGA_REPAIRED_PLAN), threaded by the orchestrator into materialization. Downstream generators that previously re-derived identity independently — the Universal Feature Contract builder\'s productName (extractPromptAppTitle per profile branch), the materialization engine\'s own two-level "Custom App" sentinel fallback (extractPromptAppTitle → UniversalFeatureContract.productName), and buildFeatureAppRouterTsx\'s customDomainCopy.headline-split — now consume the approved identity directly whenever supplied and never fall back once it is. extractAppName/extractPromptAppTitle remain as documented draft/pre-contract-only derivations (still used to seed the initial pre-CBGA build plan and by isolated/test-only callers); no production path downstream of CBGA repair calls them. Materialization refuses (GENERATION_PIPELINE_NON_COMPLIANT) rather than falling back if CBGA ever failed to produce a valid identity. GPCA\'s titleTraceability additionally (never instead) accepts a match against the approved identity. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1609, PPC-1701, PPC-1702, PPC-1703.',
  },
  {
    capability: 'Navigation Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Implements PPC-1207 by collapsing all downstream navigation computation onto one immutable ApprovedNavigationPlan (approved-navigation-plan.ts, source=CBGA_REPAIRED_NAVIGATION_PLAN) produced immediately after CBGA repair. Built by filtering CBGA\'s own contract-derived navigationPlan down to items whose moduleId is in the final approved module set (repairedInputs.moduleIds) — the identical filter repairNavigationPlan already applies on a repair, now applied unconditionally so the plan is always populated correctly even when the gate was already GENERATION_ALLOWED (previously repairedInputs.navigationLabels stayed an empty identity-patch of the adapter\'s always-empty proposedNavigationLabels in that branch — never a usable signal). Threaded by the orchestrator into materialization, and from there into the blueprint generator/product surface (default-shell gating), the modular feature router generator (buildFeatureAppRouterTsx now renders navigation items directly from the plan\'s approved moduleId/label pairs instead of independently deriving them from ProfileFeatureDefinition.featureModules via moduleIdToDisplayName), the Universal Feature Contract (new top-level, additive `navigation` field), and generated manifests (.generated-app-manifest.json navigationLabels, blueprint-manifest.json approvedNavigationLabels). Infrastructure navigation (root/frame/layout — infrastructure-navigation-model.ts) remains exclusively owned by the Blueprint Infrastructure Layer and is never part of this plan\'s navigationItems. Materialization refuses (GENERATION_PIPELINE_NON_COMPLIANT) rather than falling back if CBGA ever failed to produce a structurally valid plan. GPCA\'s navigationTraceability additionally (never instead) accepts a match against the approved plan\'s navigationItems. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1603, PPC-1702, PPC-1703, PPC-1704.',
  },
  {
    capability: 'Module Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 5 — implements PPC-1207 No Parallel Truth for modules by collapsing all downstream module-metadata computation onto one immutable ApprovedModulePlan (approved-module-plan.ts, source=CBGA_REPAIRED_MODULE_PLAN) produced immediately after CBGA repair. Built by filtering CBGA\'s own contract-derived modulePlan down to entries whose moduleId is in the final approved module set (repairedInputs.moduleIds) — the identical filter repairModulePlan already applies on a repair — with each entry\'s route joined from routePlan by moduleId; system-shell modules (auth/dashboard/settings/persistence) are never fabricated into moduleEntries and remain documented only via the generic systemShellModuleIds taxonomy. Threaded by the orchestrator (with a PPC-1207 constitutional guard that fails materialization with GENERATION_PIPELINE_NON_COMPLIANT rather than deriving fallback modules) through code-generation-engine/universal-crud-app-generator into universal-app-materialization-engine, and from there into: buildAllModularFeatureModuleFiles/buildModularFeatureModuleFiles (registry+manifest entry displayName/route), buildFeatureAppRouterTsx (nav label second-priority source after ApprovedNavigationPlan), deriveBlueprintContractCopy\'s moduleDisplayNameOf (coreFeatureLabel), the Universal Feature Contract\'s new additive `modules` field, the generated app manifest\'s new `approvedModuleIds` field, and blueprint-manifest.json\'s new `approvedModuleIds` field. GPCA\'s moduleTraceability extended additively (never replacing the existing modulePlan check) to check ApprovedModulePlan.moduleEntries first. Which modules materialize as files at all remains driven by ProfileFeatureDefinition.featureModules exactly as before (unchanged — CBGA decision-making and the generator\'s module-selection logic are untouched) — this collapse targets only the previously independently-computed displayName/route/order metadata for the modules CBGA already approved. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703.',
  },
  {
    capability: 'Metadata Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 6 — implements PPC-1207 No Parallel Truth for production metadata by collapsing all downstream title/subtitle/description/count/summary computation onto one immutable ApprovedMetadataPlan (approved-metadata-plan.ts, source=CBGA_COMPOSED_METADATA_PLAN) produced immediately after CBGA approval. Built by deterministic composition over ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + the canonical product contract — never an independent derivation. Threaded by the orchestrator (with a PPC-1207 constitutional guard that fails materialization with GENERATION_PIPELINE_NON_COMPLIANT rather than deriving fallback metadata) through code-generation-engine/universal-crud-app-generator into universal-app-materialization-engine, and from there into: blueprint tagline (applicationSubtitle), runtime shell document title, Universal Feature Contract metadata field, generated app manifest (approvedApplicationSubtitle + approvedMetadataSummary), build-manifest.json, and blueprint-manifest.json approvedMetadataSummary. GPCA\'s titleTraceability and new metadataTraceability extended additively (never replacing existing checks) to accept ApprovedMetadataPlan.applicationTitle and verify composition integrity against the three source handoffs. Never modifies GPCA scoring/enforcement, CBGA repair policy, Product Faithfulness, or AEO/EIAA. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703.',
  },
  {
    capability: 'Sample Data Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 7 — implements PPC-1207 No Parallel Truth for sample/demo/seed/preview/dashboard data by collapsing all downstream sample computation onto one immutable ApprovedSampleDataPlan (approved-sample-data-plan.ts, source=CBGA_COMPOSED_SAMPLE_DATA_PLAN) produced immediately after CBGA approval. Built by deterministic composition over ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + ApprovedMetadataPlan + the canonical product contract — never an independent derivation of business records. Default: no invented sample records (`approvedSamplesPresent: false`); generators render infrastructure empty states. Threaded by the orchestrator (with a PPC-1207 constitutional guard) through code-generation-engine into universal-app-materialization-engine, blueprint generator/product surface, safe-payment placeholder policy, Universal Feature Contract, generated app manifest, build-manifest.json, and blueprint-manifest.json. GPCA\'s new sampleDataTraceability extended additively. Independent sample/demo/preview generation is constitutionally prohibited under PPC-1207. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703, PPC-1800, PPC-1900.',
  },
  {
    capability: 'Provenance Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 8 — implements PPC-1207 No Parallel Truth for artifact provenance/ancestry by collapsing all downstream provenance computation onto one immutable ApprovedProvenancePlan (approved-provenance-plan.ts, source=CBGA_COMPOSED_PROVENANCE_PLAN) produced immediately after CBGA approval. Built by deterministic composition over all prior approved handoffs plus CBGA repaired inputs and canonical contract evidence — never an independent reconstruction. Threaded by the orchestrator (with a PPC-1207 constitutional guard) through GPCA traceability, manifests, engineering report, blueprint generator, materialization, and feature contract. GPCA projects ancestry from ApprovedProvenancePlan.ancestryChains additively when available. Independent provenance generation is constitutionally prohibited under PPC-1207. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703, PPC-1800, PPC-1900, PPC-2100 series.',
  },
  {
    capability: 'Repair Reality Alignment',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 9 — implements PPC-1207 repair truth alignment by collapsing all repair reporting onto one immutable ApprovedRepairRealityPlan (approved-repair-reality-plan.ts, source=CBGA_COMPOSED_REPAIR_REALITY_PLAN). Every repair is constitutionally classified (repair-reality-types.ts). CBGA seeds input repairs; the orchestrator extends the plan after every real post-CBGA repair. Evidence-only/report-only repairs never masquerade as workspace mutations. Real mutations require constitutional revalidation (GPCA, Product Faithfulness, PPC) before preview activation. Threaded through manifests, engineering report, feature contract, and GPCA repairRealityTraceability additively. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1700 series, PPC-1800 series, PPC-1900 series, PPC-2100 series.',
  },
  {
    capability: 'Final Immutable Production Pipeline',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 10 — completes the constitutional production pipeline by collapsing every post-CBGA handoff into one immutable ApprovedProductionBuildEnvelope (approved-production-build-envelope.ts). Built once immediately after CBGA approval; threaded exclusively through orchestrator, materialization, blueprint, feature generation, runtime, preview, engineering report, and manifests. Downstream stages project constitutional handoffs only from the envelope — never read ApprovedProductIdentity, ApprovedNavigationPlan, ApprovedModulePlan, ApprovedMetadataPlan, ApprovedSampleDataPlan, ApprovedProvenancePlan, or ApprovedRepairRealityPlan independently. Constitutional state machine (production-pipeline-state-machine.ts) enforces single forward transitions through BUILD_ENVELOPE_CREATED → MATERIALIZATION → WORKSPACE_READY → GPCA_APPROVED → BUILD_VALIDATED → PREVIEW_READY → ENGINEERING_REPORT_COMPLETE. Preview guarantee: GPCA-audited workspace = preview = engineering report = manifests = envelope workspace. Mutations fail GENERATION_PIPELINE_NON_COMPLIANT rather than silently updating constitutional state. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600 series, PPC-1700 series, PPC-1800 series, PPC-1900 series, PPC-2100 series, PPC-2200.',
  },
];

export function listCapabilityMatrixCapabilityNames(): string[] {
  return CBGA_CAPABILITY_MATRIX_ROWS.map((r) => r.capability);
}

export function renderCapabilityMatrixMarkdown(): string {
  const header = '| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |';
  const divider = '|------------|--------|------------------|----------|--------------------|-------|';
  const rows = CBGA_CAPABILITY_MATRIX_ROWS.map(
    (r) => `| ${r.capability} | ${r.status} | ${r.productionWired} | ${r.autoRun} | ${r.activationAllowed} | ${r.notes} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderModulePlanTable(modulePlan: readonly CbgaModulePlanEntry[]): string {
  const header = '| Module ID | Display Name | Source Contract Concept | Evidence Source | Confidence | Allowed |';
  const divider = '|-----------|--------------|--------------------------|------------------|------------|---------|';
  const rows = modulePlan.map(
    (m) =>
      `| ${m.moduleId} | ${m.displayName} | ${m.sourceContractConcept} | ${m.evidenceSource} | ${m.confidence} | ${m.generationAllowed ? 'YES' : 'NO'} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderRoutePlanTable(routePlan: readonly CbgaRoutePlanEntry[]): string {
  const header = '| Route ID | Path | Label | Module ID | Source Contract Concept |';
  const divider = '|----------|------|-------|-----------|--------------------------|';
  const rows = routePlan.map(
    (r) => `| ${r.routeId} | ${r.path} | ${r.label} | ${r.moduleId} | ${r.sourceContractConcept} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderNavigationPlanTable(navigationPlan: readonly CbgaNavigationPlanItem[]): string {
  const header = '| Label | Path | Module ID | Source Contract Concept | Visibility Reason |';
  const divider = '|-------|------|-----------|--------------------------|--------------------|';
  const rows = navigationPlan.map(
    (n) => `| ${n.label} | ${n.path} | ${n.moduleId} | ${n.sourceContractConcept} | ${n.visibilityReason} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderSurfacePlanSummary(surfacePlan: CbgaSurfacePlan): string {
  return [
    `- **Title requirement:** ${surfacePlan.titleRequirement}`,
    `- **Primary interaction requirement:** ${surfacePlan.primaryInteractionRequirement}`,
    `- **Empty state requirement:** ${surfacePlan.emptyStateRequirement}`,
    `- **Success state requirement:** ${surfacePlan.successStateRequirement}`,
    `- **Required controls:** ${surfacePlan.requiredControls.join(', ') || '(none)'}`,
    `- **Required data concepts:** ${surfacePlan.requiredDataConcepts.join(', ') || '(none)'}`,
    `- **Source contract concept:** ${surfacePlan.sourceContractConcept}`,
  ].join('\n');
}

export function renderContractBoundGenerationReportMarkdown(report: CbgaGenerationReport): string {
  const lines: string[] = [];
  lines.push('# Contract-Bound Generation Authority V4 — Report');
  lines.push('');
  lines.push(`**Contract ID:** ${report.contractId}`);
  lines.push(`**Product identity:** ${report.productIdentity}`);
  lines.push(`**Final gate outcome:** ${report.finalGateOutcome}`);
  lines.push('');
  lines.push('## Module Plan');
  lines.push(renderModulePlanTable(report.modulePlan));
  lines.push('');
  lines.push('## Route Plan');
  lines.push(renderRoutePlanTable(report.routePlan));
  lines.push('');
  lines.push('## Navigation Plan');
  lines.push(renderNavigationPlanTable(report.navigationPlan));
  lines.push('');
  lines.push('## Surface Plan');
  lines.push(renderSurfacePlanSummary(report.surfacePlan));
  lines.push('');
  lines.push('## Unsupported Items Removed Before Generation');
  lines.push(`- **Unsupported modules removed:** ${report.initialGate.unsupportedModulesRemoved.join(', ') || '(none)'}`);
  lines.push(`- **Unsupported routes removed:** ${report.initialGate.unsupportedRoutesRemoved.join(', ') || '(none)'}`);
  lines.push(`- **Unsupported navigation removed:** ${report.initialGate.unsupportedNavigationRemoved.join(', ') || '(none)'}`);
  lines.push(`- **Generic shell surface blocked:** ${report.initialGate.genericShellSurfaceBlocked ? 'YES' : 'NO'}`);
  lines.push('');
  lines.push('## Repairs Applied');
  lines.push(
    report.repairsApplied.length > 0
      ? report.repairsApplied.map((a) => `- **${a.actionId}:** ${a.detail}`).join('\n')
      : '- (no repairs were required)',
  );
  lines.push('');
  lines.push('## Capability Matrix');
  lines.push(renderCapabilityMatrixMarkdown());
  return lines.join('\n');
}
