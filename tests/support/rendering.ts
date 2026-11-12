import * as native from '@testing-library/react-native';
import type { Fiber, TestInstance } from 'test-renderer';

const { findCurrentFiberUsingSlowPath } = require('react-reconciler/reflection') as { findCurrentFiberUsingSlowPath: (fiber: Fiber) => Fiber | null };

export * from '@testing-library/react-native';

// Native press handlers do not wait for returned promises. RNTL 14's fireEvent
// adopts that return value; discard it here so held-write tests can still inspect
// busy controls before releasing storage. Enabled/bubbling checks remain RNTL's.
const pressNodes = new WeakMap<TestInstance, TestInstance>(), pressFibers = new WeakMap<Fiber, Fiber>();
const pressProps = (props: Record<string, any>) => new Proxy({ ...props }, { get: (target, key) => {
  const value = Reflect.get(target, key);
  return key === 'onPress' && typeof value === 'function' ? (...args: unknown[]) => { void value(...args); } : value;
} });
function pressFiber(fiber: Fiber): Fiber {
  let proxy = pressFibers.get(fiber);
  if (!proxy) {
    proxy = new Proxy(fiber, { get: (target, key) => {
      if (key === 'memoizedProps') return target.memoizedProps && typeof target.memoizedProps === 'object' ? pressProps(target.memoizedProps) : target.memoizedProps;
      if (key === 'return') return target.return ? pressFiber(target.return) : null;
      return Reflect.get(target, key);
    } });
    pressFibers.set(fiber, proxy);
  }
  return proxy;
}
function pressNode(node: TestInstance): TestInstance {
  if (node.type === '') return node;
  let proxy = pressNodes.get(node);
  if (!proxy) {
    proxy = new Proxy(node, { get: (target, key) => {
      if (key === 'props') return pressProps(target.props);
      if (key === 'parent') return target.parent ? pressNode(target.parent) : null;
      if (key === 'unstable_fiber') return target.unstable_fiber ? pressFiber(target.unstable_fiber) : null;
      return Reflect.get(target, key, target);
    } });
    pressNodes.set(node, proxy);
  }
  return proxy;
}
export const fireEvent = Object.assign((...args: Parameters<typeof native.fireEvent>) => native.fireEvent(...args), native.fireEvent, {
  press: (node: TestInstance, ...args: Parameters<typeof native.fireEvent.press> extends [TestInstance, ...infer Rest] ? Rest : never) => native.fireEvent.press(pressNode(node), ...args),
});

// RNTL 14 renders host nodes only. Existing race and layout tests also inspect
// composite props and retain callbacks. Keep those explicit unsafe inspections
// here; rendering, interactions, queries and assertions use the real RNTL 14.
interface ComponentInstance extends TestInstance {
  readonly type: any;
  readonly props: Record<string, any>;
  readonly parent: ComponentInstance | null;
  readonly children: (ComponentInstance | string)[];
  findAll: (predicate: (node: ComponentInstance) => boolean, options?: { deep?: boolean }) => ComponentInstance[];
  findByType: (type: unknown) => ComponentInstance;
  findAllByType: (type: unknown) => ComponentInstance[];
  findByProps: (props: Record<string, unknown>) => ComponentInstance;
  findAllByProps: (props: Record<string, unknown>) => ComponentInstance[];
}
type UnsafeQueries = {
  readonly UNSAFE_root: ComponentInstance;
  UNSAFE_getByType: (type: unknown) => ComponentInstance;
  UNSAFE_getAllByType: (type: unknown) => ComponentInstance[];
  UNSAFE_queryByType: (type: unknown) => ComponentInstance | null;
  UNSAFE_queryAllByType: (type: unknown) => ComponentInstance[];
  UNSAFE_getByProps: (props: Record<string, unknown>) => ComponentInstance;
  UNSAFE_getAllByProps: (props: Record<string, unknown>) => ComponentInstance[];
};

function unsafeQueries(container: TestInstance, scope?: Fiber | null): UnsafeQueries {
  const cache = new WeakMap<Fiber, ComponentInstance>();
  const current = (fiber: Fiber): Fiber => findCurrentFiberUsingSlowPath(fiber) ?? fiber;
  const children = (fiber: Fiber) => {
    const result: Fiber[] = [];
    for (let child = current(fiber).child; child; child = child.sibling) result.push(child);
    return result;
  };
  const one = (matches: ComponentInstance[]) => {
    if (matches.length !== 1) throw new Error('Expected one component, found ' + matches.length);
    return matches[0];
  };
  const propsMatch = (node: ComponentInstance, props: Record<string, unknown>) => Object.entries(props).every(([key, value]) => node.props[key] === value);
  const byType = (fiber: Fiber, type: unknown) => current(fiber).type === type || current(fiber).elementType === type;
  function instance(fiber: Fiber): ComponentInstance {
    const saved = cache.get(fiber) ?? (fiber.alternate && cache.get(fiber.alternate));
    if (saved) return saved;
    const findAll = (predicate: (node: ComponentInstance) => boolean, options?: { deep?: boolean }): ComponentInstance[] => {
      const matches: ComponentInstance[] = [];
      const visit = (node: Fiber) => {
        if (node.tag === 6) return;
        const value = instance(node), match = predicate(value);
        if (match) matches.push(value);
        if (!match || options?.deep !== false) for (const child of children(node)) visit(child);
      };
      visit(current(fiber));
      return matches;
    };
    const value = {
      get type() { return current(fiber).type; },
      get props() { return current(fiber).memoizedProps ?? {}; },
      get parent() { const parent = current(fiber).return; return parent ? instance(parent) : container; },
      get children() { return children(fiber).map(child => child.tag === 6 ? String(child.memoizedProps) : instance(child)); },
      get unstable_fiber() { return current(fiber); },
      findAll,
      findAllByType: (type: unknown) => findAll(node => node.type === type || byType(node.unstable_fiber!, type)),
      findByType: (type: unknown) => one(findAll(node => node.type === type || byType(node.unstable_fiber!, type), { deep: false })),
      findAllByProps: (props: Record<string, unknown>) => findAll(node => propsMatch(node, props)),
      findByProps: (props: Record<string, unknown>) => one(findAll(node => propsMatch(node, props), { deep: false })),
      queryAll: (predicate: (node: TestInstance) => boolean, options?: Parameters<TestInstance['queryAll']>[1]) => {
        const descendants = new Set(findAll(() => true).flatMap(node => [node.unstable_fiber, node.unstable_fiber?.alternate]));
        return container.queryAll(node => descendants.has(node.unstable_fiber) && predicate(node), { ...options, includeSelf: true });
      },
      toJSON: () => {
        const host = container.queryAll(node => node.unstable_fiber === current(fiber), { includeSelf: true })[0];
        return host?.toJSON() ?? null;
      },
    } as unknown as ComponentInstance;
    cache.set(fiber, value);
    if (fiber.alternate) cache.set(fiber.alternate, value);
    return value;
  }
  const root = () => {
    if (scope) return instance(current(scope));
    const host = container.queryAll(node => !!node.unstable_fiber)[0];
    if (!host?.unstable_fiber) throw new Error('No mounted component tree');
    let fiber = host.unstable_fiber;
    while (fiber.return) fiber = fiber.return;
    return instance(current(fiber));
  };
  return {
    get UNSAFE_root() { return root(); },
    UNSAFE_getByType: type => root().findByType(type),
    UNSAFE_getAllByType: type => root().findAllByType(type),
    UNSAFE_queryByType: type => { const matches = root().findAllByType(type); return matches.length ? one(matches) : null; },
    UNSAFE_queryAllByType: type => root().findAllByType(type),
    UNSAFE_getByProps: props => root().findByProps(props),
    UNSAFE_getAllByProps: props => root().findAllByProps(props),
  };
}

const queryCache = new WeakMap<TestInstance, UnsafeQueries>();
function queries(container: TestInstance) {
  let result = queryCache.get(container);
  if (!result) { result = unsafeQueries(container); queryCache.set(container, result); }
  return result;
}
function withInspections<T extends { container: TestInstance }>(getResult: () => T): T & UnsafeQueries {
  return new Proxy({} as T & UnsafeQueries, { get: (_, key) => {
    const result = getResult();
    return String(key).startsWith('UNSAFE_') ? Reflect.get(queries(result.container), key) : Reflect.get(result, key);
  } });
}
export const screen = withInspections(() => native.screen);
export function within(element: TestInstance) {
  const result = native.within(element), inspections = unsafeQueries(element, element.unstable_fiber);
  return new Proxy(result as typeof result & UnsafeQueries, { get: (_, key) =>
    String(key).startsWith('UNSAFE_') ? Reflect.get(inspections, key) : Reflect.get(result, key),
  });
}
export async function render(...args: Parameters<typeof native.render>) {
  const result = await native.render(...args);
  return withInspections(() => result);
}
