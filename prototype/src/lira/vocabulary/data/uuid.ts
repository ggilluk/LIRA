/** A random v4 UUID, browser-native (crypto.randomUUID(), available in
 * every secure context and in Vitest's jsdom environment) -- the
 * browser-port equivalent of Python's `uuid.uuid4()`, used everywhere
 * the Python code calls `str(uuid_module.uuid4())`. */
export function newUuid(): string {
  return crypto.randomUUID();
}
