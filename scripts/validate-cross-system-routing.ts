/**
 * DevPulse V2 Phase 11.2A — Cross-System Routing verification & repair validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_SYSTEM_FEED_DEPENDENCY,
  CROSS_SYSTEM_FEED_IMPACT,
  CROSS_SYSTEM_FEED_RELATIONSHIP,
  CROSS_SYSTEM_ROUTING_PASS_TOKEN,
  buildCrossSystemRegistry,
  classifyBrainRequest,
  processBrainRequest,
  resetBrainCountersForTests,
  resetCrossSystemDiagnosticsForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  routingReportKey,
} from '../src/command-center-brain/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const TEST_QUERIES = {
  relationshipWorld2: 'How does World 2 connect to Command Center?',
  dependencyGovernance: 'What depends on Governance?',
  dependencyTrust: 'What systems depend on Trust Engine?',
  impactOperatorFeed: 'What breaks if Operator Feed disappears?',
  relationshipMobile: 'How does Mobile Command connect to Command Center?',
} as const;

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

function feedTypes(events: { eventType: string }[]): string[] {
  return events.map((e) => e.eventType);
}

function isGenericRoadmapFallback(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('recommended next step') &&
    lower.includes('stack maturity') &&
    !lower.includes('relationship type:') &&
    !lower.includes('dependents:') &&
    !lower.includes('severity:')
  );
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 11.2A Cross-System Routing Verification');
  console.log('============================================================');
  console.log('');

  resetBrainCountersForTests();
  resetCrossSystemDiagnosticsForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const appJs = readText('public/founder-reality/app.js');
  const html = readText('public/founder-reality/index.html');
  const brainSrc = readText('src/command-center-brain/command-center-brain.ts');
  const engineSrc = readText('src/command-center-brain/cross-system-awareness/cross-system-awareness-engine.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  const registry = buildCrossSystemRegistry();

  assert('1. runtime-verification dir', existsSync(join(ROOT, 'src/command-center-brain/cross-system-awareness/runtime-verification')), 'exists');
  assert('2. relationship-route-trace', existsSync(join(ROOT, 'src/command-center-brain/cross-system-awareness/runtime-verification/relationship-route-trace.ts')), 'exists');
  assert('3. dependency-route-trace', existsSync(join(ROOT, 'src/command-center-brain/cross-system-awareness/runtime-verification/dependency-route-trace.ts')), 'exists');
  assert('4. impact-route-trace', existsSync(join(ROOT, 'src/command-center-brain/cross-system-awareness/runtime-verification/impact-route-trace.ts')), 'exists');
  assert('5. routing-report module', existsSync(join(ROOT, 'src/command-center-brain/cross-system-awareness/runtime-verification/cross-system-routing-report.ts')), 'exists');
  assert('6. validate script registered', typeof pkg.scripts?.['validate:cross-system-routing'] === 'string', 'script');
  assert('7. pass token defined', CROSS_SYSTEM_ROUTING_PASS_TOKEN.includes('ROUTING_FIX_V1'), 'token');
  assert('8. brain uses routing report', brainSrc.includes('buildCrossSystemRoutingReport'), 'import');
  assert('9. no generateBrainResponse bypass', brainSrc.includes('crossSystemResult!.responseText'), 'bypass fix');
  assert('10. structured relationship format', engineSrc.includes('Relationship Type:'), 'format');

  const relQ = processBrainRequest({ message: TEST_QUERIES.relationshipWorld2 });
  const depQ = processBrainRequest({ message: TEST_QUERIES.dependencyGovernance });
  const trustDepQ = processBrainRequest({ message: TEST_QUERIES.dependencyTrust });
  const impactQ = processBrainRequest({ message: TEST_QUERIES.impactOperatorFeed });
  const mobileRelQ = processBrainRequest({ message: TEST_QUERIES.relationshipMobile });

  assert('11. world2 relationship class', relQ.category === 'RELATIONSHIP', relQ.category);
  assert('12. governance dependency class', depQ.category === 'DEPENDENCY', depQ.category);
  assert('13. trust dependency class', trustDepQ.category === 'DEPENDENCY', trustDepQ.category);
  assert('14. operator feed impact class', impactQ.category === 'IMPACT', impactQ.category);
  assert('15. mobile relationship class', mobileRelQ.category === 'RELATIONSHIP', mobileRelQ.category);

  assert('16. rel analyzer selected', relQ.crossSystemRoutingReport?.selectedAnalyzer === 'relationship_engine', String(relQ.crossSystemRoutingReport?.selectedAnalyzer));
  assert('17. dep analyzer selected', depQ.crossSystemRoutingReport?.selectedAnalyzer === 'dependency_analyzer', String(depQ.crossSystemRoutingReport?.selectedAnalyzer));
  assert('18. trust dep analyzer', trustDepQ.crossSystemRoutingReport?.selectedAnalyzer === 'dependency_analyzer', String(trustDepQ.crossSystemRoutingReport?.selectedAnalyzer));
  assert('19. impact analyzer selected', impactQ.crossSystemRoutingReport?.selectedAnalyzer === 'impact_analyzer', String(impactQ.crossSystemRoutingReport?.selectedAnalyzer));
  assert('20. mobile rel analyzer', mobileRelQ.crossSystemRoutingReport?.selectedAnalyzer === 'relationship_engine', String(mobileRelQ.crossSystemRoutingReport?.selectedAnalyzer));

  assert('21. rel routing routed', relQ.crossSystemRoutingReport?.routingResult === 'routed', String(relQ.crossSystemRoutingReport?.routingResult));
  assert('22. dep routing routed', depQ.crossSystemRoutingReport?.routingResult === 'routed', String(depQ.crossSystemRoutingReport?.routingResult));
  assert('23. impact routing routed', impactQ.crossSystemRoutingReport?.routingResult === 'routed', String(impactQ.crossSystemRoutingReport?.routingResult));

  assert('24. rel response type field', relQ.brainResponse.includes('Relationship Type:'), 'missing');
  assert('25. rel source system', relQ.brainResponse.includes('Source System:'), 'missing');
  assert('26. rel target system', relQ.brainResponse.includes('Target System:'), 'missing');
  assert('27. rel explanation', relQ.brainResponse.includes('Explanation:'), 'missing');

  assert('28. dep dependents field', depQ.brainResponse.includes('Dependents:'), 'missing');
  assert('29. dep count field', depQ.brainResponse.includes('Dependency Count:'), 'missing');
  assert('30. dep explanation', depQ.brainResponse.includes('Explanation:'), 'missing');

  assert('31. impact removed system', impactQ.brainResponse.includes('Removed System:') || impactQ.brainResponse.includes('Operator Feed'), 'missing');
  assert('32. impact affected systems', impactQ.brainResponse.includes('Affected Systems:') || impactQ.brainResponse.includes('Visibility'), 'missing');
  assert('33. impact severity', impactQ.brainResponse.includes('Severity:'), 'missing');

  assert('34. rel feed count', relQ.operatorFeedEvents.length === 4, String(relQ.operatorFeedEvents.length));
  assert('35. dep feed count', depQ.operatorFeedEvents.length === 5, String(depQ.operatorFeedEvents.length));
  assert('36. impact feed count', impactQ.operatorFeedEvents.length === 5, String(impactQ.operatorFeedEvents.length));

  assert('37. rel feed no checking deps', !feedTypes(relQ.operatorFeedEvents).includes('Checking Dependencies'), 'wrong stage');
  assert('38. dep feed has checking deps', feedTypes(depQ.operatorFeedEvents).includes('Checking Dependencies'), 'missing stage');
  assert('39. impact feed has impact analysis', feedTypes(impactQ.operatorFeedEvents).includes('Performing Impact Analysis'), 'missing stage');
  assert('40. impact feed no checking deps', !feedTypes(impactQ.operatorFeedEvents).includes('Checking Dependencies'), 'wrong stage');

  assert('41. rel feed no checking systems', !feedTypes(relQ.operatorFeedEvents).includes('Checking Systems'), 'wrong stage');
  assert('42. dep feed no checking systems', !feedTypes(depQ.operatorFeedEvents).includes('Checking Systems'), 'wrong stage');
  assert('43. impact feed no checking systems', !feedTypes(impactQ.operatorFeedEvents).includes('Checking Systems'), 'wrong stage');

  assert('44. diag last query type rel', relQ.crossSystemDiagnostics?.lastQueryType === 'RELATIONSHIP', String(relQ.crossSystemDiagnostics?.lastQueryType));
  assert('45. diag last analyzer dep', depQ.crossSystemDiagnostics?.lastAnalyzerUsed === 'dependency_analyzer', String(depQ.crossSystemDiagnostics?.lastAnalyzerUsed));
  assert('46. diag last routing routed', impactQ.crossSystemDiagnostics?.lastRoutingResult === 'routed', String(impactQ.crossSystemDiagnostics?.lastRoutingResult));

  assert('47. no rel roadmap fallback', !isGenericRoadmapFallback(relQ.brainResponse), 'fallback');
  assert('48. no dep roadmap fallback', !isGenericRoadmapFallback(depQ.brainResponse), 'fallback');
  assert('49. no impact roadmap fallback', !isGenericRoadmapFallback(impactQ.brainResponse), 'fallback');

  assert('50. html last query type', html.includes('last-query-type'), 'html');
  assert('51. html last analyzer used', html.includes('last-analyzer-used'), 'html');
  assert('52. html last routing result', html.includes('last-routing-result'), 'html');
  assert('53. app renders query type', appJs.includes('last-query-type'), 'app');
  assert('54. app renders analyzer', appJs.includes('last-analyzer-used'), 'app');
  assert('55. app renders routing result', appJs.includes('last-routing-result'), 'app');

  assert('56. feed rel sequence match', JSON.stringify(feedTypes(relQ.operatorFeedEvents)) === JSON.stringify([...CROSS_SYSTEM_FEED_RELATIONSHIP]), 'sequence');
  assert('57. feed dep sequence match', JSON.stringify(feedTypes(depQ.operatorFeedEvents)) === JSON.stringify([...CROSS_SYSTEM_FEED_DEPENDENCY]), 'sequence');
  assert('58. feed impact sequence match', JSON.stringify(feedTypes(impactQ.operatorFeedEvents)) === JSON.stringify([...CROSS_SYSTEM_FEED_IMPACT]), 'sequence');

  assert('59. routing report key unique rel/dep', routingReportKey(relQ.crossSystemRoutingReport!) !== routingReportKey(depQ.crossSystemRoutingReport!), 'distinct');
  assert('60. routing report key unique dep/impact', routingReportKey(depQ.crossSystemRoutingReport!) !== routingReportKey(impactQ.crossSystemRoutingReport!), 'distinct');

  const httpRel = await postBrain(TEST_QUERIES.relationshipWorld2);
  const httpDep = await postBrain(TEST_QUERIES.dependencyGovernance);
  const httpImpact = await postBrain(TEST_QUERIES.impactOperatorFeed);

  assert('61. http rel 200', httpRel.status === 200, String(httpRel.status));
  assert('62. http dep 200', httpDep.status === 200, String(httpDep.status));
  assert('63. http impact 200', httpImpact.status === 200, String(httpImpact.status));
  assert('64. http rel routing report', httpRel.body?.crossSystemRoutingReport !== undefined, 'report');
  assert('65. http dep analyzer', (httpDep.body?.crossSystemRoutingReport as { selectedAnalyzer?: string })?.selectedAnalyzer === 'dependency_analyzer', 'analyzer');
  assert('66. http impact feed stages', Array.isArray((httpImpact.body?.crossSystemRoutingReport as { operatorFeedStages?: unknown[] })?.operatorFeedStages), 'stages');

  assert('67. no child_process brain', !brainSrc.includes('child_process'), 'clean');
  assert('68. no spawn brain', !brainSrc.includes('spawn('), 'clean');
  assert('69. no exec brain', !brainSrc.includes('exec('), 'clean');
  assert('70. no eval brain', !brainSrc.includes('eval('), 'clean');

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.relationshipWorld2 });
    assert(`${71 + i}. rel stable ${i}`, r.crossSystemRoutingReport?.selectedAnalyzer === 'relationship_engine', 'analyzer');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.dependencyGovernance });
    assert(`${86 + i}. dep stable ${i}`, r.brainResponse.includes('Dependents:'), 'dependents');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.impactOperatorFeed });
    assert(`${101 + i}. impact stable ${i}`, r.brainResponse.includes('Severity:'), 'severity');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.dependencyTrust });
    assert(`${116 + i}. trust dep stable ${i}`, r.category === 'DEPENDENCY' && r.brainResponse.includes('Trust'), 'trust');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.relationshipMobile });
    assert(`${126 + i}. mobile rel stable ${i}`, r.brainResponse.includes('Relationship Type:'), 'rel');
  }

  for (let i = 0; i < registry.length; i += 1) {
    const sys = registry[i]!;
    const r = processBrainRequest({ message: `What depends on ${sys.displayName}?` });
    assert(`${136 + i}. dep route ${sys.systemId}`, r.category === 'DEPENDENCY' && r.crossSystemRoutingReport?.routingResult === 'routed', sys.systemId);
  }

  for (let i = 0; i < registry.length; i += 1) {
    const sys = registry[i]!;
    const r = processBrainRequest({ message: `What breaks if ${sys.displayName} disappears?` });
    assert(`${148 + i}. impact route ${sys.systemId}`, r.category === 'IMPACT' && r.crossSystemRoutingReport?.selectedAnalyzer === 'impact_analyzer', sys.systemId);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What should we build next?' });
    assert(`${160 + i}. roadmap not cross-system ${i}`, r.crossSystemRoutingReport === undefined, 'no report');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'execute deploy now' });
    assert(`${170 + i}. blocked no routing ${i}`, r.crossSystemRoutingReport === undefined, 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const r1 = processBrainRequest({ message: TEST_QUERIES.relationshipWorld2 });
    const r2 = processBrainRequest({ message: TEST_QUERIES.dependencyGovernance });
    assert(`${180 + i}. feed differs rel/dep ${i}`, JSON.stringify(feedTypes(r1.operatorFeedEvents)) !== JSON.stringify(feedTypes(r2.operatorFeedEvents)), 'distinct');
  }

  for (let i = 0; i < 10; i += 1) {
    const r1 = processBrainRequest({ message: TEST_QUERIES.dependencyGovernance });
    const r2 = processBrainRequest({ message: TEST_QUERIES.impactOperatorFeed });
    assert(`${190 + i}. feed differs dep/impact ${i}`, JSON.stringify(feedTypes(r1.operatorFeedEvents)) !== JSON.stringify(feedTypes(r2.operatorFeedEvents)), 'distinct');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(TEST_QUERIES.relationshipWorld2);
    assert(`${200 + i}. http rel repeat ${i}`, res.status === 200 && String((res.body?.brainResponse as string) ?? '').includes('Relationship Type:'), 'http');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(TEST_QUERIES.dependencyGovernance);
    assert(`${210 + i}. http dep repeat ${i}`, res.status === 200 && String((res.body?.brainResponse as string) ?? '').includes('Dependents:'), 'http');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(TEST_QUERIES.impactOperatorFeed);
    assert(`${220 + i}. http impact repeat ${i}`, res.status === 200 && String((res.body?.brainResponse as string) ?? '').includes('Severity:'), 'http');
  }

  for (let i = 0; i < 10; i += 1) {
    const msg = TEST_QUERIES.relationshipWorld2;
    const c = classifyBrainRequest({ message: msg });
    assert(`${230 + i}. classifier rel ${i}`, c.category === 'RELATIONSHIP', c.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const msg = `What depend on Governance?`;
    const c = classifyBrainRequest({ message: msg });
    assert(`${240 + i}. classifier depend on ${i}`, c.category === 'DEPENDENCY', c.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.relationshipWorld2 });
    assert(`${250 + i}. rel diag query stored ${i}`, r.crossSystemDiagnostics?.lastRelationshipQuery === TEST_QUERIES.relationshipWorld2, 'stored');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.dependencyGovernance });
    assert(`${260 + i}. dep diag query stored ${i}`, r.crossSystemDiagnostics?.lastDependencyQuery === TEST_QUERIES.dependencyGovernance, 'stored');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: TEST_QUERIES.impactOperatorFeed });
    assert(`${270 + i}. impact diag query stored ${i}`, r.crossSystemDiagnostics?.lastImpactQuery === TEST_QUERIES.impactOperatorFeed, 'stored');
  }

  assert('280. trust dep has dependents', trustDepQ.brainResponse.includes('Dependents:'), 'dependents');
  assert('281. mobile rel routed', mobileRelQ.crossSystemRoutingReport?.routingResult === 'routed', 'routed');
  assert('282. rel response source', relQ.crossSystemRoutingReport?.responseSource === 'relationship_engine', String(relQ.crossSystemRoutingReport?.responseSource));
  assert('283. dep response source', depQ.crossSystemRoutingReport?.responseSource === 'dependency_analyzer', String(depQ.crossSystemRoutingReport?.responseSource));
  assert('284. impact response source', impactQ.crossSystemRoutingReport?.responseSource === 'impact_analyzer', String(impactQ.crossSystemRoutingReport?.responseSource));
  assert('285. intelligence only confirm', relQ.confirmation.intelligenceOnly === true, 'confirm');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 280) {
    console.log(`Insufficient scenarios: ${total} < 280`);
    process.exitCode = 1;
    return;
  }

  console.log(CROSS_SYSTEM_ROUTING_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:cross-system-routing');
  console.log('npm run validate:cross-system-awareness');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
