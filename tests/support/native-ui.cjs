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
// Metro asset IDs for the shared cache; actual files are inspected separately.
jest.mock('../../assets/audio/action-tap.wav', () => 42);
jest.mock('../../assets/audio/age-up.mp3', () => 43);
jest.mock('../../assets/audio/big-success.mp3', () => 44);
jest.mock('../../assets/audio/freesound_gamestudio-purchase-success-384963.mp3', () => 45);
jest.mock('../../assets/audio/universfield-error-notification-08-206492.mp3', () => 46);
// Store review is device hardware. Layout tests keep the real review tracker
// and host; the adapter unit explicitly unmocks this boundary.
jest.mock('../../src/reviews/nativeReview', () => ({
  nativeReviewAvailable: jest.fn(async () => false),
  requestNativeReview: jest.fn(async () => {}),
  reviewPromptSupported: jest.fn(() => false),
  reviewStoreUrl: jest.fn(() => null),
  openStoreReview: jest.fn(async () => false),
}));
