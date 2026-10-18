# Country models and verification

The twelve version-one profiles in `src/game/rules.ts` are explicit **simplified game models**. Their numbers are authored balance assumptions, not verified statements of current national, state, provincial or constituent-nation law. No profile has passed its final source-verification gate.

The wider country roster remains in scope. The implemented education/work/finance slice differentiates currencies and minor units, school starting/transition/completion ages, work and retirement ages, base pay, living costs, tuition, loan interest and progressive income bands. Healthcare and estate parameters are reserved for later systems; their presence does not mean those systems are implemented.

| Profile | Currency | School start / completion | Retirement age in game |
| --- | --- | --- | --- |
| United States | USD | 6 / 18 | 67 |
| Canada | CAD | 6 / 18 | 65 |
| United Kingdom | GBP | 5 / 18 | 67 |
| Australia | AUD | 5 / 18 | 67 |
| France | EUR | 6 / 18 | 64 |
| Germany | EUR | 6 / 18 | 67 |
| Spain | EUR | 6 / 18 | 67 |
| Italy | EUR | 6 / 19 | 67 |
| Brazil | BRL | 6 / 18 | 65 |
| India | INR | 6 / 18 | 60 |
| Japan | JPY | 6 / 18 | 65 |
| South Africa | ZAR | 7 / 18 | 65 |

Public school progression is automatic. Higher education requires recorded qualifications, admissions and funding. Trade courses take two years, first degrees four, professional law three after a degree, and professional medicine four after a degree. These deliberately shared game pathways simplify different national qualification systems. Doctor/lawyer jobs still require their corresponding completed professional qualification.

Role salaries scale from a local profile's base pay; ranks and part-time roles use explicit factors. Actual contracts accrue pay by month. Withholding is reconciled against actual gross income at the end of an Age Up cycle or at death. Tax uses marginal bands with exact integer rounding. The cycle follows the game's annual observation date; it is not an implementation of each jurisdiction's tax filing calendar.

Living costs are a fixed local monthly baseline in this slice; housing ownership, dependants and lifestyle modifiers remain later integration work. An unpaid cost creates visible arrears rather than a negative cash balance. Loans accrue monthly capitalised interest; personal borrowing is capped at half current annual salary. Repayment reduces cash and principal together. The current pension model requires ten years of recorded work and pays 40% of average recorded annual gross earnings. National benefit, contribution, repayment, relief and pension schemes are not yet individually modelled.

On 18 October 2026, the government school-start research request to `www.gov.uk` failed at the managed network proxy (curl 56, no HTTP response). Earlier external reference requests also failed. A configuration draft now includes `www.gov.uk`, `www.oecd.org`, `uis.unesco.org` and `api.worldbank.org`; this has not changed the active network policy. These are planned research destinations, not consulted sources.

Before release, verify consequential rules, choose and document regional baselines, identify deliberate approximations, and expand testing to healthcare, family, legal, immigration and estate behavior in every pack. Passing arithmetic and progression tests establishes implementation consistency, not legal/source accuracy.
