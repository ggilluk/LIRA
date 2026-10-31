/** The phone's own real tilt/heading, wrapped for
 * `common/ui/gpu_canvas/scene_renderer.ts`'s own camera-textured cube
 * (its own `attachOrientation()`) -- owns exactly one `deviceorientation`
 * listener and the latest real `alpha`/`beta`/`gamma` reading it's
 * delivered. Deliberately hands back that raw reading, not a `Mat4` --
 * converting it into a rotation matrix (`mat4.ts`'s own
 * `deviceOrientationToRotation()`) is `scene_renderer.ts`'s own job,
 * the one file that actually owns `gpu_canvas/mat4.ts` and WebGPU
 * model-matrix concerns; a plain `common/data/` sensor class has no
 * business reaching into `common/ui/` for that, even within the same
 * Architectural Layer.
 *
 * `target`/`eventConstructor` are both constructor parameters with
 * real defaults (`window` itself), the same injectable-dependency
 * shape `camera_capture.ts`'s own `video`/`mediaDevices` use, and for
 * the same reason: jsdom (this project's own test environment) fires
 * no real `deviceorientation` events at all, so a test exercising this
 * class's own logic has to dispatch fake ones through a fake target
 * instead of waiting on real sensor hardware that doesn't exist in a
 * CI environment regardless of browser. */
export interface OrientationEventTargetLike {
  addEventListener(type: "deviceorientation", listener: (event: DeviceOrientationEventLike) => void): void;
  removeEventListener(type: "deviceorientation", listener: (event: DeviceOrientationEventLike) => void): void;
}

export interface DeviceOrientationEventLike {
  readonly alpha: number | null;
  readonly beta: number | null;
  readonly gamma: number | null;
}

/** iOS Safari's own real, non-standard extension -- a static
 * `requestPermission()` on the `DeviceOrientationEvent` constructor
 * itself, required there (and nowhere else) before `deviceorientation`
 * events fire at all. Not declared anywhere in TypeScript's own bundled
 * `lib.dom.d.ts` (confirmed the same way `console_commands/gpu.ts`'s
 * own WebGPU shim already found WebGPU itself isn't), hence the local
 * interface instead of the real DOM type. */
export interface DeviceOrientationEventConstructorLike {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export class DeviceOrientationSensor {
  private readonly target: OrientationEventTargetLike;
  private readonly eventConstructor: DeviceOrientationEventConstructorLike | undefined;
  private latest: { alpha: number; beta: number; gamma: number } | undefined;
  private listening = false;
  private readonly handleEvent = (event: DeviceOrientationEventLike): void => {
    // alpha/beta/gamma are each individually nullable per spec (a
    // device with no compass, or one that hasn't produced a first real
    // reading yet, reports null) -- discarded wholesale rather than
    // defaulting any one of them to 0, which would read as a real,
    // specific orientation (facing exactly north, perfectly level) no
    // sensor actually reported.
    if (event.alpha === null || event.beta === null || event.gamma === null) return;
    this.latest = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
  };

  constructor(
    target: OrientationEventTargetLike = window,
    eventConstructor: DeviceOrientationEventConstructorLike | undefined = (window as unknown as { DeviceOrientationEvent?: DeviceOrientationEventConstructorLike }).DeviceOrientationEvent,
  ) {
    this.target = target;
    this.eventConstructor = eventConstructor;
  }

  /** An unsupported browser (no `DeviceOrientationEvent` at all -- every
   * desktop browser, this project's own sandboxed headless Chromium
   * included) and a denied iOS permission prompt are both real,
   * entirely ordinary outcomes -- every one reported as a real, honest
   * `Error`, the same "throw for a genuine failure" convention
   * `CameraCapture.start()` already uses. `gpu_canvas_view.ts`'s own
   * call site treats every one of these as optional/non-fatal: the
   * camera cube keeps spinning on its own existing auto-rotation
   * fallback whether or not a real orientation reading is ever
   * available, so this class's own job stops at reporting the real
   * failure, not deciding what the rest of the scene does about it.
   *
   * Android Chrome (and most non-Safari browsers) need no permission
   * step at all -- `requestPermission` simply doesn't exist there, so
   * this skips straight to listening. */
  async start(): Promise<void> {
    if (!this.eventConstructor) throw new Error("Device orientation is not supported in this browser (DeviceOrientationEvent is undefined).");
    if (typeof this.eventConstructor.requestPermission === "function") {
      const result = await this.eventConstructor.requestPermission();
      if (result !== "granted") throw new Error(`Device orientation permission was not granted (${result}).`);
    }
    this.target.addEventListener("deviceorientation", this.handleEvent);
    this.listening = true;
  }

  /** The device's own latest real `alpha`/`beta`/`gamma` reading --
   * `undefined` until the first real `deviceorientation` event with
   * every one of the three actually populated arrives (which can take
   * a moment even after `start()` itself resolves, since resolving
   * only means the listener is attached, not that a first reading has
   * landed yet), not a fabricated `{alpha:0, beta:0, gamma:0}` standing
   * in for one. */
  get orientation(): { alpha: number; beta: number; gamma: number } | undefined {
    return this.latest;
  }

  get isReady(): boolean {
    return this.latest !== undefined;
  }

  /** Detaches the real listener -- safe to call repeatedly, or when
   * `start()` was never called or never succeeded. Unlike
   * `CameraCapture.stop()`, there's no hardware recording indicator or
   * other real-world side effect to release here; this exists purely
   * so a torn-down `GpuCanvasView` session doesn't leave a stale
   * listener (and the closure it holds) attached to `window` forever. */
  stop(): void {
    if (this.listening) this.target.removeEventListener("deviceorientation", this.handleEvent);
    this.listening = false;
    this.latest = undefined;
  }
}
