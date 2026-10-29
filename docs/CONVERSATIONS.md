# Conversations with people you know

Reference09 calls for choosing a conversation topic. The Person action now
reviews Everyday life, Interests, Family, School and study, Work, or Feelings.
The shared `conversationTopics` helper supplies eligibility to both UI and engine.

Interests requires an attended hobby practice by either person. Family requires
their actual parent, child, guardian, sibling or spouse link. School uses a named
current, paused or completed course; Work uses a current job or a past job with
recorded paid months. Feelings requires both people to be at least eight and
40% trust. Other topics require both people to be at least three. Conversation
remains possible from different places, hospital or custody, with matching copy.
Existing living/known-person, pending-event and yearly-action guards still apply.

Every topic shares the existing one Talk attempt per person per calendar year.
Opening, selecting and cancelling consume nothing. An explicit topic takes one
draw from the existing outcomes stream. Ordinary topics open up at
`min(90,70+floor(trust/5))%`; Feelings uses `min(90,45+floor(trust/2))%`.
A reserved answer gives only one bond point. An open answer gives four bond
points (Interests six), two trust points (Family/Feelings three) and a small
topic-specific change: happiness2, Interests happiness3, School smarts1/happiness1,
Work stress−2 or Feelings stress−3. Displayed changes use actual capped deltas.
These are authored social rules; no money, qualifications, work progress or
clinical benefit is awarded.

The deterministic writer uses only supplied actual names, ages, roles, recorded
hobbies, course/job facts, stress and trust. No custom input or new story-catalogue
entry is created. Explicit topics persist their result and journal normally.
Omitting `topic` retains the original Talk text, effects and random draw exactly;
topics on other interaction actions are rejected.

World39/engine40/content14/reader19 introduces no new stored field. Migration
changes root tags only; old bound scenes, results, histories and random streams
remain exact. Complete readers13–18 upgrade only their metadata marker.
Focused domain/save checks and strict types are recorded at the accepted commit;
these do not imply new native, full-life or broad performance acceptance.
