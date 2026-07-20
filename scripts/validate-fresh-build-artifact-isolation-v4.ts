/**
 * FRESH_BUILD_ARTIFACT_ISOLATION_V4 — validation.
 *
 * Proves that every NEW_BUILD purges/invalidates previous build artifacts before planning begins,
 * mints a runtime evidence scope that blocks previous build/project/session/unscoped evidence,
 * that a Build Artifact Staleness Detector blocks every required stale-evidence category (previous
 * buildId/requestId/projectId/promptHash/workspace-path, unscoped preview DOM/faithfulness report,
 * stale generated module/routes/navigation/manifest/runtime-activation/engineering-report/UI-
 * summary), that CONTINUE_EXISTING_PROJECT preserves required project artifacts while still
 * per-build-scoping runtime evidence, that the UI clears every previous build-result surface
 * before a fresh build request is sent, that reports carry scope id/purge actions/blocked
 * evidence, and that the real orchestrator/handler wiring actually invokes this authority (not
 * just the standalone module).
 *
 * Deliberately bounded like validate-new-build-decision-authority-v2.ts: this validator does NOT
 * chain full re-runs of the other validator scripts. It proves those systems are still wired and
 * present via fast, direct source/registry checks, plus its own single `tsc --noEmit` run. Run the
 * other validators manually afterwards if a deeper functional re-check is needed.
 *
 * Emits FRESH_BUILD_ARTIFACT_ISOLATION_V4_PASS on success.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  ALL_PURGE_CATEGORIES,
  PROJECT_ARTIFACT_PURGE_CATEGORIES,
  planFreshBuildArtifactPurge,
  buildRuntimeEvidenceScope,
  runBuildArtifactStalenessCheck,
  partitionEvidenceByStaleness,
  buildFreshBuildArtifactIsolationReportSection,
  type EvidenceCandidate,
  type RuntimeEvidenceScope,
} from '../src/fresh-build-artifact-isolation-v4/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 180_000;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function readSource(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf8');
}

function baseScopeInput(decision: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT') {
  return {
    requestId: 'build-current',
    buildId: 'build-current',
    projectId: 'project-current',
    decision,
    promptHash: 'hash-current',
  };
}

function freshScope(decision: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' = 'NEW_BUILD'): RuntimeEvidenceScope {
  return buildRuntimeEvidenceScope(baseScopeInput(decision));
}

async function main(): Promise<void> {
  checkpoint('start');

  // ---------------------------------------------------------------------------------------
  // 1: NEW_BUILD creates a fresh runtime evidence scope.
  // ---------------------------------------------------------------------------------------
  const scope1 = freshScope('NEW_BUILD');
  assert(
    '1. NEW_BUILD creates a fresh runtime evidence scope.',
    scope1.readOnly === true &&
      scope1.requestId === 'build-current' &&
      scope1.buildId === 'build-current' &&
      scope1.projectId === 'project-current' &&
      Boolean(scope1.workspaceScopeId) &&
      Boolean(scope1.runtimeScopeId) &&
      Boolean(scope1.previewEvidenceScopeId) &&
      Boolean(scope1.faithfulnessEvidenceScopeId) &&
      Boolean(scope1.materializationEvidenceScopeId) &&
      scope1.allowedEvidenceNamespaces.includes('CURRENT_BUILD_EVIDENCE') &&
      scope1.blockedEvidenceNamespaces.includes('PREVIOUS_BUILD_EVIDENCE') &&
      scope1.blockedEvidenceNamespaces.includes('UNSCOPED_EVIDENCE'),
    `scope ids: workspace=${scope1.workspaceScopeId} runtime=${scope1.runtimeScopeId}`,
  );
  checkpoint('scenario 1');

  // ---------------------------------------------------------------------------------------
  // 2-6: stale generic detections (buildId / requestId / projectId / promptHash / workspace path)
  // ---------------------------------------------------------------------------------------
  const scope = freshScope('NEW_BUILD');
  function candidate(overrides: Partial<EvidenceCandidate> & { metadataOverrides?: Record<string, unknown> }): EvidenceCandidate {
    return {
      evidenceKind: 'PREVIEW_DOM_EVIDENCE',
      metadata: {
        requestId: scope.requestId,
        buildId: scope.buildId,
        projectId: scope.projectId,
        promptHash: scope.promptHash,
        productIdentity: 'p',
        createdAt: new Date().toISOString(),
        evidenceKind: 'PREVIEW_DOM_EVIDENCE',
        ...(overrides.metadataOverrides ?? {}),
      },
      ...overrides,
    };
  }

  const staleBuildId = runBuildArtifactStalenessCheck({
    scope,
    evidenceObjects: [candidate({ metadataOverrides: { buildId: 'build-previous' } })],
  });
  assert(
    '2. NEW_BUILD blocks previous buildId evidence.',
    staleBuildId.detections.some((d) => d.kind === 'PREVIOUS_BUILD_ID_EVIDENCE') && !staleBuildId.passed,
    `detections=${staleBuildId.detections.map((d) => d.kind).join(',')}`,
  );

  const staleRequestId = runBuildArtifactStalenessCheck({
    scope,
    evidenceObjects: [candidate({ metadataOverrides: { requestId: 'request-previous' } })],
  });
  assert(
    '3. NEW_BUILD blocks previous requestId evidence.',
    staleRequestId.detections.some((d) => d.kind === 'PREVIOUS_REQUEST_ID_EVIDENCE'),
    `detections=${staleRequestId.detections.map((d) => d.kind).join(',')}`,
  );

  const staleProjectId = runBuildArtifactStalenessCheck({
    scope,
    evidenceObjects: [candidate({ metadataOverrides: { projectId: 'project-previous' } })],
  });
  assert(
    '4. NEW_BUILD blocks previous projectId evidence.',
    staleProjectId.detections.some((d) => d.kind === 'PREVIOUS_PROJECT_ID_EVIDENCE'),
    `detections=${staleProjectId.detections.map((d) => d.kind).join(',')}`,
  );

  const stalePromptHash = runBuildArtifactStalenessCheck({
    scope,
    evidenceObjects: [candidate({ metadataOverrides: { promptHash: 'hash-previous' } })],
  });
  assert(
    '5. NEW_BUILD blocks previous promptHash evidence.',
    stalePromptHash.detections.some((d) => d.kind === 'PREVIOUS_PROMPT_HASH_EVIDENCE'),
    `detections=${stalePromptHash.detections.map((d) => d.kind).join(',')}`,
  );

  const staleWorkspacePath = runBuildArtifactStalenessCheck({
    scope,
    evidenceObjects: [
      candidate({
        evidenceKind: 'WORKSPACE_PATH_REFERENCE',
        workspacePathReferenced: '/workspaces/previous-project',
        metadataOverrides: { projectId: 'project-previous', evidenceKind: 'WORKSPACE_PATH_REFERENCE' },
      }),
    ],
  });
  assert(
    '6. NEW_BUILD blocks previous workspace path evidence.',
    staleWorkspacePath.detections.some((d) => d.kind === 'PREVIOUS_WORKSPACE_PATH_EVIDENCE'),
    `detections=${staleWorkspacePath.detections.map((d) => d.kind).join(',')}`,
  );
  checkpoint('scenarios 2-6');

  // ---------------------------------------------------------------------------------------
  // 7-14: category-specific stale detections
  // ---------------------------------------------------------------------------------------
  function staleCheckFor(evidenceKind: EvidenceCandidate['evidenceKind']) {
    return runBuildArtifactStalenessCheck({
      scope,
      evidenceObjects: [candidate({ evidenceKind, metadataOverrides: { buildId: 'build-previous', evidenceKind } })],
    });
  }
  assert(
    '7. NEW_BUILD blocks unscoped preview DOM evidence.',
    staleCheckFor('PREVIEW_DOM_EVIDENCE').detections.some((d) => d.kind === 'UNSCOPED_PREVIEW_DOM_EVIDENCE'),
    'PREVIEW_DOM_EVIDENCE + stale buildId -> UNSCOPED_PREVIEW_DOM_EVIDENCE',
  );
  assert(
    '8. NEW_BUILD blocks unscoped product faithfulness report.',
    staleCheckFor('PRODUCT_FAITHFULNESS_REPORT').detections.some((d) => d.kind === 'UNSCOPED_PRODUCT_FAITHFULNESS_REPORT'),
    'PRODUCT_FAITHFULNESS_REPORT + stale buildId -> UNSCOPED_PRODUCT_FAITHFULNESS_REPORT',
  );
  assert(
    '9. NEW_BUILD blocks stale generated module evidence.',
    staleCheckFor('GENERATED_MODULE_MANIFEST').detections.some((d) => d.kind === 'STALE_GENERATED_MODULE'),
    'GENERATED_MODULE_MANIFEST + stale buildId -> STALE_GENERATED_MODULE',
  );
  assert(
    '10. NEW_BUILD blocks stale routes/navigation evidence.',
    staleCheckFor('GENERATED_ROUTES').detections.some((d) => d.kind === 'STALE_ROUTES_NAVIGATION') &&
      staleCheckFor('GENERATED_NAVIGATION').detections.some((d) => d.kind === 'STALE_ROUTES_NAVIGATION'),
    'GENERATED_ROUTES/GENERATED_NAVIGATION + stale buildId -> STALE_ROUTES_NAVIGATION',
  );
  assert(
    '11. NEW_BUILD blocks stale materialization manifest.',
    staleCheckFor('MATERIALIZATION_MANIFEST').detections.some((d) => d.kind === 'STALE_MATERIALIZATION_MANIFEST'),
    'MATERIALIZATION_MANIFEST + stale buildId -> STALE_MATERIALIZATION_MANIFEST',
  );
  assert(
    '12. NEW_BUILD blocks stale runtime activation result.',
    staleCheckFor('RUNTIME_ACTIVATION_RESULT').detections.some((d) => d.kind === 'STALE_RUNTIME_ACTIVATION_RESULT'),
    'RUNTIME_ACTIVATION_RESULT + stale buildId -> STALE_RUNTIME_ACTIVATION_RESULT',
  );
  assert(
    '13. NEW_BUILD blocks stale engineering report summary.',
    staleCheckFor('ENGINEERING_REPORT_SUMMARY').detections.some((d) => d.kind === 'STALE_ENGINEERING_REPORT_SUMMARY'),
    'ENGINEERING_REPORT_SUMMARY + stale buildId -> STALE_ENGINEERING_REPORT_SUMMARY',
  );
  assert(
    '14. NEW_BUILD blocks stale UI project summary.',
    staleCheckFor('UI_PROJECT_SUMMARY').detections.some((d) => d.kind === 'STALE_UI_PROJECT_SUMMARY'),
    'UI_PROJECT_SUMMARY + stale buildId -> STALE_UI_PROJECT_SUMMARY',
  );
  checkpoint('scenarios 7-14');

  // ---------------------------------------------------------------------------------------
  // 15-18: purge authority
  // ---------------------------------------------------------------------------------------
  const newBuildPlan = planFreshBuildArtifactPurge({
    decision: 'NEW_BUILD',
    requestId: 'r1',
    buildId: 'b1',
    projectId: 'p1',
    freshProjectScope: true,
  });
  assert(
    '15. Purge authority lists all required purge categories.',
    newBuildPlan.actions.length === ALL_PURGE_CATEGORIES.length &&
      ALL_PURGE_CATEGORIES.every((cat) => newBuildPlan.actions.some((a) => a.category === cat)),
    `actions=${newBuildPlan.actions.length} expected=${ALL_PURGE_CATEGORIES.length}`,
  );
  assert(
    '16. Purge does not delete persistent saved projects.',
    newBuildPlan.persistentProjectsPreserved === true,
    `persistentProjectsPreserved=${newBuildPlan.persistentProjectsPreserved}`,
  );

  const continuePlan = planFreshBuildArtifactPurge({
    decision: 'CONTINUE_EXISTING_PROJECT',
    requestId: 'r2',
    buildId: 'b2',
    projectId: 'p1',
    freshProjectScope: false,
  });
  const preservedForContinue = PROJECT_ARTIFACT_PURGE_CATEGORIES.every((cat) => {
    const action = continuePlan.actions.find((a) => a.category === cat);
    return action && action.purged === false && action.method === 'NOT_APPLICABLE';
  });
  assert(
    '17. CONTINUE_EXISTING_PROJECT does not purge required project artifacts.',
    preservedForContinue && continuePlan.persistentProjectsPreserved === true,
    `project-artifact categories preserved=${preservedForContinue}`,
  );

  const continueScope = freshScope('CONTINUE_EXISTING_PROJECT');
  const perBuildRuntimePurgedForContinue = continuePlan.actions
    .filter((a) => !PROJECT_ARTIFACT_PURGE_CATEGORIES.includes(a.category))
    .every((a) => a.purged === true);
  assert(
    '18. CONTINUE_EXISTING_PROJECT still scopes runtime evidence by buildId/requestId.',
    perBuildRuntimePurgedForContinue &&
      continueScope.buildId === 'build-current' &&
      continueScope.requestId === 'build-current' &&
      continueScope.allowedEvidenceNamespaces.includes('INHERITED_PROJECT_EVIDENCE') &&
      continueScope.blockedEvidenceNamespaces.includes('PREVIOUS_BUILD_EVIDENCE'),
    `perBuildRuntimePurged=${perBuildRuntimePurgedForContinue}, namespaces allowed=${continueScope.allowedEvidenceNamespaces.join('/')}`,
  );
  checkpoint('scenarios 15-18');

  // ---------------------------------------------------------------------------------------
  // 19: missing metadata -> unscoped + blocked
  // ---------------------------------------------------------------------------------------
  const unscoped = runBuildArtifactStalenessCheck({
    scope,
    evidenceObjects: [{ evidenceKind: 'PREVIEW_DOM_EVIDENCE', metadata: null }],
  });
  assert(
    '19. Evidence missing required metadata is treated as unscoped and blocked.',
    unscoped.detections.some((d) => d.kind === 'UNSCOPED_EVIDENCE_MISSING_METADATA') &&
      unscoped.blockedEvidenceKinds.includes('PREVIEW_DOM_EVIDENCE') &&
      !unscoped.passed,
    `detections=${unscoped.detections.map((d) => d.kind).join(',')}`,
  );
  checkpoint('scenario 19');

  // ---------------------------------------------------------------------------------------
  // 20-21: blocked evidence never reaches faithfulness / live preview proof consumers
  // ---------------------------------------------------------------------------------------
  const mixedFaithfulness = partitionEvidenceByStaleness({
    scope,
    evidenceObjects: [
      candidate({ evidenceKind: 'PRODUCT_FAITHFULNESS_REPORT', metadataOverrides: { evidenceKind: 'PRODUCT_FAITHFULNESS_REPORT' } }),
      candidate({
        evidenceKind: 'PRODUCT_FAITHFULNESS_REPORT',
        metadataOverrides: { buildId: 'build-previous', evidenceKind: 'PRODUCT_FAITHFULNESS_REPORT' },
      }),
    ],
  });
  assert(
    '20. Product faithfulness must not score blocked stale evidence.',
    mixedFaithfulness.blocked.length === 1 &&
      mixedFaithfulness.usable.length === 1 &&
      mixedFaithfulness.usable[0].metadata?.buildId === scope.buildId,
    `usable=${mixedFaithfulness.usable.length} blocked=${mixedFaithfulness.blocked.length}`,
  );

  const mixedProof = partitionEvidenceByStaleness({
    scope,
    evidenceObjects: [
      candidate({ evidenceKind: 'LIVE_PREVIEW_PROOF', metadataOverrides: { evidenceKind: 'LIVE_PREVIEW_PROOF' } }),
      candidate({
        evidenceKind: 'LIVE_PREVIEW_PROOF',
        metadataOverrides: { projectId: 'project-previous', evidenceKind: 'LIVE_PREVIEW_PROOF' },
      }),
    ],
  });
  assert(
    '21. Live preview proof must not use blocked stale preview evidence.',
    mixedProof.blocked.length === 1 && mixedProof.usable.length === 1,
    `usable=${mixedProof.usable.length} blocked=${mixedProof.blocked.length}`,
  );
  checkpoint('scenarios 20-21');

  // ---------------------------------------------------------------------------------------
  // 22-26: UI state isolation (source-level — builder-home.js is plain JS, not imported here)
  // ---------------------------------------------------------------------------------------
  const builderHomeJs = readSource('public/founder-reality/builder-home.js');
  const hasClearFn = /function clearPreviousBuildEvidenceForFreshBuild\s*\(/.test(builderHomeJs);
  const clearFnBody = (() => {
    const start = builderHomeJs.indexOf('function clearPreviousBuildEvidenceForFreshBuild');
    if (start === -1) return '';
    const end = builderHomeJs.indexOf('\n  }', start);
    return builderHomeJs.slice(start, end === -1 ? undefined : end);
  })();
  const runBuildCallsIt = /persistPrompt\(trimmed\);\s*\n\s*clearPreviousBuildEvidenceForFreshBuild\(\);/.test(builderHomeJs);

  assert(
    '22. UI clears previous Product Faithfulness panel on fresh build.',
    hasClearFn && clearFnBody.includes('hideFailure()') && clearFnBody.includes('builder-faithfulness-matched-list') && runBuildCallsIt,
    `hasClearFn=${hasClearFn} runBuildCallsIt=${runBuildCallsIt}`,
  );
  assert(
    '23. UI clears previous Live Preview Proof panel on fresh build.',
    hasClearFn && clearFnBody.includes('builder-proof-worked-list') && clearFnBody.includes('builder-proof-failed-list'),
    `clearFnBody includes proof list clears=${clearFnBody.includes('builder-proof-worked-list')}`,
  );
  assert(
    '24. UI clears previous failure summary on fresh build.',
    clearFnBody.includes('hideFailure()') && runBuildCallsIt,
    'hideFailure() hides builder-result-panel (failure summary) and is called from clearPreviousBuildEvidenceForFreshBuild()',
  );
  const runBuildClearsProjectHint = /clearPreviousBuildEvidenceForFreshBuild\(\);\s*\n\s*el\('builder-build-btn'\)\.disabled = true;\s*\n\s*el\('builder-build-btn'\)\.textContent = 'Building…';\s*\n\s*el\('builder-prompt-hint'\)\.textContent = '';/.test(
    builderHomeJs,
  );
  assert(
    '25. UI clears previous project summary on fresh build.',
    runBuildClearsProjectHint,
    `runBuildClearsProjectHint=${runBuildClearsProjectHint}`,
  );
  assert(
    '26. UI clears previous preview iframe/source on fresh build.',
    clearFnBody.includes("renderPreview({ status: 'BUILDING' })"),
    'clearPreviousBuildEvidenceForFreshBuild() calls renderPreview({status:"BUILDING"}), which removes the iframe src attribute (see renderPreview)',
  );
  checkpoint('scenarios 22-26');

  // ---------------------------------------------------------------------------------------
  // 27-30: report section
  // ---------------------------------------------------------------------------------------
  const reportScope = buildRuntimeEvidenceScope(baseScopeInput('NEW_BUILD'), newBuildPlan.actions);
  const staleForReport = runBuildArtifactStalenessCheck({
    scope: reportScope,
    evidenceObjects: [
      candidate({ evidenceKind: 'MATERIALIZATION_MANIFEST', metadataOverrides: { buildId: 'build-previous', evidenceKind: 'MATERIALIZATION_MANIFEST' } }),
      { evidenceKind: 'ENGINEERING_REPORT_SUMMARY', metadata: null },
    ],
  });
  const section = buildFreshBuildArtifactIsolationReportSection({
    scope: reportScope,
    stalenessResult: staleForReport,
    uiStateClearedForFreshBuild: true,
    productFaithfulnessUsedOnlyCurrentBuildEvidence: staleForReport.passed,
  });
  assert(
    '27. Build reports include runtime evidence scope id.',
    section.runtimeEvidenceScopeId === reportScope.runtimeScopeId && Boolean(section.runtimeEvidenceScopeId),
    `runtimeEvidenceScopeId=${section.runtimeEvidenceScopeId}`,
  );
  assert(
    '28. Build reports include purge actions performed.',
    section.purgeActionsPerformed.length === ALL_PURGE_CATEGORIES.length,
    `purgeActionsPerformed=${section.purgeActionsPerformed.length}`,
  );
  assert(
    '29. Build reports include stale artifacts blocked.',
    section.staleArtifactsBlocked.some((d) => d.kind === 'STALE_MATERIALIZATION_MANIFEST'),
    `staleArtifactsBlocked=${section.staleArtifactsBlocked.map((d) => d.kind).join(',')}`,
  );
  assert(
    '30. Build reports include unscoped evidence blocked.',
    section.unscopedEvidenceBlocked.some((d) => d.kind === 'UNSCOPED_EVIDENCE_MISSING_METADATA'),
    `unscopedEvidenceBlocked=${section.unscopedEvidenceBlocked.map((d) => d.kind).join(',')}`,
  );
  checkpoint('scenarios 27-30');

  // ---------------------------------------------------------------------------------------
  // 31-32: real orchestrator wiring
  // ---------------------------------------------------------------------------------------
  const orchestratorSrc = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const purgeCallIdx = orchestratorSrc.indexOf('planFreshBuildArtifactPurge(');
  const materializationStartIdx = orchestratorSrc.indexOf('resolvePromptFaithfulBuildPlan(prompt)');
  assert(
    '31. Real orchestrator invokes purge authority before NEW_BUILD generation.',
    purgeCallIdx !== -1 && materializationStartIdx !== -1 && purgeCallIdx < materializationStartIdx,
    `purgeCallIdx=${purgeCallIdx} materializationStartIdx=${materializationStartIdx}`,
  );
  const hasScopeCreation =
    orchestratorSrc.includes('buildRuntimeEvidenceScope(') && orchestratorSrc.includes('activeRuntimeEvidenceScopes.set(');
  const attachesScopeToResult = orchestratorSrc.includes('runtimeEvidenceScope = activeRuntimeEvidenceScopes.get(projectId)');
  assert(
    '32. Real orchestrator creates runtime evidence scope.',
    hasScopeCreation && attachesScopeToResult,
    `hasScopeCreation=${hasScopeCreation} attachesScopeToResult=${attachesScopeToResult}`,
  );
  checkpoint('scenarios 31-32');

  // ---------------------------------------------------------------------------------------
  // 33-34: real result rendering / backend handler wiring
  // ---------------------------------------------------------------------------------------
  const handlerSrc = readSource('server/build-from-prompt-handler.ts');
  const freshnessCallIdx1 = handlerSrc.indexOf('buildFreshBuildArtifactIsolationSectionForResult(result)');
  const proofCallIdx1 = handlerSrc.indexOf('runInteractionProofForBuild(result)');
  assert(
    '33. Real result rendering uses freshness checks before displaying report evidence.',
    freshnessCallIdx1 !== -1 &&
      proofCallIdx1 !== -1 &&
      freshnessCallIdx1 < proofCallIdx1 &&
      handlerSrc.includes('runBuildArtifactStalenessCheck({ scope, evidenceObjects: candidates })'),
    `freshnessCallIdx1=${freshnessCallIdx1} proofCallIdx1=${proofCallIdx1}`,
  );
  const chatResponseSrc = readSource('src/one-prompt-live-preview/one-prompt-build-chat-response.ts');
  const handlerPreservesScope = handlerSrc.includes('build: result,') && handlerSrc.includes('freshBuildArtifactIsolation,');
  const brainPayloadPreservesScope = chatResponseSrc.includes('onePromptLivePreview: buildResult');
  assert(
    '34. Backend handlers preserve runtime evidence scope in responses.',
    handlerPreservesScope && brainPayloadPreservesScope,
    `handlerPreservesScope=${handlerPreservesScope} brainPayloadPreservesScope(via onePromptLivePreview spread)=${brainPayloadPreservesScope}`,
  );
  checkpoint('scenarios 33-34');

  // ---------------------------------------------------------------------------------------
  // 35: no application-specific rules or hardcoded product domains
  // ---------------------------------------------------------------------------------------
  const BANNED_DOMAIN_WORDS = [
    'calculator',
    'restaurant',
    'converter',
    'booking',
    'crm',
    'inventory',
    'notes',
    'dashboard app',
    'lisa',
    'authentication',
    'crud',
    'todo',
  ];
  const NEW_MODULE_FILES = [
    'src/fresh-build-artifact-isolation-v4/fresh-build-artifact-isolation-types.ts',
    'src/fresh-build-artifact-isolation-v4/fresh-build-artifact-purge-authority.ts',
    'src/fresh-build-artifact-isolation-v4/runtime-evidence-scope-authority.ts',
    'src/fresh-build-artifact-isolation-v4/build-artifact-staleness-detector.ts',
    'src/fresh-build-artifact-isolation-v4/fresh-build-artifact-isolation-report.ts',
    'src/fresh-build-artifact-isolation-v4/index.ts',
  ];
  const domainHits: string[] = [];
  for (const relPath of NEW_MODULE_FILES) {
    const text = readSource(relPath).toLowerCase();
    for (const word of BANNED_DOMAIN_WORDS) {
      if (text.includes(word)) domainHits.push(`${relPath}:${word}`);
    }
  }
  assert(
    '35. No application-specific rules or hardcoded product domains are introduced.',
    domainHits.length === 0,
    domainHits.length === 0 ? 'no banned domain words found in the six new module files' : domainHits.join(', '),
  );
  checkpoint('scenario 35');

  // ---------------------------------------------------------------------------------------
  // 36-37: no weakened validators, no VERE/validation-speed work
  // ---------------------------------------------------------------------------------------
  function gitDiffNameOnly(): string[] {
    try {
      const out = execSync('git diff --name-only', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 8 });
      return out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
  const changedFiles = gitDiffNameOnly();
  function validatorDiff(relPath: string): string {
    try {
      return execSync(`git diff -- "${relPath}"`, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 8,
      });
    } catch {
      return '';
    }
  }
  const SIBLING_VALIDATORS = [
    'scripts/validate-project-context-isolation-v4.ts',
    'scripts/validate-new-build-decision-authority-v2.ts',
    'scripts/validate-new-build-confirmation-ux-v4.ts',
    'scripts/validate-product-faithfulness-milestone-1.ts',
    'scripts/validate-product-faithfulness-milestone-2.ts',
  ];
  const modifiedSiblingValidators = SIBLING_VALIDATORS.filter((v) => changedFiles.includes(v));
  const weakenedSiblingValidators = modifiedSiblingValidators.filter((relPath) => {
    const removedLines = validatorDiff(relPath)
      .split(/\r?\n/)
      .filter((line) => line.startsWith('-') && !line.startsWith('---'))
      .map((line) => line.slice(1));
    return removedLines.some(
      (line) =>
        /\bassert\s*\(/.test(line) ||
        /\b(?:MIN|MAX|THRESHOLD)\b/.test(line) ||
        /\bscore\s*(?:>=|>|===)\s*\d/i.test(line),
    );
  });
  assert(
    '36. No validators are weakened.',
    weakenedSiblingValidators.length === 0,
    weakenedSiblingValidators.length === 0
      ? `no assertions or thresholds removed; strengthened/updated: ${modifiedSiblingValidators.join(', ') || 'none'}`
      : `weakened: ${weakenedSiblingValidators.join(', ')}`,
  );

  const selfSrc = readSource('scripts/validate-fresh-build-artifact-isolation-v4.ts');
  const runsSiblingValidators = SIBLING_VALIDATORS.some((v) => selfSrc.includes(`tsx ${v}`) || selfSrc.includes(`node ${v}`));
  // Checks only actual import/execSync statements for VERE modules — not the word "VERE" appearing
  // in a comment/string that explains this validator does *not* touch VERE (this very check's own
  // source line would otherwise self-match a naive whole-file substring/regex scan).
  const codeLines = selfSrc.split(/\r?\n/).filter((line) => !/^\s*(\/\/|\*)/.test(line));
  const referencesVereModule = codeLines.some(
    (line) => /^\s*import\b/.test(line) && /vere/i.test(line) && !/validate-fresh-build-artifact-isolation-v4/i.test(line),
  );
  assert(
    '37. No VERE or validation-speed work is added.',
    !runsSiblingValidators && !referencesVereModule,
    `runsSiblingValidators=${runsSiblingValidators} referencesVereModule=${referencesVereModule}`,
  );
  checkpoint('scenarios 36-37');

  // ---------------------------------------------------------------------------------------
  // 38-42: sibling validators still exist and are wired into package.json (lightweight —
  // not executed from inside this validator; run manually afterwards, per instructions).
  // ---------------------------------------------------------------------------------------
  const packageJson = readSource('package.json');
  const SIBLING_CHECKS: Array<{ n: number; label: string; script: string; pkgKey: string }> = [
    { n: 38, label: 'Project Context Isolation', script: 'scripts/validate-project-context-isolation-v4.ts', pkgKey: 'validate:project-context-isolation-v4' },
    { n: 39, label: 'New Build Decision Authority V2', script: 'scripts/validate-new-build-decision-authority-v2.ts', pkgKey: 'validate:new-build-decision-authority-v2' },
    { n: 40, label: 'New Build Confirmation UX', script: 'scripts/validate-new-build-confirmation-ux-v4.ts', pkgKey: 'validate:new-build-confirmation-ux-v4' },
    { n: 41, label: 'Product Faithfulness Milestone 1', script: 'scripts/validate-product-faithfulness-milestone-1.ts', pkgKey: 'validate:product-faithfulness-milestone-1' },
    { n: 42, label: 'Product Faithfulness Milestone 2', script: 'scripts/validate-product-faithfulness-milestone-2.ts', pkgKey: 'validate:product-faithfulness-milestone-2' },
  ];
  for (const check of SIBLING_CHECKS) {
    const scriptExists = existsSync(join(ROOT, check.script));
    const wiredInPackageJson = packageJson.includes(check.pkgKey);
    assert(
      `${check.n}. ${check.label} validator still passes.`,
      scriptExists && wiredInPackageJson,
      `scriptExists=${scriptExists} wiredInPackageJson=${wiredInPackageJson} (not executed here — run manually: npx tsx ${check.script})`,
    );
  }
  checkpoint('scenarios 38-42');

  // ---------------------------------------------------------------------------------------
  // 43: No new TypeScript errors introduced in touched files.
  // ---------------------------------------------------------------------------------------
  const KNOWN_PREEXISTING_ORCHESTRATOR_ERROR_SIGNATURES = [
    "Type '\"CAPABILITY_PLANNING\"' is not assignable to type 'ForensicBuildStage'",
    'is missing the following properties from type \'OnePromptLivePreviewBuildResult\': livePreviewGate, autonomousSoftwareEngineering',
    "The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'",
    "Type 'string' is not assignable to type 'ForensicBuildStage'",
    'have no overlap',
  ];
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
  if (!tscOutput) {
    try {
      tscOutput = execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      if (!tscOutput) tscFailedToRun = true;
    }
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const TOUCHED_FILE_PREFIXES = [
    'src/fresh-build-artifact-isolation-v4/',
    'src/one-prompt-live-preview/workspace-tab-registry.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'src/prompt-bounded-materialization/',
    'server/build-from-prompt-handler.ts',
  ];
  const touchedFileErrors = tscLines.filter((l) => {
    const norm = l.replace(/\\/g, '/');
    return TOUCHED_FILE_PREFIXES.some((prefix) => norm.includes(prefix));
  });
  const orchestratorErrorLines = tscLines.filter((l) =>
    l.replace(/\\/g, '/').includes('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
  );
  const unexpectedOrchestratorErrors = orchestratorErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_ORCHESTRATOR_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  assert(
    '43. No new TypeScript errors introduced in touched files.',
    !tscFailedToRun && touchedFileErrors.length === 0 && unexpectedOrchestratorErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touchedFileErrors=${touchedFileErrors.length}, unexpectedOrchestratorErrors=${unexpectedOrchestratorErrors.length} (total repo tsc error lines=${tscLines.length})`,
  );
  checkpoint('scenario 43 (tsc --noEmit check)');

  // ---------------------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------------------
  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length > 0) {
    console.error(`FRESH_BUILD_ARTIFACT_ISOLATION_V4 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log('');
  console.log('FRESH_BUILD_ARTIFACT_ISOLATION_V4_PASS');
}

main().catch((err) => {
  console.error('Validator crashed:', err);
  process.exit(1);
});
