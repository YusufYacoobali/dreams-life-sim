import { createPurchaseService, resolveOwnership, type Customer, type PurchaseAdapter } from '../../src/purchases/service';
import { features, noOwnership, ownsProduct, productIds, products, type PremiumFeature } from '../../src/purchases/catalog';
import { setPurchaseAnalytics } from '../../src/purchases/analytics';
const customer = (...owned: PremiumFeature[]): Customer => ({ entitlements: { active: Object.fromEntries(owned.map(id => [id, {}])), verification: 'VERIFIED' } });
function setup() {
  let listener: (value: Customer) => void = () => {};
  const adapter = {
    configure: jest.fn(async () => {}), customer: jest.fn(async () => customer()),
    products: jest.fn(async () => productIds.map(identifier => ({ identifier, priceString: identifier === 'dreams.full_unlock' ? '29,99 €' : '£9.99' }))),
    purchase: jest.fn(async product => customer(...products[product.identifier as keyof typeof products].features)),
    restore: jest.fn(async () => customer('time_machine')),
    listen: jest.fn((next: (value: Customer) => void) => { listener = next; return jest.fn(); }),
  } satisfies PurchaseAdapter;
  const service = createPurchaseService(async () => adapter);
  return { service, adapter, update: (value: Customer) => listener(value) };
}
afterEach(() => setPurchaseAnalytics());
test.each(productIds)('%s grants only the entitlements returned by the SDK and blocks a duplicate purchase', async id => {
  const { service, adapter } = setup(); await service.getState().initialize();
  expect(await service.getState().purchase(id, 'test')).toBe('completed');
  for (const feature of features) expect(service.getState().ownership[feature]).toBe((products[id].features as readonly string[]).includes(feature));
  expect(await service.getState().purchase(id, 'test')).toBe('owned'); expect(adapter.purchase).toHaveBeenCalledTimes(1);
});
test('bundles mark their individual products owned, independent features accumulate, and partial ownership still permits a bundle', async () => {
  const { service, adapter, update } = setup(); await service.getState().initialize();
  update(customer('athlete', 'god_mode')); expect(ownsProduct(service.getState().ownership, 'dreams.athlete')).toBe(true);
  expect(ownsProduct(service.getState().ownership, 'dreams.full_unlock')).toBe(false);
  await service.getState().purchase('dreams.career_pass', 'test');
  expect(await service.getState().purchase('dreams.astronaut', 'test')).toBe('owned'); expect(adapter.purchase).toHaveBeenCalledTimes(1);
});
test('SDK offline cache survives a cold initialization; refresh failure keeps last verified access and refreshed revocation removes it', async () => {
  const { service, adapter, update } = setup(); adapter.customer.mockResolvedValue(customer('athlete', 'time_machine'));
  await service.getState().initialize(); expect(service.getState().ownership.time_machine).toBe(true);
  adapter.customer.mockRejectedValue(new Error('offline')); await service.getState().refresh();
  expect(service.getState().ownership.athlete).toBe(true); expect(service.getState().error).toMatch(/refresh/);
  update(customer()); expect(service.getState().ownership).toEqual(noOwnership());
  adapter.customer.mockResolvedValue(customer('god_mode')); await service.getState().refresh(); expect(service.getState().ownership.god_mode).toBe(true);
  adapter.customer.mockResolvedValue(customer()); await service.getState().refresh(); expect(service.getState().ownership.god_mode).toBe(false);
});
test('restoration accepts current SDK ownership and emits a real restore event', async () => {
  const events: string[] = []; setPurchaseAnalytics(event => events.push(event.name));
  const { service } = setup(); await service.getState().initialize(); expect(await service.getState().restore('history')).toBe(true);
  expect(service.getState().ownership.time_machine).toBe(true); expect(events).toEqual(['purchase_restored']);
});
test('purchase cancellation, failure and missing entitlement never emit completed; pending purchases reject repeated presses', async () => {
  const { service, adapter } = setup(), events: string[] = []; setPurchaseAnalytics(event => events.push(event.name)); await service.getState().initialize();
  let reject!: (value: unknown) => void; adapter.purchase.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const first = service.getState().purchase('dreams.athlete', 'tryout');
  expect(await service.getState().purchase('dreams.athlete', 'tryout')).toBe('busy'); expect(await service.getState().restore('test')).toBe(false);
  reject({ userCancelled: true }); expect(await first).toBe('cancelled'); expect(service.getState().error).toBeNull();
  adapter.purchase.mockRejectedValueOnce(new Error('billing failed')); expect(await service.getState().purchase('dreams.athlete', 'tryout')).toBe('failed');
  adapter.purchase.mockResolvedValueOnce(customer()); expect(await service.getState().purchase('dreams.athlete', 'tryout')).toBe('failed');
  expect(events.filter(name => name === 'purchase_completed')).toHaveLength(0); expect(service.getState().ownership).toEqual(noOwnership());
});
test('failed or absent trusted verification does not grant access', () => {
  for (const verification of ['FAILED', 'NOT_REQUESTED', undefined]) expect(resolveOwnership({ entitlements: { active: { god_mode: {} }, verification } })).toEqual(noOwnership());
  expect(resolveOwnership({ entitlements: { active: { god_mode: {} }, verification: 'VERIFIED_ON_DEVICE' } }).god_mode).toBe(true);
});
test('no configuration and native initialization failures leave a retryable unavailable store', async () => {
  const factory = jest.fn<Promise<PurchaseAdapter | null>, []>().mockResolvedValue(null), service = createPurchaseService(factory);
  await service.getState().initialize(); expect(service.getState().status).toBe('unavailable');
  expect(await service.getState().purchase('dreams.athlete', 'test')).toBe('failed'); expect(await service.getState().restore('test')).toBe(false);
  factory.mockRejectedValueOnce(new Error('native unavailable')); await service.getState().refresh(); expect(service.getState().status).toBe('unavailable');
  const working = setup(); factory.mockResolvedValue(working.adapter); await service.getState().refresh(); expect(service.getState().status).toBe('ready');
});
test('a late refresh cannot overwrite a newer listener revocation', async () => {
  const { service, adapter, update } = setup(); await service.getState().initialize();
  let resolve!: (value: Customer) => void; adapter.customer.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const refresh = service.getState().refresh(); update(customer()); resolve(customer('god_mode')); await refresh;
  expect(service.getState().ownership.god_mode).toBe(false);
});

test('verified cached ownership becomes available without waiting for a slow product-price request', async () => {
  const { service, adapter } = setup(); let finish!: (products: Awaited<ReturnType<typeof adapter.products>>) => void;
  adapter.customer.mockResolvedValue(customer('god_mode'));
  adapter.products.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const initialization = service.getState().initialize();
  for (let turn = 0; turn < 8; turn++) await Promise.resolve();
  expect(service.getState().ownership.god_mode).toBe(true); expect(service.getState().status).toBe('loading');
  finish([]); await initialization; expect(service.getState().status).toBe('ready');
});
