# Travel review reliability

Trip booking, early return, emigration applications and actual household moves now
keep their reviewed confirmation until the command saves successfully. Failed
saves preserve destination, duration, focus, party, living reserve and exact
reviewed money, with an accessible alert inside the dialog. Mutation choices are
disabled during saving; only the submitted confirmation reports busy.

The current trip focus is disabled with a current-plan reason, preventing an
unchanged button from producing another saved result. A real focus change keeps
the existing payment, monthly experiences and random streams unchanged. Local
booking and moving previews and cancellation save nothing.

Drafts are keyed to the actual life, active person and route context. Switching
destination, explicit trip or work/study entry drops a previous context's quote;
a failed retry in the same context retains it. The simulation, travel leave,
consent, fees, refunds, attendance, relocation jobs/tuition and original histories
remain unchanged.

The [connected checks](../tests/ui/travel-review-save-flow.test.tsx) use actual
on-disk SQLite and production commands. They cover five reviewed transactions
plus a real focus change: cancellation, exact rollback of all eight tables,
retained terms/error, warm retry with zero full checkpoint unpacks, a newly opened
database/store's exact cold result and acknowledgement without another effect.
They also check duplicate submission, Android Back, disabled choices, focused
busy feedback and route-context reset.

Family-trip/return/focus and approved work-departure cases begin from the original
v19 and v20 archive snapshots. The snapshots and saved people, consent, offer and
random outcomes are not rewritten. New solo-booking and work/study application
cases configure funding explicitly and use the stored outcome stream without
forcing approval. These are component/SQLite checks, not native journeys or
physical timing measurements.

All fourteen affected tests across three suites pass in 18.604 seconds with a
30-second test timeout, including the existing travel and relocation flows.
Game/persistence/progression source and immutable fixtures remain byte-identical
to base 944019d. Consolidated types, exports and native acceptance belong to the
primary integration stream.
