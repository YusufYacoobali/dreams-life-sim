// Native chrome requires the separate Android opening run. Component tests keep
// routing, game state, exact money formatting and real SQLite persistence live.
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
