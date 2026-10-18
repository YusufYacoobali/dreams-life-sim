# Screens, references, and navigation

Part of the [Phase 0 master plan](MASTER_PLAN.md). This inventory now incorporates all 27 supplied design files. See the [per-file reconciliation catalogue](design-reconciliation.md) for dimensions, screen mappings, provenance, and decisions.

## Reference register

| Code | Expected reference family from the specification | Available evidence |
| --- | --- | --- |
| V01 | Welcome, creation, avatar, newborn | 01/02/04; birth.png |
| V02 | Life dashboard, journal, profile | 02/03/13; birth.png |
| V03 | Four tabs and white activity lists | 03/05 and all feature sheets |
| V04 | School, high school, university, applications | 05/06/13; birth.png |
| V05 | Employment, colleagues, promotions, special careers | 06/13; Life Sim Tycoon_ Career And Business Hub.png |
| V06 | Finances, investments, property, vehicles, possessions | 07; asset management.png; write will.png |
| V07 | Relationships, dating, marriage, divorce, children | 08/09; breakup.png; family tree.png; heir.png |
| V08 | Health, lifestyle, treatment | 05/10 |
| V09 | Crime, arrest, trials, prison | 11/14 |
| V10 | Fame, social media, businesses, hobbies | 12/13; later career/business hub |
| V11 | Travel, holidays, pets | 10/13 |
| V12 | Achievements, challenges, extras, settings | 14; paywall and sync.png (scope question pending) |
| V13 | Later consolidated event/choice/result modals | 15/16/17; inheritance.png |
| V14 | death screen.png | File present, inspected, authoritative; overrides death panels in 14/17 |
| N | Necessary flow with no reference described | Proposed using the established component families |

All files named by these families have been visually reviewed. The reconciliation catalogue records which detailed designs take precedence; rows marked N remain designed from the shared language where no dedicated reference exists.

## A. Canonical screen inventory

List/detail pairs have real distinct purposes. Their loading, empty, owned/unowned, age-gated, and success states are variations of that screen, not extra routes. A shared layout can render different feature data while preserving feature-specific rules.

| ID | Screen and purpose | Entry → primary exits | Reference |
| --- | --- | --- | --- |
| O01 | Welcome / continue / new life | Launch → saved life or O02 | V01 |
| O02 | Character creation with randomise, identity, location | O01 → O03 or birth result → L01 | V01 |
| O03 | Appearance editor with portrait preview | O02 or approved appearance action → return | V01 |
| O04 | One-time full-screen newborn introduction | Creation → Begin Life → L01 | V01, birth.png |
| L01 | Life dashboard: identity, core stats, journal, Age Up | Birth/load/tabs → profile, actions, event queue | V02 |
| L02 | Player profile and full contextual stats | L01 → identity, school/job shortcuts, back | V02 |
| L03 | Journal/history with age filter | L01 → entries, historical facts, back | V02/V12 |
| L04 | Lifetime statistics | Profile/Extras → factual charts and counts, back | V12 |
| L05 | Life summary / obituary detail | L06 or archived life → journal and accomplishments | V14/N |
| L06 | Full-screen death | Fatal outcome → L05, new life, L07 | V14 |
| L07 | Existing-child selection and inheritance preview | L06 → confirmation → child's L01 | V14/N |
| L08 | Time Machine year list and snapshot preview | Extras → restore confirmation → restored L01 | V12/N |
| A01 | Assets overview: cash, debt, net worth, categories | Assets tab → A02–A13, business shortcut | V06 |
| A02 | Annual finances / transaction ledger | A01 → income, tax, expense breakdown, back | V06/N |
| A03 | Loans: current borrowing and eligible offers | A01 → A04 | V06/N |
| A04 | Loan detail, terms, repayment | A03 → quote/confirmation → refreshed loan | V06/N |
| A05 | Investments: holdings and market segments | A01 → A06 | V06 |
| A06 | Instrument detail with buy/sell action | A05 → quantity/quote/result → updated holding | V06 |
| A07 | Properties, owned/market segments | A01 → A08 | V06 |
| A08 | Property detail, mortgage, upkeep, sell/rent actions | A07 → transaction/action/result → detail | V06 |
| A09 | Vehicles, owned/market segments | A01 → A10 | V06 |
| A10 | Vehicle detail, purchase, condition, upkeep, sale | A09 → transaction/action/result → detail | V06 |
| A11 | Possessions and heirlooms, owned/market segments | A01/Extras heirloom shortcut → A12 | V06/V12 |
| A12 | Possession detail and ownership actions | A11 → transaction/result → detail | V06 |
| A13 | Insurance and eligible asset coverage | A01/owned asset → policy quote or cancellation | V06/N |
| A14 | Write a Will: beneficiaries, executor, allocations, special items | Assets/Extras → validate/finalise → estate summary | write will.png |
| A15 | Property sale listing: price, estimated delay, terms | Owned property → list/withdraw/offer → actual settlement | asset management.png |
| R01 | People: family/friends/partners and contextual contacts | Relationships tab → R02 or R03 | V07 |
| R02 | Person profile and contextual relationship actions | R01/school/work/pet-related owner → action or R04/R05 | V07 |
| R03 | Dating discovery and eligible introductions | R01/Activities shortcut → date decision → R02 | V07 |
| R04 | Wedding arrangement: simple venue/budget choices | Engaged partner → quote/confirm/result → R02 | V07 |
| R05 | Separation/divorce settlement and custody detail | Spouse action → terms/confirmation/result → R01 | V07/N |
| R06 | Family tree and generation connections | Relationships → real person profile or family history | family tree.png |
| R07 | Child custody agreement | R05 → custody selection → settlement confirmation | breakup.png |
| R08 | Date/spend-time activity selection | Eligible person → activity → decision/result → R02 | 08; breakup.png |
| X01 | Activities index grouped by current eligibility | Activities tab → relevant feature | V03 |
| X02 | Education dashboard for school/course or no enrolment | X01/profile → classmates, study, X03 | V04 |
| X03 | Education opportunities and applications | X02 → X04 | V04 |
| X04 | Course/application detail: requirements, fees, funding | X03 → application/funding decision/result → X02 | V04 |
| X05 | Employment dashboard, unemployed/employed/retired states | X01/profile → colleagues, X06, retirement actions | V05 |
| X06 | Job listings with eligibility shown | X05 → X07 | V05 |
| X07 | Job detail, requirements, interview/offer | X06 → interview decision/result → X05 | V05 |
| X08 | Special-career paths | X01/X05 → X09 | V05 |
| X09 | Special-career dashboard, parameterised by path | X08 → path-specific audition/training/campaign/etc. → result | V05 |
| X10 | Health dashboard, symptoms, conditions, care | X01/profile → X11 | V08 |
| X11 | Condition, diagnosis, and treatment options | X10 → consultation/treatment result → health | V08 |
| X12 | Lifestyle: routines, exercise, sleep, diet, wellbeing | X01/X10 → immediate action or persistent routine | V08 |
| X13 | Crime opportunities and risk context | X01 → decision/result or case | V09 |
| X14 | Legal case: arrest, evidence, counsel, hearing, sentence | Arrest/event/X13 → legal decisions → release or X15 | V09 |
| X15 | Prison dashboard with sentence and permitted actions | Sentence/Activities while imprisoned → prison actions or release | V09 |
| X16 | Social accounts and creation | X01/fame → X17 | V10 |
| X17 | Social profile, posts, collaborations, sponsorships | X16 → post/offer/result → updated profile | V10 |
| X18 | Fame: reputation, opportunities, controversies | X01/career → offer/action/result | V10 |
| X19 | Businesses: owned firms and startup entry | X01/A01 → X20 or X34 | V10 |
| X20 | Business detail: performance and a few meaningful actions | X19 → pricing/staff/marketing/expansion/sale decisions | V10 |
| X21 | Travel and destinations | X01 → X22 | V11 |
| X22 | Destination detail: holiday, emigration, study/work abroad | X21 → eligibility/quote/confirm/result | V11 |
| X23 | Pets, owned/adoption segments | X01 → X24 | V11 |
| X24 | Pet profile: adopt, bond, health, care | X23 → adoption/care/result → profile | V11 |
| X25 | Hobbies and entertainment catalogue | X01 → X26 or direct activity decision | V10/V11 |
| X26 | Hobby detail: skill, clubs, lessons, participation | X25 → activity/lesson/result | V10 |
| X27 | Extras: achievements, challenges, heirlooms, history, settings | X01/L01 menu → relevant canonical screen | V12 |
| X28 | Achievements with factual unlock criteria | X27 → achievement detail sheet | V12 |
| X29 | Challenge list and current progress | X27 → X30 | V12 |
| X30 | Challenge detail, goals, progress, completion | X29 → relevant action shortcut, back | V12 |
| X31 | Settings: sound, haptics, accessibility, saves, help | X27/O01 → X32/X33 | V12/N |
| X32 | Local lives / save management, archive, export/import | X31 → select/confirm/restore | V12/N |
| X33 | Help, credits, content information | X31/O01 → back | N |
| X34 | New business: name, type, startup cost in one form | X19 → funding/confirmation/result → X20 | V10/N |
| X35 | Doctor consultation, symptoms, tests, referral | X10 → consultation/result or X11 | 10 |
| X36 | Current/past medical conditions | X10 → X11 condition/treatment detail | 10 |
| X37 | Exercise choices, classes, trainer, sport | X12 → action/terms/result | 10 |
| X38 | Lifestyle routines: diet, sleep, meditation | X12 → routine selection or immediate action | 10 |
| X39 | Prison activities | X15 → allowed study/work/exercise/visits/conflict action | 11 |
| X40 | Criminal record and lasting restrictions | X13/X14 → real case details | 11 |
| X41 | Social-post composer and content selection | X17 → post intent → actual simulated response | 12 |
| X42 | Black market, offers and illicit-item ownership | X13/Extras → risk/quote/decision → legal/financial consequences | 14 |
| S01 | Restore/loading state | Launch/import → validated route or S02 | N |
| S02 | Save recovery, incompatible-save, storage-error states | Failed restore/write → retry, backup/import, safe exit | N |

**Count: 79 canonical screen definitions.** O01–O04: 4; L01–L08: 8; A01–A15: 15; R01–R08: 8; X01–X42: 42; S01–S02: 2. This is a route/content inventory, not a promise of 79 bespoke layouts. Pregnancy updates, interviews, graduation, promotions, hearings, and date outcomes usually use existing screens and the shared modal flow.

Pregnancy and parenting live in the relevant person's profile with dedicated sections/actions. Custody and settlement use R05 because their terms require an inspectable summary. Classmates, coworkers, teachers, doctors, and family members use R02 with role-specific actions.

## B. Reconciliation and overlap proposals

These initial overlap proposals are superseded where the [actual reconciliation](design-reconciliation.md) selects a reference or adds a required screen.

| Overlap/conflict anticipated by the brief | Canonical resolution | Reason / evidence still needed |
| --- | --- | --- |
| Newborn/child/adult Life layouts | O04 birth introduction; L01 with life-stage content afterwards | birth.png clarifies the one-time introduction; 02/03 establish the continuing dashboard |
| Profile versus dashboard | Compact L01; full identity/stats L02 | Avoid two competing home screens |
| Journal in Life and Extras | One L03, reachable from both | Single chronological source |
| Finance summaries on several screens | A01 totals; A02 breakdown; shared selectors everywhere | Prevent stale balances |
| Owned/for-sale property and vehicle screens | Segments in A07/A09; one detail per item type | Ownership changes allowed actions, not entity identity |
| Business in Assets and Activities | One X19/X20 implementation, two entry links | Wealth and career views must not maintain separate businesses |
| Family, friend, classmate, coworker profiles | R02 role-aware profile | Same person can have several roles |
| Dating/romance feature in multiple hubs | R03 discovery; R02 relationship actions | Prevent separate partner records |
| Primary/high school/university | X02 dashboard variants; X04 course details | Different rules and content on shared visual structures |
| Standard and special careers | X05 standard job; X09 typed special-career variants | Reuse structure while retaining distinct mechanics |
| Exercise under Health and Activities | X12 routine/action implementation | Prevent duplicate energy costs or fitness rewards |
| Heirlooms under Assets and Extras | A11/A12 item type + filters | Same ownership and provenance |
| Outcome popup designs | M04 result template with semantic variants | Prefer later consolidated reference when supplied |
| Death popup versus death screen | L06 full-screen only | Explicit authority: death screen.png |
| Conflicting typography/spacing/button versions | Use the initial palette/proportions in the reconciliation register, then compare actual captures | Source pixels do not identify an exact font family or establish completed UI fidelity |

## D. Logical navigation map

~~~mermaid
flowchart TD
  Boot[Restore save] --> Welcome[Welcome / Create Life]
  Boot --> Tabs[Game shell]
  Boot --> Recovery[Save recovery]
  Welcome --> Create[Character creation / Appearance]
  Create --> Birth[Birth milestone]
  Birth --> Tabs
  Tabs --> Life[Life]
  Tabs --> Assets[Assets]
  Tabs --> People[Relationships]
  Tabs --> Activities[Activities]
  Life --> Profile[Profile / Journal / Statistics]
  Life --> Year[Age Up pipeline]
  Assets --> Wealth[Finances / Investments / Owned goods]
  People --> Person[Person / Dating / Family actions]
  Activities --> Systems[School / Work / Health / Crime / Other systems]
  Systems --> Business[Canonical business screens]
  Assets --> Business
  Wealth --> Command[Action / eligibility / quote]
  Person --> Command
  Systems --> Command
  Year --> Decision[Decision or milestone]
  Command --> Decision
  Decision --> Result[Committed result]
  Result --> Resume[Resume prior screen or pending year]
  Resume --> Tabs
  Result --> Death[Full-screen death]
  Year --> Death
  Death --> Summary[Actual life summary]
  Death --> Create
  Death --> Heir[Existing child / inheritance]
  Heir --> Tabs
  Activities --> Extras[Extras / Settings / Saves / Time Machine]
  Extras --> Restore[Restore snapshot as timeline branch]
  Restore --> Tabs
~~~

Proposed Expo Router structure: a root stack for onboarding, the four-tab shell, canonical feature/detail routes, restoration, and death. Cross-entry links pass entity IDs and an originating route; they never copy domain state. Back returns to the originating screen with fresh selectors.

The bar is required on all four root tabs and normal nested feature pages, matching the supplied references. It is not shown before an actual life exists or on terminal full-screen death. Modal presentation preserves the underlying screen/scroll position. Root tabs retain their own scroll state. Android hardware Back follows the same stack; it cannot dismiss an unresolved required decision or accidentally start another year.

## Shared modal structures

| ID | Structure | Semantic uses |
| --- | --- | --- |
| M01 | Illustrated decision, 2–4 distinct choices | Random events, yes/no, relationships, romance, crime, health, offers |
| M02 | Compact selection or input | Gift/person choice, investment quantity, salary request, post theme |
| M03 | Confirmation with complete terms | Purchases, borrowing, marriage/divorce commitment, travel, restore, new life |
| M04 | Result with narrative and actual effect rows | Positive, negative, mixed, financial, legal, career, health results |
| M05 | Milestone/information with Continue | Birth, graduation, promotion, birthday, major life developments |

Circular illustrated art overlaps the rounded white card; text is native and selectable where appropriate. Navy title, blue choices, neutral cancel when cancellation is valid, and signed green/red changes follow the brief. Colour is accompanied by signs and labels. Long text and large accessibility text scroll inside safe bounds; choices stay reachable.

Decision → resolving → committed result → Continue → next decision or source screen. Prevent double-taps. The result is derived from committed effects, not authored numbers that may disagree with the save. Mandatory events have no misleading Cancel button. Persist both an unresolved decision and an unacknowledged result so a restart never rerolls or loses them.

## C. Missing-flow and state audit

These flows need explicit designs even if later screenshots do not include them.

| Flow / missing state | Proposed treatment | Functional acceptance |
| --- | --- | --- |
| No save / existing life / archived life | O01 changes actions based on verified save metadata | Continue never opens a nonexistent life |
| Discard current life | M03 explains archive/new-life effect | No silent deletion; cancel preserves the life |
| Invalid creation / country unavailable | Inline field errors and supported-country list | No unsupported location can be selected |
| Newborn to childhood | M05 birth then L01; later stage transitions are milestones | Same person and family IDs throughout |
| Too young / missing qualification / prison restriction | Clear reason at action entry, enforced again by engine | Disabled controls cannot be bypassed by direct commands |
| Empty job, dating, asset, pet, or challenge list | Same list layout with a short reason and useful next action | No fabricated cards or dead buttons |
| Unaffordable transaction / stale quote | M03 breakdown; revalidate at commit; refusal result when necessary | No negative cash unless explicit borrowing exists |
| Study and job applications / pending offers | Dashboard status and decision modal | Acceptance, rejection, expiry, and cancellation are defined |
| Pregnancy / childbirth / adoption / custody | R02 sections + decisions; R05 settlement | Creates or links actual child people and guardians |
| Arrest → counsel → hearing → sentence | X14 case record + M01/M04 | Evidence and previous choices survive reload |
| Prison entry → restricted actions → release | X15 context, same game shell | No free travel/job salary while rules disallow it |
| Simultaneous annual milestones and emergencies | Ordered queue, short contextual progress, then decisions | Required decisions survive interruption; no popup storm |
| Person dies/moves/leaves mid-chain | Memorial/unavailable state on R02; revalidate event binding | No interaction with a dead or unrelated replacement person |
| Fatal result | Persist death, cancel invalid pending actions, replace root with L06 | No return to playable dead state |
| No living child / child is a minor | Disabled legacy action with reason; eligible minors retain guardianship | Never fabricate an heir or give a minor unrestricted estate cash |
| Estate debts and division | L07 settlement preview, then committed result | Heir gains the actual allocated estate once |
| Time Machine cancel / restore / incompatible snapshot | L08 preview + M03; S02 on incompatibility | World, RNG, finances, and event queue restore together |
| Close app during decision/result/year | S01 restores exact phase and queue; Resume when appropriate | No skipped year, repeated salary, or rerolled outcome |
| Full storage / invalid save / newer schema | S02 with retry, known-good recovery, or compatible import | Never silently replace a corrupted life with a new one |
| Export/import failures | X32 validates schema and previews metadata before replacing | Untrusted data cannot create invalid state |
| Offline / missing optional metadata | Local gameplay continues; no network spinner on Age Up | No account/API required for a complete life |
| Safe areas / keyboard / small displays / text scaling | Shared layouts and scroll behavior | Choices, Age Up, and navigation remain reachable |
| Reduced motion / sound/haptics disabled | X31 options applied centrally | Feedback still communicates through text |

## Running-app visual acceptance

Every winning reference gets a screen ID, source filename, viewport, measured token notes, matched implementation screenshot, discrepancy notes, and acceptance status. Comparison covers header/safe areas, typography, tab layout, list density, portrait size, icon framing, buttons, modal proportions, scrolling, and death composition.

Use actual iOS and Android running-app captures at matched dimensions. A Metro export, static illustration, or JSX inspection cannot satisfy visual acceptance. Missing screenshots keep that acceptance gate open.
