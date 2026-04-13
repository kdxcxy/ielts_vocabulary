# Post-2504 Pronunciation Backfill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backfill UK/US phonetics and audio for all vocabulary rows with `id >= 2504` using `Oxford` first and local manual assets as the only fallback.

**Architecture:** Keep the existing Oxford enrichment pipeline, but remove `Cambridge` from the formal fallback path for this batch. Build a report of all missing post-2504 rows, resolve what Oxford can provide in bulk, then generate local manual IPA plus local `mp3` assets for the remaining words and persist the results into both dataset copies.

**Tech Stack:** Node.js, Next.js app routes, local JSON datasets, Python `edge-tts`, existing enrichment scripts

---

### Task 1: Snapshot the post-2504 gap

**Files:**
- Modify: `data/oxford-enrichment-report.json`
- Modify: `data/oxford-enrichment-progress.json`

- [ ] **Step 1: Measure the current post-2504 missing set**

Run:

```bash
node -e "const words=require('./data/words.json');const target=words.filter(w=>w.id>=2504);const missing=target.filter(w=>!w.phonetic_uk||!w.phonetic_us||!w.audio_uk||!w.audio_us);console.log(JSON.stringify({total:target.length,missing:missing.length,sample:missing.slice(0,20).map(w=>({id:w.id,word:w.word,story_id:w.story_id}))},null,2))"
```

Expected: a JSON summary showing the total post-2504 rows and the current missing count.

- [ ] **Step 2: Clear any stale progress before rerunning enrichment**

Run:

```bash
if exist data\\oxford-enrichment-progress.json del data\\oxford-enrichment-progress.json
if exist data\\oxford-enrichment-report.json del data\\oxford-enrichment-report.json
```

Expected: no stale checkpoint files remain from earlier runs.

### Task 2: Backfill Oxford-resolvable rows

**Files:**
- Modify: `data/words.json`
- Modify: `public/data/words.json`

- [ ] **Step 1: Run the existing enrichment pipeline only for post-2504 rows**

Run:

```bash
node scripts/enrich-oxford-pronunciation.mjs --offset=2442 --checkpoint-every=50 --delay-ms=300
```

Expected: progress logs and new Oxford data written into both word datasets.

- [ ] **Step 2: Recount the remaining missing rows**

Run:

```bash
node -e "const words=require('./data/words.json');const target=words.filter(w=>w.id>=2504);const missing=target.filter(w=>!w.phonetic_uk||!w.phonetic_us||!w.audio_uk||!w.audio_us);console.log(JSON.stringify({remaining:missing.length,sample:missing.slice(0,50).map(w=>({id:w.id,word:w.word,story_id:w.story_id}))},null,2))"
```

Expected: the remaining set should now only include words Oxford could not resolve.

### Task 3: Remove Cambridge as the formal fallback for new backfill work

**Files:**
- Modify: `README.md`
- Modify: `lib/dictionary.js`
- Test: `test/dictionary-detail.test.mjs`

- [ ] **Step 1: Write the failing test that manual fallback is used after Oxford misses**

Add a test case in `test/dictionary-detail.test.mjs` asserting that when Oxford misses and a manual entry exists, the resolver returns `source: 'manual'` without depending on Cambridge.

- [ ] **Step 2: Run the test to verify it fails for the expected reason**

Run:

```bash
node --test test/dictionary-detail.test.mjs
```

Expected: the new test fails before implementation.

- [ ] **Step 3: Update the resolver and docs**

Change `lib/dictionary.js` so the formal order is `Oxford -> manual -> AI phonetics only for internal completion work if explicitly needed`, and update `README.md` to match.

- [ ] **Step 4: Run the test suite again**

Run:

```bash
node --test test/dictionary-detail.test.mjs test/manual-pronunciations.test.mjs
```

Expected: all tests pass.

### Task 4: Generate local manual assets for Oxford misses

**Files:**
- Modify: `lib/manual-pronunciations.js`
- Modify: `scripts/generate-manual-audio.py`
- Create: `public/audio/manual/uk/*.mp3`
- Create: `public/audio/manual/us/*.mp3`
- Modify: `data/words.json`
- Modify: `public/data/words.json`

- [ ] **Step 1: Export the post-2504 Oxford-miss word list**

Run:

```bash
node -e "const words=require('./data/words.json');const missing=words.filter(w=>w.id>=2504&&(!w.phonetic_uk||!w.phonetic_us||!w.audio_uk||!w.audio_us));require('fs').writeFileSync('data/post-2504-missing.json',JSON.stringify(missing,null,2)+'\n');console.log(missing.length)"
```

Expected: `data/post-2504-missing.json` contains the exact manual workload.

- [ ] **Step 2: Fill manual IPA entries and local audio metadata**

Extend `lib/manual-pronunciations.js` and `scripts/generate-manual-audio.py` with the exported words, using local `/audio/manual/...` paths only.

- [ ] **Step 3: Generate the local audio files**

Run:

```bash
python scripts/generate-manual-audio.py
```

Expected: UK/US `mp3` files exist for every manual entry and both dataset files are updated.

### Task 5: Final verification

**Files:**
- Modify: `data/oxford-enrichment-report.json`
- Modify: `data/oxford-enrichment-progress.json`

- [ ] **Step 1: Verify no post-2504 rows are missing pronunciation fields**

Run:

```bash
node -e "const words=require('./data/words.json');const missing=words.filter(w=>w.id>=2504&&(!w.phonetic_uk||!w.phonetic_us||!w.audio_uk||!w.audio_us));console.log(JSON.stringify({missing:missing.length,sample:missing.slice(0,20)},null,2))"
```

Expected: `missing` is `0`.

- [ ] **Step 2: Run regression tests**

Run:

```bash
node --test test/story-word-detail.test.mjs test/words-data.test.mjs test/manual-pronunciations.test.mjs test/dictionary-detail.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Build the app**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Restart the service and spot-check a post-2504 word**

Run:

```bash
node --input-type=module -e "const res=await fetch('http://localhost:3000/api/dictionary/regret');console.log(await res.text())"
```

Expected: the response includes UK/US phonetics and audio fields.
