# Opening accessibility

Welcome startup failures now expose an alert with a polite Android live region.
Creation validation/save failures and newborn acknowledgement failures also use
polite live regions. Welcome's disabled Continue, custom/random start and Saved
Lives controls, plus creation's avatar controls and name fields, explicitly expose
their disabled state to accessibility services. Existing labels, selected radio
states and appearance-tab semantics remain in use.

The name keyboard's Next action focuses Last name. Done dismisses the keyboard.
Neither action validates, creates a life or saves progress; Start My Life remains
the explicit submission. Creation's keyboard-aware footer and existing large-text
layout are unchanged. Changes follow the opening structures in references 01/02
and the reconciled missing-state/accessibility requirements.

The connected [opening checks](../tests/ui/onboarding-accessibility-flow.test.tsx)
use the production store and real SQLite. Failed bootstrap/retry preserve all
saved rows; blocked controls do not navigate. Blank-name validation leaves saves
untouched. Keyboard actions do not submit. Failed creation retains identity and
all database rows; retry creates one life. Failed newborn acknowledgement preserves
the exact world and rows; retry acknowledges once, with unchanged people, cash,
ledger and random state, and cold store startup resumes the exact result.

Focused verification: seven tests across three suites pass in 3.945 seconds,
including the existing onboarding and startup flows. Strict app and test types
pass. The first diagnostic run used an unsupported test matcher and hit the
existing onboarding scenario's five-second timeout; the matcher was corrected,
and the same three suites reran with a 30-second limit. No runtime workaround or
existing-test change was made.

These checks establish component semantics and persistence behavior. Actual
TalkBack/VoiceOver speech and device keyboard acceptance remain separate native
checks; no new visual, physical timing or release-completion claim is made.

## Retained new-life review and location

Starting another life now reviews its actual name and birthplace. The validated
identity and selected creation seed remain attached to the confirmation until
the new life saves successfully. A failed save keeps the confirmation and one
polite accessible error visible; retry does not require reopening the review.
The previous life remains intact. Cancelling changes no saved data.

Choosing the current country preserves the selected city instead of resetting
it to that country's first city. An actual country change still selects a valid
city. Advanced family-background, dating/children and reproductive choices now
expose their disabled state while creation is saving. The shared family-choice
component's optional disabled prop defaults to false for existing callers.

The new [review/location checks](../tests/ui/new-life-review-flow.test.tsx) use
on-disk SQLite and ordinary production commands to prepare a previous life with
its real first-year history. Failure after inserting the new life rolls back all
eight tables; retry preserves original life/backup/moment/receipt rows, performs
zero full checkpoint unpacks, creates one newborn and closes only on success.
Closing/reopening the database resumes that exact newborn; Begin Life acknowledges
once. Separate flows retain Japan/Osaka and edited appearance across cancelled
pickers/navigation into the actual saved birth, and hold a save while advanced
controls remain disabled and unable to change the identity being committed.

All ten focused checks across the new suite and existing onboarding,
accessibility and startup suites pass in 14.496 seconds with the explicit
30-second infrastructure test allowance. Game, persistence, version tags, original
fixtures and art are unchanged. Consolidated types/UI/export gates and native
acceptance belong to the coordinator after integration; this isolated branch
does not claim those checks ran again.
