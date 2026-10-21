# Return from a nested screen using its selected category

The actual C37 Education trace exposed a selected Activities tab that did
nothing while its Back header was scrolled out of view. The coordinator used
Life -> Activities -> Occupation as a workaround. That historical observation
and its frozen runtime remain unchanged; no device fix is claimed here.

This later source slice starts from frozen C38 merge
`dfd9a74046479672967868dc21ac6acfda734592`. `BottomNavigation` accepts an optional
reselect callback. The actual game layout supplies it only to navigate from a
nested pathname to the selected category root. A selected root tab stays a no-op;
an inactive tab keeps its existing route action. Standalone callers without the
optional callback retain their previous behavior. The four tabs, order, icons,
labels, selected semantics and game/persistence behavior are unchanged.

The existing connected Statistics navigation check retains genuine archived
world and original historical payloads in file SQLite. It covers the real Extras
tab query and Education pathname fallback, returning to Activities, inert root
taps and switching to Life. All eight tables, whole world, pending work and RNG
must remain exact, with no dispatch or warm checkpoint unpack. These router
callback assertions do not establish actual native stack/scroll restoration.
The existing shared-shell interaction check still covers root reselect no-op
without the optional callback. No large new navigation matrix is introduced.

The existing direct Finances check also verifies that its selected Assets tab
returns to Assets without reading a financial projection or issuing a command.
The first focused run caught its old nested-tab no-op expectation; only that
test name/assertion changed afterward. The diagnostic remains at
`/tmp/dreams-tab-root-navigation-focused.out` (15 passed, one failed).

Final focused checks passed: 16 tests in three suites, 18.829 seconds, at
`/tmp/dreams-tab-root-navigation-focused-final.out`. Application strict types
and the affected three-test import graph both exited zero with empty outputs at
`/tmp/dreams-tab-root-navigation-app-types.out` and
`/tmp/dreams-tab-root-navigation-test-types.out`. The affected test configuration
is `/tmp/dreams-tab-root-navigation-tsconfig.json`. These checks do not represent
a full regression or all-test type gate.

Fresh C39 native bundle/interaction acceptance remains coordinator-owned; this
source slice does not change the earlier observed no-op or its workaround.
