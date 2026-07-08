/**
 * Builds contract-derived validation steps — no application-specific logic.
 */

import type { E2EContractExpectationBundle, E2EValidationStep } from './e2e-build-reality-types.js';
import {
  deriveSmokeButtonSequence,
  discoverModuleInteractions,
  expectedArithmeticResult,
} from './feature-source-interaction-discovery.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function workspaceSourceContains(workspaceDir: string, fragment: string): boolean {
  const featuresPath = join(workspaceDir, 'src/features');
  if (!existsSync(featuresPath)) return false;
  const stack = [featuresPath];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        if (readFileSync(full, 'utf8').includes(fragment)) return true;
      }
    }
  }
  return false;
}

export function buildContractDerivedValidationPlan(input: {
  expectations: E2EContractExpectationBundle;
  workspaceDir: string;
}): E2EValidationStep[] {
  const steps: E2EValidationStep[] = [];
  const { expectations, workspaceDir } = input;
  const discoveredPrimary = expectations.primaryModuleId
    ? discoverModuleInteractions(workspaceDir, expectations.primaryModuleId)
    : null;
  const discoveredButtonLabels = new Set(
    discoveredPrimary?.controls.filter((c) => c.kind === 'button').map((c) => c.label) ?? [],
  );
  const semanticHints = new Set(
    expectations.interactionHints.map((hint) => hint.toLowerCase()),
  );

  for (const module of expectations.featureModules) {
    steps.push({
      readOnly: true,
      id: `feature-mounted-${module.id}`,
      kind: 'feature-mounted',
      label: `Feature module "${module.id}" is mounted in DOM`,
      critical: true,
      moduleId: module.id,
      uiTerm: null,
      buttonLabels: [],
      expectedDisplayValue: null,
      actionVerb: null,
      selectors: {
        featureRoot: `[data-feature-module="${module.id}"], [data-root-feature="${module.id}"]`,
      },
    });
    steps.push({
      readOnly: true,
      id: `route-${module.id}`,
      kind: 'route-registered',
      label: `Route "${module.route}" registered for module "${module.id}"`,
      critical: true,
      moduleId: module.id,
      uiTerm: null,
      buttonLabels: [],
      expectedDisplayValue: null,
      actionVerb: null,
      selectors: { route: module.route },
    });
  }

  if (expectations.mountMode === 'direct-feature') {
    steps.push({
      readOnly: true,
      id: 'no-generic-shell',
      kind: 'no-generic-shell',
      label: 'Generic blueprint welcome shell is not the primary visible surface',
      critical: true,
      moduleId: expectations.primaryModuleId,
      uiTerm: null,
      buttonLabels: [],
      expectedDisplayValue: null,
      actionVerb: null,
      selectors: {
        welcomeShell: '[data-blueprint="welcome-screen"]',
        modularShellCopy: 'modular application shell',
      },
    });
  }

  for (const term of expectations.requiredUiTerms.slice(0, 24)) {
    if (term.length < 1) continue;
    const normalizedTerm = term.toLowerCase();
    const moduleId = expectations.primaryModuleId?.toLowerCase() ?? '';
    const moduleAligned =
      Boolean(moduleId) &&
      (normalizedTerm === moduleId ||
        normalizedTerm === moduleId.replace(/-/g, ' ') ||
        normalizedTerm.replace(/\s+/g, '-') === moduleId);
    const discoverableControl = discoveredButtonLabels.has(term);
    const operatorOrDigit = /^[\d+\-×÷=]$/.test(term) && discoveredButtonLabels.has(term);
    const semanticOnly = semanticHints.has(normalizedTerm) && !discoverableControl && !operatorOrDigit;
    steps.push({
      readOnly: true,
      id: `ui-term-${term.replace(/[^a-z0-9]+/gi, '-')}`,
      kind: 'ui-term-visible',
      label: `Required UI term "${term}" visible in rendered application`,
      critical: Boolean(!semanticOnly && (moduleAligned || discoverableControl || operatorOrDigit)),
      moduleId: expectations.primaryModuleId,
      uiTerm: term,
      buttonLabels: [],
      expectedDisplayValue: null,
      actionVerb: null,
      selectors: {},
    });
  }

  for (const verb of expectations.requiredActionVerbs) {
    if (!['create', 'update', 'delete', 'search', 'complete'].includes(verb)) continue;
    const moduleId = expectations.primaryModuleId ?? expectations.featureModules[0]?.id ?? 'record';
    const slug = moduleId.replace(/-/g, '');
    const inputTestId = `data-testid="${slug}-input"`;
    const addTestId = `data-testid="add-${slug}-button"`;
    const hasCrudControls =
      workspaceSourceContains(workspaceDir, inputTestId) &&
      workspaceSourceContains(workspaceDir, addTestId);
    if (!hasCrudControls && verb === 'create') continue;
    steps.push({
      readOnly: true,
      id: `crud-${verb}`,
      kind: 'crud-action',
      label: `Required "${verb}" action controls discoverable in feature source`,
      critical: hasCrudControls && verb === 'create',
      moduleId: expectations.primaryModuleId,
      uiTerm: null,
      buttonLabels: [],
      expectedDisplayValue: null,
      actionVerb: verb,
      selectors: {
        input: `[data-testid="${slug}-input"]`,
        addButton: `[data-testid="add-${slug}-button"]`,
        recordText: `[data-testid="${slug}-text"]`,
      },
    });
  }

  if (expectations.primaryModuleId) {
    const discovered = discoveredPrimary ?? discoverModuleInteractions(workspaceDir, expectations.primaryModuleId);
    const sequence = deriveSmokeButtonSequence(discovered, expectations.requiredUiTerms);
    const expected = expectedArithmeticResult(sequence);
    if (sequence.length === 4 && expected) {
      steps.push({
        readOnly: true,
        id: 'contract-derived-interaction-sequence',
        kind: 'button-sequence',
        label: `Interactive workflow executes: ${sequence.join(' ')} → ${expected}`,
        critical: true,
        moduleId: expectations.primaryModuleId,
        uiTerm: null,
        buttonLabels: sequence,
        expectedDisplayValue: expected,
        actionVerb: null,
        selectors: {
          display: discovered.displaySelector ?? '[data-testid*="display"], output',
        },
      });
    }
  }

  for (const outcome of expectations.outcomeLabels.slice(0, 6)) {
    steps.push({
      readOnly: true,
      id: `outcome-${outcome.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}`,
      kind: 'outcome-visible',
      label: `Contract outcome achievable: ${outcome}`,
      critical: false,
      moduleId: expectations.primaryModuleId,
      uiTerm: null,
      buttonLabels: [],
      expectedDisplayValue: null,
      actionVerb: null,
      selectors: {},
    });
  }

  return steps;
}

export function listGenericShellMarkers(): string[] {
  return [
    'modular application shell with navigation',
    'a modular application shell',
    'get started',
    'data-blueprint="welcome-screen"',
  ];
}
