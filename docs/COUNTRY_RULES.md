# Country models and verification

The twelve version-one profiles in `src/game/rules.ts` are explicit **simplified game models**. Their numbers are authored balance assumptions, not verified statements of current national, state, provincial or constituent-nation law. No profile has passed its final source-verification gate.

The wider country roster remains in scope. The implemented core differentiates currencies and minor units, school starting/transition/completion ages, work and retirement ages, base pay, living costs, tuition, loan interest, progressive income bands and estate allowance/tax/protected-share parameters. General healthcare remains a later system; the doctor-visit parameter currently also informs pregnancy care costs.

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

Living costs use a local monthly baseline: one independent adult costs 100%, each additional adult 50%, and each dependent child 25%. Paying adults share the budget with deterministic minor-unit remainder allocation. Owning a primary home reduces that baseline to 45%, with property upkeep, insurance and mortgage payments charged separately. Children attending local mandatory school do not cover adult living costs. Unpaid costs create visible arrears. Loans accrue monthly capitalised interest; personal borrowing is capped at half current annual salary. Repayment reduces cash and principal together. The current pension model requires ten years of recorded work and pays 40% of average recorded annual gross earnings. National benefit, contribution, repayment, relief and pension schemes are not yet individually modelled.

Courtship and marriage use a shared adult-age gate, mutual preferences and consent. Ceremony budgets scale from local base pay. Spouses share a household but retain individual accounts and ownership; marriage records preserve starting net worth. NPC discretionary budgets consume 40%/65%/90% of positive monthly surplus according to practical/ordinary/impulsive traits. Unobserved contacts settle recorded wages, tax and living/discretionary costs once on return; this coarse background model does not reconstruct every missed promotion or event.

The current family model is deliberately shared across all twelve packs and is not verified family law. Conception needs mutually willing adult partners with complementary reproductive capacities and uses age/health/fertility chances. Pregnancy lasts nine months, with prenatal costs based on the doctor-visit parameter and a small loss risk when health is below 35. Adoption requires age 21–65, health at least 40, income, a household and a 10%-of-base-wage placement fee; these are game gates, not statutory eligibility criteria. Known NPC married couples can have children through the same persisted pregnancy/birth pipeline. Orphaned minors join a real living parent/relative/guardian household.

Divorce equalises changes in net worth since recorded marriage baselines; original wealth, recorded inheritances and outside-couple gifts are excluded from marital gains. Cash transfers first, with unpaid equalisation a zero-interest liability and an equal receivable owed to the other person. It does not conjure a bank loan. Primary care considers the requested parent and health/discipline/bond; shared care requires the same city. Support is 10% of the payer’s recorded gross annual pay/pension per dependent child, capped at 30% total, divided into monthly real transfers. Unpaid support is owed to the primary parent. Custody can be reviewed yearly and ends at adulthood/death; existing obligations remain collectible. These shared models simplify contested proceedings, property division, means tests and regional differences.

An estate settles exactly once from actual accounts, assets, holdings and debts. Default succession gives a living spouse half with descendants sharing the other half by family branch; a spouse without descendants receives all. Without a spouse, descendants receive all; living parents, then siblings, are fallbacks. No eligible heirs means a donation. A will allocates the discretionary pool in exact basis points, while each profile reserves its protected-family percentage against default shares. Deceased named beneficiaries are excluded and the surviving discretionary weights are renormalised; if none survive, default succession applies.

Estate liquidity uses stored offline valuations: ordinary asset sale discounts/fees, a 1% investment sale fee and zero-fee rational currency consolidation with final-minor-unit rounding. Outstanding internal receivables are assigned to an external buyer for 95% of recorded value; the original debtor still owes the principal to that external creditor. This explicit game-market assumption permits estate liquidity without duplicating a claim and cash. Creditors are paid in tax/mortgage/family/other order, before estate tax and heirs. Unpaid estate debt is written off rather than inherited. Estate tax uses each profile's allowance/rate on actual remaining value. Specific bequests survive only if debts/tax can be funded and the asset fits the recipient's protected/discretionary share; otherwise they are liquidated with a recorded explanation. These are authored simplifications, not verified national probate law.

Minor cash inheritance is held in trust until the local adult age. It remains part of net worth, with voluntary spending limited to available cash. Automatic necessary upkeep/insurance/mortgage costs on inherited ownership may draw trust funds. Guardians cannot use the child's trust for gifts or their own personal expenses. Legacy switches to an existing child at the unchanged world date and preserves any remaining annual months for explicit continuation. Migrating old saves does not invent retrospective estates or unknown historic ownership transfers.

The ownership slice uses game rules shared across packs: 2% property purchase fees, 3% property sale fees, 20% minimum mortgage deposits and a 40% gross-income payment ceiling. Mortgages have local-rate-derived interest and 10/20/30-year terms. Six missed payments trigger a discounted forced sale; any shortfall remains debt. These rules do not represent national repossession procedures. Rent is taxable gross income in the current model. Positive investment/asset gains are taxable; losses do not grant relief. Asset cost basis includes purchase fees and capital improvements. National exemptions, property taxes and itemised deductions remain unverified/unmodelled.

All securities, crypto names, initial FX ratios, dividends and price movements are authored offline game data, not live instruments or financial data. FX transactions use stored rational rates and a 1% fee rounded up to a destination minor unit; this prevents tiny rounding cycles from generating money. Net worth values each asset/account/holding once and subtracts each liability once in the residence currency.

On 18 October 2026, the government school-start research request to `www.gov.uk` failed at the managed network proxy (curl 56, no HTTP response). Earlier external reference requests also failed. A configuration draft now includes `www.gov.uk`, `www.oecd.org`, `uis.unesco.org` and `api.worldbank.org`; this has not changed the active network policy. These are planned research destinations, not consulted sources.

Before release, verify consequential rules, choose and document regional baselines, identify deliberate approximations, and expand testing to healthcare, family, legal, immigration and estate behavior in every pack. Passing arithmetic and progression tests establishes implementation consistency, not legal/source accuracy.
