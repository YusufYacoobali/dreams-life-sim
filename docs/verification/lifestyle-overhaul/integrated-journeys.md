# Real persistent lifestyle journeys

Five integrated tests cover the six requested acceptance themes, combining
ordinary inexpensive family leisure with pet ownership and exercising inheritance
in a separate multi-generation life. They use the untouched historical employed
graduate (`v3-employed-graduate.json`) and family birth (`v6-birth-result.json`)
fixtures. No balance, date, roll, health, relative or practice history is patched.
When a purchase needs funds, the test advances the actual employed life and waits
for earned savings. Eligibility unit tests deliberately use funded fixtures and
are not included in this natural-progression claim.

| Journey | Actual progression | Committed commands | Retained outcome |
| --- | --- | ---: | --- |
| Property investor | 2023–2028 | 67 | Mortgaged Mobile Home, paid kitchen, named applicant/check/deposit, 48 actual rent periods, arrears/maintenance, notice, ending/refund, actual sale and independent Time Machine branch |
| Vehicle enthusiast | 2023 | 18 | Paid licence, purchased Used Compact, real 300-mile trip, paid service/repair/brakes, accepted gift of the same vehicle to an existing parent; 68,300 recorded miles |
| Hobby specialist | 2023–2025 | 21 | Actual paid writing attendance, real peer introduction, formal competition, completed “The last bus out of town” after later practice, independent Time Machine branch |
| Pet owner and ordinary family | 2024–2027 | 33 | Free park outing, actual parrot adoption/training, ordinary annual illness and paid care, existing spouse takes responsibility, existing child continues the family |
| Multiple generations | 2024–2025 | 31 | Earned household funds, mortgaged home/kitchen, licensed car/40-mile trip, parrot bond/training, attended writing routine, actual will, same home/car titles inherited by the existing child, adult spouse keeps pet care |

The explicit end-life command triggers estate settlement in the last two
journeys; those tests do not claim natural mortality. The pet-family journey
waits for an actual health issue during normal annual progression and pays for
available treatment. Its final pet is recovering, rather than being declared
cured before funded care finishes. The property agreement retains unpaid arrears
after ending; the report does not claim that unpaid money was collected.

Every successful command resolves through the real engine, commits to actual
on-disk WAL SQLite, physically closes the connection, reopens it and compares the
entire loaded world with the expected resolution. Controlled failures occur at
receipt insertion inside the transaction. All eight raw table contents remain
unchanged, the failed state is cold-loaded before retry, the same resolution is
replayed and an idempotent repeated receipt cannot charge twice.

The property and hobby branches use actual stored annual checkpoints and leave
their source life unchanged. Estate tests preserve the original improvement,
mileage, pet ownership/care and hobby histories. Licences and earned proficiency
stay with their actual person rather than being copied to the child.

The lossless command traces retain dates, revisions and final gameplay records:
[property](journeys/property-investor.json.gz),
[vehicle](journeys/vehicle-enthusiast.json.gz),
[hobby](journeys/hobby-specialist.json.gz),
[pet/family](journeys/pet-family-succession.json.gz), and
[multiple generations](journeys/multiple-generations.json.gz).
These automated journeys establish persistent behaviour. Human playtesting and
installed-device acceptance remain unperformed.
