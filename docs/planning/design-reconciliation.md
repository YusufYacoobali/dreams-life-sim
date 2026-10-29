# Design reference reconciliation

All **27 supplied PNG files** in design/ were opened and visually inspected at original resolution. This supersedes the earlier missing-reference report, which described a stale checkout.

## Provenance

The local branch previously contained origin/main at 28d36be. A read-only remote check found main had advanced to ed084db. Fetching and merging that branch brought in the references without overwriting the local planning commit.

- 33a890a: numbered sheets 01–17 plus death screen.png.
- ed084db: nine additional detailed references.
- Both source commits are dated 18 October 2026. Git provenance establishes the later set; filesystem timestamps were not used to guess design precedence.

The written specification still governs interaction, writing quality, consistent calculations, and no unrequested monetisation. The dedicated death reference explicitly overrides older variants.

## Complete image catalogue

Dimensions below are source-image pixels, including phone frames/contact-sheet backgrounds. They are not app layout dimensions.

| Supplied file in design/ | Dimensions | Screen IDs / structures | Inspected content and disposition |
| --- | --- | --- | --- |
| 01-character-appearance.png | 309×508 | O03 | Four-column portrait grid, blue selected outline, appearance segments, progress indicator, blue Continue |
| 02-onboarding-life-dashboard-age-up-profile.png | 1536×1024 | O02, L01, L02, M05 | Detailed creation, five dashboard stats, journal, green Age Up with adjacent menu, birthday, profile; primary core-layout source |
| 03-core-navigation-screen-overview.png | 1024×1536 | L01/L02, A01, R01, X01, M01 | Confirms four tabs, compact lists, financial/people overviews and decision overlay |
| 04-full-app-screen-overview.png | 1536×1024 | O01/O02, X02/X06/X21, R01, A01, X10/X13/X16/X23, M01 | Broad coverage and welcome hero; use detailed feature sources where available |
| 05-activities-main-menu-overview.png | 1536×1024 | X01/X02/X05/X10/X12/X13/X21/X24, A01, R01 | Ten-category Activities index and detailed education/job/health/lifestyle/crime/travel/pet actions |
| 06-education-university-jobs-careers.png | 1536×1024 | X02–X09, R01/R02, M01/M04 | University search/filters, requirements, hourly jobs, performance, coworkers, promotion/admission decisions |
| 07-assets-finances-investing-properties-vehicles.png | 1536×1024 | A01–A12, M02–M04 | Net-worth hub, finances, instrument lists/trade quote, property and vehicle/detail art, possessions |
| 08-relationships-dating-marriage-family.png | 1536×1024 | R01/R02/R04/R08, M01/M04 | Person traits, date activities, proposal, wedding budgets, parents/children; role lists remain shared |
| 09-relationship-conversations-romance-parenthood.png | 1536×1024 | R01/R02/R08, M01/M04/M05 | Grouped people, topic selection, conversation/date outcomes, argument, pregnancy, actual child birth |
| 10-health-wellness-travel-pets.png | 1672×941 | X10–X12/X21–X24/X35–X38, M04 | Doctor visits/tests/referrals, current/past conditions, exercise, lifestyle segments, destination cards, pet stats |
| 11-crime-arrest-court-prison.png | 1672×941 | X13–X15/X39/X40, M01/M04 | Risk/confirmation, arrest/bail, case/court, sentencing, prison activities, release, criminal record |
| 12-social-media-fame-business-hobbies.png | 1672×941 | X16–X20/X25/X26/X27/X41, M01/M04 | Social profile, post composer, viral result, sponsorship, fame, company overview/manage actions, hobbies/entertainment |
| 13-career-business-fame-travel-journal.png | 1536×1024 | X02/X05/X18–X22/X27, L03, M01/M04 | Career/retire, course changes, light business/product actions, brands, journal timeline, will/estate shortcut |
| 14-achievements-challenges-settings-end-of-life.png | 1536×1024 | X27–X31/X42, L04/L08 | Achievements/challenges, Time Machine, black market, stats/settings; red death variant loses to dedicated source |
| 15-event-modals-core-decisions.png | 1448×1086 | M01/M03/M04/M05 | Native text/terms/choices/results in rounded white cards with circular illustration; consolidate with 16/17 |
| 16-event-modals-milestones-and-outcomes.png | 1672×941 | M01–M05 | Consolidated decisions, selection, confirmation, milestones/results and newborn details; structural modal authority |
| 17-event-modals-success-failure-and-end-of-life.png | 1536×1024 | M01–M05; alternate L06 rejected | Further consolidated success/failure/selection/health/legal variants; death-popup panel explicitly superseded |
| Life Sim Tycoon_ Career And Business Hub.png | 1536×1024 | X08/X09/X19/X20/X34 | Company types/performance, creator setup/team/actions; adds Royalty, Astronaut, Military; doctor/lawyer link qualified careers |
| asset management.png | 1211×645 | A04/A08/A15 | Owned-house details, sale price/delay choices, mortgage terms/payment/remortgage; authority for owned-property actions |
| birth.png | 1448×1086 | O04, L01, X02, M01 | Full-screen newborn introduction, childhood dashboard, primary-school performance, age-appropriate invitation |
| breakup.png | 1536×1024 | R02/R03/R05/R07/R08, M01/M04 | Meet people, personality/interests, date activities, relationship actions, breakup, settlement and custody |
| death screen.png | 941×1672 | L06 | Authoritative full screen: dark navy, tombstone/heart, You Died, age/summary, white fact card, three large actions |
| family tree.png | 863×1822 | R06, R02, L03 | Parent/player/partner/child linked cards, generation count, profile and family-history entry points |
| heir.png | 863×1822 | L07 | Selectable existing-child cards, contextual stats, actual inheritance preview, Continue as Selected Heir |
| inheritance.png | 863×1822 | M04 estate variant | Memorial illustration, deceased person's name, actual money/heirloom changes, grief/family effects, Continue |
| paywall and sync.png | 816×1065 | X32; premium/cloud excluded | User confirmed free/offline local saves/export/import; retain saved-life layout, omit paywall and cloud-status claims |
| write will.png | 863×1822 | A14 | Estate summary, beneficiary percentages, equal/custom allocation, executor, specific heirloom assignments, finalise |

## Canonical visual and interaction resolutions

| Area | Winner / resolution | Implementation consequence |
| --- | --- | --- |
| Main dashboard | 02 + 03, corroborated by birth.png | Show Happiness, Health, Smarts, Looks, **Respect**; fifth dashboard bar resolves the earlier four-stat proposal |
| Dashboard progression | Journal card and green Age Up from 02/birth | Same live dashboard at every age; ordinary lists do not become a management dashboard |
| Creation and appearance | 02 detailed form + 01 grid | No game-tab navigation before an actual life exists; selected avatar and identity remain editable |
| Welcome | Hero composition from 04 | Generated original illustration; native title/actions; no screenshot background |
| Birth | Dedicated birth.png | Add one full-screen newborn introduction, then the single Life dashboard; do not create a separate childhood application |
| Main and nested navigation | Consistent four-tab bar visible across feature references | Preserve the bar on normal feature pages; modal overlays preserve the underlying screen; no fifth Extras tab despite the star variant in 12 |
| Cross-entry features | One domain implementation, origin-aware navigation | Business from Assets or Activities shares entity/state and returns to the source; no duplicated businesses |
| Modal structure | Consolidated 16 and 17, supported by 15 | Five reusable structures; rounded white card, overlapping pastel circular illustration, short navy text, blue choices, grey valid cancellation |
| Death | death screen.png | Full-screen terminal route; no popup or red alternative; retain the three exact specified actions |
| Death writing | Actual-life facts override the reference's generic paragraph | Preserve layout while writing concise, personalised text grounded in real history |
| Property ownership | asset management.png over generic purchase details in 07 | Existing loans and equity, renovation, rent, sale listing and remortgage must be functional |
| Sale and loan numbers | Engine arithmetic, not illustrative raster numbers | Compute percentage differences, amortisation, repayments, fees, delays and remaining principal accurately |
| Family and legacy | Dedicated family tree / heir / inheritance / will | Add the missing family tree and will; bind real relatives, beneficiaries, estate rights and owned items |
| Divorce | breakup.png | Settlement and custody are distinct inspectable steps; result uses actual agreements and transfers |
| Currency | Selected country's currency and stored asset currency | Correct mixed USD/GBP examples; JPY never inherits a two-decimal assumption |
| Annual/monthly timing | One Age Up remains one year; internal dated substeps | Month-long sentences, sale delays, pregnancy, rent and pay need sub-year scheduling and prorated eligible periods |
| Stats/results | Defined causes and committed effects | No instant $120,000 bank credit for a $120,000/year job; no unrelated Looks change from a date merely because a mockup shows it |
| Copy | User's direct, original writing brief takes priority | Replace generic “new chapter”, inspirational filler, and repeated congratulations with reviewed game writing |
| Special careers | Later detailed career sheet | Add distinct Royalty, Astronaut and Military paths to the planned eight; doctor/lawyer remain qualified standard-career ladders |
| Black market | 14 dark feature screen | Add a real illicit-market system linked to ownership, evidence and legal risk; no fake risk-free purchases |
| Brand/platform examples | Original fictional content and generated illustrations | Use consistent original business/platform/item identities rather than copying raster logos/text as game art |
| Settings | Every exposed control must have behavior | Sound/haptics/reduced motion/dark mode require implementation; do not show a fake Connected badge or analytics switch |
| Premium/cloud | User confirmed free/offline | No subscriptions, purchases, accounts, cloud backend, or false sync claims; implement local saves/export/import |

## Initial design-system measurements

The references are flattened generated mockups with inconsistent device frames and contact-sheet scaling. Measurements must be normalised to the inner content viewport, excluding the phone bezel, status bar, and outer labels.

- Primary appearance-grid buttons sample around RGB (0,105,237); core event actions vary through brighter blue gradients. Start with a blue action family and compare rendered screenshots, rather than claim a single exact colour occurs everywhere.
- The dedicated death background has dominant pixels near RGB (27,36,51), approximately #1B2433. Its large summary card is off-white with dark navy labels and green wealth/health values.
- Core light screens use a warm near-white background, white rounded surfaces, fine grey separators, muted blue-grey secondary text, and navy bold headings.
- Main stat colours are green, teal, blue, purple, and amber, in the five-stat order above.
- Reference typography is a rounded modern sans; the exact font family cannot be proven from pixels. Begin with platform-native system type and compare weight/line-height/letter spacing on actual devices before accepting it.
- Initial logical layout targets derived from inner phone proportions: around 16px side gutters, 44–52px header, 56–72px action rows, 56px bottom tabs plus safe area, 14–20px card corners, 48px minimum main choices, and a 64px Age Up control. These are implementation starting points, not final fidelity sign-off.
- Portraits are circular or softly rounded; custom illustrations are clean, rounded, friendly and lightly dimensional. Illustrations overlap modal cards with a white ring and pastel backing. Generate originals; do not slice reference art into final game assets.

## Added screens and missing flows

The initial specification-only inventory had 65 definitions. Actual references require **79 canonical screen definitions** after adding O04, A14–A15, R06–R08, and X35–X42. Different ages, person roles, filter tabs, outcomes and career variants still share implementations.

New explicit flows:

- Assets → Write a Will → percentages/beneficiaries/executor/items → validation → finalised estate instructions.
- Relationships → Family Tree → real member profile or filtered family history.
- Person → Date Activities → choice → date event/result.
- Divorce terms → Child Custody → actual settlement/result.
- Owned property → sale pricing/listing → scheduled offers/settlement, without an immediate fabricated sale.
- Health → doctor consultation / current-past conditions; Mind & Body → exercise / lifestyle.
- Crime → actual criminal record; Prison → restricted prison activities; Extras → Black Market.
- Social profile → post composer → actual simulated post/response.

The original missing-state audit remains required: bad saves, storage failures, ineligible heirs, interrupted years, unaffordable purchases, deceased event targets, empty lists, keyboard/large-text behavior, and cancellation do not gain adequate designs just because the reference set has arrived.

## Verification and implementation authorisation

Reference inspection and reconciliation are complete for all 27 files. This is **reference review**, not validation of a running game's visual fidelity. No application screens or generated artwork have been implemented.

The user settled the material conflict by choosing free/offline local saves/export/import. Phase 0 is closed and the existing approval authorises implementation through the remaining phases. No repeat approval of the overall direction is needed.
