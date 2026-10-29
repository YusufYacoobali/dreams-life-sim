import React from 'react';
import { Image, View } from 'react-native';
import type {
  cultHeadquartersIds,
  cultUpgradeIds,
  cultRecruitmentIds,
  cultCeremonyIds,
  cultMemberRoles,
  cultFoundingMethods,
} from '../game/content/cults';
import { healthLegalRects } from './healthLegalLayout';
import { ordinaryHobbyRects } from './ordinaryHobbyLayout';
import { petsLeisureRects } from './petsLeisureLayout';
import { fameBusinessRects } from './fameBusinessLayout';
export const cultImages = {
  cult: require('../../assets/generated/cult/cult.png'),
  philosophy: require('../../assets/generated/cult/philosophy.png'),
  doctrines: require('../../assets/generated/cult/doctrines.png'),
  rules: require('../../assets/generated/cult/rules.png'),
  recruitment: require('../../assets/generated/cult/recruitment.png'),
  followers: require('../../assets/generated/cult/followers.png'),
  ceremony: require('../../assets/generated/cult/ceremony.png'),
  treasury: require('../../assets/generated/cult/treasury.png'),
  headquarters: require('../../assets/generated/cult/headquarters.png'),
  rivalry: require('../../assets/generated/cult/rivalry.png'),
  scandal: require('../../assets/generated/cult/scandal.png'),
  claim: require('../../assets/generated/cult/claim.png'),
};
// Original event/save illustration IDs remain valid. New IDs are presentation
// choices only; they never replace headquarters, upgrade or action IDs in saves.
const featureImages = {
  'meeting-chair': require('../../assets/generated/cult-options/meeting-chair.png'),
  cabin: require('../../assets/generated/cult-options/cabin.png'),
  farmhouse: require('../../assets/generated/cult-options/farmhouse.png'),
  warehouse: require('../../assets/generated/cult-options/warehouse.png'),
  bed: require('../../assets/generated/cult-options/bed.png'),
  monument: require('../../assets/generated/cult-options/monument.png'),
  wrench: require('../../assets/generated/polish3/jobs/plumber.png'),
  megaphone: require('../../assets/generated/polish3/jobs/marketing-executive.png'),
  shield: require('../../assets/generated/polish3/jobs/insurance-adviser.png'),
  book: require('../../assets/generated/polish3/actions/academic-help.png'),
  conversation: require('../../assets/generated/polish3/actions/talk.png'),
  praise: require('../../assets/generated/polish3/actions/praise.png'),
  coins: require('../../assets/generated/polish3/actions/request-raise.png'),
  contribution: require('../../assets/generated/polish3/actions/give-money.png'),
  payout: require('../../assets/generated/polish3/actions/ask-money.png'),
  apology: require('../../assets/generated/polish3/actions/apologise.png'),
  warning: require('../../assets/generated/polish3/actions/scold.png'),
  separation: require('../../assets/generated/polish3/actions/distance.png'),
  handshake: require('../../assets/generated/polish3/actions/spend-time.png'),
  key: require('../../assets/generated/polish3/actions/move-in.png'),
  archive: require('../../assets/generated/polish/archive.png'),
  star: require('../../assets/generated/polish/life-star.png'),
  mug: require('../../assets/generated/polish/everyday.png'),
  telescope: require('../../assets/generated/action-symbols/telescope.png'),
} as const;
const atlasImages = {
  temple: require('../../assets/generated/pets-leisure-atlas.png'),
  lotus: require('../../assets/generated/health-legal-atlas.png'),
  'cooking-pot': require('../../assets/generated/ordinary-hobby-atlas.png'),
  'social-phone': require('../../assets/generated/fame-business-atlas.png'),
} as const;
const images = { ...cultImages, ...featureImages };

/** Plain source metadata is also consumed by the small live artwork gallery. */
export const cultArtCatalog = {
  cult: { file: 'assets/generated/cult/cult.png', subject: 'Leader robe' },
  philosophy: { file: 'assets/generated/cult/philosophy.png', subject: 'Philosophy book' },
  doctrines: { file: 'assets/generated/cult/doctrines.png', subject: 'Doctrine scroll' },
  rules: { file: 'assets/generated/cult/rules.png', subject: 'Rules clipboard' },
  recruitment: { file: 'assets/generated/cult/recruitment.png', subject: 'Recruitment megaphone' },
  followers: { file: 'assets/generated/cult/followers.png', subject: 'Inner-circle portrait' },
  ceremony: { file: 'assets/generated/cult/ceremony.png', subject: 'Ceremony bell' },
  treasury: { file: 'assets/generated/cult/treasury.png', subject: 'Communal coin chest' },
  headquarters: { file: 'assets/generated/cult/headquarters.png', subject: 'Grand sanctuary' },
  rivalry: { file: 'assets/generated/cult/rivalry.png', subject: 'Leadership throne' },
  scandal: { file: 'assets/generated/cult/scandal.png', subject: 'Criticism newspaper' },
  claim: { file: 'assets/generated/cult/claim.png', subject: 'Claim teapot' },
  'meeting-chair': { file: 'assets/generated/cult-options/meeting-chair.png', subject: 'Folding meeting chair' },
  cabin: { file: 'assets/generated/cult-options/cabin.png', subject: 'Timber retreat cabin' },
  farmhouse: { file: 'assets/generated/cult-options/farmhouse.png', subject: 'Converted farmhouse' },
  warehouse: { file: 'assets/generated/cult-options/warehouse.png', subject: 'Rural compound building' },
  bed: { file: 'assets/generated/cult-options/bed.png', subject: 'Residential bed' },
  monument: { file: 'assets/generated/cult-options/monument.png', subject: 'Stone obelisk' },
  temple: { file: 'assets/generated/pets-leisure-atlas.png', subject: 'Gathering hall', rect: petsLeisureRects.museum, atlasSize: [1448, 1086] },
  lotus: { file: 'assets/generated/health-legal-atlas.png', subject: 'Meditation lotus', rect: healthLegalRects.meditation, atlasSize: [1254, 1254] },
  'cooking-pot': { file: 'assets/generated/ordinary-hobby-atlas.png', subject: 'Communal cooking pot', rect: ordinaryHobbyRects.cooking, atlasSize: [1254, 1254] },
  'social-phone': { file: 'assets/generated/fame-business-atlas.png', subject: 'Social invitation phone', rect: fameBusinessRects.social, atlasSize: [1254, 1254] },
  wrench: { file: 'assets/generated/polish3/jobs/plumber.png', subject: 'Workshop wrench' },
  megaphone: { file: 'assets/generated/polish3/jobs/marketing-executive.png', subject: 'Public announcement megaphone' },
  shield: { file: 'assets/generated/polish3/jobs/insurance-adviser.png', subject: 'Challenge shield' },
  book: { file: 'assets/generated/polish3/actions/academic-help.png', subject: 'Advice book' },
  conversation: { file: 'assets/generated/polish3/actions/talk.png', subject: 'Conversation bubbles' },
  praise: { file: 'assets/generated/polish3/actions/praise.png', subject: 'Praise star' },
  coins: { file: 'assets/generated/polish3/actions/request-raise.png', subject: 'Fee or reward coins' },
  contribution: { file: 'assets/generated/polish3/actions/give-money.png', subject: 'Contributing hands' },
  payout: { file: 'assets/generated/polish3/actions/ask-money.png', subject: 'Payout purse' },
  apology: { file: 'assets/generated/polish3/actions/apologise.png', subject: 'Apology flag' },
  warning: { file: 'assets/generated/polish3/actions/scold.png', subject: 'Confrontation bubble' },
  separation: { file: 'assets/generated/polish3/actions/distance.png', subject: 'Separation link' },
  handshake: { file: 'assets/generated/polish3/actions/spend-time.png', subject: 'Alliance handshake' },
  key: { file: 'assets/generated/polish3/actions/move-in.png', subject: 'Open-house key' },
  archive: { file: 'assets/generated/polish/archive.png', subject: 'Archived reports' },
  star: { file: 'assets/generated/polish/life-star.png', subject: 'Publicity star' },
  mug: { file: 'assets/generated/polish/everyday.png', subject: 'Welcome refreshments' },
  telescope: { file: 'assets/generated/action-symbols/telescope.png', subject: 'Starlight telescope' },
} as const;
export type CultArtId = keyof typeof cultArtCatalog;
export const cultHeadquartersArt = {
  'meeting-room': 'meeting-chair', woodland: 'cabin', farmhouse: 'farmhouse',
  compound: 'warehouse', sanctuary: 'headquarters',
} as const satisfies Record<(typeof cultHeadquartersIds)[number], CultArtId>;
export const cultUpgradeArt = {
  hall: 'temple', residences: 'bed', garden: 'lotus', kitchen: 'cooking-pot',
  workshop: 'wrench', monument: 'monument',
} as const satisfies Record<(typeof cultUpgradeIds)[number], CultArtId>;
export const cultRecruitmentArt = {
  street: 'megaphone', social: 'social-phone', 'open-evening': 'mug',
  referral: 'handshake', publicity: 'star',
} as const satisfies Record<(typeof cultRecruitmentIds)[number], CultArtId>;
export const cultCeremonyArt = {
  'dream-circle': 'conversation', 'quiet-table': 'lotus', 'community-supper': 'cooking-pot',
  starlight: 'telescope', 'open-house': 'key', 'grand-promise': 'ceremony',
} as const satisfies Record<(typeof cultCeremonyIds)[number], CultArtId>;
export const cultMemberActionArt = {
  talk: 'conversation', praise: 'praise', promote: 'rivalry', assign: 'rules',
  reward: 'coins', confront: 'warning', expel: 'separation',
} as const satisfies Record<string, CultArtId>;
export const cultRoleArt = {
  deputy: 'rivalry', treasurer: 'treasury', recruiter: 'megaphone',
  organiser: 'ceremony', adviser: 'book',
} as const satisfies Record<(typeof cultMemberRoles)[number], CultArtId>;
export const cultTreasuryArt = {
  records: 'doctrines', fees: 'coins', contribute: 'contribution', payout: 'payout', annual: 'archive',
} as const satisfies Record<string, CultArtId>;
export const cultRivalActionArt = {
  challenge: 'shield', publicity: 'megaphone', alliance: 'handshake', reconcile: 'apology', ignore: 'separation',
} as const satisfies Record<string, CultArtId>;
export const cultRecoveryArt = {
  apologise: 'apology', transparent: 'doctrines', 'open-gathering': 'temple',
  'replace-deputy': 'rules', rebrand: 'cult', ignore: 'scandal',
} as const satisfies Record<string, CultArtId>;
export const cultFoundingStrategyArt = {
  announcement: 'megaphone', social: 'social-phone', gathering: 'ceremony',
} as const satisfies Record<(typeof cultFoundingMethods)[number], CultArtId>;
export function CultArt({
  id = 'cult',
  size = 48,
}: {
  id?: CultArtId;
  size?: number;
}) {
  if (Object.hasOwn(atlasImages, id)) {
    const atlasId = id as keyof typeof atlasImages,
      { rect: [x, y, width, height], atlasSize: [atlasWidth, atlasHeight] } = cultArtCatalog[atlasId],
      scale = size / Math.max(width, height);
    return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}>
        <Image source={atlasImages[atlasId]} accessible={false} resizeMode="stretch" fadeDuration={0}
          style={{ position: 'absolute', width: atlasWidth * scale, height: atlasHeight * scale, left: -x * scale, top: -y * scale }} />
      </View>
    </View>;
  }
  return (
    <Image
      source={images[id as keyof typeof images] ?? cultImages.cult}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      resizeMode="contain"
      fadeDuration={0}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
