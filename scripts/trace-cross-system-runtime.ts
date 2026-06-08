/**
 * Phase 11.2A — Runtime wiring trace (read-only diagnostic).
 * Traces: classifier → analyzer → formatter → API → simulated UI render.
 */

import { classifyBrainRequest, processBrainRequest, processCrossSystemAwareness } from '../src/command-center-brain/index.js';
import { generateBrainResponse } from '../src/command-center-brain/brain-response-generator.js';
import { getCommandCenterAwareSystems } from '../src/command-center-brain/brain-system-awareness.js';
import { getBrainRoadmapContext } from '../src/command-center-brain/brain-roadmap-awareness.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const QUERIES = [
  'How does World 2 connect to Command Center?',
  'What depends on Governance?',
  'What breaks if Operator Feed disappears?',
];

function isGenericBrainOutput(text: string): boolean {
  const markers = ['Recommended next step', 'Stack maturity', 'Phase 11.2', 'Current phase'];
  const structured = ['Relationship Type:', 'Dependents:', 'Severity:', 'Removed System:'];
  const hasGeneric = markers.some((m) => text.includes(m));
  const hasStructured = structured.some((m) => text.includes(m));
  return hasGeneric && !hasStructured;
}

function simulateAppendChatMessage(brainResponse: string): { className: string; textContent: string } {
  return { className: 'chat-message brain', textContent: brainResponse };
}

async function postBrain(message: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('no addr'));
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
          resolve({ status: res.status, ...body });
        })
        .catch((e) => {
          server.close();
          reject(e);
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('=== Phase 11.2A Runtime Wiring Trace ===\n');

  for (const query of QUERIES) {
    console.log('═'.repeat(72));
    console.log(`QUERY: "${query}"`);
    console.log('═'.repeat(72));

    const classification = classifyBrainRequest({ message: query });
    console.log('\n[1] CLASSIFIER');
    console.log(`    category: ${classification.category}`);
    console.log(`    signals:  ${classification.matchedSignals.join(', ')}`);

    const crossDirect = processCrossSystemAwareness(
      query,
      classification.category as 'DEPENDENCY' | 'IMPACT' | 'RELATIONSHIP',
    );
    console.log('\n[2] CROSS-SYSTEM ANALYZER (direct call)');
    console.log(`    analyzerUsed:   ${crossDirect.analyzerUsed}`);
    console.log(`    responseSource: ${crossDirect.responseSource}`);
    console.log(`    formatted (first 400 chars):`);
    console.log('    ' + crossDirect.responseText.slice(0, 400).replace(/\n/g, '\n    '));

    const genericIfUsed = generateBrainResponse(
      query,
      classification,
      getCommandCenterAwareSystems(),
      getBrainRoadmapContext(),
    );
    console.log('\n[3] GENERATE BRAIN RESPONSE (what generic path would produce)');
    console.log(`    would be generic: ${isGenericBrainOutput(genericIfUsed)}`);
    console.log(`    first 200 chars: ${genericIfUsed.slice(0, 200).replace(/\n/g, ' ')}`);

    const result = processBrainRequest({ message: query });
    console.log('\n[4] processBrainRequest → brainResponse');
    console.log(`    category:           ${result.category}`);
    console.log(`    selectedAnalyzer:   ${result.crossSystemRoutingReport?.selectedAnalyzer ?? 'N/A'}`);
    console.log(`    routingResult:      ${result.crossSystemRoutingReport?.routingResult ?? 'N/A'}`);
    console.log(`    brainResponse === analyzer output: ${result.brainResponse === crossDirect.responseText}`);
    console.log(`    brainResponse === generic output:  ${result.brainResponse === genericIfUsed}`);
    console.log(`    is structured: ${result.brainResponse.includes('Relationship Type:') || result.brainResponse.includes('Dependents:') || result.brainResponse.includes('Severity:')}`);
    console.log(`    brainResponse (first 400 chars):`);
    console.log('    ' + result.brainResponse.slice(0, 400).replace(/\n/g, '\n    '));

    const http = await postBrain(query);
    const apiBrainResponse = http.brainResponse as string;
    console.log('\n[5] HTTP POST /api/brain/respond');
    console.log(`    status: ${http.status}`);
    console.log(`    API brainResponse === processBrainRequest: ${apiBrainResponse === result.brainResponse}`);
    console.log(`    API brainResponse === analyzer output:     ${apiBrainResponse === crossDirect.responseText}`);

    const rendered = simulateAppendChatMessage(apiBrainResponse);
    console.log('\n[6] UI RENDER (appendChatMessage simulation)');
    console.log(`    div.className:   ${rendered.className}`);
    console.log(`    div.textContent === API brainResponse: ${rendered.textContent === apiBrainResponse}`);
    console.log(`    rendered (first 300 chars): ${rendered.textContent.slice(0, 300).replace(/\n/g, ' ')}`);

    const replacementDetected =
      result.brainResponse !== crossDirect.responseText ||
      apiBrainResponse !== crossDirect.responseText ||
      rendered.textContent !== crossDirect.responseText;

    console.log('\n[7] REPLACEMENT CHECK');
    if (replacementDetected) {
      console.log('    ⚠ REPLACEMENT DETECTED between analyzer and UI');
      if (result.brainResponse !== crossDirect.responseText) {
        console.log('    → at processBrainRequest (brainResponse assignment)');
      }
      if (apiBrainResponse !== result.brainResponse) {
        console.log('    → at brain-api-handler (JSON serialization)');
      }
      if (rendered.textContent !== apiBrainResponse) {
        console.log('    → at appendChatMessage (UI render)');
      }
    } else {
      console.log('    ✓ No replacement — analyzer output flows intact to UI');
    }
    console.log('');
  }

  console.log('═'.repeat(72));
  console.log('ROUTING DECISION POINT (command-center-brain.ts lines 205-209):');
  console.log('  brainResponse = isCrossSystem ? crossSystemResult!.responseText : generateBrainResponse(...)');
  console.log('  Replacement ONLY occurs when isCrossSystem=false (misclassification or blocked).');
  console.log('═'.repeat(72));
}

main().catch(console.error);
