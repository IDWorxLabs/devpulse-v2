import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/founder-testing-v4-orchestrator.js';
import { runFounderTestingModeV3 } from '../src/founder-testing-mode/founder-testing-v3-orchestrator.js';
import { runFounderTestingModeV2 } from '../src/founder-testing-mode/founder-testing-v2-orchestrator.js';
import { detectHumanConfusion } from '../src/founder-testing-mode/human-behavior-simulation-engine.js';
import { readFileSync as readFs } from 'node:fs';
import { join as joinPath } from 'node:path';

const ROOT = process.cwd();
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const validatorScripts = Object.keys(pkg.scripts).filter((k) => k.startsWith('validate:'));

const v4 = runFounderTestingModeV4({ rootDir: ROOT, validatorScripts });

const needles = [
  'Memory vs Project Insights',
  'Project Memory vs Project Insights',
  'No Live Preview Running',
  'Next action',
];

const issues = v4.issues.filter((i) =>
  needles.some((n) => `${i.problem} ${i.screen} ${i.copyPasteFixPrompt}`.includes(n)),
);
const confusion =
  v4.v3.confusionFindings?.filter((f: { topic: string; detail: string }) =>
    needles.some((n) => f.topic.includes(n) || f.detail.includes(n)),
  ) ?? [];

console.log('TARGET_ISSUES', JSON.stringify(issues, null, 2));
console.log('TARGET_CONFUSION', JSON.stringify(confusion, null, 2));
console.log('TOTAL_ISSUES', v4.issues.length);
console.log('TOTAL_CONFUSION', v4.v3.confusionFindings?.length ?? 0);
const v2 = runFounderTestingModeV2({ rootDir: ROOT, validatorScripts });
const v3 = runFounderTestingModeV3({ rootDir: ROOT, validatorScripts });
const publicDir = joinPath(ROOT, 'public', 'founder-reality');
const sources = {
  html: readFs(joinPath(publicDir, 'index.html'), 'utf8'),
  appJs: readFs(joinPath(publicDir, 'app.js'), 'utf8'),
  css: readFs(joinPath(publicDir, 'styles.css'), 'utf8'),
};
const humanConfusion = detectHumanConfusion(v2, sources);

console.log(
  'V2_CONFUSION_RISKS',
  JSON.stringify(
    v2.confusionRisks.filter((r) => r.screens.includes('Memory') || r.screens.includes('Insights')),
    null,
    2,
  ),
);
console.log(
  'V2_ISSUES_MEMORY',
  JSON.stringify(
    v2.issues.filter((i) => i.screen.includes('Memory') || i.screen.includes('Insights')),
    null,
    2,
  ),
);
console.log('V3_CONFUSION_FINDINGS', JSON.stringify(v3.confusionFindings, null, 2));
console.log('HUMAN_CONFUSION_DIRECT', JSON.stringify(humanConfusion, null, 2));
const verdict = issues.length === 0 && confusion.length === 0 ? 'CLEAN' : 'STALE_FINDINGS_REMAIN';
console.log('VERDICT', verdict);

const reportPath = join(ROOT, 'architecture', 'FOUNDER_TESTING_V4_FRESH_REPORT.md');
writeFileSync(reportPath, v4.reportMarkdown, 'utf8');
console.log('FRESH_REPORT', reportPath);
