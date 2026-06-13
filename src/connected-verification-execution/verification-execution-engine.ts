/**
 * Verification Execution Engine — bounded real checks inside disposable workspaces (Phase 25.30).
 */

import { existsSync, writeFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join, resolve, sep } from 'node:path';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  MAX_VERIFICATION_ARTIFACTS,
  MAX_VERIFICATION_DIAGNOSTICS,
  MAX_VERIFICATION_EVIDENCE,
  MAX_VERIFICATION_RESULTS,
  MAX_VERIFICATION_WARNINGS,
  OPTIONAL_BOUNDED_CHECKS,
  REQUIRED_BOUNDED_CHECKS,
  VERIFICATION_PLAN,
  VERIFICATION_PROBE_TIMEOUT_MS,
} from './connected-verification-execution-registry.js';
import type {
  ExecuteVerificationExecutionInput,
  ExecuteVerificationExecutionResult,
  VerificationArtifactEntry,
  VerificationCheckStatus,
  VerificationDiagnosticEntry,
  VerificationEvidenceEntry,
  VerificationExecutionEvidence,
  VerificationResultEntry,
} from './connected-verification-execution-types.js';

let evidenceCounter = 0;
let verificationCounter = 0;

export function resetVerificationExecutionEngineForTests(): void {
  evidenceCounter = 0;
  verificationCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `verification-execution-evidence-${evidenceCounter}`;
}

function nextVerificationId(): string {
  verificationCounter += 1;
  return `connected-verification-${verificationCounter}`;
}

function buildEvidence(
  evidenceType: string,
  summary: string,
  source: string,
): VerificationEvidenceEntry {
  return {
    readOnly: true,
    evidenceId: nextEvidenceId(),
    evidenceType,
    summary,
    source,
    inspectedAt: new Date().toISOString(),
  };
}

function resultEntry(
  checkId: string,
  label: string,
  status: VerificationCheckStatus,
  detail: string,
): VerificationResultEntry {
  return {
    readOnly: true,
    checkId,
    label,
    status,
    detail,
    source: 'verification-execution-engine',
  };
}

function isWorkspaceRootSafe(projectRootDir: string, workspaceRoot: string): boolean {
  const generatedRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR);
  return workspaceRoot.startsWith(generatedRoot + sep) || workspaceRoot === generatedRoot;
}

interface PreviewProbeResult {
  reachable: boolean;
  responseSuccessful: boolean;
  statusCode: number;
  body: string;
}

function probePreviewUrl(previewUrl: string): Promise<PreviewProbeResult> {
  return new Promise((resolvePromise) => {
    const req = httpGet(previewUrl, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const statusCode = res.statusCode ?? 0;
        resolvePromise({
          reachable: true,
          responseSuccessful: statusCode >= 200 && statusCode < 300,
          statusCode,
          body: body.slice(0, 500),
        });
      });
    });
    req.on('error', () => {
      resolvePromise({ reachable: false, responseSuccessful: false, statusCode: 0, body: '' });
    });
    req.setTimeout(VERIFICATION_PROBE_TIMEOUT_MS, () => {
      req.destroy();
      resolvePromise({ reachable: false, responseSuccessful: false, statusCode: 0, body: '' });
    });
  });
}

function emptyExecutionEvidence(): VerificationExecutionEvidence {
  return {
    readOnly: true,
    verificationStarted: false,
    verificationCompleted: false,
    verificationChecksExecuted: 0,
    verificationArtifactsGenerated: false,
    verificationCoverageCollected: false,
    verificationSucceeded: false,
    previewProbeStatus: 'SKIP',
    workspaceEvidenceStatus: 'SKIP',
    runtimeEvidenceStatus: 'SKIP',
    previewEvidenceStatus: 'SKIP',
    inspectedAt: new Date().toISOString(),
    inspectionSource: 'real-verification-execution-inspection',
  };
}

function aggregateStatus(checks: VerificationResultEntry[], ids: string[]): VerificationCheckStatus {
  const relevant = checks.filter((c) => ids.includes(c.checkId));
  if (relevant.length === 0) return 'SKIP';
  if (relevant.every((c) => c.status === 'PASS')) return 'PASS';
  if (relevant.some((c) => c.status === 'FAIL')) return 'FAIL';
  return 'SKIP';
}

export async function executeVerificationExecution(
  input: ExecuteVerificationExecutionInput,
): Promise<ExecuteVerificationExecutionResult> {
  const startMs = Date.now();
  const verificationEvidence: VerificationEvidenceEntry[] = [];
  const verificationWarnings: string[] = [];
  const verificationDiagnostics: VerificationDiagnosticEntry[] = [];
  const blockingReasons: string[] = [];
  const verificationArtifacts: VerificationArtifactEntry[] = [];
  const verificationResults: VerificationResultEntry[] = [];
  const verificationId = nextVerificationId();
  const verificationPlan = [...VERIFICATION_PLAN];

  if (input.executionMode === 'BLOCKED' || input.executionMode === 'DRY_RUN') {
    return {
      success: false,
      verificationId,
      previewUrl: input.previewUrl,
      verificationPlan,
      verificationResults,
      verificationArtifacts,
      verificationEvidence,
      verificationWarnings: [`Execution mode ${input.executionMode} — no verification checks run.`],
      verificationDiagnostics,
      executionEvidence: emptyExecutionEvidence(),
      verificationDurationMs: 0,
      realVerificationExecutionPerformed: false,
      blockingReasons:
        input.executionMode === 'BLOCKED' ? ['Verification execution blocked by upstream gates.'] : [],
    };
  }

  if (!isWorkspaceRootSafe(input.projectRootDir, input.workspaceRoot)) {
    blockingReasons.push('Workspace root is outside generated builder workspaces.');
    return {
      success: false,
      verificationId,
      previewUrl: input.previewUrl,
      verificationPlan,
      verificationResults,
      verificationArtifacts,
      verificationEvidence: [
        buildEvidence('PATH_BLOCKED', 'Workspace root failed isolation check', 'verification-execution-engine'),
      ],
      verificationWarnings,
      verificationDiagnostics,
      executionEvidence: emptyExecutionEvidence(),
      verificationDurationMs: Date.now() - startMs,
      realVerificationExecutionPerformed: false,
      blockingReasons,
    };
  }

  verificationEvidence.push(
    buildEvidence('VERIFICATION_STARTED', `workspaceId=${input.workspaceId}`, 'verification-execution-engine'),
  );

  const workspaceExists = existsSync(input.workspaceRoot);
  verificationResults.push(
    resultEntry(
      'workspace-exists',
      'Workspace exists',
      workspaceExists ? 'PASS' : 'FAIL',
      workspaceExists ? input.workspaceRoot : 'Workspace root missing',
    ),
  );

  const generatedFiles = ['package.json', 'dist/server.js'];
  const generatedPresent = generatedFiles.filter((f) => existsSync(join(input.workspaceRoot, f)));
  verificationResults.push(
    resultEntry(
      'generated-files-exist',
      'Generated files exist',
      generatedPresent.length === generatedFiles.length ? 'PASS' : 'FAIL',
      `found=${generatedPresent.join(',')}`,
    ),
  );

  const buildMarker = join(input.workspaceRoot, '.build-output.json');
  verificationResults.push(
    resultEntry(
      'build-artifacts-exist',
      'Build artifacts exist',
      existsSync(buildMarker) ? 'PASS' : 'FAIL',
      existsSync(buildMarker) ? '.build-output.json present' : 'Build marker missing',
    ),
  );

  const runtimeMarker = join(input.workspaceRoot, '.runtime-activated.json');
  verificationResults.push(
    resultEntry(
      'runtime-evidence-exists',
      'Runtime evidence exists',
      existsSync(runtimeMarker) ? 'PASS' : 'FAIL',
      existsSync(runtimeMarker) ? '.runtime-activated.json present' : 'Runtime marker missing',
    ),
  );

  const previewMarker = join(input.workspaceRoot, '.preview-activated.json');
  const founderMeta = join(input.workspaceRoot, '.preview-founder-metadata.json');
  const previewEvidenceOk = existsSync(previewMarker) && existsSync(founderMeta);
  verificationResults.push(
    resultEntry(
      'preview-evidence-exists',
      'Preview evidence exists',
      previewEvidenceOk ? 'PASS' : 'FAIL',
      previewEvidenceOk ? 'Preview markers present' : 'Preview markers missing',
    ),
  );

  const probe = await probePreviewUrl(input.previewUrl);
  verificationResults.push(
    resultEntry(
      'preview-url-reachable',
      'Preview URL reachable',
      probe.reachable ? 'PASS' : 'FAIL',
      probe.reachable ? `HTTP probe ok url=${input.previewUrl}` : `Unreachable: ${input.previewUrl}`,
    ),
  );
  verificationResults.push(
    resultEntry(
      'preview-response-successful',
      'Preview response successful',
      probe.responseSuccessful ? 'PASS' : 'FAIL',
      probe.responseSuccessful ? `status=${probe.statusCode}` : `status=${probe.statusCode}`,
    ),
  );

  if (probe.reachable) {
    verificationEvidence.push(
      buildEvidence('PREVIEW_PROBE', `status=${probe.statusCode} bodyLen=${probe.body.length}`, 'verification-execution-engine'),
    );
  }

  verificationDiagnostics.push({
    readOnly: true,
    diagnosticId: 'preview-probe-status',
    label: 'Preview probe status code',
    value: String(probe.statusCode),
    source: 'verification-execution-engine',
  });

  for (const optional of OPTIONAL_BOUNDED_CHECKS) {
    let status: VerificationCheckStatus = 'SKIP';
    let detail = 'Optional check skipped';
    if (optional === 'package-metadata-exists') {
      const ok = existsSync(join(input.workspaceRoot, 'package.json'));
      status = ok ? 'PASS' : 'FAIL';
      detail = ok ? 'package.json present' : 'package.json missing';
    }
    if (optional === 'startup-marker-exists') {
      const ok = existsSync(runtimeMarker);
      status = ok ? 'PASS' : 'FAIL';
      detail = ok ? '.runtime-activated.json present' : 'Startup marker missing';
    }
    if (optional === 'preview-marker-exists') {
      const ok = existsSync(previewMarker);
      status = ok ? 'PASS' : 'FAIL';
      detail = ok ? '.preview-activated.json present' : 'Preview marker missing';
    }
    if (optional === 'founder-metadata-exists') {
      const ok = existsSync(founderMeta);
      status = ok ? 'PASS' : 'FAIL';
      detail = ok ? '.preview-founder-metadata.json present' : 'Founder metadata missing';
    }
    verificationResults.push(
      resultEntry(optional, optional.replace(/-/g, ' '), status, detail),
    );
  }

  let verificationArtifactWritten = false;
  const verificationDurationMs = Date.now() - startMs;
  try {
    const artifactPath = join(input.workspaceRoot, '.verification-executed.json');
    writeFileSync(
      artifactPath,
      JSON.stringify(
        {
          verificationId,
          workspaceId: input.workspaceId,
          previewUrl: input.previewUrl,
          executedAt: new Date().toISOString(),
          verificationDurationMs,
          checksExecuted: verificationResults.length,
          results: verificationResults.map((r) => ({
            checkId: r.checkId,
            status: r.status,
            detail: r.detail,
          })),
          probeStatusCode: probe.statusCode,
        },
        null,
        2,
      ),
      'utf8',
    );
    verificationArtifactWritten = existsSync(artifactPath);
    verificationArtifacts.push({
      readOnly: true,
      path: '.verification-executed.json',
      category: 'VERIFICATION_MARKER',
      sourceAuthority: 'connected-verification-execution',
    });
    verificationEvidence.push(
      buildEvidence('VERIFICATION_ARTIFACT_WRITTEN', '.verification-executed.json', 'verification-execution-engine'),
    );
  } catch (err) {
    verificationWarnings.push(
      `Failed to write verification artifact: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  verificationResults.push(
    resultEntry(
      'verification-artifact-written',
      'Verification artifact written',
      verificationArtifactWritten ? 'PASS' : 'FAIL',
      verificationArtifactWritten ? '.verification-executed.json present' : 'Artifact write failed',
    ),
  );

  const requiredResults = verificationResults.filter((r) =>
    (REQUIRED_BOUNDED_CHECKS as readonly string[]).includes(r.checkId),
  );
  const requiredPassed = requiredResults.every((r) => r.status === 'PASS');
  const checksExecuted = verificationResults.filter((r) => r.status !== 'SKIP').length;

  const workspaceEvidenceStatus = aggregateStatus(verificationResults, ['workspace-exists', 'generated-files-exist', 'build-artifacts-exist']);
  const runtimeEvidenceStatus = aggregateStatus(verificationResults, ['runtime-evidence-exists', 'startup-marker-exists']);
  const previewEvidenceStatus = aggregateStatus(verificationResults, ['preview-evidence-exists', 'preview-marker-exists', 'founder-metadata-exists']);
  const previewProbeStatus = aggregateStatus(verificationResults, ['preview-url-reachable', 'preview-response-successful']);

  const executionEvidence: VerificationExecutionEvidence = {
    readOnly: true,
    verificationStarted: true,
    verificationCompleted: requiredPassed && verificationArtifactWritten,
    verificationChecksExecuted: checksExecuted,
    verificationArtifactsGenerated: verificationArtifactWritten,
    verificationCoverageCollected: checksExecuted >= REQUIRED_BOUNDED_CHECKS.length,
    verificationSucceeded: requiredPassed && probe.responseSuccessful && verificationArtifactWritten,
    previewProbeStatus,
    workspaceEvidenceStatus,
    runtimeEvidenceStatus,
    previewEvidenceStatus,
    inspectedAt: new Date().toISOString(),
    inspectionSource: 'real-verification-execution-inspection',
  };

  verificationEvidence.push(
    buildEvidence(
      'VERIFICATION_INSPECTION',
      `completed=${executionEvidence.verificationCompleted} checks=${checksExecuted} succeeded=${executionEvidence.verificationSucceeded}`,
      'real-verification-execution-inspection',
    ),
  );

  verificationDiagnostics.push({
    readOnly: true,
    diagnosticId: 'checks-executed',
    label: 'Checks executed',
    value: String(checksExecuted),
    source: 'verification-execution-engine',
  });
  verificationDiagnostics.push({
    readOnly: true,
    diagnosticId: 'verification-duration',
    label: 'Verification duration (ms)',
    value: String(verificationDurationMs),
    source: 'verification-execution-engine',
  });

  const success =
    blockingReasons.length === 0 &&
    executionEvidence.verificationCompleted &&
    executionEvidence.verificationSucceeded &&
    executionEvidence.verificationArtifactsGenerated &&
    executionEvidence.previewProbeStatus === 'PASS' &&
    executionEvidence.workspaceEvidenceStatus === 'PASS' &&
    executionEvidence.runtimeEvidenceStatus === 'PASS' &&
    executionEvidence.previewEvidenceStatus === 'PASS';

  return {
    success,
    verificationId,
    previewUrl: input.previewUrl,
    verificationPlan,
    verificationResults: verificationResults.slice(0, MAX_VERIFICATION_RESULTS),
    verificationArtifacts: verificationArtifacts.slice(0, MAX_VERIFICATION_ARTIFACTS),
    verificationEvidence: verificationEvidence.slice(0, MAX_VERIFICATION_EVIDENCE),
    verificationWarnings: verificationWarnings.slice(0, MAX_VERIFICATION_WARNINGS),
    verificationDiagnostics: verificationDiagnostics.slice(0, MAX_VERIFICATION_DIAGNOSTICS),
    executionEvidence,
    verificationDurationMs,
    realVerificationExecutionPerformed: success,
    blockingReasons,
  };
}
