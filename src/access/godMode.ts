/** Access is separate from edit commands. Future verified entitlements belong here. */
export function canAccessGodMode(build: { development: boolean; internalTesting: boolean }): boolean {
  return build.development === true || build.internalTesting === true;
}
