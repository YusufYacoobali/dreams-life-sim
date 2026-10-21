import { validateAnnualPacing } from './annualPacing';
import { npcMoveSchema } from './systems/npcMoveSchemas';
import { validateNpcMoves } from './systems/npcMoveValidation';
import { bestFriendshipSchema } from './systems/friendshipSchemas';
import { validateBestFriendships } from './systems/friendshipValidation';
import { teenRelationshipSchema } from './systems/teenRelationshipSchemas';
import { validateTeenRelationships } from './systems/teenRelationshipValidation';
import { indexLedger, rememberLedgerIndex } from './ledgerIndex';
import { z } from 'zod';
import { countries, countryCodes } from './countries';
import { pendingSchema } from './runtime';
import { dateSchema, monthFrom } from './calendar';
import { ageOn, compareDates } from './personHelpers';
export { ageOn, compareDates, fullName } from './personHelpers';
export { dateSchema, type GameDate } from './calendar';
import { educationSchema, employmentSchema, financeSchema, holdingSchema, liabilitySchema, marketSchema, newEducation, newFinance, physicalAssetSchema, transactionSchema } from './systems/schemas';
import { jobs } from './content/jobs';
import { initialMarket } from './content/markets';
import { assetCatalog } from './content/assets';
import { biologySchema, custodySchema, genders, householdSchema, marriageSchema, newFamilyPerson, pregnancySchema, relationshipSchema } from './systems/familySchemas';
import { netWorth } from './valuation';
import { annualSchema, estateSchema, willSchema } from './systems/estateSchemas';
import { healthSchema, newHealth } from './systems/healthSchemas';
import { caseSchema, contrabandSchema, gangSchema, incidentSchema, newLegal, personLegalSchema, remandSchema, sentenceSchema } from './systems/legalSchemas';
import { priorityOf } from './pendingQueue';
import { validateLegal } from './systems/legalValidation';
import { collaborationSchema, controversySchema, followSchema, newPublicLife, publicLifeSchema, socialAccountSchema, sponsorshipSchema } from './systems/socialSchemas';
import { validateSocial } from './systems/socialValidation';
import { businessPayableSchema, businessSchema, businessTransactionSchema } from './systems/businessSchemas';
import { validateBusinesses } from './systems/businessValidation';
import { careerSchema, newSkills, skillsSchema, trainingSchema } from './systems/careerSchemas';
import { validateCareers } from './systems/careerValidation';
import { musicReleaseSchema } from './systems/musicSchemas';
import { validateMusic } from './systems/musicValidation';
import { electionSchema } from './systems/politicsSchemas';
import { validateCreators } from './systems/creatorValidation';
import { validatePolitics } from './systems/politicsValidation';
import { validateServices } from './systems/serviceValidation';
import { validateRoyalty } from './systems/royaltyValidation';
import { royalHouseSchema } from './systems/royaltySchemas';
import { serviceCareerSchema } from './systems/serviceSchemas';
import { creatorInvoiceSchema, creatorStudioSchema } from './systems/creatorSchemas';
import { workEarningsSchema } from './systems/earningsSchemas';
import { validateEarnings } from './systems/earningsValidation';
import { relocationSchema } from './systems/relocationSchemas';
import { validateRelocations } from './systems/relocationValidation';
import { tripSchema } from './systems/travelSchemas';
import { validateTravel } from './systems/travelValidation';
import { schoolCommunitySchema, schoolWithdrawalSchema } from './systems/schoolSchemas';
import { storyThreadSchema } from './systems/storySchemas';
import { validateStoryThreads } from './systems/storyValidation';
import { validateSchools } from './systems/schoolValidation';
import { recoveryCourseSchema, secondaryCompletionSchema } from './systems/educationRecoverySchemas';
import { validateEducationRecovery } from './systems/educationRecoveryValidation';
import { scholarshipSchema } from './systems/scholarshipSchemas';
import { hobbySchema, outingSchema } from './systems/leisureSchemas';
import { hourlyContractSchema } from './systems/hourlyWorkSchemas';
import { validateHourlyWork } from './systems/hourlyWorkValidation';
import { hobbyEventSchema } from './systems/hobbyEventSchemas';
import { validateHobbyEvents } from './systems/hobbyEventValidation';
import { validateLeisure } from './systems/leisureValidation';
import { petAdoptionSchema, petSchema } from './systems/petSchemas';
import { validatePets } from './systems/petValidation';
import { validateScholarships } from './systems/scholarshipValidation';
import { universityAdmissionSchema } from './systems/universityAdmissionSchemas';
import { validateUniversityAdmissions } from './systems/universityAdmissionValidation';
import { studyCourseSchema } from './systems/studyCourseSchemas';
import { validateStudyCourses } from './systems/studyCourseValidation';
import { workplaceSchema, workRaiseSchema } from './systems/workplaceSchemas';
import { validateWorkplaces } from './systems/workplaceValidation';
import { validateJobInterview } from './systems/jobInterviewValidation';
import { npcCourtshipSchema } from './systems/npcCourtshipSchemas';
import { validateNpcCourtships } from './systems/npcCourtshipValidation';
import { npcSeparationSchema } from './systems/npcSeparationSchemas';
import { validateNpcSeparations } from './systems/npcSeparationValidation';

const percentage = z.number().int().min(0).max(100);
const personId = z.string().regex(/^person_[a-zA-Z0-9_-]+$/);
const safeName = z.string().trim().min(1).max(40).refine(name => !/[\u0000-\u001F]/.test(name), 'Invalid name');
export const statsSchema = z.object({
  happiness: percentage, health: percentage, smarts: percentage, looks: percentage, respect: percentage,
  energy: percentage, fitness: percentage, stress: percentage, discipline: percentage, fame: percentage,
});
export type Stats = z.infer<typeof statsSchema>;
export const personSchema = z.object({
  id: personId, firstName: safeName, lastName: safeName,
  gender: z.enum(['male', 'female', 'nonbinary']),
  nationality: z.enum(countryCodes), country: z.enum(countryCodes), city: z.string().min(1).max(80),
  born: dateSchema, died: dateSchema.nullable(), causeOfDeath: z.string().max(300).nullable(),
  stats: statsSchema,
  appearance: z.object({ face: z.number().int().min(0).max(3), skin: z.number().int().min(0).max(5), hair: z.number().int().min(0).max(7), hairColor: z.number().int().min(0).max(4) }),
  traits: z.array(z.enum(['kind', 'ambitious', 'impulsive', 'reserved', 'creative', 'practical'])).max(3),
  education: educationSchema, employment: employmentSchema.nullable(), finance: financeSchema,
  biology: biologySchema, attractedTo: z.array(z.enum(genders)).min(1).max(3), wantsChildren: z.boolean(), householdId: z.string().nullable(), lastEconomicMonth: z.number().int(),
  health: healthSchema,
  legal: personLegalSchema,
  publicLife: publicLifeSchema,
  skills: skillsSchema, training: trainingSchema.nullable(),
});
export type Person = z.infer<typeof personSchema>;
export const journalSchema = z.object({ id: z.string(), date: dateSchema, personId, text: z.string().max(1200), category: z.string() });
// Only rows certified by a full world validation may take this path. Ledger
// records are append-only; sharing frozen originals avoids cloning every old
// transaction for an unrelated button press.
const immutableTransactions = new WeakSet<object>();
const immutableWorlds = new WeakSet<object>();
export const worldSchema = z.object({
  schemaVersion: z.literal(39), engineVersion: z.literal(40), contentVersion: z.literal(17),
  id: z.string().regex(/^life_[a-zA-Z0-9_-]+$/), revision: z.number().int().nonnegative(),
  date: dateSchema, activePersonId: personId,
  random: z.object({ events: z.number().int().min(0).max(0xFFFFFFFF), npcs: z.number().int().min(0).max(0xFFFFFFFF), economy: z.number().int().min(0).max(0xFFFFFFFF), outcomes: z.number().int().min(0).max(0xFFFFFFFF) }),
  people: z.record(personId, personSchema),
  relationships: z.array(relationshipSchema), bestFriendships: z.array(bestFriendshipSchema),
  teenRelationships: z.array(teenRelationshipSchema),
  households: z.array(householdSchema), marriages: z.array(marriageSchema),
  npcCourtships: z.array(npcCourtshipSchema),
  npcSeparations: z.array(npcSeparationSchema),
  npcMoves: z.array(npcMoveSchema),
  pregnancies: z.array(pregnancySchema), custody: z.array(custodySchema),
  accounts: z.array(z.object({ id: z.string(), ownerId: personId, currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']), cash: z.bigint(), openingCash: z.bigint().nonnegative(), lockedCash: z.bigint().nonnegative().default(0n) })),
  liabilities: z.array(liabilitySchema), ledger: z.array(transactionSchema),
  assets: z.array(physicalAssetSchema), holdings: z.array(holdingSchema), market: marketSchema,
  workHistory: z.array(z.object({ id: z.string(), hourlyContractId: z.string().optional(), personId, roleId: z.string(), employer: z.string(), companyId: z.string().nullable().default(null), started: dateSchema, ended: dateSchema.nullable(), monthsWorked: z.number().int().nonnegative(), grossEarned: z.bigint().nonnegative(), ...workEarningsSchema.shape })),
  journal: z.array(journalSchema),
  birthAcknowledged: z.boolean(),
  calendarAnchorDay: z.number().int().min(1).max(31),
  annual: annualSchema.nullable(), legacyAnnual: annualSchema.nullable(), wills: z.array(willSchema), estates: z.array(estateSchema),
  generation: z.number().int().positive(), legacies: z.array(z.object({ fromId: personId, toId: personId, date: dateSchema })),
  pending: pendingSchema.nullable(),
  pendingPriority: z.number().int().min(0).max(200),
  deferred: z.array(z.object({ priority: z.number().int().min(0).max(200), event: pendingSchema })),
  incidents: z.array(incidentSchema), cases: z.array(caseSchema), sentences: z.array(sentenceSchema), remand: z.array(remandSchema), contraband: z.array(contrabandSchema), gangs: z.array(gangSchema),
  socialAccounts: z.array(socialAccountSchema), sponsorships: z.array(sponsorshipSchema), controversies: z.array(controversySchema), collaborations: z.array(collaborationSchema), socialFollows: z.array(followSchema),
  businesses: z.array(businessSchema), businessLedger: z.array(businessTransactionSchema), businessPayables: z.array(businessPayableSchema),
  careers: z.array(careerSchema),
  musicReleases: z.array(musicReleaseSchema),
  elections: z.array(electionSchema),
  creatorStudios:z.array(creatorStudioSchema),creatorInvoices:z.array(creatorInvoiceSchema),serviceCareers:z.array(serviceCareerSchema),royalHouses:z.array(royalHouseSchema),
  trips: z.array(tripSchema), relocations: z.array(relocationSchema), schoolCommunities: z.array(schoolCommunitySchema), storyThreads: z.array(storyThreadSchema),
  schoolCompletions: z.array(secondaryCompletionSchema), schoolWithdrawals: z.array(schoolWithdrawalSchema), recoveryCourses: z.array(recoveryCourseSchema),
  universityApplications: z.array(universityAdmissionSchema),
  studyCourses: z.array(studyCourseSchema),
  scholarships: z.array(scholarshipSchema), pets: z.array(petSchema), petAdoptions: z.array(petAdoptionSchema), hobbies: z.array(hobbySchema), hobbyEvents: z.array(hobbyEventSchema), hourlyContracts: z.array(hourlyContractSchema), leisureOutings: z.array(outingSchema),
  workplaces: z.array(workplaceSchema), workRaises: z.array(workRaiseSchema),
  eventHistory: z.array(z.object({ templateId: z.string(), year: z.number().int() })),
  actionCounts: z.record(z.string(), z.number().int().nonnegative()),
});
export type World = z.infer<typeof worldSchema>;


function parseWorldShape(value: unknown): World {
  if (value && typeof value === 'object' && 'ledger' in value && Array.isArray(value.ledger)) {
    const rows = value.ledger;
    if (!rows.some(row => immutableTransactions.has(row))) return worldSchema.parse(value);
    const world = worldSchema.parse({ ...value, ledger: [] });
    world.ledger = rows.map(row => immutableTransactions.has(row) ? row : transactionSchema.parse(row));
    return world;
  }
  return worldSchema.parse(value);
}
/** Reject contradictory imports/checkpoints rather than repairing them silently. */
export function validateWorld(value: unknown, immutable = false): World {
  const world = parseWorldShape(value);
  const ledger = indexLedger(world.ledger, world.ledger.every(row => immutableTransactions.has(row)));
  if (!world.people[world.activePersonId]) throw new Error('Missing active person');
  const accountIds = new Set<string>();
  const accountCurrencies = new Set<string>();
  const relationshipIds = new Set<string>();
  const journalIds = new Set<string>();
  const householdIds = new Set<string>(), householdMembers = new Set<string>();
  const employmentByPerson = new Map<string, World['workHistory']>();
  for (const record of world.workHistory) {
    const records = employmentByPerson.get(record.personId) ?? [];
    records.push(record); employmentByPerson.set(record.personId, records);
  }
  for (const household of world.households) {
    if (householdIds.has(household.id)) throw new Error('Duplicate household'); householdIds.add(household.id);
    for (const id of household.members) {
      if (!world.people[id] || householdMembers.has(id) || world.people[id].householdId !== household.id) throw new Error('Invalid household membership');
      householdMembers.add(id);
    }
    if (household.homeAssetId && !world.assets.some(asset => asset.id === household.homeAssetId && asset.ownerId && household.members.includes(asset.ownerId) && asset.primaryHome && asset.kind === 'property')) throw new Error('Invalid household home');
  }
  for (const [id, person] of Object.entries(world.people)) {
    if (person.id !== id || ageOn(person, world.date) < 0) throw new Error('Invalid person identity or age');
    if (person.died && (compareDates(person.died, person.born) < 0 || compareDates(person.died, world.date) > 0)) throw new Error('Invalid death date');
    if (!!person.died !== !!person.causeOfDeath) throw new Error('Inconsistent death record');
    if ((person.householdId && !householdMembers.has(id)) || (!person.householdId && householdMembers.has(id)) || new Set(person.attractedTo).size !== person.attractedTo.length || person.lastEconomicMonth > world.date.year * 12 + world.date.month - 1) throw new Error('Invalid personal family state');
    if (person.health.lastMonth > world.date.year * 12 + world.date.month - 1 || (person.health.providerId && (!world.people[person.health.providerId] || person.health.providerId === id)) || new Set(person.health.familyRisks).size !== person.health.familyRisks.length || new Set(person.health.vaccinations.map(item => item.id)).size !== person.health.vaccinations.length) throw new Error('Invalid personal health state');
    const conditionIds = new Set<string>(), medicalIds = new Set<string>();
    for (const condition of person.health.conditions) {
      if (conditionIds.has(condition.id) || compareDates(condition.onset, person.born) < 0 || compareDates(condition.onset, world.date) > 0 || (!!condition.resolved !== (condition.status === 'recovered')) || (condition.status === 'recovered' && (condition.severity !== 0 || condition.treatment)) || condition.status === 'controlled' && !condition.treatment || (condition.resolved && (compareDates(condition.resolved, condition.onset) < 0 || compareDates(condition.resolved, world.date) > 0)) || (condition.diagnosed && (compareDates(condition.diagnosed, condition.onset) < 0 || compareDates(condition.diagnosed, world.date) > 0)) || (condition.treatment && (!condition.diagnosed || compareDates(condition.treatment.started, condition.onset) < 0 || compareDates(condition.treatment.started, world.date) > 0 || condition.treatment.lastPaymentMonth > world.date.year * 12 + world.date.month - 1)) || condition.lastEmergencyYear !== null && condition.lastEmergencyYear > world.date.year) throw new Error('Invalid condition history');
      conditionIds.add(condition.id);
    }
    for (const record of person.health.records) {
      if (medicalIds.has(record.id) || compareDates(record.date, person.born) < 0 || compareDates(record.date, world.date) > 0 || !world.people[record.payerId] || record.providerId && !world.people[record.providerId] || record.conditionId && !conditionIds.has(record.conditionId)) throw new Error('Invalid medical record'); medicalIds.add(record.id);
    }
    for (const vaccine of person.health.vaccinations) if (compareDates(vaccine.date, person.born) < 0 || compareDates(vaccine.date, world.date) > 0 || vaccine.expiresMonth <= vaccine.date.year * 12 + vaccine.date.month - 1) throw new Error('Invalid vaccination record');
    if (person.employment) {
      const role = jobs.find(candidate => candidate.id === person.employment!.roleId);
      const history = employmentByPerson.get(id)?.find(record => record.id === person.employment!.id && !record.ended);
      if (!role || !history || history.roleId !== role.id || history.currency !== person.employment.currency || history.hourlyContractId !== person.employment.hourlyContractId || person.died || (!role.partTime && person.education.stage !== 'none')) throw new Error('Invalid current employment');
    }
  }
  const workIds = new Set<string>();
  for (const record of world.workHistory) {
    if (workIds.has(record.id) || !world.people[record.personId] || !jobs.some(role => role.id === record.roleId) || compareDates(record.started, world.date) > 0 || (record.ended && (compareDates(record.ended, record.started) < 0 || compareDates(record.ended, world.date) > 0))) throw new Error('Invalid employment history');
    workIds.add(record.id);
  }
  for (const person of Object.values(world.people)) {
    const records = employmentByPerson.get(person.id) ?? [];
    if (records.reduce((sum, record) => sum + record.monthsWorked, 0) !== person.finance.serviceMonths || records.reduce((sum, record) => sum + record.normalizedGross, 0n) !== person.finance.lifetimeGross) throw new Error('Earnings do not reconcile with employment history');
  }
  const relationPairs = new Set<string>(), romanticPeople = new Set<string>();
  const activeTeenRelations = validateTeenRelationships(world);
  const parentsByChild = new Map<string, string[]>();
  for (const relation of world.relationships) if (relation.roles.includes('parent')) parentsByChild.set(relation.to, [...(parentsByChild.get(relation.to) ?? []), relation.from]);
  const parentVisits = new Map<string, number>();
  const visit = (id: string): void => { if (parentVisits.get(id) === 1) throw new Error('Cyclic parent graph'); if (parentVisits.get(id) === 2) return; parentVisits.set(id, 1); for (const parent of parentsByChild.get(id) ?? []) visit(parent); parentVisits.set(id, 2); };
  for (const id of parentsByChild.keys()) visit(id);
  const ancestors = (id: string) => { const all = new Set([id]); let next = [id]; for (let depth = 0; depth < 4; depth++) { const level: string[] = []; for (const child of next) for (const parent of parentsByChild.get(child) ?? []) if (!all.has(parent)) { all.add(parent); level.push(parent); } next = level; } return all; };
  for (const relation of world.relationships) {
    if (relation.from === relation.to || !world.people[relation.from] || !world.people[relation.to] || relationshipIds.has(relation.id)) throw new Error('Invalid relationship reference');
    relationshipIds.add(relation.id);
    const pair = [relation.from, relation.to].sort().join(':');
    if (relationPairs.has(pair) || new Set(relation.roles).size !== relation.roles.length || !relation.roles.includes(relation.kind) || compareDates(relation.since, world.date) > 0 || compareDates(relation.since, world.people[relation.from].born) < 0 || compareDates(relation.since, world.people[relation.to].born) < 0) throw new Error('Invalid relationship history');
    relationPairs.add(pair);
    if (relation.roles.includes('parent') && (!relation.parentType || (relation.parentType === 'biological' && ageOn({ ...world.people[relation.from], died: null }, world.people[relation.to].born) < 18))) throw new Error('Invalid parent record');
    if (relation.romance === 'teen-dating') {
      if (!activeTeenRelations.has(relation.id) || romanticPeople.has(relation.from) || romanticPeople.has(relation.to)) throw new Error('Invalid or overlapping recorded teenage relationship');
      romanticPeople.add(relation.from); romanticPeople.add(relation.to);
    }
    if (relation.romance === 'dating' || relation.romance === 'engaged' || relation.romance === 'married') {
      const from = world.people[relation.from], to = world.people[relation.to]; const first = ancestors(from.id), second = ancestors(to.id);
      if (from.died || to.died || ageOn(from, world.date) < 18 || ageOn(to, world.date) < 18 || romanticPeople.has(from.id) || romanticPeople.has(to.id) || relation.roles.includes('guardian') || [...first].some(id => second.has(id))) throw new Error('Invalid romantic relationship');
      romanticPeople.add(from.id); romanticPeople.add(to.id);
      if (relation.romance === 'married' && !world.marriages.some(marriage => !marriage.ended && (marriage.a === from.id && marriage.b === to.id || marriage.a === to.id && marriage.b === from.id))) throw new Error('Missing marriage record');
    }
  }
  const marriageIds = new Set<string>();
  for (const marriage of world.marriages) {
    if (marriageIds.has(marriage.id) || !world.people[marriage.a] || !world.people[marriage.b] || marriage.a === marriage.b || compareDates(marriage.started, world.date) > 0 || !!marriage.ended !== !!marriage.endReason || marriage.ledgerStart > world.ledger.length || (marriage.ended && (compareDates(marriage.ended, marriage.started) < 0 || compareDates(marriage.ended, world.date) > 0))) throw new Error('Invalid marriage history');
    if (!marriage.ended && !world.relationships.some(relation => relation.romance === 'married' && (relation.from === marriage.a && relation.to === marriage.b || relation.from === marriage.b && relation.to === marriage.a))) throw new Error('Invalid current marriage');
    marriageIds.add(marriage.id);
  }
  const pregnancyIds = new Set<string>(), pregnantPeople = new Set<string>();
  for (const pregnancy of world.pregnancies) {
    const carrier = world.people[pregnancy.carrierId], other = world.people[pregnancy.otherParentId];
    if (pregnancyIds.has(pregnancy.id) || !carrier || !other || carrier.id === other.id || compareDates(pregnancy.conceived, world.date) > 0 || compareDates(pregnancy.due, monthFrom(pregnancy.conceived, 9, pregnancy.conceived.day)) !== 0 || ageOn({ ...carrier, died: null }, pregnancy.conceived) < 18 || ageOn({ ...other, died: null }, pregnancy.conceived) < 18 || (!!pregnancy.ended !== (pregnancy.status !== 'pregnant')) || (pregnancy.ended && (compareDates(pregnancy.ended, pregnancy.conceived) < 0 || compareDates(pregnancy.ended, world.date) > 0))) throw new Error('Invalid pregnancy history');
    pregnancyIds.add(pregnancy.id);
    if (pregnancy.status === 'pregnant') { if (carrier.died || pregnantPeople.has(carrier.id) || pregnancy.childId) throw new Error('Invalid current pregnancy'); pregnantPeople.add(carrier.id); }
    if (pregnancy.status === 'born' && (!pregnancy.childId || !world.people[pregnancy.childId] || !world.relationships.some(item => item.roles.includes('parent') && item.from === carrier.id && item.to === pregnancy.childId) || !world.relationships.some(item => item.roles.includes('parent') && item.from === other.id && item.to === pregnancy.childId))) throw new Error('Invalid birth record');
    if (pregnancy.status !== 'born' && pregnancy.childId) throw new Error('Pregnancy has an unrelated child');
  }
  const custodyIds = new Set<string>(), currentCustody = new Set<string>();
  for (const custody of world.custody) {
    const child = world.people[custody.childId];
    if (custodyIds.has(custody.id) || !child || !world.people[custody.a] || !world.people[custody.b] || custody.a === custody.b || ![custody.a, custody.b].includes(custody.primaryId) || !world.relationships.some(item => item.roles.includes('parent') && item.from === custody.a && item.to === child.id) || !world.relationships.some(item => item.roles.includes('parent') && item.from === custody.b && item.to === child.id) || compareDates(custody.started, world.date) > 0 || (custody.ended && (compareDates(custody.ended, custody.started) < 0 || compareDates(custody.ended, world.date) > 0))) throw new Error('Invalid custody record');
    custodyIds.add(custody.id);
    if (!custody.ended) { if (currentCustody.has(child.id) || child.died || ageOn(child, world.date) >= 18 || world.people[custody.primaryId].died || child.householdId !== world.people[custody.primaryId].householdId) throw new Error('Invalid current custody'); currentCustody.add(child.id); }
  }
  for (const account of world.accounts) {
    const currencyKey = account.ownerId + ':' + account.currency;
    if (!world.people[account.ownerId] || account.cash < 0n || account.lockedCash > account.cash || accountIds.has(account.id) || accountCurrencies.has(currencyKey)) throw new Error('Invalid cash account');
    accountIds.add(account.id);
    accountCurrencies.add(currencyKey);
  }
  const liabilities = new Map(world.liabilities.map(liability => [liability.id, liability]));
  if (liabilities.size !== world.liabilities.length) throw new Error('Duplicate debt');
  const { cashChanges, debtChanges } = ledger, accounts = new Map(world.accounts.map(account => [account.id, account]));
  if (!ledger.consistent) throw new Error('Invalid ledger reference');
  for (const [id, reference] of ledger.accountReferences) {
    const account = accounts.get(id);
    if (!account || account.ownerId !== reference.ownerId || account.currency !== reference.currency) throw new Error('Invalid ledger reference');
  }
  for (const [id, currency] of ledger.debtCurrencies) if (liabilities.get(id)?.currency !== currency) throw new Error('Invalid ledger reference');
  for (const account of world.accounts) if (account.cash !== account.openingCash + (cashChanges.get(account.id) ?? 0n)) throw new Error('Cash does not reconcile with ledger');
  for (const liability of world.liabilities) if (!world.people[liability.ownerId] || !world.accounts.some(account => account.ownerId === liability.ownerId && account.currency === liability.currency) || liability.principal !== (debtChanges.get(liability.id) ?? 0n)) throw new Error('Debt does not reconcile with ledger');
  for (const debt of world.liabilities) if (debt.creditorId && (!world.people[debt.creditorId] || debt.creditorId === debt.ownerId || !world.accounts.some(account => account.ownerId === debt.creditorId && account.currency === debt.currency))) throw new Error('Invalid internal creditor');
  const assetIds = new Set<string>(); const homes = new Set<string>();
  for (const asset of world.assets) {
    const catalog = assetCatalog.find(item => item.id === asset.catalogId);
    if (assetIds.has(asset.id) || !catalog || catalog.kind !== asset.kind || (asset.ownerId && !world.people[asset.ownerId]) || compareDates(asset.acquired, world.date) > 0) throw new Error('Invalid physical asset');
    assetIds.add(asset.id);
    if (asset.ownerId && !world.accounts.some(account => account.ownerId === asset.ownerId && account.currency === asset.currency)) throw new Error('Missing asset currency account');
    if (asset.primaryHome && (!asset.ownerId || asset.kind !== 'property' || asset.rental !== 'none' || homes.has(asset.ownerId))) throw new Error('Invalid primary home');
    if (asset.primaryHome) homes.add(asset.ownerId!);
    if ((asset.kind !== 'property' && (asset.rental !== 'none' || asset.listing || asset.mortgageId)) || (asset.kind === 'possession' && asset.insured)) throw new Error('Invalid asset contract');
    if (!asset.ownerId && (asset.primaryHome || asset.rental !== 'none' || asset.listing || asset.mortgageId)) throw new Error('Sold asset retains an active contract');
    if (asset.mortgageId) {
      const loan = world.liabilities.find(item => item.id === asset.mortgageId);
      if (!loan || loan.ownerId !== asset.ownerId || loan.currency !== asset.currency || loan.assetId !== asset.id || loan.kind !== 'mortgage') throw new Error('Invalid mortgage link');
    }
  }
  for (const debt of world.liabilities) if (debt.kind === 'mortgage' && debt.principal > 0n && !world.assets.some(asset => asset.id === debt.assetId && asset.mortgageId === debt.id && asset.ownerId === debt.ownerId)) throw new Error('Mortgage has no collateral');
  const holdingIds = new Set<string>();
  for (const holding of world.holdings) {
    if (holdingIds.has(holding.id) || !world.people[holding.ownerId] || (holding.quantity === 0n && holding.costBasis !== 0n)) throw new Error('Invalid investment holding');
    holdingIds.add(holding.id);
  }
  if (!world.accounts.some(account => account.ownerId === world.activePersonId)) throw new Error('Missing player account');
  for (const entry of world.journal) {
    if (!world.people[entry.personId] || compareDates(entry.date, world.date) > 0 || compareDates(entry.date, world.people[entry.personId].born) < 0 || journalIds.has(entry.id)) throw new Error('Invalid journal fact');
    journalIds.add(entry.id);
  }
  validateAnnualPacing(world);
  if (world.annual && (compareDates(world.date, world.annual.startDate) < 0 || compareDates(world.date, world.annual.targetDate) > 0 || world.annual.targetDate.year !== world.annual.startDate.year + 1)) throw new Error('Invalid annual frame');
  if (world.annual && (compareDates(world.date, monthFrom(world.annual.startDate, world.annual.monthsProcessed, world.calendarAnchorDay)) !== 0 || compareDates(world.annual.targetDate, monthFrom(world.annual.startDate, 12, world.calendarAnchorDay)) !== 0)) throw new Error('Annual cursor does not match calendar');
  if (world.annual?.stage === 'complete' && world.annual.monthsProcessed !== 12) throw new Error('Incomplete year marked complete');
  if (world.annual?.pausedForPlanning && world.annual.stage !== 'months') throw new Error('Invalid planning pause');
  if (world.legacyAnnual && (!world.people[world.activePersonId].died || compareDates(world.date, monthFrom(world.legacyAnnual.startDate, world.legacyAnnual.monthsProcessed, world.calendarAnchorDay)) !== 0 || compareDates(world.legacyAnnual.targetDate, monthFrom(world.legacyAnnual.startDate, 12, world.calendarAnchorDay)) !== 0)) throw new Error('Invalid archived annual frame');
  const willPeople = new Set<string>();
  for (const will of world.wills) {
    if (willPeople.has(will.personId) || !world.people[will.personId] || !world.people[will.executorId] || will.personId === will.executorId || compareDates(will.updated, world.date) > 0 || will.shares.reduce((sum, item) => sum + item.bps, 0) !== 10000 || new Set(will.shares.map(item => item.personId)).size !== will.shares.length || will.shares.some(item => !world.people[item.personId] || item.personId === will.personId) || new Set(will.bequests.map(item => item.assetId)).size !== will.bequests.length || will.bequests.some(item => !(world.assets.some(asset => asset.id === item.assetId) || world.businesses.some(company => company.id === item.assetId)) || !will.shares.some(share => share.personId === item.personId))) throw new Error('Invalid will');
    willPeople.add(will.personId);
  }
  const settledPeople = new Set<string>(), estateIds = new Set<string>();
  for (const estate of world.estates) {
    const person = world.people[estate.personId], currency = estate.netWorthAtDeath.currency;
    if (settledPeople.has(estate.personId) || estateIds.has(estate.id) || !person?.died || compareDates(estate.settled, person.died) < 0 || compareDates(estate.settled, world.date) > 0 || (estate.executorId && !world.people[estate.executorId]) || [estate.fees, estate.tax, estate.debtPaid, estate.debtWrittenOff, estate.charity].some(money => money.minor < 0n || money.currency !== currency) || new Set(estate.distributions.map(item => item.personId)).size !== estate.distributions.length || estate.distributions.some(item => !world.people[item.personId] || item.personId === person.id || item.cash.minor < 0n || item.assetValue.minor < 0n || item.cash.currency !== currency || item.assetValue.currency !== currency || item.assets.some(id => !world.assets.some(asset => asset.id === id) && !world.businesses.some(company => company.id === id)))) throw new Error('Invalid estate history');
    if (world.businesses.some(item => item.ownerId === person.id) || world.businessPayables.some(item => item.creditorId === person.id && item.principal > 0n) || world.accounts.some(item => item.ownerId === person.id && item.cash !== 0n) || world.assets.some(item => item.ownerId === person.id) || world.holdings.some(item => item.ownerId === person.id && item.quantity > 0n) || world.liabilities.some(item => item.ownerId === person.id && item.principal > 0n || item.creditorId === person.id && item.principal > 0n)) throw new Error('Settled estate retains property or obligations');
    settledPeople.add(estate.personId); estateIds.add(estate.id);
  }
  if (world.generation !== world.legacies.length + 1) throw new Error('Invalid generation count');
  for (let index = 0; index < world.legacies.length; index++) {
    const legacy = world.legacies[index];
    if (!world.people[legacy.fromId]?.died || !world.people[legacy.toId] || !world.relationships.some(item => item.roles.includes('parent') && item.from === legacy.fromId && item.to === legacy.toId) || compareDates(legacy.date, world.date) > 0 || (index && (world.legacies[index - 1].toId !== legacy.fromId || compareDates(world.legacies[index - 1].date, legacy.date) > 0))) throw new Error('Invalid legacy chain');
  }
  if (world.legacies.length && world.legacies.at(-1)!.toId !== world.activePersonId) throw new Error('Legacy actor differs from its recorded identity');
  validateLegal(world);
  validateSocial(world);
  validateBusinesses(world);
  validateEarnings(world, ledger);
  validateHourlyWork(world, ledger);
  validateNpcCourtships(world, ledger);
  validateNpcSeparations(world);
  validateNpcMoves(world, ledger);
  validateBestFriendships(world);
  validateTravel(world, ledger);
  validateSchools(world);
  validateWorkplaces(world);
  validateEducationRecovery(world);
  validateScholarships(world);
  validateUniversityAdmissions(world, ledger);
  validateStudyCourses(world, ledger);
  validatePets(world, ledger);
  validateLeisure(world, ledger);
  validateHobbyEvents(world, ledger);
  validateStoryThreads(world, ledger);
  validateRelocations(world, ledger);
  validateCareers(world);
  validateMusic(world, ledger);
  validatePolitics(world, ledger);
  validateCreators(world, ledger);
  validateServices(world);
  validateRoyalty(world, ledger);
  const pendingEvents = [...(world.pending ? [world.pending] : []), ...world.deferred.map(item => item.event)];
  if ((!world.pending && (world.pendingPriority || world.deferred.length)) || world.people[world.activePersonId].died && pendingEvents.length || new Set(pendingEvents.map(item => item.id)).size !== pendingEvents.length || world.deferred.some((item, index) => index > 0 && world.deferred[index - 1].priority < item.priority)) throw new Error('Invalid pending event queue');
  for (const pending of pendingEvents) if (pending.kind === 'decision') {
    validateJobInterview(world, pending);
    if (pending.personIds.some(id => !world.people[id] || world.people[id].died)) throw new Error('Invalid bound event person');
    if (new Set(pending.choices.map(choice => choice.id)).size !== pending.choices.length) throw new Error('Duplicate decision choices');
    for (const choice of pending.choices) for (const effect of choice.effects) {
      if (effect.kind === 'school-grade' && (!pending.personIds.includes(effect.personId) || !world.schoolCommunities.some(item => item.id === effect.communityId && item.personId === effect.personId && !item.ended))) throw new Error('Invalid bound school grade');
      if (effect.kind === 'skill' && (!world.people[effect.personId] || !pending.personIds.includes(effect.personId))) throw new Error('Invalid bound skill target');
      if (effect.kind === 'stat' && !world.people[effect.personId]) throw new Error('Invalid effect person');
      if (effect.kind === 'relationship' && !world.relationships.some(relation => relation.id === effect.relationshipId)) throw new Error('Invalid effect relationship');
      if (effect.kind === 'pet-bond' && (effect.personId !== world.activePersonId || !pending.personIds.includes(effect.personId) || !world.pets.some(pet => pet.id === effect.petId && pet.status === 'active'))) throw new Error('Invalid bound pet bond');
      if (effect.kind === 'connect-person' && (!world.people[effect.personId] || world.people[effect.personId].died || effect.personId === world.activePersonId || !pending.personIds.includes(effect.personId))) throw new Error('Invalid introduction target');
      if (effect.kind === 'emergency-care' && (effect.personId !== world.activePersonId || !pending.personIds.includes(effect.personId) || !world.people[effect.personId].health.conditions.some(item => item.id === effect.conditionId && item.status !== 'recovered'))) throw new Error('Invalid medical emergency target');
      if (effect.kind === 'legal-bail' || effect.kind === 'legal-remand' || effect.kind === 'legal-plea') {
        const item = world.cases.find(candidate => candidate.id === effect.caseId && candidate.personId === world.activePersonId && candidate.status === 'awaiting-trial');
        if (!item || !pending.personIds.includes(item.personId)) throw new Error('Invalid bound court action');
      }
      if (effect.kind === 'brand-decision' && !world.sponsorships.some(item => item.id === effect.sponsorId && item.ownerId === world.activePersonId && item.status === 'offered')) throw new Error('Invalid bound brand offer');
      if (effect.kind === 'public-response' && !world.controversies.some(item => item.id === effect.controversyId && item.personId === world.activePersonId && !item.resolved)) throw new Error('Invalid bound public response');
      if (effect.kind === 'transfer') {
        const from = world.accounts.find(account => account.id === effect.fromAccountId);
        const to = world.accounts.find(account => account.id === effect.toAccountId);
        if (!from || !to || from.id === to.id || from.currency !== to.currency) throw new Error('Invalid effect transfer');
      }
      if (effect.kind === 'asset-sale' || effect.kind === 'decline-sale') {
        const asset = world.assets.find(item => item.id === effect.assetId && item.ownerId === world.activePersonId);
        if (!asset?.listing?.offer || (effect.kind === 'asset-sale' && effect.minor !== asset.listing.offer)) throw new Error('Invalid property offer');
      }
    }
  }
  if (immutable) {
    for (const row of world.ledger) if (!immutableTransactions.has(row)) immutableTransactions.add(Object.freeze(row));
    freezeTree(world);
    rememberLedgerIndex(world.ledger, ledger);
    immutableWorlds.add(world);
  }
  return world;
}

function freezeTree(value: unknown): void {
  if (!value || typeof value !== 'object' || immutableTransactions.has(value) || Object.isFrozen(value)) return;
  for (const child of Object.values(value)) freezeTree(child);
  Object.freeze(value);
}
/** The caller must already have certified this plain-data tree. */
function copyCertifiedTree(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(copyCertifiedTree);
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const child = copyCertifiedTree((value as Record<string, unknown>)[key]);
    if (key === '__proto__') Object.defineProperty(copy, key, { value: child, enumerable: true, writable: true, configurable: true });
    else copy[key] = child;
  }
  return copy;
}
/** Mutable working copy; certified immutable inputs need no repeated integrity audit. */
export function copyWorld(world: World): World {
  if (!immutableWorlds.has(world)) return validateWorld(world);
  // Every field has already passed schema/integrity checks. Clone mutable data
  // directly instead of running the schema parser a second time before acting.
  // The command's result still receives full shape and integrity validation.
  const copy = copyCertifiedTree({ ...world, ledger: [] }) as World;
  copy.ledger = [...world.ledger];
  return copy;
}
/** Storage and the UI share only fully validated, recursively frozen worlds. */
export function immutableWorld(world: World): World {
  return immutableWorlds.has(world) ? world : validateWorld(world, true);
}
export function worldForEncoding(world: World): World {
  return immutableWorlds.has(world) ? world : validateWorld(world);
}
export const moneyJSON = (_key: string, value: unknown) => typeof value === 'bigint' ? { $dreamsBigInt: value.toString() } : value;
export function encodeWorld(world: World): string {
  return JSON.stringify(worldForEncoding(world), moneyJSON);
}
// JSON.parse's reviver calls back for every primitive field. Visit containers
// directly instead, retaining exactly the original bounded bigint marker rules.
function restoreMoney(value: any): any {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) if (value[index] && typeof value[index] === 'object') value[index] = restoreMoney(value[index]);
    return value;
  }
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === '$dreamsBigInt') {
    const amount: unknown = value.$dreamsBigInt;
    if (typeof amount !== 'string' || !/^-?\d{1,128}$/.test(amount)) throw new Error('Invalid money encoding');
    return BigInt(amount);
  }
  for (const key of keys) if (value[key] && typeof value[key] === 'object') value[key] = restoreMoney(value[key]);
  return value;
}
export function decodeWorld(text: string, immutable = false, maxCharacters: 20_000_000 | 80_000_000 = 20_000_000): World {
  if (text.length > maxCharacters) throw new Error('Save is too large');
  const parsed = restoreMoney(JSON.parse(text));
  // Version 1 shipped creation only. Preserve every identity, journal fact and RNG stream.
  if (parsed && parsed.schemaVersion === 1) {
    parsed.schemaVersion = 2;
    parsed.calendarAnchorDay = parsed.date?.day;
    parsed.annual = null; parsed.pending = null; parsed.eventHistory = [];
  }
  if (parsed && parsed.schemaVersion === 2) {
    parsed.schemaVersion = 3;
    parsed.engineVersion = 2;
    for (const person of Object.values(parsed.people ?? {}) as Record<string, unknown>[]) {
      person.education = newEducation(); person.employment = null; person.finance = newFinance(countries[person.country as keyof typeof countries].currency);
    }
    for (const account of parsed.accounts ?? []) account.openingCash = account.cash;
    parsed.liabilities = []; parsed.ledger = [];
    parsed.workHistory = [];
    parsed.actionCounts = {};
  }
  if (parsed && parsed.schemaVersion === 3) {
    parsed.schemaVersion = 4; parsed.engineVersion = 3;
    parsed.assets = []; parsed.holdings = []; parsed.market = initialMarket(parsed.date);
    if (parsed.annual) parsed.annual.stage = parsed.annual.monthsProcessed === 12 && parsed.pending ? 'complete' : 'months';
  }
  if (parsed && parsed.schemaVersion === 4) {
    parsed.schemaVersion = 5; parsed.engineVersion = 4;
    const legacy = parsed as World;
    parsed.households = []; parsed.marriages = [];
    for (const person of Object.values(legacy.people)) {
      Object.assign(person, newFamilyPerson(person.gender));
      person.lastEconomicMonth = legacy.date.year * 12 + legacy.date.month - 1;
      person.householdId = 'household_' + person.id;
      parsed.households.push({ id: person.householdId, name: person.firstName + '’s household', members: [person.id], homeAssetId: legacy.assets.find(asset => asset.ownerId === person.id && asset.primaryHome)?.id ?? null });
    }
    for (const relation of legacy.relationships) {
      Object.assign(relation, { roles: [relation.kind], romance: relation.kind === 'spouse' ? 'married' : relation.kind === 'partner' ? 'dating' : 'none', since: relation.kind === 'parent' ? legacy.people[relation.to]?.born : legacy.date, parentType: relation.kind === 'parent' ? 'biological' : null, lastInteractionYear: legacy.date.year });
      if (relation.romance === 'married') parsed.marriages.push({ id: 'marriage_' + relation.id, a: relation.from, b: relation.to, started: legacy.date, ended: null, endReason: null, baselineA: netWorth(legacy, relation.from), baselineB: netWorth(legacy, relation.to), ledgerStart: legacy.ledger.length, weddingCost: null });
    }
    parsed.actionCounts = Object.fromEntries(Object.entries(legacy.actionCounts).map(([key, count]) => [key.startsWith('person_') ? key : legacy.activePersonId + ':' + key, count]));
  }
  if (parsed && parsed.schemaVersion === 5) {
    parsed.schemaVersion = 6; parsed.engineVersion = 5; parsed.pregnancies = []; parsed.custody = [];
  }
  if (parsed && parsed.schemaVersion === 6) {
    parsed.schemaVersion = 7; parsed.engineVersion = 6; parsed.wills = []; parsed.estates = []; parsed.legacyAnnual = null; parsed.generation = 1; parsed.legacies = [];
    for (const asset of parsed.assets ?? []) { asset.ownershipSource = 'legacy'; asset.titleSince = asset.acquired; }
  }
  if (parsed && parsed.schemaVersion === 7) {
    parsed.schemaVersion = 8; parsed.engineVersion = 7;
    for (const person of Object.values(parsed.people ?? {}) as Record<string, unknown>[]) person.health = newHealth(parsed.date.year * 12 + parsed.date.month - 1);
  }
  if (parsed && parsed.schemaVersion === 8) {
    parsed.schemaVersion = 9; parsed.engineVersion = 8; parsed.pendingPriority = parsed.pending ? priorityOf(parsed.pending) : 0; parsed.deferred = []; parsed.incidents = []; parsed.cases = []; parsed.sentences = []; parsed.remand = []; parsed.contraband = []; parsed.gangs = [];
    for (const person of Object.values(parsed.people ?? {}) as Record<string, unknown>[]) person.legal = newLegal();
  }
  if (parsed && parsed.schemaVersion === 9) {
    parsed.schemaVersion = 10; parsed.engineVersion = 9; parsed.socialAccounts = []; parsed.sponsorships = []; parsed.controversies = []; parsed.collaborations = []; parsed.socialFollows = [];
    for (const person of Object.values(parsed.people) as Record<string, unknown>[]) { person.publicLife = newPublicLife(parsed.date.year * 12 + parsed.date.month - 1, (person.stats as { fame: number }).fame); (person.finance as Record<string, unknown>).supportIncomeDue = 0n; }
  }
  if (parsed && parsed.schemaVersion === 10) { parsed.schemaVersion = 11; parsed.engineVersion = 10; parsed.businesses = []; parsed.businessLedger = []; parsed.businessPayables = []; }
  if (parsed && parsed.schemaVersion === 11) { parsed.schemaVersion = 12; parsed.engineVersion = 11; parsed.careers = []; for (const person of Object.values(parsed.people) as Record<string, unknown>[]) { person.skills = newSkills(); person.training = null; } }
  if (parsed && parsed.schemaVersion === 12) { parsed.schemaVersion = 13; parsed.engineVersion = 12; parsed.musicReleases = []; }
  if (parsed && parsed.schemaVersion === 13) { parsed.schemaVersion = 14; parsed.engineVersion = 13; parsed.elections = []; }
  if (parsed && parsed.schemaVersion === 14) { parsed.schemaVersion=15;parsed.engineVersion=14;parsed.creatorStudios=[];parsed.creatorInvoices=[]; }
  if(parsed&&parsed.schemaVersion===15){parsed.schemaVersion=16;parsed.engineVersion=15;parsed.serviceCareers=[];}
  if(parsed&&parsed.schemaVersion===16){parsed.schemaVersion=17;parsed.engineVersion=16;parsed.royalHouses=[];}
  if (parsed && parsed.schemaVersion === 17) {
    parsed.schemaVersion = 18; parsed.engineVersion = 17;
    for (const person of Object.values(parsed.people) as Person[]) {
      const currency = countries[person.country].currency;
      Object.assign(person.finance, { earningsCurrency: currency, pensionRecordedFrom: person.finance.pensionMonths, pensionReceipts: [] });
      if (person.employment) person.employment.currency = currency;
    }
    for (const record of parsed.workHistory) Object.assign(record, { currency: countries[parsed.people[record.personId].country as keyof typeof countries].currency, normalizedGross: record.grossEarned, conversions: [] });
    for (const career of parsed.careers) for (const project of career.projects) project.currency = career.currency;
    for (const career of parsed.serviceCareers) for (const contract of career.contracts) contract.currency = career.currency;
  }
  if (parsed && parsed.schemaVersion === 18) { parsed.schemaVersion = 19; parsed.engineVersion = 18; parsed.trips = []; }
  if (parsed && parsed.schemaVersion === 19) { parsed.schemaVersion = 20; parsed.engineVersion = 19; parsed.relocations = []; }
  if (parsed && parsed.schemaVersion === 20) { parsed.schemaVersion = 21; parsed.engineVersion = 20; parsed.schoolCommunities = []; }
  if (parsed && parsed.schemaVersion === 21) { parsed.schemaVersion = 22; parsed.engineVersion = 21; }
  if (parsed && parsed.schemaVersion === 22) { parsed.schemaVersion = 23; parsed.engineVersion = 22; parsed.contentVersion = 2; parsed.storyThreads = []; }
  // Existing bound choices and callbacks retain their exact effects and saved draws.
  if (parsed && parsed.schemaVersion === 23 && parsed.contentVersion === 2) parsed.contentVersion = 3;
  // Keep earlier qualifications/outcomes; new assessments and attendance start empty.
  if (parsed && parsed.schemaVersion === 23) { parsed.schemaVersion = 24; parsed.engineVersion = 23; parsed.schoolCompletions = []; parsed.recoveryCourses = []; }
  // Preserve old tuition, debt and completed work. Aid is never retroactive.
  if (parsed && parsed.schemaVersion === 24) { parsed.schemaVersion = 25; parsed.engineVersion = 24; parsed.scholarships = []; }
  // New story selection leaves every already-bound choice/result untouched.
  if (parsed && parsed.schemaVersion === 25 && parsed.contentVersion === 3) parsed.contentVersion = 4;
  // Pet history begins now; old lives gain no animals, care charges or draws.
  if (parsed && parsed.schemaVersion === 25) { parsed.schemaVersion = 26; parsed.engineVersion = 25; parsed.pets = []; parsed.petAdoptions = []; }
  // Personal leisure starts now; existing pets, qualifications and payments remain exact.
  if (parsed && parsed.schemaVersion === 26) { parsed.schemaVersion = 27; parsed.engineVersion = 26; parsed.hobbies = []; parsed.leisureOutings = []; }
  // Additional optional hobby kinds do not create plans, practice, costs or draws in old lives.
  if (parsed && parsed.schemaVersion === 27) { parsed.schemaVersion = 28; parsed.engineVersion = 27; }
  // New teen situations affect future selection, never saved choices, effects or RNG.
  if (parsed && parsed.schemaVersion === 28 && parsed.contentVersion === 4) parsed.contentVersion = 5;
  // Old employment, people, earnings and RNG remain exact; introductions are explicit.
  if (parsed && parsed.schemaVersion === 28) { parsed.schemaVersion = 29; parsed.engineVersion = 28; parsed.workplaces = []; }
  // Negotiations start now; do not change old colleagues, pay, feedback or draws.
  if (parsed && parsed.schemaVersion === 29) { parsed.schemaVersion = 30; parsed.engineVersion = 29; parsed.workRaises = []; }
  // Workplace stories change future selection only, preserving every bound event.
  if (parsed && parsed.schemaVersion === 30 && parsed.contentVersion === 5) parsed.contentVersion = 6;
  if (parsed && parsed.schemaVersion === 30 && parsed.contentVersion === 6) parsed.contentVersion = 7;
  // Interviews are created only by new applications; existing bound scenes stay exact.
  if (parsed && parsed.schemaVersion === 30 && parsed.engineVersion === 29) parsed.engineVersion = 30;
  // New life-context stories affect future selection only, never bound old scenes.
  if (parsed && parsed.schemaVersion === 30 && parsed.engineVersion === 30) parsed.engineVersion = 31;
  if (parsed && parsed.schemaVersion === 30 && parsed.contentVersion === 7) parsed.contentVersion = 8;
  // Community events start empty; old practice, payments, bound scenes and RNG stay exact.
  if (parsed && parsed.schemaVersion === 30 && parsed.engineVersion === 31) { parsed.schemaVersion = 31; parsed.engineVersion = 32; parsed.hobbyEvents = []; }
  // Existing annual contracts and bound interviews retain exact terms and history.
  if (parsed && parsed.schemaVersion === 31 && parsed.engineVersion === 32) { parsed.schemaVersion = 32; parsed.engineVersion = 33; parsed.hourlyContracts = []; }
  // Editorial/locality changes affect future selection only; already bound scenes remain exact.
  if (parsed && parsed.schemaVersion === 32 && parsed.engineVersion === 33 && parsed.contentVersion === 8) parsed.contentVersion = 9;
  // Autonomous courtship clocks begin now; old pay, people, bound scenes and history remain exact.
  if (parsed && parsed.schemaVersion === 32 && parsed.engineVersion === 33) { parsed.schemaVersion = 33; parsed.engineVersion = 34; parsed.npcCourtships = []; }
  // Local hobby introductions and education eligibility reuse existing records.
  // Preserve all prior bound outcomes and histories; withdrawal is always explicit.
  if (parsed && parsed.schemaVersion === 33 && parsed.engineVersion === 34) { parsed.schemaVersion = 34; parsed.engineVersion = 35; parsed.schoolWithdrawals = []; }
  // New social incident wording changes no existing bound decision or result.
  if (parsed && parsed.schemaVersion === 34 && parsed.engineVersion === 35 && parsed.contentVersion === 9) parsed.contentVersion = 10;
  // Best-friend agreements begin only through a new explicit consent command.
  // Old people, bound scenes, memories, money and RNG retain their exact values.
  if (parsed && parsed.schemaVersion === 34 && parsed.engineVersion === 35) { parsed.schemaVersion = 35; parsed.engineVersion = 36; parsed.bestFriendships = []; }
  // New health/context display copy affects future prompts only; stored text stays exact.
  if (parsed && parsed.schemaVersion === 35 && parsed.engineVersion === 36 && parsed.contentVersion === 10) parsed.contentVersion = 11;
  // New consent, study observations and NPC separation records begin only through
  // actual future commands. Preserve every existing friendship, bound scene,
  // person, payment, historical fact and RNG value.
  if (parsed && parsed.schemaVersion === 35 && parsed.engineVersion === 36) {
    parsed.schemaVersion = 36; parsed.engineVersion = 37;
    parsed.teenRelationships = []; parsed.universityApplications = [];
    parsed.studyCourses = []; parsed.npcSeparations = [];
  }
  // Weighted/new situations affect future selection only, never stored choices.
  if (parsed && parsed.schemaVersion === 36 && parsed.engineVersion === 37 && parsed.contentVersion === 11) parsed.contentVersion = 12;
  // Independent retirement moves begin only with a future annual decision.
  // Preserve all existing teen/admission/study/separation and friendship facts.
  if (parsed && parsed.schemaVersion === 36 && parsed.engineVersion === 37) {
    parsed.schemaVersion = 37; parsed.engineVersion = 38; parsed.npcMoves = [];
  }
  // New situational writing affects future selection only; old bound copy and
  // choices retain their exact values. No old frame or interview is backfilled.
  if (parsed && parsed.schemaVersion === 37 && parsed.engineVersion === 38 && parsed.contentVersion === 12) parsed.contentVersion = 13;
  // Paid interview evidence and optional annual pacing are prospective fields.
  // Preserve all five existing histories, friendships, people, money and RNG.
  if (parsed && parsed.schemaVersion === 37 && parsed.engineVersion === 38) {
    parsed.schemaVersion = 38; parsed.engineVersion = 39;
  }
  // Topic-aware conversations affect only new explicit commands. Bound scenes,
  // results, original talk commands and all existing facts remain unchanged.
  if (parsed && parsed.schemaVersion === 38 && parsed.engineVersion === 39 && parsed.contentVersion === 13) parsed.contentVersion = 14;
  if (parsed && parsed.schemaVersion === 38 && parsed.engineVersion === 39) {
    parsed.schemaVersion = 39; parsed.engineVersion = 40;
  }
  // Legal situations use existing facts and effects for future selection only.
  // Preserve every already bound scene, legal record and random stream.
  if (parsed && parsed.schemaVersion === 39 && parsed.engineVersion === 40 && parsed.contentVersion === 14) parsed.contentVersion = 15;
  // Later-life family situations add future writing only. Keep every saved
  // binding, choice, journal, person, payment and random stream unchanged.
  if (parsed && parsed.schemaVersion === 39 && parsed.engineVersion === 40 && parsed.contentVersion === 15) parsed.contentVersion = 16;
  // Recorded-course and later-life scenes affect future selection only; bound
  // choices and all existing people, payments, history and RNG remain literal.
  if (parsed && parsed.schemaVersion === 39 && parsed.engineVersion === 40 && parsed.contentVersion === 16) parsed.contentVersion = 17;
  return validateWorld(parsed, immutable);
}
