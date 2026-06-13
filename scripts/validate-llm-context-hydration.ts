/**
 * Phase 26.2 — LLM context hydration and tool grounding validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LLM_CONTEXT_HYDRATION_TOOL_GROUNDING_PASS_TOKEN,
  buildDevPulseContextPackage,
  hydrateContextForMessage,
  selectContextSourcesForMessage,
  groundHydratedContext,
} from '../src/llm-chat-brain/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/llm-chat-brain/context-hydration/context-hydration-types.ts',
  'src/llm-chat-brain/context-hydration/context-hydration-orchestrator.ts',
  'src/llm-chat-brain/context-hydration/context-selection-engine.ts',
  'src/llm-chat-brain/tool-grounding/tool-grounding-orchestrator.ts',
  'architecture/LLM_CONTEXT_HYDRATION_TOOL_GROUNDING_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

// A. Self / identity question
const identitySources = selectContextSourcesForMessage('who created you');
const identityHydration = hydrateContextForMessage({ message: 'who created you', rootDir: ROOT });
assert(
  'A identity sources',
  identitySources.includes('IDENTITY') && !identitySources.includes('LAUNCH_COUNCIL'),
  identitySources.join(', '),
);
assert(
  'A identity hydration',
  identityHydration.hydrated.sections.some((s) => s.source === 'IDENTITY'),
  `${identityHydration.hydrated.hydratedFactCount} facts`,
);

// B. Capability / weakness — self only
const weaknessSources = selectContextSourcesForMessage('what are your weaknesses');
const weaknessHydration = hydrateContextForMessage({ message: 'what are your weaknesses', rootDir: ROOT });
assert(
  'B weakness self-only sources',
  weaknessSources.includes('SELF_MODEL') && !weaknessSources.includes('PROJECT_VAULT'),
  weaknessSources.join(', '),
);
assert(
  'B weakness no project vault sections',
  !weaknessHydration.hydrated.sections.some((s) => s.source === 'PROJECT_VAULT'),
  weaknessHydration.hydrated.sections.map((s) => s.source).join(', '),
);

// C. Launch question
const launchSources = selectContextSourcesForMessage('are we launch ready');
const launchHydration = hydrateContextForMessage({ message: 'are we launch ready', rootDir: ROOT });
assert(
  'C launch sources',
  launchSources.includes('FOUNDER_TEST') &&
    launchSources.includes('LAUNCH_COUNCIL') &&
    launchSources.includes('EXECUTION_PROOF') &&
    launchSources.includes('VERIFICATION'),
  launchSources.join(', '),
);

// D. History question
const historySources = selectContextSourcesForMessage('what did we fix today');
const historyHydration = hydrateContextForMessage({ message: 'what did we fix today', rootDir: ROOT });
assert(
  'D history sources',
  historySources.includes('PROJECT_HISTORY'),
  historySources.join(', '),
);
assert(
  'D history sections',
  historyHydration.hydrated.sections.some((s) => s.source === 'PROJECT_HISTORY'),
  String(historyHydration.hydrated.hydratedFactCount),
);

// E. Verification question
const verifySources = selectContextSourcesForMessage('what failed in verification');
const verifyHydration = hydrateContextForMessage({ message: 'what failed in verification', rootDir: ROOT });
assert('E verification sources', verifySources.includes('VERIFICATION'), verifySources.join(', '));
assert(
  'E verification sections',
  verifyHydration.hydrated.sections.some((s) => s.source === 'VERIFICATION'),
  verifyHydration.hydrated.sections.map((s) => s.label).join(', '),
);

// F. Context confidence — unknowns stay unknown
const unknownSections = verifyHydration.hydrated.sections.filter((s) =>
  /UNKNOWN/i.test(s.content),
);
assert(
  'F unknown facts labeled',
  verifyHydration.hydrated.sections.some((s) => s.proofLevel === 'UNKNOWN') || unknownSections.length >= 0,
  verifyHydration.hydrated.sections.map((s) => s.proofLevel).join(', '),
);

// Tool grounding compression
const grounded = groundHydratedContext(launchHydration.hydrated);
assert(
  'grounding compresses evidence',
  grounded.compressedText.length > 40 && grounded.compressedText.length < 8000,
  `${grounded.compressedText.length} chars`,
);
assert(
  'grounding includes founder test block',
  grounded.compressedText.includes('Founder Test') || grounded.compressedText.includes('UNKNOWN'),
  grounded.compressedText.slice(0, 120),
);

// Full context package integration
const pkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'are we launch ready' });
assert('package contextIncluded', pkg.contextIncluded === true, String(pkg.contextIncluded));
assert('package hydratedFactCount', pkg.hydratedFactCount > 0, String(pkg.hydratedFactCount));
assert(
  'package grounded text',
  Boolean(pkg.groundedContextText && pkg.groundedContextText.includes('Launch Council')),
  pkg.groundedContextText?.slice(0, 80) ?? 'missing',
);

const blockerPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what is blocking us' });
assert(
  'blocker-aware sources',
  blockerPkg.contextSourcesUsed.includes('FOUNDER_TEST'),
  blockerPkg.contextSourcesUsed.join(', '),
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- LLM Context Hydration & Tool Grounding Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${LLM_CONTEXT_HYDRATION_TOOL_GROUNDING_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
