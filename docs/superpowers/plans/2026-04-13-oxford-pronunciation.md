# Oxford Pronunciation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist Oxford UK/US phonetics and audio metadata into the word dataset and make the story word modal read from that formal data path.

**Architecture:** A shared Oxford parser resolves the correct Oxford entry URL and extracts UK/US phonetics and audio. A batch script enriches the local vocabulary JSON files, and the story detail page reads story-scoped word records first, using the Oxford dictionary API only as a temporary fallback during migration.

**Tech Stack:** Next.js 15, React 19, Node fetch, local JSON datasets, Oxford Learner's Dictionary HTML parsing.

---

### Task 1: Shared Oxford Parser

**Files:**
- Create: `lib/oxford.js`
- Modify: `app/api/dictionary/[word]/route.ts`

- [ ] Add reusable Oxford normalization, redirect resolution, and HTML parsing helpers.
- [ ] Make the dictionary API route use the shared Oxford parser instead of inline parsing logic.
- [ ] Keep an in-memory cache to avoid repeated Oxford fetches during one server run.

### Task 2: Batch Enrichment Script

**Files:**
- Create: `scripts/enrich-oxford-pronunciation.mjs`
- Modify: `public/data/words.json`
- Modify: `data/words.json`
- Create: `data/oxford-enrichment-report.json`

- [ ] Load both word datasets and group rows by normalized word.
- [ ] Resolve Oxford UK/US metadata once per unique word.
- [ ] Write `phonetic_uk`, `phonetic_us`, `audio_uk`, `audio_us`, and `pronunciation_source` back to both datasets.
- [ ] Write a failure report for manual review instead of inventing data.

### Task 3: Story Modal Formal Read Path

**Files:**
- Modify: `app/(main)/stories/[id]/StoryReadClient.tsx`
- Modify: `app/api/stories/[id]/words/route.ts`

- [ ] Read story vocabulary from the story-scoped API instead of fetching the full `words.json` in the browser.
- [ ] Initialize modal word details from persisted phonetic/audio fields.
- [ ] Keep the dictionary API as a migration fallback only when a word is not yet enriched.

### Task 4: Verification

**Files:**
- Modify: none

- [ ] Run `npm run build`
- [ ] Run `node scripts/enrich-oxford-pronunciation.mjs --limit=5`
- [ ] Verify `/api/dictionary/prism`
- [ ] Verify `/stories/1`
