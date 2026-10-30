/** Build capability for internal testing only; paid access is resolved by the purchase service. */
export function canAccessGodMode(build: { development: boolean; internalTesting: boolean }): boolean {
  return build.development === true || build.internalTesting === true;
}
