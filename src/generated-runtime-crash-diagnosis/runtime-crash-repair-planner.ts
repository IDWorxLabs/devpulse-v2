/**
 * Runtime crash repair planner (Phase 26.81).
 */

import type {
  RuntimeCrashClassification,
  RuntimeCrashRepairPlan,
  RuntimeEntrypointCrashMapping,
} from './generated-runtime-crash-diagnosis-types.js';

export function buildRuntimeCrashRepairPlan(input: {
  classification: RuntimeCrashClassification;
  mapping: RuntimeEntrypointCrashMapping;
}): RuntimeCrashRepairPlan {
  const { classification, mapping } = input;
  const file = classification.failingFile ?? mapping.entryFile;

  switch (classification.crashClass) {
    case 'NONE':
      return {
        readOnly: true,
        repairRecommendation: 'No crash repair required — health probe succeeded.',
        expectedEffect: 'Advance to route/UI/founder-flow proof boundaries.',
        shouldAutoRepair: false,
        riskLevel: 'LOW',
        targetedFile: null,
      };
    case 'SYNTAX_ERROR':
      return {
        readOnly: true,
        repairRecommendation: `Fix syntax error in ${file ?? 'generated entrypoint'} and re-run bounded startup probe.`,
        expectedEffect: 'Process should stay alive and emit ready signal.',
        shouldAutoRepair: false,
        riskLevel: 'MEDIUM',
        targetedFile: file,
      };
    case 'MISSING_IMPORT':
      return {
        readOnly: true,
        repairRecommendation: `Add missing import/module to package.json or generated source (${classification.failingSymbol ?? 'unknown module'}).`,
        expectedEffect: 'Runtime entrypoint resolves all imports before listen.',
        shouldAutoRepair: false,
        riskLevel: 'MEDIUM',
        targetedFile: file,
      };
    case 'MODULE_FORMAT_MISMATCH':
      return {
        readOnly: true,
        repairRecommendation: 'Align ESM/CJS: set package.json "type":"module" or convert entrypoint extension/import style.',
        expectedEffect: 'Node loads entrypoint without ERR_REQUIRE_ESM.',
        shouldAutoRepair: false,
        riskLevel: 'MEDIUM',
        targetedFile: file ?? 'package.json',
      };
    case 'ENTRYPOINT_NOT_FOUND':
      return {
        readOnly: true,
        repairRecommendation: `Materialize missing entrypoint ${file ?? 'runtime/dev-server.mjs'} in generated workspace.`,
        expectedEffect: 'Startup command resolves to an existing file.',
        shouldAutoRepair: false,
        riskLevel: 'HIGH',
        targetedFile: file ?? 'runtime/dev-server.mjs',
      };
    case 'BAD_SERVER_EXPORT':
      return {
        readOnly: true,
        repairRecommendation: 'Fix server bootstrap — ensure createServer/listen export matches runtime starter expectations.',
        expectedEffect: 'Dev server binds port and stays running.',
        shouldAutoRepair: false,
        riskLevel: 'MEDIUM',
        targetedFile: file ?? 'server/index.ts',
      };
    case 'BAD_VITE_CONFIG':
      return {
        readOnly: true,
        repairRecommendation: 'Repair vite.config.ts/js — invalid config prevents dev server startup.',
        expectedEffect: 'Vite dev server starts and serves UI.',
        shouldAutoRepair: false,
        riskLevel: 'MEDIUM',
        targetedFile: 'vite.config.ts',
      };
    case 'PORT_BIND_FAILURE':
      return {
        readOnly: true,
        repairRecommendation: `Free port ${mapping.portBound ? 'conflict' : 'binding target'} or use dynamic port with ready JSON signal.`,
        expectedEffect: 'Server binds without EADDRINUSE.',
        shouldAutoRepair: false,
        riskLevel: 'LOW',
        targetedFile: file,
      };
    case 'PROCESS_EXITED_EARLY':
      return {
        readOnly: true,
        repairRecommendation:
          mapping.healthResponded
            ? 'Tune startup probe exit detection — server responded but probe flagged early exit; verify ready-line parsing and avoid killing before health check.'
            : `Keep ${file ?? 'runtime entrypoint'} alive until ready signal; ensure listen callback emits JSON ready line.`,
        expectedEffect: 'Startup probe observes healthy process through bounded window.',
        shouldAutoRepair: false,
        riskLevel: 'LOW',
        targetedFile: file,
      };
    case 'GENERATED_CODE_RUNTIME_ERROR':
      return {
        readOnly: true,
        repairRecommendation: `Fix runtime exception in ${file ?? 'generated source'}${classification.failingLine ? ` near line ${classification.failingLine}` : ''}.`,
        expectedEffect: 'Uncaught exception eliminated; process remains running.',
        shouldAutoRepair: false,
        riskLevel: 'MEDIUM',
        targetedFile: file,
      };
    default:
      return {
        readOnly: true,
        repairRecommendation: 'Review bounded startup logs and entrypoint mapping to identify uncaught crash signature.',
        expectedEffect: 'Precise crash class becomes actionable for next repair phase.',
        shouldAutoRepair: false,
        riskLevel: 'HIGH',
        targetedFile: file,
      };
  }
}
