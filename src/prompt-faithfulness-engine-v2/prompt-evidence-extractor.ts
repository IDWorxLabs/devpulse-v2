/**
 * Prompt Faithfulness Engine V2 — evidence extraction from prompt.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import { runIntentUnderstandingEngine } from '../intent-understanding-engine/index.js';
import type {
  EvidenceCategory,
  EvidenceStrength,
  ParsedPrompt,
  PromptEvidenceItem,
  RequirementPriority,
} from './prompt-faithfulness-v2-types.js';

let evidenceCounter = 0;

export function resetPromptEvidenceExtractorForTests(): void {
  evidenceCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `EVD-${String(evidenceCounter).padStart(4, '0')}`;
}

function classifyCategory(text: string): EvidenceCategory {
  const lower = text.toLowerCase();
  if (/non[\s-]?goal|do not|must not|never use|no generic/i.test(lower)) return 'NON_GOAL';
  if (/accessib|wcag|screen reader|contrast|gaze|blink|motor/i.test(lower)) return 'ACCESSIBILITY';
  if (/security|encrypt|auth\b|login|password|oauth|mfa/i.test(lower)) return 'SECURITY';
  if (/performance|latency|fast|real[\s-]?time|offline/i.test(lower)) return 'PERFORMANCE';
  if (/platform|android|ios|mobile|web|desktop|tablet/i.test(lower)) return 'PLATFORM';
  if (/navigat|sidebar|drawer|tab|bottom nav/i.test(lower)) return 'NAVIGATION';
  if (/interact|click|tap|swipe|gesture|blink|gaze|voice|speech/i.test(lower)) return 'INTERACTION';
  if (/workflow|journey|step|flow/i.test(lower)) return 'USER_WORKFLOW';
  if (/user|persona|caregiver|patient|admin/i.test(lower)) return 'USER_PERSONA';
  if (/module|feature|required/i.test(lower)) return 'FUNCTIONAL';
  if (/api|integration|webhook|sync/i.test(lower)) return 'API';
  if (/storage|database|persist|cache/i.test(lower)) return 'STORAGE';
  if (/theme|brand|color|design|ui\b|layout/i.test(lower)) return 'UI';
  if (/launch|deploy|preview|production/i.test(lower)) return 'LAUNCH';
  if (/validat|test|verify/i.test(lower)) return 'VALIDATION';
  if (/constraint|must|shall|required/i.test(lower)) return 'CONSTRAINT';
  if (/success|complete|done when/i.test(lower)) return 'SUCCESS_CRITERION';
  if (/compliance|hipaa|gdpr|medical device/i.test(lower)) return 'COMPLIANCE';
  if (/error|fallback|retry/i.test(lower)) return 'ERROR_HANDLING';
  if (/notif/i.test(lower)) return 'NOTIFICATION';
  if (/architect|stack|framework/i.test(lower)) return 'ARCHITECTURE';
  return 'FUNCTIONAL';
}

function classifyPriority(text: string, category: EvidenceCategory): RequirementPriority {
  if (category === 'NON_GOAL') return 'MANDATORY';
  if (/must|required|mandatory|shall/i.test(text)) return 'MANDATORY';
  if (/optional|nice to have|future/i.test(text)) return 'OPTIONAL';
  if (/experimental|prototype/i.test(text)) return 'EXPERIMENTAL';
  return 'REQUIRED';
}

function classifyStrength(text: string, explicit: boolean): EvidenceStrength {
  if (explicit) return 'EXPLICIT';
  if (/must|required|shall|\*/.test(text)) return 'STRONG';
  if (text.length > 40) return 'INFERRED';
  return 'WEAK';
}

function buildEvidence(
  sentence: string,
  sourceLocation: string,
  sourceLine: number,
  explicit: boolean,
): PromptEvidenceItem {
  const category = classifyCategory(sentence);
  const priority = classifyPriority(sentence, category);
  const strength = classifyStrength(sentence, explicit);
  const keywords = sentence
    .toLowerCase()
    .match(/\b[a-z][a-z0-9-]{2,}\b/g)
    ?.slice(0, 12) ?? [];

  return {
    readOnly: true,
    evidenceId: nextEvidenceId(),
    originalSentence: sentence,
    sourceLocation,
    sourceLine,
    category,
    priority,
    confidence: strength === 'EXPLICIT' ? 0.99 : strength === 'STRONG' ? 0.92 : strength === 'INFERRED' ? 0.8 : 0.6,
    strength,
    normalizedRequirement: sentence.replace(/\s+/g, ' ').trim(),
    keywords,
  };
}

export function extractPromptEvidence(parsed: ParsedPrompt): PromptEvidenceItem[] {
  const items: PromptEvidenceItem[] = [];
  const seen = new Set<string>();

  const add = (sentence: string, location: string, line: number, explicit = false): void => {
    const key = sentence.toLowerCase().slice(0, 80);
    if (seen.has(key) || sentence.length < 4) return;
    seen.add(key);
    items.push(buildEvidence(sentence, location, line, explicit));
  };

  for (const sentence of parsed.sentences) {
    add(sentence, 'prompt-body', 0);
  }

  for (const section of parsed.sections) {
    for (let i = 0; i < section.lines.length; i += 1) {
      const line = section.lines[i];
      const bullet = line.match(/^\s*[*•-]\s*(.+)$/);
      if (bullet?.[1]) {
        add(bullet[1], section.heading ?? section.sectionId, section.startLine + i, true);
        continue;
      }
      if (line.trim().length > 8) {
        add(line.trim(), section.heading ?? section.sectionId, section.startLine + i);
      }
    }
  }

  const extraction = extractPromptFeatures(parsed.rawPrompt);
  add(`Product: ${extraction.appName}`, 'intent-extraction', 0, true);
  add(`Purpose: ${extraction.corePurpose}`, 'intent-extraction', 0, true);
  add(`Domain: ${extraction.domain}`, 'intent-extraction', 0);

  for (const moduleId of extraction.requiredModules) {
    add(`Required module: ${moduleId}`, 'module-extraction', 0, true);
  }
  for (const interaction of extraction.requiredInteractions) {
    add(`Required interaction: ${interaction}`, 'interaction-extraction', 0, true);
  }
  for (const design of extraction.designRequirements) {
    add(`Design requirement: ${design}`, 'design-extraction', 0, true);
  }
  for (const platform of extraction.platformRequirements) {
    add(`Platform requirement: ${platform}`, 'platform-extraction', 0, true);
  }
  for (const safety of extraction.safetyNotes) {
    add(safety, 'safety-extraction', 0, true);
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: parsed.rawPrompt });
  const pim = intent.productIntelligenceModel;
  for (const feature of pim.features) {
    if (feature.moduleId) {
      add(`Feature requirement: ${feature.label} (${feature.moduleId})`, 'product-intelligence-model', 0, true);
    }
  }
  for (const constraint of pim.accessibility.mandatoryConstraints) {
    add(`Accessibility constraint: ${constraint}`, 'product-intelligence-model', 0, true);
  }
  for (const criterion of pim.successCriteria.completionCriteria) {
    add(`Success criterion: ${criterion}`, 'product-intelligence-model', 0);
  }

  return items;
}
