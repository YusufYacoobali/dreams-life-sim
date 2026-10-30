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
