# DevPulse V2 — Browser Verification Harness Foundation

**GF7 OMEGA — Browser Reality Authority V1**  
**System ID:** `browser_verification_harness`  
**Phase:** 1

---

## Why Browser Reality Comes Before Stability Soak

V1 passed validators while browsers failed. DevTools showed routing leaks, frozen UI, and invisible execution while Node VM traces reported PASS.

Phase 1 foundation is complete (Task Governor, Shell, Chat, Operator Feed). Before the 30-day Stability Soak, **browser reality must verify the stack actually renders and behaves visibly**.

This harness is the gate between "validators pass" and "founders can use it."

---

## Why This Is Not Trust Engine

| Trust Engine (Phase 2+) | Browser Verification Harness (Phase 1) |
|---------------------------|----------------------------------------|
| Verification authority with evidence artifacts | HTML + timing reality checks |
| UVL evolution | No UVL, no readiness gates |
| Blocks or gates releases | Observes; reports PASS/WARN/FAIL |
| Full functional test suite | 13 foundation checks |

The harness **verifies** existing systems. It does not **own** Shell, Chat, or Feed.

---

## Simulated Browser at Foundation Stage

Real Playwright/browser runner is **not yet attached**. The harness uses `SimulatedBrowserDomAdapter`:

- Parses rendered HTML strings from the Phase 1 stack
- Checks for required data attributes and visible text
- Measures timing from Shell clickability tracker
- Reports honestly: `"Real browser runner not yet attached"` as **WARN**, not fake PASS

This is acceptable at foundation stage because it verifies **the same HTML** Chat Authority produces — not a separate validator universe.

---

## What Still Needs Real Browser Runner Later

| Foundation (now) | Phase 1 soak / Phase 2 |
|------------------|--------------------------|
| Simulated HTML verification | Playwright or equivalent |
| Static timing from shell state | Real `firstClickReadyAt` in Chrome |
| No network/DOM events | Real click/submit interaction |
| WARN when runner missing | FAIL if browser diverges from harness |

---

## V1 Validator vs Reality Prevention

| V1 failure | Harness response |
|------------|------------------|
| Validator path ≠ browser path | Verifies mounted HTML from real stack boot |
| Validator green, browser red | Harness status FAIL if HTML missing elements |
| Separate test entry points | Boots same Shell → Chat → Feed flow |
| Hidden answer fields | BV-12 checks forbidden alternate fields |
| Duplicate answer authority | BV-13 registry check |

**Does not replace** existing `validate:*` scripts — **complements** them with rendered-output verification.

---

## Foundation Checks (13)

1. Shell surface renders  
2. Chat replaces shell placeholder  
3. Chat input exists  
4. Send button exists  
5. First clickable control available  
6. User message in HTML  
7. `visibleAnswerText` rendered  
8. Five inline feed events  
9. Feed ≠ assistant answer  
10. Visible timing measured  
11. Clickable timing measured  
12. No alternate answer fields  
13. No duplicate answer authority  

---

## Usage

```typescript
import { createDevPulseV2BrowserVerificationHarness } from './src/browser-verification/index.js';

const harness = createDevPulseV2BrowserVerificationHarness();
const result = await harness.runFoundationVerification('Hello');
console.log(harness.formatLastReport());
```

---

## Build Gate

```typescript
runDevPulseV2BuildGate({
  phase: 1,
  systems: ['browser_verification_harness'],
  eagerModuleCount: 2,
  answerAuthorities: ['devpulse_v2_chat_authority'],
  browserVerificationPresent: true,
  buildStage: 'foundation',
});
```

---

## Validation

```bash
npm run validate:browser-harness
npm run validate:inline-operator-feed
npm run validate:chat-authority
npm run validate:shell
npm run validate:task-governor
npm run validate:foundation
```

Pass token:

```
DEVPULSE_V2_BROWSER_VERIFICATION_HARNESS_FOUNDATION_V1_PASS
```

---

## Next Step

With browser harness passing (WARN acceptable for simulated mode), **Phase 1 Stability Soak** may begin — with commitment to attach real browser runner before Phase 2.

---

## Related Documents

- `DEVPULSE_V2_CONSTITUTION.md` — Browser reality supreme law
- `DEVPULSE_V2_SHELL_FOUNDATION.md`
- `DEVPULSE_V2_CHAT_AUTHORITY_FOUNDATION.md`
- `DEVPULSE_V2_INLINE_OPERATOR_FEED_FOUNDATION.md`
