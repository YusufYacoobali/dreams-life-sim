# Romance refinement review

Fourteen of the existing thirty-five authored romance/ex scenes were substantially
rewritten. The remaining twenty-one retain the quieter experiences that make
this relationship catalogue more than a sequence of crises. IDs and choice IDs
remain stable. New offers freeze the revised text and prospective consequence
metadata; already-bound offers retain their original saved prose and rules.

| Stable ID | Earlier premise | Revised premise and editorial purpose |
| --- | --- | --- |
| `romance-phone-face-down` | A phone hides surprise-cake photographs. | **The Emergency Plumber:** the player misreads an unsent affectionate message beneath an ordinary plumbing appointment; the partner blows a kiss at the blank screen while the player decides whether to admit the mistake or demand a search. Jealousy is shown through a specific embarrassing action; no affair is invented. |
| `romance-matching-outfits` | A partner suggests coordinated clothes. | **Uniform Of Devotion:** the partner salutes a mirror in matching clothes and invites the player to join a tiny dictatorship. Joining the joke uses existing clothes; neither a purchase nor a business is created. |
| `romance-argument-footnotes` | A partner writes relationship needs under headings. | **The Divorce Spreadsheet:** a spouse locks the tab containing remarks dismissed as jokes. Reading, contributing and rejecting the discussion give different emotional answers. Requires an actual marriage and argument. |
| `romance-unfinished-apology` | A partner asks for an apology without blame. | **The Apology Autopsy:** the partner circles the exact point where “but” killed the apology. The decent answer remains brief and sincere; the cruel answer visibly repeats the injury. |
| `romance-public-status` | A partner asks whether relationship privacy conceals embarrassment. | **Say It Louder:** the betrayed partner repeats “your affair” at full volume; the player can listen, request an honest private discussion or worry about their reputation. Requires the player’s actual affair with this partner, discovered and known by both. |
| `romance-museum-silence` | An argument is compared to an abstract painting. | **A Toast To The Argument:** a proposed celebration becomes two glasses of water at opposite ends of the table, with a toast to the unresolved argument. A shared joke can lead to listening; a cruel toast ends the occasion. Requires an actual earlier argument. |
| `romance-wedding-album` | A wedding photograph catches both partners looking furious. | **The Missing Face:** the spouse covers the player’s face with a thumb and jokes about a hypothetical divorce announcement, then looks at the image for too long. Requires a real marriage and earlier argument; no divorce is created by the photograph. |
| `romance-hobby-envy` | A partner lightly jokes about competing for attention. | **An Occasional Table:** the partner balances a cushion on their head and imitates furniture to show how ignored they feel. The player can listen, discuss shared and separate interests, or say “Furniture does not interrupt.” |
| `romance-perfect-couple` | A towel dispute punctures the perfect-couple image. | **The Happy Face:** the partner demonstrates an increasingly horrible forced smile, then waits for the player to choose actual happiness or an appearance of it. Healthy couples can laugh and talk honestly; demanding the facade is a distinct ugly choice. |
| `romance-ex-accountability` | An ex asks the player to acknowledge their part in the ending. | **The Apology Invoice:** emotional overtime is payable in accountability, with no amount due. The response drops the joke when the damage becomes personal. No debt or financial contract is asserted. |
| `romance-ex-mutual-joke` | An ex repeats a shared joke. | **The Disloyal Laugh:** the player laughs before they can stop themselves; the ex is pleased, then annoyed at being pleased. The player can enjoy familiarity, admit its emotional pull, or weaponise it. Nobody mistakes a shared joke for restored dating. |
| `romance-ex-closure` | An ex asks whether the couple was happy. | **The Relationship Exit Interview:** a blank palm becomes an absurd rating form. A mixed answer preserves the real history; a boundary ends further contact; a cruel rating receives a goodbye without the performative voice. |
| `romance-ex-what-if` | An ex wonders about meeting at a different time. | **The Reunion Rehearsal:** the imagined perfect reunion reproduces the original blame immediately. The useful answer names an actual relationship pattern without promising reunion. |
| `romance-ex-friendship` | An ex suggests eventual friendship. | **The Terrible Second Pitch:** the ex sells a fresh start as a damaged appliance with a useful manual. Both must be single; the player can discuss the possibility, decline further contact or pretend the history vanished. Discussion never automatically restores dating. |

## Before and after examples

**Apology:** “They are waiting for an apology that does not turn into an explanation
of why everything was their fault” becomes a partner drawing circles around the
word *but*: “This is where the apology died. Shall we identify the body?” The
player's honest answer stops before the expected defence; the bad answer begins
“but you made me”, and the pen presses through the paper.

**Accountability:** a general request that history contain both people's views
becomes an imaginary invoice with “Emotional overtime” and “No instalments of
excuses”. Accepting responsibility puts the prop away. The partner's face stays
serious. No imaginary financial obligation enters the actual ledger.

**Neglect:** a light joke about hobbies becomes a partner balancing a cushion on
their head and pretending to be furniture. Asking when they felt ignored earns a
real answer without a punchline. “Furniture does not interrupt” deliberately
turns the physical joke into a cruel choice with consequences.

**Closure:** a difficult question about past happiness becomes an exit interview
held on a blank palm. A cruel “One star. Would not recommend” causes the ex to
wait for a softening that never comes, then drop the survey voice. The ending
has emotional weight rather than a narrator's comment about a percentage.

## State, fairness and preservation

- Betrayal text cannot appear for a healthy or secretly betrayed couple. The
  affair must be the player’s own betrayal on this exact relationship, and both people must know.
- The spreadsheet cannot be offered merely because two people are dating, or to
  a spouse without an earlier recorded argument.
- The fresh-start scene requires both ex-partners to be single. Ordinary friendly
  ex contact can remain eligible when the player has another partner.
- Availability checks reject missing, deceased, minor, hospitalised, confined,
  serving-away and physically unavailable participants. No replacement person is
  substituted into a bound scene.
- The wholesome weekend, emergency support, cooking, personal space and listening
  scenes remain available without inventing an argument or affair.
- The ordinary one-scene/two-year partner-story cooldown and five-year ex-contact
  cooldown remain. These rewrites do not make betrayal or divorce random events
  for happy couples.
- The narrative props are clearly imaginary: no invoice payment, stolen
  property or business contract is claimed as a real consequence.

The twelve dramatic premises that receive prospective typed consequences are
phone suspicion, the spreadsheet, apology, affair discussion, disrupted celebration,
wedding discussion, neglect, public image, ex accountability, exit interview,
reunion rehearsal and fresh-start discussion. Their effects and frozen snapshot
contracts are covered by the dedicated consequence review and tests.

## Verification

The existing thirty-five-scene test still resolves every authored choice against
eligible real participants, validates the resulting world, and checks cold
round-trip persistence. Its betrayal scene now creates and confesses a genuine
affair through the engine instead of using a generic partner fixture.
`romance-refinement.test.ts` separately checks the specific state gates, no
secret-affair disclosure, no invented payments or marriage, unavailable people,
single-person reconciliation eligibility and healthy ordinary choices.

The story-writing contract checks retain the eighty-scene total, distinct IDs,
titles, setups and choice copy, first-person factual journals, short setups and
absence of unbound placeholders. These automated checks support editorial
review; they cannot establish that every player will find a joke funny.

## Limits

No sponsored-breakup contract or family intervention was added: the joke alone
would not justify inventing an offer, payment or relative's knowledge. The
relationship catalogue now has sharper absurd and uncomfortable scenes, while
real betrayal and marriage settlement still follow their actual saved records.
Native-device text scaling and spoken delivery require a device playthrough;
these source and engine checks do not claim that acceptance.

The final focused run passed **three suites / 122 tests**, including **17 new
refinement cases**. It also covers real no-contact rejection and deliberate lifting,
accepted and refused reconciliation after an opened discussion, mistrust followed
by repair without erasing the original argument, actual date rejection throughout
the three-month space interval and exact expiry, the next-year NPC divorce request
for a badly damaged marriage, and safe cancellation after relocation. A saved v1
phone-and-cake choice retains its original text and percentage effects without
acquiring the new mistrust memory. These are engine-level checks, not assertions
that a label or content entry exists.
