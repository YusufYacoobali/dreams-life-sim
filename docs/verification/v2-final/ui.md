# V2 checkpoint 4 — UI, illustrations and writing

Reviewed from `7231fbc6` on 2026-11-14. This checkpoint leaves the shop, routes, purchase access, game resolvers, schemas and save format unchanged.

## Recheck findings and changes

- Vehicle Care and Upgrades still reused the Settings illustration, and Ownership used a loan illustration. They now use the existing mechanic engine, engineering gear and contract artwork. Individual vehicle activities use suitable existing vehicle, suitcase, gift, design and mechanical illustrations. The road-trip confirmation no longer describes the trip as local.
- Prison inmate actions still repeated the visiting-room illustration. Conversation, friendship, apologies, protection, favours and conflict now use their existing illustrated actions; reporting and fighting retain legal artwork. Group and outside-contact actions use matching illustrations. Icons reserve 40px, and selected inmate/contact names can wrap beside their portraits. The empty outside-contact message checks whether any contacts are living.
- Organised Crime assignments now use existing illustrations for the actual brief (envelope, dispute, cargo, contract, debt, leadership), preserving all assignment IDs, descriptions, eligibility and decisions. Joining copy no longer repeats the arrest warning already given during assignment review. The existing three organisation choices and navigation are preserved.
- Actor and Model current-production details and decisions precede representation/identity setup. Model active-brand fulfilment remains above portfolio work. Existing scrollable pages, touch targets and modal footer behavior are retained.
- Entry, representation, portfolio and brand reviews have shorter presentation copy. Model exclusivity uses separate rights duration, required appearances, exact settlement, claim-trigger, sponsorship-restriction and booking-restriction rows. The distinction between paid production and longer rights/appearance obligations remains explicit.
- Audition/casting reviews now show exact agency commission, including fractional percentages through the existing native-text handling. Actor negotiation also discloses the resolver's existing +12% accepted fee and -3% refused fee, with separate gross totals using the same currency/rounding boundaries as the signed contract. The downsides already existed; no negotiation roll or payment rule changed.

Only one game-content sentence changes: `modelProductionActions`' negotiation description replaces “bounded increase” with “higher fee.” Its sole consumer is `ModelCareerDashboard`; the resolver does not read the description. Persisted event bodies, recorded decisions, project releases/cancellations, payment histories and archived outcomes are not rewritten. Existing historical-outcome tests verify this display boundary.

All artwork used here was already bundled and approved. This checkpoint generates no artwork and adds no runtime image files.

## Verification

- Focused UI regression: **4 suites, 34 tests passed**, using `npx jest --runInBand tests/ui/creative-career-ui.test.tsx tests/ui/vehicle-management-polish.test.tsx tests/ui/organised-crime-flow.test.tsx tests/ui/legal-review-save-flow.test.tsx`.
- New coverage verifies exact 10.5% commission display, both negotiated-gross previews, the real -3% declined-fee contract and on-disk save against the resolver, no upfront pay, cancel without writes, active-work ordering and long model exclusivity at 200% text. Existing tests cover fractional representation rates, historical frozen outcomes, atomic failed-save/retry behavior, outside/inmate selection, prison routines, vehicle ownership and organisation entry.
- `npm run typecheck`: app and test projects passed.
- `node tools/check-runtime-imports.cjs`: **616 runtime modules, zero cycles**.
- `git diff --check`: passed.

The parent checkpoint integration runs the full regression suite, save/permission checks, soak and Hermes exports after all five checkpoints. These focused checks do not replace those final checks.

## Native acceptance limits

The focused React Native tests exercise narrow 320px layouts, 200% text for current-work controls and long exclusive contract reviews, accessible actions and retained modal confirmation/cancel controls. They verify render trees and command behavior; they do not prove native text measurement, scrolling, VoiceOver/TalkBack or touch interaction on an installed app. No working native device was available for this checkpoint. Actual iOS/Android large-text, portrait-name wrapping, artwork placement and long-modal scrolling remain native acceptance checks.

Landlord follow-up replaces the pregnancy illustration on Tenants & Applications with the existing move-in artwork, and the generic maintenance gear with the approved plumber illustration. Eligibility, ending choices and commands remain unchanged. After these two asset substitutions, the integrated landlord UI suite passes all 10 tests and both strict TypeScript projects pass.

The final integrated audit also completes the Model break/claim review: it discloses the existing standing/client penalties for either payment path, and future pay ending only when the resolver will end the associated active employment. The current-booking UI journey checks the exact settlement and cancellation without writes. Cell Escape practice now describes key matching and uses the existing illustrated lock plate instead of a star; historical saved game text remains unchanged.

Final copy follow-up verification: all 43 tests across `creative-career-ui` and `minigame-flow` pass, including the active-booking settlement cancellation journey and store-free practice controls. The initial full run was stopped after four passing suites so the restarted combined regression uses the final copy; the canceled run is not counted as a pass.
