# Service screen context

The service page kept its local branch when the same mounted route changed kind.
A military draft could therefore send `army` or `navy` in an astronaut
application, which the existing engine correctly rejects. The reverse change
could leave `space-program` selected for military service. Open monthly mission
history also returned expanded after changing kind and coming back.

The local service-details subtree now uses the actual life ID, active person ID
and resolved service kind as its React key. A different context starts a fresh
branch, history selection and pagination. Ordinary revisions, saving feedback
and failures keep the same key, preserving the existing retained confirmation
and draft for retry. No state is reset during render. The independently reviewed
shared career-confirmation hook remains unchanged.

Three focused connected tests reproduce both application directions and a
mission-history round trip. They start from the genuine v16 service archive and
acknowledge its saved completed assignment normally. Application preparation
leaves the actual military contract, starts paid science coaching and processes
three ordinary years: 36 attended months earn 72% science. The original degree,
money, ages, qualification, outcomes and fixture are not edited. The stored
selection stream accepts both actual application commands; astronaut service
begins with training pending, while military re-entry retains the genuinely
earned military qualification.

The application tests check the new kind's valid initial branch, retained Navy
selection and confirmation after a same-context failure, exact rollback of all
eight SQLite tables, zero checkpoint unpack on warm retry, exact cold loading
through a new repository and acknowledgement without a repeated effect. All old
accounts stay exact; an actual new astronaut contract may create its ordinary
ground-support contacts and their own accounts through the unchanged engine.
The mission check uses the saved assignment's six real monthly records and
changes no saved rows. All three tests fail against the previous service screen.
The final focused suite passes all three tests in 5.301 seconds. Strict type
checking of the new test and its imported source and whitespace checks pass.
The nine independently approved career-review checks were not rerun here.

These are component/in-memory SQLite checks. They do not establish native
interaction, physical performance or a new natural birth-to-service journey.
The simulation, shared hook, persistence, version tags and original fixtures are
unchanged. Root integration owns consolidated verification and release gates.
