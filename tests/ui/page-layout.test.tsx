import React from 'react';
// Shared portraits can import the game store; device persistence is outside this UI fixture.
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => { throw new Error('Unexpected device database access in UI fixture'); } }));
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { KeyboardAvoidingView, ScrollView, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Body, Button, Header, Page } from '../../src/ui/components';
import { ThemeProvider } from '../../src/ui/theme';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;

test('a long Page keeps the original Back control outside its scroller and preserves its busy guard', () => {
  const back = jest.fn();
  const page = (busy: boolean) => frame(<Page><Header title="Your recorded history" onBack={back} backDisabled={busy} />{Array.from({ length: 40 }, (_, index) => <Body key={index}>Recorded entry {index + 1}</Body>)}</Page>);
  const view = render(page(false)), scroll = screen.UNSAFE_getByType(ScrollView);
  expect(within(scroll).queryByRole('button', { name: 'Back' })).toBeNull();
  expect(within(scroll).getByText('Recorded entry 40')).toBeOnTheScreen();
  fireEvent.scroll(scroll, { nativeEvent: { contentOffset: { x: 0, y: 2000 }, contentSize: { width: 390, height: 3000 }, layoutMeasurement: { width: 390, height: 500 } } });
  fireEvent.press(screen.getByRole('button', { name: 'Back' })); expect(back).toHaveBeenCalledTimes(1);
  view.rerender(page(true)); fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled(); expect(back).toHaveBeenCalledTimes(1);
  view.rerender(page(false)); fireEvent.press(screen.getByRole('button', { name: 'Back' })); expect(back).toHaveBeenCalledTimes(2);
});

test('inline forms share keyboard avoidance without a footer and keep their draft and input instance as footer and busy state change', () => {
  const mounted = jest.fn(), unmounted = jest.fn(), focused = jest.fn(), blurred = jest.fn();
  function Draft() {
    const [text, setText] = React.useState('');
    React.useEffect(() => { mounted(); return unmounted; }, []);
    return <TextInput accessibilityLabel="Original message" value={text} onChangeText={setText} onFocus={focused} onBlur={blurred} />;
  }
  function Form({ footer = false, busy = false }: { footer?: boolean; busy?: boolean }) {
    return <Page footer={footer ? <Button label="Review message" busy={busy} onPress={() => {}} /> : undefined}>
      <Header title="Write a message" onBack={() => {}} backDisabled={busy} />
      <Draft />
    </Page>;
  }
  const view = render(frame(<Form />)), avoiding = screen.UNSAFE_getByType(KeyboardAvoidingView), scroll = screen.UNSAFE_getByType(ScrollView), input = screen.getByLabelText('Original message');
  expect(within(avoiding).getByLabelText('Original message')).toBe(input);
  expect(within(avoiding).queryByRole('button', { name: 'Back' })).toBeNull();
  expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  fireEvent(input, 'focus'); fireEvent.changeText(input, 'A draft worth keeping');
  act(() => { view.rerender(frame(<Form footer busy />)); });
  expect(screen.UNSAFE_getByType(KeyboardAvoidingView)).toBe(avoiding); expect(screen.UNSAFE_getByType(ScrollView)).toBe(scroll);
  expect(screen.getByLabelText('Original message')).toBe(input); expect(screen.getByDisplayValue('A draft worth keeping')).toBeOnTheScreen();
  expect(within(avoiding).getByRole('button', { name: 'Review message' })).toBeDisabled();
  act(() => { view.rerender(frame(<Form />)); });
  expect(screen.getByLabelText('Original message')).toBe(input); expect(screen.getByDisplayValue('A draft worth keeping')).toBeOnTheScreen();
  expect(mounted).toHaveBeenCalledTimes(1); expect(unmounted).not.toHaveBeenCalled(); expect(focused).toHaveBeenCalledTimes(1); expect(blurred).not.toHaveBeenCalled();
});
