/**
 * Build Profile Classification — validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILD_PROFILE_CLASSIFICATION_PASS_TOKEN,
  rankBuildProfiles,
  rankBuildProfilesForSelected,
} from '../src/build-profile-classification/index.js';
import { resolveBuildIntentProfile } from '../src/build-intent-routing/index.js';
import {
  analyzeBuildProfileClassification,
  composeProfileMismatchChatResponse,
  shouldUseProfileMismatchChatResponse,
} from '../src/build-result-conversational-intelligence/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const EXPENSE_TRACKER_PROMPT =
  'Build ExpenseTracker with income, expenses, balance, categories, reports, charts, CSV export, and finance tracking. Begin build execution now.';

const EXPENSE_UI_PROMPT =
  'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.';

const CRM_PROMPT =
  'Build a CRM for our sales team to manage customers, leads, contacts, deals, and the sales pipeline with follow-ups.';

const TASK_TRACKER_PROMPT =
  'Build a task tracker web app where users can add tasks, mark them complete, delete tasks, and filter active vs completed.';

const QR_PROMPT = 'Build a QR code app called SmartQR to generate and scan barcodes. Begin build execution now.';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function isExpenseProfile(profile: string | null): boolean {
  return profile === 'EXPENSE_TRACKER_WEB_V1' || profile === 'FINANCE_TRACKER_WEB_V1';
}

async function main(): Promise<void> {
  console.log('');
  console.log('Build Profile Classification — Validation');
  console.log('=========================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:build-profile-classification']),
    'validate:build-profile-classification',
  );
  assert(
    '02. ranking engine exists',
    existsSync(join(ROOT, 'src/build-profile-classification/profile-ranking-engine.ts')),
    'profile-ranking-engine.ts',
  );
  assert(
    '03. build intent uses rankBuildProfiles',
    brainHandler.includes('applyBuildResultConversationalIntelligence'),
    'brain handler wired',
  );

  const expenseRank = rankBuildProfiles(EXPENSE_TRACKER_PROMPT);
  assert(
    '04. ExpenseTracker → expense/finance profile',
    isExpenseProfile(expenseRank.selectedProfile),
    expenseRank.selectedProfile ?? 'none',
  );
  assert(
    '05. ExpenseTracker never CRM',
    expenseRank.selectedProfile !== 'CRM_WEB_V1',
    expenseRank.selectedProfile ?? 'none',
  );
  assert(
    '06. expense keyword evidence',
    expenseRank.matchedKeywords.some((k) => /expense|finance|category|budget|csv|chart|income|balance/i.test(k)),
    expenseRank.matchedKeywords.join(', ') || 'none',
  );
  assert(
    '07. expense rejects CRM in rankings',
    !expenseRank.rankings.some((entry) => entry.profile === 'CRM_WEB_V1' && entry.score > 0),
    expenseRank.rejectionReasons.join(' | ').slice(0, 80) || 'crm absent',
  );

  const expenseUiRank = rankBuildProfiles(EXPENSE_UI_PROMPT);
  assert(
    '08. UI expense prompt → expense profile',
    isExpenseProfile(expenseUiRank.selectedProfile),
    expenseUiRank.selectedProfile ?? 'none',
  );
  assert(
    '09. resolveBuildIntentProfile expense',
    isExpenseProfile(resolveBuildIntentProfile(EXPENSE_UI_PROMPT)),
    String(resolveBuildIntentProfile(EXPENSE_UI_PROMPT)),
  );

  const crmRank = rankBuildProfiles(CRM_PROMPT);
  assert('10. CRM prompt → CRM_WEB_V1', crmRank.selectedProfile === 'CRM_WEB_V1', crmRank.selectedProfile ?? 'none');
  assert(
    '11. CRM keyword evidence',
    crmRank.matchedKeywords.some((k) => /crm|customer|sales|pipeline|leads|contacts|deals/i.test(k)),
    crmRank.matchedKeywords.join(', '),
  );

  const taskRank = rankBuildProfiles(TASK_TRACKER_PROMPT);
  assert(
    '12. task tracker prompt → TASK_TRACKER_WEB_V1',
    taskRank.selectedProfile === 'TASK_TRACKER_WEB_V1',
    taskRank.selectedProfile ?? 'none',
  );

  const qrRank = rankBuildProfiles(QR_PROMPT);
  assert('13. QR prompt → QR_APP', qrRank.selectedProfile === 'QR_APP', qrRank.selectedProfile ?? 'none');

  const forcedMismatch = rankBuildProfilesForSelected(EXPENSE_TRACKER_PROMPT, 'CRM_WEB_V1');
  assert(
    '14. wrong profile triggers PROFILE_MISMATCH',
    forcedMismatch.alignmentVerdict === 'PROFILE_MISMATCH',
    forcedMismatch.alignmentVerdict,
  );
  assert(
    '15. mismatch warnings populated',
    forcedMismatch.profileMismatchWarnings.length >= 1,
    forcedMismatch.profileMismatchWarnings.join(' | ').slice(0, 80),
  );

  const classification = analyzeBuildProfileClassification(EXPENSE_TRACKER_PROMPT, 'CRM_WEB_V1');
  assert(
    '16. classification flags mismatch',
    classification.alignmentVerdict === 'PROFILE_MISMATCH',
    classification.alignmentVerdict,
  );
  assert(
    '17. matchedSignals are keywords not generic labels',
    !classification.matchedSignals.includes('build intent') &&
      !classification.matchedSignals.includes('CRM_WEB_V1'),
    classification.matchedSignals.join(', '),
  );

  const mismatchContext = {
    readOnly: true as const,
    userPrompt: EXPENSE_TRACKER_PROMPT,
    activeProjectId: 'expense-1',
    activeProjectName: 'ExpenseTracker',
    buildRunId: 'build-1',
    selectedProfile: 'CRM_WEB_V1' as const,
    workspacePath: '.generated-builder-workspaces/expense-1',
    buildStatus: 'READY' as const,
    buildResult: 'PASS' as const,
    previewUrl: 'http://127.0.0.1:5173/preview',
    failureReason: null,
    architectureSummary: null,
    planTaskCount: 6,
    buildStage: 'complete',
    generatedFilesCount: null,
    classification,
    templateFallback: 'Build run: build-1',
  };

  assert(
    '18. mismatch chat response natural',
    shouldUseProfileMismatchChatResponse(mismatchContext),
    'should use mismatch response',
  );
  const mismatchChat = composeProfileMismatchChatResponse(mismatchContext);
  assert(
    '19. chat flags profile mismatch naturally',
    /profile mismatch|CRM_WEB_V1|expense-tracking profile/i.test(mismatchChat),
    mismatchChat.slice(0, 100),
  );
  assert(
    '20. chat avoids mechanical template dump',
    !mismatchChat.includes('Build run:') || mismatchChat.includes('profile mismatch'),
    mismatchChat.slice(0, 80),
  );

  const genericExpensePrompt =
    'Build a dashboard with records and reports for my business.';
  const genericRank = rankBuildProfiles(genericExpensePrompt);
  assert(
    '21. generic dashboard/records alone not CRM',
    genericRank.selectedProfile !== 'CRM_WEB_V1',
    genericRank.selectedProfile ?? 'none',
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Build Profile Classification — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(BUILD_PROFILE_CLASSIFICATION_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
