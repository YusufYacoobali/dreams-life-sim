# Asset, bank and investment confirmations

Owned-asset, bank and investment confirmations now remain open until their actual
command saves successfully. A failed save keeps the reviewed quote, typed amount,
selected currency/holding and mortgage term, and displays an accessible alert in
the dialog. Listing/refinance forms clear only after success. Mutation inputs and
launches are disabled during saving; only the pressed confirmation reports busy.

Drafts belong to the actual life, active person and asset/instrument. Switching
items or lives clears the prior context's local draft and quote. A new revision
in the same context does not reset a failed-save draft. Mortgage-term, currency
and price-history previews remain immediate and read-only. Changing a relevant
local input clears its old validation reason without changing the entered amount.

Bank repayment review uses the selected actual debt, its principal and the
selected currency account's spendable cash. Exchange review likewise excludes
trust-held money in its actual source currency. Investment review checks the
order and trading fee against spendable cash; its readout labels available cash
and held-in-trust funds separately. An oversized or unaffordable payment
shows its reason before opening a confirmation; it is never silently reduced.
Cross-currency debts still require their native account. Existing exchange quotes,
fees and BigInt arithmetic remain authoritative.

Refinancing with the exact current principal, annual interest and remaining term
shows a current-terms reason instead of offering an unnecessary fee. A changed
principal, rate or term remains reviewable. Sale settlement, property listing and
mortgage rules, ledger history and progression facts are unchanged. No new reward
or financial credit is granted for browsing or review.

The focused [connected UI checks](../tests/ui/asset-bank-save-flow.test.tsx) use
actual temporary on-disk SQLite databases and production commands. Eight mutation
flows cover listing, refinancing, vehicle sale, borrowing, repayment, exchange and
fractional investment purchase/sale. Every flow checks cancellation, rollback of
all eight tables, retained exact terms, retry with zero full checkpoint decodes,
a newly opened database/store's exact cold result and acknowledgement without a
second effect. Further cases cover busy/duplicate/Android Back guards, native
currency and repayment reasons, unchanged refinancing, route identity and actual
saved-life selection. Restricted-balance cases configure and validate adult
checkpoints; the second currency account comes from an actual exchange. They
verify input preservation and no confirmation/save when trust restrictions
exclude otherwise sufficient total cash, including an order whose fee exceeds
the spendable budget. These do not establish a natural inheritance transition.
Scenario funding is explicitly configured; these are not
natural-lifetime or native-device journeys, nor performance measurements.

Twenty-two tests across two suites pass in 7.378 seconds with a 30-second test timeout,
including both existing credit-flow checks. The initial diagnostic's only failure
was test setup trying to acquire a second mortgage beyond the real income cap;
that scenario now buys the second home with cash. No eligibility assertion or
runtime rule was weakened. Game, persistence, progression and immutable fixtures
are byte-identical to base 944019d. Consolidated types, exports and native visual/
interaction acceptance remain the primary integration stream's gates.
