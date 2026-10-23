import React from 'react';
import { usePathname, useRootNavigationState } from 'expo-router';
import { useGame } from '../state/useGame';
import { useCinematicTransition } from './cinematic/CinematicContext';
import { EventModalProvider } from './EventModal';

type NavigationState = {
  index?: number;
  routes: readonly { key?: string; state?: NavigationState }[];
};
export function activeModalRouteKeys(state: NavigationState | undefined) {
  const keys: string[] = [];
  while (state?.routes.length) {
    const route = state.routes[state.index ?? 0];
    if (!route) break;
    if (route.key) keys.push(route.key);
    state = route.state;
  }
  return keys;
}

/** Outside both stacks, including Settings, God Mode and saved-life routes. */
export function AppEventModals({ children }: React.PropsWithChildren) {
  const path = usePathname(),
    state = useRootNavigationState(),
    keys = activeModalRouteKeys(state);
  const identity = useGame((store) =>
    store.world ? store.world.id + ':' + store.world.activePersonId : 'opening',
  );
  const { activeKind } = useCinematicTransition();
  return (
    <EventModalProvider
      routeKey={keys.at(-1) ?? path}
      activeRouteKeys={keys.length ? keys : [path]}
      identity={identity}
      blocked={!!activeKind}
    >
      {children}
    </EventModalProvider>
  );
}
