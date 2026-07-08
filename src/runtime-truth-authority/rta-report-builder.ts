/**
 * Runtime Truth Authority V1 — report builder for validators and diagnostics.
 */

import type { ValidatorRuntimeTruthResult } from './rta-types.js';
import type { BrowserRuntimeParityResult } from './browser-runtime-parity.js';

export interface RuntimeTruthReport {
  summary: string;
  productionReady: boolean;
  validator: ValidatorRuntimeTruthResult | null;
  browser: BrowserRuntimeParityResult | null;
  lines: string[];
}

export function buildRuntimeTruthReport(input: {
  validator?: ValidatorRuntimeTruthResult | null;
  browser?: BrowserRuntimeParityResult | null;
}): RuntimeTruthReport {
  const lines: string[] = [];
  if (input.validator) {
    lines.push(
      `validator mode=${input.validator.runtimeMode} ok=${input.validator.ok} productionProbed=${input.validator.productionProbed} ephemeralProbed=${input.validator.ephemeralProbed}`,
    );
    lines.push(...input.validator.errors.map((error) => `validator error: ${error}`));
    lines.push(...input.validator.warnings.map((warning) => `validator warning: ${warning}`));
  }
  if (input.browser) {
    lines.push(`browser ok=${input.browser.ok} stale=${input.browser.stale} runtimeId=${input.browser.runtimeId}`);
    if (input.browser.message) lines.push(`browser message: ${input.browser.message}`);
  }
  const productionReady = Boolean(input.validator?.ok) && Boolean(input.browser?.ok ?? true);
  return {
    summary: productionReady ? 'Runtime truth verified' : 'Runtime truth mismatch detected',
    productionReady,
    validator: input.validator ?? null,
    browser: input.browser ?? null,
    lines,
  };
}
