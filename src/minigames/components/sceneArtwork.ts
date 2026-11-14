import { Asset } from 'expo-asset';
import type { MiniGameKind } from '../core/types';

// All art is bundled. No remote URIs or downloads during a saved attempt.
export const sceneArt = {
  stadium: require('../../../assets/minigames/art/stadium.webp'),
  space: require('../../../assets/minigames/art/space.webp'),
  safe: require('../../../assets/minigames/art/safe.webp'),
  goal: require('../../../assets/minigames/art/goal.png'),
  keeper: require('../../../assets/minigames/art/keeper.png'),
  keeperDive: require('../../../assets/minigames/art/keeper-dive.png'),
  ball: require('../../../assets/minigames/art/ball.png'),
  station: require('../../../assets/minigames/art/station.png'),
  ship: require('../../../assets/minigames/art/ship.png'),
  earth: require('../../../assets/minigames/art/earth.png'),
  thruster: require('../../../assets/minigames/art/thruster.png'),
  dial: require('../../../assets/minigames/art/dial.png'),
  cellEnvironment: require('../../../assets/generated/cell-escape-background.png'),
  cellObjects: require('../../../assets/generated/cell-escape-objects.png'),
};

export async function preloadSceneArt(kind: MiniGameKind, illustratedEscape = false) {
  // Genuine v1/v2 stamp sessions retain their native scene and loading behavior.
  if (kind === 'escape') {
    if (illustratedEscape) await Asset.loadAsync([sceneArt.cellEnvironment, sceneArt.cellObjects]);
    return;
  }
  const layers =
    kind === 'sports'
      ? [
          sceneArt.stadium,
          sceneArt.goal,
          sceneArt.keeper,
          sceneArt.keeperDive,
          sceneArt.ball,
        ]
      : kind === 'crime'
        ? [sceneArt.safe, sceneArt.dial]
        : [
            sceneArt.space,
            sceneArt.earth,
            sceneArt.station,
            sceneArt.ship,
            sceneArt.thruster,
          ];
  await Asset.loadAsync(layers);
}
