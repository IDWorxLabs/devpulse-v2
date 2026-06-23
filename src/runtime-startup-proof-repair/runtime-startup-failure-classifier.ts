/**
 * Startup failure classifier (Phase 26.77).
 */

import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
  StartupFailureClass,
} from './runtime-startup-proof-repair-types.js';
import type { GeneratedWorkspaceDependencyMaterializationReport } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import type { GeneratedRuntimeCrashDiagnosisReport } from '../generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.js';

export interface StartupFailureClassification {
  readOnly: true;
  failureClass: StartupFailureClass;
  failureReason: string;
  recommendedFix: string;
  recommendedNextActions: string[];
}

export function classifyStartupFailure(input: {
  entrypoint: RuntimeEntrypointCandidate;
  resolved: ResolvedStartupCommand;
  probe: RuntimeStartupProbeResult;
  dependencyMaterialization?: GeneratedWorkspaceDependencyMaterializationReport | null;
  crashDiagnosis?: GeneratedRuntimeCrashDiagnosisReport | null;
}): StartupFailureClassification {
  const { entrypoint, resolved, probe, dependencyMaterialization, crashDiagnosis } = input;

  if (probe.applicationBoots) {
    return {
      readOnly: true,
      failureClass: 'NONE',
      failureReason: 'Bounded startup probe confirmed application boots and responds.',
      recommendedFix: 'Proceed to route/UI/founder-flow proof in Runtime Materialization Truth Bridge.',
      recommendedNextActions: ['Advance failureBoundary from STARTUP to ROUTE or UI if later proof fails.'],
    };
  }

  const logBlob = [...probe.startupLogs, ...probe.fatalErrors].join(' ').toLowerCase();

  if (!resolved.resolved || !resolved.command) {
    return {
      readOnly: true,
      failureClass: 'NO_START_COMMAND',
      failureReason: 'No evidence-backed startup command could be resolved.',
      recommendedFix: 'Add dev/start script to generated workspace package.json or materialize runtime/dev-server.mjs.',
      recommendedNextActions: entrypoint.missingPrerequisites.map((p) => `Fix: ${p}`),
    };
  }

  if (probe.fatalErrors.some((e) => e.includes('WRONG_WORKSPACE_CWD'))) {
    return {
      readOnly: true,
      failureClass: 'WRONG_WORKSPACE_CWD',
      failureReason: 'Startup probe refused — workspace outside generated builder workspaces.',
      recommendedFix: 'Link materialized workspace under .generated-builder-workspaces/.',
      recommendedNextActions: ['Verify connected build execution workspace path.'],
    };
  }

  if (
    dependencyMaterialization &&
    !dependencyMaterialization.dependenciesReady &&
    !probe.applicationBoots
  ) {
    const plan = dependencyMaterialization.repairPlan;
    return {
      readOnly: true,
      failureClass: 'MISSING_DEPENDENCIES',
      failureReason: `Dependency materialization: ${dependencyMaterialization.dependencyState} — ${dependencyMaterialization.presence.dependencyStateReason}`,
      recommendedFix: dependencyMaterialization.recommendedFix,
      recommendedNextActions: [
        `installCommand=${plan.installCommand}`,
        `installCwd=${plan.installCwd}`,
        `packageManager=${plan.packageManager} (${dependencyMaterialization.packageManager.evidenceSource})`,
        `missingModules=${plan.missingModulesSummary}`,
        `shouldAutoRun=${plan.shouldAutoRun}`,
      ],
    };
  }

  if (
    !dependencyMaterialization?.dependenciesReady &&
    (entrypoint.missingPrerequisites.includes('node_modules not installed') ||
      logBlob.includes('missing_dependencies') ||
      logBlob.includes('cannot find module'))
  ) {
    return {
      readOnly: true,
      failureClass: 'MISSING_DEPENDENCIES',
      failureReason: 'Startup failed — dependencies missing in generated workspace.',
      recommendedFix: 'Run npm install in generated workspace before startup probe.',
      recommendedNextActions: ['Materialize package.json dependencies in builder workspace.'],
    };
  }

  if (logBlob.includes('port_conflict') || logBlob.includes('eaddrinuse')) {
    return {
      readOnly: true,
      failureClass: 'PORT_CONFLICT',
      failureReason: `Expected port ${probe.expectedPort} already in use.`,
      recommendedFix: 'Use dynamic port binding or free conflicting port before probe.',
      recommendedNextActions: [`Retry with alternate port for ${entrypoint.appType} app.`],
    };
  }

  if (logBlob.includes('compile_error') || logBlob.includes('syntaxerror') || logBlob.includes('failed to compile')) {
    return {
      readOnly: true,
      failureClass: 'COMPILE_ERROR',
      failureReason: 'Startup logs indicate compile/transpile failure.',
      recommendedFix: 'Fix generated source or build output before runtime startup.',
      recommendedNextActions: probe.startupLogs.slice(-3).map((l) => `Log: ${l}`),
    };
  }

  if (
    logBlob.includes('entrypoint_missing') ||
    (resolved.entryFile && probe.fatalErrors.some((e) => e.includes('ENTRYPOINT_MISSING')))
  ) {
    return {
      readOnly: true,
      failureClass: 'ENTRYPOINT_MISSING',
      failureReason: `Entry file missing: ${resolved.entryFile ?? 'unknown'}`,
      recommendedFix: 'Materialize server entrypoint in generated workspace.',
      recommendedNextActions: [`Expected: ${resolved.entryFile ?? 'runtime/dev-server.mjs'}`],
    };
  }

  if (probe.timedOut && probe.processStarted) {
    return {
      readOnly: true,
      failureClass: 'STARTUP_TIMEOUT',
      failureReason: `Process started but did not become reachable within ${probe.elapsedMs}ms.`,
      recommendedFix: 'Increase bounded timeout or fix slow startup / missing ready signal.',
      recommendedNextActions: ['Check startup logs for hang or missing port binding.'],
    };
  }

  if (probe.processStarted && probe.fatalErrors.some((e) => e.includes('RUNTIME_CRASH'))) {
    if (crashDiagnosis?.crashDetected) {
      const cls = crashDiagnosis.classification;
      const plan = crashDiagnosis.repairPlan;
      return {
        readOnly: true,
        failureClass: 'RUNTIME_CRASH',
        failureReason: `${cls.crashClass}: ${cls.crashClassReason}`,
        recommendedFix: crashDiagnosis.recommendedFix,
        recommendedNextActions: [
          `preciseCrashClass=${cls.crashClass}`,
          `failingFile=${cls.failingFile ?? 'unknown'}`,
          `failingLine=${cls.failingLine ?? 'n/a'}`,
          `rawErrorExcerpt=${crashDiagnosis.extraction.rawErrorExcerpt.slice(0, 120)}`,
          `repair=${plan.repairRecommendation}`,
        ],
      };
    }
    return {
      readOnly: true,
      failureClass: 'RUNTIME_CRASH',
      failureReason: 'Process started then exited with error.',
      recommendedFix: 'Fix runtime crash in generated application entrypoint.',
      recommendedNextActions: probe.startupLogs.slice(-4).map((l) => `Log: ${l}`),
    };
  }

  if (
    resolved.evidenceSource === 'FRAMEWORK_DEFAULT' &&
    !probe.processStarted &&
    entrypoint.appType === 'UNKNOWN'
  ) {
    return {
      readOnly: true,
      failureClass: 'FRAMEWORK_MISMATCH',
      failureReason: 'Could not match generated app to known framework startup pattern.',
      recommendedFix: 'Detect framework from package.json and add appropriate start script.',
      recommendedNextActions: entrypoint.discoverySources.map((s) => `Observed: ${s}`),
    };
  }

  if (probe.timedOut) {
    return {
      readOnly: true,
      failureClass: 'STARTUP_TIMEOUT',
      failureReason: 'Startup probe timed out before process became reachable.',
      recommendedFix: 'Verify command, cwd, and entrypoint for generated workspace.',
      recommendedNextActions: [`Command: ${probe.attemptedCommand ?? 'none'}`],
    };
  }

  return {
    readOnly: true,
    failureClass: 'UNKNOWN_STARTUP_FAILURE',
    failureReason: probe.fatalErrors[0] ?? 'Startup probe failed without classified cause.',
    recommendedFix: 'Review startup logs and command resolution evidence.',
    recommendedNextActions: [
      `command=${probe.attemptedCommand ?? 'none'}`,
      `cwd=${probe.cwd}`,
      `evidence=${resolved.evidenceDetail}`,
    ],
  };
}
