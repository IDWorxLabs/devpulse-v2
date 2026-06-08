/**
 * Expected rules engine — evaluates expected architecture rules.
 * Read-only observer. Does not modify architecture.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import type { DriftAnalysisInput, GateRecord } from './types.js';
import { PROTECTED_DOMAINS } from './types.js';

export interface ExpectedRulesResult {
  valid: boolean;
  evaluatedRules: string[];
  ruleViolations: string[];
  gates: GateRecord[];
  protectedDomainsChecked: string[];
}

export function expectedRulesKey(rules: string[]): string {
  return rules.slice().sort().join('|');
}

export function evaluateExpectedArchitectureRules(input: DriftAnalysisInput): ExpectedRulesResult {
  const gates: GateRecord[] = [];
  const evaluatedRules = input.expectedArchitectureRules.filter((r) => r?.trim()).map((r) => r.trim());
  const ruleViolations: string[] = [];
  const owners = listDevPulseV2Owners();
  const protectedDomainsChecked: string[] = [];

  for (const domain of PROTECTED_DOMAINS) {
    protectedDomainsChecked.push(domain);
    const owner = owners.find((o) => o.domain === domain);
    if (!owner) {
      ruleViolations.push(`Missing registry owner for protected domain: ${domain}`);
    }
  }

  for (const rule of evaluatedRules) {
    const lower = rule.toLowerCase();
    if (lower.includes('single owner') || lower.includes('one owner')) {
      const domainMatch = rule.match(/domain[:\s]+([\w_]+)/i);
      if (domainMatch) {
        const domain = domainMatch[1]!;
        const matching = owners.filter((o) => o.domain === domain);
        if (matching.length !== 1) {
          ruleViolations.push(`Rule violation: domain ${domain} should have single owner`);
        }
      }
    }
    if (lower.includes('no execution') && lower.includes('foundation')) {
      gates.push({ gateId: `rule-exec-${evaluatedRules.indexOf(rule)}`, gateType: 'NO_EXECUTION_RULE', status: 'OPEN', description: rule });
    }
    if (lower.includes('observer only') || lower.includes('read only')) {
      gates.push({ gateId: `rule-obs-${evaluatedRules.indexOf(rule)}`, gateType: 'OBSERVER_RULE', status: 'OPEN', description: rule });
    }
  }

  gates.push({
    gateId: 'rules-eval-0001',
    gateType: 'EXPECTED_RULES_EVALUATED',
    status: 'OPEN',
    description: `${evaluatedRules.length} expected rule(s) evaluated, ${protectedDomainsChecked.length} protected domains checked`,
  });

  return {
    valid: ruleViolations.length === 0,
    evaluatedRules,
    ruleViolations,
    gates,
    protectedDomainsChecked,
  };
}
