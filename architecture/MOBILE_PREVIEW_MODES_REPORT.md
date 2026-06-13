# Mobile Preview Modes Report

Generated: 2026-06-13T10:06:50.229Z

## Summary

- Total analyses: 32
- Average preview readiness score: 0/100
- Average navigation usability score: 71/100
- Ready for preview count: 0

## Device Analysis

- Analysis ID: mobile-preview-1
- Source viewport: 375 x 812
- Profiles analyzed: 10
- Preview readiness: NOT_READY (0/100)
- Confidence score: 90/100

### Layout Behaviors

- **ANDROID_PHONE_SMALL**: Collapsed sidebar into drawer/hamburger pattern required
  - Navigation: Bottom tab navigation
  - Fit: POOR, Density: VERY_HIGH
- **ANDROID_PHONE_MEDIUM**: Collapsed sidebar into drawer/hamburger pattern required
  - Navigation: Bottom tab navigation
  - Fit: EXCELLENT, Density: VERY_HIGH
- **ANDROID_PHONE_LARGE**: Collapsed sidebar into drawer/hamburger pattern required
  - Navigation: Bottom tab navigation
  - Fit: EXCELLENT, Density: VERY_HIGH
- **IPHONE_SMALL**: Collapsed sidebar into drawer/hamburger pattern required
  - Navigation: Bottom tab navigation
  - Fit: POOR, Density: VERY_HIGH
- **IPHONE_STANDARD**: Collapsed sidebar into drawer/hamburger pattern required
  - Navigation: Bottom tab navigation
  - Fit: GOOD, Density: VERY_HIGH
- **IPHONE_PRO_MAX**: Collapsed sidebar into drawer/hamburger pattern required
  - Navigation: Bottom tab navigation
  - Fit: EXCELLENT, Density: VERY_HIGH
- ... and 4 more profiles

## Compatibility Findings

- **ANDROID_PHONE**: 20/100
  - ANDROID_PHONE_SMALL: 0/100 — POOR fit, very_high density — Collapsed sidebar into drawer/hamburger pattern required
  - ANDROID_PHONE_MEDIUM: 30/100 — EXCELLENT fit, very_high density — Collapsed sidebar into drawer/hamburger pattern required
  - ANDROID_PHONE_LARGE: 30/100 — EXCELLENT fit, very_high density — Collapsed sidebar into drawer/hamburger pattern required
- **IPHONE**: 15/100
  - IPHONE_SMALL: 0/100 — POOR fit, very_high density — Collapsed sidebar into drawer/hamburger pattern required
  - IPHONE_STANDARD: 16/100 — GOOD fit, very_high density — Collapsed sidebar into drawer/hamburger pattern required
  - IPHONE_PRO_MAX: 30/100 — EXCELLENT fit, very_high density — Collapsed sidebar into drawer/hamburger pattern required
- **TABLET**: 73/100
  - ANDROID_TABLET: 73/100 — EXCELLENT fit, medium density — Two-pane tablet layout
  - IPAD: 73/100 — EXCELLENT fit, medium density — Two-pane tablet layout
- **DESKTOP**: 53/100
  - DESKTOP_STANDARD: 36/100 — FAIR fit, high density — Sidebar + main content split layout
  - DESKTOP_WIDE: 70/100 — EXCELLENT fit, high density — Sidebar + main content split layout

## Responsive Risks

- Overall risk level: CRITICAL
- Risk count: 24
- [CRITICAL] NAVIGATION_CROWDING (ANDROID_PHONE_SMALL): Sidebar layout will crowd navigation on Small Android Phone.
- [CRITICAL] NAVIGATION_CROWDING (ANDROID_PHONE_MEDIUM): Sidebar layout will crowd navigation on Medium Android Phone.
- [CRITICAL] NAVIGATION_CROWDING (ANDROID_PHONE_LARGE): Sidebar layout will crowd navigation on Large Android Phone.
- [CRITICAL] NAVIGATION_CROWDING (IPHONE_SMALL): Sidebar layout will crowd navigation on Small iPhone.
- [CRITICAL] NAVIGATION_CROWDING (IPHONE_STANDARD): Sidebar layout will crowd navigation on Standard iPhone.
- [CRITICAL] NAVIGATION_CROWDING (IPHONE_PRO_MAX): Sidebar layout will crowd navigation on Pro Max iPhone.
- [HIGH] OVERFLOW_RISK (ANDROID_PHONE_SMALL): Content likely overflows on Small Android Phone (360x640).
- [HIGH] DASHBOARD_DENSITY_ISSUE (ANDROID_PHONE_SMALL): Dashboard density is too high for Small Android Phone.
- [HIGH] TOUCH_TARGET_ISSUE (ANDROID_PHONE_SMALL): Button groups may produce undersized touch targets on Small Android Phone.
- [HIGH] DASHBOARD_DENSITY_ISSUE (ANDROID_PHONE_MEDIUM): Dashboard density is too high for Medium Android Phone.
- [HIGH] DASHBOARD_DENSITY_ISSUE (ANDROID_PHONE_LARGE): Dashboard density is too high for Large Android Phone.
- [HIGH] OVERFLOW_RISK (IPHONE_SMALL): Content likely overflows on Small iPhone (375x667).
- [HIGH] DASHBOARD_DENSITY_ISSUE (IPHONE_SMALL): Dashboard density is too high for Small iPhone.
- [HIGH] TOUCH_TARGET_ISSUE (IPHONE_SMALL): Button groups may produce undersized touch targets on Small iPhone.
- [HIGH] DASHBOARD_DENSITY_ISSUE (IPHONE_STANDARD): Dashboard density is too high for Standard iPhone.
- [HIGH] DASHBOARD_DENSITY_ISSUE (IPHONE_PRO_MAX): Dashboard density is too high for Pro Max iPhone.
- [HIGH] OVERFLOW_RISK (ALL): Desktop-oriented sidebar may not translate to mobile platform targets.
- [MEDIUM] MODAL_SIZE_ISSUE (ANDROID_PHONE_SMALL): Modal overlays may exceed safe viewport height on Small Android Phone.
- [MEDIUM] MODAL_SIZE_ISSUE (ANDROID_PHONE_MEDIUM): Modal overlays may exceed safe viewport height on Medium Android Phone.
- [MEDIUM] MODAL_SIZE_ISSUE (ANDROID_PHONE_LARGE): Modal overlays may exceed safe viewport height on Large Android Phone.
- [MEDIUM] MODAL_SIZE_ISSUE (IPHONE_SMALL): Modal overlays may exceed safe viewport height on Small iPhone.
- [MEDIUM] MODAL_SIZE_ISSUE (IPHONE_STANDARD): Modal overlays may exceed safe viewport height on Standard iPhone.
- [MEDIUM] MODAL_SIZE_ISSUE (IPHONE_PRO_MAX): Modal overlays may exceed safe viewport height on Pro Max iPhone.
- [MEDIUM] DASHBOARD_DENSITY_ISSUE (ALL): Multiple dashboard cards across many screens increase responsive maintenance risk.

## Navigation Review

- Navigation usability score: 71/100
- Bottom navigation: yes
- Side navigation: yes
- Menu complexity: HIGH
- Discoverability: FAIR
- Findings:
- BOTTOM_NAVIGATION_DETECTED
- SIDE_OR_TOP_NAVIGATION_DETECTED
- TAB_STRUCTURE_LIKELY
- HIGH_MENU_COMPLEXITY

## Preview Readiness

- Category: NOT_READY
- Score: 0/100

## Recommendations

- Simplify navigation (80%)
  - Sidebar layout will crowd navigation on Small Android Phone.
  - Expected impact: Reduces navigation crowding and improves discoverability.
  - Targets: ANDROID_PHONE, IPHONE, TABLET
- Redesign mobile layout (76%)
  - Content likely overflows on Small Android Phone (360x640).
  - Expected impact: Prevents horizontal overflow and content clipping.
  - Targets: ANDROID_PHONE, IPHONE
- Reduce dashboard density (78%)
  - Dashboard density is too high for Small Android Phone.
  - Expected impact: Improves readability and scroll performance on narrow viewports.
  - Targets: ANDROID_PHONE, IPHONE
- Increase touch target size (82%)
  - Button groups may produce undersized touch targets on Small Android Phone.
  - Expected impact: Meets minimum touch target guidance for mobile preview modes.
  - Targets: ANDROID_PHONE, IPHONE
- Adjust modal sizing for mobile (74%)
  - Modal overlays may exceed safe viewport height on Small Android Phone.
  - Expected impact: Keeps modal actions reachable without viewport overflow.
  - Targets: ANDROID_PHONE, IPHONE
- Split workflow across focused screens (75%)
  - High menu complexity detected across multiple flows.
  - Expected impact: Reduces cognitive load and navigation depth.
  - Targets: ANDROID_PHONE, IPHONE, TABLET
- Prioritize mobile-first layout adjustments (77%)
  - Phone compatibility scores are below preview readiness threshold.
  - Expected impact: Raises cross-device preview confidence before runtime preview systems consume this layer.
  - Targets: ANDROID_PHONE, IPHONE

---

Pass token: MOBILE_PREVIEW_MODES_V1_PASS
