# Crime, prison and romance overhaul

This change extends the existing crime, legal, family and relationship systems.
It starts from remote `v2` commit `d8f3d99c`, retaining the latest Actor/Model
careers and their presentation fixes. It adds no purchase requirement,
RevenueCat change, dependency or replacement navigation system.

## Organised crime

Organised Crime is available from Activities → Crime and from the Independent
Careers section of Special Careers. The dashboard uses the existing cards,
action rows, portraits, confirmation flows and event modal.

Three fictional organisations share the legal pipeline but have distinct
assignment pools: Street Syndicate, Fraud Network and Smuggling Ring. A new
organisation creates three named crew members and one named rival. These are
actual people with normal relationships and portraits. Members retain loyalty,
ambition and bounded memories; rivals retain influence, reputation and history.
Recruitment uses an existing trusted, available local adult rather than
generating a replacement person.

The five ranks are Recruit, Trusted Member, Crew Leader, Underboss and Boss.
Promotion requires completed assignments, loyalty, reputation and criminal
experience. An underboss must win a leadership challenge to become boss. The
previous leader remains a person in the crew. Custody, a disloyal crew or a
successful challenger can remove the player from leadership.

There are ten assignment situations with cautious, bold and crew-led approaches.
Availability depends on organisation style, rank and actual available members.
Caution trades reward for lower detection and evidence; bold assignments pay
more and can cause a real injury; a capable crew changes the odds and loyalty.
A successful job can still lead to arrest. A failed job can still leave evidence.

Assignments are limited to two per person per year, across organisations. Promotion, recruitment,
leadership challenges, rival decisions and an organisation story share a limit
of one major decision per year. Ordinary member conversations have their own
small contact limits. Annual organisation incidents have a 28% offer roll,
respect the decision allowance and do not replace an existing pending event.
The older Underground Job command delegates to this same assignment loop for
an upgraded organisation, so switching screens or changing organisation style
cannot bypass the cap. Existing unreviewed legacy affiliations retain their old
rules until the player explicitly reviews them.

Income is paid only for completed assignments. Every payment has a personal
ledger row and a linked criminal incident with the same gain. The career has
no passive salary. The existing investigation, arrest, bail, counsel, hearing,
conviction, fine, remand-credit and sentence machinery handles its offences.
Former members, old jobs and old criminal cases remain after leaving.

Outside membership and prison membership are separate saved records. Outside
assignments pause in custody; custody does not earn jobs, rewards or promotion.
Release permits a return to the saved crew where the player's circumstances and
standing permit it. Leaving and eligible rejoining retain the same organisation,
people and history. Death closes the player's active affiliations rather than
passing criminal leadership or unearned proceeds to a child.

## Prison life

Security is derived from actual sentence length, offences and conduct. Short
sentences with good conduct can be low security; lengthy sentences, violent
offences, escape offences or very poor conduct raise security. No old sentence
is rewritten simply to add a classification.

Named inmates offer talk, friendship, insult, intimidation, apology, protection,
favours, reporting, rivalry challenges and relationship repair. Availability
uses actual unit membership, trust, known conflict, fitness, standing and health.
The engine enforces these requirements. An established rival can be challenged
to a fight; injuries, conduct penalties and an actual assault case follow.
An inmate's protection can reduce injuries in a later challenge. Exchanging
favours builds actual trust, bond and influence and records the obligation;
favours are not a second currency or an automatic future reward.

Prison groups use actual inmate contacts. Joining needs standing and acceptable
conduct. Contribution, mediation, promotion, departure and betrayal affect
loyalty and influence. A prison group remains smaller than the outside career;
its members do not earn an invented business income. Leaving or expulsion can
leave actual resentful contacts. Release ends membership in that prison group.

The sentence retains its work, study, exercise, appeal and parole choices.
Family contact adds letters, local adult visits and requests for support.
Letters can reach known family at a distance. Visits require an available adult
in the same city; they do not bypass child custody. Financial support requires
an eligible adult using the local currency, their consent and enough available
cash. The transfer debits that person and credits the prisoner by the same
amount. A refusal or inability to pay transfers nothing.

Prison interactions are capped at four meaningful inmate interactions per year,
with a per-inmate annual limit. Each family contact/action has an annual limit.
Optional prison situations make one annual 35% offer roll, use actual saved
participants and respect the pending-event queue. Work, study, high-security and
near-release stories require those actual circumstances.

## Exit Shuffle

Escape uses an original abstract symbol puzzle, **Exit Shuffle**, through the
existing mini-game session infrastructure. It is a short fictional challenge,
not a representation of real prison escape methods. Security sets the starting
difficulty; smarts, fitness and criminal experience can reduce it. Five levels
vary the number of symbols and permitted mistakes. Assisted input is optional.

Starting reserves that person's annual attempt and binds it to the current
sentence. The seed, difficulty,
assisted setting, input transcript, progress and elapsed time survive a save and
cold reopening. A second start cannot replace the saved session. Completion or
forfeiture settles that same reservation exactly once. Restarting or abandoning
the session cannot create a new roll or avoid the attempt limit.

Success escapes the actual active sentence and creates wanted status. Failure
or forfeiture can produce the existing real escape charge and conduct
consequences. Other active cases and custody orders remain relevant. Clutch
Shot, Safe Cracker and Orbital Docking keep their existing sessions and rules.

## Adult relationships

Affairs have a separate bounded history. They do not create a second exclusive
dating relationship or marriage. The actor, existing partner and lover are
three actual adult people. Compatibility, family exclusion, availability,
existing commitments and mutual connection are checked before an approach.
The contact can refuse.

The actor and lover initially know about an accepted affair. The partner does
not automatically gain that knowledge. Confession or witnessing an actual
ongoing affair can record discovery and damage the actual relationship. An
unavailable or deceased lover cannot be substituted into a witnessed discovery.
The player can end an affair, confess, confront, ask for an explanation or
offer forgiveness. A partner can refuse repair or end an unmarried
relationship. Marriage remains subject to the existing divorce settlement.

NPC partners can propose, end a dating relationship or engagement, request
three months of space, or ask to discuss divorce. Proposals need a strong,
trusted dating relationship and an earlier actual date. Accepting creates a
real engagement. An existing ring can be gifted through the normal ownership
record; no off-screen purchase is fabricated.

Spontaneous severe drama requires actual conflict and low trust/bond. NPC
infidelity additionally requires an impulsive partner and an available adult
contact. Stable couples do not receive forced breakup or infidelity rolls.
Proposal, breakup/divorce, space and discovery offers have per-person family
cooldowns of five, six, five and five years respectively. Ordinary partner
stories have a two-year family cooldown. A request for space expires after
three calendar months instead of creating a permanent unusable state.

Former partners can be approached, heard, apologised to, asked about
reconciliation, or asked to stop contact. Reconciliation requires both people
to be single, considers trust, bond, time since the recorded ending and known
betrayal, and can be refused. Agreement begins dating again; it does not reopen
an old marriage or erase divorces, children or custody history.

The ten date activities include the original walk, coffee, meal and film plus
fancy dinner, a local weekend outing, amusement park, concert, cooking and a
surprise date. The additional activities have good, awkward and disastrous
outcomes. Real acceptance, location, affordability and payment rules apply.

## Writing

The new authored pool contains **80 situations and 240 authored choices**: 20 organised
crime, 25 prison, 25 partner-romance and 10 ex-partner situations. These counts
exclude ten assignment definitions, routine command results and the existing
outcomes rewritten in the editorial pass. The ex-partner pool is the ten-scene
portion of the plan's wider ex/friend/family category; family contact is also
represented in the prison pool and ordinary relationship writing.
Every organised-crime offer also permits withdrawal. Three situations already
include an authored departure; the other seventeen add the shared departure
choice, for **257 offered choices** across the eighty situations. Common
withdrawals are not counted as additional authored situations.

The [writing audit](CRIME_ROMANCE_WRITING_AUDIT.md) records the existing outcomes
reviewed and rewritten, retained writing, context corrections and representative
before/after examples. New situations use short setups, distinctive decisions,
factual journals and state changes. Prison scene text and choices are saved with
their participants and change snapshots. Romance story choices are similarly
saved so later editorial work cannot silently rewrite an offered outcome.

## Compatibility and bounds

Ordinary **World 49 / engine 51 / content 28** and enhanced creative-career
**World 50 / engine 52 / content 29** remain distinct supported capabilities.
The overhaul adds optional `overhaulVersion: 1` and its prospective histories.
New lives include it. Existing lives acquire it when using a new feature action,
including one of the six new date activities. The four original dates retain
their existing behavior and format.
Decoding a legacy save does not add these fields, consume random draws, pay
historical rewards or rewrite the pending event. Actor/Model opt-in keeps its
existing world-format transition.

An enabled overhaul save must contain all three history arrays: `prisonLives`,
`affairs` and `romanceOffers`. Missing or malformed enabled state is rejected.
Unsupported future capability markers are rejected. Existing numeric gang ranks
0–3 retain their literal values until explicit organisation review; the new
five-rank state is separate, with a compatible legacy rank projection.

SQLite reader **30** is a metadata-only upgrade. It retains database v4's eight
tables and existing payloads. It does not eagerly rewrite current lives,
backups, receipts, checkpoints or Time Machine branches. Existing genuine
fixtures remain unchanged.

The lifetime limits are 128 prison histories, 128 affairs and 256 romance offers.
Each prison history has at most 12 named contacts, 96 recent interactions,
48 recent family contacts and 40 saved scenes. Organisations have at most five
active named members, eight retained members, three rivals, 32 recent jobs and
64 history entries. Older jobs retain compacted totals. The global organisation
history and per-person affiliation limits prevent repeated joining from
generating unbounded crews.

Time Machine branches retain participant and record IDs. The organisation's
saved origin-life ID remains the origin even when the root branch ID changes.
Branching does not disclose a secret affair in another future or settle a
payment in the source life.

## Verification and scope

The [verification report](verification/crime-romance-overhaul/README.md) records
the actual checks, large-life measurements, self-review and remaining limits.
The final regression covers **369 suites / 6,107 passing cases**, with no
unresolved failures or skipped cases. The **120-life soak**, strict app/test
types, 563-module import check, notice checks and both production Hermes exports
pass; all 54 changed runtime sources match both platform maps.

At ages 50, 70 and 90, complete-year enabled medians are **190.84, 362.87 and
784.06 ms** on the published large-life workloads. All nine legacy command
sequences retain identical complete outcomes. Actual active-organisation inputs
with two assignments and real cases have routine medians of **41.61, 57.69 and
61.43 ms**. The verification report retains every sample, the variable
five-sample differences and the eleven-sample follow-up; these measurements
do not establish a small stable percentage change or a mobile latency budget.

Installed Android/iOS acceptance is distinct from component tests, TypeScript
checks and Hermes bundle exports. No native-device acceptance is claimed from
those checks.
