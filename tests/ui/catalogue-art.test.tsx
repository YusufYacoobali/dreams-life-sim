import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { CatalogArt } from '../../src/assets/CatalogArt';
import { catalogueArt, catalogueAtlasSizes } from '../../src/assets/catalogueLayout';
import { assetCatalog } from '../../src/game/content/assets';

test('every house and vehicle has its own bounded illustrated subject, not a generic fallback', () => {
  const offers = assetCatalog.filter(offer => offer.kind !== 'possession');
  expect(Object.keys(catalogueArt)).toHaveLength(46);
  const regions = new Set<string>();
  for (const offer of offers) {
    const image = catalogueArt[offer.id];
    expect(image).toBeDefined();
    expect(image.atlas).toBe(offer.kind === 'property' ? 'homes' : offer.licenceKind ? 'lifestyle-vehicles' : 'vehicles');
    const [x,y,width,height] = image.rect, [atlasWidth,atlasHeight] = catalogueAtlasSizes[image.atlas];
    expect(x >= 0 && y >= 0 && width > 0 && height > 0 && x+width <= atlasWidth && y+height <= atlasHeight).toBe(true);
    regions.add(image.atlas+':'+image.rect.join(','));
  }
  expect(regions.size).toBe(offers.length);
});

test('catalogue illustrations use local images and retain the requested square footprint at small and large sizes', () => {
  const view = render(<CatalogArt id="studio" size={56} />);
  const captures: { id:string; name:string; kind:string; size:number; tree:unknown }[] = [];
  const clean = (node:any):any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type:node.type,props:{ style:StyleSheet.flatten(node.props?.style),source:node.props?.source },children:node.children?.map(clean),
  });
  for (const offer of assetCatalog.filter(item => item.kind !== 'possession')) for (const size of [40,56,128]) {
    view.rerender(<CatalogArt id={offer.id} size={size} />);
    const root = screen.UNSAFE_getAllByType(View)[0];
    expect(root.props.style).toMatchObject({ width:size,height:size });
    const image = screen.UNSAFE_getByType(Image);
    expect(String(image.props.source.testUri)).toContain(offer.kind === 'property' ? '/catalogue-homes.png' : offer.licenceKind ? '/catalogue-lifestyle-vehicles.png' : '/catalogue-vehicles.png');
    expect(image.props.style.width).toBeGreaterThan(0);
    if (process.env.DREAMS_CATALOGUE_CAPTURE_DIR) captures.push({ id:offer.id,name:offer.name,kind:offer.kind,size,tree:clean(view.toJSON()) });
  }
  view.rerender(<CatalogArt id="watch" size={56} />);
  expect(String(screen.UNSAFE_getByType(Image).props.source.testUri)).toContain('/ownership-atlas.png');
  if (process.env.DREAMS_CATALOGUE_CAPTURE_DIR) {
    mkdirSync(process.env.DREAMS_CATALOGUE_CAPTURE_DIR,{ recursive:true });
    writeFileSync(join(process.env.DREAMS_CATALOGUE_CAPTURE_DIR,'catalogue-components.json'),JSON.stringify(captures));
  }
  view.unmount();
});
