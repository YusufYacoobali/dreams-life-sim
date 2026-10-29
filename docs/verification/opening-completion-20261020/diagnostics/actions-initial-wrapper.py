import datetime, json, os, pathlib, signal, subprocess, time

root = pathlib.Path('/workspace/dreams-worktrees/integration-opening-next')
base = pathlib.Path('/tmp')
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
argv = ['node', 'tools/benchmark-actions.cjs', '--source', str(root), '--profile', '--population', '--workplaces', '--raises']
adb = ['/workspace/.cache/android-native-check/sdk/platform-tools/adb', '-s', 'emulator-5560']
native = subprocess.run(adb + ['shell', 'pidof', 'host.exp.exponent'], capture_output=True, timeout=35)
assert native.returncode in [0, 1] and native.stdout.strip() == b'', (native.returncode, native.stdout, native.stderr)
targets = [(100274, 'qemu-system-x86'), (137273, 'MainThread')]
for pid, comm in targets:
    assert pathlib.Path('/proc/' + str(pid) + '/comm').read_text().strip() == comm
assert pathlib.Path('/proc/137273/cwd').resolve() == root
record = {'format': 'dreams-c35-action-quiescence-v1', 'nativeAppPidCheckEmpty': True, 'nativePidCheckReturnCode': native.returncode, 'paused': [], 'argv': argv, 'cwd': str(root), 'status': 'running', 'start': now()}
started = None
try:
    for pid, comm in targets:
        os.kill(pid, signal.SIGSTOP)
        record['paused'].append({'pid': pid, 'comm': comm, 'stoppedAt': now()})
    for row in record['paused']:
        for attempt in range(100):
            status = pathlib.Path('/proc/' + str(row['pid']) + '/status').read_text()
            if 'State:\tT' in status: break
            time.sleep(0.01)
        else: raise AssertionError('Owned process did not stop')
        row['stoppedStateVerified'] = True
    started = now()
    print(json.dumps({'benchmarkStartedAt': started, 'pausedOwnedPids': [row['pid'] for row in record['paused']], 'nativeAppStopped': True}), flush=True)
    with (base / 'dreams-opening-next-actions.json').open('x') as output, (base / 'dreams-opening-next-actions.stderr.txt').open('x') as errors:
        result = subprocess.run(argv, cwd=root, stdout=output, stderr=errors)
    record['benchmarkExitCode'] = result.returncode
    record['benchmarkStartedAt'] = started
    record['benchmarkFinishedAt'] = now()
    record['status'] = 'passed' if result.returncode == 0 else 'failed'
finally:
    for row in reversed(record['paused']):
        os.kill(row['pid'], signal.SIGCONT)
        row['resumedAt'] = now()
    record['finish'] = now()
    with (base / 'dreams-opening-next-actions-quiescence.json').open('x') as file: file.write(json.dumps(record, indent=2) + '\n')
print(json.dumps({'benchmarkExitCode': record.get('benchmarkExitCode'), 'quiescence': '/tmp/dreams-opening-next-actions-quiescence.json', 'allOwnedProcessesResumed': True}), flush=True)
raise SystemExit(record.get('benchmarkExitCode', 1))
