# Financial progress from actual transactions

The catalogue now has **45 achievements, 14 challenges and 43 facts**. Five new
achievements and two challenges recognise personal investment purchases, actual
dividends, property purchases and completed mortgage repayments. All existing
achievement/challenge IDs and their targets stay unchanged.

The investor path in the master specification calls for a viable investing life,
with real gains and losses. These goals recognise decisions and retained payment
history without inventing a wealth threshold, claiming guaranteed returns or
awarding cash. The investment and property goals link to the existing Investments
and Assets pages. Virtualised list behaviour remains unchanged.

- **A Stake in Something:** one actual personal investment-purchase payment.
- **Dividend Day:** an actual positive personal dividend receipt.
- **Patient Capital:** dividend receipts in twelve distinct calendar months.
- **On the Deeds:** a personally purchased property with its actual payment.
- **The Last Mortgage Payment:** a mortgage originated for a property this person
  purchased, brought to zero through their actual regular or extra repayments.
- **The Patient Investor:** a paid investment purchase and twelve dividend months.
- **Paid for in Full:** a personal property purchase and a completed mortgage
  repayment meeting the rule above.

Dividend months are distinct months with cash actually received, rather than a
count of holdings, payments, market increases or consecutive calendar months.
Two funds paying in the same month count once. The current simulation pays
dividends quarterly, so twelve payment months normally take three years. Sale
proceeds, exchanges, inheritance, business capital and transfers are separate
ledger categories and cannot substitute for purchase payments or dividends.
Owning a gifted or inherited asset alone earns none of the purchase milestones.
Receiving cash through inheritance does not itself earn an investment milestone;
using personal available funds to make a later real purchase can do so.

Property evidence binds the retained asset's original acquisition action ID,
date, currency, name and actual purchase charge. This attributes the purchase to
the person who paid, including a proven purchase in the old property fixture
whose migrated ownership source is `legacy`. Current ownership, a provenance
sentence or a matching name alone is insufficient. Sold properties stay in the
retained history, so the buyer keeps their purchase credit after sale or bequest;
the recipient does not acquire that credit.

Mortgage progress reconciles the original funding, accrued interest and later
debt changes. Only the person's cash-backed regular or extra repayments may
close an eligible loan. A partial payment, sale settlement, refinancing settlement,
estate closure or writeoff cannot grant a payoff. Refinancing does not count the
old loan as repaid for this goal; a later genuinely repaid new mortgage can count.
An earlier legitimate payoff remains earned after a later sale or new loan.

Facts use the existing single ledger pass with indexed asset/loan lookups. They
are read-only: no world edits, random draws, saves or rewards. The evidence uses
existing stable acquisition/funding IDs and authored transaction labels. A legacy
record that lacks this evidence receives no inferred mortgage or property credit.
Game, persistence, schema and content versions remain unchanged by this work.

Focused checks use real production commands from unchanged graduate/property
fixtures: two investments, twelve dividend months, full investment sales,
mortgage purchase/interest/partial and full repayment, later property sale,
refinancing, estate settlement and an actual bequest. Explicit validated identity
and ledger traps supplement those journeys. They are domain checks, not native
birth-to-investor, release, performance or country-source acceptance. No legacy
fixtures were regenerated. Root integration owns UI destination labels, updated
catalogue totals, consolidated checks and native acceptance.
