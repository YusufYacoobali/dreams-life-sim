/** Small affine transforms only; complex paths stay static during gameplay. */
export function svgMotion(
  x: number,
  y: number,
  rotation = 0,
  scaleX = 1,
  scaleY = scaleX,
  pivotX = 0,
  pivotY = 0,
): [number, number, number, number, number, number] {
  'worklet';
  const radians = (rotation * Math.PI) / 180,
    cos = rotation === 0 ? 1 : Math.cos(radians),
    sin = rotation === 0 ? 0 : Math.sin(radians);
  const a = cos * scaleX,
    b = sin * scaleX,
    c = -sin * scaleY,
    d = cos * scaleY;
  return [
    a,
    b,
    c,
    d,
    x + pivotX - a * pivotX - c * pivotY,
    y + pivotY - b * pivotX - d * pivotY,
  ];
}
/** Reanimated bypasses SVG's JS prop extraction on native updates. Fabric needs
 * `matrix`, while initial React rendering needs SVG's six-number `transform`.
 * Pass this function directly as the adapter; the old adapter factory is deprecated.
 */
export function nativeSvgProps(props: Record<string, unknown>) {
  'worklet';
  if (Array.isArray(props.transform) && props.transform.length === 6) {
    props.matrix = props.transform;
    delete props.transform;
  }
}
