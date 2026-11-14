import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Rect } from 'react-native-svg';
import { render, screen } from '../support/rendering';
import { HobbyArt } from '../../src/assets/HobbyArt';
import { expandedHobbyAtlasSize, expandedHobbyRects } from '../../src/assets/expandedHobbyLayout';
import { CellEscapeKeyArt } from '../../src/assets/CellEscapeArt';
import { cellEscapeAtlasSize, cellKeyRects, cellKeyTeeth } from '../../src/assets/cellEscapeLayout';

test('all eight expanded hobbies use their own complete illustrated crop in row and review sizes', async () => {
  const view = await render(<HobbyArt kind="running" />), crops = new Set<string>();
  for (const size of [40, 64]) for (const kind of Object.keys(expandedHobbyRects) as (keyof typeof expandedHobbyRects)[]) {
    await view.rerender(<HobbyArt kind={kind} size={size} />);
    const image = screen.UNSAFE_getByType(Image), [x, y, w, h] = expandedHobbyRects[kind], scale = size / Math.max(w, h);
    expect(String(image.props.source.testUri)).toContain('/expanded-hobby-atlas.png');
    expect(StyleSheet.flatten(image.props.style)).toMatchObject({ left: -x * scale, top: -y * scale, width: expandedHobbyAtlasSize[0] * scale, height: expandedHobbyAtlasSize[1] * scale });
    expect(screen.queryAllByRole('image')).toHaveLength(0);
    crops.add([x, y, w, h].join(','));
  }
  expect(crops.size).toBe(8);
});

test.each(Object.keys(cellKeyRects) as (keyof typeof cellKeyRects)[])('%s keys retain exact visible one/two/three teeth and the correct shaped sprite', async shape => {
  const view = await render(<CellEscapeKeyArt shape={shape} teeth={1} />);
  const [x, y, w, h] = cellKeyRects[shape], scale = Math.min(64 / w, 110 / h), [toothX, toothY] = cellKeyTeeth[shape];
  for (const teeth of [1, 2, 3]) {
    await view.rerender(<CellEscapeKeyArt shape={shape} teeth={teeth} />);
    const image = screen.UNSAFE_getByType(Image), marks = screen.UNSAFE_getAllByType(Rect);
    expect(String(image.props.source.testUri)).toContain('/cell-escape-objects.png');
    expect(StyleSheet.flatten(image.props.style)).toMatchObject({ left: -x * scale, top: -y * scale, width: cellEscapeAtlasSize[0] * scale, height: cellEscapeAtlasSize[1] * scale });
    expect(marks).toHaveLength(teeth);
    for (const [index, mark] of marks.entries()) {
      expect(mark.props).toMatchObject({ x: toothX, y: toothY + index * 27 });
      expect(mark.props.x + mark.props.width).toBeLessThanOrEqual(w);
      expect(mark.props.y + mark.props.height).toBeLessThanOrEqual(h);
    }
    expect(screen.queryAllByRole('image')).toHaveLength(0);
  }
});
