# Education source audit and remaining implementation

Reviewed 19 October 2026. This is a partial source audit for the next education
milestone. No country rule values changed. The current twelve profiles remain
authored game approximations, and no complete country profile has passed its
release verification gate.

The sources distinguish required participation, school stages, qualifications
and later admissions. A single school-completion birthday cannot represent all
four. The game currently combines them in its public-school path.

| Profile | Evidence consulted or still pending | Consequence for the next school milestone |
| --- | --- | --- |
| United States | The [California education attendance guidance](https://www.cde.ca.gov/LS/ai/sb/sarbhbkenforcement.asp) was opened. Indexed age statements still need their direct statutory passage checked. The [NCES state table](https://nces.ed.gov/programs/statereform/tab1_2-2023.asp) could not be retrieved; its data is labelled 2020, not 2026. | Choose documented state/city baselines. A California source does not verify every US location or the national 6/18 game model. |
| Canada | [Canada.ca elementary/secondary guidance](https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/education/school-types/elementary-secondary.html) was read. It describes province/territory differences, possible entry from four and adult secondary programs. The Ontario-specific policy page returned HTTP403. | Distinguish kindergarten/primary stages and qualification completion. Add an actual adult remediation route; verify the selected province separately. |
| United Kingdom | [GOV.UK school leaving ages](https://www.gov.uk/know-when-you-can-leave-school) was read. England permits leaving school at sixteen but requires education/training participation to eighteen; the page separately gives the other nations' leaving dates. | Model the constituent nation, leaving school, continued participation and the qualification earned separately. The game's eighteen-year completion is not a universal compulsory-school age. |
| Australia | [NSW school leaving guidance](https://education.nsw.gov.au/schooling/parents-and-carers/pathways-after-school/school-leaving-age) was read; its page is dated 27 July 2026. It requires Year 10 and then eligible education, training, employment or a combination to seventeen. | Keep this evidence scoped to NSW. Add supported post-Year-10 routes and verify entry ages/other states before changing profile values. |
| France | [Service Public's instruction guidance](https://www.service-public.gouv.fr/particuliers/vosdroits/F1898) was read. Instruction applies from three to sixteen, followed by a broader formation obligation to eighteen. | Add preschool separately from primary school. Further training/participation is not automatic upper-secondary graduation. |
| Germany | [KMK educational pathways](https://www.kmk.org/en/bildungsministerkonferenz/bildungsthemen/educational-paths-and-qualifications.html) was read. Entry is usually in the year of turning six; general compulsory schooling lasts nine or ten years by Land. Primary school is generally four grades, but six in Berlin/Brandenburg. Later vocational obligations and upper-secondary admission are distinct. | Choose Land-specific baselines, preserve school histories, and separate lower/upper/vocational routes and earned qualifications. |
| Spain | The [consolidated education law](https://www.boe.es/buscar/act.php?id=BOE-A-2006-7899) was read at Articles 4 and 22. Basic education normally spans ten years, six to sixteen; ESO normally spans four courses from twelve to sixteen. | Separate basic/ESO completion from later upper-secondary study. Do not label the current eighteen-year pathway as the legal compulsory minimum. |
| Italy | The [Chamber of Deputies education-pathway overview](https://temi.camera.it/leg19/temi/istruzione-tecnica-e-professionale.html), dated January 2026, was read. It distinguishes five-year technical/professional secondary courses, normally fourteen to nineteen, from regional three/four-year IeFP routes and further entry requirements. The ministry enrolment circular returned HTTP403; its indexed six-to-sixteen statement is not treated as verified operative law. | Preserve the nineteen-year completion as an authored route rather than a universal minimum. Verify compulsory instruction separately and model actual vocational qualifications and later admissions. |
| Brazil | [LDB Article 4](https://www.planalto.gov.br/ccivil_03/leis/l9394compilado.htm) was read in the consolidated legislation; it specifies compulsory free basic education from four through seventeen. | Add preschool without renaming it primary school. Distinguish primary/lower/upper stages and qualification requirements. |
| India | Delhi Education Department’s [2009 Gazette copy](https://www.edudel.nic.in/upload/upload_2017_18/rteact_eng_dt_18072017.pdf), sections 2(f) and 3, and its [2012 amending Act](https://www.edudel.nic.in/upload/upload_2017_18/rteact_eng_amendment_dt_18072017.pdf), section 4, were read. They distinguish classes I–VIII elementary education and the six-to-fourteen entitlement. These are historical primary texts, not a verified 2026 consolidated rule set; the India Code consolidated retrieval still times out. | Keep elementary entitlement separate from the current eighteen-year upper-secondary qualification. Verify later amendments, state/board routes, examination/promotion rules and regional application before changing the game profile. |
| Japan | [MEXT's education overview](https://www.mext.go.jp/en/policy/education/overview/) was read. It separates six primary years from three compulsory lower-secondary years through fifteen, followed by upper-secondary admission, normally with entrance examinations. | Separate lower-secondary completion and upper-secondary admission/attendance. Preserve actual grades and earlier qualifications rather than awarding an upper credential by age alone. |
| South Africa | The government's [BELA Act 32 of 2024 summary](https://www.gov.za/documents/acts/basic-education-laws-amendment-act-32-2024-english-afrikaans-16-sep-2024) was read and explicitly includes compulsory Grade R. The [June 2025 implementation guidelines](https://www.education.gov.za/Portals/0/Documents/Policies/2025/GUIDELINES%20FOR%20PURPOSES%20OF%20IMPLEMENTING%20CERTAIN%20OF%20THE%202024%20AMENDMENTS%20TO%20THE%20SA%20SCHOOLS%20ACT%20%2812%20June%202025%29.pdf), sections 1 and 3 (printed pages 1–4), were read. They date commencement to 24 December 2024 and distinguish Grade R admission (four, turning five by 30 June) from compulsory attendance in the year of turning six. | Add a distinct Grade R stage and retain the distinction between admission and compulsory attendance. These are interim non-binding implementation guidelines; later regulations and provincial practice still need verification before changing the current primary-entry parameter. |

The access failures above are incomplete research, not evidence for an age or
permission. They do not reopen the country roster decision or justify narrowing
launch coverage. The earlier executor proxy failure is historical; the available
read-only web tool now provides some primary sources without changing executor
network policy.

The next implementation should preserve all earned historical qualifications and
saved school/callback identities. New stage transitions, admission/exam outcomes,
remediation and scholarship decisions must happen through actual commands or
monthly progression. Loading an old save must not invent prior attendance,
retroactively fail a completed qualification, generate teachers or consume RNG.
Health, travel and custody must pause actual attendance credits appropriately.

The attended remediation courses and fictional institutional scholarships are now implemented through actual commands and restricted tuition bills; see [recovery](EDUCATION_RECOVERY.md) and [scholarships](SCHOLARSHIPS.md). These shared game rules do not verify national equivalency, fee or aid policies. Costs and country-specific eligibility still need separate source work.

An earlier follow-up found current indexed Ontario Education Act section 21 and two official India Code PDFs, but direct retrieval returned Ontario HTTP403 and India timeouts. No new operative text was read or country gate closed from those search snippets.

Country-specific fees, tax, employment, healthcare, family, criminal, immigration
and estate rules remain outside this narrow audit. See [COUNTRY_RULES.md](COUNTRY_RULES.md)
and [PROGRESS.md](PROGRESS.md) for the current authored models and open gates.

A later primary-source follow-up read the Delhi-hosted 2009/2012 Gazette
copies described above. The [Ministry’s 16 January 2019 notice](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1560225&lang=2&reg=48)
confirms another notified amendment; the linked Gazette PDF returned HTTP502. Its existence alone does not establish the
current promotion/examination rules. California’s primary legislature page
returned HTTP403 and the CDE selected-code page redirected to an inaccessible
bot check; the Ontario parent guide also returned HTTP403. No search snippet is
treated as operative text. No complete country gate or game-rule change follows
from this partial historical-source progress.
