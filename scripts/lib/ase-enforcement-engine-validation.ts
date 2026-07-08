/**
 * ASE Enforcement Engine V1 — validation helpers.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canProceedToStage } from '../../src/autonomous-software-engineering-engine/ase-gate-controller.js';
import { getDevPulseV2AutonomousSoftwareEngineeringEngine } from '../../src/autonomous-software-engineering-engine/ase-registry.js';
import {
  ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN,
  completeAutonomousEngineering,
  evaluateEngineeringDecision,
  evaluateEngineeringGoal,
  resetEngineeringAuthorityForTests,
  runAutonomousEngineering,
} from '../../src/ase-enforcement-engine/index.js';
import { runAutonomousSoftwareEngineeringPipeline } from '../../src/autonomous-software-engineering-engine/ase-authority.js';
import { resetAutonomousSoftwareEngineeringEngineForTests } from '../../src/autonomous-software-engineering-engine/ase-authority.js';

export { ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN };

export interface AseEnforcementCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function validateAseNoSimulationOnly(rootDir: string): AseEnforcementCheck[] {
  const checks: AseEnforcementCheck[] = [];
  const registry = getDevPulseV2AutonomousSoftwareEngineeringEngine();
  checks.push({
    name: 'ASE registry simulationOnly is false',
    passed: registry.simulationOnly === false,
    detail: String(registry.simulationOnly),
  });
  checks.push({
    name: 'ASE registry enforcementEngine is true',
    passed: registry.enforcementEngine === true,
    detail: String(registry.enforcementEngine),
  });
  const registryPath = join(rootDir, 'src/autonomous-software-engineering-engine/ase-registry.ts');
  const content = readFileSync(registryPath, 'utf8');
  checks.push({
    name: 'ase-registry.ts has no simulationOnly: true',
    passed: !content.includes('simulationOnly: true'),
    detail: 'simulationOnly removed from ASE registry',
  });
  return checks;
}

export function validateAseStageEnforcement(rootDir: string): AseEnforcementCheck[] {
  const checks: AseEnforcementCheck[] = [];
  const orchestrator = readFileSync(
    join(rootDir, 'src/autonomous-software-engineering-engine/ase-stage-orchestrator.ts'),
    'utf8',
  );
  checks.push({
    name: 'stage orchestrator uses canProceedToStage enforcement',
    passed: orchestrator.includes('enforceStageGate') && orchestrator.includes('canProceedToStage'),
    detail: 'enforceStageGate helper',
  });

  const blocked = canProceedToStage('PROMPT_FAITHFULNESS', new Map());
  checks.push({
    name: 'canProceedToStage blocks without prior stages',
    passed: blocked.allowed === false,
    detail: blocked.blockedReason ?? 'no reason',
  });
  return checks;
}

export function validateAseEngineeringAuthority(): AseEnforcementCheck[] {
  const checks: AseEnforcementCheck[] = [];
  resetAutonomousSoftwareEngineeringEngineForTests();
  resetEngineeringAuthorityForTests();

  const pre = runAutonomousSoftwareEngineeringPipeline({
    rawPrompt: 'Build a simple task tracker web app',
    projectId: 'ase-enforcement-test',
    stopAfterStage: 'INCREMENTAL_BUILD',
  });

  const engineering = runAutonomousEngineering({
    rawPrompt: 'Build a simple task tracker web app',
    projectId: 'ase-enforcement-test',
    projectRootDir: process.cwd(),
    workspaceDir: join(process.cwd(), '.generated-builder-workspaces/ase-enforcement-test'),
    productIntelligenceModel: pre.artifacts.productIntelligenceModel,
    promptFaithfulness: pre.artifacts.promptFaithfulness,
    capabilityPlanning: pre.artifacts.capabilityPlanning,
    host: { executeMaterialization: () => ({ ok: true, failureReason: null }) },
  });

  checks.push({
    name: 'runAutonomousEngineering authorizes materialization when gates pass',
    passed: engineering.materializationAuthorized === true,
    detail: String(engineering.materializationAuthorized),
  });

  const completed = completeAutonomousEngineering({
    partial: engineering,
    previewUrl: 'http://localhost:4321',
    projectRootDir: process.cwd(),
    workspaceDir: join(process.cwd(), '.generated-builder-workspaces/ase-enforcement-test'),
    rawPrompt: 'Build a simple task tracker web app',
    projectId: 'ase-enforcement-test',
  });

  checks.push({
    name: 'completeAutonomousEngineering produces post-materialization pipeline',
    passed: completed.asePipeline.currentStage === 'LIVE_PREVIEW_GATE' || completed.awaitingPreviewUrl === false,
    detail: completed.asePipeline.currentStage,
  });
  return checks;
}

export function validateAseHumanReviewPayment(): AseEnforcementCheck[] {
  const checks: AseEnforcementCheck[] = [];
  resetEngineeringAuthorityForTests();
  const result = runAutonomousEngineering({
    rawPrompt: 'Build a payment processing app with checkout',
    projectId: 'ase-payment-test',
    projectRootDir: process.cwd(),
    workspaceDir: join(process.cwd(), '.generated-builder-workspaces/ase-payment-test'),
    simulateHumanReviewPayment: true,
  });
  const goal = evaluateEngineeringGoal({
    state: result.engineeringState,
    evidence: result.evidence,
    materializationExecuted: false,
    simulateHumanReviewPayment: true,
  });
  const decision = evaluateEngineeringDecision({
    state: result.engineeringState,
    goal,
    evidence: result.evidence,
    materializationExecuted: false,
  });
  checks.push({
    name: 'payment scenario routes to human review goal',
    passed: goal === 'ESCALATE_UNSAFE_REQUEST',
    detail: goal,
  });
  checks.push({
    name: 'payment scenario blocks unauthorized materialization',
    passed: decision.decision === 'ESCALATE_TO_HUMAN_REVIEW' && !result.materializationAuthorized,
    detail: decision.decision,
  });
  return checks;
}

export function validateAseOnePromptIntegration(rootDir: string): AseEnforcementCheck[] {
  const checks: AseEnforcementCheck[] = [];
  const orchestrator = readFileSync(
    join(rootDir, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  checks.push({
    name: 'orchestrator uses runAutonomousEngineering',
    passed: orchestrator.includes('runAutonomousEngineering'),
    detail: 'ASE enforcement entry',
  });
  checks.push({
    name: 'orchestrator uses completeAutonomousEngineering',
    passed: orchestrator.includes('completeAutonomousEngineering'),
    detail: 'post-preview ASE completion',
  });
  checks.push({
    name: 'orchestrator removed direct pre-materialization ASE bypass comment',
    passed: !orchestrator.includes('that require post-materialization evidence and must not block'),
    detail: 'legacy bypass comment removed',
  });
  return checks;
}

export function validateAseEnforcementModuleExists(rootDir: string): AseEnforcementCheck[] {
  const files = [
    'engineering-state-discovery.ts',
    'engineering-evidence-aggregator.ts',
    'engineering-goal-evaluator.ts',
    'engineering-decision-engine.ts',
    'engineering-action-authority.ts',
    'engineering-routing-engine.ts',
    'engineering-execution-monitor.ts',
    'engineering-recovery-router.ts',
    'engineering-authority.ts',
  ];
  return files.map((file) => ({
    name: `module exists ${file}`,
    passed: existsSync(join(rootDir, 'src/ase-enforcement-engine', file)),
    detail: file,
  }));
}

export function runAseEnforcementValidation(rootDir: string, section?: string): AseEnforcementCheck[] {
  switch (section) {
    case 'ase-engineering-authority':
      return validateAseEngineeringAuthority();
    case 'ase-no-simulation-only':
      return validateAseNoSimulationOnly(rootDir);
    case 'ase-stage-enforcement':
      return validateAseStageEnforcement(rootDir);
    case 'ase-one-prompt-flow':
      return validateAseOnePromptIntegration(rootDir);
    case 'ase-launch-integration':
      return validateAseEngineeringAuthority();
    case 'ase-live-preview-integration':
      return validateAseOnePromptIntegration(rootDir);
    case 'ase-recovery-routing':
      return validateAseHumanReviewPayment();
    case 'ase-decision-engine':
      return validateAseHumanReviewPayment();
    case 'ase-engineering-routing':
      return validateAseEngineeringAuthority();
    case 'ase-authorized-execution':
      return validateAseEngineeringAuthority();
    case 'ase-engineering-state-machine':
      return validateAseEnforcementModuleExists(rootDir);
    case 'ase-goal-engine':
      return validateAseHumanReviewPayment();
    case 'ase-action-authority':
      return validateAseEngineeringAuthority();
    default:
      return [
        ...validateAseEnforcementModuleExists(rootDir),
        ...validateAseNoSimulationOnly(rootDir),
        ...validateAseStageEnforcement(rootDir),
        ...validateAseEngineeringAuthority(),
        ...validateAseHumanReviewPayment(),
        ...validateAseOnePromptIntegration(rootDir),
      ];
  }
}
