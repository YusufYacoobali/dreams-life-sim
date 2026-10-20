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
