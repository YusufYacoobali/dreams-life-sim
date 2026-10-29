# Ordinary workplaces

The reference's occupation → View Coworkers → named person path now connects
to persistent people. An explicit introduction at an ordinary local job creates
one supervisor and two colleagues, with actual employment, appropriate adult
backgrounds, accounts and coworker relationships. Looking at the page, searching
or opening a profile creates no people and performs no save. The list is
virtualised and retains its search when returning from a profile.

Part-time teenage jobs have adult staff and a full-time supervisor. Professional
staff have the qualifications required by their role, dated before joining.
Generated backgrounds belong to the new NPCs; the player's qualifications,
tenure and wages are never awarded by introduction. Known staff are reused when
the player returns to the same employer. Other relationship roles remain intact.

The supervisor profile offers work feedback after three actual paid periods,
once per calendar year for that employment, including after a supervisor change.
The discussion uses four energy. Its saved trust, chance and outcome draw record
an accepted or declined discussion; accepted feedback adds up to three bounded
performance points and a small bounded relationship improvement. It does not
change salary or award another period of pay. Pay increases and richer work
conflicts remain later work.

The existing monthly employment/payroll, costs, tax and NPC systems process the
introduced staff. No second payment routine is added. Annual tax settlement still
includes people with current-cycle earnings after observation ends. Quitting,
death and moving close the observed workplace or colleague membership while
retaining people, contracts, relationships and history. Hospital, travel, custody
or service absence retains the person's identity. An actual departure can be
replaced during a later working month; viewing a list never fills a vacancy.

This increment covers ordinary external local jobs. Existing company staff and
special-career teams keep their own flows. A retained foreign job cannot invent
a local team. Employer identity uses the existing city/sector contract identity;
distinct named companies and richer interviews/hours remain open.

World 29 / engine 28 / content 5 / database 6 adds an empty `workplaces` history
to prior worlds, without generating colleagues, drawing RNG, changing contracts,
paying wages or rewriting saved events. Genuine native archives retain their
original payloads and metadata. Current world validation checks the recorded
contracts, local site/currency, qualifications, relationships, dates, roster size
and annual feedback outcome. Ordinary empty histories return immediately.

Domain and connected SQLite/UI checks cover all twelve country introductions,
teen and professional roles, payroll, absence/departure/reuse/death, performance
caps, annual limits, contradictory imports, failure rollback, retry and cold
result acknowledgement. Native and full-regression evidence is recorded in
PROGRESS.md at the completed checkpoint; cloud action diagnostics do not claim
physical-device timing.

The completed source passes **1,318 tests / 94 suites**, strict types, fresh
Hermes exports and 120 current-source ordinary lifetimes. [Source/check record](verification/workplaces-20261020.json)
and [actual native evidence](verification/android24-workplaces-20261020/) retain
exact introduction/feedback/cold worlds, real payroll and original save history.
The native discussion naturally declines; accepted outcomes have connected
SQLite/UI checks. Eleven native captures preserve the reviewed screens.
