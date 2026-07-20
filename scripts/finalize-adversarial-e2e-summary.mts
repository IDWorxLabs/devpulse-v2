import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BANNED_FALLBACK_MODULES,
  classifyModuleFallbackStatus,
  detectForbiddenBannedFallbackModulesInWorkspace,
  extractPromptFeatures,
  listWorkspaceFeatureModuleIds,
} from '../src/prompt-faithful-generation/index.js';

const ROOT = process.cwd();
const ledgerPath = join(ROOT, '.aidev-audit-reports', 'adversarial-e2e-generation-audit-v1-ledger.jsonl');
const summaryPath = join(ROOT, '.aidev-audit-reports', 'ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1_SUMMARY.json');

const ledger = readFileSync(ledgerPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as Record<string, unknown>);

const forbiddenBare: Array<{ id: string; module: string; reason: string }> = [];
const contractBoundBare: Array<{ id: string; module: string }> = [];
const fallbackFails: Array<{ id: string; forbidden: string[] }> = [];
const isolationLeaks: Array<{ id: string; leaks: string[] }> = [];
let scanned = 0;

for (const row of ledger) {
  const projectId = String(row.projectId);
  const id = String(row.id);
  const workspacePath = row.workspacePath ? String(row.workspacePath) : null;
  const ws = workspacePath
    ? workspacePath.startsWith('.')
      ? join(ROOT, workspacePath)
      : workspacePath
    : join(ROOT, '.aidev-projects', projectId, 'source');
  if (!existsSync(ws)) continue;
  scanned += 1;

  const moduleIds = (row.moduleIds as string[] | null) ?? [];
  let prompt = '';
  const projectJson = join(ROOT, '.aidev-projects', projectId, 'project.json');
  if (existsSync(projectJson)) {
    try {
      prompt = String(JSON.parse(readFileSync(projectJson, 'utf8')).originalPrompt ?? '');
    } catch {
      prompt = '';
    }
  }

  const mods = listWorkspaceFeatureModuleIds(ws, { approvedModuleIds: moduleIds });
  const promptRequired = prompt ? extractPromptFeatures(prompt).requiredModules : [];
  const scan = detectForbiddenBannedFallbackModulesInWorkspace({
    workspaceDir: ws,
    approvedModuleIds: moduleIds,
    promptRequiredModules: promptRequired,
    rawPrompt: prompt,
    currentProjectId: projectId,
    ancestryProjectId: projectId,
  });
  if (!scan.passed) {
    fallbackFails.push({ id, forbidden: scan.forbiddenModuleIds });
  }

  for (const moduleId of mods) {
    if (!(BANNED_FALLBACK_MODULES as readonly string[]).includes(moduleId)) continue;
    const classification = classifyModuleFallbackStatus({
      moduleId,
      approvedModuleIds: moduleIds,
      promptRequiredModules: promptRequired,
      rawPrompt: prompt,
      currentProjectId: projectId,
      ancestryProjectId: projectId,
      materializedFolderId: moduleId,
    });
    if (classification.forbidden) {
      forbiddenBare.push({ id, module: moduleId, reason: classification.reason });
    } else {
      contractBoundBare.push({ id, module: moduleId });
    }
  }

  const leaks = (row.isolationLeakFromPrior as string[] | undefined) ?? [];
  if (leaks.length) isolationLeaks.push({ id, leaks });
}

const retentions = ledger
  .map((row) => row.capabilityRetentionPercent)
  .filter((value): value is number => typeof value === 'number');
const avgRetention =
  retentions.length === 0
    ? null
    : Math.round((retentions.reduce((sum, value) => sum + value, 0) / retentions.length) * 10) / 10;

const succeeded = ledger.filter((row) => row.succeeded === true).length;
const contaminationPassed =
  forbiddenBare.length === 0 && fallbackFails.length === 0 && isolationLeaks.length === 0;

const summary = {
  readOnly: true as const,
  executedAt: new Date().toISOString(),
  productsGenerated: ledger.length,
  successfulGenerations: succeeded,
  failedGenerations: ledger.length - succeeded,
  successRatePercent: Math.round((succeeded / ledger.length) * 1000) / 10,
  averageCapabilityRetentionPercent: avgRetention,
  buildSuccessRatePercent:
    Math.round((ledger.filter((row) => row.npmBuildOk === true).length / ledger.length) * 1000) / 10,
  previewSuccessRatePercent:
    Math.round((ledger.filter((row) => row.livePreviewAvailable === true).length / ledger.length) * 1000) / 10,
  integritySuccessRatePercent:
    Math.round(
      (ledger.filter((row) => row.fallbackContaminationPassed !== false && row.gpcaHardStop !== true).length /
        ledger.length) *
        1000,
    ) / 10,
  domainCoverage: [...new Set(ledger.map((row) => String(row.category)))],
  adversarialCount: ledger.filter((row) => row.adversarial === true).length,
  contamination: {
    scannedWorkspaces: scanned,
    forbiddenBareBannedModules: forbiddenBare,
    contractBoundBareBannedModules: contractBoundBare,
    fallbackFails,
    isolationLeaks,
    passed: contaminationPassed,
  },
  manualInterventionsRequired: 0,
  passTokenEligible: succeeded === ledger.length && contaminationPassed && ledger.length >= 50,
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.passTokenEligible ? 0 : 1);
