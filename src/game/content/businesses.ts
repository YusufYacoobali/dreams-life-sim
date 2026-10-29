export const businessKinds = ['cafe', 'retail', 'delivery', 'software', 'manufacturing', 'fashion', 'entertainment', 'real-estate', 'online'] as const;
export type BusinessKind = typeof businessKinds[number];
export type BusinessDefinition = { title: string; description: string; art: 'cafe' | 'shop' | 'delivery' | 'software' | 'factory' | 'camera' | 'business'; capitalBps: number; workerRole: string; revenueBps: number; variableCostBps: number; fixedCostBps: number; equipmentBps: number; smarts: number; ownerQualification?: { level: 'degree' | 'trade'; field: string } };
/** Authored small-firm economics, scaled from local base pay. Not national business/tax law. */
export const businessCatalog: Record<BusinessKind, BusinessDefinition> = {
  cafe: { title: 'Coffee Shop', description: 'A local café with repeat customers and a small team.', art: 'cafe', capitalBps: 5000, workerRole: 'barista', revenueBps: 30000, variableCostBps: 4500, fixedCostBps: 2400, equipmentBps: 6000, smarts: 20 },
  retail: { title: 'Retail Shop', description: 'A neighbourhood shop balancing prices, stock and service.', art: 'shop', capitalBps: 6000, workerRole: 'retail', revenueBps: 32000, variableCostBps: 5000, fixedCostBps: 2400, equipmentBps: 6000, smarts: 20 },
  delivery: { title: 'Delivery Service', description: 'A small logistics operation with fleet and staffing costs.', art: 'delivery', capitalBps: 9000, workerRole: 'warehouse', revenueBps: 33000, variableCostBps: 4000, fixedCostBps: 3000, equipmentBps: 7000, smarts: 25 },
  software: { title: 'Software Studio', description: 'A skilled team making and supporting digital products.', art: 'software', capitalBps: 15000, workerRole: 'developer', revenueBps: 50000, variableCostBps: 1500, fixedCostBps: 3600, equipmentBps: 4000, smarts: 45, ownerQualification: { level: 'degree', field: 'computing' } },
  manufacturing: { title: 'Small Manufacturer', description: 'Production, materials and skilled workers at a local facility.', art: 'factory', capitalBps: 20000, workerRole: 'technician', revenueBps: 43000, variableCostBps: 4500, fixedCostBps: 4800, equipmentBps: 7000, smarts: 40, ownerQualification: { level: 'trade', field: 'science' } },
  fashion: { title: 'Fashion Brand', description: 'An arts-trained design team creates collections, with clothing supplies and retail costs.', art: 'shop', capitalBps: 10000, workerRole: 'designer', revenueBps: 42000, variableCostBps: 5200, fixedCostBps: 3200, equipmentBps: 5500, smarts: 45, ownerQualification: { level: 'degree', field: 'arts' } },
  entertainment: { title: 'Entertainment Studio', description: 'A creative production team balances project income, production materials and studio overhead.', art: 'camera', capitalBps: 14000, workerRole: 'designer', revenueBps: 45000, variableCostBps: 3500, fixedCostBps: 4200, equipmentBps: 6000, smarts: 45, ownerQualification: { level: 'degree', field: 'arts' } },
  'real-estate': { title: 'Real Estate Agency', description: 'A local team provides property listings and agency services.', art: 'business', capitalBps: 12000, workerRole: 'administrator', revenueBps: 22000, variableCostBps: 1200, fixedCostBps: 3000, equipmentBps: 3500, smarts: 35 },
  online: { title: 'Online Shop', description: 'An order-fulfilment team serves online customers, with substantial stock costs and lower premises overhead.', art: 'software', capitalBps: 7000, workerRole: 'warehouse', revenueBps: 36000, variableCostBps: 5800, fixedCostBps: 1400, equipmentBps: 3500, smarts: 25 },
};

export const businessOfferingIds = ['standard', 'value', 'specialist'] as const;
export type BusinessOfferingId = typeof businessOfferingIds[number];
export const businessLogoIds = ['business', 'cafe', 'shop', 'delivery', 'software', 'factory'] as const;
export type BusinessLogoId = typeof businessLogoIds[number];
export const businessLogoLabels: Record<BusinessLogoId, string> = { business: 'Company', cafe: 'Coffee Cup', shop: 'Shop', delivery: 'Delivery Van', software: 'Computer', factory: 'Factory' };
type Offering = { title: string; description: string; demandBps: number; revenueBps: number; suppliesBps: number };
const standard = (title: string, description: string): Offering => ({ title, description, demandBps: 10000, revenueBps: 10000, suppliesBps: 10000 });
/** Focus affects future orders, within the same real staffing and capacity limits. */
export const businessOfferings: Record<BusinessKind, Record<BusinessOfferingId, Offering>> = {
  cafe: {
    standard: standard('Everyday Menu', 'A balanced range of drinks and café food.'),
    value: { title: 'Quick-Service Menu', description: 'Simple drinks and snacks for more price-conscious customers.', demandBps: 11500, revenueBps: 9000, suppliesBps: 9000 },
    specialist: { title: 'Specialty Menu', description: 'More elaborate orders with higher ingredient costs and a smaller audience.', demandBps: 8500, revenueBps: 12500, suppliesBps: 13000 },
  },
  retail: {
    standard: standard('Neighbourhood Range', 'A balanced selection for everyday local shopping.'),
    value: { title: 'Everyday Essentials', description: 'Lower-priced stock with broader demand and simpler sourcing.', demandBps: 12000, revenueBps: 9000, suppliesBps: 9500 },
    specialist: { title: 'Curated Range', description: 'Higher-priced specialist stock for a smaller customer base.', demandBps: 8500, revenueBps: 13000, suppliesBps: 12500 },
  },
  delivery: {
    standard: standard('Local Deliveries', 'A balanced mix of local delivery orders.'),
    value: { title: 'Scheduled Rounds', description: 'Lower-priced scheduled orders with more demand and lower running costs per order.', demandBps: 11500, revenueBps: 9000, suppliesBps: 9000 },
    specialist: { title: 'Express Deliveries', description: 'Higher-priced priority orders with higher running costs and fewer customers.', demandBps: 8500, revenueBps: 13500, suppliesBps: 13000 },
  },
  software: {
    standard: standard('Software Projects', 'A balanced mix of development and support work.'),
    value: { title: 'Support Packages', description: 'Lower-priced support packages for a broader client base.', demandBps: 11500, revenueBps: 9000, suppliesBps: 9000 },
    specialist: { title: 'Bespoke Builds', description: 'Higher-value custom projects with greater delivery costs and fewer clients.', demandBps: 8000, revenueBps: 14500, suppliesBps: 14500 },
  },
  manufacturing: {
    standard: standard('Standard Production', 'A balanced range of manufactured orders.'),
    value: { title: 'Batch Production', description: 'Lower-priced standard batches with broader demand and simpler materials.', demandBps: 12000, revenueBps: 8500, suppliesBps: 9000 },
    specialist: { title: 'Custom Production', description: 'Higher-priced custom orders with more expensive materials and fewer buyers.', demandBps: 8000, revenueBps: 14000, suppliesBps: 14500 },
  },
  fashion: {
    standard: standard('Seasonal Collection', 'A balanced clothing collection from your design team.'),
    value: { title: 'Everyday Collection', description: 'Accessible designs with broader demand and simpler materials.', demandBps: 12000, revenueBps: 9000, suppliesBps: 9000 },
    specialist: { title: 'Limited Collection', description: 'Higher-priced designs with costly materials and a smaller audience.', demandBps: 8000, revenueBps: 14000, suppliesBps: 15000 },
  },
  entertainment: {
    standard: standard('Studio Productions', 'A balanced mix of creative production work.'),
    value: { title: 'Short Productions', description: 'Smaller, lower-priced projects with broader demand and simpler production.', demandBps: 11500, revenueBps: 9000, suppliesBps: 9000 },
    specialist: { title: 'Feature Productions', description: 'Higher-priced productions with higher delivery costs and fewer clients.', demandBps: 8000, revenueBps: 14500, suppliesBps: 15500 },
  },
  'real-estate': {
    standard: standard('Property Services', 'A balanced range of property-agency services.'),
    value: { title: 'Residential Listings', description: 'Lower-priced listing services for a broader residential client base.', demandBps: 12000, revenueBps: 8500, suppliesBps: 9000 },
    specialist: { title: 'Commercial Services', description: 'Higher-priced agency work with greater service costs and fewer clients.', demandBps: 8000, revenueBps: 14000, suppliesBps: 13500 },
  },
  online: {
    standard: standard('Online Range', 'A balanced range of goods fulfilled by your team.'),
    value: { title: 'Everyday Online Goods', description: 'Lower-priced essentials with broader demand and simpler stock.', demandBps: 12000, revenueBps: 8500, suppliesBps: 9000 },
    specialist: { title: 'Curated Online Goods', description: 'Higher-priced specialist orders with costlier stock and a smaller audience.', demandBps: 8500, revenueBps: 13000, suppliesBps: 14000 },
  },
};
