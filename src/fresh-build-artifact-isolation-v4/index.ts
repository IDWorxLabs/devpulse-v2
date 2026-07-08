/**
 * Fresh Build Artifact Purge + Runtime Evidence Isolation V4 — public API.
 *
 * Ensures every NEW_BUILD starts with clean generated artifacts, clean runtime evidence, clean
 * preview evidence, and clean UI build-result state, and that CONTINUE_EXISTING_PROJECT never
 * mixes in unrelated build/project/session evidence. Engine-wide and generic — no product-domain
 * logic anywhere in this module.
 */

export * from './fresh-build-artifact-isolation-types.js';
export * from './fresh-build-artifact-purge-authority.js';
export * from './runtime-evidence-scope-authority.js';
export * from './build-artifact-staleness-detector.js';
export * from './fresh-build-artifact-isolation-report.js';
