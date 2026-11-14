# Reproduce the final host comparisons

Use the pinned dependencies and Node 24 with `node:sqlite`. Run these workloads sequentially, without builds, test suites or other benchmarks. They are host measurements, not native-device acceptance. The retained [host description](host.json) and source digests identify the measured implementations. The candidate application source is unchanged after `b6624a8b`; later commits add tools and evidence.

From the repository root, prepare a clean original reference and decompress the retained inputs:

```bash
bench_dir=$(mktemp -d /tmp/dreams-followup-reproduce.XXXXXX)
reference_dir="$bench_dir/reference"
source_dir=$(pwd)
mkdir "$reference_dir"
git archive 8378d0f8 src | tar -x -C "$reference_dir"
ln -s "$source_dir/node_modules" "$reference_dir/node_modules"
gzip -dc docs/verification/v2-scaling/cohorts.json.gz > "$bench_dir/cohorts.json"
gzip -dc docs/verification/v2-scaling/followup/gameplay-profiles.json.gz > "$bench_dir/gameplay.json"
gzip -dc docs/verification/v2-scaling/followup/gameplay-continue.json.gz > "$bench_dir/continue.json"
gzip -dc docs/verification/v2-scaling/followup/gameplay-commands.json.gz > "$bench_dir/commands.json"
gzip -dc docs/verification/v2-scaling/followup/initial-gameplay-profiles.json.gz > "$bench_dir/initial.json"
```

Final finance controls and the separate instrumented diagnostic:

```bash
node --expose-gc tools/benchmark-scaling-store-pairs.cjs --reference "$reference_dir" --source "$source_dir" --inputs "$bench_dir/cohorts.json" --ages 30,50 --levels extreme --kinds finance --samples 100 --output "$bench_dir/tails-final.json"
node --expose-gc tools/benchmark-scaling-store-pairs.cjs --reference "$reference_dir" --source "$source_dir" --inputs "$bench_dir/cohorts.json" --ages 30,50 --levels extreme --kinds finance --samples 100 --detailed 1 --wrappers 1 --output "$bench_dir/tails-phases.json"
```

The broad matrix, genuine interrupted-year inputs and separately labelled earlier larger-history controls:

```bash
node --expose-gc tools/benchmark-scaling-store-pairs.cjs --reference "$reference_dir" --source "$source_dir" --inputs "$bench_dir/gameplay.json" --kinds routine,finance,firstAgeUp,fullYear,saveReload --samples 7 --output "$bench_dir/gameplay-pairs.json"
node --expose-gc tools/benchmark-scaling-store-pairs.cjs --reference "$reference_dir" --source "$source_dir" --inputs "$bench_dir/continue.json" --kinds continue,fullYear --samples 7 --output "$bench_dir/continue-pairs.json"
node --expose-gc tools/benchmark-scaling-store-pairs.cjs --reference "$reference_dir" --source "$source_dir" --inputs "$bench_dir/initial.json" --profiles family,mixed --ages 70 --kinds routine,fullYear,saveReload --samples 7 --output "$bench_dir/history-stress-pairs.json"
```

Measure the timing API separately from real-store enabled/disabled overhead. The latter uses the same final source on both sides, recording only on the candidate side. Allocation sampling is another separate run and must not be mixed into latency comparisons:

```bash
node tools/benchmark-profiler-overhead.cjs "$source_dir" "$bench_dir/profiler-micro.json"
node --expose-gc tools/benchmark-scaling-store-pairs.cjs --reference "$source_dir" --source "$source_dir" --inputs "$bench_dir/gameplay.json" --profiles mixed --ages 50 --kinds routine --samples 100 --recording 1 --output "$bench_dir/profiler-store.json"
node --expose-gc tools/benchmark-finance-allocations.cjs --reference "$reference_dir" --source "$source_dir" --inputs "$bench_dir/cohorts.json" --output "$bench_dir/finance-allocations.json"
```

`prepare-gameplay-scaling-lives.cjs` regenerates independent policies, and `assemble-gameplay-scaling.cjs` verifies accepted feature coverage before combining them. The retained inputs declare seeds, friend-introduction bounds, actual commands and failed alternatives. The original [reproduction notes](../README.md#reproduction) cover the other correctness/memory drivers. For actual iPhone/Android collection, use the separate [device workflow](../device-profiling.md).
