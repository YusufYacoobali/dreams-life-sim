import type { ModelSpecialisation } from '../systems/modelCareerSchemas';
export const modelSpecialisationContent: Record<ModelSpecialisation, { title: string; description: string }> = {
  editorial: { title: 'Editorial & Magazine', description: 'Distinctive photographs and cover credits. Strong industry prestige; smaller fees.' },
  runway: { title: 'Runway & High Fashion', description: 'Preparation, presentation and designer relationships. A short show can open long conversations.' },
  commercial: { title: 'Commercial & Advertising', description: 'Reliable paid campaigns and broad recognition. The brief matters as much as the pose.' },
  luxury: { title: 'Luxury Campaigns', description: 'Major agencies, demanding clients and high fees. Exclusive agreements limit competing work.' },
  lifestyle: { title: 'Sports & Lifestyle', description: 'Approachable campaigns, practical creative choices and returning clients. Experience beats perfection.' },
};
export const modelBookingContent = [
  { id: 'editorial', title: 'Fashion Magazine Editorial', specialisation: 'editorial', genre: 'Magazine', role: 'Featured editorial model', months: 3, wageBps: 8500, prestige: 78, popularity: 30, difficulty: 42, risk: 22, minSkill: 40, minReputation: 0, minAgency: 0, exclusivity: false, names: ['The Beautiful Commute', 'Rooms Nobody Lives In', 'After the Last Train', 'Some Assembly Required'] },
  { id: 'runway', title: 'Runway Show', specialisation: 'runway', genre: 'Runway', role: 'Runway cast', months: 3, wageBps: 9000, prestige: 80, popularity: 40, difficulty: 50, risk: 38, minSkill: 45, minReputation: 35, minAgency: 0, exclusivity: false, names: ['The Unfinished Collection', 'Rain Is a Colour', 'The Useful Pockets Show', 'Nothing to Declare'] },
  { id: 'advertising', title: 'Advertising Campaign', specialisation: 'commercial', genre: 'Advertising', role: 'Campaign lead', months: 6, wageBps: 16000, prestige: 38, popularity: 78, difficulty: 48, risk: 30, minSkill: 40, minReputation: 0, minAgency: 0, exclusivity: false, names: ['Everyday, Slightly Better', 'The Very Ordinary Escape', 'Go Outside Eventually', 'Your Other Favourite Jacket'] },
  { id: 'designer', title: 'Designer Collection', specialisation: 'lifestyle', genre: 'Independent designer', role: 'Collection collaborator', months: 3, wageBps: 11000, prestige: 65, popularity: 50, difficulty: 50, risk: 48, minSkill: 45, minReputation: 30, minAgency: 0, exclusivity: false, names: ['The Borrowed Studio', 'Sunday Is a State of Mind', 'Worn In, Not Out', 'The Good Enough Collection'] },
  { id: 'ambassador', title: 'Brand Ambassador Agreement', specialisation: 'commercial', genre: 'Endorsement', role: 'Brand ambassador · 12-month exclusive rights', months: 9, wageBps: 26000, prestige: 58, popularity: 90, difficulty: 65, risk: 45, minSkill: 55, minReputation: 55, minAgency: 1, exclusivity: true, names: ['Northline Everyday', 'Forma Without Formality', 'Studio Common Ground', 'The Long Weekend Company'] },
  { id: 'luxury', title: 'Luxury Fashion Campaign', specialisation: 'luxury', genre: 'Luxury fashion', role: 'Luxury campaign face · 9-month exclusive rights', months: 6, wageBps: 35000, prestige: 95, popularity: 80, difficulty: 80, risk: 60, minSkill: 70, minReputation: 70, minAgency: 2, exclusivity: true, names: ['House of Minor Inconveniences', 'Maison Elsewhere', 'The Quietly Expensive House', 'Atelier Last Word'] },
] as const;
export function modelBookingDefinition(category: string) { return modelBookingContent.find(item => item.id === category); }
export const modelProductionActions = [
  { id: 'prepare', title: 'Prepare the Presentation', description: 'Rehearse the route and plan the shoot. Reliable quality and professionalism, with extra effort.' },
  { id: 'interpret', title: 'Propose a Creative Interpretation', description: 'Make the work your own. The client may back your interpretation or wish you had kept to the brief.' },
  { id: 'negotiate', title: 'Negotiate Remaining Fees', description: 'Ask for a bounded increase in future instalments. The client may refuse or lose confidence.' },
  { id: 'publicity', title: 'Build the Campaign', description: 'Give publicity more attention. Wider audience reach can come at the expense of craft.' },
] as const;
