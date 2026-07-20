/**
 * Generation Pipeline Compliance Authority V1 — Rendered Content Evidence Expansion V1.
 *
 * Pure evidence collector: given the real *contents* of a build's generated files (never read from
 * disk by this module — that stays the production adapter's job, same split GPCA already uses for
 * structural evidence), extracts rendered headings, navigation labels, button labels, page titles,
 * static visible text, and generic-UI-metadata markers, then matches all of it against the generic
 * fingerprint library. Nothing here is app-specific — every fingerprint/threshold is generic
 * template/placeholder/boilerplate shape, and every "contract match" check is a word-overlap
 * computation against whatever concepts the *current build's* canonical contract actually contains.
 *
 * Production Pipeline Constitution Adoption Phase 2 — Placeholder & Template Elimination Authority
 * V1 additionally: (1) classifies every extracted fragment's Content Origin/Source/Approved
 * Producer/Traceability Chain via `placeholder-template-elimination-authority-v1` (Part 4, purely
 * additive metadata on `RenderedEvidenceItem`), and (2) matches every heading/button/visible-text
 * fragment against the new, separate `BUSINESS_PLACEHOLDER_RECORD_FINGERPRINTS` registry (Sample/
 * Demo/Preview/Example/Template/Test/Fake business-noun shapes) and merges any hit into the exact
 * same `placeholderPhrasesMatched` evidence the existing, unmodified rendered-content gate already
 * blocks on — this can only ever add new blocking signals, never remove or weaken an existing one.
 */

import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS } from '../contract-bound-generation-authority-v4/index.js';
import {
  classifyContentOrigin,
  forcedContentOriginClassification,
  type ContentOriginClassifierContext,
} from '../placeholder-template-elimination-authority-v1/content-origin-classifier.js';
import { matchBusinessPlaceholderFingerprints } from '../placeholder-template-elimination-authority-v1/business-placeholder-fingerprints.js';
import { auditProductContentOrigins } from '../placeholder-template-elimination-authority-v1/placeholder-template-elimination-authority.js';
import type { ContentOriginClassification } from '../placeholder-template-elimination-authority-v1/product-content-origin-types.js';
import { evaluateRenderedContentGate } from './rendered-content-gate.js';
import {
  extractAllVisibleTextNodes,
  extractButtonLabels,
  extractGeneratedUiMetadataMarkers,
  extractHeadings,
  extractInfrastructureNavigationLabels,
  extractNavigationLabels,
  extractPageTitleCandidates,
  GENERIC_PLACEHOLDER_BUTTON_LABELS,
  GENERIC_UI_METADATA_SHELL_MARKERS,
  matchRenderedFingerprints,
  referencesContractVocabulary,
} from './rendered-content-fingerprints.js';
import type { GpcaRenderedContentAudit, RenderedEvidenceItem } from './rendered-content-types.js';

const RENDERABLE_FILE_EXTENSIONS: readonly string[] = ['.tsx', '.jsx', '.ts', '.html'];

function isRenderableFile(path: string): boolean {
  return RENDERABLE_FILE_EXTENSIONS.some((ext) => path.endsWith(ext)) && !path.endsWith('.d.ts');
}

function looksLikeRouteOrPageFile(path: string): boolean {
  return /\/pages?\//i.test(path) || /\/routes?\//i.test(path) || /(Page|Route|Screen)\.(tsx|jsx)$/i.test(path);
}

/** Fingerprint categories treated as "generic reusable shell" evidence (a stronger signal than plain template wording). */
const SHELL_LIKE_CATEGORIES = new Set<string>([
  'REUSABLE_SHELL',
  'ONBOARDING',
  'STARTER_DASHBOARD',
  'HERO_TEMPLATE',
  'BOILERPLATE_QUICK_ACTIONS',
  'STARTER_CARDS',
  'GENERIC_FEATURE_GRID',
]);

export interface RenderedContentFileInput {
  readonly path: string;
  readonly content: string;
}

export interface RenderedContentCollectorInput {
  readonly files: readonly RenderedContentFileInput[];
  /** Contract-derived vocabulary this build's rendered surface text is expected to reference. */
  readonly contractVocabulary: readonly string[];
  /**
   * Placeholder & Template Elimination Authority V1 (Part 1) — CBGA's approved generation-plan
   * vocabulary (module display names, approved navigation labels, approved route labels). Optional
   * and purely additive: omitting it only means fewer fragments can classify CBGA_PRODUCT_CONTENT
   * (they fall through to PROMPT_PRODUCT_CONTENT/UNKNOWN_CONTENT instead) — it never affects the
   * unmodified structural/rendered-content gates.
   */
  readonly cbgaVocabulary?: readonly string[];
  /** Placeholder & Template Elimination Authority V1 (Part 1) — raw-prompt-derived vocabulary. Optional, additive. */
  readonly promptVocabulary?: readonly string[];
}

function pickOriginFields(classification: ContentOriginClassification) {
  return {
    contentOrigin: classification.origin,
    contentSource: classification.contentSource,
    approvedProducer: classification.approvedProducer,
    traceabilityChain: classification.traceabilityChain,
  };
}

export function collectRenderedContentEvidence(input: RenderedContentCollectorInput): GpcaRenderedContentAudit {
  const files = input.files.filter((f) => isRenderableFile(f.path));
  const filesAudited = files.map((f) => f.path);
  const routesAudited = filesAudited.filter(looksLikeRouteOrPageFile);

  const classifierContext: ContentOriginClassifierContext = {
    contractVocabulary: input.contractVocabulary,
    cbgaVocabulary: input.cbgaVocabulary ?? [],
    promptVocabulary: input.promptVocabulary ?? [],
  };
  const contentFragments: { text: string; location: string }[] = [];

  const headingItems: RenderedEvidenceItem[] = [];
  const headings: string[] = [];
  const navigationItems: RenderedEvidenceItem[] = [];
  const navigationLabels: string[] = [];
  const infrastructureNavigationLabels: string[] = [];
  const interactionItems: RenderedEvidenceItem[] = [];
  const buttonLabels: string[] = [];
  const surfaceItems: RenderedEvidenceItem[] = [];
  const visibleText: string[] = [];
  const pageTitles: string[] = [];
  const templateItems: RenderedEvidenceItem[] = [];
  const templateFingerprintsMatched = new Set<string>();
  const genericShellFingerprintsMatched = new Set<string>();
  const placeholderItems: RenderedEvidenceItem[] = [];
  const placeholderPhrasesMatched = new Set<string>();

  let contractReferencingSamples = 0;
  let totalSurfaceSamples = 0;

  const primaryContractConcept = input.contractVocabulary[0] ?? null;

  for (const file of files) {
    const { path, content } = file;

    for (const heading of extractHeadings(content)) {
      headings.push(heading);
      contentFragments.push({ text: heading, location: path });
      totalSurfaceSamples += 1;
      const references = referencesContractVocabulary(heading, input.contractVocabulary);
      if (references) contractReferencingSamples += 1;
      const matches = matchRenderedFingerprints(heading);
      const businessMatches = matchBusinessPlaceholderFingerprints(heading, input.contractVocabulary);
      if (matches.length === 0 && businessMatches.length === 0) {
        headingItems.push({
          readOnly: true,
          source: 'RENDERED_HEADING',
          confidence: references ? 90 : 45,
          reason: references
            ? `Heading "${heading}" references a real contract concept.`
            : `Heading "${heading}" was audited but does not reference a known contract concept.`,
          location: path,
          matchedFingerprint: null,
          contractExpectation: primaryContractConcept,
          ...pickOriginFields(classifyContentOrigin(heading, path, classifierContext)),
        });
      }
      for (const fp of matches) {
        if (fp.category === 'PLACEHOLDER_COPY') {
          placeholderPhrasesMatched.add(fp.id);
          placeholderItems.push({
            readOnly: true,
            source: 'RENDERED_HEADING',
            confidence: fp.baseConfidence,
            reason: `Heading "${heading}" matched generic placeholder fingerprint "${fp.id}": ${fp.description}`,
            location: path,
            matchedFingerprint: fp.id,
            contractExpectation: primaryContractConcept,
            ...pickOriginFields(
              forcedContentOriginClassification(heading, path, 'UNKNOWN_CONTENT', `GENERIC_TEMPLATE_FINGERPRINT:${fp.id}`),
            ),
          });
          continue;
        }
        const bucket = SHELL_LIKE_CATEGORIES.has(fp.category) ? genericShellFingerprintsMatched : templateFingerprintsMatched;
        bucket.add(fp.id);
        templateItems.push({
          readOnly: true,
          source: 'RENDERED_HEADING',
          confidence: fp.baseConfidence,
          reason: `Heading "${heading}" matched generic fingerprint "${fp.id}": ${fp.description}`,
          location: path,
          matchedFingerprint: fp.id,
          contractExpectation: primaryContractConcept,
          ...pickOriginFields(
            forcedContentOriginClassification(heading, path, 'UNKNOWN_CONTENT', `GENERIC_TEMPLATE_FINGERPRINT:${fp.id}`),
          ),
        });
      }
      for (const fp of businessMatches) {
        placeholderPhrasesMatched.add(fp.id);
        placeholderItems.push({
          readOnly: true,
          source: 'RENDERED_HEADING',
          confidence: 90,
          reason: `Heading "${heading}" matched generator-invented business-placeholder fingerprint "${fp.id}": ${fp.description}`,
          location: path,
          matchedFingerprint: fp.id,
          contractExpectation: primaryContractConcept,
          ...pickOriginFields(
            forcedContentOriginClassification(heading, path, 'UNKNOWN_CONTENT', `BUSINESS_PLACEHOLDER_FINGERPRINT:${fp.id}`, [], fp.id),
          ),
        });
      }
    }

    for (const title of extractPageTitleCandidates(content)) {
      pageTitles.push(title);
      contentFragments.push({ text: title, location: path });
      totalSurfaceSamples += 1;
      const references = referencesContractVocabulary(title, input.contractVocabulary);
      if (references) contractReferencingSamples += 1;
      surfaceItems.push({
        readOnly: true,
        source: 'PAGE_TITLE',
        confidence: references ? 88 : 40,
        reason: references
          ? `Page title "${title}" references a real contract concept.`
          : `Page title "${title}" was audited but does not reference a known contract concept.`,
        location: path,
        matchedFingerprint: null,
        contractExpectation: primaryContractConcept,
        ...pickOriginFields(classifyContentOrigin(title, path, classifierContext)),
      });
    }

    for (const label of extractNavigationLabels(content)) {
      navigationLabels.push(label);
      contentFragments.push({ text: label, location: path });
      navigationItems.push({
        readOnly: true,
        source: 'RENDERED_NAVIGATION_LABEL',
        confidence: 70,
        reason: `Navigation label "${label}" audited.`,
        location: path,
        matchedFingerprint: null,
        contractExpectation: primaryContractConcept,
        ...pickOriginFields(classifyContentOrigin(label, path, classifierContext)),
      });
    }

    for (const label of extractInfrastructureNavigationLabels(content)) {
      infrastructureNavigationLabels.push(label);
      navigationItems.push({
        readOnly: true,
        source: 'RENDERED_INFRASTRUCTURE_NAVIGATION_LABEL',
        confidence: 100,
        reason: `Navigation label "${label}" is structurally marked as infrastructure (root shell/frame/entry-surface) navigation — never compared against CBGA's contract navigation plan.`,
        location: path,
        matchedFingerprint: null,
        contractExpectation: null,
        ...pickOriginFields(
          forcedContentOriginClassification(label, path, 'INFRASTRUCTURE_CONTENT', 'STRUCTURAL_INFRASTRUCTURE_NAVIGATION_MARKER', [
            'BlueprintInfrastructure.InfrastructureNavigationItem',
          ]),
        ),
      });
    }

    for (const label of extractButtonLabels(content)) {
      buttonLabels.push(label);
      contentFragments.push({ text: label, location: path });
      const normalized = label.trim().toLowerCase();
      const businessMatches = matchBusinessPlaceholderFingerprints(label, input.contractVocabulary);
      if (GENERIC_PLACEHOLDER_BUTTON_LABELS.includes(normalized)) {
        placeholderPhrasesMatched.add(`placeholder-button:${normalized}`);
        placeholderItems.push({
          readOnly: true,
          source: 'RENDERED_BUTTON_LABEL',
          confidence: 88,
          reason: `Button label "${label}" is a generic placeholder call-to-action with no contract-derived meaning.`,
          location: path,
          matchedFingerprint: `placeholder-button:${normalized}`,
          contractExpectation: primaryContractConcept,
          ...pickOriginFields(
            forcedContentOriginClassification(label, path, 'UNKNOWN_CONTENT', `PLACEHOLDER_BUTTON:${normalized}`),
          ),
        });
      } else if (businessMatches.length > 0) {
        for (const fp of businessMatches) placeholderPhrasesMatched.add(fp.id);
        placeholderItems.push({
          readOnly: true,
          source: 'RENDERED_BUTTON_LABEL',
          confidence: 88,
          reason: `Button label "${label}" matched generator-invented business-placeholder fingerprint "${businessMatches[0]!.id}": ${businessMatches[0]!.description}`,
          location: path,
          matchedFingerprint: businessMatches[0]!.id,
          contractExpectation: primaryContractConcept,
          ...pickOriginFields(
            forcedContentOriginClassification(
              label,
              path,
              'UNKNOWN_CONTENT',
              `BUSINESS_PLACEHOLDER_FINGERPRINT:${businessMatches[0]!.id}`,
              [],
              businessMatches[0]!.id,
            ),
          ),
        });
      } else {
        interactionItems.push({
          readOnly: true,
          source: 'RENDERED_BUTTON_LABEL',
          confidence: 70,
          reason: `Button label "${label}" audited.`,
          location: path,
          matchedFingerprint: null,
          contractExpectation: null,
          ...pickOriginFields(classifyContentOrigin(label, path, classifierContext)),
        });
      }
    }

    for (const marker of extractGeneratedUiMetadataMarkers(content)) {
      if (GENERIC_UI_METADATA_SHELL_MARKERS.includes(marker)) {
        // These markers are intentionally infrastructure/hosting DOM stamps (see
        // GENERIC_UI_METADATA_SHELL_MARKERS). They prove structural shell wiring for other
        // authorities; they are NOT product-generic-template evidence and must not enter the
        // blocking genericShellFingerprintsMatched set used by evaluateRenderedContentGate.
        const fingerprintId = `generated-ui-metadata:${marker}`;
        templateItems.push({
          readOnly: true,
          source: 'GENERATED_UI_METADATA',
          confidence: 96,
          reason: `Infrastructure UI metadata marker data-blueprint="${marker}" recorded without treating it as product template output.`,
          location: path,
          matchedFingerprint: fingerprintId,
          contractExpectation: null,
          ...pickOriginFields(
            forcedContentOriginClassification(
              marker,
              path,
              'INFRASTRUCTURE_CONTENT',
              `GENERATED_UI_METADATA_MARKER:${marker}`,
            ),
          ),
        });
      }
    }

    for (const text of extractAllVisibleTextNodes(content)) {
      visibleText.push(text);
      contentFragments.push({ text, location: path });
      const matches = matchRenderedFingerprints(text);
      const businessMatches = matchBusinessPlaceholderFingerprints(text, input.contractVocabulary);
      for (const fp of matches) {
        if (fp.category === 'PLACEHOLDER_COPY') {
          placeholderPhrasesMatched.add(fp.id);
          placeholderItems.push({
            readOnly: true,
            source: 'PLACEHOLDER_COPY',
            confidence: fp.baseConfidence,
            reason: `Rendered text "${text}" matched generic placeholder fingerprint "${fp.id}": ${fp.description}`,
            location: path,
            matchedFingerprint: fp.id,
            contractExpectation: null,
            ...pickOriginFields(
              forcedContentOriginClassification(text, path, 'UNKNOWN_CONTENT', `GENERIC_TEMPLATE_FINGERPRINT:${fp.id}`),
            ),
          });
        } else {
          const bucket = SHELL_LIKE_CATEGORIES.has(fp.category) ? genericShellFingerprintsMatched : templateFingerprintsMatched;
          bucket.add(fp.id);
          templateItems.push({
            readOnly: true,
            source: 'STATIC_TEXT',
            confidence: fp.baseConfidence,
            reason: `Rendered text "${text}" matched generic fingerprint "${fp.id}": ${fp.description}`,
            location: path,
            matchedFingerprint: fp.id,
            contractExpectation: primaryContractConcept,
            ...pickOriginFields(
              forcedContentOriginClassification(text, path, 'UNKNOWN_CONTENT', `GENERIC_TEMPLATE_FINGERPRINT:${fp.id}`),
            ),
          });
        }
      }
      for (const fp of businessMatches) {
        placeholderPhrasesMatched.add(fp.id);
        placeholderItems.push({
          readOnly: true,
          source: 'PLACEHOLDER_COPY',
          confidence: 90,
          reason: `Rendered text "${text}" matched generator-invented business-placeholder fingerprint "${fp.id}": ${fp.description}`,
          location: path,
          matchedFingerprint: fp.id,
          contractExpectation: null,
          ...pickOriginFields(
            forcedContentOriginClassification(text, path, 'UNKNOWN_CONTENT', `BUSINESS_PLACEHOLDER_FINGERPRINT:${fp.id}`, [], fp.id),
          ),
        });
      }
    }
  }

  const nonSystemShellNavLabels = navigationLabels.filter((label) => !CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.includes(label));
  const navigationIsFullyGenericShell = navigationLabels.length > 0 && nonSystemShellNavLabels.length === 0;
  if (navigationIsFullyGenericShell) {
    genericShellFingerprintsMatched.add('boilerplate-navigation-no-feature-items');
    templateItems.push({
      readOnly: true,
      source: 'TEMPLATE_FINGERPRINT',
      confidence: 80,
      reason:
        'Every rendered navigation label is a generic system-shell item (e.g. Settings/Profile/Help) — no product-specific feature navigation is rendered anywhere in this build.',
      location: filesAudited.join(', ') || '(no renderable files)',
      matchedFingerprint: 'boilerplate-navigation-no-feature-items',
      contractExpectation: primaryContractConcept,
      ...pickOriginFields(
        forcedContentOriginClassification(
          'boilerplate-navigation-no-feature-items',
          filesAudited.join(', ') || '(no renderable files)',
          'UNKNOWN_CONTENT',
          'BOILERPLATE_NAVIGATION_NO_FEATURE_ITEMS',
        ),
      ),
    });
  }

  const renderedContractMatchPercent =
    totalSurfaceSamples > 0 ? Math.round((contractReferencingSamples / totalSurfaceSamples) * 100) : 100;

  const distinctIssueFingerprints = new Set<string>([
    ...templateFingerprintsMatched,
    ...genericShellFingerprintsMatched,
    ...placeholderPhrasesMatched,
  ]);
  const penaltyPercent = Math.min(100, distinctIssueFingerprints.size * 15);
  const overallRenderedCompliancePercent = Math.max(0, Math.min(renderedContractMatchPercent, 100 - penaltyPercent));

  const hasSurfaceEvidence = filesAudited.length > 0 && (headings.length > 0 || pageTitles.length > 0 || visibleText.length > 0);

  const gate = evaluateRenderedContentGate({
    placeholderPhrasesMatched: [...placeholderPhrasesMatched],
    templateFingerprintsMatched: [...templateFingerprintsMatched],
    genericShellFingerprintsMatched: [...genericShellFingerprintsMatched],
    renderedContractMatchPercent,
    hasSurfaceEvidence,
  });

  const contentOriginAudit = auditProductContentOrigins({
    fragments: contentFragments,
    contractVocabulary: input.contractVocabulary,
    cbgaVocabulary: classifierContext.cbgaVocabulary,
    promptVocabulary: classifierContext.promptVocabulary,
  });

  return {
    readOnly: true,
    filesAudited,
    routesAudited,
    headings: { readOnly: true, items: headingItems, headings },
    navigation: { readOnly: true, items: navigationItems, navigationLabels, infrastructureNavigationLabels: [...new Set(infrastructureNavigationLabels)] },
    interactions: { readOnly: true, items: interactionItems, buttonLabels },
    surfaces: { readOnly: true, items: surfaceItems, visibleText, pageTitles },
    templates: {
      readOnly: true,
      items: templateItems,
      templateFingerprintsMatched: [...templateFingerprintsMatched],
      genericShellFingerprintsMatched: [...genericShellFingerprintsMatched],
    },
    placeholders: { readOnly: true, items: placeholderItems, placeholderPhrasesMatched: [...placeholderPhrasesMatched] },
    renderedContractMatchPercent,
    overallRenderedCompliancePercent,
    gateOutcome: gate.outcome,
    blockedReasons: gate.reasons,
    contentOriginAudit,
    generatedAt: new Date().toISOString(),
  };
}
