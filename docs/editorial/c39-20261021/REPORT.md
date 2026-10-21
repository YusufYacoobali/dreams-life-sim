# C39 editorial source ledger

All **265 authored situations and 795 branches** in the frozen candidate were read in full by Codex agents. This is editorial source review: it does not establish natural encounters, runtime eligibility in every context, external-human approval, release approval or shipping. One minor factual copy contradiction was found and corrected in a separate narrow commit, as recorded below. This ledger itself changes documentation only.

The complete initial review used `66ec642e4c9a9332eac322bd8fb12e0a6a3d8e87`, whose app/src bytes are identical to `ca7c72c743b98eda7c73054960bea90256b0b76f`, the static inventory source. The current corrected candidate is `d4da6b5874a9f5b49ffee6441bb823b9a046a642`:334 app/src files remain byte-identical and one content file changes exactly one result literal. This is an explicit historical-to-current bridge, not an all-runtime-bytes-equal claim. The order is fixed, zero-based, indexes **0–264**. [ledger.json](ledger.json) lists every ID, primary category, content-specific rationale, source file/line/hash, expanded-literal hash, choice IDs, authored context, reviewer and explicit status. The three raw review reports are preserved byte-for-byte beside it. [source-pins.json](source-pins.json) retains the historical335-file manifest; [current-source-pins.json](current-source-pins.json) pins the335 current files. These exclude other assets/configuration and are not entire build fingerprints.

| Review slice | Codex agent | Situations | Branches | Concrete findings |
| --- | --- | ---: | ---: | ---: |
| 0–88 | story_editorial | 89 | 267 | 1 |
| 89–176 | hobby_review | 88 | 264 | 0 |
| 177–264 | purchase_dialog | 88 | 264 | 0 |
| Total | Three disjoint source reviews | 265 | 795 | 1 |

Each slice read the actual title/setup, all three labels, result titles/results, first-person journals, requested effects and eligibility context. Shared binding/context source was consulted. The input was expanded statically from literal/helper shapes; no game module, world, policy, RNG, eligibility function, codec, SQLite, UI or native device was executed. The input/extractor and raw report hashes remain separate from game acceptance evidence.

## Coverage accounting

Each situation is assigned once by its dominant incident. Categories are editorial judgments, not new runtime metadata or evidence that a matching system mechanic occurred. Practical adult organisation and communication use the broader early-independence category. Informal activities and free community performances use entertainment. Professional Creator studio preparation uses employment; owner communication scenes use businesses. Repeated motifs were read in their actual incidents rather than counted as new coverage merely because a name changes.

| Planned primary category | Initial planning allocation | Current authored primary count |
| --- | ---: | ---: |
| Birth and early childhood | 16 | 25 |
| School and teenage life | 34 | 44 |
| University and early independence | 18 | 18 |
| Employment and special careers | 34 | 41 |
| Relationships and family | 36 | 49 |
| Money, assets, and investments | 22 | 2 |
| Health and later life | 22 | 33 |
| Crime, court, and prison | 24 | 0 |
| Fame and social media | 14 | 4 |
| Businesses | 12 | 2 |
| Travel, pets, hobbies, entertainment | 14 | 46 |
| Rare and cross-life callbacks | 10 | 1 |
| Total | 256 | 265 |

The initial distribution is from [writing-and-events.md](../../planning/writing-and-events.md), “Content coverage target”. These are visible allocation differences, not an instruction to add quota-filling material. The **hard minimum of two dedicated situational templates for each of eleven special paths is met**: Actor, Model, Athlete, Musician, Politician, YouTuber, Streamer, Business, Royalty, Astronaut and Military each have two. The existing shared Creator incident is counted once, not once per platform. The ledger enumerates those IDs.

Thin cells stay explicit. There are no dedicated crime/court/prison catalogue incidents in this primary classification. The two asset entries concern real-home upkeep; they do not establish authored investing incidents. Early-independence classification does not establish university-specific admissions stories. The rare/callback primary count is not the number of callback system phases: the school project and arcade origins remain school incidents, and system callbacks are not extra catalogue entries. Routine actions, interviews, milestones, health/legal decisions and policy commands are not counted toward the 265. Their separate implementation/test evidence must be assessed separately.

There are 245 common, 18 uncommon, one rare and one extremely rare entry. Authored context predicates overlap and must not be summed: examples include 41 school, 20 ordinary workplace, 20 actual-child, 10 pet, 10 hobby, 10 completed-trip, five diagnosed-chronic-condition and 23 special-career predicates. These are source predicates, not successful natural encounters or a 12-country fixture pass. The ledger retains all predicates and the full overlapping-count table.

## Status and the concrete finding

| Status established by this artifact | Count |
| --- | ---: |
| Authored distinct situations / choices present | 265 / 795 |
| Static inventory checks and complete Codex source review | 265 / 795 |
| Reviewed situations with no concrete finding in this pass | 264 |
| Reviewed situations with a finding, subsequently corrected | 1 |
| Unresolved concrete findings from this pass | 0 |
| Runtime-validation certifications produced by this audit | 0 |
| External-human editorial approvals recorded | 0 |
| Current-candidate release approvals / shipping certifications recorded | 0 / 0 |

The last rows describe this artifact's evidence, not a claim that no other tests, releases or reviews exist. Per-ID runtime validation remains explicitly outside this review, current gates remain pending coordinator attribution to the final source, and release/shipping statuses remain pending. “Reviewed without a concrete finding” is not universal editorial correctness or approval to ship. Individual source authorship is not certified; the ledger records repository-authored presence and the actual Codex reviewer.

**Index 44, `first-camera-closeup`, away choice:** [earlyHomeStories.ts](../../../src/game/content/earlyHomeStories.ts) line 29 says “{parent} gets a photograph of your hair.” The template requires a real parent at ages 1–3 but no hair predicate. `appearance.hair === 0` is valid (`model.ts:89`), retained from creation input (`createLife.ts:65`), and explicitly described as bald (`appearanceLabels.ts:9`). The result can therefore assume an absent visible trait. This is a static source contradiction, not a reproduced natural encounter. The separate correction `d4da6b5` uses “the back of your head”. Entry44 now records the exact corrected result/current source and literal hashes; raw review reports and historical inventory retain the original source. The other19 entries in the same source file retain exact expanded literals, while their enclosing file hash correctly changes. Saved choices, result payloads and historical fixtures remain unchanged. The correction received static parse/diff checks only in this workstream; coordinator targeted gates and release attribution remain separate. No other concrete contradiction was identified in the full three-slice pass.

## Preserved source provenance

| Projection | SHA256 |
| --- | --- |
| Original ordered 250 narratives | `3bcaeee8d5d03b0710cf9a96d0dff6cb53b182f452bc8f52c9a85e5c26be6d01` |
| Ordered 251-prefix narratives | `bc07ab4021af523d792f2202fe223759ab89b1c169be64c64e201063b6e6069b` |
| This frozen ordered 265 narratives | `43975d2d8c2acf049d576582870cdd18385080e16d1d93b74d435cfcdeb41ae5` |

These are the pre-correction source projections. No historical hash, fixture, producer pin, old source record or raw bound payload was rewritten. The snapshot/inventory and raw review file hashes are recorded in [ledger.json](ledger.json) and [SHA256SUMS](SHA256SUMS). The exact current projections below differ only by the camera result field; restoring that copied field to the historical literal reproduces the old controls.

| Corrected current projection | SHA256 |
| --- | --- |
| Ordered 250 narratives | `55bb9da021752d98a29bcc6951fbfc9f24bb998f20d2e30b4b3bb6c112c9e30b` |
| Ordered 251 narratives | `b73cb1c8630a7b4b1e3c73387368c82b5dbb6d33321223a4cbfbd105325ee32e` |
| Ordered 265 narratives | `24ed8f9d965117641530533101b72bb534af637225e685664d82dcfbd6094281` |

The runtime correction and three existing golden-check bridges are documented in [C39_CAMERA_COPY_BRIDGE.md](../../C39_CAMERA_COPY_BRIDGE.md). The original full gate at66ec642 remains attributed to the pre-correction candidate. No statement here promotes it to an exact-source full gate on the corrected runtime.

## Acceptance requirement clarification

The prior frozen `/tmp/dreams-c39-editorial-acceptance-plan.md` (SHA256 `61d8d7a11c321c7195691124d49565e8c4859bbbf82ed0fa3f890044dd1ea9a1`) included a stronger proposed step requiring three full UI/store lives. **That requirement was the author's interpretation, not an explicit source requirement, and is withdrawn.** The original report bytes are preserved; this is an additive clarification.

[artwork-and-delivery.md](../../planning/artwork-and-delivery.md) line 223 says: “Before calling the game complete, play the first minute, a continuous 30-minute session, and several entire lives. Confirm fast comprehension, useful choices, consequences that return, enough variety, and a reason to play again. Any remaining release blocker stays explicit.” Line 219 separately requires “actual UI/device acceptance”. Neither sentence specifies three complete UI/store lives, nor an external-human operator for the 30-minute session.

[source-specification.md](../../planning/source-specification.md) lines 1707–1725 explicitly describes “Full-life simulation tests”: Scenario A professional, B criminal, C entrepreneur and D varying decisions. Line 1815 says: “After 30 minutes, they should have experienced enough variety, humour, drama and progression to feel invested in the character.” It does not prescribe an external-human tester. A Codex UI review must still be labelled as such; it cannot claim measured external-player engagement or TalkBack speech.

Current-source A/B/C/D runs can establish full-life scenario evidence within their actual engine/SQLite-birth/production-codec scope and reached or unreached outcomes. They do not become whole-life SQLite/native evidence. A separate actual continuous 30-minute UI review can assess the required visible comprehension, pacing, variety and consequences without imposing three complete device lives. This source ledger performs neither procedure. The old 991 first-choice audit, historical varied-choice cohort and old full-life results retain their original counts, source/version scope and limitations; no counts are promoted to current-candidate or all-795-branch observations.

## Separate actual-sequence review references

The [recorded-life review pack](actual-sequences/README.md) adds the preselected CA901 Professional A3, GB902 Criminal Bv2 and US900 varied-choice D reviews from actual source `33b6a5fcb0aae73dfc235a15394b34d8afda00cc`. The [per-ID observation index](actual-sequences/sequence-index.json) links these observations to the 265 source-ledger IDs while retaining explicit empty cells. All original ledger rows, statuses, narrative projections, raw reviewer files and source-gallery pins above remain unchanged. The new top-level ledger references are additive; source-only status is not silently promoted to runtime/release approval.

A/B actual choices/journals (plus B result titles) are distinguished from source-correlated result prose/effects. D additionally retains actual bound bodies and affected snapshots, including 59 checked numeric catalogue rows. Counts overlap between lives and are not summed as unique coverage; none establishes all 795 executed outcomes. The [finite callback reconciliation](actual-sequences/callback-reconciliation.md) records dedicated automated connection coverage and historically scoped native positives without inventing a new device matrix. Current native/UI 30-minute and release attribution remain coordinator-owned.

The pack preserves its original report/summary/provenance/sequence bytes and hashes. Its [source bridge](actual-sequences/publication-source-bridge.json) retains 33b run attribution while explicitly identifying the one later UI-component difference at publication base 63a03c9; all game/prose bytes remain identical. The historical 335-file manifests above are not relabelled as an exact 335-file map of the later UI checkout.
