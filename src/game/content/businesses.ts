export const businessKinds = ['cafe', 'retail', 'delivery', 'software', 'manufacturing'] as const;
export type BusinessKind = typeof businessKinds[number];
export type BusinessDefinition = { title: string; description: string; art: 'cafe' | 'shop' | 'delivery' | 'software' | 'factory'; capitalBps: number; workerRole: string; revenueBps: number; variableCostBps: number; fixedCostBps: number; equipmentBps: number; smarts: number; ownerQualification?: { level: 'degree' | 'trade'; field: string } };
/** Authored small-firm economics, scaled from local base pay. Not national business/tax law. */
export const businessCatalog: Record<BusinessKind, BusinessDefinition> = {
  cafe: { title: 'Coffee Shop', description: 'A local café with repeat customers and a small team.', art: 'cafe', capitalBps: 5000, workerRole: 'barista', revenueBps: 30000, variableCostBps: 4500, fixedCostBps: 2400, equipmentBps: 6000, smarts: 20 },
  retail: { title: 'Retail Shop', description: 'A neighbourhood shop balancing prices, stock and service.', art: 'shop', capitalBps: 6000, workerRole: 'retail', revenueBps: 32000, variableCostBps: 5000, fixedCostBps: 2400, equipmentBps: 6000, smarts: 20 },
  delivery: { title: 'Delivery Service', description: 'A small logistics operation with fleet and staffing costs.', art: 'delivery', capitalBps: 9000, workerRole: 'warehouse', revenueBps: 33000, variableCostBps: 4000, fixedCostBps: 3000, equipmentBps: 7000, smarts: 25 },
  software: { title: 'Software Studio', description: 'A skilled team making and supporting digital products.', art: 'software', capitalBps: 15000, workerRole: 'developer', revenueBps: 50000, variableCostBps: 1500, fixedCostBps: 3600, equipmentBps: 4000, smarts: 45, ownerQualification: { level: 'degree', field: 'computing' } },
  manufacturing: { title: 'Small Manufacturer', description: 'Production, materials and skilled workers at a local facility.', art: 'factory', capitalBps: 20000, workerRole: 'technician', revenueBps: 43000, variableCostBps: 4500, fixedCostBps: 4800, equipmentBps: 7000, smarts: 40, ownerQualification: { level: 'trade', field: 'science' } },
};
