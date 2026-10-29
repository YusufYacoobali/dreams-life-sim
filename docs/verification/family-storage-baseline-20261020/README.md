# Reproduced natural family capacity failure

`failure.json` records the second reproduction, fixed source/driver hashes,
22 successful cold checks, observations, natural death and unchanged last-valid
history/receipts. `commands.ndjson` records Start/Begin Life and every actual
command; `process.out` / `process.err` retain the process output. Exit 1 is the
expected diagnostic result, not a completed 120-year/three-generation gate.

The failed next Age Up leaves generation two at 91 calendar years, 36 people,
63,304 ledger rows, 91 original annual moments and 481 receipts. The last valid
canonical world is 19,921,889 bytes. SQLite/WAL/SHM total 57,885,432 bytes, above
the 50 MB target. No history or receipt is removed to obtain this measurement.

`fixture-provenance.json` pins the exact last committed v3 checkpoint to clean
pushed 555d112 game/persistence source and the recorded production-command
driver. Fixture bytes: 1,208,705; SHA-256:
`00941dcb880910e2156e86280ea0e2b8b3198b623902ae2ad340c182830793cb`.
It is a natural cloud/SQLite input rather than native or every-system acceptance.
