# Property, vehicles, pets and hobbies

Implemented prospectively on `v2` from `2d602ba`. New lives carry optional
`lifestyle.version: 1`; historical worlds never receive it during decoding.
Existing lives can review the expansion in Assets, Pets, Hobbies or Entertainment.
Ordinary world49/engine51/content28, enhanced creative50/52/29, overhaul1 and
all escape-session representations remain supported. Reader32 upgrades compatible
eight-table databases by changing only their metadata marker. Reader33 is refused.
New compressed exports use archive2, preventing older archive1-only apps from
quietly dropping the expansion. Existing archive1 and plain JSON imports remain supported.

Property and vehicle management is separately reviewed per existing asset. An
anonymous rental cannot transition while listed or occupied. Original purchases,
leases, titles, finance, insurance and pending choices remain literal.

Twelve paid, single-installation amenities add less estimated value than cost.
Existing pools and gardens cannot be duplicated. New dedicated rooms must leave
space for the actual household; future managed-home moves respect capacity. Suitable grounds enable horses;
home amenities reduce appropriate project energy, garage service costs, or home
celebration costs. Benefits need an actual action and never award passive skills.

Landlords advertise reasonable rent, review three named adult applications,
check actual work/savings/convictions, and accept only an available funded person.
The one-month deposit is held in separate escrow, excluded from landlord income
and assets. Real monthly rent debits the tenant and credits the owner once.
Arrears, maintenance, rent reviews, renewal and endings remain saved. Ordinary
endings require two months’ notice and completed repairs. Eviction additionally
requires two rents in arrears, a paid independent review and a further month.
Deposits are returned in full, including before an owner or tenant’s estate
settles. Ownership changes close the agreement rather than secretly assigning
another payer. Foreclosure retains the original mortgage settlement.

Vehicles retain age, condition, price/basis, insurance and provenance. Reviewed
usage starts from the catalogue’s listing mileage, explicitly leaving earlier
use unknown. Road, boating and pilot awareness quizzes save exact answers,
fees and pass/failure, with one attempt per month and three per year. Authored
country age policies apply. Ownership grants no invented historical licence.
New road trips record40/300 miles, boats12/60, and aircraft120/400 capped
at70% of catalogue range. Recorded use, fuel/running cost, wear and
occasional breakdowns persist; servicing never resets age or mileage. Repairs, cosmetics,
three one-time upgrades, accepted adult gifts and damaged-vehicle salvage are
real transactions. Boats and aircraft have six compact offerings with higher
upkeep. Held stolen vehicles remain blocked from lawful use, sales, gifts,
insurance and inheritance. Their original linked theft/title model remains.

Nine domestic species and sixteen adoption profiles retain the original six
shelter offers. Rescue, breeder, specialist and horse routes differ in species,
age, breed, fees and fixed personality. Optional training, tricks, habitat care,
quiet company, supervised introductions and small events use actual progress
and species limits. Additional minor injury, anxiety, ageing discomfort and
funded recovery supplement original illness and veterinary care. Age-related
comfort care supports the animal without curing ageing or changing its birth date. Automatic basic
care, boarding, grief, transport, rehoming and adult family succession remain.
No new housing rule removes an existing companion.

Sixteen hobbies retain the original eight proficiency/practice histories and
both paid access modes. Two routines remain the limit. Earned milestones label
actual proficiency. Annual competitions use six attended months,20 proficiency,
a named peer, consent, a paid entry and recorded chance/roll; awards are actual
ledger income. The existing club event and new competition share one annual
opportunity. Four genuinely attended later months complete a personal project,
with up to four credited together in one reviewed work session. Completed
projects never create a resale asset. Shared practice and outings
save actual consent and memories without extra proficiency/career credit.
Ten outing types include a free park visit; casual reading/writing and other
safe pursuits can be enjoyed without a paid routine or equipment purchase.

Sixty contextual situations use saved subject/participant IDs, frozen costs and
typed operations. Two optional situation opportunities per person/year and a
five-year template cooldown limit interruptions. Changed context cancels honestly.
The original annual catalogue and historical bound wording remain unchanged.

Optional prospective revisions distinguish new recorded distances (`usageVersion:2`),
ageing support (`healthVersion:2`), batched project work (`workVersion:2`) and
stricter frozen situation context (`contextVersion:2`). Missing revisions retain
the first implementation commit’s exact saved semantics. Never default these
fields when decoding an earlier record. Historical complete outcome hashes are
replayed in the compatibility tests.

In-person inspections require the property’s actual city. Landlord fees use the
property currency, including remote reviews. Applications are limited to one batch
per property per three months; history limits prevent new situations becoming
unresolvable. Shared memories retain earlier relationship history.

Verification and the final gameplay review are recorded separately in
[the verification report](verification/lifestyle-overhaul/README.md).
