import React, { useId } from 'react';
import { Platform } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { coverageAt, inkFront, inkRibbon, NAVY, smooth, type CinematicKind } from './inkGeometry';

const brandFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' });
const MovingPath = Animated.createAnimatedComponent(Path);
const MovingGroup = Animated.createAnimatedComponent(G);

function Pour({ clock, strand, offset = 0, thickness = 1, fill, opacity = 1 }: {
  clock: SharedValue<number>; strand: number; offset?: number; thickness?: number; fill: string; opacity?: number;
}) {
  const props = useAnimatedProps(() => ({ d: inkRibbon(clock.value / 1000, strand, offset, thickness) }), [clock, strand, offset, thickness]);
  return <MovingPath animatedProps={props} fill={fill} opacity={opacity} />;
}

/** The same real SVG scene is used by the native overlay and visual review.
 * Only masks/paths move: no expanding discs or opacity-only screen transition.
 */
export function CinematicInk({ kind, clock }: { kind: CinematicKind; clock: SharedValue<number> }) {
  const id = useId().replace(/:/g, ''), ref = (name: string) => `url(#${id}-${name})`;
  const coverProps = useAnimatedProps(() => ({ d: inkFront(coverageAt(kind, clock.value), clock.value / 1700) }), [kind, clock]);
  const brandMask = useAnimatedProps(() => ({ d: inkFront(smooth(400, 1400, clock.value), 0.7 + clock.value / 2000) }), [clock]);
  const materialProps = useAnimatedProps(() => ({ opacity: kind === 'death' ? 0.065 : kind === 'birth' ? 0.42 : 0.92 - 0.52 * smooth(1300, 2100, clock.value) }), [kind, clock]);
  const logoProps = useAnimatedProps(() => ({ opacity: kind === 'welcome' ? 1 : smooth(420, 650, clock.value) * (1 - smooth(1100, 1390, clock.value)) }), [kind, clock]);
  const lightProps = useAnimatedProps(() => ({ opacity: smooth(50, 450, clock.value) * (kind === 'death' ? 0.3 : 0.7) }), [kind, clock]);
  const birth = kind === 'birth';
  return <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" accessible={false}>
    <Defs>
      <LinearGradient id={`${id}-ground`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={birth ? '#F8F0DF' : NAVY} /><Stop offset="0.55" stopColor={birth ? '#FFF9ED' : '#0A2444'} /><Stop offset="1" stopColor={birth ? '#DDEEF7' : '#040E23'} />
      </LinearGradient>
      <LinearGradient id={`${id}-foil`} x1="0" y1="1" x2="0.9" y2="0">
        <Stop offset="0" stopColor={birth ? '#82B6CD' : '#725137'} /><Stop offset="0.25" stopColor={birth ? '#DAEFF3' : '#D5A459'} /><Stop offset="0.47" stopColor={birth ? '#8FBFD6' : '#FFE6B0'} /><Stop offset="0.63" stopColor={birth ? '#D8ECF4' : '#B57B3E'} /><Stop offset="0.83" stopColor={birth ? '#96C9DD' : '#F3D5A7'} /><Stop offset="1" stopColor={birth ? '#F9F0DC' : '#9A682E'} />
      </LinearGradient>
      <LinearGradient id={`${id}-brand`} x1="0" y1="0" x2="0.8" y2="1"><Stop offset="0" stopColor="#FFF5D7" /><Stop offset="0.52" stopColor="#FFE6B0" /><Stop offset="1" stopColor="#C99B58" /></LinearGradient>
      <RadialGradient id={`${id}-light`} cx="0.45" cy="0.47" rx="0.65" ry="0.45"><Stop offset="0" stopColor={birth ? '#FFFFFF' : '#D5A459'} stopOpacity={birth ? 0.7 : 0.14} /><Stop offset="1" stopColor={birth ? '#FFFFFF' : '#D5A459'} stopOpacity="0" /></RadialGradient>
      <ClipPath id={`${id}-cover`}><MovingPath animatedProps={coverProps} /></ClipPath>
      <ClipPath id={`${id}-wordmark`}><MovingPath animatedProps={brandMask} /></ClipPath>
    </Defs>
    <G clipPath={ref('cover')}>
      <Rect width="400" height="900" fill={ref('ground')} />
      <MovingGroup animatedProps={lightProps}><Rect width="400" height="900" fill={ref('light')} /></MovingGroup>
      <MovingGroup animatedProps={materialProps}>
        {kind === 'death' ? <Pour clock={clock} strand={0} thickness={0.88} fill={ref('foil')} opacity={0.46} /> : [0, 1].map(strand => <G key={strand}>
          <Pour clock={clock} strand={strand} thickness={1.55} fill={ref('foil')} opacity={0.08} />
          <Pour clock={clock} strand={strand} thickness={1.2} fill={ref('foil')} opacity={0.16} />
          <Pour clock={clock} strand={strand} thickness={0.88} fill={ref('foil')} opacity={0.46} />
          <Pour clock={clock} strand={strand} offset={-0.39} thickness={0.23} fill={ref('foil')} opacity={0.65} />
          <Pour clock={clock} strand={strand} offset={0.61} thickness={0.055} fill={birth ? '#FAF6E8' : '#FFE6B0'} opacity={0.6} />
          <Pour clock={clock} strand={strand} offset={-0.65} thickness={0.012} fill={birth ? '#FAF6E8' : '#FFE6B0'} opacity={0.8} />
        </G>)}
      </MovingGroup>
      {kind !== 'death' && <MovingGroup animatedProps={logoProps} clipPath={kind === 'welcome' ? ref('wordmark') : undefined}>
        <SvgText x="200" y="438" textAnchor="middle" fontFamily={brandFont} fontSize={birth ? 27 : 58} fontWeight="800" letterSpacing={birth ? -0.6 : -2.5} fill={birth ? '#17354F' : ref('brand')}>{birth ? 'A New Life Begins' : 'Dreams'}</SvgText>
        {!birth && <SvgText x="200" y="473" textAnchor="middle" fontFamily={brandFont} fontSize="11" fontWeight="500" letterSpacing="4.8" fill="#F3D5A7">LIFE SIMULATOR</SvgText>}
      </MovingGroup>}
      {kind === 'death' && <Embers clock={clock} />}
    </G>
  </Svg>;
}

const embers = [[58, 530], [102, 370], [163, 480], [227, 320], [285, 520], [343, 400]];
function Ember({ clock, index }: { clock: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => {
    const t = clock.value / 1800, [x, y] = embers[index], rise = t * (20 + index * 4);
    return { d: `M${x} ${y - rise}l1.2 -3l1.2 3l-1.2 3Z`, opacity: smooth(280 + index * 40, 800, clock.value) * (1 - smooth(850, 1550 - index * 40, clock.value)) * 0.65 };
  }, [clock, index]);
  return <MovingPath animatedProps={props} fill="#F3D5A7" />;
}
function Embers({ clock }: { clock: SharedValue<number> }) {
  return <>{embers.map((_, index) => <Ember clock={clock} index={index} key={index} />)}</>;
}
