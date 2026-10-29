import type { GameDate } from '../calendar';
export const instrumentIds = ['GROVE', 'NORTH', 'LUMEN', 'VISTA', 'ORBIT', 'MOSAIC'] as const;
export type InstrumentId = typeof instrumentIds[number];
export const instruments: Record<InstrumentId, { name: string; kind: 'stock' | 'fund' | 'crypto'; unitScale: bigint; initialMinor: bigint; volatilityBps: number; driftBps: number; dividendBps: number }> = {
  GROVE: { name: 'Grove Broad Market Fund', kind: 'fund', unitScale: 1n, initialMinor: 10000n, volatilityBps: 300, driftBps: 35, dividendBps: 150 },
  NORTH: { name: 'Northstar Technology', kind: 'stock', unitScale: 1n, initialMinor: 4500n, volatilityBps: 1000, driftBps: 45, dividendBps: 0 },
  LUMEN: { name: 'Lumen Everyday Retail', kind: 'stock', unitScale: 1n, initialMinor: 2500n, volatilityBps: 650, driftBps: 25, dividendBps: 200 },
  VISTA: { name: 'Vista Global Fund', kind: 'fund', unitScale: 1n, initialMinor: 7500n, volatilityBps: 400, driftBps: 30, dividendBps: 100 },
  ORBIT: { name: 'Orbit Coin', kind: 'crypto', unitScale: 1000000n, initialMinor: 6500000n, volatilityBps: 2800, driftBps: 0, dividendBps: 0 },
  MOSAIC: { name: 'Mosaic Token', kind: 'crypto', unitScale: 1000000n, initialMinor: 300000n, volatilityBps: 3500, driftBps: -10, dividendBps: 0 },
};
/** Fixed initial game FX assumptions, major currency units per USD; never live rates. */
export const initialFx = { USD: [1n, 1n], CAD: [135n, 100n], GBP: [78n, 100n], AUD: [152n, 100n], EUR: [92n, 100n], BRL: [510n, 100n], INR: [8300n, 100n], JPY: [150n, 1n], ZAR: [1850n, 100n] } as const;
export function initialMarket(date: GameDate) {
  return {
    propertyIndex: 10000,
    fx: Object.fromEntries(Object.entries(initialFx).map(([id, [numerator, denominator]]) => [id, { numerator: numerator * 10000n, denominator: denominator * 10000n }])),
    prices: Object.fromEntries(instrumentIds.map(id => [id, { minor: instruments[id].initialMinor, history: [{ year: date.year, month: date.month, minor: instruments[id].initialMinor }] }])),
  };
}
