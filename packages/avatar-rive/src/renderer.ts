import RiveCanvas from '@rive-app/canvas-advanced';
import wasmUrl from '@rive-app/canvas-advanced/rive.wasm?url';
import characterUrl from '../../../assets/character/third-party/friendly-floating-bot.riv?url';
import { clamp, type AvatarFrame } from '@amyu/avatar-contract';
import { diagnoseMappings, verifiedCapabilities, type RiveRigAdapter } from './rig';
import { inspectRiveFile, type AnimationMappingDiagnostic, type MappingDiagnostic, type RiveAssetInfo } from './inspection';
import { friendlyFloatingBotRig } from './friendly-floating-bot';
import { diagnoseAnimationMappings, RiveAnimationMixer } from './animations';
import { RiveViewModelBinding } from './view-model';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type RiveFile = Awaited<ReturnType<Runtime['load']>>;
type Artboard = ReturnType<RiveFile['defaultArtboard']>;
type Renderer = ReturnType<Runtime['makeRenderer']>;
type Machine = InstanceType<Runtime['StateMachineInstance']>;
type NumberInput = ReturnType<Machine['input']>;
type AnimationInstance = InstanceType<Runtime['LinearAnimationInstance']>;
// CanvasRenderPath is an Embind-owned object; Rive's declaration omits delete().
type FramingPath = ReturnType<Runtime['renderFactory']['makeRenderPath']> & { delete(): void };

interface RivePlayback {
  artboard: Artboard;
  machine?: Machine;
  inputs: Map<string, NumberInput>;
  animationMixer: RiveAnimationMixer;
  viewModelBinding?: RiveViewModelBinding;
}

export interface RiveAnimationPreview {
  name: string;
  progress: number;
  mix: number;
  baseline?: 'serialized' | 'neutral';
}

let runtimePromise: Promise<Runtime> | undefined;
function loadRuntime(): Promise<Runtime> {
  // Vite serves the matching WASM locally in development and copies it in builds.
  // No CDN request, API key, or network connection is required after installation.
  runtimePromise ??= RiveCanvas({ locateFile: () => wasmUrl }).catch((error: unknown) => {
    runtimePromise = undefined;
    throw error;
  });
  return runtimePromise;
}

export interface RiveAvatarOptions {
  assetUrl?: string;
  adapter?: RiveRigAdapter;
  signal?: AbortSignal;
  onStats?: (stats: RiveRenderStats) => void;
}

export interface RiveRenderStats {
  advanceMs: number;
  drawMs: number;
  frameTimeMs: number;
}

/** The renderer owns WASM resources; the application owns the animation clock. */
export class RiveAvatarRenderer {
  readonly rigId: string;
  readonly inputNames: readonly string[];
  private runtime?: Runtime;
  private file?: RiveFile;
  private artboard?: Artboard;
  private machine?: Machine;
  private renderer?: Renderer;
  private framingPath?: FramingPath;
  private animationMixer?: RiveAnimationMixer;
  private animationDiagnostics: AnimationMappingDiagnostic[] = [];
  private inputs = new Map<string, NumberInput>();
  private disposed = false;
  private lastFrameTime?: number;
  private previousFrame?: AvatarFrame;
  private info!: RiveAssetInfo;
  private diagnostics: MappingDiagnostic[] = [];
  private pendingTriggers = new Set<string>();
  private preview: RiveAnimationPreview | null = null;
  private previewArtboard?: Artboard;
  private previewAnimation?: AnimationInstance;
  private viewModelBinding?: RiveViewModelBinding;

  get assetInfo(): RiveAssetInfo { return this.info; }
  get mappingDiagnostics(): readonly MappingDiagnostic[] { return this.diagnostics; }
  get animationMappingDiagnostics(): readonly AnimationMappingDiagnostic[] { return this.animationDiagnostics; }
  get capabilities(): RiveAssetInfo['capabilities'] { return this.info.capabilities; }
  get animationPreview(): RiveAnimationPreview | null { return this.preview ? { ...this.preview } : null; }

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly adapter: RiveRigAdapter,
    private readonly onStats?: (stats: RiveRenderStats) => void,
  ) {
    this.rigId = adapter.id;
    this.inputNames = adapter.inputs.map((input) => input.name);
  }

  static async create(canvas: HTMLCanvasElement, options: RiveAvatarOptions = {}): Promise<RiveAvatarRenderer> {
    const instance = new RiveAvatarRenderer(canvas, options.adapter ?? friendlyFloatingBotRig, options.onStats);
    try {
      options.signal?.throwIfAborted();
      const [runtime, response] = await Promise.all([
        loadRuntime(),
        fetch(options.assetUrl ?? characterUrl, { signal: options.signal }),
      ]);
      if (!response.ok) throw new Error(`Character asset could not be loaded (${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      options.signal?.throwIfAborted();
      instance.runtime = runtime;
      instance.file = await runtime.load(bytes, undefined, false);
      options.signal?.throwIfAborted();
      if (!instance.file) throw new Error('The character is not a supported Rive file.');
      instance.installPlayback(instance.createPlayback());
      const discovered = inspectRiveFile(runtime, instance.file);
      const activeInputs = discovered.stateMachines.find((item) => item.artboard === instance.adapter.artboard && item.name === instance.adapter.stateMachine)?.inputs ?? [];
      instance.info = {
        stateMachinePlayback: instance.adapter.stateMachinePlayback ?? 'native',
        reviewSupport: instance.adapter.reviewSupport,
        attribution: instance.adapter.attribution, framing: instance.adapter.framing,
        renderer: 'Rive Canvas2D', runtimeVersion: '2.44.0', assetUrl: options.assetUrl ?? characterUrl,
        adapterId: instance.adapter.id, artboard: instance.adapter.artboard,
        stateMachine: instance.machine ? instance.adapter.stateMachine : null,
        viewModel: instance.viewModelBinding?.info.status === 'MAPPED' ? instance.viewModelBinding.info.model : null,
        viewModelBinding: instance.viewModelBinding?.info,
        nativePointerEvents: instance.adapter.nativePointerEvents === true && instance.viewModelBinding?.info.status === 'MAPPED',
        ...discovered, inputs: activeInputs,
        capabilities: verifiedCapabilities(instance.adapter, activeInputs, discovered.animations),
        animationMappings: diagnoseAnimationMappings(instance.adapter, discovered.animations),
      };
      instance.diagnostics = diagnoseMappings(instance.adapter, activeInputs);
      instance.animationDiagnostics = instance.info.animationMappings;
      instance.renderer = runtime.makeRenderer(canvas);
      const bounds = instance.adapter.framing?.bounds;
      if (bounds) {
        const path = runtime.renderFactory.makeRenderPath() as FramingPath;
        instance.framingPath = path;
        path.moveTo(bounds.minX, bounds.minY);
        path.lineTo(bounds.maxX, bounds.minY);
        path.lineTo(bounds.maxX, bounds.maxY);
        path.lineTo(bounds.minX, bounds.maxY);
        path.close();
      }
      instance.resize();
      return instance;
    } catch (error) {
      instance.dispose();
      throw error;
    }
  }

  /** Restart artwork clocks/VM/native state; the caller owns semantic idle state. */
  reset(): void {
    if (this.disposed || !this.runtime || !this.file) return;
    // Prepare first so a failed native allocation does not destroy the live rig.
    const playback = this.createPlayback();
    this.disposePlayback();
    this.installPlayback(playback);
    this.pendingTriggers.clear();
    this.lastFrameTime = undefined;
    this.previousFrame = undefined;
    this.diagnostics = diagnoseMappings(this.adapter, this.info.inputs);
    this.animationDiagnostics = diagnoseAnimationMappings(this.adapter, this.info.animations);
    Object.assign(this.info, {
      stateMachine: this.machine ? this.adapter.stateMachine : null,
      viewModel: this.viewModelBinding?.info.status === 'MAPPED' ? this.viewModelBinding.info.model : null,
      viewModelBinding: this.viewModelBinding?.info,
      nativePointerEvents: this.adapter.nativePointerEvents === true && this.viewModelBinding?.info.status === 'MAPPED',
    });
  }

  private createPlayback(): RivePlayback {
    if (!this.file || !this.runtime) throw new Error('The Rive avatar file is not loaded.');
    const artboard = this.file.artboardByName(this.adapter.artboard);
    if (!artboard) throw new Error(`Missing artboard: ${this.adapter.artboard}`);
    let machine: Machine | undefined;
    let animationMixer: RiveAnimationMixer | undefined;
    let viewModelBinding: RiveViewModelBinding | undefined;
    try {
      const definition = artboard.stateMachineByName(this.adapter.stateMachine);
      const inputs = new Map<string, NumberInput>();
      if (definition) {
        machine = new this.runtime.StateMachineInstance(definition, artboard);
        for (let index = 0; index < machine.inputCount(); index++) {
          const input = machine.input(index);
          if (input.type === 56) inputs.set(input.name, input.asNumber());
          else if (input.type === 59) inputs.set(input.name, input.asBool());
          else if (input.type === 58) inputs.set(input.name, input.asTrigger());
        }
      }
      if (this.adapter.viewModel) viewModelBinding = new RiveViewModelBinding(this.file, artboard, machine, this.adapter.viewModel);
      animationMixer = new RiveAnimationMixer(this.runtime, artboard, this.adapter);
      artboard.advance(0);
      return { artboard, machine, inputs, animationMixer, viewModelBinding };
    } catch (error) {
      animationMixer?.dispose(); machine?.delete(); artboard.delete(); viewModelBinding?.dispose();
      throw error;
    }
  }

  private installPlayback(playback: RivePlayback): void {
    this.artboard = playback.artboard; this.machine = playback.machine;
    this.inputs = playback.inputs; this.animationMixer = playback.animationMixer;
    this.viewModelBinding = playback.viewModelBinding;
  }

  private disposePlayback(): void {
    this.inputs.clear();
    this.previewAnimation?.delete(); this.previewAnimation = undefined;
    this.previewArtboard?.delete(); this.previewArtboard = undefined; this.preview = null;
    this.animationMixer?.dispose(); this.animationMixer = undefined;
    this.machine?.delete(); this.machine = undefined;
    this.artboard?.delete(); this.artboard = undefined;
    this.viewModelBinding?.dispose(); this.viewModelBinding = undefined;
  }

  getMappingDiagnostics(frame: AvatarFrame): MappingDiagnostic[] {
    return diagnoseMappings(this.adapter, this.info.inputs, frame, this.previousFrame).map((item) => ({
      ...item, applied: !this.preview && this.info.stateMachinePlayback === 'native' && item.status === 'MAPPED',
      ...((this.preview || this.info.stateMachinePlayback === 'authored-only') ? {
        reason: this.preview ? 'Native playback bypassed during solo timeline preview.' : 'Input exists; this adapter executes authored timelines and bypasses the native state machine.',
      } : {}),
    }));
  }

  getAnimationMappingDiagnostics(frame: AvatarFrame): AnimationMappingDiagnostic[] {
    if (this.preview) return [{ control: 'solo authored timeline preview', animation: this.preview.name, status: 'MAPPED', mix: this.preview.mix, progress: this.preview.progress }];
    const mapped = diagnoseAnimationMappings(this.adapter, this.info.animations, frame);
    return this.animationMixer?.inspect(mapped) ?? mapped;
  }

  /** Development review only: fresh serialized artboard for every scrub/mix. */
  setAnimationPreview(preview: RiveAnimationPreview | null): void {
    if (this.disposed || !this.file || !this.runtime) return;
    this.previewAnimation?.delete(); this.previewAnimation = undefined;
    this.previewArtboard?.delete(); this.previewArtboard = undefined;
    this.preview = null;
    if (!preview) return;
    const timing = this.info.animationTimings.find((item) => item.artboard === this.adapter.artboard && item.name === preview.name);
    if (!timing) throw new Error(`Cannot preview missing authored animation: ${preview.name}`);
    const board = this.file.artboardByName(this.adapter.artboard);
    try {
      if (preview.baseline !== 'serialized') {
        for (const baseline of this.adapter.previewBaseline ?? []) {
          const definition = board.animationByName(baseline.name);
          const metadata = this.info.animationTimings.find((item) => item.artboard === this.adapter.artboard && item.name === baseline.name);
          if (!definition || !metadata) continue;
          const clip = new this.runtime.LinearAnimationInstance(definition, board);
          try {
            clip.time = metadata.startSeconds + (metadata.endSeconds - metadata.startSeconds) * clamp(baseline.progress);
            clip.advance(0); clip.apply(clamp(baseline.mix ?? 1));
          } finally { clip.delete(); }
        }
      }
      const clip = new this.runtime.LinearAnimationInstance(board.animationByName(preview.name), board);
      clip.time = timing.startSeconds + (timing.endSeconds - timing.startSeconds) * clamp(preview.progress);
      clip.advance(0); clip.apply(clamp(preview.mix)); board.advance(0);
      this.previewArtboard = board; this.previewAnimation = clip;
      this.preview = { ...preview, progress: clamp(preview.progress), mix: clamp(preview.mix) };
    } catch (error) { board.delete(); throw error; }
  }

  /** A local semantic reaction; callers never know the artwork's trigger name. */
  reactToClick(): void {
    if (this.disposed) return;
    this.viewModelBinding?.reactToClick();
    for (const name of this.adapter.mapInteraction?.('click') ?? []) this.pendingTriggers.add(name);
  }

  /** CSS coordinates relative to the canvas, converted through its real layout. */
  forwardPointer(kind: 'down' | 'move' | 'up' | 'exit', x: number, y: number, id = 0): boolean {
    if (this.disposed || this.preview || !this.machine || !this.artboard || !this.info.nativePointerEvents || this.info.stateMachinePlayback !== 'native') return false;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    const rect = this.canvas.getBoundingClientRect();
    const bounds = this.adapter.framing?.bounds ?? this.artboard.bounds;
    const width = bounds.maxX - bounds.minX; const height = bounds.maxY - bounds.minY;
    const scale = Math.min(rect.width / width, rect.height / height);
    if (!(scale > 0)) return false;
    const worldX = (x - (rect.width - width * scale) / 2) / scale + bounds.minX;
    const worldY = (y - (rect.height - height * scale) / 2) / scale + bounds.minY;
    if (kind === 'down') this.machine.pointerDown(worldX, worldY, id);
    else if (kind === 'move') this.machine.pointerMove(worldX, worldY, id);
    else if (kind === 'up') this.machine.pointerUp(worldX, worldY, id);
    else this.machine.pointerExit(worldX, worldY, id);
    return true;
  }

  resize(pixelRatio = window.devicePixelRatio || 1): void {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const ratio = clamp(pixelRatio, 1, 3);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
  }

  render(frame: AvatarFrame, deltaMs?: number): RiveRenderStats {
    if (this.disposed || !this.runtime || !this.artboard || !this.renderer) {
      throw new Error('The Rive avatar renderer is not active.');
    }
    const start = performance.now();
    const elapsed = clamp(deltaMs ?? (this.lastFrameTime === undefined ? 16.67 : frame.timeMs - this.lastFrameTime), 0, 64) / 1000;
    this.lastFrameTime = frame.timeMs;
    this.diagnostics = this.getMappingDiagnostics(frame);
    for (const diagnostic of this.diagnostics) {
      if (diagnostic.status !== 'MAPPED') continue;
      const input = this.inputs.get(diagnostic.input);
      if (!input) continue;
      if (diagnostic.expectedType === 'trigger') {
        if (diagnostic.value === true) input.fire();
      } else input.value = diagnostic.value;
    }
    for (const name of this.pendingTriggers) {
      const input = this.inputs.get(name);
      if (input?.type === 58) input.fire();
    }
    this.pendingTriggers.clear();
    if (!this.preview) this.viewModelBinding?.applyPending();
    this.animationDiagnostics = this.preview ? this.getAnimationMappingDiagnostics(frame) : diagnoseAnimationMappings(this.adapter, this.info.animations, frame);
    if (!this.preview) {
      this.animationMixer?.apply(this.animationDiagnostics, elapsed, 'baseline');
      if (this.info.stateMachinePlayback === 'native') this.machine?.advanceAndApply(elapsed);
      // Reassert deterministic authored baseline after native SM clocks. This
      // also restores targets absent from idle before mixing semantic overlays.
      this.animationMixer?.resetToRest();
      this.animationMixer?.apply(this.animationDiagnostics, 0, 'baseline');
      this.animationMixer?.apply(this.animationDiagnostics, elapsed, 'overlay');
      this.artboard.advance(elapsed);
      this.animationDiagnostics = this.animationMixer?.inspect(this.animationDiagnostics) ?? this.animationDiagnostics;
    }
    const drawingArtboard = this.previewArtboard ?? this.artboard;
    const advanced = performance.now();
    this.renderer.clear();
    if (frame.presence !== 'hidden') {
      this.renderer.save();
      this.renderer.align(
        this.runtime.Fit.contain,
        this.runtime.Alignment.center,
        { minX: 0, minY: 0, maxX: this.canvas.width, maxY: this.canvas.height },
        this.adapter.framing?.bounds ?? drawingArtboard.bounds,
      );
      try {
        // Alignment changes the transform only. Clip in the same artwork space
        // so letterboxing never exposes the source asset's surrounding demo UI.
        if (this.framingPath) this.renderer.clipPath(this.framingPath);
        drawingArtboard.draw(this.renderer);
      } finally { this.renderer.restore(); }
    }
    // Required when rendering inside the caller's browser requestAnimationFrame.
    this.runtime.resolveAnimationFrame();
    this.previousFrame = frame;
    const finished = performance.now();
    const stats = { advanceMs: advanced - start, drawMs: finished - advanced, frameTimeMs: finished - start };
    this.onStats?.(stats);
    return stats;
  }

  /** Safe under React StrictMode unmounts and asynchronous mount cancellation. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pendingTriggers.clear();
    this.previousFrame = undefined;
    this.lastFrameTime = undefined;
    this.disposePlayback();
    this.animationDiagnostics = [];
    this.file?.unref();
    this.framingPath?.delete();
    this.framingPath = undefined;
    this.renderer?.delete();
    this.file = undefined;
    this.renderer = undefined;
    this.runtime = undefined;
  }
}
