# Dreams Life Sim — Shop Redesign Implementation Plan

**Branch:** `v2`

**Objective:** Recreate the three supplied reference screenshots as functional React Native screens, matching Dreams' existing design language. Preserve existing gameplay, purchases and entitlements.

## 1. Redesign the main shop

Replace the current card-per-product layout in `src/purchases/PurchaseUI.tsx`.

**Full Unlock — featured banner**

- Purple-to-blue gradient with a gold crown.
- Best Value badge, concise description and prominent price.
- Standard Dreams blue "Unlock Everything" button.
- Keep the banner compact, with restrained decorative effects.

**Premium purchases underneath**

Display three compact rows in this order:

1. All Career Packs — white background.
2. Time Machine — subtle lavender background.
3. God Mode — subtle pale-gold background.

Each has its original game icon, title, short description, store-provided price and chevron.

**Special Careers**

- White rounded container, matching the existing Special Careers page.
- Vertical list with thin dividers, icons, names, prices and chevrons.
- Include the four currently paid careers: Athlete, Astronaut, Military and Cult Leader.
- A single "View All Careers" button links to the existing Special Careers page.
- Do not put purchase prices on free careers such as Organised Crime.

At the bottom, include Restore Purchases and the one-time purchase message.

## 2. Create reusable purchase popups

Build a shared `ShopProductDetailModal` with product-specific content.

**Full Unlock popup**

Match reference image two:

- Lavender header containing the crown, title and description.
- Three included-benefit rows with icons and green checkmarks:
  - All Premium Careers
  - God Mode
  - Time Machine
- Purple purchase button showing the actual localized price.
- "One-time purchase · Keep forever" footer.

**Individual career popup**

Match the Athlete reference:

- White rounded modal over a dimmed shop background.
- Large existing career icon, centered title and short subtitle.
- Three concise, accurate gameplay benefits, each with a green checkmark.
- Full-width blue purchase button with localized price.
- Close button and permanent-purchase footer.

Reuse this template for Astronaut, Military and Cult Leader. Adapt it for Time Machine, God Mode and All Career Packs with their actual benefits.

**Behaviour**

- Tapping a shop item opens its detail popup, not the native payment sheet immediately.
- Only the popup's purchase button initiates the RevenueCat transaction.
- Prevent duplicate taps and accidental closure while purchasing.
- Handle cancellation, errors, success and restoration.
- Replace purchase controls with "Owned" when entitlements are active.
- Support scrolling on small screens and accessibility text scaling.

## 3. Preserve the game's visual identity

Use the existing `src/ui/components.tsx` and `src/ui/theme.tsx`.

- Off-white background, navy typography and existing button colours.
- Standard card radii, spacing, headers and animations.
- Reuse `CareerArt`, `CultArt`, `HealthLegalArt` and other existing artwork.
- Do not use screenshots as UI assets or generate completely new AI-style icons.
- Use `expo-linear-gradient`, which is already installed, for the featured banner.
- Support light/dark appearances.

The result must look like a natural part of Dreams, not a separate paywall application.

## 4. Integrate with existing navigation

Currently `app/store.tsx` is a root modal outside the game's bottom navigation.

- Extract the shop into one reusable screen component.
- Provide an in-game `/shop` route under `app/(game)` so the existing bottom navigation remains visible, with Activities selected.
- Keep `/store` available from Settings and other contexts where an active life may not exist.
- Update the Extras shop link and relevant route mapping.
- Preserve normal back navigation.

For existing gameplay-triggered paywalls, retain the current return-to-action behaviour. Reuse the new product-detail presentation where appropriate without stacking native modals.

## 5. Keep monetisation logic unchanged

Preserve the existing implementation:

- `src/purchases/catalog.ts`
- `src/purchases/service.ts`
- `src/purchases/native.ts`
- `src/purchases/access.ts`
- `src/purchases/hooks.ts`

Do not change product IDs, entitlement mappings or purchase permissions.

The current catalogue contains eight IAP products: four careers, God Mode, Time Machine, Career Pass and Full Unlock.

Use RevenueCat's localized `priceString`. The dollar amounts in the mockups are examples, not hardcoded UI prices.

Do not introduce subscriptions, additional products, consumables or upgrade pricing.

## 6. Testing and acceptance

Update `tests/purchases/ui.test.tsx` and relevant navigation tests to cover:

- Opening and dismissing every product popup.
- Correct product, content, price and artwork.
- Full Unlock and Career Pass granting their existing entitlements.
- Owned, loading, unavailable, cancelled and failed states.
- Restore Purchases and duplicate-purchase prevention.
- Retaining pending gameplay actions after purchases.
- Small screens, large text and dark mode.

Run `npm run typecheck`, `npm run check:imports`, the purchase test suite and the full regression suite.

**Final acceptance criteria:** The main shop closely resembles screenshot one; Full Unlock and Athlete purchase popups closely resemble screenshots two and three. Every button works, and existing purchase/gameplay behaviour remains unchanged.

**Do not modify unrelated gameplay, career systems, save formats or monetisation rules.**