# Final V2 landlord ending fix

Checkpoint 1 removes the presentation-only arrears restriction from ordinary tenancy endings. `tenancyActionReason` and the existing resolver already permit an ordinary ending after two months' notice and completed repairs, regardless of unpaid rent; their rules and financial implementation are unchanged.

The ending card now lets the player select **End Tenancy Normally** or **Evict for Unpaid Rent**. Notice/repair progress appears for both; unpaid-rent threshold, independent review and the additional waiting month appear only for eviction. All actionable steps and the selected termination use `tenancyActionReason`. Only the selected ending's final action is present, including when both are eligible. Outstanding repairs can be arranged from the ending card. Incomplete steps show actual progress instead of disabled termination controls.

The normal flow remains available with zero, partial or substantial arrears. Confirmation uses the original command, returns the full held deposit exactly once and preserves unpaid rent, historic payments and the resolver's result text. No schema, migration, purchase, navigation or gameplay rule changed.

## Verification

- Three focused suites / 26 cases pass: `tenancy-eligibility`, `landlord-polish`, `lifestyle-property`. The final affected eligibility rerun passes all seven cases.
- Cases cover zero/partial/substantial arrears, incomplete and complete notice, actual reported repairs and their real payment, the eviction review/waiting month, both eligible endings with one selected action, cancellation without writes, rejected duplicate endings after result acknowledgement, and real SQLite failure/retry with closed-connection reopening.
- Arrears originate in actual seeded monthly rent periods. Zero and partial cases use real arrears repayments; the partial-payment scenario records an explicit tenant-budget expense rather than fabricating rent history.
- Store/database results equal the actual resolver; payments and arrears remain literal, escrow becomes zero, and precisely one refund transaction reaches the tenant.
- Application/test TypeScript and the 616-module import check pass, with no cycles.

Renderer checks use a narrow 320px frame and the existing choice/modal components. Actual iOS/Android geometry, text measurement and assistive behavior remain native acceptance checks.
