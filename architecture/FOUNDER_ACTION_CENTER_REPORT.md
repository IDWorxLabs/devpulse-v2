# Founder Action Center — Phase 24.9.7 Report

## Verdict

**FOUNDER_ACTION_CENTER_PASS**

## Objective

Convert product visibility (memory, insights, preview, running app, verification, change intelligence) into prioritized founder next actions — so founders know what to do next without manually interpreting multiple reports.

## Delivered

### Founder Action Center Authority

- Module: `src/founder-action-center/`
- Inputs: project memory, live preview reality, running application visibility, verification results, change intelligence
- Action types: REVIEW, FIX, TEST, BUILD, APPROVAL, INFORMATION
- Priority levels: CRITICAL → LOW
- States: NO_ACTIONS, ACTIONS_AVAILABLE, ACTIONS_BLOCKED, ACTIONS_READY, ACTIONS_REQUIRING_REVIEW
- Outputs: recommended next step, top actions, blockers, opportunities, execution impact, operator feed events
- Bounded generation (max 8 actions, deduped titles) with honest insufficient-info responses

### Product Shell

- Dedicated **Founder Action Center** nav surface (primary operational view)
- Sections: Recommended Next Step, Top Actions, Action Blockers, Opportunities, Execution Impact
- Operator feed streams action-planning events when opening the surface
- Updates after Founder Testing V4 API response

### Command Center

- Answers: What should I do next? What is most important? What should I review? What is blocking me? Highest impact action? What should AiDevEngine focus on next? Priority list? What can AiDevEngine do right now?
- Routes through Founder Action Center Authority before generic product identity handlers
- Never fabricates actions when product state is insufficient

### Founder Testing V3/V4

- `evaluateFounderActionCenterVisibility()` validates actions, priorities, blockers, rationale, impact, deduplication, and founder-facing copy
- V4 report section: Founder Action Center
- Founder Test API returns `founderActionCenter` after each V4 run

### Validation

```bash
npm run validate:founder-action-center
```

## Outcome

Founders can open the Action Center or ask the Command Center and immediately understand what matters most, what to do next, what is blocked, what AiDevEngine recommends, and what completing top actions is expected to improve.
