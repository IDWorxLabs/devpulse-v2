/**
 * Discovers interactive controls from generated feature source — no app-specific logic.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface DiscoveredControl {
  readOnly: true;
  label: string;
  selector: string;
  kind: 'button' | 'display' | 'input';
}

export interface DiscoveredModuleInteractions {
  readOnly: true;
  moduleId: string;
  controls: DiscoveredControl[];
  displaySelector: string | null;
}

function readFeatureSources(workspaceDir: string, moduleId: string): string {
  const dir = join(workspaceDir, 'src/features', moduleId);
  if (!existsSync(dir)) return '';
  const parts: string[] = [];
  for (const file of readdirSync(dir)) {
    if (!/\.(tsx|ts|jsx|js)$/.test(file)) continue;
    parts.push(readFileSync(join(dir, file), 'utf8'));
  }
  return parts.join('\n');
}

export function discoverModuleInteractions(
  workspaceDir: string,
  moduleId: string,
): DiscoveredModuleInteractions {
  const source = readFeatureSources(workspaceDir, moduleId);
  const controls: DiscoveredControl[] = [];
  let displaySelector: string | null = null;

  const testIdMatches = source.matchAll(/data-testid=["']([^"']+)["']/g);
  for (const match of testIdMatches) {
    const testId = match[1]!;
    const selector = `[data-testid="${testId}"]`;
    if (/display|result|output|screen/i.test(testId)) {
      displaySelector = selector;
      controls.push({ readOnly: true, label: testId, selector, kind: 'display' });
    } else if (/input|field/i.test(testId)) {
      controls.push({ readOnly: true, label: testId, selector, kind: 'input' });
    }
  }

  const buttonLabelMatches = source.matchAll(/\blabel:\s*['"]([^'"]+)['"]/g);
  for (const match of buttonLabelMatches) {
    const label = match[1]!;
    controls.push({
      readOnly: true,
      label,
      selector: `[data-digit="${label}"], [data-operator="${label}"], button:has-text("${label}")`,
      kind: 'button',
    });
  }

  const outputTag = source.includes('<output');
  if (outputTag && !displaySelector) {
    displaySelector = 'output, [role="status"]';
    controls.push({ readOnly: true, label: 'output', selector: displaySelector, kind: 'display' });
  }

  return { readOnly: true, moduleId, controls, displaySelector };
}

export function discoverPromptSemanticHints(workspaceDir: string, moduleId: string): string[] {
  const source = readFeatureSources(workspaceDir, moduleId);
  const match = source.match(/data-prompt-terms=["']([^"']+)["']/);
  if (!match) return [];
  return match[1]!
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
}

export function deriveSmokeButtonSequence(
  interactions: DiscoveredModuleInteractions,
  _requiredUiTerms: string[],
): string[] {
  const buttons = interactions.controls.filter((c) => c.kind === 'button');
  const labels = buttons.map((b) => b.label);
  const digits = labels.filter((l) => /^\d$/.test(l));
  const ops = labels.filter((l) => ['+', '-', '×', '÷', '*', '/'].includes(l));
  const equals = labels.find((l) => l === '=' || /^equals$/i.test(l));
  if (digits.length >= 2 && ops.length >= 1 && equals) {
    const op = ops.includes('+') ? '+' : ops[0]!;
    let left: string;
    let right: string;
    if (op === '+' && digits.includes('2') && digits.includes('3')) {
      left = '2';
      right = '3';
    } else {
      const sorted = [...digits].sort((a, b) => Number(a) - Number(b));
      left = sorted[0]!;
      right = sorted.find((digit) => digit !== left) ?? sorted[1]!;
    }
    return [left, op, right, equals];
  }
  return [];
}

export function expectedArithmeticResult(sequence: string[]): string | null {
  if (sequence.length !== 4) return null;
  const left = Number(sequence[0]);
  const op = sequence[1];
  const right = Number(sequence[2]);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
  switch (op) {
    case '+':
      return String(left + right);
    case '-':
      return String(left - right);
    case '×':
    case '*':
      return String(left * right);
    case '÷':
    case '/':
      return right === 0 ? 'Error' : String(left / right);
    default:
      return null;
  }
}
