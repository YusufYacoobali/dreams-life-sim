import { portraitImages } from '../../src/assets/portraitImages';
import { portraitLayers, portraitTraits } from '../../src/assets/portraitPlan';
import { ageingHairColor, hairColors, portraitAgeStage } from '../../src/assets/portraitLayout';
import { avatarPresets } from '../../src/ui/CreationElements';
import { fitPortraitHair } from '../../src/assets/portraitFitting';
import approvedMen from '../../tools/fixtures/avatar-v2-approved-men.json';
import { naturalFaces } from '../../src/assets/portraitFit';

const ages = [0, 7, 16, 25, 48, 68, 86, 100];

test('the eight approved men keep their existing portrait geometry', () => {
  for (const [identity,layers] of Object.entries(approvedMen.plans)) {
    // JSON fixtures normalise -0; native positions treat both zeros identically.
    expect(JSON.stringify(portraitLayers(portraitTraits(avatarPresets[Number(identity)],25)))).toBe(JSON.stringify(layers));
  }
});

test('all 1,966,080 identity/customisation/outfit/age combinations have complete bounded offline layers', () => {
  const failures: string[] = [];
  let count = 0;
  for (let identity = 0; identity < 16; identity++) for (let face = 0; face < 4; face++) for (let skin = 0; skin < 6; skin++) {
    for (let hair = 0; hair < 8; hair++) for (let hairColor = 0; hairColor < 5; hairColor++) for (const age of ages) for (let outfit = 0; outfit < 16; outfit++) {
      const layers = portraitLayers(portraitTraits({ identity, face, skin, hair, hairColor, outfit }, age)); count++;
      const infant = age < 3;
      const valid = layers.length <= 5 && layers.length >= (infant ? 1 : 3) &&
        layers.every(layer => Object.hasOwn(portraitImages, layer.asset) &&
          [layer.width, layer.height, layer.left, layer.top, layer.opacity ?? 1].every(Number.isFinite)) &&
        layers.some(layer => layer.asset.startsWith('head-')) &&
        (infant ? layers.length === 1 : layers.some(layer => layer.asset.startsWith('body-')) && layers.some(layer => layer.asset === `clothing-${outfit}`)) &&
        layers.some(layer => layer.asset.endsWith('-front')) === (age >= 3 && hair !== 0);
      if (!valid) failures.push(JSON.stringify({ identity, face, skin, hair, hairColor, age }));
    }
  }
  expect(count).toBe(1966080); expect(failures).toEqual([]);
});

test('ages 0–2 show only their baby head and restore saved hair and clothing at age 3', () => {
  for (const preset of avatarPresets) for (const age of [0,1,2]) {
    const appearance = { ...preset,outfit:14,hair:7,hairColor:3 }, before = { ...appearance };
    const infant = portraitLayers(portraitTraits(appearance,age));
    expect(infant).toHaveLength(1);
    expect(infant[0].asset).toBe(`head-${preset.identity}-0-${preset.skin}`);
    expect(portraitLayers(portraitTraits({ ...appearance,outfit:3,hair:1,hairColor:0 },age))).toEqual(infant);
    const child = portraitLayers(portraitTraits(appearance,3));
    expect(child.some(layer => layer.asset === 'clothing-14')).toBe(true);
    expect(child.some(layer => layer.asset.endsWith('-3-front'))).toBe(true);
    expect(appearance).toEqual(before);
  }
});

test('every saved face shape uses the original baby illustration without changing the saved preference', () => {
  for (const preset of avatarPresets) for (let skin = 0; skin < 6; skin++) {
    const original = portraitLayers(portraitTraits({ ...preset,skin,face:naturalFaces[preset.identity!] },0));
    for (const face of [0,1,2,3]) for (const age of [0,1,2]) {
      const appearance = { ...preset,skin,face }, before = { ...appearance };
      expect(portraitLayers(portraitTraits(appearance,age))).toEqual(original);
      expect(portraitTraits(appearance,25).face).toBe(face);
      expect(appearance).toEqual(before);
    }
  }
});

test('children have a lower head position while the hair stays attached and face proportions stay unchanged', () => {
  for (const preset of avatarPresets) {
    const adultHead = portraitLayers(portraitTraits(preset,25)).find(layer => layer.asset.startsWith('head-'))!;
    for (const age of [3,7,11]) {
      const layers = portraitLayers(portraitTraits(preset,age));
      const head = layers.find(layer => layer.asset.startsWith('head-'))!;
      const hair = layers.find(layer => layer.asset.endsWith('-front'))!;
      expect(head.top).toBeGreaterThan(adultHead.top);
      expect(head.crop).toEqual(adultHead.crop);
      const fit = fitPortraitHair(preset.identity!,preset.identity!,1,preset.face);
      const scale = head.crop!.height/248;
      expect(hair.top-fit.top*scale).toBeCloseTo(head.top-44*scale);
    }
  }
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
  // Hair openings reveal the complete underlying head; opaque locks cover
  // the ears. Cropping the temples leaves transparent holes and cut cheeks.
  expect(head).toEqual(shortHead);
});

test('hair is fitted to each measured face, contour and age rather than using one fixed-size wig', () => {
  for (const wig of [16,17,18,19,20,21,22]) {
    const fits = avatarPresets.map(preset => fitPortraitHair(wig,preset.identity!,3,preset.face));
    expect(new Set(fits.map(fit => fit.width.toFixed(3))).size).toBeGreaterThan(8);
    expect(fitPortraitHair(wig,0,1,0)).not.toEqual(fitPortraitHair(wig,0,3,0));
    expect(fitPortraitHair(wig,0,3,0)).not.toEqual(fitPortraitHair(wig,0,3,3));
  }
});
