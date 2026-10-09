/** Own-property checks supported by both Lynx JavaScript runtimes. */
export function hasOwn(object: object, key: PropertyKey): boolean {
  // biome-ignore lint/suspicious/noPrototypeBuiltins: Lynx hosts may not implement Object.hasOwn.
  return Object.prototype.hasOwnProperty.call(object, key);
}
