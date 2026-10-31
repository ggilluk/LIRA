import { describe, expect, it, vi } from "vitest";
import { DeviceOrientationSensor, type DeviceOrientationEventConstructorLike, type DeviceOrientationEventLike, type OrientationEventTargetLike } from "./device_orientation";

/** `device_orientation.ts`'s own docstring on why a fake is needed at
 * all -- jsdom fires no real `deviceorientation` events. `dispatch()`
 * lets a test deliver an arbitrary (including partially-`null`)
 * reading on demand. */
function fakeTarget(): OrientationEventTargetLike & { dispatch(event: DeviceOrientationEventLike): void } {
  const listeners = new Set<(event: DeviceOrientationEventLike) => void>();
  return {
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    dispatch(event: DeviceOrientationEventLike) {
      for (const listener of [...listeners]) listener(event);
    },
  };
}

describe("DeviceOrientationSensor", () => {
  it("throws when the browser has no DeviceOrientationEvent at all (this project's own sandboxed headless Chromium, and every desktop browser)", async () => {
    const sensor = new DeviceOrientationSensor(fakeTarget(), undefined);
    await expect(sensor.start()).rejects.toThrow(/Device orientation is not supported/);
  });

  it("requests permission when the constructor exposes requestPermission() (iOS Safari's own real extension), and throws with the real result when it isn't granted", async () => {
    const eventConstructor: DeviceOrientationEventConstructorLike = { requestPermission: vi.fn(async (): Promise<"granted" | "denied"> => "denied") };
    const sensor = new DeviceOrientationSensor(fakeTarget(), eventConstructor);
    await expect(sensor.start()).rejects.toThrow(/permission was not granted \(denied\)/);
  });

  it("starts listening without ever calling requestPermission() when the constructor doesn't expose one (Android Chrome and most non-Safari browsers)", async () => {
    const target = fakeTarget();
    const sensor = new DeviceOrientationSensor(target, {});
    await sensor.start();
    target.dispatch({ alpha: 10, beta: 20, gamma: 30 });
    expect(sensor.orientation).toEqual({ alpha: 10, beta: 20, gamma: 30 });
  });

  it("starts listening once requestPermission() resolves 'granted'", async () => {
    const target = fakeTarget();
    const eventConstructor: DeviceOrientationEventConstructorLike = { requestPermission: vi.fn(async (): Promise<"granted" | "denied"> => "granted") };
    const sensor = new DeviceOrientationSensor(target, eventConstructor);
    await sensor.start();
    target.dispatch({ alpha: 1, beta: 2, gamma: 3 });
    expect(sensor.orientation).toEqual({ alpha: 1, beta: 2, gamma: 3 });
  });

  it("orientation is undefined until a real, fully-populated reading arrives", async () => {
    const target = fakeTarget();
    const sensor = new DeviceOrientationSensor(target, {});
    await sensor.start();
    expect(sensor.orientation).toBeUndefined();
    expect(sensor.isReady).toBe(false);
  });

  it("discards a reading where any of alpha/beta/gamma is null, rather than defaulting the missing one to 0", async () => {
    const target = fakeTarget();
    const sensor = new DeviceOrientationSensor(target, {});
    await sensor.start();
    target.dispatch({ alpha: null, beta: 20, gamma: 30 });
    expect(sensor.orientation).toBeUndefined();
    target.dispatch({ alpha: 10, beta: null, gamma: 30 });
    expect(sensor.orientation).toBeUndefined();
  });

  it("keeps the latest reading, overwriting an earlier one", async () => {
    const target = fakeTarget();
    const sensor = new DeviceOrientationSensor(target, {});
    await sensor.start();
    target.dispatch({ alpha: 1, beta: 1, gamma: 1 });
    target.dispatch({ alpha: 99, beta: 98, gamma: 97 });
    expect(sensor.orientation).toEqual({ alpha: 99, beta: 98, gamma: 97 });
  });

  it("stop() detaches the listener -- a later dispatch no longer updates orientation", async () => {
    const target = fakeTarget();
    const sensor = new DeviceOrientationSensor(target, {});
    await sensor.start();
    target.dispatch({ alpha: 1, beta: 2, gamma: 3 });
    sensor.stop();
    target.dispatch({ alpha: 50, beta: 60, gamma: 70 });
    expect(sensor.orientation).toBeUndefined(); // stop() also clears the last reading, not just future updates
  });

  it("stop() is safe to call when start() was never called at all", () => {
    const sensor = new DeviceOrientationSensor(fakeTarget(), {});
    expect(() => sensor.stop()).not.toThrow();
  });
});
