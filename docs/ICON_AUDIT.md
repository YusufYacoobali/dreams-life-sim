# Action icon audit

Reviewed on 24 October 2026 against `79bcaa4c`. The [machine-readable audit](planning/icon-audit.json) records every assessed ID, source asset/crop, decision and reason. Temporary contact sheets were inspected at **36 px** and larger source-detail sizes; they are not added as another screenshot pack.

The policy is one clear main subject, generous framing, transparent/minimal backgrounds and the existing soft dimensional Dreams style. Keep legible existing art. Paired bubbles, hands, rings and tight face symbols are acceptable as one unified symbol. New image generation is limited to the identified competing clusters and interaction scenes; this is not a blanket restyle.

## Coverage

| Registry / context | Keep | Simplify | Replace |
| --- | ---: | ---: | ---: |
| Ionicons | 34 | 0 | 0 |
| activity | 12 | 0 | 0 |
| career | 10 | 6 | 0 |
| catalogue | 41 | 0 | 0 |
| cult | 9 | 3 | 0 |
| fame-business | 16 | 0 | 0 |
| family | 12 | 0 | 0 |
| finance | 2 | 0 | 0 |
| health-legal | 16 | 0 | 0 |
| hobby | 4 | 0 | 0 |
| job | 44 | 18 | 0 |
| mini-game-entry | 3 | 0 | 0 |
| person-action | 12 | 24 | 0 |
| pets-leisure | 14 | 2 | 0 |
| platform | 0 | 0 | 4 |
| polish | 21 | 3 | 0 |
| possessions | 7 | 0 | 0 |
| school | 5 | 1 | 0 |
| travel | 12 | 4 | 0 |

**Totals:** 274 keep, 61 simplify, 4 replace. Literal Ionicons glyphs are included; dynamic selectors use that same single-glyph family.

## Targeted changes

| Mapping | Focal subject | Reason |
| --- | --- | --- |
| `career:athlete` | ball | Ball and shoe have equal visual weight. |
| `career:concert` | microphone | Microphone and ticket have equal visual weight. |
| `career:film` | film camera | Reel and director chair have equal visual weight. |
| `career:politician` | podium | Podium and ballot box split attention. |
| `career:science` | telescope | Telescope and globe compete. |
| `career:training` | dumbbell | Weights and stopwatch compete. |
| `cult:ceremony` | bell | Candles and bell form several separate focal objects. |
| `cult:rivalry` | throne | Two detailed thrones and a lightning bolt split the silhouette. |
| `cult:scandal` | newspaper | Newspaper, camera, flash and warning badge compete. |
| `job:construction-worker` | hard hat | Hat, vest, bricks and trowel compete. |
| `job:electrician` | multimeter | Meter, cable, gloves and tools have competing silhouettes. |
| `job:engineer` | engineering hard hat | Hat, steel frame and rolled plans compete. |
| `job:gardener` | watering can | Watering can, flowers, gloves and trowel create accessory clutter. |
| `job:insurance-adviser` | shield | Shield, car, house and paperwork compete. |
| `job:kitchen-assistant` | plate | Dish rack, pot, sponge and gloves compete. |
| `job:lawyer` | justice scales | Scales, books, briefcase and papers have competing shapes. |
| `job:logistics-coordinator` | map pin | Map, scanner, parcel and clipboard compete. |
| `job:marketing-executive` | megaphone | Board, megaphone and bulb compete. |
| `job:mechanic` | engine block | Engine, oil can, spanners and gloves create a dense equipment cluster. |
| `job:operations-manager` | gear | Clipboard, truck and gear have equal visual weight. |
| `job:paramedic` | medical bag | Many detached medical tools make the bag cluster too detailed. |
| `job:pet-care-part` | pet leash | Leash, bowl, brush and ball form multiple equal subjects. |
| `job:plumber` | pipe wrench | Pipe, wrench and toolbox compete. |
| `job:postal-worker` | mailbox | Mailbox, mailbag and envelopes compete. |
| `job:procurement-officer` | parcel | Bags, boxes and checklist have equal visual weight. |
| `job:researcher` | laboratory flask | Molecule, flask, notebook and magnifier compete. |
| `job:retail` | cash register | Register, clothing rack, boxes and bags compete. |
| `person-action:academic-help` | open book | Book, bulb and pencil have competing high-contrast shapes. |
| `person-action:apologise` | white flag | A bowing person and tiny olive branch depend on small pose detail. |
| `person-action:argue` | angry speech bubble | Two equal bursts and a lightning bolt split the focal point. |
| `person-action:ask-activity` | kite | Two people, a kite and scenery create several focal subjects. |
| `person-action:ask-advice` | lightbulb | Person, book and bulb compete instead of one advice symbol. |
| `person-action:ask-date` | clinking cups | Large cups and a large rose compete; retain the paired-drink meaning. |
| `person-action:ask-help` | lifebuoy | People and groceries form a miniature helping scene. |
| `person-action:ask-loan` | loan document | Handshake, wallet, coins and clock compete. |
| `person-action:ask-permission` | approval speech bubble | A small parent/child scene depends on tiny facial detail. |
| `person-action:ask-teen-date` | heart envelope | People on a bench with greenery form a miniature scene. |
| `person-action:compliment` | heart speech bubble | Hand, present, heart and sparkles compete at row size. |
| `person-action:distance` | broken link | Two full people and directional arrows split the silhouette. |
| `person-action:divorce` | torn certificate | Paper, rings and pen carry too many small details. |
| `person-action:end-teen-relationship` | torn heart note | Two full people, branching paths and scenery split attention. |
| `person-action:family-planning` | baby rattle | Parents, baby, crib and calendar form a miniature scene. |
| `person-action:insult` | sharp speech bubble | Full person and angry burst compete. |
| `person-action:move-in` | key | House, suitcases and key compete. |
| `person-action:plan-wedding` | wedding rings | Couple and decorated arch form a detailed scene. |
| `person-action:praise` | star | Adult, child and award form a miniature interaction scene. |
| `person-action:request-raise` | coin stack | Hand, rising coins, arrow and briefcase split attention. |
| `person-action:review-custody` | heart shield | Child, two houses, scales and greenery form a small scene. |
| `person-action:scold` | warning speech bubble | Two full people and a pointing gesture are difficult to read small. |
| `person-action:spend-time` | handshake | Two full people, a bench, plants and scenery form a miniature scene. |
| `person-action:work-feedback` | clipboard | Clipboard, magnifier and briefcase compete. |
| `pets-leisure:cinema` | popcorn | Popcorn, film reel and loose film compete. |
| `pets-leisure:play` | ball | Ball and rope toy have equal visual weight. |
| `platform:lifelink` | X brand mark | Generic content art does not identify this platform; use a distinct recognisable brand silhouette. |
| `platform:photogram` | Instagram brand mark | Generic content art does not identify this platform; use a distinct recognisable brand silhouette. |
| `platform:streamline` | Twitch brand mark | Generic content art does not identify this platform; use a distinct recognisable brand silhouette. |
| `platform:videowave` | YouTube brand mark | Generic content art does not identify this platform; use a distinct recognisable brand silhouette. |
| `polish:everyday` | mug | Cup, calendar and pencil have competing silhouettes. |
| `polish:pet-training` | whistle | Whistle, ribbon and paw compete. |
| `polish:toys` | teddy | Bear and bright blocks split the toy silhouette. |
| `school:evening` | open book | Book, lamp and work briefcase have competing shapes. |
| `travel:abroad` | suitcase | Graduation cap, case, book and map compete. |
| `travel:flight` | plane | Plane, luggage and ticket compete in a small action panel. |
| `travel:holiday` | beach umbrella | Palm trees, hammock, boat and beach form a detailed action scene. |
| `travel:passport` | passport | Globe, suitcase and passport have equal visual weight. |

The exact subjects and Image Gen sheet registrations are in [the focused brief](../design/action-icons/brief.json). Person-action and job replacements retain their current paths, IDs and category meanings. Selected Polish and Cult PNGs are replaced at their existing paths. `SimpleSymbolArt` supplies explicit overrides in CareerArt, PetsLeisureArt, SchoolArt and TravelArt; the audit JSON records every final replacement asset and source sheet. The school evening symbol reuses the new academic-help book, and flight reuses the existing clear activity plane. Travel action replacements retain their original rectangular frame and contain the new symbol inside it; destination postcard rendering stays unchanged. No gameplay content, outcomes, eligibility or saved illustration IDs are rewritten.

## Kept on purpose

- All 12 main activity symbols, all FamilyArt and all HealthLegalArt symbols already have clear focal subjects.
- `talk`, `propose`, gift/payment hands and friendship symbols are legible. The generic `friends` and `family-life` illustrations are tight face groups without scenery, rather than miniature environments.
- Most jobs have a dominant tool, machine, garment or service container. These keep their existing art; only the 18 listed clusters are simplified.
- Destination postcards and house/car/possession listings show the actual destination or product being selected. Their contextual detail is a bounded exception, rather than a template for action buttons.
- Ordinary hobby icons already show a dominant book, controller, pot or plant.
- Mini-game entry rows are text-only. Stadium, space, safe and gameplay object layers are necessary playable scenes, not entry/action icons. Portraits and cinematic illustrations are also outside this action-icon audit.

## Real platform marks

Platform identity surfaces use `PlatformMark` / `platformMarks`, with Instagram, YouTube, Twitch and X labels while retaining the original four saved platform IDs. The small theme-coloured SVG marks share one inset footprint and require no new font. Font Awesome Free 6.7.2 SVG brand-path attribution and CC BY 4.0 licensing are recorded in [the branding provenance](../assets/branding/README.md). Generic camera/video/microphone artwork stays available for content-type actions.

This document records the pre-change audit decisions. The root integration validates generated pixels, contrast, small-size rendering and production bundles; those results belong to the completed implementation report. Focused renderer coverage is in `tests/ui/simple-symbol-art.test.tsx` (mapping, retained fallback, frame/containment and accessibility-label checks).

The [cult feature follow-up](CULT_ICON_AUDIT.md) also audits repeated mappings: five headquarters tiers and six upgrades previously shared the same chapel. It records the distinct final feature subjects, reused action art, six necessary new isolated symbols, compatibility and focused coverage. Those presentation changes are separate from the original 339-source classification above.
