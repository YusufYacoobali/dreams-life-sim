# Platform branding, clear action art and relationship views

Implemented on 24 October 2026 over `79bcaa4c`.

The [25 October final polish](FINAL_UI_POLISH.md) adds coloured platform marks,
distinct cult option art, a scrolling Deceased filter row and career ordering.
The descriptions and verification below record the original 24 October scope.

## Social platforms

| Stored ID | Visible platform | Account wording |
| --- | --- | --- |
| `photogram` | Instagram | account |
| `videowave` | YouTube | channel |
| `streamline` | Twitch | channel / live stream |
| `lifelink` | X | account |

The content catalogue supplies names to profile cards, account summaries, posting, creators, sponsorships, criticism and generated journal text. New writing uses direct platform-specific phrases such as posting on Instagram, uploading to a YouTube channel, streaming on Twitch and posting on an X account. IDs, preferences, post kinds, eligibility, limits, production costs, payout rates and RNG remain unchanged.

Legacy journal entries and pending outcomes use the existing read-only display boundary. This changes visible brand words without editing saved text, receipt hashes or payloads. The old generated account-creation sentence also receives the correct article and account/channel noun. Handles, emails, URIs, dotted identifiers, editable inputs and ordinary uses of the verb “streamline” remain literal. Adjacent JSX string fragments are joined before formatting so `@` and its handle retain their context.

The four compact SVG marks share a consistent contained tile and high-contrast theme foreground. They add no font or native dependency. Attribution and source/licence links appear in the existing Help → About Dreams section; [source details](../assets/branding/README.md) identify Font Awesome Free 6.7.2 and CC BY 4.0. New platform popups have explicit presentation IDs; previous generic illustration IDs remain supported.

## Artwork

The [339-entry audit](ICON_AUDIT.md) records **274 keep, 61 simplify and 4 replace** decisions across 19 groups. Existing readable category/family/health symbols remain, alongside portraits, product and destination previews, ordinary hobbies and playable mini-game scenes. Selected cluttered person/job icons and shared action slots use one large subject. Examples include handshake, angry speech bubble, white flag, rattle, heart envelope, wrench and medical bag.

Five original Image Gen sheets provide 58 new subjects; the clear existing plane is reused. Their 59 registered runtime derivatives cover the selected mappings with transparent margins, proportional containment and stable IDs. All unchanged PNGs remain byte-identical. The selected runtime PNG total is **182,512 bytes smaller** than the corresponding earlier PNGs, including the added shared symbols.

The [interactive art gallery](verification/action-icons/index.html) shows actual bundled PNGs and brand paths at 24/32/36/48/88px on both themes. [Generation and registration details](../design/action-icons/README.md) retain subject briefs, source hashes, real crop bounds and repeatable tooling. Rebuilding Polish 3 reapplies the simplifications automatically.

## Relationships

All, Family, Friends, Romance and Work / School show living people. Dead shows only deceased contacts, sorted by actual death date, newest first; same-day ties keep graph order. Search and reset work in every view. Existing Pets, Family, Family Tree and Household shortcuts remain.

Dead rows retain the portrait at the person's age at death, name, relationship label, bond and deceased status, with the recorded cause where present. The selector filters into a new array and retains the original edge objects. It changes no people, relationships, family tree/history data, world fields or save payloads.

## Verification

The focused run and passing reruns verify **244 cases across 16 suites**, including social/creator economics, platform-specific criticism, genuine legacy account reload/export, handle and URI preservation, numeric presentation, all relationship views and unchanged SQLite payloads. Initial failures were old channel-wording expectations and the new image test harness; corrected suites pass. Four additional cases verify legacy account-creation grammar. Fixtures and historical archives are unchanged.

Final strict application/test types pass; the 511-module runtime graph has no cycles, and the notice inventory check passes. The browser gallery loads 118 images and eight light/dark SVG instances with no broken assets or JavaScript errors at all five sizes. Both production Android/iOS Hermes exports pass; all 27 changed runtime sources match both source maps, and every one of the 59 registered PNGs matches its exported bytes. These are component, browser-art and bundle checks; physical-device visual/spoken accessibility acceptance is not claimed.
