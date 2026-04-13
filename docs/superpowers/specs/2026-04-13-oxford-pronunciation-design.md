# Oxford Pronunciation Design

**Goal**

Use Oxford as the single source of truth for UK/US phonetics and pronunciation in the story word detail modal.

**Decisions**

- Phonetic standard is Oxford only.
- Pronunciation standard is Oxford UK/US dictionary audio only.
- Runtime browser TTS is no longer the primary path for the formal version.
- Word metadata is persisted into `public/data/words.json` and `data/words.json` using:
  - `phonetic_uk`
  - `phonetic_us`
  - `audio_uk`
  - `audio_us`
  - `pronunciation_source`

**Architecture**

- Add a shared Oxford parser module in `lib/oxford.js`.
- Add a batch enrichment script to write Oxford metadata into the local word datasets.
- Keep `/api/dictionary/[word]` as a server-side Oxford-backed fallback for words not yet enriched.
- Update the story page to fetch story-scoped vocabulary data from `/api/stories/[id]/words` instead of loading the full `words.json`.
- Story modal reads stored UK/US phonetic and audio fields first.

**Error Handling**

- Missing Oxford matches are written into a review report instead of silently fabricating phonetics or audio.
- The UI may temporarily fall back to the dictionary route during migration, but it must not duplicate one accent into the other.

**Verification**

- Build must pass.
- `/api/dictionary/<word>` must return Oxford UK/US phonetic and audio data.
- `/stories/<id>` must return `200`.
- After enrichment, story words should open without runtime phonetic scraping for enriched entries.
