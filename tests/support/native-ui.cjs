// Native chrome requires the separate Android opening run. Component tests keep
// routing, game state, exact money formatting and real SQLite persistence live.
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(async () => {}), hideAsync: jest.fn(async () => {}) }));
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
// Screen navigation is a native boundary in component tests. Keep the route
// context itself available to exercise real modal ownership without loading
// Expo Router's native header image assets through its elements barrel.
jest.mock('expo-router/react-navigation', () => ({ NavigationRouteContext: require('react').createContext(undefined) }));
// Store review is device hardware. Layout tests keep the real review tracker
// and host; the adapter unit explicitly unmocks this boundary.
jest.mock('../../src/reviews/nativeReview', () => ({
  nativeReviewAvailable: jest.fn(async () => false),
  requestNativeReview: jest.fn(async () => {}),
}));
