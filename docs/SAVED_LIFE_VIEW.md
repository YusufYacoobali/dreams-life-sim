# View a saved life without switching games

Each Saved Lives card offers **View Life Summary**. It opens the selected
life's actual person, age, journal, recorded milestones and any settled estate
in a clearly labelled read-only view. Continue remains a separate action.
The viewer has no Age Up, Continue, Time Machine or file actions. It does not
select another active world or acknowledge its pending event.

The summary shares the existing bounded journal list. Loading/error/retry
belongs to this screen, with a frame available before a potentially long decode;
it never sets the game's global saving state. A cancelled/older asynchronous
response cannot overwrite a newly selected summary. A damaged life shows its
read error and Retry rather than silently showing another person.

## Save cache and integrity

`SaveRepository.previewLife` uses the same complete checkpoint/identity/revision
validation as `load`, through a shared private reader. It returns the validated
immutable world without selecting it, writing a table or replacing the active
save cache. The next gameplay commit therefore retains its ordinary warm path.
Valid, damaged-payload, wrong-identity and wrong-revision checks explicitly
verify no full decode is introduced into that next active commit.

No schema, database version, codec or game-engine source changes. Versions
remain world 28 / engine 27 / content 4 / database 6. The repository's read
helper is changed, so older combined game/persistence hashes belong to their
recorded checkpoints. Historical archives and all original compressed moments
remain unchanged. File-feature breadth stays deferred under the user's scope.

## Verification

All **156 affected checks / 52 suites** pass in **125.204 seconds**, with strict
application/test types and fresh Android/iOS Hermes exports. This includes every
UI, state, persistence and progress suite, rather than only the new viewer. The
existing pet journey now uses the compact shortcut's actual accessible name.

The connected SQLite checks use the genuine reading archive and the original
actual Android first-year archive. They retain both full worlds, mixed historical
moments, pending outcomes, backups and preferences while viewing, retrying and
handling late responses. The broader affected regression includes all UI,
state, persistence and progress suites; the game-domain baseline remains the
separate complete 1,226-test / 80-suite checkpoint at `e5a4aaf`.

Native Android review opens the two inactive Ren/Rohan summaries from Saved
Lives, preserving the original Kyoto tower and Sydney birthday-photograph
stories. The active world remains Riley.
Native Back/Welcome Continue returns to age-ten Riley and the latest teacher-
help journal fact. Every row in all eight SQLite tables matches the original:
three lives, twelve moments, seventeen receipts and active revision 53.
See [raw native proof](verification/android24-saved-life-view-20261020/) and
[source/checks](verification/saved-life-view-20261020.json).

This is view-only saved-life work;
import/export/sharing receives no new feature breadth. Physical-device timing,
standalone, iOS, complete accessibility/reference and broader production gates
remain open.

## Existing recovery summary correction

The subsequent import/recovery correction returns the authoritative summary
with the successfully committed world. Normal action summaries already retained
branch origin. The fix avoids another list/history/decode operation after the
write and keeps the next action warm. Plain-world replacement clears an old
origin rather than copying it from stale state; failed recovery publishes
nothing. No additional player file feature is introduced.

All 161 affected UI/state/persistence/progress checks (54 suites) pass in
142.146 seconds, plus strict types and both fresh Hermes exports. Actual Android
recovery of the branch's saved lunch result and one acknowledgement returns to
the exact expected current/backup worlds. Its branch label appears immediately
on Saved Lives. Original lives and history stay exact; the existing recovery
receipt-reset policy leaves eighteen global receipts. See
[native proof](verification/android24-save-summary-20261020/) and
[source/checks](verification/save-summary-20261020.json). Earlier records above
retain their original source and counts.
