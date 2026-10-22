import { portraitImages } from '../../src/assets/portraitImages';
import { portraitCanvasSize, portraitLayers, portraitTraits } from '../../src/assets/portraitPlan';
import { ageingHairColor, hairColors, portraitAgeStage, skinTones } from '../../src/assets/portraitLayout';

test('all saved trait combinations have complete local artwork at every age stage', () => {
  const ages = [0, 7, 16, 25, 48, 68, 86, 100];
  for (let face = 0; face < 4; face++) for (let skin = 0; skin < 6; skin++) {
    for (let hair = 0; hair < 8; hair++) for (let hairColor = 0; hairColor < 5; hairColor++) {
      const appearance = { face, skin, hair, hairColor }, before = { ...appearance };
      for (const age of ages) {
        const traits = portraitTraits(appearance, age), layers = portraitLayers(traits);
        expect(layers.length).toBeLessThanOrEqual(7);
        expect(layers.every(layer => Object.hasOwn(portraitImages, layer.asset))).toBe(true);
        expect(layers.every(layer => [layer.width, layer.height, layer.left, layer.top].every(Number.isFinite))).toBe(true);
        expect(new Set(layers.map(layer => layer.asset)).size).toBe(layers.length);
        const head = layers.filter(layer => layer.asset.startsWith('head-'));
        expect(head.every(layer => layer.width === portraitCanvasSize && layer.height === portraitCanvasSize && layer.left === 0 && layer.top === 0)).toBe(true);
        expect(head.find(layer => layer.color)?.color).toBe(skinTones[skin]);
        expect(layers.filter(layer => layer.color).every(layer => layer.asset.endsWith('-mask'))).toBe(true);
        expect(layers.filter(layer => layer.asset.startsWith('hair-')).length > 0).toBe(age >= 3 && hair !== 0);
        expect(layers.some(layer => layer.asset.startsWith('clothing-'))).toBe(true);
      }
      expect(appearance).toEqual(before);
    }
  }
});

test('appearance is deterministic across save copies and does not reroll clothes or layers', () => {
  const appearance = { face: 3, skin: 5, hair: 5, hairColor: 3 };
  const original = portraitLayers(portraitTraits(appearance, 68));
  const savedCopy = JSON.parse(JSON.stringify(appearance));
  expect(portraitLayers(portraitTraits(savedCopy, 68))).toEqual(original);
  expect(portraitTraits(appearance, 25)).toEqual(portraitTraits(appearance, 26));
  expect(portraitTraits(appearance, 0).clothing).toBe(portraitTraits(appearance, 100).clothing);
});

test('all age boundaries and gradual greying preserve latent saved appearance', () => {
  for (const [age, stage] of [[0,0],[2,0],[3,1],[11,1],[12,2],[18,2],[19,3],[39,3],[40,4],[59,4],[60,5],[79,5],[80,6],[94,6],[95,7],[105,7]]) {
    expect(portraitAgeStage(age)).toBe(stage);
  }
  const appearance = { face: 0, skin: 2, hair: 4, hairColor: 0 };
  expect(portraitTraits(appearance, 2).hair).toBe(0);
  expect(portraitTraits(appearance, 3).hair).toBe(4);
  expect(appearance.hair).toBe(4);
  expect(ageingHairColor(hairColors[0], 45)).toBe(hairColors[0].toLowerCase());
  const tones = [45, 60, 80, 100].map(age => ageingHairColor(hairColors[0], age));
  expect(new Set(tones).size).toBe(4);
  for (let i = 1; i < tones.length; i++) {
    expect(parseInt(tones[i].slice(1,3),16)).toBeGreaterThan(parseInt(tones[i-1].slice(1,3),16));
  }
});

test('rear hair sits behind shoulders and the facial features retain their own colours', () => {
  for (const hair of [4, 5, 7]) {
    const layers = portraitLayers(portraitTraits({ face: 0, skin: 5, hair, hairColor: 3 }, 25));
    const index = (fragment: string) => layers.findIndex(layer => layer.asset.includes(fragment));
    expect(index('-back-mask')).toBeLessThan(index('head-'));
    expect(index('head-')).toBeLessThan(index('clothing-'));
    expect(index('clothing-')).toBeLessThan(index('-front-mask'));
    expect(layers.filter(layer => layer.asset.endsWith('-detail')).every(layer => layer.color === undefined)).toBe(true);
  }
});
