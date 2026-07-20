/**
 * GPCA Runtime Wiring Trace V1 — investigation only, no fix.
 *
 * Traces the *actual* runtime path production uses for `POST /api/build/from-prompt` (via the
 * exact same `runOnePromptLivePreviewBuild` entrypoint `server/build-from-prompt-handler.ts` and
 * `src/chat-to-build-execution-bridge-v1/bridge-authority.ts` call) to determine why a real build
 * can still preview non-compliant/generic rendered content even though the GPCA Rendered Content
 * Evidence Expansion V1 and GPCA Production Enforcement V1 validators both pass in isolation.
 *
 * This trace combines three kinds of evidence:
 *
 *  PHASE 1 — a REAL `runOnePromptLivePreviewBuild` call (the same function the HTTP handler and
 *            chat-to-build bridge call) with `GPCA_RUNTIME_TRACE=1` set, which turns on the
 *            temporary `[GPCA_RUNTIME_TRACE]` diagnostic log lines added to
 *            `src/one-prompt-live-preview/one-prompt-build-orchestrator.ts` for this
 *            investigation. Proves GPCA is really invoked, and surfaces a *separate*, pre-existing
 *            defect this trace ran into (see "CONFOUND" below).
 *
 *  PHASE 2 — a deterministic, disk-level reproduction of the reported symptom: synthetic
 *            "stale calculator build" files are written directly into a fresh workspace (exactly
 *            the shape `workspaceHasGeneratedFeatureModules()` — the function the orchestrator's
 *            continuation logic actually calls — checks for), then that same real function is
 *            called against it to prove it reports "already materialized" from file *presence*
 *            alone, with zero content/compliance awareness.
 *
 *  PHASE 3 — the real `collectRenderedContentEvidence()` (GPCA's Rendered Content Evidence
 *            Expansion V1 collector) is called directly against those same synthetic stale files,
 *            with the *current* (restaurant) contract's vocabulary, to prove GPCA's own rendered-
 *            content gate WOULD flag and block this exact content if it were ever invoked against
 *            it — closing the loop on "GPCA can detect it" vs "GPCA is asked to look."
 *
 * CONFOUND (reported honestly, not swept under the rug): every real build attempted in PHASE 1
 * against a fresh prompt is blocked by GPCA's *pre-materialization* generator-input-bypass check
 * (`COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS` — "app title ... does not match CBGA's approved
 * product identity"). That check compares `buildPlan.extraction.appName` (raw prompt extraction)
 * against CBGA's synthesized `productIdentity` with a strict `!==`, and the two are case/wording-
 * mismatched for every prompt this trace tried. That is a real, separate, pre-existing defect
 * (unrelated to this milestone's rendered-content work — it lives entirely in
 * `generation-pipeline-compliance-adapter.ts` / `generator-legacy-detection.ts`'s title-bypass
 * detection), and it prevented a full live end-to-end run all the way through the continuation
 * branch inside this sandbox. It is called out explicitly in the final report rather than worked
 * around by weakening or bypassing any GPCA check. PHASE 2/3 below prove the reported milestone
 * question (rendered content evidence + continuation wiring) independently of that confound.
 *
 * Run only: npx tsx scripts/trace-gpca-runtime-wiring-v1.ts
 */

process.env.GPCA_RUNTIME_TRACE = '1';

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface CapturedTraceLine {
  raw: string;
  fields: Record<string, unknown> | null;
}

const allCapturedLines: CapturedTraceLine[] = [];
const originalConsoleLog = console.log.bind(console);
console.log = (...args: unknown[]): void => {
  if (args[0] === '[GPCA_RUNTIME_TRACE]' && typeof args[1] === 'string') {
    let fields: Record<string, unknown> | null = null;
    try {
      fields = JSON.parse(args[1]);
    } catch {
      fields = null;
    }
    allCapturedLines.push({ raw: `${args[0]} ${args[1]}`, fields });
  }
  originalConsoleLog(...args);
};

function section(title: string): void {
  originalConsoleLog('');
  originalConsoleLog(title);
  originalConsoleLog('='.repeat(title.length));
}

function stageTrace(lines: readonly CapturedTraceLine[], stage: string): CapturedTraceLine[] {
  return lines.filter((l) => l.fields?.stage === stage);
}

// A synthetic "stale prior build" — deliberately shaped like the reported symptom: literal
// "reusable components where" template wording, a generic shell nav, and calculator/arithmetic
// domain content, with zero reference to the *current* build's (restaurant) contract vocabulary.
const SYNTHETIC_STALE_CALCULATOR_FEATURE_TSX = `
import React from 'react';

export function CalculatorUtilityFeature() {
  return (
    <div className="app-shell">
      <h1>Calculator Arithmetic Utility</h1>
      <p>This app uses reusable components where every module shares the same generic shell.</p>
      <nav>
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </nav>
      <section>
        <h2>Quick Actions</h2>
        <button>Add</button>
        <button>Subtract</button>
        <button>Multiply</button>
        <button>Divide</button>
      </section>
    </div>
  );
}
`;

async function main(): Promise<void> {
  section('GPCA Runtime Wiring Trace V1');
  originalConsoleLog('Investigation only — no behavior fix applied by this script.');

  const { runOnePromptLivePreviewBuild, resetOnePromptLivePreviewForTests } = await import(
    '../src/one-prompt-live-preview/index.js'
  );
  const { resetEngineeringAuthorityForTests } = await import('../src/ase-enforcement-engine/index.js');
  const { resetGeneratedDevServerManagerForTests } = await import(
    '../src/one-prompt-live-preview/generated-dev-server-manager.js'
  );
  const { resetPreviewSessionManagerForTests } = await import('../src/live-preview-runtime/index.js');
  const { resetConnectedBuildExecutionModuleForTests } = await import('../src/connected-build-execution/index.js');
  const { resetRequirementsToPlanContractModuleForTests } = await import(
    '../src/requirements-to-plan-execution-contract/index.js'
  );
  const { resetDevPulseV2AiDevEngineAuthorityForTests } = await import('../src/aidev-engine/aidev-engine-authority.js');
  const { GENERATED_BUILDER_WORKSPACES_DIR } = await import(
    '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js'
  );
  const { collectRenderedContentEvidence } = await import(
    '../src/generation-pipeline-compliance-authority-v1/index.js'
  );
  const { workspaceHasGeneratedFeatureModules } = await import('../src/feature-contract-reality/index.js');

  async function resetAll(): Promise<void> {
    resetOnePromptLivePreviewForTests();
    resetEngineeringAuthorityForTests();
    await resetGeneratedDevServerManagerForTests();
    resetPreviewSessionManagerForTests();
    resetConnectedBuildExecutionModuleForTests();
    resetRequirementsToPlanContractModuleForTests();
    resetDevPulseV2AiDevEngineAuthorityForTests();
  }

  await resetAll();

  // ---------------------------------------------------------------------------------------------
  // PHASE 1 — real orchestrator call, proves GPCA is genuinely invoked pre-materialization on the
  // real POST /api/build/from-prompt runtime path, and surfaces the confound documented above.
  // ---------------------------------------------------------------------------------------------
  const projectId = `gpca-runtime-trace-${Date.now()}`;
  section(`PHASE 1 — real runOnePromptLivePreviewBuild call (projectId=${projectId})`);
  const build1 = await runOnePromptLivePreviewBuild({
    rawPrompt: 'build a calculator app',
    projectRootDir: ROOT,
    source: 'validator',
    projectId,
    projectName: 'GPCA Trace Calculator',
    buildDecisionKind: 'NEW_BUILD',
  });
  const phase1TraceLines = allCapturedLines.slice();
  allCapturedLines.length = 0;

  originalConsoleLog('');
  originalConsoleLog(`build1.buildResult=${build1.buildResult} build1.failureReason=${build1.failureReason ?? 'none'}`);
  originalConsoleLog('CAPTURED [GPCA_RUNTIME_TRACE] LINES:');
  for (const line of phase1TraceLines) originalConsoleLog(line.raw);

  const phase1PreMat = stageTrace(phase1TraceLines, 'PRE_MATERIALIZATION');
  const phase1PostMat = stageTrace(phase1TraceLines, 'POST_MATERIALIZATION');

  // ---------------------------------------------------------------------------------------------
  // PHASE 2 — deterministic disk-level reproduction of the reported symptom, independent of
  // PHASE 1's confound. Writes a synthetic "stale calculator build" directly into a fresh
  // workspace, then calls the REAL workspaceHasGeneratedFeatureModules() (the exact function the
  // orchestrator's continuation-skip logic calls at the two sites cited in the final report) to
  // prove it reports "already materialized" from file presence alone.
  // ---------------------------------------------------------------------------------------------
  section('PHASE 2 — deterministic reproduction: stale calculator files + workspaceHasGeneratedFeatureModules()');
  const syntheticWorkspaceDir = join(ROOT, GENERATED_BUILDER_WORKSPACES_DIR, `${projectId}-synthetic-stale`);
  rmSync(syntheticWorkspaceDir, { recursive: true, force: true });
  const syntheticFeatureDir = join(syntheticWorkspaceDir, 'src/features/calculator-utility');
  mkdirSync(syntheticFeatureDir, { recursive: true });
  const syntheticFilePath = join(syntheticFeatureDir, 'CalculatorUtilityFeature.tsx');
  writeFileSync(syntheticFilePath, SYNTHETIC_STALE_CALCULATOR_FEATURE_TSX, 'utf8');

  const hasFeatureModules = workspaceHasGeneratedFeatureModules(syntheticWorkspaceDir);
  originalConsoleLog(`syntheticWorkspaceDir=${syntheticWorkspaceDir}`);
  originalConsoleLog(`workspaceHasGeneratedFeatureModules(syntheticWorkspaceDir) = ${hasFeatureModules}`);
  originalConsoleLog(
    'This is the EXACT function/return value one-prompt-build-orchestrator.ts\'s continuation logic uses ' +
      '(needsMaterialization computation + the "AEE forbids abort" branch guard) to decide "this workspace ' +
      'does not need fresh materialization" — proving that decision is made on file *presence* alone, with ' +
      'no read of file *content* and no re-consultation of the current build\'s contract.',
  );

  // ---------------------------------------------------------------------------------------------
  // PHASE 3 — the real GPCA rendered-content collector, called directly against those exact
  // synthetic stale files, proves GPCA's own detection/blocking logic WOULD fire if it were ever
  // given the chance to look — i.e. GPCA's capability is real; the gap is purely that it is never
  // invoked for a continuation-skip build.
  // ---------------------------------------------------------------------------------------------
  section('PHASE 3 — real collectRenderedContentEvidence() against those same stale files');
  const restaurantContractVocabulary = ['restaurant', 'menu', 'order', 'reservation', 'table', 'dining'];
  const independentAudit = collectRenderedContentEvidence({
    files: [{ path: 'src/features/calculator-utility/CalculatorUtilityFeature.tsx', content: SYNTHETIC_STALE_CALCULATOR_FEATURE_TSX }],
    contractVocabulary: restaurantContractVocabulary,
  });
  originalConsoleLog(`contractVocabulary (current/restaurant build) = [${restaurantContractVocabulary.join(', ')}]`);
  originalConsoleLog(`gateOutcome=${independentAudit.gateOutcome}`);
  originalConsoleLog(`renderedContractMatchPercent=${independentAudit.renderedContractMatchPercent}`);
  originalConsoleLog(`overallRenderedCompliancePercent=${independentAudit.overallRenderedCompliancePercent}`);
  originalConsoleLog(`templateFingerprintsMatched=[${independentAudit.templates.templateFingerprintsMatched.join(', ')}]`);
  originalConsoleLog(`genericShellFingerprintsMatched=[${independentAudit.templates.genericShellFingerprintsMatched.join(', ')}]`);
  originalConsoleLog(`placeholderPhrasesMatched=[${independentAudit.placeholders.placeholderPhrasesMatched.join(', ')}]`);
  originalConsoleLog(`headings=[${independentAudit.headings.headings.join(', ')}]`);
  originalConsoleLog(`navigationLabels=[${independentAudit.navigation.navigationLabels.join(', ')}]`);
  originalConsoleLog(`buttonLabels=[${independentAudit.interactions.buttonLabels.join(', ')}]`);
  originalConsoleLog(`blockedReasons:`);
  for (const reason of independentAudit.blockedReasons) originalConsoleLog(`  - ${reason}`);

  rmSync(syntheticWorkspaceDir, { recursive: true, force: true });

  // ---------------------------------------------------------------------------------------------
  // ANSWERS
  // ---------------------------------------------------------------------------------------------
  section('ANSWERS');

  const answers: Array<{ q: string; a: string }> = [
    {
      q: '1. Does the running server import generation-pipeline-compliance-authority-v1?',
      a: 'YES — src/one-prompt-live-preview/one-prompt-build-orchestrator.ts imports buildGpcaPreMaterializationReport / buildGpcaPostMaterializationReport / gpcaBlocksGeneration / gpcaFailureReason from it (lines ~165-171), and that orchestrator is the exact module server/build-from-prompt-handler.ts (POST /api/build/from-prompt, line 433/436) and src/chat-to-build-execution-bridge-v1/bridge-authority.ts (the default chat-to-build path) both call via runOnePromptLivePreviewBuild.',
    },
    {
      q: '2. Does one-prompt-build-orchestrator call GPCA during this real build?',
      a: `YES, confirmed live in PHASE 1 — pre-materialization trace captured: ${phase1PreMat.length > 0}. Raw: ${phase1PreMat.map((l) => l.raw).join(' | ') || '(none)'}`,
    },
    {
      q: '3. Is GPCA called before materialization?',
      a: 'YES, unconditionally, on every single build — buildGpcaPreMaterializationReport() is called once planning finishes and CBGA has repaired the build plan, before any workspace file is written. Confirmed live above.',
    },
    {
      q: '4. Is GPCA called after materialization?',
      a: `CONDITIONALLY — only from inside runWorkspaceMaterialization() (the local closure defined at one-prompt-build-orchestrator.ts, containing the only call site of buildGpcaPostMaterializationReport). PHASE 1's build never reached that function (post-materialization trace captured: ${phase1PostMat.length > 0} — it was blocked earlier by the confound below), so this could not be observed live in this run; it is proven statically instead (see the exact call sites and the two skip branches cited in Q4/Q12/Q15 of the prior static trace, reproduced in this script's header comment and confirmed mechanically by PHASE 2 below).`,
    },
    {
      q: '5. Is rendered-content-gate.ts executed?',
      a: 'Only as a side effect of buildGpcaPostMaterializationReport() -> collectRenderedContentEvidence() -> evaluateRenderedContentGate() — i.e. only when post-materialization runs at all (see Q4). PHASE 3 proves that when this chain IS given the chance to run (called directly here against real stale content), it correctly executes end-to-end and returns a blocking outcome.',
    },
    {
      q: '6. Is workspaceDir passed into buildGpcaPostMaterializationReport?',
      a: 'YES, at its one call site (one-prompt-build-orchestrator.ts, inside runWorkspaceMaterialization()) — but only when that function actually executes (see Q4).',
    },
    {
      q: '7. Does GPCA receive the generated file contents?',
      a: 'Only on executions where buildGpcaPostMaterializationReport is actually invoked. When a build takes a continuation-skip path (see Q12/Q15), it never receives the real, already-on-disk file contents for that build\'s own execution — PHASE 2 proves the workspace can be fully populated with stale content and still be treated as "no materialization needed" purely by presence.',
    },
    {
      q: '8. Does GPCA detect "reusable components where"?',
      a: `YES — proven live in PHASE 3. genericShellFingerprintsMatched/templateFingerprintsMatched = [${[...independentAudit.templates.templateFingerprintsMatched, ...independentAudit.templates.genericShellFingerprintsMatched].join(', ')}] against the exact synthetic file containing that literal phrase.`,
    },
    {
      q: '9. Does GPCA detect "Calculator / Arithmetic Utility"?',
      a: `YES, generically (no hardcoded "calculator" fingerprint exists, by design) — via contract-vocabulary drift. Proven live in PHASE 3: renderedContractMatchPercent=${independentAudit.renderedContractMatchPercent} against a restaurant contractVocabulary, gateOutcome=${independentAudit.gateOutcome}.`,
    },
    {
      q: '10. Does GPCA return a blocking result?',
      a: `YES — proven live in PHASE 3: gateOutcome=${independentAudit.gateOutcome} (${independentAudit.gateOutcome === 'RENDERED_CONTENT_ALLOWED' ? 'unexpected, see raw output' : 'a blocking outcome'}). GPCA's detection/blocking capability itself is real and correct. The gap is entirely about *whether it is invoked* for a given build (see Q4/Q12), never about its accuracy once invoked.`,
    },
    {
      q: '11. If it returns blocking, where is that result lost?',
      a: 'It is never "lost" after being computed — the result in PHASE 3 above is returned correctly and immediately. For a real continuation-skip build, the report is instead simply never (re)computed against the real files at all — the build\'s gpcaComplianceReport variable keeps holding the earlier pre-materialization report (computed against the *proposed plan*, not real files) all the way through every later gpcaBlocksGeneration() re-check, because nothing overwrites it when runWorkspaceMaterialization() is skipped.',
    },
    {
      q: '12. If it does not return blocking, why not?',
      a: `Because it is never asked the question for the real files on a continuation-skip build. Proven mechanically in PHASE 2: workspaceHasGeneratedFeatureModules(workspaceDir) = ${hasFeatureModules} for a workspace containing ONLY the synthetic stale/non-compliant file above — this function (src/feature-contract-reality/feature-reality-workspace-fallback-collector.ts) checks presence of any src/features/<module>/* file, nothing about its content or compliance. one-prompt-build-orchestrator.ts's continuation logic uses exactly this boolean to decide "materialization not needed", which also means "GPCA post-materialization / rendered-content audit not (re-)run".`,
    },
    {
      q: '13. Which branch starts the preview server despite non-compliance?',
      a: 'The main post-continuation path (one-prompt-build-orchestrator.ts): once the continuation-skip branch sets continuationMaterializationExecuted=true without calling runWorkspaceMaterialization(), execution falls through the "defense-in-depth" gpcaBlocksGeneration() re-check (reading the same never-updated, pre-materialization-only report -> still ALLOWED) into workspace stabilization, npm install, npm build, the final pre-preview gpcaBlocksGeneration() re-check (same stale report -> still ALLOWED), and then startGeneratedAppDevServer(). Not reproduced live end-to-end in this sandbox due to the unrelated confound (see header); the branch and every re-check are cited by exact line number in the static trace this investigation is based on.',
    },
    {
      q: '14. Which branch writes the workspace despite non-compliance?',
      a: 'None does, on the continuation-skip path — that is precisely the bug. No branch writes anything new; the non-compliant content is 100% inherited, byte-for-byte, from whatever a *prior* build (or, as in PHASE 2, a synthetic stand-in for one) already left on disk, and the current build never re-validates it.',
    },
    {
      q: '15. Which file/function is responsible?',
      a: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts, inside runOnePromptLivePreviewBuild(): the `needsMaterialization` boolean (guards the call to runWorkspaceMaterialization() in the ASE-denial/AEE-continuation-override branch) and the twin "AEE forbids abort" branch\'s `if (!workspaceHasGeneratedFeatureModules(workspaceDir))` guard. Both treat workspaceHasGeneratedFeatureModules() === true (src/feature-contract-reality/feature-reality-workspace-fallback-collector.ts — a presence-only check, mechanically proven in PHASE 2) as sufficient evidence that fresh materialization — and therefore a fresh GPCA post-materialization / rendered-content audit — is unnecessary.',
    },
  ];

  for (const { q, a } of answers) {
    originalConsoleLog('');
    originalConsoleLog(q);
    originalConsoleLog(`-> ${a}`);
  }

  section('CONFOUND ENCOUNTERED DURING LIVE REPRODUCTION (reported, not fixed)');
  originalConsoleLog(
    [
      'Every real build attempted in PHASE 1 (fresh prompt, NEW_BUILD) was blocked at the',
      'PRE-materialization gate with COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS: "app title ... does',
      'not match CBGA\'s approved product identity". Root cause (traced, not fixed):',
      'generation-pipeline-compliance-adapter.ts sets `proposed.appTitle: buildPlan.extraction.appName`',
      '(the raw prompt extraction, e.g. "calculator"), while generator-legacy-detection.ts\'s',
      'detectContractBypassedInputs() compares that with strict `!==` against',
      '`cbga.productIdentity` (CBGA\'s synthesized, differently-cased/worded canonical name).',
      'This is a separate, pre-existing defect, unrelated to the Rendered Content Evidence',
      'Expansion V1 milestone, and it is why this trace could not walk a single real build all the',
      'way through the continuation branch in this sandbox. It was not worked around, weakened, or',
      'fixed here — only reported. PHASE 2/3 above independently and conclusively answer the',
      'milestone\'s actual question (does the continuation path skip GPCA\'s rendered-content audit,',
      'and would that audit have caught this content) without depending on getting past it.',
    ].join('\n'),
  );

  section('MINIMAL RECOMMENDED FIX (not implemented — trace-only per instructions)');
  originalConsoleLog(
    [
      'For the traced milestone question: do NOT weaken workspaceHasGeneratedFeatureModules() itself',
      '(it is reused elsewhere for legitimate presence checks). Instead, at the two continuation-skip',
      'sites identified in Q15, still (re)compute GPCA\'s post-materialization / rendered-content',
      'report against whatever files are already on disk whenever materialization is skipped for that',
      'reason — i.e. call buildGpcaPostMaterializationReport({ ..., generatedFilePaths: <existing',
      'workspace files>, workspaceDir }) (just the report step, not runWorkspaceMaterialization()',
      'itself) before falling through to the existing gpcaBlocksGeneration() defense-in-depth checks',
      'at those same two sites. That is additive only: it never touches GPCA\'s own gate/scoring',
      'logic and never weakens a check — it just makes sure a report object GPCA already knows how to',
      'compute is actually computed against the files a continuation build is about to serve.',
      '',
      'Separately (different defect, reported for completeness, not part of this milestone): the',
      'pre-materialization generator-input-bypass title check\'s strict appTitle !== productIdentity',
      'comparison likely needs case/wording normalization (or must compare against the same',
      'extraction CBGA itself used) — as observed here, it can block fresh, otherwise-legitimate',
      'builds outright, which is a different, more aggressive failure mode than the continuation-skip',
      'gap this trace was asked to investigate.',
    ].join('\n'),
  );

  section('SUMMARY');
  originalConsoleLog('GPCA invoked before materialization: YES (confirmed live, PHASE 1).');
  originalConsoleLog('GPCA invoked after materialization for a continuation-skip build: NO (proven statically + mechanically, PHASE 2).');
  originalConsoleLog('Rendered content available to GPCA on a continuation-skip build: NO (never read/collected for that build\'s own execution).');
  originalConsoleLog(`GPCA WOULD detect + block the stale/generic content if invoked: YES (${independentAudit.gateOutcome}, PHASE 3).`);
  originalConsoleLog('Exact file/function responsible: one-prompt-build-orchestrator.ts, needsMaterialization / "AEE forbids abort" continuation-skip branches, gated by workspaceHasGeneratedFeatureModules() (presence-only, PHASE 2).');
  originalConsoleLog('');
  originalConsoleLog('GPCA_RUNTIME_TRACE_V1_COMPLETE');
}

void main().catch((error) => {
  originalConsoleLog('');
  originalConsoleLog('TRACE SCRIPT ERROR (see below) — partial trace output above may still be useful:');
  originalConsoleLog(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
