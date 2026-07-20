/**
 * Universal Business Rule Engine V1 — behavioral verification.
 *
 * Structural presence is never counted as behavioral proof: verification
 * actually executes the descriptor against the deterministic engine and also
 * inspects generated surfaces for static rule shells.
 */

import { evaluateRule } from './business-rule-evaluation-engine.js';
import { isExecutableRuleClassification } from './business-rule-graph-validator.js';
import { collectExpressionInputs } from './business-rule-expression-model.js';
import type {
  UniversalBusinessRuleBehaviorVerificationResult,
  UniversalBusinessRuleDescriptor,
} from './universal-business-rule-types.js';
import type { RuleRuntimeValue } from './business-rule-operator-registry.js';

export interface BusinessRuleGeneratedSources {
  readonly moduleRules: string;
  readonly serviceSource: string;
  readonly componentFragment: string;
  readonly sharedEvaluator: string;
}

function sampleInputsFor(descriptor: UniversalBusinessRuleDescriptor): Record<string, RuleRuntimeValue> {
  const inputs: Record<string, RuleRuntimeValue> = {};
  for (const def of descriptor.inputDefinitions) {
    switch (def.type) {
      case 'string':
      case 'identifier':
        inputs[def.name] = 'sample-value';
        break;
      case 'date':
        inputs[def.name] = def.name.toLowerCase().includes('end') ? '2001-01-02T00:00:00.000Z' : '2001-01-01T00:00:00.000Z';
        break;
      case 'number':
        inputs[def.name] = 10;
        break;
      case 'integer':
        inputs[def.name] = def.name.toLowerCase().includes('link') ? 0 : 1;
        break;
      case 'boolean':
        inputs[def.name] = true;
        break;
      case 'collection':
        inputs[def.name] = def.name.toLowerCase().includes('step') ? [true, true] : [1, 2, 3];
        break;
      default:
        inputs[def.name] = null;
    }
  }
  return inputs;
}

export function verifyBusinessRuleBehavior(
  descriptor: UniversalBusinessRuleDescriptor,
  sources: BusinessRuleGeneratedSources,
): UniversalBusinessRuleBehaviorVerificationResult {
  const checks: { id: string; passed: boolean; detail: string }[] = [];
  const check = (id: string, passed: boolean, detail: string) => checks.push({ id, passed, detail });

  if (!isExecutableRuleClassification(descriptor.supportClassification)) {
    const isBlocked =
      descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY' ||
      descriptor.supportClassification === 'EXTENSION_POINT_REQUIRED';
    const isInvalid = descriptor.supportClassification === 'INVALID_RULE_CONTRACT';
    const result = evaluateRule(descriptor, {});
    check(
      'non-executable-explicit',
      result.status === 'BLOCKED' || result.status === 'INVALID' || result.status === 'NOT_EVALUATED',
      `Non-executable rule evaluates to explicit ${result.status}, never silent success`,
    );
    check(
      'non-executable-evidence',
      sources.moduleRules.includes(descriptor.ruleId),
      'Non-executable rule retained as explicit evidence in generated module',
    );
    return {
      readOnly: true,
      ruleId: descriptor.ruleId,
      classification: isBlocked ? 'BLOCKED_BY_CAPABILITY' : isInvalid ? 'INVALID' : 'PARTIALLY_VERIFIED',
      passed: checks.every((c) => c.passed),
      checks,
    };
  }

  // Behavioral execution: run the rule twice with identical inputs.
  const inputs = sampleInputsFor(descriptor);
  const first = evaluateRule(descriptor, inputs);
  const second = evaluateRule(descriptor, inputs);
  check(
    'deterministic-evaluation',
    JSON.stringify(first) === JSON.stringify(second),
    'Identical inputs produce identical results',
  );
  check(
    'no-silent-error-success',
    first.status !== 'ERROR' || first.violations.length > 0,
    'Errors carry explicit violations',
  );
  check(
    'executable-produces-outcome',
    first.status === 'PASSED' || first.status === 'FAILED' || first.status === 'VALUE',
    `Executable rule produces a real outcome (got ${first.status}: ${first.explanation})`,
  );

  // Expression inputs must all be declared.
  const referenced = collectExpressionInputs(descriptor.expression);
  const declared = new Set(descriptor.inputDefinitions.map((d) => d.name));
  check(
    'inputs-declared',
    referenced.every((name) => declared.has(name)),
    'Every expression input is declared and typed',
  );

  check(
    'descriptor-materialized',
    sources.moduleRules.includes(descriptor.ruleId),
    'Rule descriptor is materialized into the generated module',
  );

  const enforcedAtService = descriptor.enforcementPoints.some((p) =>
    ['SERVICE_CREATE', 'SERVICE_UPDATE', 'SERVICE_DELETE', 'PERSISTENCE_COMMIT'].includes(p),
  );
  if (enforcedAtService) {
    check(
      'service-boundary-enforced',
      /enforce\w+BusinessRules\('SERVICE_(CREATE|UPDATE|DELETE)'/.test(sources.serviceSource),
      'Service boundary invokes rule enforcement before persistence',
    );
  }

  const passed = checks.every((c) => c.passed);
  return {
    readOnly: true,
    ruleId: descriptor.ruleId,
    classification: passed ? 'BEHAVIORALLY_VERIFIED' : 'FAILED',
    passed,
    checks,
  };
}

/** Static-rule shell detection over B6-generated surfaces. */
export function detectStaticBusinessRuleShell(source: string): string[] {
  const findings: string[] = [];
  if (/TODO|FIXME|placeholder/i.test(source)) {
    findings.push('generated rule surface contains TODO/placeholder markers');
  }
  if (/return\s+true;?\s*\/\/\s*always/i.test(source)) {
    findings.push('rule evaluator returns hardcoded always-true result');
  }
  if (/catch\s*\([^)]*\)\s*\{\s*\}/m.test(source)) {
    findings.push('rule surface swallows errors silently');
  }
  if (/recordCount\s*=\s*\d+\s*;/.test(source)) {
    findings.push('derived record count assigned from static literal');
  }
  return findings;
}

/** Generic Engineering Intelligence gap diagnosis for failed rule materialization. */
export function diagnoseBusinessRuleGenerationGaps(
  descriptors: readonly UniversalBusinessRuleDescriptor[],
  verifications: readonly UniversalBusinessRuleBehaviorVerificationResult[],
): string[] {
  const gaps: string[] = [];
  for (const descriptor of descriptors) {
    if (descriptor.supportClassification === 'INVALID_RULE_CONTRACT') {
      gaps.push(descriptor.blockedReason ?? 'invalid_rule_contract');
    }
    if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
      gaps.push(descriptor.blockedReason ?? 'blocked_by_future_capability');
    }
  }
  for (const verification of verifications) {
    if (verification.classification === 'FAILED') {
      for (const check of verification.checks.filter((c) => !c.passed)) {
        gaps.push(`missing_behavioral_verification:${verification.ruleId}:${check.id}`);
      }
    }
  }
  return [...new Set(gaps)];
}
