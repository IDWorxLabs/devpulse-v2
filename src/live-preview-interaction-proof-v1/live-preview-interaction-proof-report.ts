/**
 * Live Preview Interaction Proof V1 — plain-English report builder.
 *
 * Turns evidence + result kind into a founder-facing summary. Never includes raw selectors,
 * stack traces, or console log text — those stay in the evidence object for Advanced Diagnostics.
 */

import type {
  LivePreviewInteractionProofEvidence,
  LivePreviewInteractionProofSummary,
  PreviewInteractionProofResultKind,
} from './live-preview-interaction-proof-types.js';
import {
  pickAttemptedButUnchangedInteraction,
  pickSucceededInteraction,
} from './live-preview-interaction-proof-normalizer.js';

export function buildInteractionProofSummary(
  evidence: LivePreviewInteractionProofEvidence,
  result: PreviewInteractionProofResultKind,
): LivePreviewInteractionProofSummary {
  const whatLoaded: string[] = [];
  const whatWasTested: string[] = [];
  const whatWorked: string[] = [];
  const whatFailed: string[] = [];
  const suggestedRepair: string[] = [];

  if (result === 'PREVIEW_INTERACTION_BLOCKED') {
    return {
      readOnly: true,
      headline: 'AiDevEngine could not run the live preview proof.',
      whatLoaded: [],
      whatWasTested: [],
      whatWorked: [],
      whatFailed: [evidence.blockedReason ?? 'The live preview proof could not run in this environment.'],
      suggestedRepair: [],
    };
  }

  if (evidence.pageLoaded) {
    whatLoaded.push('The live preview opened successfully.');
  } else {
    whatFailed.push('The live preview did not open in a browser.');
    suggestedRepair.push('Check that the generated app starts without errors and serves a page at the preview URL.');
  }

  if (evidence.rootUiFound) {
    whatLoaded.push('The app rendered visible content.');
  } else if (evidence.pageLoaded) {
    whatFailed.push('The page loaded, but no visible content was rendered.');
    suggestedRepair.push('Check that the root component actually mounts and renders UI.');
  }

  if (evidence.primaryFeatureTextFound) {
    whatWasTested.push(`AiDevEngine looked for content related to your request and found "${evidence.primaryFeatureTextFound}" on the page.`);
    whatWorked.push('AiDevEngine found the primary feature described in your prompt.');
  } else if (evidence.rootUiFound) {
    whatWasTested.push('AiDevEngine looked for content related to your request on the page.');
    // Only flag this as a problem when nothing else demonstrably worked — an interaction that
    // actually changed the page is stronger evidence of usability than a text match.
    if (result !== 'PREVIEW_INTERACTION_PASS') {
      whatFailed.push('AiDevEngine could not confirm the primary feature is visible on the page.');
    }
  }

  if (evidence.fatalConsoleErrorDetected) {
    whatFailed.push('The app raised an error in the browser while running.');
    suggestedRepair.push('Check the browser console error in Advanced Diagnostics and fix the underlying code issue.');
  }

  const attemptedInteractions = evidence.interactionAttempts.filter((a) => a.elementFound);
  if (attemptedInteractions.length > 0) {
    whatWasTested.push(
      `AiDevEngine tried ${attemptedInteractions.length} interaction${attemptedInteractions.length === 1 ? '' : 's'} on the page (buttons, inputs, checkboxes, dropdowns, or links).`,
    );
  } else if (evidence.rootUiFound) {
    whatWasTested.push('AiDevEngine looked for something to interact with (buttons, inputs, checkboxes, dropdowns, or links).');
    whatFailed.push('No interactive elements were found to test.');
    suggestedRepair.push('Make sure the generated app includes visible, interactive controls for its main feature.');
  }

  const succeeded = pickSucceededInteraction(evidence.interactionAttempts);
  if (succeeded) {
    whatWorked.push(`${succeeded.label} and the visible result changed.`);
  }

  const unchanged = pickAttemptedButUnchangedInteraction(evidence.interactionAttempts);
  if (!succeeded && unchanged) {
    whatFailed.push(`${unchanged.label}, but nothing visible changed afterward.`);
    suggestedRepair.push('Check the event handler and state update logic for this interaction.');
  }

  let headline: string;
  switch (result) {
    case 'PREVIEW_INTERACTION_PASS':
      headline = 'Preview loaded, the primary feature was found, and an interaction changed the visible result.';
      break;
    case 'PREVIEW_INTERACTION_PARTIAL':
      headline = 'Preview loaded, but AiDevEngine could not fully confirm the app is interactive.';
      break;
    case 'PREVIEW_INTERACTION_FAIL':
    default:
      headline = 'Preview loaded, but the primary interaction did not work as expected.';
      break;
  }

  return {
    readOnly: true,
    headline,
    whatLoaded,
    whatWasTested,
    whatWorked,
    whatFailed,
    suggestedRepair,
  };
}
