import type { organisationStyles } from "../systems/organisedCrimeSchemas";
export type OrganisationStyle = (typeof organisationStyles)[number];
export const organisations: Record<
  OrganisationStyle,
  { title: string; name: string; description: string }
> = {
  "street-syndicate": {
    title: "Street Syndicate",
    name: "The Night Exchange",
    description:
      "Territory, loyalty and a reputation that answers the door before you do.",
  },
  "fraud-network": {
    title: "Fraud Network",
    name: "The Glass Ledger",
    description:
      "Polished manners, fictional promises and very real investigations.",
  },
  "smuggling-ring": {
    title: "Smuggling Ring",
    name: "The Wrong Harbour",
    description:
      "Unreliable contacts, expensive cargo and rival groups who remember names.",
  },
};
export const organisedMissions = [
  {
    id: "missing-envelope",
    title: "The Missing Envelope",
    premise:
      "An associate has lost an envelope and developed a sudden interest in moving abroad.",
    styles: ["street-syndicate", "fraud-network", "smuggling-ring"],
    rank: 0,
    reward: 260,
    risk: -1200,
    injury: 0,
  },
  {
    id: "territory-dispute",
    title: "The Painted Border",
    premise:
      "A rival has redrawn the neighbourhood boundary in fluorescent pink. Nobody claims it was an artistic decision.",
    styles: ["street-syndicate"],
    rank: 0,
    reward: 380,
    risk: -800,
    injury: 8,
  },
  {
    id: "counterfeit-gala",
    title: "The Counterfeit Gala",
    premise:
      "The invitation promises old money. The organiser is using a borrowed surname.",
    styles: ["fraud-network"],
    rank: 0,
    reward: 460,
    risk: -600,
    injury: 0,
  },
  {
    id: "unreliable-cargo",
    title: "Cargo With Opinions",
    premise:
      "The contact calls it a straightforward assignment. Every previous contact said that too.",
    styles: ["smuggling-ring"],
    rank: 0,
    reward: 500,
    risk: -400,
    injury: 5,
  },
  {
    id: "protection-dispute",
    title: "The Protection Complaint",
    premise:
      "An associate says the protection arrangement is attracting more trouble than it prevents.",
    styles: ["street-syndicate"],
    rank: 1,
    reward: 600,
    risk: -200,
    injury: 12,
  },
  {
    id: "phantom-investment",
    title: "The Phantom Prospectus",
    premise:
      "A fictional opportunity has acquired actual angry investors. The crew wants you to handle the fallout.",
    styles: ["fraud-network"],
    rank: 1,
    reward: 700,
    risk: 100,
    injury: 0,
  },
  {
    id: "rival-consignment",
    title: "The Rival Consignment",
    premise:
      "Two crews claim the same assignment. Both have already spent the proceeds in their heads.",
    styles: ["smuggling-ring"],
    rank: 1,
    reward: 740,
    risk: 200,
    injury: 10,
  },
  {
    id: "crew-debt",
    title: "The Crew Debt",
    premise:
      "A contact owes the organisation a favour. They have offered a speech about difficult times instead.",
    styles: ["street-syndicate", "fraud-network", "smuggling-ring"],
    rank: 2,
    reward: 800,
    risk: 300,
    injury: 8,
  },
  {
    id: "high-stakes-job",
    title: "One Last Big Job",
    premise:
      "The boss calls it one last big job. The calendar contains three previous last big jobs.",
    styles: ["street-syndicate", "fraud-network", "smuggling-ring"],
    rank: 2,
    reward: 1100,
    risk: 600,
    injury: 15,
  },
  {
    id: "organisation-crisis",
    title: "The Empty Chair",
    premise:
      "The boss missed a meeting. Everyone has brought a different explanation and a very similar ambition.",
    styles: ["street-syndicate", "fraud-network", "smuggling-ring"],
    rank: 3,
    reward: 1300,
    risk: 800,
    injury: 12,
  },
] as const;

/** Assignment-specific stakes and frozen payoffs, alongside the organisation's rules. */
export const organisedMissionProfiles: Record<string, {
  pressure: number; lossBps: number; cargo: string;
  quiet: string; exposed: string; failure: string; setback: string;
}> = {
  'missing-envelope': {
    pressure: 5, lossBps: 12, cargo: 'a sealed case of antique cinema props',
    quiet: 'The envelope returns. Its former custodian has already prepared a farewell speech and now has no occasion to use it.',
    exposed: 'You retrieve the envelope. The custodian sends an account of the meeting to somebody outside the crew.',
    failure: 'The envelope stays missing. You cover the crew’s wasted expenses; nobody accepts the custodian’s farewell speech as payment.',
    setback: 'The envelope never arrives. A rival claims the assignment while the crew argues over the receipt.',
  },
  'territory-dispute': {
    pressure: 16, lossBps: 20, cargo: 'a crate of collectible film posters',
    quiet: 'The rival removes the pink border. The crew receives its cut without having to adopt fluorescent stationery.',
    exposed: 'The rival yields the disputed ground. A witness records the threats rather than the new boundary.',
    failure: 'You spend your own money keeping the dispute from escalating. There is no payout, but the crew respects that you held the line.',
    setback: 'The rival keeps the disputed ground and paints a second stripe. The crew cannot call this a printing error.',
  },
  'counterfeit-gala': {
    pressure: 9, lossBps: 35, cargo: 'a trunk of vintage stage costumes',
    quiet: 'The gala’s fictional credentials persuade an actual guest to part with money. The guest’s account, unlike the pedigree, is real.',
    exposed: 'A guest pays, then checks the borrowed surname. Their complaint includes your name and the invitation.',
    failure: 'The guest checks the surname before paying. You cover the wasted venue expenses; the fictional pedigree refunds nothing.',
    setback: 'A guest publishes the invitation beside the real family’s denial. Your ordinary employer can read it too.',
  },
  'unreliable-cargo': {
    pressure: 12, lossBps: 45, cargo: 'a sealed crate of rare arcade cabinets',
    quiet: 'The cabinets arrive and the agreed payment clears. The contact celebrates by claiming they never doubted you.',
    exposed: 'The cabinets arrive, followed by questions about the consignment. The payment does not make the paperwork disappear.',
    failure: 'The consignment is confiscated. You cover part of the lost assignment, and the authorities retain the evidence.',
    setback: 'The cargo goes to the wrong crew. Your contact has a long explanation and no cabinets.',
  },
  'protection-dispute': {
    pressure: 20, lossBps: 30, cargo: 'a crate of antique jukebox parts',
    quiet: 'The protection payment changes hands. The person paying knows exactly whom to resent.',
    exposed: 'The payment clears. The person threatened keeps a record and makes a complaint.',
    failure: 'You pay to contain the dispute without collecting a cut. The crew values the restraint more than its missing money.',
    setback: 'The rival offers a competing arrangement. The crew loses influence while everyone insists they are providing a service.',
  },
  'phantom-investment': {
    pressure: 18, lossBps: 55, cargo: 'a case of limited-edition mechanical watches',
    quiet: 'An investor transfers actual funds against a fictional prospectus. The returns exist only in the presentation.',
    exposed: 'The investor transfers the funds, then takes the prospectus to the authorities. The complaint identifies the real recipient.',
    failure: 'The investor refuses the transfer. You pay the wasted arrangement costs; the prospectus remains your least valuable possession.',
    setback: 'The prospectus circulates with a warning attached. Your name is easier to find than the fictional company.',
  },
  'rival-consignment': {
    pressure: 22, lossBps: 65, cargo: 'a consignment of collectible racing trophies',
    quiet: 'Your consignment arrives first. The rival is left explaining why their promised trophies remain imaginary.',
    exposed: 'You deliver the trophies. The rival supplies investigators with a suspiciously detailed account of the consignment.',
    failure: 'The authorities confiscate the trophies. You cover part of the loss while the rival starts accepting congratulations.',
    setback: 'The rival takes the consignment. The person responsible for the handover cannot produce either cargo or an apology worth keeping.',
  },
  'crew-debt': {
    pressure: 14, lossBps: 40, cargo: 'a case of vintage camera equipment',
    quiet: 'The old obligation finally produces a payment. The speech about difficult times is quietly withdrawn.',
    exposed: 'The obligation pays. The other side saves every message about how the arrangement was enforced.',
    failure: 'You absorb the wasted costs. The crew remembers the effort, but a speech is still the only thing collected.',
    setback: 'The obligation remains unpaid. A competing crew gets a promise that once belonged to yours.',
  },
  'high-stakes-job': {
    pressure: 26, lossBps: 95, cargo: 'a shipment of rare mechanical music boxes',
    quiet: 'The last big job pays. The boss immediately begins describing a final, final opportunity.',
    exposed: 'The payout arrives. So does a record of the assignment detailed enough to spoil the retirement speech.',
    failure: 'The final job pays nothing and costs you real money. The crew respects the effort more than the boss’s arithmetic.',
    setback: 'The rival gets the assignment. The boss deletes the word last from the next invitation.',
  },
  'organisation-crisis': {
    pressure: 30, lossBps: 110, cargo: 'a warehouse lot of antique theatre machinery',
    quiet: 'You complete the assignment despite the empty chair. The people still attending meetings notice who did the work.',
    exposed: 'You deliver the assignment. A record of the crisis reaches people who do not work for the organisation.',
    failure: 'You pay to contain the crisis without collecting proceeds. The crew remembers who stayed when the chair was empty.',
    setback: 'The rival claims the abandoned assignment. The empty chair now has a queue of people blaming one another.',
  },
};
