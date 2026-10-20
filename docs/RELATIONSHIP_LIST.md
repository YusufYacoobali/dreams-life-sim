# Responsive relationship browsing

Relationships now uses a virtualised list instead of mounting every connection
inside a ScrollView. Eight rows render initially, with bounded batches/window;
all retained contacts remain available through scrolling. This follows the
reference's All, Family, Friends and Romance filters. Name search uses actual
identities, and each contact displays its recorded role, age/status and bond.

Family includes recorded parent/guardian/sibling roles and married/widowed
partners. Friends requires the saved friend role. Romance includes actual
current and past partner statuses. Roles can overlap: a spouse who is also a
friend appears in both views. Deceased contacts remain part of the record.
Filtering/searching never invents a person, friendship or romantic relationship.

The header's plus opens Meet New People. Compact Pets, Family and Home links
retain the previous household/family/pet navigation while making actual
connections visible sooner. Search, filters and links have 48dp targets. Opening
a profile dismisses the keyboard; Back retains the current filter and query.
The same unchanged filter component is shared with achievements/challenges.

All **16 affected checks / six suites** pass in **16.799 seconds**, with strict
application/test types and fresh Android/iOS Hermes exports. They include the
genuine child with duplicate first names, actual married-person conversation
creating a friend role, overlapping role filters, all four navigation links,
existing school/relationship action flows and Extras filters/details. New
browsing checks compare the whole encoded world and every SQLite table.

Actual Android review confirms All, Family + `Ruby`, the exact Ruby Kelly
profile, keyboard dismissal and Back retaining the filter/query. Friends and
Romance show genuine empty states. Native bounds confirm ten 48dp targets.
The Family shortcut exposed adult adoption/planning controls in childhood;
that page now shows the local adult age and family/household links, preserving
existing children if present. Adult family flows still pass. All eight native
tables remain exact: three lives, twelve moments, seventeen receipts, revision
53. [Raw captures/comparison](verification/android24-contacts-20261020/) and
[source/export record](verification/contacts-20261020.json) retain the scope.

This is a read-only UI increment. Game/persistence and the running immutable
lifetime sweep remain unchanged. It does not establish the 1,000-person native
performance budget, physical-device timings or complete reference acceptance.
The complete 1,226-test / 80-suite baseline and the earlier seventy-check UI
checkpoint retain their original scopes.
