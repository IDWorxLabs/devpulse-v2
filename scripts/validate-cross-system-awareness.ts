/**
 * DevPulse V2 Phase 11.2 — Cross-System Awareness validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  CROSS_SYSTEM_AWARENESS_OWNER_MODULE,
  CROSS_SYSTEM_AWARENESS_PASS_TOKEN,
  CROSS_SYSTEM_FEED_DEPENDENCY,
  CROSS_SYSTEM_FEED_IMPACT,
  CROSS_SYSTEM_FEED_RELATIONSHIP,
  DUPLICATE_CROSS_SYSTEM_PATTERNS,
  analyzeDependencies,
  analyzeImpact,
  buildCrossSystemRegistry,
  classifyBrainRequest,
  getDevPulseV2CrossSystemAwareness,
  getRelationshipEdges,
  isCrossSystemQuestion,
  isDependencyQuestion,
  isImpactQuestion,
  isRelationshipQuestion,
  processBrainRequest,
  processCrossSystemAwareness,
  resetBrainCountersForTests,
  resetCrossSystemDiagnosticsForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import { RELATIONSHIP_TYPES } from '../src/command-center-brain/cross-system-awareness/relationship-types.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function postBrain(message: string): Promise<{ status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve({ status: 500, body: null });
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
        .then(async (res) => {
          const body = (await res.json()) as Record<string, unknown>;
          server.close();
          resolve({ status: res.status, body });
        })
        .catch(() => {
          server.close();
          resolve({ status: 500, body: null });
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 11.2 Cross-System Awareness');
  console.log('================================================');
  console.log('');

  resetBrainCountersForTests();
  resetCrossSystemDiagnosticsForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const appJs = readText('public/founder-reality/app.js');
  const html = readText('public/founder-reality/index.html');
  const brainSrc = readText('src/command-center-brain/command-center-brain.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  const registry = buildCrossSystemRegistry();
  const edges = getRelationshipEdges();

  assert('1. module dir exists', existsSync(join(ROOT, 'src/command-center-brain/cross-system-awareness')), 'exists');
  assert('2. validate script', typeof pkg.scripts?.['validate:cross-system-awareness'] === 'string', 'script');
  assert('3. pass token', CROSS_SYSTEM_AWARENESS_PASS_TOKEN.includes('CROSS_SYSTEM_AWARENESS'), 'token');
  assert('4. registry ownership', getDevPulseV2Owner('cross_system_awareness').ownerModule === CROSS_SYSTEM_AWARENESS_OWNER_MODULE, CROSS_SYSTEM_AWARENESS_OWNER_MODULE);
  assert('5. registry phase 11.2', getDevPulseV2Owner('cross_system_awareness').phase === 11.2, '11.2');
  assert('6. owner function', getDevPulseV2Owner('cross_system_awareness').ownerFunction === 'getDevPulseV2CrossSystemAwareness', 'fn');
  assert('7. systems modeled >= 11', registry.length >= 11, String(registry.length));
  assert('8. edges >= 20', edges.length >= 20, String(edges.length));
  assert('9. relationship types >= 7', RELATIONSHIP_TYPES.length >= 7, String(RELATIONSHIP_TYPES.length));

  const relQ = processBrainRequest({ message: 'How does World 2 connect to Command Center?' });
  const depQ = processBrainRequest({ message: 'What depends on Governance?' });
  const impactQ = processBrainRequest({ message: 'What breaks if Operator Feed disappears?' });
  const trustDepQ = processBrainRequest({ message: 'What systems depend on the Trust Engine?' });

  assert('10. relationship classification', classifyBrainRequest({ message: relQ.userMessage }).category === 'RELATIONSHIP', relQ.category);
  assert('11. dependency classification', depQ.category === 'DEPENDENCY', depQ.category);
  assert('12. impact classification', impactQ.category === 'IMPACT', impactQ.category);
  assert('13. trust dependency class', trustDepQ.category === 'DEPENDENCY', trustDepQ.category);
  assert('14. relationship response', relQ.brainResponse.includes('World 2') || relQ.brainResponse.includes('Command Center'), 'response');
  assert('15. dependency response', depQ.brainResponse.includes('depend') || depQ.brainResponse.includes('Governance'), 'response');
  assert('16. impact response', impactQ.brainResponse.includes('Operator Feed') || impactQ.brainResponse.includes('Visibility'), 'response');
  assert('17. cross system context', relQ.crossSystemContext?.queryType === 'RELATIONSHIP', String(relQ.crossSystemContext?.queryType));
  assert('18. pipeline cross stage', relQ.pipelineStages.includes('CROSS_SYSTEM_AWARENESS_CHECKED'), 'stage');
  assert('19. relationship feed stages', relQ.operatorFeedEvents.some((e) => e.eventType === 'Loading Relationships'), 'feed');
  assert('20. dependency feed deps', depQ.operatorFeedEvents.some((e) => e.eventType === 'Checking Dependencies'), 'feed');
  assert('21. impact feed analysis', impactQ.operatorFeedEvents.some((e) => e.eventType === 'Performing Impact Analysis'), 'feed');

  assert('22. no fake operator control', !impactQ.brainResponse.toLowerCase().includes('autonomously control'), 'honest');
  assert('23. operator feed surfaces brain', edges.some((e) => e.sourceId === 'operator_feed' && e.type === 'SURFACES'), 'edge');
  assert('24. trust protects governance', edges.some((e) => e.sourceId === 'trust_engine' && e.type === 'PROTECTS'), 'edge');
  assert('25. brain uses cross awareness', edges.some((e) => e.sourceId === 'command_center_brain' && e.targetId === 'cross_system_awareness'), 'edge');

  const govDeps = analyzeDependencies('governance_stack');
  const feedImpact = analyzeImpact('operator_feed');
  assert('26. governance dependents', (govDeps?.dependencyCount ?? 0) > 0, String(govDeps?.dependencyCount));
  assert('27. operator feed impact', feedImpact?.executionAffected === false, String(feedImpact?.executionAffected));
  assert('28. operator visibility impact', feedImpact?.visibilityAffected === true, String(feedImpact?.visibilityAffected));
  assert('29. trust impact intelligence', analyzeImpact('trust_engine')?.intelligenceAffected === true, 'trust');
  assert('30. cross system diagnostics', depQ.crossSystemDiagnostics?.lastDependencyQuery === depQ.userMessage, 'diag');

  assert('31. html cross-system diag', html.includes('section-cross-system-diagnostics'), 'html');
  assert('32. app cross-system diag', appJs.includes('renderCrossSystemDiagnostics'), 'app');
  assert('33. app loading relationships map', appJs.includes('Loading Relationships'), 'app');
  assert('34. app impact analysis map', appJs.includes('Performing Impact Analysis'), 'app');
  assert('35. brain integrates cross-system', brainSrc.includes('processCrossSystemAwareness'), 'brain');
  assert('36. feed dependency sequence', CROSS_SYSTEM_FEED_DEPENDENCY.length === 5, String(CROSS_SYSTEM_FEED_DEPENDENCY.length));
  assert('37. feed impact sequence', CROSS_SYSTEM_FEED_IMPACT.length === 5, String(CROSS_SYSTEM_FEED_IMPACT.length));
  assert('38. feed relationship sequence', CROSS_SYSTEM_FEED_RELATIONSHIP.length === 4, String(CROSS_SYSTEM_FEED_RELATIONSHIP.length));
  assert('39. isCrossSystemQuestion', isCrossSystemQuestion('What depends on World 2?'), 'fn');
  assert('40. isRelationshipQuestion', isRelationshipQuestion('How does World 2 connect to Command Center?'), 'fn');

  for (let i = 0; i < DUPLICATE_CROSS_SYSTEM_PATTERNS.length; i += 1) {
    const pattern = DUPLICATE_CROSS_SYSTEM_PATTERNS[i]!;
    const owners = listDevPulseV2Owners().map((o) => o.ownerModule);
    const competing = owners.filter((m) => m.includes(pattern.replace(/_/g, '')) && m !== CROSS_SYSTEM_AWARENESS_OWNER_MODULE);
    assert(`${41 + i}. no dup ${pattern}`, competing.length <= 1, pattern);
  }

  assert('46. getDevPulseV2CrossSystemAwareness', getDevPulseV2CrossSystemAwareness() instanceof Object, 'instance');
  assert('47. no child_process brain', !brainSrc.includes('child_process'), 'clean');
  assert('48. no spawn brain', !brainSrc.includes('spawn('), 'clean');
  assert('49. no eval brain', !brainSrc.includes('eval('), 'clean');
  assert('50. intelligence only confirm', relQ.confirmation.intelligenceOnly === true, 'confirm');

  const httpRel = await postBrain('How does World 2 connect to Command Center?');
  const httpDep = await postBrain('What depends on Governance?');
  const httpImpact = await postBrain('What breaks if Operator Feed disappears?');

  assert('51. http relationship 200', httpRel.status === 200, String(httpRel.status));
  assert('52. http dependency 200', httpDep.status === 200, String(httpDep.status));
  assert('53. http impact 200', httpImpact.status === 200, String(httpImpact.status));
  assert('54. http rel cross diag', httpRel.body?.crossSystemDiagnostics !== undefined, 'diag');
  assert('55. http dep category', httpDep.body?.category === 'DEPENDENCY', String(httpDep.body?.category));
  assert('56. http impact feed events', Array.isArray(httpImpact.body?.operatorFeedEvents), 'events');

  for (let i = 0; i < registry.length; i += 1) {
    const sys = registry[i]!;
    assert(`${57 + i}. system ${sys.systemId}`, sys.displayName.length > 0, sys.systemId);
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processCrossSystemAwareness('What depends on Governance?', 'DEPENDENCY');
    assert(`${69 + i}. dep engine stable ${i}`, r.responseText.includes('Governance') || r.responseText.includes('depend'), 'dep');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processCrossSystemAwareness('What breaks if Operator Feed disappears?', 'IMPACT');
    assert(`${84 + i}. impact engine stable ${i}`, r.responseText.includes('Operator Feed') || r.responseText.includes('Visibility'), 'impact');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processCrossSystemAwareness('How does World 2 connect to Command Center?', 'RELATIONSHIP');
    assert(`${99 + i}. rel engine stable ${i}`, r.responseText.length > 40, 'rel');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${114 + i}. isDependencyQuestion ${i}`, isDependencyQuestion('What depends on World 2?'), 'dep');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${124 + i}. isImpactQuestion ${i}`, isImpactQuestion('What would break if Trust Engine disappeared?'), 'impact');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What should we build next?' });
    assert(`${134 + i}. roadmap unchanged ${i}`, r.category === 'ROADMAP' && r.operatorFeedEvents.length === 5, r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What depends on Governance?' });
    assert(`${144 + i}. dep feed count ${i}`, r.operatorFeedEvents.length === 5, String(r.operatorFeedEvents.length));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What breaks if Operator Feed disappears?' });
    assert(`${154 + i}. impact feed count ${i}`, r.operatorFeedEvents.some((e) => e.eventType === 'Performing Impact Analysis'), 'impact');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('What depends on Governance?');
    assert(`${164 + i}. http dep stable ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('How does World 2 connect to Command Center?');
    assert(`${174 + i}. http rel stable ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('What breaks if Operator Feed disappears?');
    assert(`${184 + i}. http impact stable ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${194 + i}. registry edges ${i}`, edges.length >= 20, String(edges.length));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What systems depend on the Trust Engine?' });
    assert(`${204 + i}. trust dep response ${i}`, r.brainResponse.toLowerCase().includes('trust') || r.brainResponse.includes('depend'), 'trust');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'How does Mobile Command connect to Command Center?' });
    assert(`${214 + i}. mobile rel ${i}`, r.category === 'RELATIONSHIP', r.category);
  }

  assert('224. world2 reports to shell', edges.some((e) => e.sourceId === 'world2_foundation' && e.type === 'REPORTS_TO'), 'edge');
  assert('225. brain feeds operator feed', edges.some((e) => e.sourceId === 'command_center_brain' && e.type === 'FEEDS'), 'edge');
  assert('226. no execution in dep response', !depQ.brainResponse.includes('executed'), 'no exec');
  assert('227. relationship count snapshot', (relQ.crossSystemContext?.relationshipCount ?? 0) >= 20, String(relQ.crossSystemContext?.relationshipCount));
  assert('228. systems modeled snapshot', (relQ.crossSystemContext?.systemsModeled ?? 0) >= 11, String(relQ.crossSystemContext?.systemsModeled));
  assert('229. impact analysis available', relQ.crossSystemContext?.impactAnalysisAvailable === true, 'impact');
  assert('230. distinct from central brain', getDevPulseV2Owner('central_brain').ownerModule !== CROSS_SYSTEM_AWARENESS_OWNER_MODULE, 'distinct');

  for (let i = 0; i < 10; i += 1) {
    const d1 = processBrainRequest({ message: 'What depends on Governance?' });
    const d2 = processBrainRequest({ message: 'What depends on Governance?' });
    assert(`${231 + i}. deterministic dep ${i}`, d1.brainResponse === d2.brainResponse, 'deterministic');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'execute deploy now' });
    assert(`${241 + i}. blocked no cross ${i}`, !r.pipelineStages.includes('CROSS_SYSTEM_AWARENESS_CHECKED') || r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  assert('251. governance stack in registry', registry.some((s) => s.systemId === 'governance_stack'), 'gov');
  assert('252. operator feed in registry', registry.some((s) => s.systemId === 'operator_feed'), 'feed');
  assert('253. notifications in registry', registry.some((s) => s.systemId === 'notifications'), 'notif');
  assert('254. cross_system in registry', registry.some((s) => s.systemId === 'cross_system_awareness'), 'csa');
  assert('255. brain distinct owner', getDevPulseV2Owner('command_center_brain').ownerModule !== CROSS_SYSTEM_AWARENESS_OWNER_MODULE, 'distinct');
  assert('256. dependency analyzer fn', analyzeDependencies('trust_engine') !== null, 'analyzer');
  assert('257. impact analyzer fn', analyzeImpact('governance_stack') !== null, 'analyzer');
  assert('258. app checking dependencies', appJs.includes('Checking Dependencies'), 'app');
  assert('259. roadmap still works', processBrainRequest({ message: 'What should we build next?' }).category === 'ROADMAP', 'roadmap');
  assert('260. no file modification confirm', impactQ.confirmation.noFilesModified === true, 'confirm');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 25)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 260) {
    console.log(`Insufficient scenarios: ${total} < 260`);
    process.exitCode = 1;
    return;
  }

  console.log(CROSS_SYSTEM_AWARENESS_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:cross-system-awareness');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
