# Contextual copy for new social criticism

The writing brief in `docs/planning/source-specification.md` §3 asks for short,
direct situations and rejects repetitive generic prose. Reference12 and the
shared decision cards in16/17 use the same concise, original game voice.

The completed current-content entrepreneur US900 trace recorded three
`public-controversy` choices at age14 on2014-03-01,04-01 and05-01, for posts65,69
and71. Its saved routine was weekly authentic photos. Every incident used the
same title and claimed an audience had laughed at part of the post, without
knowing that about the media. Original command lines98,100,102 remain evidence;
this change creates no replacement natural-policy run. The fixed editorial
audit remains under `/tmp/dreams-editorial-observation-audit-20261020/`, with
report SHA256 `3c350e7b66ebb9bdbb896abddf191a6af80d7cd6bd3e8fa663a0a60af7fb12d4`
and game-source SHA256
`ed3148b53360a79b7ee7237c7a1916d6e878f00662609bf0b3a2a7c027a39f6f`.

`src/game/content/socialCriticism.ts` now provides five short wording variants
for a newly created incident. They name the actual platform and post kind, or
an actual live stream when recorded live minutes exist. The question uses the
person's age. The wording says that the post drew criticism; it does not invent
what was pictured, read, heard, laughed at or said in a comment.

A checksum of the already created post ID selects wording. It uses no random
stream, new decision roll, mutable counter, later outcome or future audience
data. `src/game/systems/social.ts` calls it only when constructing a new
controversy and passes the actual post object, including when older post detail
has just been archived. The criticism threshold, impact draw, response draw,
strikes, suspension, relationship/stat changes, fees, IDs, choices, effects and
results retain their existing logic and order. These five phrasings are not
additional entries in the250-template catalogue. Version consolidation belongs
to the coordinator; this change adds no model field or schema/version bump.

Existing controversy records, pending/queued scenes and stored results are
never reformatted during reading, acknowledgement or response. Their original
text remains authoritative after reload, including the older fixed wording.

## Focused evidence and limits

The new game tests use actual publication and response commands from the
existing age16 teen and employed adult fixtures. For the publication tests only,
the response stream is deliberately arranged to produce criticism. The
three-post comparison substitutes only the old fixed copy in a control call,
then compares every world field after normalising the new incident's title and
body. Rolls, consequences, choice results and suspension remain exact. Platform,
post-kind and recorded live-stream wording also have focused coverage. A pure
copy check uses the original US post identities65/69/71; it does not recreate or
claim another natural life.

The connected tests arrange the former fixed wording at the same creation
boundary. One explicit saved-result priority arrangement exercises an older
decision in the deferred queue. Real on-disk SQLite and the actual store check
read-only opening, all-eight-table transaction rollback, disabled/duplicate
response presses during a held save, warm retry with no checkpoint unpack,
fresh-connection/store cold resume and one-time acknowledgement. They preserve
the older incident and original queued result text, plus unrelated previous
lives, backups and historical snapshot payloads.

The18 new focused tests pass (two suites,23.974s). The40 existing social,
connected social and social-review/save tests also pass (three suites,8.809s).
Strict application/test TypeScript checks pass. The existing-flow log is
`/tmp/dreams-social-criticism-copy-existing-tests.out`.
The coordinator owns combined regression, native layout and release acceptance.
These arranged checks establish no new natural recurrence, all-choice,
full-life SQLite or device acceptance.
