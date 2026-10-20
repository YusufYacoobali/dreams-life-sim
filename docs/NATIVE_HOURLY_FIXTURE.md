# Original Android hourly checkpoints

`tests/fixtures/v32-native-hourly-checkpoints.json` contains four exact, read-only
payloads copied from the accepted Android24/ExpoGo57.0.9 run at runtime commit
`944019d8fb07759c4fc2e644ddf8f717edcbd16c`. Each was written by normal game actions:

| Phase | Revision | Actual saved state |
| --- | ---: | --- |
| Interview | 129 | Unanswered shop-assistant interview with reviewed20-hour terms |
| Hired | 130 | Successful interview; no upfront pay or worked time |
| Year | 132 | Twelve paid periods; interrupted annual scene still open |
| Final | 134 | Scene and year acknowledged; original pay and terms retained |

These are original World32/engine33/content9/reader12/framev4 checkpoints. No
native database, world, age, date, funds, stats or random streams were edited,
and no file was imported. This adds a genuine fixture; it does not regenerate
or replace any older fixture. The complete native journey and original-life
preservation are recorded in
[the Android evidence](verification/android24-hourly-work-20261020/).

The fixture is547,397 bytes, SHA-256
`9b12ebf08e9f316398db3ea2bfd7ccf9424bc6233b102be3223c7cb49a85258c`.
Individual original payload and canonical-world hashes are embedded in it.

The connected regression verifies only new tags and empty courtship history
are added during migration; every other original field remains equal. It also
replays the original interview to its exact saved hiring result, and starts with
the actual paid annual scene to verify reader12→13 without eager raw rewrites.
A failed scene transaction rolls back every SQLite table; retry avoids checkpoint
unpacking, a new repository cold-loads the result, and acknowledgement reaches
the exact original134 world under the new tags without repeating payroll.
These additional tests use in-memory SQLite and the real store; they do not add
new native observations or claim native storage-failure injection.
