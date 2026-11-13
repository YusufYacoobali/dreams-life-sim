import type { World } from '../model';
import type { PropertyCommand } from './landlordTenancies';
import { availableCash } from './common';
import { lifestyleMonthNumber, lifestyleReason } from './lifestyleCommon';
import { rentalPriceReason, tenancyReviewFee } from './landlordPricing';
export type TenancyCommand = Extract<PropertyCommand, { type: 'manage-tenancy' }>;

/** The same quote and eligibility checks drive the UI and the durable command. */
export function tenancyActionReason(world: World, command: TenancyCommand): string | undefined {
  const common = lifestyleReason(world); if (common) return common;
  const row = world.lifestyle?.tenancies.find(item => item.id === command.tenancyId && !item.ended && item.landlordId === world.activePersonId);
  if (!row) return 'Choose your current tenancy';
  const asset = world.assets.find(item => item.id === row.assetId && item.kind === 'property' && item.ownerId === world.activePersonId);
  if (!asset) return 'Choose your own property';
  const current = lifestyleMonthNumber(world), person = world.people[world.activePersonId];
  const account = world.accounts.find(item => item.ownerId === person.id && item.currency === row.currency);
  const funds = account ? availableCash(account) : 0n;
  switch (command.action) {
    case 'rent':
      if (current - row.lastRentReviewMonth < 12) return 'Review rent at most once a year';
      return rentalPriceReason(asset, command.quotedAmount) ?? (command.quotedAmount > row.rent * 110n / 100n ? 'The increase cannot exceed 10% of the agreed rent' : undefined);
    case 'inspect':
      if (asset.country !== person.country || asset.city !== person.city) return 'Return to the property’s city for an in-person inspection';
      if (asset.propertyLife?.lastInspectionMonth !== null && current - (asset.propertyLife?.lastInspectionMonth ?? current) < 6) return 'Respect privacy: inspections are available every six months';
      return;
    case 'repair':
      if (!row.maintenance || command.quotedAmount !== row.maintenance) return 'Review the actual outstanding maintenance estimate';
      return funds < row.maintenance ? 'Insufficient available funds' : undefined;
    case 'discuss':
      return world.actionCounts[person.id + ':tenant-discuss:' + row.id + ':' + current] ? 'One rent discussion per month' : undefined;
    case 'renew':
      return current - row.lastRentReviewMonth < 12 ? 'Renew after twelve months' : undefined;
    case 'notice': return row.noticeMonth !== null ? 'Notice is already recorded' : undefined;
    case 'review-eviction':
      if (row.noticeMonth === null || current - row.noticeMonth < 2 || row.arrears < row.rent * 2n || row.maintenance > 0n) return 'A review requires two months’ notice, two rents in arrears and completed repairs';
      if (row.reviewMonth !== null) return 'An independent review is already recorded';
      if (command.quotedAmount !== tenancyReviewFee(asset.country)) return 'Review the actual review fee';
      return funds < command.quotedAmount ? 'Insufficient available funds' : undefined;
    case 'end':
      return row.noticeMonth === null || current - row.noticeMonth < 2 || row.maintenance > 0n ? 'Give two months’ notice and complete repairs before an ordinary ending' : undefined;
    case 'evict':
      return row.noticeMonth === null || current - row.noticeMonth < 2 || row.reviewMonth === null || current <= row.reviewMonth || row.arrears < row.rent * 2n || row.maintenance > 0n ? 'Await an independent review and a further month before ending an unpaid tenancy' : undefined;
  }
}
