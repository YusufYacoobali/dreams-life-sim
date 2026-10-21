# Current-source country policies — prepared, not executed

This tools-only candidate is separate from the original A/B/C/D policies and
all recorded producer inputs/hashes. Base is frozen C38
`dfd9a74046479672967868dc21ac6acfda734592`; target is the coordinator's future
World38 / engine39 / content13 / reader18 / checkpointv4. The final commit and
registration do not exist in this preparation. No real policy, world, SQLite
birth, game module, current checkpoint, future outcome or cohort was executed
or inspected by the author. Preparation is **not** gameplay acceptance.

The bounded proposal is [C39_POLICY_ADAPTER_PLAN.md](C39_POLICY_ADAPTER_PLAN.md).
Work approved its design, including the correction that new admissions timing
can change later actual outcomes. No historical replay equality is promised.

## Separate adapters

| New entry | Actual policy | Scope and changes |
| --- | --- | --- |
| `tools/current-policy/run-professional-v3.cjs` | New `tests/support/professionalPolicyV3.ts`, copied from originalv2 | Only university intent changes: one free real application, ordinary saved waitlist review, separate current offer/aid/actual quoted funding. Other decisions and relative ordering remain. |
| `tools/current-policy/run-criminal-v2.cjs` | Original unchanged `tests/support/criminalPolicy.ts` | Current-source registration/runner only. Original school exit, offences, not-guilty/legal/prison and honest missing milestones remain. |
| `tools/current-policy/run-entrepreneur-v3.cjs` | Original entrepreneur decision-policyv2, separate runner copy | New adapterv3. Ten original named decision/helper functions outside main remain byte-exact. Main changes source/loading/version/registration/output shell; real on-disk birth and subsequent pure-engine policy stay. |
| `tools/current-policy/run-editorial-v2.cjs` | Original unchanged `tests/support/editorialPolicy.ts` decision-policyv1 | New adapterv2. Actual committed ordinal and eligible saved-order choices remain. Current source/catalogue count derives from actual registered source; no historical250/750 recount. |

All four retain fixed country order US,CA,GB,AU,FR,DE,ES,IT,BR,IN,JP,ZA and
seeds900..911. No seed-base override or seed search exists. Repeated policies
are not additional annual-policy/distinct-seed totals. New output is explicit,
empty and outside source; original evidence paths are never rewritten.

## Professional admissions control

The original v2 helper/runner remain intact. V3's business-degree goal uses
actual `apply-university`, which spends no tuition or aid. Existing engine annual
attempt rules control rejection/withdrawal; there is no legacy-enrol fallback.
Only public actual saved status is inspected; the policy never reads a saved
admission roll/chance to choose its action.

A waitlist advances through ordinary annual/resume/choice/acknowledge commands.
Its committed actual one-month review receives a complete codec comparison.
On an accepted planning pause the adapter inspects the offer before resuming
the original year. It preserves the existing present/health/absence policy gate,
then checks actual prerequisites, residence/expiry and scholarship eligibility.
At most one eligible existing access/merit aid application is tried for the
actual offered application. A declined award remains declined. Funding uses
the exact real offered bill/waiver and actual existing currency/debt interest;
cash retains the original three-month living reserve, otherwise an eligible
explicit loan is selected. Core acceptance revalidates everything again.

`universityAdmission` still means actual funded course start. Free acceptance
alone grants no milestone. Reports additionally retain this person's actual
application transitions/enrolment and factual study-course history. Expiry,
move/death/other-course, rejection and unavailable funding remain actual records;
no historical application, receipt, start date or qualification is fabricated.

## Required source proof before loading anything

All adapters require explicit `--registration ABSOLUTE_FILE`. The tracked
`tools/current-policy/registration.pending.json` is deliberately incomplete and
fails before TypeScript, SQLite, output creation or game loading. There is no
`--force`, guessed commit or implicit current-directory runtime fallback.

The coordinator's new registration must have format
`dreams-current-policy-registration-v1`, `complete:true`, exact full target
versions and a40-character final commit, plus the following pinned files:

- `sourceSnapshot`: absolute file/bytes/SHA256 of the final frozen source capture,
  containing `root`, `commit`, `versions` and complete `source` path→SHA256 map.
- `git.head`: absolute file/bytes/SHA256 of the captured full final HEAD line.
- `git.status`: absolute file/bytes/SHA256 of an empty captured porcelain status.
- `git.commit`: absolute file/bytes/SHA256 of the **raw commit object**, not a
  decorated `git show` log.
- `git.tree`: absolute file/bytes/SHA256 of the complete recursive NUL-separated
  `ls-tree` blob listing. The verifier reconstructs every tree and commit object
  identity, rejecting an unrelated or incomplete listing.

Adapters must be integrated into and executed from that same frozen source tree.
The source capture covers runtime/config/assets, the entire tests/support tree
with all extensions, and these adapters. Every listed SHA also matches its
tracked Git blob. Missing/untracked
runtime files, symlinks, changed original producers and wrong source schema/
engine/content/reader literals are rejected. No child-process partial Git result
is accepted as proof. The explicit manifest can later show readiness without
loading TypeScript through `--manifest-only`; that still requires complete real
source proof and is never a gameplay pass.

Actual execution additionally requires coordinator `cohortRunAuthorized:true`
in that externally pinned registration, an explicit `--country CODE` or `--all`
and `--output EMPTY_DIRECTORY`. A/B/D optionally bound ordinary years1..150;
C preserves its original fixed150-year bound and rejects another value. This
flag records the coordinator's resource/freeze authorization; the preparation
template grants none. No real invocation is performed in this milestone.

The loader accepts only pinned `src/` and `tests/support/` modules from that root,
checks resolved JS/CJS/JSON/TS support/source bytes as well as TS compilation,
rejects relative imports escaping those roots and refuses preloaded/stale
source/support caches of every extension. Installed TypeScript/Zustand versions must match the pinned lock.
Installed dependency bytes are not independently claimed as a reproducible
native build. Complete source/registration is rechecked after each life/end;
loaded-source provenance is retained. Equality never removes new fields,
normalises currency or rewrites an expected outcome.

## Persistence and outcome boundaries

A/B/D use their actual original in-memory SQLite/store StartLife and Begin Life
acknowledgement. C retains actual on-disk SQLite birth and closed-connection
initial recovery, including unchanged birth-table proof during later engine play.
After birth, all policies use immutable normal pure-engine commands and complete
production checkpoint/canonical comparisons. These are **not** full-life SQLite
gameplay saves, native device restarts, all-choice coverage, national-policy
verification or physical performance. No driver silently consumes a required
interruption outside its original visible choice/acknowledge/resume policy.

Reached goals, rejected commands, missing stages, actual death and complete
trace/world hashes remain separate from integrity. B retains explicit
`scenarioBComplete:false`; C retains ordered-phase proof and actual unmet goals;
D reports observed/unseen templates and branches without an all-catalogue claim.
Different runtime/applications/pacing can change subsequent outcomes legitimately.

## Preparation checks and pending gates

Static Node syntax passes for seven new CJS files. TypeScript parse diagnostics
are zero for all eight new code files; no type resolution or module execution
was used. Static comparisons show C's ten original named functions outside main
and A's three standalone birth/codec/adoption helpers byte-identical. Nine
historical driver/support hashes match their original constants. Protected
runtime/assets/fixtures/original-driver/support Git delta is empty.

`tools/tests/current-policy-preparation.test.cjs` contains synthetic pending/
wrong-version/changed-snapshot/incomplete-Git input refusals and explicit bounded
argument checks, plus untracked sqlite.js shadow, support file/directory symlink,
changed tracked support and all-extension stale-cache negatives. These tests
are **authored, unrun**. They make no actual-source
or game-policy claim. The pending-file tests install a TS-load sentinel and
require no output directory to be created; no fake accepted game outcome exists.

Actual policy types, positive final-source registration, synthetic tests,
admission control under real command scenarios, and all real bounded/cohort
execution remain pending coordinator authorization after final C39 freeze.
Do not treat syntax, design/static review or manifest-only output as a pass.
The final source/tool SHA must be independently reviewed before root executes it.

Independent source review of initial c907056 identified that a support sqlite.js
could shadow an extensionless import because only named .ts support files were
inventoried. That candidate was not approved. The follow-up includes the whole
support subtree in actual-vs-Git inventory and resolved-module checks, checks
every source/support cache extension, and adds the four synthetic negative cases
above. No real source/runtime or test was executed to obtain this finding/fix.
