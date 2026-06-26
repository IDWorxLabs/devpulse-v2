/**
 * Universal Production Proof V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import { materializationEvidenceSummaryForChat } from '../src/materialization-evidence/materialization-evidence-completer.js';
import { readCompletedGeneratedAppManifest } from '../src/materialization-evidence/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  formatUniversalProductionProofMatrix,
  runUniversalProductionProof,
  SUPPORTED_UNIVERSAL_PRODUCTION_PROFILES,
  UNIVERSAL_PRODUCTION_PROOF_V1_PASS_TOKEN,
  universalProductionProofPaths,
  universalProductionProofTraceTitles,
  buildUniversalProductionProofTraceEvents,
  type UniversalProductionProofProfileResult,
  type UniversalProductionProofReport,
} from '../src/universal-production-proof/index.js';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function verifyProfileArtifacts(result: UniversalProductionProofProfileResult): string[] {
  const missing: string[] = [];
  const required: Array<[string, string | null]> = [
    ['workspace', result.links.workspacePath],
    ['persistent project', result.links.persistentProjectPath],
    ['manifest', result.links.manifestPath],
    ['build history', result.links.buildHistoryRecordPath],
    ['production validation', result.links.productionValidationArtifactPath],
    ['quality score', result.links.qualityScoreArtifactPath],
    ['feature contract reality', result.links.featureContractRealityArtifactPath],
    ['workspace reality audit', result.links.workspaceRealityAuditArtifactPath],
  ];
  for (const [label, path] of required) {
    if (!path || !existsSync(path)) missing.push(label);
  }
  return missing;
}

async function main(): Promise<void> {
  console.log('');
  console.log('Universal Production Proof V1 — Validation');
  console.log('=========================================');
  console.log('');

  const testRoot = join(tmpdir(), `universal-production-proof-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    const evidence = await runUniversalProductionProof({ projectRootDir: testRoot });
    const report = JSON.parse(
      readFileSync(universalProductionProofPaths(testRoot).artifact, 'utf8'),
    ) as UniversalProductionProofReport;

    assert(
      '01. All 10 supported profiles are executed',
      report.profileCount === 10 && report.profileResults.length === 10,
      `${report.profileCount}/10`,
    );

    assert(
      '02. Each profile runs the complete proof chain',
      report.profileResults.every((result) => result.chainStages.length >= 20),
      report.profileResults.map((result) => `${result.profile}:${result.chainStages.length}`).join(', '),
    );

    const artifactMissing = report.profileResults.flatMap((result) => verifyProfileArtifacts(result));
    assert(
      '03. Each profile has all required artifacts',
      artifactMissing.length === 0,
      artifactMissing.join(', ') || 'ok',
    );

    assert(
      '04. Each profile has production validation PASS',
      report.profileResults.every((result) => result.matrixRow.prodVal === 'PASS'),
      report.profileResults.filter((r) => r.matrixRow.prodVal !== 'PASS').map((r) => r.profile).join(', ') || 'ok',
    );

    assert(
      '05. Each profile has persistent project reality PASS',
      report.profileResults.every((result) => result.matrixRow.persist === 'PASS'),
      'ok',
    );

    assert(
      '06. Each profile has materialization quality score',
      report.profileResults.every((result) => result.qualityScore > 0),
      report.profileResults.map((r) => `${r.profile}:${r.qualityScore}`).join(', '),
    );

    assert(
      '07. Each profile has feature contract reality PASS',
      report.profileResults.every((result) => result.matrixRow.featureReality === 'PASS'),
      'ok',
    );

    assert(
      '08. Each profile has workspace reality audit PASS',
      report.profileResults.every(
        (result) => result.matrixRow.workspaceAudit === 'PASS' || result.matrixRow.workspaceAudit === 'WARN',
      ),
      report.profileResults
        .filter((r) => r.matrixRow.workspaceAudit === 'FAIL')
        .map((r) => r.profile)
        .join(', ') || 'ok',
    );

    assert(
      '09. Each profile has exportReady true',
      report.profileResults.every((result) => result.matrixRow.exportReady === 'PASS'),
      'ok',
    );

    const sample = report.profileResults[0]!;
    const manifest = readCompletedGeneratedAppManifest(sample.links.workspacePath!)!;
    const traceResult: OnePromptLivePreviewBuildResult = {
      readOnly: true,
      buildId: sample.buildRunId,
      projectId: sample.projectId,
      projectName: sample.scenarioId,
      status: 'READY',
      prompt: sample.prompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: sample.projectId,
      workspacePath: sample.links.workspacePath,
      generatedProfile: sample.profile as import('../src/code-generation-engine/code-generation-engine-types.js').GeneratedAppProfile,
      planningProofLevel: 'FULL',
      materializationProofLevel: 'FULL',
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: 'http://127.0.0.1:5173',
      livePreviewAvailable: true,
      failureReason: null,
      featureSignals: null,
      materializationManifest: manifest,
      updatedAt: manifest.completedAt ?? new Date().toISOString(),
    };
    const traceTitles = buildOnePromptExecutionTraceEvents(traceResult, sample.prompt).map((event) => event.eventTitle);
    assert(
      '10. Execution trace evidence exists',
      traceTitles.includes('Workspace reality audit started'),
      traceTitles.filter((title) => title.includes('reality') || title.includes('quality')).slice(0, 3).join(', '),
    );

    const chatSummary = materializationEvidenceSummaryForChat(manifest);
    assert(
      '11. Chat evidence summary exists',
      Boolean(chatSummary) &&
        Boolean(chatSummary?.workspaceRealityAuditEvidence) &&
        Boolean(chatSummary?.featureContractRealityEvidence),
      'chat evidence present',
    );

    assert(
      '12. Final matrix is complete',
      report.matrix.length === 10 && report.matrix.every((row) => row.verdict !== undefined),
      `${report.matrix.length} rows`,
    );

    assert(
      '13. Overall verdict follows strict rules',
      (report.failedProfiles > 0 && report.overallVerdict === 'NOT_UNIVERSALLY_PRODUCTION_READY') ||
        (report.failedProfiles === 0 &&
          (report.overallVerdict === 'UNIVERSAL_PRODUCTION_READY' ||
            report.overallVerdict === 'UNIVERSAL_PRODUCTION_READY_WITH_WARNINGS')),
      report.overallVerdict,
    );

    const tampered = { ...report.profileResults[0]! };
    tampered.links = { ...tampered.links, qualityScoreArtifactPath: '/missing/quality.json' };
    assert(
      '14. Missing artifact causes validation failure',
      verifyProfileArtifacts(tampered).includes('quality score'),
      verifyProfileArtifacts(tampered).join(', '),
    );

    const skipped = SUPPORTED_UNIVERSAL_PRODUCTION_PROFILES.slice(0, 9);
    assert(
      '15. Skipped profile causes validation failure',
      skipped.length < 10,
      `${skipped.length}/10 would be incomplete`,
    );

    for (const title of universalProductionProofTraceTitles()) {
      assert(
        `trace includes "${title}"`,
        buildUniversalProductionProofTraceEvents(evidence, evidence.universalProductionProofRunId).some(
          (event) => event.eventTitle === title,
        ),
        title,
      );
    }

    assert(
      'manifest records universal production proof',
      Boolean(manifest.universalProductionProofRecordedAt) &&
        Boolean(manifest.universalProductionProofArtifactPath),
      manifest.universalProductionProofStatus ?? 'missing',
    );

    assert(
      'chat summary uses proof artifact',
      report.chatSummary.includes('Universal Production Proof'),
      report.chatSummary.slice(0, 80),
    );

    assert(
      'artifact files on disk',
      existsSync(universalProductionProofPaths(testRoot).artifact) &&
        existsSync(universalProductionProofPaths(testRoot).report),
      universalProductionProofPaths(testRoot).artifact,
    );

    console.log('');
    console.log(formatUniversalProductionProofMatrix(report.matrix));
    console.log('');
    console.log(`Overall verdict: ${report.overallVerdict}`);
    console.log('');
    console.log(report.chatSummary);
    console.log('');
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  let failed = 0;
  for (const check of results) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`${icon} ${check.name}`);
    if (!check.passed) {
      failed += 1;
      console.log(`  → ${check.detail}`);
    }
  }
  console.log('');
  console.log(`${results.length - failed}/${results.length} checks passed`);
  if (failed > 0) process.exit(1);
  console.log('');
  console.log(UNIVERSAL_PRODUCTION_PROOF_V1_PASS_TOKEN);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
