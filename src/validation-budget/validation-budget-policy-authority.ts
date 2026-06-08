/**
 * DevPulse V2 Validation Budget Policy Authority — governs fast vs full-stack validation.
 */

import { join } from 'node:path';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import {
  isEvidenceRegistryValidatorFast,
  scanValidatorScripts,
} from './validator-script-scanner.js';
import { buildValidationRecommendation } from './validation-budget-policy-rules.js';
import { formatValidationBudgetReport } from './validation-budget-report.js';
import type {
  ValidationBudgetState,
  ValidationRecommendation,
  ValidationTrigger,
  ValidatorScriptScanResult,
} from './types.js';
import { POLICY_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ValidationBudgetPolicyAuthority | null = null;

export class DevPulseV2ValidationBudgetPolicyAuthority {
  private state: ValidationBudgetState = {
    ownerModule: POLICY_OWNER_MODULE,
    lastTrigger: null,
    lastRecommendation: null,
    lastScan: null,
    warnings: [],
    errors: [],
  };

  static readonly ownerModule = POLICY_OWNER_MODULE;
  static readonly ownerDomain = 'validation_budget_policy' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('validation_budget_policy');
    return owner.ownerModule === POLICY_OWNER_MODULE;
  }

  static assertDoesNotReplaceTrustEngine(): boolean {
    return getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE;
  }

  static assertDoesNotReplaceEvidenceRegistry(): boolean {
    return getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE;
  }

  getRecommendation(
    trigger: ValidationTrigger,
    featureValidatorCommand?: string,
  ): ValidationRecommendation {
    const recommendation = buildValidationRecommendation(trigger, featureValidatorCommand);
    this.state.lastTrigger = trigger;
    this.state.lastRecommendation = recommendation;
    return recommendation;
  }

  scanValidatorScripts(scriptsDir?: string): ValidatorScriptScanResult {
    const dir = scriptsDir ?? join(process.cwd(), 'scripts');
    const scan = scanValidatorScripts(dir);
    this.state.lastScan = scan;

    if (scan.status === 'FAIL') {
      this.state.warnings.push(
        'FAST_FEATURE_CHECK scripts contain nested validate:* calls — remove or reclassify.',
      );
    } else if (scan.status === 'WARN') {
      this.state.warnings.push(
        'UNMARKED scripts contain nested validate:* calls — add VALIDATION_MODE markers.',
      );
    }

    return scan;
  }

  isEvidenceRegistryValidationFast(scriptsDir?: string): boolean {
    const dir = scriptsDir ?? join(process.cwd(), 'scripts');
    return isEvidenceRegistryValidatorFast(dir);
  }

  getState(): ValidationBudgetState {
    return {
      ...this.state,
      warnings: [...this.state.warnings],
      errors: [...this.state.errors],
      lastRecommendation: this.state.lastRecommendation
        ? { ...this.state.lastRecommendation, warnings: [...this.state.lastRecommendation.warnings] }
        : null,
      lastScan: this.state.lastScan
        ? {
            ...this.state.lastScan,
            nestedValidatorCalls: [...this.state.lastScan.nestedValidatorCalls],
            riskyScripts: [...this.state.lastScan.riskyScripts],
          }
        : null,
    };
  }

  formatReport(): string {
    return formatValidationBudgetReport(this.getState());
  }
}

export function createDevPulseV2ValidationBudgetPolicyAuthority(): DevPulseV2ValidationBudgetPolicyAuthority {
  singleton = new DevPulseV2ValidationBudgetPolicyAuthority();
  return singleton;
}

export function getDevPulseV2ValidationBudgetPolicyAuthority(): DevPulseV2ValidationBudgetPolicyAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ValidationBudgetPolicyAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ValidationBudgetPolicyAuthorityForTests(): DevPulseV2ValidationBudgetPolicyAuthority {
  singleton = new DevPulseV2ValidationBudgetPolicyAuthority();
  return singleton;
}
