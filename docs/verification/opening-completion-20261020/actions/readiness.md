# C35 action benchmark: prepared, not run

The final frozen source is `73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa`,
World34 /engine35 /content10 /configured reader14. The unchanged executable
driver SHA256 is
`19da212c32feb53a2f264b4c6062cd0b7a68146a762f82841890ea410408bbe9`.
Its game/persistence source SHA256 is
`12b49689991da671d72b3ac8bc0bfe6bb2aff788174cf1ccda73665c0195c2b8`.
The final source capture and all583 listed tracked file hashes match. Four fixed
input files, including the default historical age30/60 input document, match
their exact committed bytes; their separate pins are
`/tmp/dreams-opening-next-actions-input-pins.json`.

After the native app is stopped and other heavy work is closed or paused, root
can execute this exact command from
`/workspace/dreams-worktrees/integration-opening-next`:

```sh
node tools/benchmark-actions.cjs --source /workspace/dreams-worktrees/integration-opening-next --profile --population --workplaces --raises > /tmp/dreams-opening-next-actions.json 2> /tmp/dreams-opening-next-actions.stderr.txt
```

There is no `--output` argument. These are new C35 output paths; previous C34
`/tmp/dreams-autonomy-actions.json` and its published evidence remain untouched.

The frozen driver runs14 cases with one excluded warm-up and5 measured trials
each:70 measured samples and84 successful executions. A completed exit0 asserts
whole cold current and backup equality for all84 executions, deterministic sizes,
and identical complete stress outcome facts across all6 executions of each of
the4 generated population cases. The2 generated Age Up cases also each assert
the original raw Before Age Up payload across all6 executions (12 assertions).
These counts are derived from the frozen driver loop; they are not extra stored
measurement samples or a native acceptance result.

The driver records warm `unpackCheckpoint` counters but does not reject nonzero
counters itself. The prepared publisher rejects any of the70 measured trials
with a nonzero full unpack count. It also checks exact14 labels/commands,
5 samples/case, recomputed medians, source/driver/input pins and actual completed
stderr case lines.

After the actual execution closes, fill an actual receipt using
`/tmp/dreams-opening-next-actions-receipt-template.json` as the schema and save it
at `/tmp/dreams-opening-next-actions-receipt.json`. Record the real execution
reference, exit0, start/end times, exact argv and quiescence facts. The template
is deliberately pending/incomplete; it cannot be published as acceptance.

Then this optional helper writes only new `/tmp` JSON/Markdown summaries:

```sh
node /tmp/dreams-opening-next-actions-summary.cjs --publish /tmp/dreams-opening-next-actions-receipt.json
```

Preparation already passed source/input verification and helper syntax checking.
The benchmark and publisher have **not** been run by the reviewer. Registration
is `/tmp/dreams-opening-next-actions-plan.json`; no C35 timing/acceptance is claimed.

Use unpaired, host/GC-sensitive five-sample cloud Node/on-disk SQLite medians.
This measures immutable command resolution and repository commit, with cold-open
priming recorded separately. It excludes React rendering, input scheduling and
native storage/UI timing; no physical p95 or speedup guarantee follows. The
100/1000 known-contact worlds are explicitly generated at once using production
contact/relationship helpers from a genuine age30 checkpoint. They are not
natural/native population progression, and first Age Up step records only its
actual processed months/stage. Workplace inputs continue a genuine teen archive
through ordinary commands. Begin Life uses the unchanged driver's acknowledged
revision save kernel, rather than the actual store/UI birth-acknowledgement path.
