# Local saved-life files

Saved Lives offers **Export save file** to write a new copy into a selected
folder, and **Share save file** to open another app through the system chooser.
Folder export works independently of installed sharing apps. Import previews
the actual person, age and revision before adding or explicitly replacing a life.

## Native permission boundary

Android 24 testing caught an SDK 57 integration problem: Document Picker copied
the selected archive into the client's unscoped `cache/DocumentPicker` directory,
while the modern File System reader enforced the project's scoped cache access.
The real `File.text()` call therefore failed with missing READ permission.

Import now uses the modern File System picker and its returned File together.
The native system grants access to the selected document; the app reads that
document through the same API. No broad storage permission, manual permission
change or alternate path around the native grant is used. The actual Android
retry reaches the correct age-nine/revision-44 preview and imports the complete
genuine reading save. All nine original compressed moments/metadata and every
field of the current world match exactly. Both earlier native lives stay intact.

Native file-access failures use readable action-specific messages. Known size,
unsupported-archive and unavailable-sharing messages remain explicit; platform
function names, permission exception traces and internal paths stay out of the
product flow. Cancellation closes the picker without an error or changed save.

## Copy safety and feedback

Export reads the chosen life through the real repository. It includes the
current checkpoint, original historical moments and any branch record. File
operations do not advance time, draw RNG, charge money or rewrite the save.
The existing 64 MB import limit and all archive/checkpoint validation remain.

New copy names use the export timestamp and a local sequence, with no raw world
ID used as a path component. Earlier copies remain separate. A failed write
attempt removes its own incomplete new file when the native provider permits
cleanup. The original live/backup worlds and historical bytes remain unchanged.

An immediate operation guard prevents duplicate picker/export requests. Controls
retain their labels and useful subtitles while an operation is pending. Success
and failure feedback uses a live region. The root Saved Lives page also reserves
the bottom system inset so the final row can scroll above Android navigation.

## Verification scope

All **20 affected checks / five suites** pass in **22.355 seconds**, including
six new real-SQLite file-flow checks: both platform cancellation codes, duplicate
taps, complete repeated copies, write cleanup/retry, unwritable folders, separate
sharing and invalid/read-failed/previewed/cancelled/confirmed imports. Native file
APIs are mocked in these component checks; their SQLite worlds and nine genuine
moments are real. Strict application/test typing and both fresh Hermes exports
pass. See [exact source/bundle hashes](verification/saved-files-20261019.json).

The actual Android 24 run separately verifies both complete first years,
saved-life switching, a valid native cache export and system chooser, then the
corrected native picker/preview/import. Acknowledging the imported result makes
exactly the production revision-45 world once, with no repeated practice or fee.
The actual Directory picker also saves the selected inactive Ren life to Download
while Riley stays active. Its 10,279-byte archive matches the earlier native
export exactly, including the original moment; all eight SQLite tables remain
unchanged. The raw folder/success captures and exact comparison are retained. The image has no compatible receiving
share app, so an external file transfer is not established by the chooser.
See [native records](verification/android24-files-20261019/).

Game and SQLite repository source remain unchanged, hash
`cca2039afee12cf05ff902cb6fc1ef3228777d90fd498fffdf91c63a381e8d30`.
The complete 1,226-test / 80-suite checkpoint belongs to `e5a4aaf`; overlapping
file/UI checks are not added to invent another complete regression. iOS native
execution, physical-device performance, complete reference/accessibility and
standalone release acceptance remain open.

The user requested no further file breadth unless already at least 80% complete.
That threshold was met before the request (working code, 20 checks and native
import); the single remaining folder-save check above was completed. Further
file work is deferred in favour of onboarding, early gameplay and responsiveness.
