import datetime, hashlib, json, pathlib, sqlite3

root = pathlib.Path('/tmp')
names = ['baseline', 'boot', 'browsed', 'settings', 'settings-cold', 'selected', 'intro135', 'cold-intro135']
tables = ['backups', 'branches', 'lives', 'preferences', 'receipts', 'restore_receipts', 'snapshot_metadata', 'snapshots']
digest = lambda data: hashlib.sha256(data).hexdigest()
canonical = lambda value: json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
captures = {}
for name in names:
    folder = root / ('dreams-autonomy-native-school-final-db' if name == 'baseline' else 'dreams-opening-next-native-' + name + '-db')
    files = [folder / 'dreams.db', folder / 'dreams.db-wal']
    before = {str(file): {'bytes': file.stat().st_size, 'sha256': digest(file.read_bytes())} for file in files}
    connection = sqlite3.connect('file:' + str(files[0]) + '?mode=ro', uri=True)
    connection.row_factory = sqlite3.Row
    actual = sorted(row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))
    assert actual == tables
    rows = {table: sorted(canonical(dict(row)) for row in connection.execute('SELECT * FROM ' + table)) for table in tables}
    reader = connection.execute('PRAGMA user_version').fetchone()[0]
    connection.close()
    assert all(file.stat().st_size == before[str(file)]['bytes'] and digest(file.read_bytes()) == before[str(file)]['sha256'] for file in files)
    captures[name] = {'reader': reader, 'rows': rows, 'files': before}

base = captures['baseline']['rows']
assert captures['baseline']['reader'] == 13
assert all(captures[name]['reader'] == 14 for name in names[1:])
for name in ['boot', 'browsed']:
    assert captures[name]['rows'] == base
expected = json.loads((root / 'dreams-opening-next-native-expected-settings.json').read_text())
prefs = [json.loads(row) for row in base['preferences']]
prefs.append({'key': 'app_settings', 'value': json.dumps(expected, separators=(',', ':'))})
for table in tables:
    assert captures['settings']['rows'][table] == (sorted(canonical(row) for row in prefs) if table == 'preferences' else base[table])
assert captures['settings-cold']['rows'] == captures['settings']['rows']
for row in prefs:
    if row['key'] == 'active_life':
        assert row['value'] == 'life_mvgprdj2_16qsril_0'
        row['value'] = 'life_native_adult_friend_v30_s0'
for table in tables:
    assert captures['selected']['rows'][table] == (sorted(canonical(row) for row in prefs) if table == 'preferences' else base[table])
assert captures['cold-intro135']['rows'] == captures['intro135']['rows']
result = {
    'format': 'dreams-c35-native-additional-raw-rows-v1', 'status': 'passed',
    'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Read-only raw SQL comparison of actual coordinator native captures. Adds an observed settings-only cold reopen to the primary ten-phase whole-world verifier. No game commands, native input, migration or SQL writes. It does not independently verify canonical worlds, screenshot provenance or later actions.',
    'assertions': {'reader13To14AllEightTablesExact': True, 'readOnlyBrowseAllEightTablesExact': True, 'settingsOnlyExactAppSettingsInsertion': True, 'settingsColdAllEightTablesExact': True, 'selectionOnlyActiveLifePreference': True, 'intro135ColdAllEightTablesExact': True, 'inputDatabaseAndWalBytesUnchangedByVerification': True},
    'rowHashEncoding': 'SHA256 of compact UTF-8 JSON array of sorted per-row compact key-sorted JSON strings; Unicode unescaped. Separate encoding from primary verifier.',
    'captures': {name: {'reader': value['reader'], 'files': value['files'], 'tables': {table: {'rows': len(rows), 'sha256': digest(canonical(rows).encode())} for table, rows in value['rows'].items()}} for name, value in captures.items()}
}
output = root / 'dreams-opening-next-native-additional-rows.json'
with output.open('x') as file: file.write(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'status': 'passed', 'output': str(output), 'captures': len(captures), 'assertions': result['assertions']}))
