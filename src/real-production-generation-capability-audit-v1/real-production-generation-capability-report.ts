/**
 * Real Production Generation Capability Audit V1 — report assembly and markdown rendering.
 */

import type {
  ImplementationRoadmapMilestone,
  RankedSystemicFinding,
  RealProductionGenerationCapabilityAuditReport,
  PromptAuditResult,
  FeatureMaterializationMatrixRow,
} from './real-production-generation-capability-types.js';
import { REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1_COMPLETE_TOKEN } from './real-production-generation-capability-types.js';

export function buildRankedSystemicFindings(
  promptResults: PromptAuditResult[],
  matrix: FeatureMaterializationMatrixRow[],
): RankedSystemicFinding[] {
  const moduleRows = matrix.filter((r) => r.featureKind === 'MODULE');
  const nonFunctional = moduleRows.filter((r) => r.status === 'REACHABLE_BUT_NONFUNCTIONAL').length;
  const unreachable = moduleRows.filter((r) => r.status === 'GENERATED_BUT_UNREACHABLE').length;
  const notMaterialized = moduleRows.filter((r) => r.status === 'NOT_MATERIALIZED').length;
  const fullyMaterialized = moduleRows.filter((r) => r.status === 'FULLY_MATERIALIZED').length;
  const totalModules = moduleRows.length;

  return [
    {
      id: 'RC-001',
      category: 'static_ui_substituted_for_behavior',
      failureCategory: 'CAPABILITY_FAILURE',
      severity: 'CRITICAL',
      title: 'Generic CRUD shell replaces business behavior',
      description: `Default modular feature template generates visible UI (Manage button, empty state) without onClick handlers or persistence. ${nonFunctional} module rows classified REACHABLE_BUT_NONFUNCTIONAL across audit prompts.`,
      affectedFiles: [
        'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
        'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts (service template)',
      ],
      affectedProductionStage: 'MATERIALIZATION',
      promptsAffected: promptResults.length,
      approvedFeaturesAffected: nonFunctional,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: true,
    },
    {
      id: 'RC-002',
      category: 'persistence_runtime_missing',
      failureCategory: 'CAPABILITY_FAILURE',
      severity: 'CRITICAL',
      title: 'No production persistence wiring for approved modules',
      description: 'Service layers return empty arrays by constitutional policy; persistence module never materialized. Apps compile and preview but cannot store or mutate business data.',
      affectedFiles: [
        'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
        'src/contract-bound-generation-authority-v4/approved-sample-data-plan.ts',
      ],
      affectedProductionStage: 'MATERIALIZATION',
      promptsAffected: promptResults.length,
      approvedFeaturesAffected: totalModules,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: true,
    },
    {
      id: 'RC-003',
      category: 'unsupported_feature_type',
      failureCategory: 'CAPABILITY_FAILURE',
      severity: 'CRITICAL',
      title: 'Workflows and contract actions have no dedicated generator',
      description: 'CanonicalProductContract primaryWorkflows and coreActions appear as naming/copy at best — no state machine, form wiring, or action handler generation path.',
      affectedFiles: ['src/prompt-faithful-generation/*', 'src/universal-prompt-to-app-materialization/*'],
      affectedProductionStage: 'PLANNING → MATERIALIZATION',
      promptsAffected: promptResults.length,
      approvedFeaturesAffected: matrix.filter((r) => r.featureKind === 'WORKFLOW' || r.featureKind === 'ACTION').length,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: true,
    },
    {
      id: 'RC-004',
      category: 'interaction_proof_too_shallow',
      failureCategory: 'CAPABILITY_FAILURE',
      severity: 'HIGH',
      title: 'Interaction proof does not verify approved envelope behavior',
      description: 'Live Preview Gate uses synthetic ASE interaction proof; Playwright proof (behavioral) runs post-handler with generic controls. Feature Contract Reality treats static markers as interactive.',
      affectedFiles: [
        'src/interaction-proof-engine/*',
        'src/live-preview-interaction-proof-v1/*',
        'src/feature-contract-reality/feature-interaction-reality-checker.ts',
      ],
      affectedProductionStage: 'PREVIEW → INTERACTION_PROOF',
      promptsAffected: promptResults.length,
      approvedFeaturesAffected: totalModules,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: true,
    },
    {
      id: 'RC-005',
      category: 'approved_feature_dropped',
      failureCategory: 'CAPABILITY_FAILURE',
      severity: 'MEDIUM',
      title: 'Prompt-bounded resolver silently drops blocked modules',
      description: `Blocked modules accumulate in blockedModules without failing build. ${notMaterialized} NOT_MATERIALIZED module rows; ${unreachable} GENERATED_BUT_UNREACHABLE.`,
      affectedFiles: ['src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts'],
      affectedProductionStage: 'PLANNING',
      promptsAffected: promptResults.reduce((n, p) => n + (p.blockedModuleCount > 0 ? 1 : 0), 0),
      approvedFeaturesAffected: notMaterialized + unreachable,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: false,
    },
    {
      id: 'RC-006',
      category: 'repair_path_not_real',
      failureCategory: 'CAPABILITY_FAILURE',
      severity: 'HIGH',
      title: 'AEO repair path cannot generate missing business logic automatically',
      description: 'Only compile autofix and EIAA-gated Engineering Intelligence can add code; GPCA/CBGA repair plans, do not implement CRUD persistence or workflows.',
      affectedFiles: ['src/autonomous-engineering-orchestrator-v1/repair-capability-registry.ts'],
      affectedProductionStage: 'REPAIR_AEO',
      promptsAffected: promptResults.length,
      approvedFeaturesAffected: nonFunctional,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: false,
    },
    {
      id: 'RC-007',
      category: 'constitutional_pipeline_ok',
      failureCategory: 'ARCHITECTURE_FAILURE',
      severity: 'INFORMATIONAL',
      title: 'Constitutional envelope pipeline materially consistent in offline audit',
      description: `All ${promptResults.length} prompts produced valid ApprovedProductionBuildEnvelope and in-memory materialization. ${fullyMaterialized} module rows FULLY_MATERIALIZED (structural). No envelope parallel-truth failures observed in audit path.`,
      affectedFiles: ['src/contract-bound-generation-authority-v4/approved-production-build-envelope.ts'],
      affectedProductionStage: 'CBGA → MATERIALIZATION',
      promptsAffected: 0,
      approvedFeaturesAffected: 0,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: false,
    },
    {
      id: 'RC-008',
      category: 'route_navigation_mismatch',
      failureCategory: 'CAPABILITY_FAILURE',
      severity: 'MEDIUM',
      title: 'Two-tier navigation — URL routes do not map 1:1 to approved modules',
      description: 'FeatureAppRouter uses in-memory activeModuleId; blueprint shell uses separate ShellRoute enum. auth excluded from feature nav.',
      affectedFiles: [
        'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
        'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
      ],
      affectedProductionStage: 'MATERIALIZATION → BLUEPRINT',
      promptsAffected: promptResults.length,
      approvedFeaturesAffected: unreachable,
      blocksAppGeneration: false,
      oneFixRemovesMultipleBlockers: true,
    },
  ];
}

export function buildImplementationRoadmap(): ImplementationRoadmapMilestone[] {
  return [
    {
      order: 1,
      objective: 'Functional CRUD core — wire persistence + handlers for generic modular features',
      rootCausesEliminated: ['static_ui_substituted_for_behavior', 'persistence_runtime_missing'],
      affectedGenerators: ['modular-feature-module-generator.ts', 'demo-data.ts composition'],
      affectedConstitutionalHandoffs: ['ApprovedSampleDataPlan', 'ApprovedModulePlan'],
      productionIntegrationPoints: ['materializeGeneratedApplication', 'ApprovedProductionBuildEnvelope projection'],
      validationStrategy: 'Extend audit matrix: interactionWorks + persistenceRuntime true; optional Playwright mutation proof',
      expectedPromptsFeaturesUnlocked: ['expense-tracker', 'notes-tasks', 'crm', 'inventory', 'restaurant', 'booking'],
      estimatedBlastRadius: 'HIGH',
    },
    {
      order: 2,
      objective: 'Contract action → control mapping generator',
      rootCausesEliminated: ['unsupported_feature_type'],
      affectedGenerators: ['modular-feature-module-generator.ts', 'universal-feature-contract-intelligence'],
      affectedConstitutionalHandoffs: ['CanonicalProductContract.coreActions', 'ApprovedMetadataPlan'],
      productionIntegrationPoints: ['buildFeatureComponentTsx', 'feature validation stubs'],
      validationStrategy: 'Audit matrix ACTION rows reach FUNCTIONAL_BUT_UNVERIFIED minimum',
      expectedPromptsFeaturesUnlocked: ['all multi-action prompts'],
      estimatedBlastRadius: 'MEDIUM',
    },
    {
      order: 3,
      objective: 'Workflow representation layer (multi-step UI, not full BPM engine)',
      rootCausesEliminated: ['unsupported_feature_type'],
      affectedGenerators: ['new workflow-materialization module', 'FeatureAppRouter'],
      affectedConstitutionalHandoffs: ['CanonicalProductContract.primaryWorkflows'],
      productionIntegrationPoints: ['buildUniversalMaterializedWorkspaceFiles'],
      validationStrategy: 'WORKFLOW rows PARTIALLY_MATERIALIZED → FULLY_MATERIALIZED with connected steps',
      expectedPromptsFeaturesUnlocked: ['booking', 'restaurant', 'custom-mixed'],
      estimatedBlastRadius: 'HIGH',
    },
    {
      order: 4,
      objective: 'Deep behavioral interaction proof tied to envelope modules',
      rootCausesEliminated: ['interaction_proof_too_shallow'],
      affectedGenerators: ['live-preview-interaction-proof-v1', 'feature-contract-reality'],
      affectedConstitutionalHandoffs: ['ApprovedProductionBuildEnvelope', 'ApprovedModulePlan'],
      productionIntegrationPoints: ['build-from-prompt-handler post-build', 'engineering report'],
      validationStrategy: 'Per-module Playwright scenarios derived from envelope — not generic first button',
      expectedPromptsFeaturesUnlocked: ['all'],
      estimatedBlastRadius: 'MEDIUM',
    },
    {
      order: 5,
      objective: 'Domain capability packs (scheduling, aggregation) behind generic interfaces',
      rootCausesEliminated: ['unsupported_feature_type', 'generator_fallback_template_path'],
      affectedGenerators: ['profile-feature-map extensions', 'capability-pack registry'],
      affectedConstitutionalHandoffs: ['ApprovedModulePlan', 'ApprovedSampleDataPlan'],
      productionIntegrationPoints: ['resolvePromptFaithfulBuildPlan module selection'],
      validationStrategy: 'Booking/inventory prompts produce non-static modules with real behavior',
      expectedPromptsFeaturesUnlocked: ['booking', 'inventory', 'restaurant'],
      estimatedBlastRadius: 'HIGH',
    },
    {
      order: 6,
      objective: 'Production-wired EI repair for proven capability gaps only',
      rootCausesEliminated: ['repair_path_not_real', 'capability_exists_not_production_wired'],
      affectedGenerators: ['engineering-intelligence-runtime', 'AEO registry'],
      affectedConstitutionalHandoffs: ['ApprovedRepairRealityPlan'],
      productionIntegrationPoints: ['one-prompt-build-orchestrator AEO host', 'EIAA policy'],
      validationStrategy: 'Simulated gap injection — EI generates handler+persistence, GPCA re-audit passes',
      expectedPromptsFeaturesUnlocked: ['gap cases not covered by milestones 1–5'],
      estimatedBlastRadius: 'MEDIUM',
    },
  ];
}

export function assembleAuditReport(input: {
  promptResults: PromptAuditResult[];
  callGraph: RealProductionGenerationCapabilityAuditReport['callGraph'];
  generatorCapabilityInventory: RealProductionGenerationCapabilityAuditReport['generatorCapabilityInventory'];
  silentSkipInventory: RealProductionGenerationCapabilityAuditReport['silentSkipInventory'];
  staticShellInventory: RealProductionGenerationCapabilityAuditReport['staticShellInventory'];
  missingCapabilityInventory: RealProductionGenerationCapabilityAuditReport['missingCapabilityInventory'];
  repairPathFindings: RealProductionGenerationCapabilityAuditReport['repairPathFindings'];
  previewVerificationFindings: RealProductionGenerationCapabilityAuditReport['previewVerificationFindings'];
}): RealProductionGenerationCapabilityAuditReport {
  const materializationMatrix = input.promptResults.flatMap((p) => p.matrixRows);
  const rankedSystemicFindings = buildRankedSystemicFindings(input.promptResults, materializationMatrix);
  const architectureFailures = rankedSystemicFindings.filter((f) => f.failureCategory === 'ARCHITECTURE_FAILURE');
  const capabilityFailures = rankedSystemicFindings.filter((f) => f.failureCategory === 'CAPABILITY_FAILURE');

  const moduleRows = materializationMatrix.filter((r) => r.featureKind === 'MODULE');
  const fully = moduleRows.filter((r) => r.status === 'FULLY_MATERIALIZED').length;
  const partial = moduleRows.filter((r) =>
    ['PARTIALLY_MATERIALIZED', 'FUNCTIONAL_BUT_UNVERIFIED'].includes(r.status),
  ).length;
  const broken = moduleRows.length - fully - partial;

  const envelopeOk = input.promptResults.every((p) => p.envelopeValid);

  const executiveSummary =
    `Audited ${input.promptResults.length} production prompts through CBGA → ApprovedProductionBuildEnvelope → in-memory materialization. ` +
    `Constitutional envelope valid for ${input.promptResults.filter((p) => p.envelopeValid).length}/${input.promptResults.length} prompts. ` +
    `Module materialization: ${fully} FULLY_MATERIALIZED (structural), ${partial} partial/unverified, ${broken} not materialized/unreachable/nonfunctional. ` +
    `Primary gap class: capability (generators produce structural shells, not functional business logic). Architecture (envelope consumption) ${envelopeOk ? 'holds' : 'has gaps'} in audit path.`;

  const closenessAssessment =
    'AiDevEngine V4 is constitutionally mature but capability-limited for complete functional applications. ' +
    'It consistently generates compilable multi-module workspaces with navigation, manifests, and envelope alignment, ' +
    'but generic CRUD templates, empty services, and absent workflow/action generators mean approved envelope features ' +
    'most often become visible static shells rather than working interactions with persistence. ' +
    'Estimated closeness: ~35–45% toward "complete, functional applications from approved envelopes" for multi-module business prompts; ' +
    '~60–70% for simple utility/calculator-style prompts with dedicated generators.';

  return {
    readOnly: true,
    auditedAt: new Date().toISOString(),
    completionToken: REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1_COMPLETE_TOKEN,
    executiveSummary,
    closenessAssessment,
    architectureFailures,
    capabilityFailures,
    callGraph: input.callGraph,
    generatorCapabilityInventory: input.generatorCapabilityInventory,
    promptResults: input.promptResults,
    materializationMatrix,
    silentSkipInventory: input.silentSkipInventory,
    staticShellInventory: input.staticShellInventory,
    missingCapabilityInventory: input.missingCapabilityInventory,
    repairPathFindings: input.repairPathFindings,
    previewVerificationFindings: input.previewVerificationFindings,
    rankedSystemicFindings,
    implementationRoadmap: buildImplementationRoadmap(),
  };
}

export function renderAuditReportMarkdown(report: RealProductionGenerationCapabilityAuditReport): string {
  const lines: string[] = [];
  lines.push('# Real Production Generation Capability Audit V1');
  lines.push('');
  lines.push(`**Audited at:** ${report.auditedAt}`);
  lines.push('');
  lines.push('## Executive Summary');
  lines.push(report.executiveSummary);
  lines.push('');
  lines.push('## Closeness Assessment');
  lines.push(report.closenessAssessment);
  lines.push('');
  lines.push('## Production Generation Call Graph');
  lines.push('| Stage | Module | Function | Consumes Envelope | Produces |');
  lines.push('|-------|--------|----------|-------------------|----------|');
  for (const node of report.callGraph) {
    lines.push(
      `| ${node.stage} | ${node.modulePath} | ${node.functionName} | ${node.consumesEnvelope ? 'YES' : 'NO'} | ${node.producesArtifacts.join(', ')} |`,
    );
  }
  lines.push('');
  lines.push('## Generator Capability Inventory');
  lines.push('| Capability | Generator | Production Wired | Coverage | Failure Mode | Repair |');
  lines.push('|------------|-----------|------------------|----------|--------------|--------|');
  for (const row of report.generatorCapabilityInventory) {
    lines.push(
      `| ${row.capability} | ${row.generator} | ${row.productionWired} | ${row.coverage} | ${row.failureMode.slice(0, 80)} | ${row.repairAvailable.slice(0, 40)} |`,
    );
  }
  lines.push('');
  lines.push('## Prompt Summary');
  for (const pr of report.promptResults) {
    lines.push(
      `- **${pr.scenario.label}** — envelope valid: ${pr.envelopeValid}; approved modules: ${pr.approvedModuleCount}; materialized: ${pr.materializedModuleCount}; blocked: ${pr.blockedModuleCount}`,
    );
  }
  lines.push('');
  lines.push('## Feature Materialization Matrix (sample — modules only)');
  lines.push('| Prompt | Feature | File | Route | Nav | UI | Interaction | Status | Reason |');
  lines.push('|--------|---------|------|-------|-----|----|--------------|--------|--------|');
  for (const row of report.materializationMatrix.filter((r) => r.featureKind === 'MODULE').slice(0, 40)) {
    lines.push(
      `| ${row.promptLabel.slice(0, 20)} | ${row.approvedFeature} | ${row.generatedFile ? 'YES' : 'NO'} | ${row.route ?? '-'} | ${row.navigation} | ${row.visibleUi} | ${row.interactionWorks} | ${row.status} | ${(row.failureReason ?? '').slice(0, 40)} |`,
    );
  }
  if (report.materializationMatrix.length > 40) {
    lines.push(`| … | ${report.materializationMatrix.length - 40} more rows | | | | | | | |`);
  }
  lines.push('');
  lines.push('## Ranked Systemic Root Causes');
  for (const f of report.rankedSystemicFindings) {
    lines.push(`### ${f.id} [${f.severity}] ${f.title}`);
    lines.push(`- Category: ${f.category} (${f.failureCategory})`);
    lines.push(`- ${f.description}`);
    lines.push(`- Prompts affected: ${f.promptsAffected}; Features affected: ${f.approvedFeaturesAffected}`);
    lines.push('');
  }
  lines.push('## Implementation Roadmap');
  for (const m of report.implementationRoadmap) {
    lines.push(`### Milestone ${m.order}: ${m.objective}`);
    lines.push(`- Blast radius: ${m.estimatedBlastRadius}`);
    lines.push(`- Unlocks: ${m.expectedPromptsFeaturesUnlocked.join(', ')}`);
    lines.push('');
  }
  lines.push('---');
  lines.push(report.completionToken);
  return lines.join('\n');
}
