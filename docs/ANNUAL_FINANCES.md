# Actual annual personal finances

Reference `design/07-assets-finances-investing-properties-vehicles.png` and
inventory A02 require a Finances view under Assets, with income, expenses, tax
and banking/investing connections. Assets now links to Finances; Bank also opens
its annual breakdown. Existing borrowing, repayment, currency, purchase and
owned-asset forms are unchanged. Work & Income opens the actual Work page.

This is a read-only view of the active person's own ledger, reviewed calendar
year and one explicit currency. The person's name, year and ISO currency remain
visible. Year/currency selection, category inspection, paging, cancellation and
opening links issue no game command. A life/person switch resets local scope.
These additions are separate from the parked import/export/sharing/history-file
work and add no core fields, schema/version tag, persistence API or fixture.

## What the amounts mean

- Income received is recorded gross personal pay/pensions, rent, dividends,
  creator/media/service receipts and company payouts actually paid to this
  person. Tax withheld is a separate actual payment. A contract salary, native
  foreign pension entitlement, qualification or prospective business profit
  cannot substitute for a paid receipt.
- Personal living, tuition, healthcare, care, leisure, work-production and other
  actual expense payments retain their native categories. Taxes/refunds are
  separate. Capitalised interest and unpaid bills can increase debt without
  paying cash. Their debt changes remain visible instead of becoming invented
  cash expenses. Debt repayments can include previously capitalised interest;
  the view does not invent a cash/principal/interest split absent from a row.
- Borrowing, investment principal purchases/sale proceeds, owned-goods
  purchases/sales and personal capital paid into/sold out of companies each have
  separate groups. Purchase/sale amounts are the actual recorded cash flows,
  including any fees already bundled into the quote. They do not claim realised
  profit, an investment return or a newly earned wage.
- Transfers, currency exchange, household relocation transfers and bail escrow
  stay outside income/ordinary expenses. Gifts, inheritance, support, family
  obligations and repayments received are separate personal cash flows.
  Insurance/travel/fine refunds, estate settlement and other activities remain
  visible. Unrecognised future/legacy categories go to Other Recorded Activity,
  never guessed wages. The projection retains original categories, descriptions
  and dates; transaction rows use readable category labels.
- Corporate sales, payroll costs, corporate tax, supplier debts and company
  cash are in `businessLedger` and never added to this view. Only real personal
  wages, distributions and capital movements in the personal ledger appear.
- Cash received minus cash paid equals the selected period/currency's net cash
  movement. Borrowing can increase both cash and debt; an estate debt closure
  or fine reversal can reduce debt without a repayment. Debt reductions do not
  themselves establish that a mortgage was paid off.

Currencies are never added or implicitly converted. A foreign pension paid in
JPY contributes its actual JPY receipt, with its recorded fee and tax, rather
than also adding the source USD entitlement. Selecting USD shows USD activity
and balances only. Existing exact BigInt formatting/rounding is reused, including
JPY's zero minor units.

The current account balance, available cash and outstanding debt are explicitly
labelled with the present date even when reviewing an older year. The model does
not store every original account-opening date or historical ownership/price
snapshot here, so this view does not reconstruct past balances/portfolio values.

Monthly income/expense averages divide actual recorded payments by elapsed
calendar months in the reviewed year's saved observation window. That window is
bounded by saved journal/receipt dates, the person's birth and the actual current
month. An incomplete January year uses one elapsed month, not twelve. Averages
are labelled calendar averages, not monthly salary forecasts. Posting-date cash
flow remains distinct from the earning period: a back-pay/background settlement
may cover earlier months, and a tax reconciliation may settle an earlier income
cycle. Earlier unrecorded activity is never reconstructed.

## Read cost and verification scope

`src/ui/annualFinances.ts` builds one detail-only personal index for an immutable
world/person. It scans the personal ledger once and groups actual year/currency
rows. Frozen worlds can reuse it; mutable inputs always build a fresh index.
Each filtered section preserves the original ledger posting order.
Local selection/edit renders reuse the memoized index/summary. Assets and Bank
only add route entries and never invoke this projection. Transaction display
starts with twenty rows and adds twenty through an explicit read-only action.

Focused projection checks use unchanged genuine graduate, company and foreign
pension and family-trip saves, including exact prior-year wages/loans/tuition/
interest, real owner payouts versus corporate books, paid travel, interleaved
payment chronology, JPY tax/refund/fee and partial-year averages.
Ordinary commands add borrowing, repayment, exchange, investment purchases/sales
and a gift without creating fictional income. An explicit projection-only unknown
category trap is labelled as test data, not an earning or acceptance claim.

Connected checks use a temporary on-disk SQLite database and actual store
bootstrap/life selection. They compare all eight tables, the complete world,
original snapshot bytes and RNG during year/currency/category/paging/cancel
views, then close/reopen the connection and verify the exact saved world.
They also prove entry-only Assets/Bank do not invoke the detail index, local
views reuse one index, and a real new-life switch clears old scope. These are
component/projection checks; native layout/large text, full regression, country
balance, policy lives and platform release gates belong to integration.

Final affected checks: 13 tests across two suites passed in 4.626 seconds;
strict affected-file TypeScript compilation and `git diff --check` passed.
