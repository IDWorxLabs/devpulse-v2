# Founder Sensemaking / Product Coherence Engine — Phase 24.9.8

**Date:** 2026-06-10  
**Module:** `src/founder-sensemaking-engine/`  
**UI surface:** Product Coherence panel (`product-coherence` nav)

---

## Objective

Answer the question validators and feature checks cannot fully answer alone:

> Does the product make sense to a founder?

The engine detects confusion, contradictions, dead ends, redundancy, promise conflicts, trust risks, and coherence gaps — then recommends upgrades with expected impact.

---

## Architecture

| Layer | Path |
|-------|------|
| Types | `founder-sensemaking-types.ts` |
| Authority | `founder-sensemaking-authority.ts` |
| Cache | `founder-sensemaking-cache.ts` |
| Public API | `index.ts` |
| Brain responses | `command-center-brain/founder-sensemaking-responses.ts` |
| V4 integration | `founder-testing-v4-orchestrator.ts`, `execution-reality-engine.ts` |
| Workspace | `server/product-workspace-snapshot.ts` |
| UI | `public/founder-reality/app.js`, `index.html`, `styles.css` |

---

## Evaluation Areas

| Area | Finding types | Signals |
|------|---------------|---------|
| UI Sensemaking | CONFUSION, COHERENCE_GAP | `assessProjectIntelligenceClarity`, verification/diagnostics copy |
| Navigation Sensemaking | REDUNDANCY | Overlapping nav label pairs |
| Workflow Sensemaking | DEAD_END | Verification failures without Action Center next step |
| Product Narrative | PROMISE_CONFLICT | Autonomous promise vs execution not connected |
| Report Consistency | CONTRADICTION | Insights verification-ready vs Verification beta/launch readiness |
| Score Sensemaking | TRUST_RISK | Human vs execution readiness split; regressions vs healthy portfolio |

---

## Scores

- **Founder Sensemaking Score** — overall comprehension/trust health (0–100)
- **Product Coherence Score** — narrative consistency with extra weight on contradictions (0–100)

Both surface in Product Coherence panel and Founder Testing V4 markdown.

---

## Product Coherence Panel Sections

1. What Doesn't Make Sense  
2. Contradictions  
3. Trust Risks  
4. Recommended Upgrades  
5. Expected Impact  

---

## Command Center Intents

- What doesn't make sense?
- Where are users likely to get confused?
- What should we simplify?
- What screens overlap?
- What hurts trust?
- What should we improve next?

---

## Operator Feed Stages

- Analyzing founder experience  
- Detecting contradictions  
- Detecting confusion risks  
- Evaluating trust  
- Ranking coherence issues  
- Generating upgrade recommendations  

---

## Runtime Safeguards

- Bounded findings (max 12) and upgrades (max 8)  
- 120s validation timeout guard  
- Shared text cache in validator  
- Workspace assessment cache keyed by `generatedAt`  
- No unbounded cross-product comparisons  

---

## Validation

```powershell
npm run validate:founder-sensemaking-engine
```

| Result | Scenarios |
|--------|-----------|
| **FOUNDER_SENSEMAKING_ENGINE_PASS** | 34/34 |

Cross-check: `validate:founder-testing-mode-v4` remains **34/34 PASS** (scenario count preserved).

Sample scores from validation run: Founder Sensemaking **67/100**, Product Coherence **63/100**.

---

## Final Verdict

**FOUNDER_SENSEMAKING_ENGINE_PASS**
