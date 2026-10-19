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
| Italy | The Ministry's [2024–25 enrolment circular](https://www.mim.gov.it/documents/20182/0/Nota%2Biscrizioni%2Banno%2Bscolastico%2B2024-2025.pdf/25eeb11f-a5e3-4377-966b-f30c9cca7ddc?t=1702406066487) was identified in search, including a six-to-sixteen compulsory-instruction passage. Full circular/current-law verification remains pending; the ministry overview could not be read. | Keep the nineteen-year game completion as an explicit approximation. Verify compulsory instruction, later participation and each qualification route before implementation. |
| Brazil | [LDB Article 4](https://www.planalto.gov.br/ccivil_03/leis/l9394compilado.htm) was read in the consolidated legislation; it specifies compulsory free basic education from four through seventeen. | Add preschool without renaming it primary school. Distinguish primary/lower/upper stages and qualification requirements. |
| India | The official [RTE explanatory publication](https://dsel.education.gov.in/sites/default/files/publication/RTE_2nd.pdf) and [India Code act record](https://www.indiacode.nic.in/indiacode/handle/123456789/2086?view_type=browse) were identified. Search gives the six-to-fourteen elementary entitlement, but full operative text was not retrieved. | Verify the operative Act and state/board paths. Do not equate the current eighteen-year secondary qualification with the elementary entitlement. |
| Japan | [MEXT's education overview](https://www.mext.go.jp/en/policy/education/overview/) was read. It separates six primary years from three compulsory lower-secondary years through fifteen, followed by upper-secondary admission, normally with entrance examinations. | Separate lower-secondary completion and upper-secondary admission/attendance. Preserve actual grades and earlier qualifications rather than awarding an upper credential by age alone. |
| South Africa | The government's [BELA Act 32 of 2024 summary](https://www.gov.za/documents/acts/basic-education-laws-amendment-act-32-2024-english-afrikaans-16-sep-2024) was read and explicitly includes compulsory Grade R. The [June 2025 implementation guidelines](https://www.education.gov.za/Portals/0/Documents/Policies/2025/GUIDELINES%20FOR%20PURPOSES%20OF%20IMPLEMENTING%20CERTAIN%20OF%20THE%202024%20AMENDMENTS%20TO%20THE%20SA%20SCHOOLS%20ACT%20%2812%20June%202025%29.pdf) were identified, not fully reviewed. | Add a distinct Grade R stage. Verify commencement, entry-age rules and provincial implementation before changing the current primary-entry parameter. |

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

Adult remediation needs completed work and a passing result. Scholarships need
saved eligibility/decisions, real restricted tuition support and payment
reconciliation; they must not grant a seat, qualification or spendable cash merely
for browsing or applying. Costs and eligibility still need separate source work.

Country-specific fees, tax, employment, healthcare, family, criminal, immigration
and estate rules remain outside this narrow audit. See [COUNTRY_RULES.md](COUNTRY_RULES.md)
and [PROGRESS.md](PROGRESS.md) for the current authored models and open gates.
