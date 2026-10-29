import { describe, expect, it, vi } from "vitest";
import { CameraCapture, type MediaDevicesLike, type VideoElementLike } from "./camera_capture";

/** `camera_capture.ts`'s own docstring on why a fake is needed at all
 * -- jsdom cannot decode media, so a real `<video>` element's own
 * `.play()` would throw here. `triggerLoadedData()` lets a test
 * control exactly when (if ever) the fake "camera" actually produces
 * a frame, including never, and `setDimensions()` lets a test choose
 * whether dimensions are already known by the time `.play()` resolves
 * (the fast path `waitForFirstFrame()` skips the event entirely for)
 * or only become known later (the path that actually waits). */
function fakeVideo(): VideoElementLike & { triggerLoadedData(): void; setDimensions(width: number, height: number): void } {
  let videoWidth = 0;
  let videoHeight = 0;
  const listeners = new Set<() => void>();
  return {
    muted: false,
    playsInline: false,
    srcObject: null,
    get videoWidth() {
      return videoWidth;
    },
    get videoHeight() {
      return videoHeight;
    },
    play: vi.fn(async () => {}),
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    setDimensions(width: number, height: number) {
      videoWidth = width;
      videoHeight = height;
    },
    triggerLoadedData() {
      for (const listener of [...listeners]) listener();
    },
  };
}

function fakeMediaDevices(stream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] } = { getTracks: () => [] }): MediaDevicesLike & { getUserMedia: ReturnType<typeof vi.fn> } {
  return { getUserMedia: vi.fn(async () => stream) };
}

describe("CameraCapture", () => {
  it("throws when the browser has no navigator.mediaDevices at all", async () => {
    const capture = new CameraCapture(fakeVideo(), undefined);
    await expect(capture.start()).rejects.toThrow(/Camera capture is not supported/);
  });

  it("propagates a getUserMedia() rejection (e.g. the user denying the permission prompt) as a real error", async () => {
    const mediaDevices: MediaDevicesLike = { getUserMedia: async () => { throw new Error("Permission denied"); } };
    const capture = new CameraCapture(fakeVideo(), mediaDevices);
    await expect(capture.start()).rejects.toThrow("Permission denied");
  });

  it("resolves immediately when the video element already has real dimensions by the time play() returns", async () => {
    const video = fakeVideo();
    video.setDimensions(640, 480);
    const capture = new CameraCapture(video, fakeMediaDevices());
    await capture.start();
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(capture.isReady).toBe(true);
    expect(capture.width).toBe(640);
    expect(capture.height).toBe(480);
  });

  it("waits for a real loadeddata frame when dimensions aren't known yet when play() returns", async () => {
    const video = fakeVideo();
    const capture = new CameraCapture(video, fakeMediaDevices());
    let started = false;
    const startPromise = capture.start().then(() => {
      started = true;
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(started).toBe(false); // still waiting -- no real frame yet
    expect(capture.isReady).toBe(false);

    video.setDimensions(1280, 720);
    video.triggerLoadedData();
    await startPromise;
    expect(started).toBe(true);
    expect(capture.isReady).toBe(true);
  });

  it("ignores a loadeddata event that fires before real dimensions are actually known", async () => {
    const video = fakeVideo();
    const capture = new CameraCapture(video, fakeMediaDevices());
    let started = false;
    const startPromise = capture.start().then(() => {
      started = true;
    });

    video.triggerLoadedData(); // fires with videoWidth/videoHeight still 0
    await Promise.resolve();
    expect(started).toBe(false);

    video.setDimensions(320, 240);
    video.triggerLoadedData();
    await startPromise;
    expect(started).toBe(true);
  });

  it("sets srcObject to the real stream returned by getUserMedia()", async () => {
    const stream = { getTracks: () => [] };
    const video = fakeVideo();
    video.setDimensions(100, 100);
    const capture = new CameraCapture(video, fakeMediaDevices(stream));
    await capture.start();
    expect(video.srcObject).toBe(stream);
  });

  it("stop() stops every real track and clears srcObject", async () => {
    const track = { stop: vi.fn() };
    const stream = { getTracks: () => [track] };
    const video = fakeVideo();
    video.setDimensions(100, 100);
    const capture = new CameraCapture(video, fakeMediaDevices(stream));
    await capture.start();

    capture.stop();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(video.srcObject).toBeNull();
  });

  it("stop() is safe to call when start() was never called at all", () => {
    const capture = new CameraCapture(fakeVideo(), fakeMediaDevices());
    expect(() => capture.stop()).not.toThrow();
  });

  it("isReady is false before start() ever resolves", () => {
    const capture = new CameraCapture(fakeVideo(), fakeMediaDevices());
    expect(capture.isReady).toBe(false);
  });
});
