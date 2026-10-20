# NPC relationships from existing lives

The master specification requires NPCs to form relationships and live their own
lives. Before this slice, `relationshipsYear` only drifted the active person's
bonds, `npcYearDecisions` only searched for jobs, and `familyYear` considered
pregnancy only inside existing NPC marriages. None formed a new NPC partnership.

Annual settlement now allows **mutual dating between existing local adults**.
This initial slice adds no automatic proposal, marriage, pregnancy, child, move,
salary, qualification or person generation. Existing marriage, custody, estate,
death and continuation mechanics remain responsible for their own changes.

The relevant pool consists of the active person's existing direct contacts.
Living, unattached adults enter a stable ID order, with a rotating annual window
of at most 24 contacts. Matching happens within each existing residence city and
country, among people within twelve years of one another. This age band and the
probabilities below are authored game balance, rather than national policy.

The active person, their current partner, and everyone with any current dating,
engaged or married relationship are excluded. The helper reuses the ordinary
romance rules for each actual pair: adult ages, mutual gender preferences,
kinship, guardianship, exclusivity and physical locality. It additionally excludes
active trips, hospital stays, custody, wanted status, service assignments and
health below 25. Existing former-partner pairs do not automatically reunite.

Each NPC can make at most one attempt in the annual pass. A candidate is selected
using the persisted NPC random stream. Each person then independently agrees
with a chance of `min(75, 30 + floor(existing trust / 2))`; a new acquaintance
uses 35 trust, giving 47% per person. Both must agree. At most two pairs form in one
calendar year. Player outcomes, event and economy streams are untouched by this
helper; it draws nothing if no eligible pair exists.

A successful pair gets one ordinary persisted relationship with `dating` state,
the partner role, the actual existing person IDs, an updated interaction year and
one `npc-dating:YEAR` memory. Existing acquaintance/friend/classmate roles and
the original relationship start date remain. Newly connected pairs use the
existing contact helper. A journal entry names the two actual people and says
they started dating. It does not announce a wedding or invented financial gain.
Literal names are concatenated without token substitution.

The saved global `npc-relationships:YEAR` action guard prevents another attempt
after interruption, cold load or a same-year change of active person. It is not
scoped to a particular player ID. Failed durable saves retain the original world,
random stream and guard, so retry makes the same choices once.

One relationship scan builds direct-pair, parent and current-partner indexes;
ancestry is memoised through the same four-generation horizon used by the
existing romance rules. City groups and the 24-contact cap bound pair checks.
There are at most 36 NPC draws and two new relationship rows per annual pass, with
no new people. Existing distant people retain their saved identities and history.
This is a bounded relevant-contact slice, not simulation of every possible pair
in a large population. Rejection does not create a new contact row or public news.

Focused checks cover real annual progression from ordinary introductions,
mutual consent/refusal, literal identities, existing partners, cousins/siblings/
guardians, availability, actual booked travel/remand/service history, minors,
calendar-year replay protection and a stress case with 1,000 generated contacts. The
stress case verifies bounded operations and growth; it is not a natural population
journey, physical timing or device acceptance.

A real SQLite flow starts with the unchanged native workplace archive and its
original moments. Normal commands reach an annual NPC relationship. A failed
receipt write rolls back every table; the warm retry avoids checkpoint unpacking,
cold load retains all eight tables, old payloads/receipts stay exact and finishing
the interrupted year cannot repeat the news. This is archive-derived in-memory
SQLite evidence, not new native device acceptance or a player-facing import task.

The coordinating integration uses World33/engine34/content9 and reader13.
Old worlds gain empty courtship history without rewriting their original saved
payloads or bound scenes. The follow-on [NPC family slice](NPC_FAMILY_DEVELOPMENT.md)
adds observed courtships, paid marriages and later family growth. Autonomous moves
and relationship endings remain outside these implemented slices. Consolidated
source gates and native acceptance are recorded by the coordinating milestone.
