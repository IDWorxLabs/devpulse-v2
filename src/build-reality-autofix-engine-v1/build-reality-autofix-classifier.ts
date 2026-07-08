/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — evidence-driven failure classification.
 */

import type {
  BuildRealityAutofixEvidence,
  BuildRealityAutofixFailureClass,
  BuildRealityAutofixFailureFinding,
} from './build-reality-autofix-types.js';
import { BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND } from './build-reality-autofix-types.js';

function finding(
  failureClass: BuildRealityAutofixFailureClass,
  detail: string,
  source: string,
  critical = true,
): BuildRealityAutofixFailureFinding {
  return { readOnly: true, failureClass, detail, source, critical };
}

export function isPlaywrightEnvironmentFailure(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /executable doesn't exist/i.test(text) ||
    /browser.*not found/i.test(text) ||
    /playwright.*install/i.test(text) ||
    /playwright unavailable/i.test(text) ||
    lower.includes('chromium_headless_shell') ||
    lower.includes('npx playwright install')
  );
}

export function classifyBuildRealityFailures(
  evidence: BuildRealityAutofixEvidence,
): BuildRealityAutofixFailureFinding[] {
  const findings: BuildRealityAutofixFailureFinding[] = [];
  const corpus = [
    evidence.typescriptOutput ?? '',
    evidence.domFailureDetail ?? '',
    evidence.previewAuthorityDetail ?? '',
    evidence.materializationDetail ?? '',
    evidence.playwrightDetail ?? '',
    evidence.validatorHarnessDetail ?? '',
    evidence.validationDetail ?? '',
    evidence.failingStage ?? '',
    ...evidence.failedChecks.map((check) => `${check.id} ${check.detail}`),
    ...evidence.falseSuccessCodes,
    evidence.e2eReport?.stages.filter((stage) => !stage.passed).map((stage) => stage.detail).join('\n') ?? '',
  ]
    .filter(Boolean)
    .join('\n');

  if (isPlaywrightEnvironmentFailure(corpus)) {
    findings.push(
      finding(
        'PLAYWRIGHT_OR_BROWSER_ENVIRONMENT_FAILURE',
        `Playwright browser environment unavailable — run \`${BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND}\``,
        'playwright-detail',
      ),
    );
  }

  if (/validator harness|harness lost state|misread evidence/i.test(corpus)) {
    findings.push(
      finding(
        'VALIDATOR_HARNESS_FAILURE',
        evidence.validatorHarnessDetail ?? 'Validator harness failure detected',
        'validator-harness',
      ),
    );
  }

  if (/workspace missing|materialization.*fail|no workspace|manifest.*missing/i.test(corpus)) {
    findings.push(
      finding(
        'MATERIALIZATION_FAILURE',
        evidence.materializationDetail ?? 'Materialization or workspace integrity failure',
        'materialization',
      ),
    );
  }

  if (/preview.*server|dev server|vite.*error|preview url missing|gate-unlocked preview/i.test(corpus)) {
    findings.push(
      finding(
        'PREVIEW_SERVER_FAILURE',
        evidence.previewAuthorityDetail ?? 'Preview server or session lifecycle failure',
        'preview-server',
        !findings.some((f) => f.failureClass === 'PLAYWRIGHT_OR_BROWSER_ENVIRONMENT_FAILURE'),
      ),
    );
  }

  if (
    /welcome-screen|authscreen|sign in|blueprint shell|generic shell|data-blueprint/i.test(corpus) &&
    (evidence.e2eReport?.expectations.mountMode === 'direct-feature' ||
      Boolean(evidence.e2eReport?.expectations.primaryModuleId) ||
      Boolean(evidence.workspaceDir))
  ) {
    findings.push(
      finding(
        'ROUTE_OR_ROOT_MOUNT_MISMATCH',
        'Contract expects direct feature at root but blueprint/auth shell is primary',
        'mount-mode-evidence',
      ),
    );
  }

  if (
    evidence.e2eReport?.expectations.mountMode === 'direct-feature' &&
    (evidence.falseSuccessCodes.includes('GENERIC_SHELL_PRIMARY') ||
      evidence.falseSuccessCodes.includes('VISIBLE_DOM_CONTRACT_MISMATCH'))
  ) {
    findings.push(
      finding(
        'ROUTE_OR_ROOT_MOUNT_MISMATCH',
        'Contract expects direct feature mount but false-success scan detected shell mismatch',
        'e2e-false-success',
      ),
    );
  }

  if (
    /feature.*not mounted|contract.*feature.*not rendered|initial visible dom|primary feature/i.test(corpus) ||
    evidence.falseSuccessCodes.includes('FEATURE_NEVER_MOUNTED') ||
    evidence.falseSuccessCodes.includes('VISIBLE_DOM_CONTRACT_MISMATCH')
  ) {
    findings.push(
      finding(
        'CONTRACT_PRIMARY_FEATURE_NOT_RENDERED',
        'Contract-primary feature surface not rendered in preview/DOM',
        'dom-contract',
      ),
    );
  }

  if (
    /interactive workflow failed|button-sequence|display shows|expected.*got|dom_interaction|data-digit|data-operator|click.*failed/i.test(
      corpus,
    ) ||
    evidence.failedChecks.some((check) => check.stageId === 'INTERACTIVE_REALITY')
  ) {
    findings.push(
      finding(
        'DOM_INTERACTION_FAILURE',
        evidence.domFailureDetail ?? 'Contract-derived DOM interaction failed',
        'dom-interaction',
      ),
    );
  }

  if (
    /has no exported member|is not exported|ts2305|ts2307|import.*export.*mismatch|cannot find module ['"]\./i.test(
      corpus,
    )
  ) {
    findings.push(
      finding(
        /has no exported member|is not exported|ts2305/i.test(corpus)
          ? 'IMPORT_EXPORT_MISMATCH'
          : 'MISSING_FILE_OR_MODULE',
        evidence.typescriptOutput?.slice(0, 240) ?? 'Import/export or module resolution failure',
        'typescript-output',
      ),
    );
  } else if (/cannot find module|module not found|enoent.*no such file/i.test(corpus)) {
    findings.push(
      finding(
        'MISSING_FILE_OR_MODULE',
        evidence.typescriptOutput?.slice(0, 240) ?? 'Missing file or module reference',
        'typescript-output',
      ),
    );
  }

  if (/ts\d{4}|typescript|type error|compile error|npm run build/i.test(corpus)) {
    findings.push(
      finding(
        'TYPESCRIPT_COMPILE_FAILURE',
        evidence.typescriptOutput?.slice(0, 240) ?? 'TypeScript compile failure',
        'typescript-output',
      ),
    );
  }

  if (findings.length === 0 && !corpus.trim()) {
    return findings;
  }

  if (findings.length === 0) {
    if (/unsafe|corrupt|destructive|unknown/i.test(corpus)) {
      findings.push(finding('UNKNOWN_FAILURE', corpus.slice(0, 240), 'residual-evidence'));
    } else {
      findings.push(finding('UNKNOWN_FAILURE', corpus.slice(0, 240) || 'Unclassified validation failure', 'residual-evidence'));
    }
  }

  return dedupeFindings(findings);
}

function dedupeFindings(
  findings: BuildRealityAutofixFailureFinding[],
): BuildRealityAutofixFailureFinding[] {
  const seen = new Set<BuildRealityAutofixFailureClass>();
  const result: BuildRealityAutofixFailureFinding[] = [];
  for (const item of findings) {
    if (seen.has(item.failureClass)) continue;
    seen.add(item.failureClass);
    result.push(item);
  }
  return result;
}

export function selectPrimaryFailureClass(
  findings: BuildRealityAutofixFailureFinding[],
): BuildRealityAutofixFailureClass {
  const priority: BuildRealityAutofixFailureClass[] = [
    'PLAYWRIGHT_OR_BROWSER_ENVIRONMENT_FAILURE',
    'VALIDATOR_HARNESS_FAILURE',
    'MATERIALIZATION_FAILURE',
    'TYPESCRIPT_COMPILE_FAILURE',
    'IMPORT_EXPORT_MISMATCH',
    'MISSING_FILE_OR_MODULE',
    'ROUTE_OR_ROOT_MOUNT_MISMATCH',
    'CONTRACT_PRIMARY_FEATURE_NOT_RENDERED',
    'DOM_INTERACTION_FAILURE',
    'PREVIEW_SERVER_FAILURE',
    'UNKNOWN_FAILURE',
  ];
  for (const failureClass of priority) {
    if (findings.some((findingItem) => findingItem.failureClass === failureClass)) {
      return failureClass;
    }
  }
  return 'UNKNOWN_FAILURE';
}

export function buildEvidenceFromValidationResult(input: {
  workspaceDir?: string | null;
  rawPrompt?: string | null;
  typescriptOutput?: string | null;
  domFailureDetail?: string | null;
  previewAuthorityDetail?: string | null;
  materializationDetail?: string | null;
  playwrightDetail?: string | null;
  validatorHarnessDetail?: string | null;
  e2eReport?: import('./build-reality-autofix-types.js').BuildRealityAutofixEvidence['e2eReport'];
  detail: string;
  passed: boolean;
}): BuildRealityAutofixEvidence {
  const e2eReport = input.e2eReport ?? null;
  return {
    readOnly: true,
    workspaceDir: input.workspaceDir ?? e2eReport?.evidence.workspacePath ?? null,
    rawPrompt: input.rawPrompt ?? e2eReport?.prompt ?? null,
    typescriptOutput: input.typescriptOutput ?? null,
    domFailureDetail:
      input.domFailureDetail ??
      e2eReport?.checks
        .filter((check) => check.stageId === 'INTERACTIVE_REALITY' && !check.passed)
        .map((check) => check.detail)
        .join('; ') ??
      null,
    previewAuthorityDetail:
      input.previewAuthorityDetail ??
      e2eReport?.stages.find((stage) => stage.stageId === 'PREVIEW_AUTHORITY')?.detail ??
      null,
    materializationDetail:
      input.materializationDetail ??
      e2eReport?.stages.find((stage) => stage.stageId === 'MATERIALIZATION')?.detail ??
      null,
    playwrightDetail: input.playwrightDetail ?? null,
    validatorHarnessDetail: input.validatorHarnessDetail ?? null,
    validationDetail: input.passed ? null : input.detail,
    e2eReport,
    failedChecks:
      e2eReport?.checks.filter((check) => !check.passed).map((check) => ({
        id: check.id,
        stageId: check.stageId,
        detail: check.detail,
      })) ?? [],
    failingStage: e2eReport?.failingStage ?? null,
    falseSuccessCodes: e2eReport?.falseSuccessFindings.map((findingItem) => findingItem.code) ?? [],
  };
}
