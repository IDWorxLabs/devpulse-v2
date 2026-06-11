/**
 * Phase 24.9.1 — Command Center Identity Realignment validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MANDATORY_PRODUCT_IDENTITY_PROMPTS,
  processBrainRequest,
  resolveProductIdentityResponse,
} from '../src/command-center-brain/index.js';
import {
  assessArchitectureLeakage,
  leakageLevelSeverity,
} from '../src/founder-testing-mode/founder-proxy-architecture-leakage.js';
import {
  evaluatePromptVision,
  integratePerceptionSignals,
  predictFounderApproval,
  scoreVisionAlignment,
} from '../src/founder-testing-mode/founder-proxy-evaluator.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'COMMAND_CENTER_IDENTITY_REALIGNMENT_PASS';
const PASS_LIMITED_TOKEN = 'COMMAND_CENTER_IDENTITY_REALIGNMENT_PASS_WITH_LIMITATIONS';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center Identity Realignment — Validation');
  console.log('================================================');
  console.log('');

  const brain = readText('src/command-center-brain/command-center-brain.ts');
  const generator = readText('src/command-center-brain/brain-response-generator.ts');
  const identity = readText('src/command-center-brain/product-identity-responses.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. product identity module exists', existsSync(join(ROOT, 'src/command-center-brain/product-identity-responses.ts')), 'module');
  assert('02. brain wires product identity', brain.includes('resolveProductIdentityResponse'), 'wire');
  assert('03. mandatory prompts exported', identity.includes('MANDATORY_PRODUCT_IDENTITY_PROMPTS'), 'prompts');
  assert('04. product intro copy', identity.includes('AiDevEngine helps turn software ideas into working applications'), 'intro');
  assert('05. no unified brain intro in general', !generator.includes('I am the Unified Command Center Brain'), 'general');
  assert('06. package script registered', Boolean(pkg.scripts?.['validate:command-center-identity-realignment']), 'package');

  const archExplicit = processBrainRequest({ message: 'What is DevPulse V2?' });
  assert(
    '07. architecture questions not hijacked',
    !/AiDevEngine helps turn software ideas/i.test(archExplicit.brainResponse ?? ''),
    (archExplicit.brainResponse ?? '').slice(0, 80),
  );

  const legacyArch = processBrainRequest({ message: 'Explain the ownership registry' });
  assert(
    '08. explicit architecture still available',
    /ownership|registry|architecture|governance/i.test(legacyArch.brainResponse ?? ''),
    (legacyArch.brainResponse ?? '').slice(0, 80),
  );

  let mandatoryPassCount = 0;
  let mandatoryVisionMin = 100;
  let mandatoryLeakageMax = 0;

  for (const prompt of MANDATORY_PRODUCT_IDENTITY_PROMPTS) {
    const resolved = resolveProductIdentityResponse(prompt);
    assert(`09.${prompt} routes to identity`, Boolean(resolved), prompt);

    const brainResult = processBrainRequest({ message: prompt });
    const response = brainResult.brainResponse ?? '';
    const eval_ = evaluatePromptVision(prompt, response);
    const leakageSeverity = leakageLevelSeverity(eval_.architectureLeakage);

    mandatoryVisionMin = Math.min(mandatoryVisionMin, eval_.visionAlignment);
    mandatoryLeakageMax = Math.max(mandatoryLeakageMax, leakageSeverity);
    if (eval_.passed) mandatoryPassCount += 1;

    assert(
      `10.${prompt} product-first`,
      /aidevengine/i.test(response) && !/unified command center brain/i.test(response),
      `vision=${eval_.visionAlignment} leak=${eval_.architectureLeakage}`,
    );
    assert(
      `11.${prompt} next action`,
      /next action/i.test(response),
      response.slice(0, 120),
    );
  }

  assert(
    '12. mandatory prompts pass rate',
    mandatoryPassCount >= MANDATORY_PRODUCT_IDENTITY_PROMPTS.length - 1,
    `${mandatoryPassCount}/${MANDATORY_PRODUCT_IDENTITY_PROMPTS.length}`,
  );
  assert('13. mandatory vision min ≥ 85', mandatoryVisionMin >= 85, String(mandatoryVisionMin));
  assert('14. mandatory leakage max ≤ LOW', mandatoryLeakageMax <= leakageLevelSeverity('LOW'), String(mandatoryLeakageMax));

  const identityBrain = processBrainRequest({ message: 'What is AiDevEngine?' });
  const identityText = identityBrain.brainResponse ?? '';
  const identityLeakage = assessArchitectureLeakage(identityText);
  const identityVision = scoreVisionAlignment(identityText);
  const perception = integratePerceptionSignals('identity-realignment-validator');
  const founderApproval = predictFounderApproval({
    technicalReadiness: 78,
    productReadiness: 72,
    visionAlignment: identityVision,
    customerReadiness: perception.customerReadiness,
    architectureLevel: identityLeakage.level,
    screenPurposeAvg: 75,
  });

  assert('15. identity vision ≥ 85', identityVision >= 85, String(identityVision));
  assert('16. identity leakage ≤ LOW', leakageLevelSeverity(identityLeakage.level) <= leakageLevelSeverity('LOW'), identityLeakage.level);
  assert('17. founder approval proxy ≥ 80', founderApproval.likelihood >= 80, String(founderApproval.likelihood));
  assert('18. customer readiness ≥ 80', perception.customerReadiness >= 80, String(perception.customerReadiness));

  const crm = processBrainRequest({ message: 'Build a CRM.' });
  const crmText = crm.brainResponse ?? '';
  assert(
    '19. project-centric CRM routing',
    /crm|lead|deal|account/i.test(crmText) && !/phase \d/i.test(crmText),
    crmText.slice(0, 120),
  );

  const reportPath = join(ROOT, 'architecture', 'COMMAND_CENTER_IDENTITY_REALIGNMENT_REPORT.md');
  assert('20. realignment report exists', existsSync(reportPath), reportPath);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Mandatory identity pass rate: ${mandatoryPassCount}/${MANDATORY_PRODUCT_IDENTITY_PROMPTS.length}`);
  console.log(`Identity vision: ${identityVision} | Leakage: ${identityLeakage.level}`);
  console.log('');

  if (failed.length) {
    console.log('COMMAND_CENTER_IDENTITY_REALIGNMENT_REQUIRES_FIXES');
    process.exit(1);
  }

  if (mandatoryPassCount < MANDATORY_PRODUCT_IDENTITY_PROMPTS.length) {
    console.log(PASS_LIMITED_TOKEN);
  } else {
    console.log(PASS_TOKEN);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
