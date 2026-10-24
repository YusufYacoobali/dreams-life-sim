import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { StyleSheet } from 'react-native';
import { encodeWorld, type World } from '../../src/game/model';

/** Production RN tree evidence for the browser adapter; never a native capture. */
export function captureFinalPolish(name: string, tree: unknown, world: World) {
  const directory = process.env.DREAMS_FINAL_CAPTURE_DIR;
  if (!directory) return;
  const clean = (node: any): any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type: node.type,
    props: {
      style: StyleSheet.flatten(node.props?.style), source: node.props?.source,
      svg: node.type?.startsWith('RNSVG') ? Object.fromEntries(['d', 'name', 'clipPath', 'matrix', 'x', 'y', 'width', 'height', 'minX', 'minY', 'vbWidth', 'vbHeight', 'src', 'align'].filter(key => node.props?.[key] !== undefined).map(key => [key, node.props[key]])) : undefined,
      contentContainerStyle: StyleSheet.flatten(node.props?.contentContainerStyle), edges: node.props?.edges,
      accessibilityRole: node.props?.accessibilityRole, accessibilityLabel: node.props?.accessibilityLabel,
      accessibilityState: node.props?.accessibilityState, allowFontScaling: node.props?.allowFontScaling,
      resizeMode: node.props?.resizeMode, placeholder: node.props?.placeholder, value: node.props?.value,
    }, children: node.children?.map(clean),
  });
  mkdirSync(directory, { recursive: true });
  const json = JSON.stringify(clean(tree));
  writeFileSync(join(directory, name + '.json'), json + '\n');
  const metadata = join(dirname(directory), basename(directory) + '-metadata');
  mkdirSync(metadata, { recursive: true });
  writeFileSync(join(metadata, name + '.json'), JSON.stringify({
    renderer: 'Production React Native test tree, rendered later with a browser CSS/SVG adapter; not a native screenshot.',
    sourceCommit: process.env.DREAMS_FINAL_SOURCE_COMMIT ?? 'working tree',
    treeSha256: createHash('sha256').update(json).digest('hex'),
    worldSha256: createHash('sha256').update(encodeWorld(world)).digest('hex'),
    tuple: [world.schemaVersion, world.engineVersion, world.contentVersion],
    note: 'Existing archived life with explicit fixture preparation for visual coverage, not a natural playthrough or native routing proof.',
  }, null, 2) + '\n');
}
