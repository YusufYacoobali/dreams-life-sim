# Family choices and person identity

This UI increment follows the supplied relationship/person sheet, the dedicated
family-tree and heir references, their reconciled identity rules, and the accepted
Android contacts review. Existing childhood family links and adult-age guidance
remain intact. It changes four routes without changing game, persistence,
progression, shared UI, estate arithmetic or the death-screen layout.

- Family planning retains its reviewed adoption age or conception confirmation
  after a failed save, with an accessible error. Adoption review states the actual
  chosen age, and choices cannot change during a save.
- Person confirmations retain the reviewed recipient, gift amount or other
  command after failure. They close only after durable success. Child naming
  retains its exact failed draft; the current trimmed name is disabled with a
  reason and dispatch guard. Only the pressed save control shows busy progress.
- Changing the route person, life or active identity remounts local person drafts,
  review, amount and validation state. A failure for the same person preserves
  those drafts. Deceased profiles expose their actual summary and no stale
  mutation confirmation.
- Heir confirmation retains the chosen existing living child after failure.
  Navigation follows a successful durable actor change. A selected child who
  subsequently dies is no longer offered for confirmation. Existing age, trust,
  inherited share, estate, date and remaining-year rules are unchanged.
- Family Tree includes the actual living current partner and their existing
  relationship label, including before the couple has children. Existing parent,
  guardian and multiple-parent child identities remain connected.

The new connected SQLite suite uses unchanged marriage, birth and historical
fixtures with production commands. Explicit mortality scenarios exercise stale
selections and real settlement; they are not natural lifetime or native evidence.
It checks every table on rollback; unchanged and cancelled inputs save nothing;
warm failed/retried actions perform no full checkpoint unpack; cold results match
the complete predicted world; acknowledgements add no second payment, child or
inheritance. Original inactive life/backup rows and historical snapshot bytes and
metadata remain exact.

The focused six-suite gate passes **21 tests**, including existing family, legacy,
contacts, workplace and school-plan flows. Primary integration owns consolidated
types, exports and native acceptance. No new physical timing, keyboard/large-font,
iOS, death-layout or complete reference acceptance is claimed here.
