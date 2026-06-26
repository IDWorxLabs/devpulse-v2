/**
 * Interaction Proof Engine — main authority and orchestrator.
 */

import { resetInteractionAccessibilityVerifierForTests } from './interaction-accessibility-verifier.js';
import { proveInteractionDeviceCoverage } from './interaction-device-coverage.js';
import { executeInteractionEvent } from './interaction-event-executor.js';
import {
  classifyInteractionFailure,
  resetInteractionFailureClassifierForTests,
} from './interaction-failure-classifier.js';
import { verifyInteractionHandler } from './interaction-handler-verifier.js';
import { buildInteractionInventory } from './interaction-inventory-builder.js';
import { mapInteractionIntents } from './interaction-intent-mapper.js';
import {
  recordInteractionProofHistory,
  resetInteractionProofHistoryForTests,
} from './interaction-proof-history.js';
import { buildInteractionProofPipelineReport } from './interaction-proof-report-builder.js';
import type {
  InteractionEffectProof,
  InteractionProofPipelineInput,
  InteractionProofPipelineResult,
  InteractionProofResult,
  InteractionProofVerdict,
  InteractionSurface,
  LaunchInteractionProofEvidence,
  WholeAppInteractionSweepResult,
} from './interaction-proof-types.js';
import { INTERACTION_PROOF_ENGINE_PASS_TOKEN } from './interaction-proof-types.js';
import { proveInteractionReachability } from './interaction-reachability-prover.js';
import { recommendInteractionRepair, resetInteractionRepairRecommenderForTests } from './interaction-repair-recommender.js';
import { verifyInteractionStateEffect } from './interaction-state-effect-verifier.js';
import { verifyInteractionDataEffect } from './interaction-data-effect-verifier.js';
import {
  discoverInteractionSurfaces,
  resetInteractionSurfaceDiscoveryForTests,
} from './interaction-surface-discovery.js';
import { verifyInteractionUiEffect } from './interaction-ui-effect-verifier.js';
import { verifyInteractionAccessibility } from './interaction-accessibility-verifier.js';

let pipelineCounter = 0;
let lastPipelineResult: InteractionProofPipelineResult | null = null;

export function resetInteractionProofAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetInteractionSurfaceDiscoveryForTests();
  resetInteractionFailureClassifierForTests();
  resetInteractionRepairRecommenderForTests();
  resetInteractionProofHistoryForTests();
  resetInteractionAccessibilityVerifierForTests();
}

export function getLastInteractionProofPipelineResult(): InteractionProofPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `ix-proof-pipeline-${pipelineCounter}`;
}

function proveSingleInteraction(input: {
  surface: InteractionSurface;
  pipelineInput: InteractionProofPipelineInput;
  inventory: ReturnType<typeof buildInteractionInventory>[number];
  intent: ReturnType<typeof mapInteractionIntents>[number];
}): InteractionProofResult {
  const surface = input.surface;

  if (surface.classification === 'DECORATIVE_NON_INTERACTION') {
    const accessibilityProof = verifyInteractionAccessibility({
      surface,
      simulateMissingAccessibleName: input.pipelineInput.simulateMissingAccessibleName,
    });
    return {
      readOnly: true,
      interactionId: surface.interactionId,
      label: surface.label,
      classification: surface.classification,
      intentMapping: input.intent,
      reachabilityPassed: true,
      accessibilityProof,
      eventProof: {
        readOnly: true,
        interactionId: surface.interactionId,
        eventType: surface.eventType,
        executionAttempted: false,
        executionResult: true,
        observedBeforeState: 'decorative',
        observedAfterState: 'decorative',
        observedErrors: [],
        durationMs: 0,
      },
      handlerProof: {
        readOnly: true,
        interactionId: surface.interactionId,
        handlerExists: false,
        handlerBound: false,
        handlerExecuted: false,
        argumentsMatched: true,
        completedWithoutError: true,
      },
      effectProof: {
        readOnly: true,
        interactionId: surface.interactionId,
        stateMatched: true,
        dataMatched: true,
        uiMatched: true,
        detail: 'decorative non-interaction',
      },
      deviceCoverage: [],
      passed: true,
      failure: null,
      repairRecommendation: null,
      skipJustification: 'Explicitly classified as decorative non-interaction',
    };
  }

  const reachabilityPassed = proveInteractionReachability({
    surface,
    virtualDeviceLaboratory: input.pipelineInput.virtualDeviceLaboratory,
    simulateDeviceSpecificFailure: input.pipelineInput.simulateDeviceSpecificFailure,
  });
  const accessibilityProof = verifyInteractionAccessibility({
    surface,
    simulateMissingAccessibleName: input.pipelineInput.simulateMissingAccessibleName,
  });
  const eventProof = executeInteractionEvent({
    surface,
    simulateDeadButton: input.pipelineInput.simulateDeadButton,
  });
  const handlerProof = verifyInteractionHandler({
    surface,
    eventProof,
    simulateDeadButton: input.pipelineInput.simulateDeadButton,
  });
  const stateEffect = verifyInteractionStateEffect({ surface, handlerProof });
  const dataEffect = verifyInteractionDataEffect({ surface, handlerProof });
  const uiEffect = verifyInteractionUiEffect({ surface, handlerProof });
  const effectProof: InteractionEffectProof = {
    readOnly: true,
    interactionId: surface.interactionId,
    stateMatched: stateEffect.stateMatched,
    dataMatched: dataEffect.dataMatched,
    uiMatched: uiEffect.uiMatched,
    detail: [stateEffect.detail, dataEffect.detail, uiEffect.detail].join('; '),
  };
  const deviceCoverage = proveInteractionDeviceCoverage({
    surface,
    virtualDeviceLaboratory: input.pipelineInput.virtualDeviceLaboratory,
    simulateDeviceSpecificFailure: input.pipelineInput.simulateDeviceSpecificFailure,
  });

  const isRequired = surface.classification === 'REQUIRED_INTERACTION';
  const isUnknown = surface.classification === 'UNKNOWN_INTERACTION';
  const devicePassed = deviceCoverage.every((d) => d.passed);

  const passed =
    !isUnknown &&
    (!isRequired ||
      (input.intent.mapped &&
        reachabilityPassed &&
        accessibilityProof.passed &&
        eventProof.executionResult &&
        handlerProof.handlerExecuted &&
        effectProof.stateMatched &&
        effectProof.dataMatched &&
        effectProof.uiMatched &&
        devicePassed));

  const failure = classifyInteractionFailure({
    record: input.inventory,
    intent: input.intent,
    reachabilityPassed,
    accessibilityProof,
    eventProof,
    handlerProof,
    effectProof,
    deviceCoverage,
    passed,
  });
  const repairRecommendation = failure ? recommendInteractionRepair(failure) : null;

  return {
    readOnly: true,
    interactionId: surface.interactionId,
    label: surface.label,
    classification: surface.classification,
    intentMapping: input.intent,
    reachabilityPassed,
    accessibilityProof,
    eventProof,
    handlerProof,
    effectProof,
    deviceCoverage,
    passed,
    failure,
    repairRecommendation,
    skipJustification: null,
  };
}

function runWholeAppInteractionSweep(input: {
  inventory: InteractionProofPipelineResult['inventory'];
  intentMappings: InteractionProofPipelineResult['intentMappings'];
  proofResults: readonly InteractionProofResult[];
}): WholeAppInteractionSweepResult {
  const required = input.inventory.filter((i) => i.classification === 'REQUIRED_INTERACTION');
  const unknownCount = input.inventory.filter((i) => i.classification === 'UNKNOWN_INTERACTION').length;

  const checks: { check: string; passed: boolean; detail: string }[] = [
    {
      check: 'ALL_REQUIRED_INVENTORIED',
      passed: required.length > 0,
      detail: `${required.length} required interactions`,
    },
    {
      check: 'ALL_REQUIRED_INTENT_MAPPED',
      passed: required.every((r) => {
        const intent = input.intentMappings.find((m) => m.interactionId === r.interactionId);
        return intent?.mapped === true;
      }),
      detail: 'intent mapping',
    },
    {
      check: 'ALL_REQUIRED_REACHABLE',
      passed: input.proofResults
        .filter((r) => r.classification === 'REQUIRED_INTERACTION')
        .every((r) => r.reachabilityPassed || r.skipJustification),
      detail: 'reachability',
    },
    {
      check: 'ALL_REQUIRED_ACCESSIBLE',
      passed: input.proofResults
        .filter((r) => r.classification === 'REQUIRED_INTERACTION')
        .every((r) => r.accessibilityProof.passed || r.skipJustification),
      detail: 'accessibility identity',
    },
    {
      check: 'ALL_REQUIRED_EVENT_FIRED',
      passed: input.proofResults
        .filter((r) => r.classification === 'REQUIRED_INTERACTION')
        .every((r) => r.eventProof.executionResult || r.skipJustification),
      detail: 'event execution',
    },
    {
      check: 'ALL_REQUIRED_HANDLER_EXECUTED',
      passed: input.proofResults
        .filter((r) => r.classification === 'REQUIRED_INTERACTION')
        .every((r) => r.handlerProof.handlerExecuted || r.skipJustification),
      detail: 'handler binding',
    },
    {
      check: 'ALL_REQUIRED_EFFECTS_PROVEN',
      passed: input.proofResults
        .filter((r) => r.classification === 'REQUIRED_INTERACTION')
        .every(
          (r) =>
            r.effectProof.stateMatched &&
            r.effectProof.dataMatched &&
            r.effectProof.uiMatched,
        ),
      detail: 'state/data/ui effects',
    },
    {
      check: 'ALL_REQUIRED_DEVICE_COVERAGE',
      passed: input.proofResults
        .filter((r) => r.classification === 'REQUIRED_INTERACTION')
        .every((r) => r.deviceCoverage.every((d) => d.passed) || r.skipJustification),
      detail: 'device coverage',
    },
    {
      check: 'NO_UNCLASSIFIED_UNKNOWN',
      passed: unknownCount === 0 || input.proofResults.every((r) => r.classification !== 'UNKNOWN_INTERACTION' || !r.passed),
      detail: `${unknownCount} unknown`,
    },
    {
      check: 'NO_SILENT_SKIP',
      passed: !input.proofResults.some(
        (r) => r.classification === 'REQUIRED_INTERACTION' && !r.passed && !r.failure && !r.skipJustification,
      ),
      detail: 'silent skip forbidden',
    },
  ];

  const passed = checks.every((c) => c.passed);
  return {
    readOnly: true,
    sweepId: `ix-sweep-${pipelineCounter}`,
    passed,
    checks,
    blockedReason: passed ? null : checks.find((c) => !c.passed)?.detail ?? 'Whole-app interaction sweep failed',
    unknownInteractionCount: unknownCount,
  };
}

function resolvePermissionVerdict(input: {
  proofResults: readonly InteractionProofResult[];
  wholeAppSweep: WholeAppInteractionSweepResult;
}): { verdict: InteractionProofVerdict; blockedReason: string | null } {
  const failedRequired = input.proofResults.filter(
    (r) => r.classification === 'REQUIRED_INTERACTION' && !r.passed && !r.skipJustification,
  );
  const unknownFailed = input.proofResults.filter(
    (r) => r.classification === 'UNKNOWN_INTERACTION' && !r.passed,
  );

  if (failedRequired.length || unknownFailed.length) {
    return {
      verdict: 'BLOCKED',
      blockedReason:
        failedRequired[0]?.failure?.likelyCause ??
        unknownFailed[0]?.failure?.likelyCause ??
        'Required interaction proof failed',
    };
  }
  if (!input.wholeAppSweep.passed) {
    return {
      verdict: 'NEEDS_REPAIR',
      blockedReason: input.wholeAppSweep.blockedReason ?? 'Interaction sweep incomplete',
    };
  }
  return { verdict: 'READY_FOR_PREVIEW', blockedReason: null };
}

export function runInteractionProofPipeline(
  input: InteractionProofPipelineInput,
): InteractionProofPipelineResult {
  if (
    input.incrementalBuild.permissionVerdict !== 'READY_FOR_ASSEMBLY' &&
    input.incrementalBuild.permissionVerdict !== 'RESUMABLE'
  ) {
    return blockedPipeline(input, input.incrementalBuild.blockedReason ?? 'Incremental build not ready.');
  }

  if (input.virtualDeviceLaboratory.permissionVerdict === 'BLOCKED') {
    return blockedPipeline(
      input,
      input.virtualDeviceLaboratory.blockedReason ?? 'Virtual device laboratory required before interaction proof.',
    );
  }

  const surfaces = discoverInteractionSurfaces({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    incrementalBuild: input.incrementalBuild,
    behaviorSimulation: input.behaviorSimulation,
    virtualUserSimulation: input.virtualUserSimulation,
    simulateUnknownInteraction: input.simulateUnknownInteraction,
    sliceIdFilter: input.sliceIdFilter,
    sliceNameFilter: input.sliceNameFilter,
  });

  if (!surfaces.length && !input.sliceIdFilter) {
    return blockedPipeline(input, 'No interaction surfaces discovered — silent skipping forbidden.');
  }

  const rawInventory = buildInteractionInventory({
    surfaces,
    behaviorSimulation: input.behaviorSimulation,
    virtualUserSimulation: input.virtualUserSimulation,
    virtualDeviceLaboratory: input.virtualDeviceLaboratory,
  });
  const intentMappings = mapInteractionIntents(surfaces);

  const proofResults = rawInventory.map((record, index) =>
    proveSingleInteraction({
      surface: surfaces[index]!,
      pipelineInput: input,
      inventory: record,
      intent: intentMappings[index]!,
    }),
  );

  const inventory = rawInventory.map((record, index) => {
    const result = proofResults[index]!;
    return {
      ...record,
      proofStatus: result.passed
        ? result.skipJustification
          ? ('SKIPPED_WITH_JUSTIFICATION' as const)
          : ('PASSED' as const)
        : ('FAILED' as const),
    };
  });

  const wholeAppSweep = input.sliceIdFilter
    ? {
        readOnly: true as const,
        sweepId: 'ix-sweep-slice',
        passed: proofResults.every((r) => r.passed || Boolean(r.skipJustification)),
        checks: [],
        blockedReason: null,
        unknownInteractionCount: surfaces.filter((s) => s.classification === 'UNKNOWN_INTERACTION').length,
      }
    : runWholeAppInteractionSweep({ inventory, intentMappings, proofResults });

  const { verdict, blockedReason } = resolvePermissionVerdict({ proofResults, wholeAppSweep });

  const result: InteractionProofPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    surfaces,
    inventory,
    intentMappings,
    proofResults,
    wholeAppSweep,
    permissionVerdict: verdict,
    blockedReason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildInteractionProofPipelineReport(result);
  recordInteractionProofHistory(result);
  lastPipelineResult = result;
  return result;
}

function blockedPipeline(
  input: InteractionProofPipelineInput,
  reason: string,
): InteractionProofPipelineResult {
  const result: InteractionProofPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    surfaces: [],
    inventory: [],
    intentMappings: [],
    proofResults: [],
    wholeAppSweep: {
      readOnly: true,
      sweepId: 'ix-sweep-blocked',
      passed: false,
      checks: [],
      blockedReason: reason,
      unknownInteractionCount: 0,
    },
    permissionVerdict: 'BLOCKED',
    blockedReason: reason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildInteractionProofPipelineReport(result);
  lastPipelineResult = result;
  return result;
}

export function simulateInteractionProofImpactForFeatureSlice(input: {
  sliceId: string;
  sliceName: string;
  pipelineInput: Omit<
    InteractionProofPipelineInput,
    | 'sliceIdFilter'
    | 'sliceNameFilter'
    | 'simulateDeadButton'
    | 'simulateMissingAccessibleName'
    | 'simulateDeviceSpecificFailure'
    | 'simulateUnknownInteraction'
  >;
}): {
  passed: boolean;
  results: InteractionProofResult[];
  blockedReason: string | null;
  skipJustification: string | null;
} {
  const interactionAffecting =
    /interaction|button|form|input|handler|auth|speech|emergency|expense|export|settings|navigation|router|blink|accessibility/i.test(
      input.sliceName,
    );
  if (!interactionAffecting) {
    return {
      passed: true,
      results: [],
      blockedReason: null,
      skipJustification: `Slice ${input.sliceName} does not affect interactions — explicit skip with traceability`,
    };
  }

  if (input.pipelineInput.incrementalBuild.permissionVerdict === 'IN_PROGRESS') {
    return {
      passed: true,
      results: [],
      blockedReason: null,
      skipJustification: `Interaction proof deferred to whole-app sweep during slice ${input.sliceName} stabilization`,
    };
  }

  const result = runInteractionProofPipeline({
    ...input.pipelineInput,
    sliceIdFilter: input.sliceId,
    sliceNameFilter: input.sliceName,
  });
  const failed = result.proofResults.filter((r) => !r.passed && !r.skipJustification);
  return {
    passed: failed.length === 0 && result.permissionVerdict !== 'BLOCKED',
    results: result.proofResults,
    blockedReason: result.blockedReason,
    skipJustification: null,
  };
}

export function isInteractionProofReadyForPreview(result: InteractionProofPipelineResult): boolean {
  return result.permissionVerdict === 'READY_FOR_PREVIEW' && result.wholeAppSweep.passed;
}

export function buildLaunchInteractionProofEvidence(
  result: InteractionProofPipelineResult,
): LaunchInteractionProofEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  const failed = result.proofResults.filter((r) => !r.passed && !r.skipJustification).length;
  if (failed) blockers.push(`${failed} interaction(s) failed proof`);

  const requiredCount = result.inventory.filter((i) => i.classification === 'REQUIRED_INTERACTION').length;
  const optionalCount = result.inventory.filter((i) => i.classification === 'OPTIONAL_INTERACTION').length;
  const unknownCount = result.inventory.filter((i) => i.classification === 'UNKNOWN_INTERACTION').length;

  return {
    readOnly: true,
    totalInteractions: result.inventory.length,
    requiredCount,
    optionalCount,
    unknownCount,
    passedCount: result.proofResults.filter((r) => r.passed).length,
    failedCount: failed,
    skippedWithJustificationCount: result.proofResults.filter((r) => r.skipJustification).length,
    wholeAppSweepPassed: result.wholeAppSweep.passed,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function getInteractionProofPassToken(): string {
  return INTERACTION_PROOF_ENGINE_PASS_TOKEN;
}
