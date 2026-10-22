import { portraitImages } from '../../src/assets/portraitImages';
import { portraitLayers, portraitTraits } from '../../src/assets/portraitPlan';
import { ageingHairColor, hairColors, portraitAgeStage } from '../../src/assets/portraitLayout';
import { avatarPresets } from '../../src/ui/CreationElements';
import { fitPortraitHair } from '../../src/assets/portraitFitting';

const ages = [0, 7, 16, 25, 48, 68, 86, 100];

test('all 1,966,080 identity/customisation/outfit/age combinations have complete bounded offline layers', () => {
  const failures: string[] = [];
  let count = 0;
  for (let identity = 0; identity < 16; identity++) for (let face = 0; face < 4; face++) for (let skin = 0; skin < 6; skin++) {
    for (let hair = 0; hair < 8; hair++) for (let hairColor = 0; hairColor < 5; hairColor++) for (const age of ages) for (let outfit = 0; outfit < 16; outfit++) {
      const layers = portraitLayers(portraitTraits({ identity, face, skin, hair, hairColor, outfit }, age)); count++;
      const valid = layers.length <= 5 && layers.length >= 3 &&
        layers.every(layer => Object.hasOwn(portraitImages, layer.asset) &&
          [layer.width, layer.height, layer.left, layer.top, layer.opacity ?? 1].every(Number.isFinite)) &&
        layers.some(layer => layer.asset.startsWith('head-')) && layers.some(layer => layer.asset.startsWith('body-')) && layers.some(layer => layer.asset === `clothing-${outfit}`) &&
        layers.some(layer => layer.asset.endsWith('-front')) === (age >= 3 && hair !== 0);
      if (!valid) failures.push(JSON.stringify({ identity, face, skin, hair, hairColor, age }));
    }
  }
  expect(count).toBe(1966080); expect(failures).toEqual([]);
});

test('the sixteen presets have distinct facial identities and independently selectable outfits', () => {
  expect(new Set(avatarPresets.map(preset => preset.identity)).size).toBe(16);
  for (const preset of avatarPresets) {
    const original = portraitTraits(preset,25), layers = portraitLayers(original);
    const head = layers.find(layer => layer.asset.startsWith('head-'));
    const body = layers.find(layer => layer.asset.startsWith('body-'));
    for (let hairColor = 0; hairColor < 5; hairColor++) for (let hair = 0; hair < 8; hair++) {
      const changed = portraitTraits({ ...preset, hair, hairColor },25), next = portraitLayers(changed);
      expect(changed.identity).toBe(original.identity); expect(changed.clothing).toBe(original.clothing);
      const nextHead = next.find(layer => layer.asset.startsWith('head-'))!;
      expect(nextHead.asset).toBe(head!.asset);
      expect(nextHead.crop?.width).toBe(head!.crop?.width);
      expect(nextHead.crop?.height).toBe(head!.crop?.height);
      expect(nextHead.left+nextHead.crop!.left).toBeCloseTo(head!.left+head!.crop!.left);
      expect(nextHead.top).toBe(head!.top);
      expect(next.find(layer => layer.asset.startsWith('body-'))).toEqual(body);
    }
    for (let skin = 0; skin < 6; skin++) for (let face = 0; face < 4; face++) {
      const changed = portraitTraits({ ...preset, skin, face },25);
      expect(changed.identity).toBe(original.identity); expect(changed.clothing).toBe(original.clothing);
      expect(changed.hair).toBe(original.hair);
    }
    expect(portraitLayers(portraitTraits(JSON.parse(JSON.stringify(preset)),25))).toEqual(layers);
    expect(portraitTraits(preset,25)).toEqual(portraitTraits(preset,26));
    for (let outfit = 0; outfit < 16; outfit++) {
      const changed = portraitTraits({ ...preset, outfit },25), next = portraitLayers(changed);
      expect({ ...changed, clothing: original.clothing }).toEqual(original);
      const sameIdentityLayers = (items: typeof layers) => items.filter(layer => !layer.asset.startsWith('clothing-')).map(layer => layer.skinClip ? { ...layer,skinClip:{...layer.skinClip,outfit:original.clothing} } : layer);
      expect(sameIdentityLayers(next)).toEqual(sameIdentityLayers(layers));
      expect(next.find(layer => layer.asset.startsWith('clothing-'))?.asset).toBe(`clothing-${outfit}`);
    }
  }
});

test('all eight independently illustrated age stages retain identity and latent hair preferences', () => {
  for (const [age, stage] of [[0,0],[2,0],[3,1],[11,1],[12,2],[18,2],[19,3],[39,3],[40,4],[59,4],[60,5],[79,5],[80,6],[94,6],[95,7],[105,7]]) expect(portraitAgeStage(age)).toBe(stage);
  const appearance = { ...avatarPresets[0] };
  const stages = ages.map(age => portraitTraits(appearance, age));
  expect(stages.map(stage => stage.stage)).toEqual([0,1,2,3,4,5,6,7]);
  expect(new Set(stages.map(stage => portraitLayers(stage).find(layer => layer.asset.startsWith('head-'))!.asset)).size).toBe(8);
  expect(new Set(stages.map(stage => stage.identity)).size).toBe(1);
  expect(new Set(stages.map(stage => stage.clothing)).size).toBe(1);
  expect(stages[0].hair).toBe(0); expect(stages[1].hair).toBe(appearance.hair);
  expect(portraitTraits({ ...appearance, hair:7, hairColor:3 },0)).toEqual(stages[0]);
  expect(appearance).toEqual(avatarPresets[0]);
  expect(stages[4].grey).toBeLessThan(stages[5].grey); expect(stages[5].grey).toBeLessThan(stages[6].grey);
  expect(ageingHairColor(hairColors[0],45)).toBe(hairColors[0].toLowerCase());
});

test('continuous long hair sits in front of the face, ears and clothes, without an occluded rear layer', () => {
  const layers = portraitLayers(portraitTraits(avatarPresets[1],68));
  const index = (fragment: string) => layers.findIndex(layer => layer.asset.includes(fragment));
  expect(index('-back')).toBe(-1);
  expect(index('body-')).toBeLessThan(index('head-'));
  expect(index('head-')).toBeLessThan(index('clothing-'));
  expect(index('clothing-')).toBeLessThan(index('-front'));
  expect(layers.every(layer => !('color' in layer))).toBe(true);
  const head = layers.find(layer => layer.asset.startsWith('head-'))!;
  const shortHead = portraitLayers(portraitTraits({ ...avatarPresets[1],hair:1 },68)).find(layer => layer.asset.startsWith('head-'))!;
  expect(head.width).toBeLessThan(shortHead.width);
  expect(head.crop?.height).toBe(shortHead.crop?.height);
  expect(head.crop?.width).toBe(shortHead.crop?.width);
});

test('hair is fitted to each measured face, contour and age rather than using one fixed-size wig', () => {
  for (const wig of [16,17,18,19,20,21,22]) {
    const fits = avatarPresets.map(preset => fitPortraitHair(wig,preset.identity!,3,preset.face));
    expect(new Set(fits.map(fit => fit.width.toFixed(3))).size).toBeGreaterThan(8);
    expect(fitPortraitHair(wig,0,1,0)).not.toEqual(fitPortraitHair(wig,0,3,0));
    expect(fitPortraitHair(wig,0,3,0)).not.toEqual(fitPortraitHair(wig,0,3,3));
  }
});
