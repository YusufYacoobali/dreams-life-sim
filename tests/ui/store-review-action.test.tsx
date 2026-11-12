import React from 'react';
jest.mock('../../src/persistence/native',()=>({openRepository:async()=>{throw new Error('Store actions must not open saved lives');}}));
jest.mock('../../src/reviews/nativeReview',()=>({reviewStoreUrl:jest.fn(()=> 'https://play.google.com/store/apps/details?id=com.yacoobali.lifesim'),openStoreReview:jest.fn(async()=>true)}));
import { act, fireEvent, render, screen } from '../support/rendering';
import { openStoreReview, reviewStoreUrl } from '../../src/reviews/nativeReview';
import { StoreReviewAction } from '../../src/ui/StoreReviewAction';
import { ThemeProvider } from '../../src/ui/theme';
const open=jest.mocked(openStoreReview),url=jest.mocked(reviewStoreUrl);
afterEach(()=>{open.mockReset().mockResolvedValue(true);url.mockReturnValue('https://play.google.com/store/apps/details?id=com.yacoobali.lifesim');});

test('Rate Dreams is explicitly available independently of review scheduling and guards duplicate taps',async()=>{
  let finish!:(opened:boolean)=>void;open.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const view=await render(<ThemeProvider><StoreReviewAction /></ThemeProvider>);
  await fireEvent.press(screen.getByRole('button',{name:'Rate Dreams'}));await fireEvent.press(screen.getByRole('button',{name:'Rate Dreams'}));
  expect(open).toHaveBeenCalledTimes(1);expect(screen.getByRole('button',{name:'Rate Dreams'})).toBeDisabled();
  expect(open.mock.calls[0][0]?.()).toBe(true);
  await act(async()=>{finish(true);});expect(screen.getByRole('button',{name:'Rate Dreams'})).toBeEnabled();
  await view.unmount();expect(open.mock.calls[0][0]?.()).toBe(false);
});

test('a store launch error is visible and can be retried without claiming a submitted rating',async()=>{
  open.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  await render(<ThemeProvider><StoreReviewAction /></ThemeProvider>);
  await act(async()=>await fireEvent.press(screen.getByRole('button',{name:'Rate Dreams'})));
  expect(screen.getByText('The store could not be opened. Please try again.')).toBeOnTheScreen();
  await act(async()=>await fireEvent.press(screen.getByRole('button',{name:'Rate Dreams'})));
  expect(open).toHaveBeenCalledTimes(2);expect(screen.queryByText('The store could not be opened. Please try again.')).toBeNull();
});

test('a platform without a configured store destination has no unusable Rate button',async ()=>{
  url.mockReturnValue(null);await render(<ThemeProvider><StoreReviewAction /></ThemeProvider>);
  expect(screen.queryByRole('button',{name:'Rate Dreams'})).toBeNull();expect(open).not.toHaveBeenCalled();
});
