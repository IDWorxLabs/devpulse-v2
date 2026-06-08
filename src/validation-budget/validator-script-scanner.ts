/**
 * Scan scripts/validate-*.ts for nested validator npm calls.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  NestedValidatorCall,
  ValidatorScriptMode,
  ValidatorScriptScanResult,
} from './types.js';
import {
  VALIDATION_MODE_MARKER_FAST,
  VALIDATION_MODE_MARKER_FULL,
} from './types.js';

const NESTED_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /execSync\s*\(\s*`npm run validate:/, label: 'execSync(`npm run validate:' },
  { regex: /execSync\s*\(\s*['"]npm run validate:/, label: 'execSync("npm run validate:' },
  { regex: /spawnSync\s*\(\s*['"]npm['"]\s*,\s*\[[^\]]*['"]run['"]\s*,\s*['"]validate:/, label: 'spawnSync(npm run validate:' },
  { regex: /execSync\s*\(\s*`npm run \$\{script\}`/, label: 'execSync(`npm run ${script}`)' },
  { regex: /execSync\s*\(\s*['"]npm run validate:/, label: 'execSync validate script' },
];

function detectScriptMode(content: string): ValidatorScriptMode {
  if (content.includes(VALIDATION_MODE_MARKER_FULL)) return 'FULL_STACK_CHECK';
  if (content.includes(VALIDATION_MODE_MARKER_FAST)) return 'FAST_FEATURE_CHECK';
  return 'UNMARKED';
}

function extractTargetScript(line: string): string | undefined {
  const match =
    line.match(/validate:([a-z0-9-]+)/) ??
    line.match(/validate:([a-z0-9-]+)/i);
  return match ? `validate:${match[1]}` : undefined;
}

export function scanValidatorScripts(scriptsDir: string): ValidatorScriptScanResult {
  const files = readdirSync(scriptsDir).filter(
    (f) => f.startsWith('validate-') && f.endsWith('.ts'),
  );

  const nestedValidatorCalls: NestedValidatorCall[] = [];

  for (const file of files) {
    const filePath = join(scriptsDir, file);
    const content = readFileSync(filePath, 'utf8');
    const scriptMode = detectScriptMode(content);
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      for (const pattern of NESTED_PATTERNS) {
        if (pattern.regex.test(line)) {
          nestedValidatorCalls.push({
            file,
            line: i + 1,
            pattern: pattern.label,
            targetScript: extractTargetScript(line),
            scriptMode,
          });
        }
      }
    }
  }

  const riskyScripts = new Set<string>();
  for (const call of nestedValidatorCalls) {
    if (call.scriptMode === 'FAST_FEATURE_CHECK') {
      riskyScripts.add(call.file);
    } else if (call.scriptMode === 'UNMARKED') {
      riskyScripts.add(call.file);
    }
  }

  let status: ValidatorScriptScanResult['status'] = 'PASS';
  const hasFastViolations = nestedValidatorCalls.some(
    (c) => c.scriptMode === 'FAST_FEATURE_CHECK',
  );
  const hasUnmarkedNested = nestedValidatorCalls.some(
    (c) => c.scriptMode === 'UNMARKED',
  );

  if (hasFastViolations) {
    status = 'FAIL';
  } else if (hasUnmarkedNested) {
    status = 'WARN';
  }

  return {
    scannedFiles: files.length,
    nestedValidatorCalls,
    status,
    riskyScripts: [...riskyScripts],
  };
}

export function isEvidenceRegistryValidatorFast(scriptsDir: string): boolean {
  const file = join(scriptsDir, 'validate-evidence-registry-foundation.ts');
  try {
    const content = readFileSync(file, 'utf8');
    const mode = detectScriptMode(content);
    const hasNested = NESTED_PATTERNS.some((p) => p.regex.test(content));
    return mode === 'FAST_FEATURE_CHECK' && !hasNested;
  } catch {
    return false;
  }
}
