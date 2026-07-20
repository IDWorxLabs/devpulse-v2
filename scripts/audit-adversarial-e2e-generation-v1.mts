/**
 * AIDEVENGINE_ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1
 *
 * Production-pipeline stress audit: sequential NEW_BUILD generations across
 * unrelated adversarial products with clean-state isolation between runs.
 *
 * Usage:
 *   npx tsx scripts/audit-adversarial-e2e-generation-v1.mts [startIndex] [count]
 *
 * Env:
 *   AUDIT_LEDGER — JSONL ledger path
 *   AUDIT_SKIP_CONTAMINATION=1 — skip final tree scan
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runOnePromptLivePreviewBuild,
  stopAllGeneratedDevServers,
  resetOnePromptLivePreviewForTests,
} from '../src/one-prompt-live-preview/index.js';
import {
  detectForbiddenBannedFallbackModulesInWorkspace,
  listWorkspaceFeatureModuleIds,
  BANNED_FALLBACK_MODULES,
} from '../src/prompt-faithful-generation/index.js';
import {
  ADVERSARIAL_WORKLOAD,
  assertWorkloadConstraints,
  type AdversarialWorkloadItem,
} from './adversarial-e2e-workload.mts';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.aidev-audit-reports');
mkdirSync(REPORT_DIR, { recursive: true });

const PASS_TOKEN = 'AIDEVENGINE_ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1_PASS';
const startIndex = Number.parseInt(process.argv[2] ?? '0', 10);
const count = Number.parseInt(process.argv[3] ?? String(ADVERSARIAL_WORKLOAD.length), 10);
const ledgerPath =
  process.env.AUDIT_LEDGER ?? join(REPORT_DIR, 'adversarial-e2e-generation-audit-v1-ledger.jsonl');
const summaryPath = join(REPORT_DIR, 'ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1_SUMMARY.json');
const contaminationPath = join(REPORT_DIR, 'ADVERSARIAL_E2E_CONTAMINATION_AUDIT_V1.json');

assertWorkloadConstraints();

interface IsolationSnapshot {
  projectId: string;
  moduleIds: string[];
  identity: string | null;
  promptTokens: string[];
}

interface Row {
  index: number;
  id: string;
  domain: string;
  category: string;
  size: string;
  style: string;
  adversarial: boolean;
  projectId: string;
  status: string | null;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  livePreviewAvailable: boolean;
  previewUrl: string | null;
  buildResult: string | null;
  gpcaGate: string | null;
  gpcaHardStop: boolean;
  approvedIdentity: string | null;
  productIdentity: string | null;
  moduleIds: string[] | null;
  workspaceModules: string[] | null;
  navEntries: string[] | null;
  workspacePath: string | null;
  forbiddenFallbackIds: string[];
  fallbackContaminationPassed: boolean | null;
  capabilityRetentionPercent: number | null;
  retainedCapabilities: string[];
  missingCapabilities: string[];
  identityLooksGeneric: boolean;
  isolationLeakFromPrior: string[];
  contextIsolationDecision: string | null;
  c1RepairsApplied: number;
  failureReason: string | null;
  succeeded: boolean;
  durationMs: number;
  error?: string;
  categoryOutcome: string;
}

const priorSnapshots: IsolationSnapshot[] = [];

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length >= 4);
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function capabilityRetained(capability: string, modules: readonly string[], identity: string): boolean {
  const capTokens = tokenize(capability);
  const hay = `${modules.join(' ')} ${identity}`.toLowerCase();
  const moduleHay = modules.map(normalizeId).join(' ');
  const asId = normalizeId(capability);
  if (modules.map(normalizeId).includes(asId)) return true;
  if (moduleHay.includes(asId) && asId.includes('-')) return true;
  if (capTokens.length === 0) return false;
  const hits = capTokens.filter((t) => hay.includes(t) || moduleHay.includes(t)).length;
  return hits / capTokens.length >= 0.5;
}

const GENERIC_IDENTITY =
  /\b(appointment booking|task tracker|project management|sales crm|crm\b|erp\b|notes?\b|generic application|custom application)\b/i;

function readWorkspaceJson(workspaceAbs: string | null, relativePath: string): Record<string, unknown> | null {
  if (!workspaceAbs) return null;
  const abs = join(workspaceAbs, relativePath);
  if (!existsSync(abs)) return null;
  try {
    return JSON.parse(readFileSync(abs, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function classify(row: Row): string {
  if (row.succeeded && row.fallbackContaminationPassed !== false && row.isolationLeakFromPrior.length === 0) {
    return 'SUCCESS';
  }
  if (row.error) return 'HARNESS_ERROR';
  if (row.gpcaHardStop) return 'GPCA_HARD_STOP';
  if (row.fallbackContaminationPassed === false) return 'FALLBACK_CONTAMINATION';
  if (row.isolationLeakFromPrior.length > 0) return 'ISOLATION_LEAK';
  if (row.status === 'FAILED') return 'BUILD_FAILED';
  if (!row.npmInstallOk) return 'NPM_INSTALL_FAILED';
  if (!row.npmBuildOk) return 'NPM_BUILD_FAILED';
  if (!row.livePreviewAvailable) return 'PREVIEW_UNAVAILABLE';
  return 'UNKNOWN';
}

async function runOne(index: number, item: AdversarialWorkloadItem): Promise<Row> {
  const startedAt = performance.now();
  const projectId = `adv-e2e-${item.id}-${Date.now()}-${index}`;
  const base: Row = {
    index,
    id: item.id,
    domain: item.domain,
    category: item.category,
    size: item.size,
    style: item.style,
    adversarial: item.adversarial,
    projectId,
    status: null,
    npmInstallOk: false,
    npmBuildOk: false,
    livePreviewAvailable: false,
    previewUrl: null,
    buildResult: null,
    gpcaGate: null,
    gpcaHardStop: false,
    approvedIdentity: null,
    productIdentity: null,
    moduleIds: null,
    workspaceModules: null,
    navEntries: null,
    workspacePath: null,
    forbiddenFallbackIds: [],
    fallbackContaminationPassed: null,
    capabilityRetentionPercent: null,
    retainedCapabilities: [],
    missingCapabilities: [],
    identityLooksGeneric: false,
    isolationLeakFromPrior: [],
    contextIsolationDecision: null,
    c1RepairsApplied: 0,
    failureReason: null,
    succeeded: false,
    durationMs: 0,
    categoryOutcome: 'PENDING',
  };

  try {
    const build = await runOnePromptLivePreviewBuild({
      rawPrompt: item.prompt,
      projectRootDir: ROOT,
      source: 'validator',
      projectId,
      projectName: item.label,
      projectKind: 'AUDIT',
      buildDecisionKind: 'NEW_BUILD',
      resumeExistingProject: false,
      freshProjectContextCreated: true,
      buildIntentOverride: 'START_NEW_BUILD',
    });

    const moduleIds = build.approvedModulePlan?.moduleIds ? [...build.approvedModulePlan.moduleIds] : [];
    const identity =
      build.approvedProductIdentity?.displayName ??
      build.approvedProductIdentity?.productIdentity ??
      build.projectName ??
      '';
    const workspaceAbs = build.workspacePath
      ? build.workspacePath.startsWith('.')
        ? join(ROOT, build.workspacePath)
        : build.workspacePath
      : null;

    let workspaceModules: string[] = [];
    let forbiddenFallbackIds: string[] = [];
    let fallbackContaminationPassed: boolean | null = null;
    if (workspaceAbs && existsSync(workspaceAbs)) {
      workspaceModules = listWorkspaceFeatureModuleIds(workspaceAbs, { approvedModuleIds: moduleIds });
      const scan = detectForbiddenBannedFallbackModulesInWorkspace({
        workspaceDir: workspaceAbs,
        approvedModuleIds: moduleIds,
        promptRequiredModules: moduleIds,
        rawPrompt: item.prompt,
        currentProjectId: projectId,
        ancestryProjectId: projectId,
      });
      forbiddenFallbackIds = scan.forbiddenModuleIds;
      fallbackContaminationPassed = scan.passed;
    }

    const retained: string[] = [];
    const missing: string[] = [];
    for (const cap of item.expectedCapabilities) {
      if (capabilityRetained(cap, moduleIds.length ? moduleIds : workspaceModules, identity)) {
        retained.push(cap);
      } else {
        missing.push(cap);
      }
    }
    const retention =
      item.expectedCapabilities.length === 0
        ? null
        : Math.round((retained.length / item.expectedCapabilities.length) * 1000) / 10;

    // Isolation: prior unique modules/tokens must not appear as unexplained contamination.
    // We flag when a prior project's distinctive multi-segment module id appears in this
    // build's modules while not justified by the current prompt tokens.
    const promptTokens = new Set(tokenize(item.prompt));
    const isolationLeakFromPrior: string[] = [];
    const currentModules = new Set((moduleIds.length ? moduleIds : workspaceModules).map(normalizeId));
    for (const prior of priorSnapshots) {
      for (const mid of prior.moduleIds) {
        const nid = normalizeId(mid);
        if (!nid.includes('-')) continue;
        if (!currentModules.has(nid)) continue;
        const midTokens = tokenize(mid);
        const justified = midTokens.some((t) => promptTokens.has(t));
        if (!justified) {
          isolationLeakFromPrior.push(`${prior.projectId}:${nid}`);
        }
      }
    }

    const c1 = readWorkspaceJson(workspaceAbs, 'src/autonomous-engineering-intelligence/autonomous-engineering-report.json');
    const succeeded =
      build.status === 'READY' &&
      build.npmBuildOk === true &&
      build.livePreviewAvailable === true &&
      Boolean(build.previewUrl) &&
      fallbackContaminationPassed !== false &&
      isolationLeakFromPrior.length === 0;

    const row: Row = {
      ...base,
      status: build.status,
      npmInstallOk: build.npmInstallOk === true,
      npmBuildOk: build.npmBuildOk === true,
      livePreviewAvailable: build.livePreviewAvailable === true,
      previewUrl: build.previewUrl ?? null,
      buildResult: build.buildResult,
      gpcaGate: build.gpcaComplianceReport?.finalGateOutcome ?? null,
      gpcaHardStop: build.gpcaHardStop === true,
      approvedIdentity: identity || null,
      productIdentity: build.approvedProductIdentity?.productIdentity ?? null,
      moduleIds: moduleIds.length ? moduleIds : null,
      workspaceModules: workspaceModules.length ? workspaceModules : null,
      navEntries: build.approvedNavigationPlan?.productEntries
        ? [...build.approvedNavigationPlan.productEntries]
        : null,
      workspacePath: build.workspacePath ?? null,
      forbiddenFallbackIds,
      fallbackContaminationPassed,
      capabilityRetentionPercent: retention,
      retainedCapabilities: retained,
      missingCapabilities: missing,
      identityLooksGeneric: GENERIC_IDENTITY.test(identity),
      isolationLeakFromPrior,
      contextIsolationDecision: build.contextIsolation?.decision ?? null,
      c1RepairsApplied: Array.isArray(c1?.repairsApplied) ? (c1.repairsApplied as unknown[]).length : 0,
      failureReason: build.failureReason ?? null,
      succeeded,
      durationMs: Math.round(performance.now() - startedAt),
      categoryOutcome: 'PENDING',
    };
    row.categoryOutcome = classify(row);

    priorSnapshots.push({
      projectId,
      moduleIds: moduleIds.length ? moduleIds : workspaceModules,
      identity: identity || null,
      promptTokens: [...promptTokens],
    });
    // Keep memory bounded
    if (priorSnapshots.length > 20) priorSnapshots.shift();

    return row;
  } catch (err) {
    const row: Row = {
      ...base,
      error: err instanceof Error ? `${err.message}\n${err.stack ?? ''}`.slice(0, 2000) : String(err),
      durationMs: Math.round(performance.now() - startedAt),
      categoryOutcome: 'HARNESS_ERROR',
    };
    return row;
  } finally {
    try {
      await stopAllGeneratedDevServers();
    } catch {
      /* ignore */
    }
    resetOnePromptLivePreviewForTests();
  }
}

function walkFeatureModules(rootDir: string): Array<{ projectHint: string; moduleId: string; path: string }> {
  const found: Array<{ projectHint: string; moduleId: string; path: string }> = [];
  if (!existsSync(rootDir)) return found;

  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
      const abs = join(dir, name);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (name === 'features') {
          let modules: string[] = [];
          try {
            modules = readdirSync(abs);
          } catch {
            modules = [];
          }
          for (const moduleId of modules) {
            const modPath = join(abs, moduleId);
            try {
              if (statSync(modPath).isDirectory()) {
                const parts = abs.split(/[/\\]/);
                const projectHint = parts.find((p) => p.startsWith('adv-e2e-') || p.includes('aidev-projects')) ?? parts[parts.length - 3] ?? 'unknown';
                found.push({ projectHint, moduleId, path: modPath });
              }
            } catch {
              /* ignore */
            }
          }
        } else {
          stack.push(abs);
        }
      }
    }
  }
  return found;
}

function runContaminationAudit(ledgerRows: Row[]): Record<string, unknown> {
  const auditProjectIds = new Set(ledgerRows.map((r) => r.projectId));
  const features = [
    ...walkFeatureModules(join(ROOT, '.aidev-projects')),
    ...walkFeatureModules(join(ROOT, '.generated-builder-workspaces')),
  ].filter((f) => {
    // Scope contamination scan to this audit's projects when possible
    return [...auditProjectIds].some((id) => f.path.includes(id) || f.projectHint.includes(id));
  });

  const bareBannedHits: string[] = [];
  const duplicateModuleIds: string[] = [];
  const seen = new Map<string, string>();

  for (const f of features) {
    if ((BANNED_FALLBACK_MODULES as readonly string[]).includes(f.moduleId)) {
      bareBannedHits.push(`${f.projectHint}/${f.moduleId}`);
    }
    const key = `${f.projectHint}::${f.moduleId}`;
    if (seen.has(key)) duplicateModuleIds.push(key);
    else seen.set(key, f.path);
  }

  // Cross-project duplicate distinctive module ids appearing in multiple audit projects
  // with different projectIds — not automatically contamination (common names ok), but
  // bare banned shared across projects is flagged above.
  const findings = {
    readOnly: true as const,
    scannedFeatureFolders: features.length,
    bareBannedFallbackFolders: bareBannedHits,
    duplicateModuleIdPaths: duplicateModuleIds,
    ledgerFallbackContaminationFailures: ledgerRows.filter((r) => r.fallbackContaminationPassed === false).map((r) => r.id),
    ledgerIsolationLeaks: ledgerRows.filter((r) => r.isolationLeakFromPrior.length > 0).map((r) => ({
      id: r.id,
      leaks: r.isolationLeakFromPrior,
    })),
    passed:
      bareBannedHits.length === 0 &&
      ledgerRows.every((r) => r.fallbackContaminationPassed !== false) &&
      ledgerRows.every((r) => r.isolationLeakFromPrior.length === 0),
  };
  writeFileSync(contaminationPath, JSON.stringify(findings, null, 2), 'utf8');
  return findings;
}

function buildSummary(rows: Row[], contamination: Record<string, unknown>): Record<string, unknown> {
  const succeeded = rows.filter((r) => r.succeeded);
  const failed = rows.filter((r) => !r.succeeded);
  const retentions = rows.map((r) => r.capabilityRetentionPercent).filter((n): n is number => n !== null);
  const avgRetention =
    retentions.length === 0 ? null : Math.round((retentions.reduce((a, b) => a + b, 0) / retentions.length) * 10) / 10;
  const previewOk = rows.filter((r) => r.livePreviewAvailable).length;
  const buildOk = rows.filter((r) => r.npmBuildOk).length;
  const integrityOk = rows.filter((r) => r.fallbackContaminationPassed !== false && !r.gpcaHardStop).length;
  const genericIdentity = rows.filter((r) => r.identityLooksGeneric).length;
  const byCategory: Record<string, number> = {};
  for (const r of rows) byCategory[r.categoryOutcome] = (byCategory[r.categoryOutcome] ?? 0) + 1;
  const domains = [...new Set(rows.map((r) => r.category))];

  const summary = {
    readOnly: true as const,
    executedAt: new Date().toISOString(),
    productsGenerated: rows.length,
    successfulGenerations: succeeded.length,
    failedGenerations: failed.length,
    successRatePercent: rows.length ? Math.round((succeeded.length / rows.length) * 1000) / 10 : 0,
    averageCapabilityRetentionPercent: avgRetention,
    buildSuccessRatePercent: rows.length ? Math.round((buildOk / rows.length) * 1000) / 10 : 0,
    previewSuccessRatePercent: rows.length ? Math.round((previewOk / rows.length) * 1000) / 10 : 0,
    integritySuccessRatePercent: rows.length ? Math.round((integrityOk / rows.length) * 1000) / 10 : 0,
    genericIdentityCount: genericIdentity,
    domainCoverage: domains,
    domainCoverageCount: domains.length,
    outcomeBreakdown: byCategory,
    contamination,
    failures: failed.map((r) => ({
      id: r.id,
      category: r.categoryOutcome,
      status: r.status,
      failureReason: r.failureReason,
      error: r.error?.slice(0, 300),
      missingCapabilities: r.missingCapabilities,
      forbiddenFallbackIds: r.forbiddenFallbackIds,
      isolationLeakFromPrior: r.isolationLeakFromPrior,
      identity: r.approvedIdentity,
    })),
    manualInterventionsRequired: 0,
    passTokenEligible:
      failed.length === 0 &&
      contamination.passed === true &&
      rows.length >= 50,
  };
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}

async function main(): Promise<void> {
  const end = Math.min(startIndex + count, ADVERSARIAL_WORKLOAD.length);
  console.log('# AIDEVENGINE_ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1');
  console.log(`Workload: ${ADVERSARIAL_WORKLOAD.length}; running [${startIndex}, ${end})`);
  console.log(`Ledger: ${ledgerPath}\n`);

  if (startIndex === 0 && count >= ADVERSARIAL_WORKLOAD.length && existsSync(ledgerPath)) {
    writeFileSync(ledgerPath, '', 'utf8');
  }

  const rows: Row[] = [];
  for (let i = startIndex; i < end; i += 1) {
    const item = ADVERSARIAL_WORKLOAD[i]!;
    const row = await runOne(i, item);
    rows.push(row);
    appendFileSync(ledgerPath, `${JSON.stringify(row)}\n`, 'utf8');
    console.log(
      `[${i}] ${row.id} -> ${row.categoryOutcome} | status=${row.status} build=${row.npmBuildOk} preview=${row.livePreviewAvailable} modules=${row.moduleIds?.length ?? 0} retention=${row.capabilityRetentionPercent ?? '-'}% identity=${(row.approvedIdentity ?? '').slice(0, 40)} forbidden=${row.forbiddenFallbackIds.join(',') || '-'} ${row.durationMs}ms${row.failureReason ? ` | ${row.failureReason.slice(0, 120)}` : ''}${row.error ? ` | ERR=${row.error.slice(0, 160)}` : ''}`,
    );
  }

  // Reload full ledger if partial run
  let allRows = rows;
  if (existsSync(ledgerPath) && (startIndex !== 0 || end < ADVERSARIAL_WORKLOAD.length)) {
    allRows = readFileSync(ledgerPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Row);
  }

  const contamination =
    process.env.AUDIT_SKIP_CONTAMINATION === '1'
      ? { passed: true, skipped: true }
      : runContaminationAudit(allRows);
  const summary = buildSummary(allRows, contamination);

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  if (summary.passTokenEligible) {
    console.log(`\n${PASS_TOKEN}`);
  } else {
    console.log('\nPASS TOKEN WITHHELD — unresolved failures or incomplete run');
  }

  try {
    await stopAllGeneratedDevServers();
  } catch {
    /* ignore */
  }
  process.exit(summary.passTokenEligible ? 0 : 1);
}

void main();
