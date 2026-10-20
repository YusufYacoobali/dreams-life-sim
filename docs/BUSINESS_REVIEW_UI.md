# Durable business confirmations

Business startup and management reviews retain the exact selected command,
title, body and quoted terms until the save succeeds. Failed writes leave one
accessible modal alert and the reviewed action available for retry. The callers
hide their duplicate background error while that review is open. Only the
pressed confirmation reports busy; other mutation launches and editable fields
are disabled during saving. Immediate duplicate submissions, cancellation and
Android modal back dismissal cannot replace an in-flight review.

Startup forms belong to the active life/person. Management forms also belong to
the actual company route ID. Changing that identity remounts the local form and
review; an ordinary revision for the same identity preserves them. Current
price, advertising campaign and payout policy rows are disabled with reasons:
each exactly matches the corresponding stored plan field. Changed choices still
use the existing reviewed command.

This follows the simple business actions in specification 5.11 and supplied
`12-social-media-fame-business-hobbies.png` / `Life Sim Tycoon_ Career And
Business Hub.png`, reopened for this review. It adds no business features or
financial rules. Company money remains separate from personal accounts. No
game, persistence, fixture, asset or version-tag changes.

## Verification scope

The new connected suite uses the unchanged v11 business archive. That archive
already contains a funded owner and an operating company; it is not claimed as
a natural birth-to-startup journey. Tests add no cash or fabricated companies.
Startup creates a second company and actual manager/worker through the real
engine. Funding transfers the reviewed amount through the actual store and
repository into company capital, leaving earned profit unchanged.

The two money-changing flows use temporary on-disk SQLite databases. Each checks
all eight tables on an injected receipt-write rollback, exact retained draft and
terms, a single accessible error, guarded duplicate/cancel/back while saving,
one pressed busy control, retry with zero warm full-checkpoint unpacks, and exact
cold recovery after closing/reopening the connection. Acknowledgement cannot
repeat the transaction, payroll/staff creation or random draw. Original archive
snapshot payloads remain byte-for-byte unchanged.

Additional checks cover all three current-plan no-ops; changed review/cancel
with no write or unpack; preserved funding review across a real price-change
revision; and reset forms when switching between two actual owned companies or
between life identities which deliberately reuse person/company IDs. The second
life is explicitly an identity-only copy for component scoping, not an earned
inheritance or natural-life claim.

Broad regression, exports and native captures remain with the coordinating
workstream.

Focused validation: new and existing business suites passed 8/8 checks across
two suites in 14.240 seconds. After adding the explicit one-busy-control
assertion, the final new suite passed 7/7 in 5.570 seconds. Strict compilation
of the final new test and its imported source passed; whitespace checks pass.
