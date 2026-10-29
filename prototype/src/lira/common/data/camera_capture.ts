/** A live camera feed, wrapped for `common/ui/gpu_canvas/scene_renderer.ts`'s
 * own camera-textured cube (its own `attachCamera()`) -- owns exactly
 * one `getUserMedia()` `MediaStream` and the `<video>` element it
 * plays into. The video element is created but never attached to the
 * document: a WebGPU texture copy reads frames straight off the
 * element itself (`GPUQueue.copyExternalImageToTexture()`'s own
 * `source` parameter), so no visible `<video>` tag anywhere in the DOM
 * is needed for this to work.
 *
 * `video`/`mediaDevices` are both constructor parameters with real
 * defaults (a freshly created `<video>` element, `navigator.mediaDevices`)
 * rather than reached for directly -- the same injectable-dependency
 * shape `scene.ts`'s own `RandomSource` uses, and for the same reason:
 * jsdom (this project's own test environment) cannot actually decode
 * media at all (`.play()` on a real `<video>` element throws there),
 * so a test exercising this class's own logic has to supply a fake
 * `VideoElementLike` instead of a real DOM element. */
export interface VideoElementLike {
  muted: boolean;
  playsInline: boolean;
  srcObject: unknown;
  readonly videoWidth: number;
  readonly videoHeight: number;
  play(): Promise<void>;
  addEventListener(type: "loadeddata", listener: () => void): void;
  removeEventListener(type: "loadeddata", listener: () => void): void;
}

export interface MediaDevicesLike {
  getUserMedia(constraints: { video: boolean; audio: boolean }): Promise<MediaStreamLike>;
}

export interface MediaStreamLike {
  getTracks(): readonly { stop(): void }[];
}

export class CameraCapture {
  private readonly video: VideoElementLike;
  private readonly mediaDevices: MediaDevicesLike | undefined;
  private stream: MediaStreamLike | undefined;

  constructor(video: VideoElementLike = document.createElement("video"), mediaDevices: MediaDevicesLike | undefined = navigator.mediaDevices) {
    this.video = video;
    this.video.muted = true; // required for autoplay in every real browser that still allows it without a user gesture
    this.video.playsInline = true; // iOS Safari would otherwise force fullscreen playback on .play()
    this.mediaDevices = mediaDevices;
  }

  /** Unsupported browsers, no camera hardware, and a denied permission
   * prompt are all real, entirely ordinary outcomes -- every one
   * reported as a real, honest `Error` rather than silently leaving a
   * texture-less cube with no explanation. `gpu_canvas_view.ts`'s own
   * call site treats every one of these as optional/non-fatal: the
   * cube/sphere scene itself keeps rendering whether or not a camera
   * is ever available, so this class's own job stops at reporting the
   * real failure, not deciding what the rest of the Canvas tab does
   * about it. */
  async start(): Promise<void> {
    if (!this.mediaDevices) throw new Error("Camera capture is not supported in this browser (navigator.mediaDevices is undefined).");
    this.stream = await this.mediaDevices.getUserMedia({ video: true, audio: false });
    this.video.srcObject = this.stream;
    await this.video.play();
    await waitForFirstFrame(this.video);
  }

  /** The live `<video>` element itself -- `scene_renderer.ts`'s own
   * `copyExternalImageToTexture()` source. Typed as `unknown` here,
   * not `HTMLVideoElement`: a test substituting a fake
   * `VideoElementLike` has no real `HTMLVideoElement` to return, and
   * `webgpu_types.ts`'s own `copyExternalImageToTexture()` shim
   * already takes its `source` parameter as `unknown` too (this
   * class's own docstring on why), so nothing downstream actually
   * needs the stricter type. */
  get element(): unknown {
    return this.video;
  }

  /** `true` once the video element actually has a decoded frame to
   * read -- `start()` itself already awaits this before resolving, so
   * in ordinary use this is `true` by the time `start()`'s own
   * `Promise` settles; exposed anyway as a cheap, synchronous check
   * `scene_renderer.ts` can poll per frame rather than caching a
   * stale assumption. */
  get isReady(): boolean {
    return this.video.videoWidth > 0 && this.video.videoHeight > 0;
  }

  get width(): number {
    return this.video.videoWidth;
  }

  get height(): number {
    return this.video.videoHeight;
  }

  /** Stops every real hardware track this capture holds -- the actual
   * point of calling this at all. Merely dropping this object's own
   * reference (or letting `GpuCanvasView` unmount) does *not* release
   * the camera or turn off a device's own hardware recording
   * indicator on its own; only stopping every `MediaStreamTrack`
   * does. Safe to call repeatedly, or when `start()` was never called
   * or never succeeded. */
  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.video.srcObject = null;
  }
}

function waitForFirstFrame(video: VideoElementLike): Promise<void> {
  if (video.videoWidth > 0 && video.videoHeight > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const onLoadedData = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) return; // some browsers fire loadeddata once before real dimensions are known
      video.removeEventListener("loadeddata", onLoadedData);
      resolve();
    };
    video.addEventListener("loadeddata", onLoadedData);
  });
}
