/**
 * CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1 — validation (evidence-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1_PASS_TOKEN,
  runChatResponseIntelligenceAuditV1,
} from './lib/chat-response-intelligence-audit-v1-tracer.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function main(): void {
  console.log('');
  console.log('Chat Response Intelligence Audit V1 — Validation');
  console.log('================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:chat-response-intelligence-audit-v1']),
    'validate:chat-response-intelligence-audit-v1',
  );
  assert(
    '02. audit report exists',
    existsSync(join(ROOT, 'CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1_REPORT.md')),
    'CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1_REPORT.md',
  );
  assert(
    '03. audit tracer module exists',
    existsSync(join(ROOT, 'scripts/lib/chat-response-intelligence-audit-v1-tracer.ts')),
    'scripts/lib/chat-response-intelligence-audit-v1-tracer.ts',
  );

  const audit = runChatResponseIntelligenceAuditV1();

  assert(
    '04. execution chain generated',
    audit.executionChain.length >= 8,
    String(audit.executionChain.length),
  );
  assert(
    '05. chain includes build execution step',
    audit.executionChain.some((s) => s.function.includes('runOnePromptLivePreviewBuild')),
    'runOnePromptLivePreviewBuild',
  );
  assert(
    '06. chain includes chat render step',
    audit.executionChain.some((s) => s.function.includes('appendChatMessage')),
    'appendChatMessage',
  );

  assert(
    '07. chat response source identified',
    audit.chatResponseSource.buildChatFunction === 'composeOnePromptBuildChatResponse' &&
      audit.chatResponseSource.buildCompletionSource !== 'LLM',
    audit.chatResponseSource.buildCompletionSource,
  );
  assert(
    '08. call stack documented',
    audit.chatResponseSource.callStack.length >= 6,
    String(audit.chatResponseSource.callStack.length),
  );
  assert(
    '09. client render path identified',
    audit.chatResponseSource.clientRenderFile.includes('app.js'),
    audit.chatResponseSource.clientRenderFunction,
  );

  assert(
    '10. build LLM status determined',
    audit.llmInvocation.buildCompletionStatus === 'PARTIAL',
    audit.llmInvocation.buildCompletionStatus,
  );
  assert(
    '11. chain break location documented',
    audit.llmInvocation.chainBreakLocation.length > 30,
    audit.llmInvocation.chainBreakLocation.slice(0, 60),
  );
  assert(
    '12. build path conversational evidence',
    audit.llmInvocation.buildPathEvidence.some((e) =>
      /applyBuildResultConversationalIntelligence|LLM provider|Template fallback/.test(e),
    ),
    audit.llmInvocation.buildPathEvidence.join('; ').slice(0, 80),
  );

  assert(
    '13. build result payload audited',
    audit.buildResultPayload.length >= 8,
    String(audit.buildResultPayload.length),
  );
  assert(
    '14. buildRunId in payload audit',
    audit.buildResultPayload.some((f) => f.field === 'buildRunId' && f.availableInBuildResult),
    'buildRunId',
  );
  assert(
    '15. LLM does not receive build payload',
    audit.buildResultPayload.some((f) => f.passedToLlmOnBuildPath),
    'build fields passed via conversational layer',
  );

  assert(
    '16. classification explainability assessed',
    audit.classificationExplainability.missing.length >= 1,
    String(audit.classificationExplainability.missing.length),
  );
  assert(
    '17. LLM cannot access classification on build path',
    audit.classificationExplainability.llmCanAccessOnBuildPath === true,
    'true',
  );

  assert(
    '18. humanization mode identified',
    audit.humanization.buildPathActive === 'CONVERSATIONAL_RESPONSE',
    audit.humanization.buildPathActive,
  );

  assert(
    '19. architecture gap documented',
    audit.architectureGap.gapLocation.length > 20,
    audit.architectureGap.gapLocation.slice(0, 60),
  );
  assert(
    '20. repair plan produced',
    audit.recommendedRepairPlan.length >= 2,
    String(audit.recommendedRepairPlan.length),
  );

  assert(
    '21. architecture verdict produced',
    ['CHAT_INTELLIGENCE_OK', 'CHAT_INTELLIGENCE_PARTIAL', 'CHAT_INTELLIGENCE_BYPASSED'].includes(
      audit.verdict,
    ),
    audit.verdict,
  );
  assert(
    '22. verdict rationale present',
    audit.verdictRationale.length > 40,
    audit.verdictRationale.slice(0, 60),
  );
  const reportText = readFileSync(join(ROOT, 'CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1_REPORT.md'), 'utf8');
  assert(
    '23. report documents verdict',
    reportText.includes(audit.verdict),
    audit.verdict,
  );
  assert(
    '24. report documents composeOnePromptBuildChatResponse',
    reportText.includes('composeOnePromptBuildChatResponse'),
    'formatter cited',
  );
  assert(
    '25. report documents applyLlmBrainLayer gap',
    reportText.includes('applyLlmBrainLayer'),
    'LLM gap cited',
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Chat Response Intelligence Audit V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1_PASS_TOKEN);
  console.log(`Verdict: ${audit.verdict}`);
}

main();
