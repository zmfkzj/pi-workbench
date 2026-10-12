---
title: Use flatMap to Map and Filter in One Pass
impact: LOW-MEDIUM
impactDescription: eliminates intermediate array
tags: javascript, arrays, flatMap, filter, performance
---
<!-- Modified by pi-workbench: the flatMap examples keep the falsy-value filtering of .filter(Boolean). Upstream original and patch: see the pi-workbench patches/vercel/ directory and THIRD_PARTY_NOTICES.md. -->

## Use flatMap to Map and Filter in One Pass

**Impact: LOW-MEDIUM (eliminates intermediate array)**

Chaining `.map().filter(Boolean)` creates an intermediate array and iterates twice. Use `.flatMap()` to transform and filter in a single pass. Keep the test the filter applied: `.filter(Boolean)` also drops falsy values such as an empty string, so the `flatMap` condition must check the value as well.

**Incorrect (2 iterations, intermediate array):**

```typescript
const userNames = users
  .map(user => user.isActive ? user.name : null)
  .filter(Boolean)
```

**Correct (1 iteration, no intermediate array):**

```typescript
const userNames = users.flatMap(user =>
  user.isActive && user.name ? [user.name] : []
)
```

**More examples:**

```typescript
// Extract valid emails from responses
// Before
const emails = responses
  .map(r => r.success ? r.data.email : null)
  .filter(Boolean)

// After
const emails = responses.flatMap(r =>
  r.success && r.data.email ? [r.data.email] : []
)

// Parse and filter valid numbers
// Before
const numbers = strings
  .map(s => parseInt(s, 10))
  .filter(n => !isNaN(n))

// After
const numbers = strings.flatMap(s => {
  const n = parseInt(s, 10)
  return isNaN(n) ? [] : [n]
})
```

**When to use:**
- Transforming items while filtering some out
- Conditional mapping where some inputs produce no output
- Parsing/validating where invalid inputs should be skipped
