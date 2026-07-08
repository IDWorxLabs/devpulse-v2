/**
 * False success detection — contract-derived, no application-specific logic.
 */

import type { E2EFalseSuccessFinding } from './e2e-build-reality-types.js';
import type { E2EValidationCheck } from './e2e-build-reality-types.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';

export function detectFalseSuccesses(input: {
  manifest: GeneratedAppManifest | null;
  previewHttpOk: boolean;
  genericShellDetected: boolean;
  featureMounted: boolean;
  workspaceHash: string | null;
  previewWorkspaceHash: string | null;
  interactionPassed: boolean;
  checks: E2EValidationCheck[];
  buildStatusReady: boolean;
  buildResultPass: boolean;
  previewAuthorityMismatch?: boolean;
  previewAuthorityDetail?: string | null;
  initialVisibleDomMismatch?: boolean;
}): E2EFalseSuccessFinding[] {
  const findings: E2EFalseSuccessFinding[] = [];

  if (input.previewAuthorityMismatch) {
    findings.push({
      readOnly: true,
      code: 'PREVIEW_AUTHORITY_MISMATCH',
      label: 'Preview authority mismatch',
      detail:
        input.previewAuthorityDetail ??
        'Served preview workspace, registered preview URL, iframe target, or Playwright inspection target are not aligned.',
      critical: true,
    });
  }

  if (input.initialVisibleDomMismatch) {
    findings.push({
      readOnly: true,
      code: 'VISIBLE_DOM_CONTRACT_MISMATCH',
      label: 'Visible browser DOM differs from contract',
      detail:
        'Initial Live Preview surface shows auth/shell instead of contract-derived feature UI — automated navigation must not satisfy readiness alone.',
      critical: true,
    });
  }

  if (input.previewHttpOk && input.genericShellDetected && input.featureMounted === false) {
    findings.push({
      readOnly: true,
      code: 'HTTP_200_WRONG_APPLICATION',
      label: 'HTTP 200 but wrong application surface',
      detail: 'Preview responded but generic shell shown without mounted feature modules.',
      critical: true,
    });
  }

  if (input.genericShellDetected && input.featureMounted) {
    findings.push({
      readOnly: true,
      code: 'GENERIC_SHELL_PRIMARY',
      label: 'Generic shell shown as primary surface',
      detail: 'Blueprint welcome/shell copy visible instead of contract-derived feature UI.',
      critical: true,
    });
  }

  if (input.featureMounted === false && input.checks.some((c) => c.id.startsWith('feature-mounted') && !c.passed)) {
    findings.push({
      readOnly: true,
      code: 'FEATURE_NEVER_MOUNTED',
      label: 'Feature exists in workspace but is not mounted in preview',
      detail: 'Generated feature module files exist but DOM does not mount them at root.',
      critical: true,
    });
  }

  if (
    input.workspaceHash &&
    input.previewWorkspaceHash &&
    input.workspaceHash !== input.previewWorkspaceHash &&
    input.previewHttpOk
  ) {
    findings.push({
      readOnly: true,
      code: 'STALE_PREVIEW_WORKSPACE',
      label: 'Preview may be serving stale workspace',
      detail: `Workspace hash ${input.workspaceHash.slice(0, 12)}… differs from preview workspace hash ${input.previewWorkspaceHash.slice(0, 12)}….`,
      critical: true,
    });
  }

  if (
    input.manifest?.materializationQualityScore &&
    input.manifest.materializationQualityScore >= 90 &&
    !input.interactionPassed
  ) {
    findings.push({
      readOnly: true,
      code: 'QUALITY_WITHOUT_RENDERED_FEATURE',
      label: 'Materialization quality PASS without rendered feature proof',
      detail: `Quality score ${input.manifest.materializationQualityScore}% without interactive/DOM validation.`,
      critical: true,
    });
  }

  if (input.manifest?.workspaceRealityAuditStatus === 'PASS' && input.genericShellDetected) {
    findings.push({
      readOnly: true,
      code: 'WORKSPACE_PASS_VISIBLE_MISMATCH',
      label: 'Workspace reality PASS but visible application differs',
      detail: 'Static workspace audit passed while rendered preview shows generic shell.',
      critical: true,
    });
  }

  if (input.buildStatusReady && input.buildResultPass && findings.some((f) => f.critical)) {
    findings.push({
      readOnly: true,
      code: 'BUILD_HISTORY_FALSE_PASS',
      label: 'Build history says PASS while runtime differs',
      detail: 'Build orchestrator reported READY/PASS despite visible reality failures.',
      critical: true,
    });
  }

  const criticalCheckFailures = input.checks.filter((c) => c.critical && !c.passed);
  if (criticalCheckFailures.length > 0) {
    findings.push({
      readOnly: true,
      code: 'USER_WORKFLOW_INCOMPLETE',
      label: 'User workflow cannot complete',
      detail: criticalCheckFailures.map((c) => c.label).join('; '),
      critical: true,
    });
  }

  return findings;
}
