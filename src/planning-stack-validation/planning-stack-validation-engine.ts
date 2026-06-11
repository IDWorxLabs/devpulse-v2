/**
 * End-to-end planning stack validation — real pipeline, no mocks, no shortcuts.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import {
  resetDevPulseV2AiDevEngineAuthorityForTests,
  getDevPulseV2AiDevEngineAuthority,
} from '../aidev-engine/aidev-engine-authority.js';
import { AIDEV_OWNER_MODULE } from '../aidev-engine/types.js';
import { assertAiDevOwnershipUnchanged } from '../requirement-extractor/requirement-aidev-bridge.js';
import {
  resetDevPulseV2RequirementExtractorAuthorityForTests,
  getDevPulseV2RequirementExtractorAuthority,
} from '../requirement-extractor/requirement-extractor-authority.js';
import { EXTRACTOR_OWNER_MODULE } from '../requirement-extractor/types.js';
import { assertRequirementExtractorOwnershipUnchanged, buildArchitectureFromRequirements } from '../product-architect/product-requirement-bridge.js';
import {
  resetDevPulseV2ProductArchitectAuthorityForTests,
  getDevPulseV2ProductArchitectAuthority,
} from '../product-architect/product-architect-authority.js';
import { ARCHITECT_OWNER_MODULE } from '../product-architect/types.js';
import { DUPLICATE_RISK_PREFIX as ARCHITECT_DUP } from '../product-architect/types.js';
import { generatePackagesFromBlueprint } from '../build-package-generator/package-architect-bridge.js';
import {
  resetDevPulseV2BuildPackageGeneratorAuthorityForTests,
  getDevPulseV2BuildPackageGeneratorAuthority,
} from '../build-package-generator/build-package-generator-authority.js';
import { GENERATOR_OWNER_MODULE } from '../build-package-generator/types.js';
import { DUPLICATE_RISK_PREFIX as PACKAGE_DUP } from '../build-package-generator/types.js';
import { generateStrategyFromPackages } from '../implementation-strategy-engine/strategy-package-bridge.js';
import {
  resetDevPulseV2ImplementationStrategyAuthorityForTests,
  getDevPulseV2ImplementationStrategyAuthority,
} from '../implementation-strategy-engine/implementation-strategy-authority.js';
import { STRATEGY_OWNER_MODULE } from '../implementation-strategy-engine/types.js';
import { DUPLICATE_RISK_PREFIX as STRATEGY_DUP } from '../implementation-strategy-engine/types.js';
import { generatePlanFromStrategy } from '../code-generation-planner/code-plan-strategy-bridge.js';
import { assertCodeGenerationPlannerOwnershipUnchanged } from '../recovery-strategy-planner/recovery-code-plan-bridge.js';
import {
  resetDevPulseV2CodeGenerationPlannerAuthorityForTests,
} from '../code-generation-planner/code-generation-planner-authority.js';
import { PLANNER_OWNER_MODULE } from '../code-generation-planner/types.js';
import { DUPLICATE_RISK_PREFIX as PLAN_DUP } from '../code-generation-planner/types.js';
import {
  generateRecoveryFromStrategy,
} from '../recovery-strategy-planner/recovery-strategy-bridge.js';
import {
  resetDevPulseV2RecoveryStrategyAuthorityForTests,
} from '../recovery-strategy-planner/recovery-strategy-authority.js';
import { RECOVERY_OWNER_MODULE } from '../recovery-strategy-planner/types.js';
import { DUPLICATE_RISK_PREFIX as RECOVERY_DUP } from '../recovery-strategy-planner/types.js';
import { detectExistingCapabilities as detectArchitectDup } from '../product-architect/product-architecture-engine.js';
import { detectExistingCapabilities as detectPackageDup } from '../build-package-generator/build-package-engine.js';
import { detectExistingCapabilities as detectStrategyDup } from '../implementation-strategy-engine/implementation-strategy-engine.js';
import { detectExistingCapabilities as detectPlanDup } from '../code-generation-planner/code-planning-engine.js';
import { detectExistingCapabilities as detectRecoveryDup } from '../recovery-strategy-planner/recovery-strategy-engine.js';
import { detectExistingCapabilities as detectExtractorDup } from '../requirement-extractor/requirement-extraction-engine.js';
import { detectPotentialDuplicates as detectExtractorPotentialDup } from '../requirement-extractor/requirement-extraction-engine.js';
import { detectPotentialDuplicates as detectArchitectPotentialDup } from '../product-architect/product-architecture-engine.js';
import { detectPotentialDuplicates as detectPackagePotentialDup } from '../build-package-generator/build-package-engine.js';
import { detectPotentialDuplicates as detectStrategyPotentialDup } from '../implementation-strategy-engine/implementation-strategy-engine.js';
import { detectPotentialDuplicates as detectPlanPotentialDup } from '../code-generation-planner/code-planning-engine.js';
import { detectPotentialDuplicates as detectRecoveryPotentialDup } from '../recovery-strategy-planner/recovery-strategy-engine.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  resetDevPulseV2ProjectVaultAuthorityForTests,
  getDevPulseV2ProjectVaultAuthority,
} from '../project-vault/project-vault-authority.js';
import {
  resetClarifyingLiveGateMetricsForTests,
} from '../clarifying-question-intelligence/clarifying-question-live-gate.js';
import {
  resetClarifyingLiveGateMemoryForTests,
} from '../clarifying-question-intelligence/clarifying-question-live-gate-memory.js';
import type {
  DuplicateDetectionStatus,
  HandoffValidation,
  OwnershipIntegrityCheck,
  Phase5Readiness,
  PlanningStackValidationResult,
} from './types.js';
import {
  DUPLICATE_RISK_PREFIX,
  PLANNING_STACK_VALIDATION_REQUEST,
  PLANNING_SYSTEMS,
} from './types.js';

function createValidationId(): string {
  return `stack-val-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeHandoff(
  handoffId: HandoffValidation['handoffId'],
  sourceSystem: string,
  targetSystem: string,
  sourceProducedOutput: boolean,
  targetConsumedOutput: boolean,
  ownershipPreserved: boolean,
  detail: string,
): HandoffValidation {
  return {
    handoffId,
    sourceSystem,
    targetSystem,
    sourceProducedOutput,
    targetConsumedOutput,
    ownershipPreserved,
    detail,
  };
}

export function validateOwnershipIntegrity(): OwnershipIntegrityCheck[] {
  return [
    {
      domain: 'chat_authority',
      expectedOwner: CHAT_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('chat_authority').ownerModule,
      preserved: getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    },
    {
      domain: 'chat_answer_authority',
      expectedOwner: CHAT_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('chat_answer_authority').ownerModule,
      preserved: getDevPulseV2Owner('chat_answer_authority').ownerModule === CHAT_OWNER_MODULE,
    },
    {
      domain: 'central_brain',
      expectedOwner: CENTRAL_BRAIN_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('central_brain').ownerModule,
      preserved: getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    },
    {
      domain: 'trust_engine',
      expectedOwner: TRUST_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('trust_engine').ownerModule,
      preserved: getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    },
    {
      domain: 'project_vault',
      expectedOwner: VAULT_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('project_vault').ownerModule,
      preserved: getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    },
    {
      domain: 'evidence_registry',
      expectedOwner: REGISTRY_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('evidence_registry').ownerModule,
      preserved: getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    },
    {
      domain: 'timeline_event_ledger',
      expectedOwner: LEDGER_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('timeline_event_ledger').ownerModule,
      preserved: getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    },
  ];
}

export function validateDuplicateDetectionSystems(): DuplicateDetectionStatus[] {
  const systems: Array<{
    systemId: string;
    detectExisting: unknown;
    detectPotential: unknown;
  }> = [
    {
      systemId: 'requirement_extractor',
      detectExisting: detectExtractorDup,
      detectPotential: detectExtractorPotentialDup,
    },
    {
      systemId: 'product_architect',
      detectExisting: detectArchitectDup,
      detectPotential: detectArchitectPotentialDup,
    },
    {
      systemId: 'build_package_generator',
      detectExisting: detectPackageDup,
      detectPotential: detectPackagePotentialDup,
    },
    {
      systemId: 'implementation_strategy_engine',
      detectExisting: detectStrategyDup,
      detectPotential: detectStrategyPotentialDup,
    },
    {
      systemId: 'code_generation_planner',
      detectExisting: detectPlanDup,
      detectPotential: detectPlanPotentialDup,
    },
    {
      systemId: 'recovery_strategy_planner',
      detectExisting: detectRecoveryDup,
      detectPotential: detectRecoveryPotentialDup,
    },
  ];

  return systems.map((s) => ({
    systemId: s.systemId,
    hasDetectExistingCapabilities: typeof s.detectExisting === 'function',
    hasDetectPotentialDuplicates: typeof s.detectPotential === 'function',
    active: typeof s.detectExisting === 'function' && typeof s.detectPotential === 'function',
  }));
}

function countDuplicateRisks(
  extraction: { warnings: string[] },
  blueprint: { warnings: string[]; components: Array<{ warnings: string[] }> },
  packages: { packages: Array<{ duplicateRisks: string[]; warnings: string[] }>; warnings: string[] },
  strategy: { duplicateRisks: string[]; warnings: string[] },
  codePlan: { tasks: Array<{ duplicateRisks: string[] }>; warnings: string[] },
  recovery: { duplicateRisks: string[]; warnings: string[] },
): number {
  let count = 0;
  const allWarnings = [
    ...extraction.warnings,
    ...blueprint.warnings,
    ...packages.warnings,
    ...strategy.warnings,
    ...codePlan.warnings,
    ...recovery.warnings,
    ...strategy.duplicateRisks,
    ...recovery.duplicateRisks,
    ...packages.packages.flatMap((p) => p.duplicateRisks),
    ...codePlan.tasks.flatMap((t) => t.duplicateRisks),
    ...blueprint.components.flatMap((c) => c.warnings),
  ];
  for (const w of allWarnings) {
    if (w.startsWith(DUPLICATE_RISK_PREFIX) || w.startsWith(ARCHITECT_DUP) || w.startsWith(PACKAGE_DUP)) {
      count++;
    }
  }
  return count;
}

export function determinePhase5Readiness(
  handoffs: HandoffValidation[],
  ownershipChecks: OwnershipIntegrityCheck[],
  result: PlanningStackValidationResult,
): Phase5Readiness {
  const allHandoffsValid = handoffs.every(
    (h) => h.sourceProducedOutput && h.targetConsumedOutput && h.ownershipPreserved,
  );
  const noOwnershipViolations = ownershipChecks.every((c) => c.preserved);
  const answerAuthorityOk = assertSingleAnswerAuthorityRegistered();
  const hasOutputs =
    result.errors.length === 0 &&
    handoffs.length === 6 &&
    result.overallStatus === 'PASS';

  if (allHandoffsValid && noOwnershipViolations && answerAuthorityOk && hasOutputs) {
    return 'PHASE_5_READY';
  }
  return 'PHASE_5_NOT_READY';
}

export function runPlanningStackValidation(
  requestText: string = PLANNING_STACK_VALIDATION_REQUEST,
): PlanningStackValidationResult {
  const warnings: string[] = [
    'Planning Stack Reality Validation — handoff verification only, no code generation, execution, or project modification.',
  ];
  const errors: string[] = [];

  resetDevPulseV2AiDevEngineAuthorityForTests();
  resetDevPulseV2RequirementExtractorAuthorityForTests();
  resetDevPulseV2ProductArchitectAuthorityForTests();
  resetDevPulseV2BuildPackageGeneratorAuthorityForTests();
  resetDevPulseV2ImplementationStrategyAuthorityForTests();
  resetDevPulseV2CodeGenerationPlannerAuthorityForTests();
  resetDevPulseV2RecoveryStrategyAuthorityForTests();
  resetDevPulseV2ProjectVaultAuthorityForTests();
  resetClarifyingLiveGateMemoryForTests();
  resetClarifyingLiveGateMetricsForTests();

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.createProject('Expense Tracker Legacy', 'Existing ExpenseModule capability');
  vault.addProjectFact(project.projectId, {
    source: 'SYSTEM',
    label: 'module',
    value: 'ExpenseModule',
    confidence: 'HIGH',
  });

  const aidev = getDevPulseV2AiDevEngineAuthority();
  const extractor = getDevPulseV2RequirementExtractorAuthority();

  const request = aidev.intakeBuildRequest(requestText);
  const extraction = extractor.extractFromAiDevRequest(request, { projectId: project.projectId });
  const blueprint = buildArchitectureFromRequirements(extraction);
  const packages = generatePackagesFromBlueprint(blueprint);
  const implStrategy = generateStrategyFromPackages(packages);
  const codePlan = generatePlanFromStrategy(implStrategy);
  const recovery = generateRecoveryFromStrategy(implStrategy, codePlan);

  const handoffs: HandoffValidation[] = [
    makeHandoff(
      'aidev_to_requirements',
      'aidev_engine',
      'requirement_extractor',
      request.requestId.length > 0,
      extraction.requestId === request.requestId && extraction.requirements.length > 0,
      assertAiDevOwnershipUnchanged() &&
        getDevPulseV2Owner('aidev_engine').ownerModule === AIDEV_OWNER_MODULE,
      `request=${request.requestId} requirements=${extraction.requirements.length}`,
    ),
    makeHandoff(
      'requirements_to_architect',
      'requirement_extractor',
      'product_architect',
      extraction.requirements.length > 0,
      blueprint.components.length > 0 && blueprint.requestId === extraction.requestId,
      assertRequirementExtractorOwnershipUnchanged() &&
        getDevPulseV2Owner('requirement_extractor').ownerModule === EXTRACTOR_OWNER_MODULE,
      `components=${blueprint.components.length}`,
    ),
    makeHandoff(
      'architect_to_packages',
      'product_architect',
      'build_package_generator',
      blueprint.components.length > 0,
      packages.packages.length > 0 &&
        packages.packages.every((p) => p.blueprintId === blueprint.blueprintId),
      getDevPulseV2ProductArchitectAuthority().constructor.name ===
        'DevPulseV2ProductArchitectAuthority' &&
        getDevPulseV2Owner('product_architect').ownerModule === ARCHITECT_OWNER_MODULE,
      `packages=${packages.packageCount}`,
    ),
    makeHandoff(
      'packages_to_strategy',
      'build_package_generator',
      'implementation_strategy_engine',
      packages.packages.length > 0,
      implStrategy.phases.length > 0,
      getDevPulseV2BuildPackageGeneratorAuthority().constructor.name ===
        'DevPulseV2BuildPackageGeneratorAuthority' &&
        getDevPulseV2Owner('build_package_generator').ownerModule === GENERATOR_OWNER_MODULE,
      `phases=${implStrategy.phases.length}`,
    ),
    makeHandoff(
      'strategy_to_code_plan',
      'implementation_strategy_engine',
      'code_generation_planner',
      implStrategy.phases.length > 0,
      codePlan.tasks.length > 0 && codePlan.strategyId === implStrategy.strategyId,
      getDevPulseV2ImplementationStrategyAuthority().constructor.name ===
        'DevPulseV2ImplementationStrategyAuthority' &&
        getDevPulseV2Owner('implementation_strategy_engine').ownerModule === STRATEGY_OWNER_MODULE,
      `tasks=${codePlan.tasks.length}`,
    ),
    makeHandoff(
      'code_plan_to_recovery',
      'code_generation_planner',
      'recovery_strategy_planner',
      codePlan.tasks.length > 0,
      recovery.scenarios.length > 0 && recovery.codePlanId === codePlan.planId,
      assertCodeGenerationPlannerOwnershipUnchanged() &&
        getDevPulseV2Owner('code_generation_planner').ownerModule === PLANNER_OWNER_MODULE &&
        getDevPulseV2Owner('recovery_strategy_planner').ownerModule === RECOVERY_OWNER_MODULE,
      `scenarios=${recovery.scenarios.length}`,
    ),
  ];

  const ownershipChecks = validateOwnershipIntegrity();
  const duplicateDetection = validateDuplicateDetectionSystems();

  const duplicateRiskCount = countDuplicateRisks(
    extraction,
    blueprint,
    packages,
    implStrategy,
    codePlan,
    recovery,
  );
  const duplicateRiskPropagated = duplicateRiskCount > 0;

  for (const h of handoffs) {
    if (!h.sourceProducedOutput || !h.targetConsumedOutput || !h.ownershipPreserved) {
      errors.push(`Handoff failed: ${h.handoffId} — ${h.detail}`);
    }
  }

  for (const c of ownershipChecks) {
    if (!c.preserved) {
      errors.push(`Ownership violation: ${c.domain} expected ${c.expectedOwner} got ${c.actualOwner}`);
    }
  }

  if (!duplicateDetection.every((d) => d.active)) {
    errors.push('Duplicate detection not active in all planning systems.');
  }

  const overallStatus = errors.length === 0 ? 'PASS' : 'FAIL';

  const result: PlanningStackValidationResult = {
    validationId: createValidationId(),
    createdAt: Date.now(),
    requestText,
    handoffs,
    ownershipChecks,
    duplicateDetection,
    duplicateRiskPropagated,
    duplicateRiskCount,
    phase5Readiness: 'PHASE_5_NOT_READY',
    overallStatus,
    warnings,
    errors,
  };

  result.phase5Readiness = determinePhase5Readiness(handoffs, ownershipChecks, result);

  if (result.phase5Readiness === 'PHASE_5_READY') {
    warnings.push('All planning handoffs validated — Phase 5 readiness confirmed.');
  } else {
    warnings.push('Phase 5 not ready — resolve handoff or ownership issues before Phase 5 systems.');
  }

  return result;
}

export function summarizePlanningStackValidation(result: PlanningStackValidationResult): string {
  const successful = result.handoffs.filter(
    (h) => h.sourceProducedOutput && h.targetConsumedOutput && h.ownershipPreserved,
  ).length;
  return (
    `Validation ${result.validationId}: handoffs=${successful}/${result.handoffs.length} ` +
    `status=${result.overallStatus} phase5=${result.phase5Readiness} ` +
    `duplicate_risks=${result.duplicateRiskCount} systems=${PLANNING_SYSTEMS.length}`
  );
}
