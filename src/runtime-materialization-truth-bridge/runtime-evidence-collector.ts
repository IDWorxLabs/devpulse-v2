/**
 * Runtime Materialization Truth Bridge — evidence collector (Phase 26.76).
 * Read-only. Consumes runtime and preview authorities without mutation.
 */

import { analyzePreviewStage } from '../autonomous-build-execution-proof/preview-stage-analyzer.js';
import { analyzeRuntimeStage } from '../autonomous-build-execution-proof/runtime-stage-analyzer.js';
import { assessBuildMaterializationTruthBridge } from '../build-materialization-truth-bridge/index.js';
import type { BuildMaterializationTruthBridgeAssessment } from '../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessConnectedPreviewExperienceProof } from '../connected-preview-experience-proof/index.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import { assessConnectedRuntimeActivationProof } from '../connected-runtime-activation-proof/index.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import { assessRuntimeRouteReachabilityProof } from '../runtime-route-reachability-proof/index.js';
import type { RuntimeRouteReachabilityProofAssessment } from '../runtime-route-reachability-proof/runtime-route-reachability-proof-types.js';
import { assessFounderFlowRuntimeProof } from '../founder-flow-runtime-proof/index.js';
import type { FounderFlowRuntimeProofAssessment } from '../founder-flow-runtime-proof/founder-flow-runtime-proof-types.js';
import { assessRuntimeUiRenderProof } from '../runtime-ui-render-proof/index.js';
import type { RuntimeUiRenderProofAssessment } from '../runtime-ui-render-proof/runtime-ui-render-proof-types.js';
import { assessRuntimeStartupProofRepair } from '../runtime-startup-proof-repair/index.js';
import type { RuntimeStartupProofRepairAssessment } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';
import { assessGeneratedWorkspaceDependencyMaterialization } from '../generated-workspace-dependency-materialization/index.js';
import type { GeneratedWorkspaceDependencyMaterializationAssessment } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import type { GeneratedWorkspaceDependencyInstallationExecutorAssessment } from '../generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-types.js';
import { resolveConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import { resolveExecutionChainStageContext } from '../founder-test-integration/connected-execution-chain-stage-resolver.js';
import { analyzeRuntimeProofBoundaries } from './runtime-proof-analyzer.js';
import type {
  RuntimeEvidencePriority,
  RuntimeFounderFlowEvidence,
  RuntimeMaterializationTruthEvidence,
  RuntimeRouteEvidence,
  RuntimeStartupEvidence,
  RuntimeUiEvidence,
} from './runtime-materialization-truth-bridge-types.js';

export interface CollectRuntimeMaterializationTruthEvidenceInput {
  rootDir: string;
  runtimeActivationProof?: RuntimeActivationProofReport | null;
  previewExperienceProof?: PreviewExperienceProofReport | null;
  buildMaterializationTruthBridge?: BuildMaterializationTruthBridgeAssessment | null;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  skipRuntimeAssessment?: boolean;
  skipPreviewAssessment?: boolean;
  startupProofRepair?: RuntimeStartupProofRepairAssessment | null;
  skipStartupProofRepair?: boolean;
  dependencyMaterialization?: GeneratedWorkspaceDependencyMaterializationAssessment | null;
  skipDependencyMaterialization?: boolean;
  dependencyInstallationExecutor?: import('../generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-types.js').GeneratedWorkspaceDependencyInstallationExecutorAssessment | null;
  crashDiagnosis?: import('../generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.js').GeneratedRuntimeCrashDiagnosisAssessment | null;
  routeReachabilityProof?: RuntimeRouteReachabilityProofAssessment | null;
  skipRouteReachabilityProof?: boolean;
  uiRenderProof?: RuntimeUiRenderProofAssessment | null;
  skipUiRenderProof?: boolean;
  founderFlowRuntimeProof?: FounderFlowRuntimeProofAssessment | null;
  skipFounderFlowRuntimeProof?: boolean;
  dependencyInstallExecutionMode?: import('../generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-types.js').DependencyInstallExecutionMode | 'SKIP';
  workspacePath?: string | null;
  workspaceId?: string | null;
}

const EVIDENCE_PRIORITY: readonly RuntimeEvidencePriority[] = [
  'LIVE_RUNTIME_EVIDENCE',
  'STARTUP_EVIDENCE',
  'ROUTE_EVIDENCE',
  'UI_EVIDENCE',
  'FOUNDER_FLOW_EVIDENCE',
  'CACHED_PROOF_SNAPSHOT',
];

function crashEvidenceFields(
  startupRepair: RuntimeStartupProofRepairAssessment | null,
  crashDiagnosis: import('../generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.js').GeneratedRuntimeCrashDiagnosisAssessment | null,
): Pick<
  RuntimeStartupEvidence,
  'preciseCrashClass' | 'crashFailingFile' | 'crashRawErrorExcerpt'
> {
  const diag = crashDiagnosis?.report ?? startupRepair?.report.crashDiagnosis ?? null;
  return {
    preciseCrashClass: diag?.classification.crashClass ?? startupRepair?.report.preciseCrashClass ?? null,
    crashFailingFile: diag?.classification.failingFile ?? null,
    crashRawErrorExcerpt: diag?.extraction.rawErrorExcerpt ?? null,
  };
}

function buildStartupEvidence(
  report: RuntimeActivationProofReport | null,
  startupRepair: RuntimeStartupProofRepairAssessment | null,
  dependencyMaterialization: GeneratedWorkspaceDependencyMaterializationAssessment | null,
  dependencyInstallationExecutor: GeneratedWorkspaceDependencyInstallationExecutorAssessment | null,
  crashDiagnosis: import('../generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.js').GeneratedRuntimeCrashDiagnosisAssessment | null,
): RuntimeStartupEvidence {
  const repairProbe = startupRepair?.report.probe;
  const crashFields = crashEvidenceFields(startupRepair, crashDiagnosis);
  const depReport =
    dependencyMaterialization?.report ??
    startupRepair?.report.dependencyMaterialization ??
    dependencyInstallationExecutor?.report.postInstallVerification.afterMaterialization ??
    null;
  const installReport =
    dependencyInstallationExecutor?.report ?? startupRepair?.report.dependencyInstallationExecutor ?? null;
  const base = ((): RuntimeStartupEvidence => {
    if (!report) {
      return {
        readOnly: true,
        serverStartSucceeded: false,
        serverStartFailed: true,
        processStarted: false,
        portBound: false,
        portReachable: false,
        healthResponded: false,
        fatalStartupError: false,
        bootComplete: false,
        runtimeProofLevel: 'NOT_PROVEN',
        firstBrokenRuntimeLink: null,
        startupFailureClass: startupRepair?.report.failureClass ?? null,
        attemptedCommand: repairProbe?.attemptedCommand ?? null,
        applicationBootsFromProbe: repairProbe?.applicationBoots ?? false,
        dependencyState: depReport?.dependencyState ?? null,
        dependenciesReady: depReport?.dependenciesReady ?? false,
        dependencyInstallCommand: depReport?.repairPlan.installCommand ?? null,
        dependencyMissingModules: depReport?.repairPlan.missingModulesSummary ?? null,
        dependencyInstallExecuted: installReport?.processResult.executed ?? false,
        dependencyInstallSucceeded: installReport?.processResult.installSucceeded ?? null,
        ...crashFields,
      };
    }
    const activation = report.activationEvidence;
    const processStarted = report.process.processState === 'STARTED';
    const portReachable = report.port.reachable;
    const healthResponded =
      report.health.healthState === 'HEALTHY' || report.health.healthState === 'PARTIAL';
    const serverStartSucceeded =
      processStarted && (portReachable || healthResponded) && !report.logs.fatalErrorFound;
    return {
      readOnly: true,
      serverStartSucceeded,
      serverStartFailed:
        report.logs.fatalErrorFound ||
        (report.command.runtimeCommandFound && !processStarted && report.process.exitStatus !== null),
      processStarted,
      portBound: report.port.portState === 'OBSERVED' || report.port.portState === 'REACHABLE',
      portReachable,
      healthResponded,
      fatalStartupError: report.logs.fatalErrorFound,
      bootComplete: report.logs.bootComplete || report.logs.readySignalFound,
      runtimeProofLevel: report.runtimeProofLevel,
      firstBrokenRuntimeLink:
        report.linkage.firstBrokenRuntimeLink ?? activation?.firstBrokenRuntimeLink ?? null,
      startupFailureClass: null,
      attemptedCommand: report.command.command,
      applicationBootsFromProbe: false,
      dependencyState: depReport?.dependencyState ?? null,
      dependenciesReady: depReport?.dependenciesReady ?? false,
      dependencyInstallCommand: depReport?.repairPlan.installCommand ?? null,
      dependencyMissingModules: depReport?.repairPlan.missingModulesSummary ?? null,
      dependencyInstallExecuted: installReport?.processResult.executed ?? false,
      dependencyInstallSucceeded: installReport?.processResult.installSucceeded ?? null,
      ...crashFields,
    };
  })();

  if (repairProbe) {
    return {
      ...base,
      serverStartSucceeded: repairProbe.applicationBoots || base.serverStartSucceeded,
      processStarted: repairProbe.processStarted || base.processStarted,
      portBound: repairProbe.portBound || base.portBound,
      portReachable: repairProbe.portBound || base.portReachable,
      healthResponded: repairProbe.healthResponded || base.healthResponded,
      fatalStartupError: repairProbe.fatalErrors.length > 0 || base.fatalStartupError,
      bootComplete: repairProbe.applicationBoots || base.bootComplete,
      startupFailureClass: startupRepair?.report.failureClass ?? null,
      attemptedCommand: repairProbe.attemptedCommand ?? base.attemptedCommand,
      applicationBootsFromProbe: repairProbe.applicationBoots,
      dependencyState: depReport?.dependencyState ?? null,
      dependenciesReady: depReport?.dependenciesReady ?? false,
      dependencyInstallCommand: depReport?.repairPlan.installCommand ?? null,
      dependencyMissingModules: depReport?.repairPlan.missingModulesSummary ?? null,
      dependencyInstallExecuted: installReport?.processResult.executed ?? false,
      dependencyInstallSucceeded: installReport?.processResult.installSucceeded ?? null,
      ...crashFields,
    };
  }
  if (depReport) {
    return {
      ...base,
      dependencyState: depReport.dependencyState,
      dependenciesReady: depReport.dependenciesReady,
      dependencyInstallCommand: depReport.repairPlan.installCommand,
      dependencyMissingModules: depReport.repairPlan.missingModulesSummary,
      dependencyInstallExecuted: installReport?.processResult.executed ?? false,
      dependencyInstallSucceeded: installReport?.processResult.installSucceeded ?? null,
      ...crashFields,
    };
  }
  return { ...base, ...crashFields };
}

function buildRouteEvidence(
  runtime: RuntimeActivationProofReport | null,
  preview: PreviewExperienceProofReport | null,
  routeReachabilityProof: RuntimeRouteReachabilityProofAssessment | null,
): RuntimeRouteEvidence {
  const routeProofAuthoritative =
    routeReachabilityProof?.report.applicationBootsBeforeProbe === true &&
    routeReachabilityProof.report.probeSession.probeSkipped !== true;

  if (routeProofAuthoritative && routeReachabilityProof) {
    const report = routeReachabilityProof.report;
    const probes = report.probeSession.probeResults;
    const successCount = probes.filter((p) => p.verdict === 'SUCCESS').length;
    const failureCount = probes.length - successCount;
    return {
      readOnly: true,
      knownRoutesChecked: report.discoveredRoutes.length,
      routesReachable: report.routesReachable ? Math.max(1, successCount) : 0,
      routeFailures: failureCount,
      has404Failures: report.failureClass === 'ROUTE_NOT_FOUND',
      has500Failures: report.failureClass === 'ROUTE_SERVER_ERROR',
      primaryUrlReachable: report.rootRouteReachable || report.routesReachable,
      previewUrl: report.probeSession.baseUrl ?? preview?.url.previewUrl ?? runtime?.port.url ?? null,
      routesReachableProof: report.routesReachable,
      routeProofAuthoritative: true,
      routeFailureClass: report.failureClass,
      rootRouteReachable: report.rootRouteReachable,
      uiRenderProvenFromRoutes: report.uiRenderProven,
      baseUrl: report.probeSession.baseUrl,
    };
  }

  const urlReachable = preview?.url.urlReachable ?? runtime?.port.reachable ?? false;
  const previewUrl = preview?.url.previewUrl ?? runtime?.port.url ?? null;
  const routeFailures =
    preview && preview.url.urlObserved && !preview.url.urlReachable ? 1 : 0;
  return {
    readOnly: true,
    knownRoutesChecked: preview?.url.urlObserved ? 1 : runtime?.port.reachable ? 1 : 0,
    routesReachable: urlReachable ? 1 : 0,
    routeFailures,
    has404Failures: preview?.url.urlState === 'OBSERVED' && !preview.url.urlReachable,
    has500Failures: false,
    primaryUrlReachable: urlReachable,
    previewUrl,
    routesReachableProof: false,
    routeProofAuthoritative: false,
    routeFailureClass: routeReachabilityProof?.report.failureClass ?? null,
    rootRouteReachable: false,
    uiRenderProvenFromRoutes: false,
    baseUrl: routeReachabilityProof?.report.probeSession.baseUrl ?? null,
  };
}

function buildUiEvidence(
  preview: PreviewExperienceProofReport | null,
  uiRenderProof: RuntimeUiRenderProofAssessment | null,
): RuntimeUiEvidence {
  const uiProofAuthoritative =
    uiRenderProof?.report.applicationBootsBeforeProbe === true &&
    uiRenderProof.report.routesReachableBeforeProbe === true &&
    uiRenderProof.report.probeSession.probeSkipped !== true;

  if (uiProofAuthoritative && uiRenderProof) {
    const report = uiRenderProof.report;
    const probes = report.probeSession.probeResults;
    const htmlWithMount = probes.some((p) => p.hasRootMount);
    const htmlWithBundle = probes.some((p) => p.hasScriptBundle);
    return {
      readOnly: true,
      pageLoaded: report.routesReachableBeforeProbe,
      renderSucceeded: report.uiRenders,
      blankPageDetected: report.failureClass === 'BLANK_HTML',
      fatalRenderError: report.failureClass === 'UI_ROUTE_NOT_FOUND',
      hydrationFailure: false,
      applicationRendered: report.uiRenders,
      interactiveElementsFound: probes.filter((p) => p.hasVisibleText).length,
      uiRendersProof: report.uiRenders,
      uiProofAuthoritative: true,
      uiFailureClass: report.failureClass,
      jsonOnlyRuntime: report.failureClass === 'JSON_ONLY_RUNTIME' || report.rootRouteJsonOnly,
      htmlWithRootMount: htmlWithMount,
      htmlWithScriptBundle: htmlWithBundle,
    };
  }

  if (!preview) {
    return {
      readOnly: true,
      pageLoaded: false,
      renderSucceeded: false,
      blankPageDetected: false,
      fatalRenderError: false,
      hydrationFailure: false,
      applicationRendered: false,
      interactiveElementsFound: 0,
      uiRendersProof: uiRenderProof?.report.uiRenders ?? false,
      uiProofAuthoritative: false,
      uiFailureClass: uiRenderProof?.report.failureClass ?? null,
      jsonOnlyRuntime: uiRenderProof?.report.rootRouteJsonOnly ?? false,
      htmlWithRootMount: false,
      htmlWithScriptBundle: false,
    };
  }
  const rendered = preview.render.applicationRendered;
  const blankPage =
    preview.render.renderObserved && !preview.render.applicationRendered && preview.url.urlReachable;
  return {
    readOnly: true,
    pageLoaded: preview.url.urlReachable,
    renderSucceeded: rendered,
    blankPageDetected: blankPage,
    fatalRenderError: preview.render.renderState === 'NOT_RENDERED' && preview.url.urlReachable,
    hydrationFailure: blankPage,
    applicationRendered: rendered,
    interactiveElementsFound: preview.interaction.interactiveElements.length,
    uiRendersProof: false,
    uiProofAuthoritative: false,
    uiFailureClass: uiRenderProof?.report.failureClass ?? null,
    jsonOnlyRuntime: uiRenderProof?.report.rootRouteJsonOnly ?? false,
    htmlWithRootMount: false,
    htmlWithScriptBundle: false,
  };
}

function buildFounderFlowEvidence(input: {
  buildBridge: BuildMaterializationTruthBridgeAssessment | null;
  runtime: RuntimeActivationProofReport | null;
  preview: PreviewExperienceProofReport | null;
  chainRuntimeProven: boolean;
  chainPreviewProven: boolean;
  founderFlowRuntimeProof: FounderFlowRuntimeProofAssessment | null;
  ui: RuntimeUiEvidence;
}): RuntimeFounderFlowEvidence {
  const buildProven =
    input.buildBridge?.report.finalBuildTruth === 'BUILD_PROVEN' ||
    input.runtime?.buildMaterializationProven === true;
  const runtimeReachable =
    input.runtime?.founderQuestions.canRuntimeBeReached === true ||
    input.runtime?.port.reachable === true;
  const appRuns = input.runtime?.founderQuestions.canApplicationRun === true || input.chainRuntimeProven;

  const proof = input.founderFlowRuntimeProof?.report ?? null;
  const hasFounderFlowProof = proof != null && proof.uiRendersBeforeProbe;
  const proofAuthoritative = hasFounderFlowProof && proof!.flowProbe.probeSkipped !== true;

  return {
    readOnly: true,
    founderTestLaunchObserved: input.chainPreviewProven || input.chainRuntimeProven,
    projectCreationObserved: buildProven,
    buildInitiationObserved: buildProven,
    buildCompletionObserved: buildProven,
    reportGenerationObserved: hasFounderFlowProof
      ? proof!.resultStoreCheck.reportGenerated
      : buildProven && (runtimeReachable || appRuns),
    resultRetrievalObserved: hasFounderFlowProof
      ? proof!.resultStoreCheck.finalResultDelivered
      : input.preview?.render.applicationRendered === true,
    finalReportDelivered: hasFounderFlowProof
      ? proof!.resultStoreCheck.finalResultDelivered
      : false,
    buildMaterializationProven: buildProven,
    founderFlowProven: hasFounderFlowProof ? proof!.founderFlowProven : false,
    founderFlowProofAuthoritative: proofAuthoritative,
    founderFlowFailureClass: proof?.failureClass ?? null,
    finalResultDelivered: hasFounderFlowProof ? proof!.resultStoreCheck.finalResultDelivered : false,
    reportGeneratedNotDelivered: hasFounderFlowProof
      ? proof!.resultStoreCheck.reportGenerated && !proof!.resultStoreCheck.finalResultDelivered
      : false,
    interactiveElementsDetected: proof?.flowProbe.interactiveScan.interactiveElementCount ?? 0,
  };
}

export function collectRuntimeMaterializationTruthEvidence(
  input: CollectRuntimeMaterializationTruthEvidenceInput,
): RuntimeMaterializationTruthEvidence {
  const rootDir = input.rootDir;

  const buildMaterializationReport =
    input.buildMaterializationReport ??
    assessConnectedBuildExecution({
      rootDir,
      attemptBuildProofGapMaterialization: false,
    }).report;

  const buildMaterializationTruthBridge =
    input.buildMaterializationTruthBridge ??
    assessBuildMaterializationTruthBridge({
      rootDir,
      connectedBuild: buildMaterializationReport,
      skipHistoryRecording: true,
    });

  const runtimeActivationProof =
    input.runtimeActivationProof ??
    (input.skipRuntimeAssessment
      ? null
      : assessConnectedRuntimeActivationProof({
          rootDir,
          buildMaterializationReport,
          skipRuntimeProofGapActivation: true,
        }).report);

  const previewExperienceProof =
    input.previewExperienceProof ??
    (input.skipPreviewAssessment || !runtimeActivationProof
      ? null
      : assessConnectedPreviewExperienceProof({
          rootDir,
          runtimeActivationProof,
          skipPreviewProofGapActivation: true,
        }).report);

  const startupProofRepair =
    input.startupProofRepair ??
    (input.skipStartupProofRepair
      ? null
      : assessRuntimeStartupProofRepair({
          rootDir,
          buildMaterializationReport,
          workspacePath: input.workspacePath,
          workspaceId: input.workspaceId,
          dependencyInstallExecutionMode: input.dependencyInstallExecutionMode ?? 'SKIP',
          skipHistoryRecording: true,
        }));

  const dependencyMaterialization =
    input.dependencyMaterialization ??
    (input.skipDependencyMaterialization
      ? null
      : startupProofRepair?.report.dependencyMaterialization
        ? {
            readOnly: true as const,
            advisoryOnly: true as const,
            orchestrationState: 'DEPENDENCY_MATERIALIZATION_COMPLETE' as const,
            report: startupProofRepair.report.dependencyMaterialization,
            cacheKey: startupProofRepair.report.dependencyMaterialization.cacheKey,
          }
        : assessGeneratedWorkspaceDependencyMaterialization({
            rootDir,
            buildMaterializationReport,
            startupProbeLogs: startupProofRepair?.report.probe.startupLogs,
            startupFatalErrors: startupProofRepair?.report.probe.fatalErrors,
            skipHistoryRecording: true,
          }));

  const dependencyInstallationExecutor =
    input.dependencyInstallationExecutor ??
    (startupProofRepair?.report.dependencyInstallationExecutor
      ? {
          readOnly: true as const,
          advisoryOnly: true as const,
          orchestrationState: 'DEPENDENCY_INSTALLATION_EXECUTOR_COMPLETE' as const,
          report: startupProofRepair.report.dependencyInstallationExecutor,
          cacheKey: startupProofRepair.report.dependencyInstallationExecutor.cacheKey,
        }
      : null);

  const crashDiagnosis =
    input.crashDiagnosis ??
    (startupProofRepair?.report.crashDiagnosis
      ? {
          readOnly: true as const,
          advisoryOnly: true as const,
          orchestrationState: 'RUNTIME_CRASH_DIAGNOSIS_COMPLETE' as const,
          report: startupProofRepair.report.crashDiagnosis,
          cacheKey: startupProofRepair.report.crashDiagnosis.cacheKey,
        }
      : null);

  const chainContext = resolveExecutionChainStageContext(rootDir);
  const chainTruth = resolveConnectedExecutionChainTruth(chainContext);

  const routeReachabilityProof =
    input.routeReachabilityProof ??
    (input.skipRouteReachabilityProof
      ? null
      : assessRuntimeRouteReachabilityProof({
          rootDir,
          buildMaterializationReport,
          workspacePath: input.workspacePath,
          workspaceId: input.workspaceId,
          startupProbe: startupProofRepair?.report.probe ?? null,
          entrypoint: startupProofRepair?.report.entrypoint ?? null,
          resolvedCommand: startupProofRepair?.report.resolvedCommand ?? null,
          skipHistoryRecording: true,
        }));

  const uiRenderProof =
    input.uiRenderProof ??
    (input.skipUiRenderProof
      ? null
      : assessRuntimeUiRenderProof({
          rootDir,
          buildMaterializationReport,
          workspacePath: input.workspacePath,
          workspaceId: input.workspaceId,
          startupProbe: startupProofRepair?.report.probe ?? null,
          routeReachabilityProof: routeReachabilityProof?.report ?? null,
          entrypoint: startupProofRepair?.report.entrypoint ?? null,
          resolvedCommand: startupProofRepair?.report.resolvedCommand ?? null,
          skipHistoryRecording: true,
        }));

  const depReady =
    startupProofRepair?.report.dependencyMaterialization?.dependenciesReady ??
    dependencyMaterialization?.report.dependenciesReady ??
    false;

  const founderFlowRuntimeProof =
    input.founderFlowRuntimeProof ??
    (input.skipFounderFlowRuntimeProof
      ? null
      : assessFounderFlowRuntimeProof({
          rootDir,
          buildMaterializationReport,
          workspacePath: input.workspacePath,
          workspaceId: input.workspaceId,
          startupProbe: startupProofRepair?.report.probe ?? null,
          routeReachabilityProof: routeReachabilityProof?.report ?? null,
          uiRenderProof: uiRenderProof?.report ?? null,
          entrypoint: startupProofRepair?.report.entrypoint ?? null,
          resolvedCommand: startupProofRepair?.report.resolvedCommand ?? null,
          filesExistOnDisk:
            buildMaterializationTruthBridge.report.evidence.snapshot.existingArtifacts > 0,
          dependenciesReady: depReady,
          skipHistoryRecording: true,
        }));

  const startup = buildStartupEvidence(
    runtimeActivationProof,
    startupProofRepair,
    dependencyMaterialization,
    dependencyInstallationExecutor,
    crashDiagnosis,
  );
  const routes = buildRouteEvidence(
    runtimeActivationProof,
    previewExperienceProof,
    routeReachabilityProof,
  );
  const ui = buildUiEvidence(previewExperienceProof, uiRenderProof);
  const founderFlow = buildFounderFlowEvidence({
    buildBridge: buildMaterializationTruthBridge,
    runtime: runtimeActivationProof,
    preview: previewExperienceProof,
    chainRuntimeProven: chainTruth.runtimeProven,
    chainPreviewProven: chainTruth.previewProven,
    founderFlowRuntimeProof,
    ui,
  });

  const proofAnalysis = analyzeRuntimeProofBoundaries({
    startup,
    routes,
    ui,
    founderFlow,
    filesExistOnDisk: buildMaterializationTruthBridge.report.evidence.snapshot.existingArtifacts > 0,
    applicationBootsFromProbe: startupProofRepair?.report.probe.applicationBoots ?? startup.applicationBootsFromProbe,
    startupProofAuthoritative: Boolean(startupProofRepair),
  });

  const runtimeStage = analyzeRuntimeStage(runtimeActivationProof);
  const previewStage = analyzePreviewStage(previewExperienceProof);

  return {
    readOnly: true,
    rootDir,
    runtimeActivationProof,
    previewExperienceProof,
    buildMaterializationTruthBridge,
    startupProofRepair,
    dependencyMaterialization,
    dependencyInstallationExecutor,
    crashDiagnosis,
    routeReachabilityProof,
    uiRenderProof,
    founderFlowRuntimeProof,
    startup,
    routes,
    ui,
    founderFlow,
    proofAnalysis,
    snapshot: {
      readOnly: true,
      filesExistOnDisk: buildMaterializationTruthBridge.report.evidence.snapshot.existingArtifacts > 0,
      runtimeProofLevel: startup.runtimeProofLevel,
      previewProofLevel: previewExperienceProof?.previewProofLevel ?? null,
      founderRuntimeProofLevel: runtimeStage.proofLevel,
      founderPreviewProofLevel: previewStage.proofLevel,
      executionChainRuntimeProven: chainTruth.runtimeProven,
      executionChainPreviewProven: chainTruth.previewProven,
      truthMatrixApplicationVerdict: null,
    },
    evidencePriorityApplied: EVIDENCE_PRIORITY,
  };
}
