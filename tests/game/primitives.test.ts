import { addMoney, applyBasisPoints, convertMoney, formatMoney, parseMoney, roundRatio } from '../../src/game/money';
import { forkRandom, nextRandom, randomInteger } from '../../src/game/random';

test('seeded stream follows fixed vectors and resumes from its stored state', () => {
  const first = nextRandom(1);
  expect(first.value).toBe(0.6270739405881613);
  expect(nextRandom(0).value).toBe(0.26642920868471265);
  const save = JSON.parse(JSON.stringify(first)) as typeof first;
  expect(nextRandom(save.state)).toEqual(nextRandom(first.state));
});

test('world and event streams remain independent', () => {
  const eventSeed = forkRandom(42, 'events');
  let marketSeed = forkRandom(42, 'market');
  for (let i = 0; i < 100; i++) marketSeed = nextRandom(marketSeed).state;
  expect(nextRandom(forkRandom(42, 'events'))).toEqual(nextRandom(eventSeed));
  expect(marketSeed).not.toBe(eventSeed);
});

test('random bounds are inclusive and invalid saved states cannot silently reroll', () => {
  expect(randomInteger(1, 8, 8).value).toBe(8);
  expect(() => nextRandom(-1)).toThrow('Invalid random state');
  expect(() => forkRandom(Number.NaN, 'events')).toThrow('Invalid random state');
  expect(() => randomInteger(1, 5, 4)).toThrow('Invalid random bounds');
});

test('cents are exact even above the safe Number range', () => {
  const amount = parseMoney('9007199254740993.97', 'USD');
  expect(amount.minor).toBe(900719925474099397n);
  expect(addMoney(amount, parseMoney('0.03', 'USD')).minor).toBe(900719925474099400n);
  expect(formatMoney(amount)).toBe('$9,007,199,254,740,993.97');
});

test('exchange rates account for JPY having no minor units', () => {
  expect(convertMoney(parseMoney('10.25', 'USD'), 'JPY', 150n, 1n).minor).toBe(1538n);
  expect(convertMoney(parseMoney('150', 'JPY'), 'USD', 1n, 150n).minor).toBe(100n);
  expect(() => parseMoney('12.50', 'JPY')).toThrow('Too many decimal places');
});

test('negative cents keep their sign and rates round symmetrically', () => {
  expect(formatMoney({ currency: 'USD', minor: -1n })).toBe('-$0.01');
  expect(formatMoney({ currency: 'GBP', minor: 17500n }, 'en-GB', true)).toBe('+£175.00');
  expect(roundRatio(5n, 2n)).toBe(3n);
  expect(roundRatio(-5n, 2n)).toBe(-3n);
  expect(applyBasisPoints(parseMoney('100.00', 'USD'), 350n).minor).toBe(350n);
});

test('money operations reject mixed currencies, invalid amounts and invalid FX', () => {
  expect(() => addMoney(parseMoney('10', 'USD'), parseMoney('10', 'GBP'))).toThrow('Currency mismatch');
  for (const amount of ['-1', 'NaN', '1e6', '1.999', '']) expect(() => parseMoney(amount, 'USD')).toThrow();
  expect(() => convertMoney(parseMoney('10', 'USD'), 'GBP', 0n, 1n)).toThrow('Invalid exchange rate');
});
