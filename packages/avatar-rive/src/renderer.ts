import RiveCanvas from '@rive-app/canvas-advanced';
import wasmUrl from '@rive-app/canvas-advanced/rive.wasm?url';
import characterUrl from '../../../assets/character/third-party/expressive-floating.riv?url';
import { clamp, type AvatarFrame } from '@amyu/avatar-contract';
import { diagnoseMappings, verifiedCapabilities, type RiveRigAdapter } from './rig';
import { inspectRiveFile, type AnimationMappingDiagnostic, type MappingDiagnostic, type RiveAssetInfo } from './inspection';
import { expressiveFloatingRig } from './expressive-floating';
import { diagnoseAnimationMappings, RiveAnimationMixer } from './animations';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type RiveFile = Awaited<ReturnType<Runtime['load']>>;
type Artboard = ReturnType<RiveFile['defaultArtboard']>;
type Renderer = ReturnType<Runtime['makeRenderer']>;
type Machine = InstanceType<Runtime['StateMachineInstance']>;
type NumberInput = ReturnType<Machine['input']>;

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
  private animationMixer?: RiveAnimationMixer;
  private animationDiagnostics: AnimationMappingDiagnostic[] = [];
  private inputs = new Map<string, NumberInput>();
  private disposed = false;
  private lastFrameTime?: number;
  private previousFrame?: AvatarFrame;
  private info!: RiveAssetInfo;
  private diagnostics: MappingDiagnostic[] = [];
  private pendingTriggers = new Set<string>();

  get assetInfo(): RiveAssetInfo { return this.info; }
  get mappingDiagnostics(): readonly MappingDiagnostic[] { return this.diagnostics; }
  get animationMappingDiagnostics(): readonly AnimationMappingDiagnostic[] { return this.animationDiagnostics; }
  get capabilities(): RiveAssetInfo['capabilities'] { return this.info.capabilities; }

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly adapter: RiveRigAdapter,
    private readonly onStats?: (stats: RiveRenderStats) => void,
  ) {
    this.rigId = adapter.id;
    this.inputNames = adapter.inputs.map((input) => input.name);
  }

  static async create(canvas: HTMLCanvasElement, options: RiveAvatarOptions = {}): Promise<RiveAvatarRenderer> {
    const instance = new RiveAvatarRenderer(canvas, options.adapter ?? expressiveFloatingRig, options.onStats);
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
      instance.artboard = instance.file.artboardByName(instance.adapter.artboard);
      if (!instance.artboard) throw new Error(`Missing artboard: ${instance.adapter.artboard}`);
      const definition = instance.artboard.stateMachineByName(instance.adapter.stateMachine);
      if (definition) {
        instance.machine = new runtime.StateMachineInstance(definition, instance.artboard);
        for (let index = 0; index < instance.machine.inputCount(); index++) {
          const input = instance.machine.input(index);
          if (input.type === 56) instance.inputs.set(input.name, input.asNumber());
          else if (input.type === 59) instance.inputs.set(input.name, input.asBool());
          else if (input.type === 58) instance.inputs.set(input.name, input.asTrigger());
        }
      }
      const discovered = inspectRiveFile(runtime, instance.file);
      const activeInputs = discovered.stateMachines.find((item) => item.artboard === instance.adapter.artboard && item.name === instance.adapter.stateMachine)?.inputs ?? [];
      instance.info = {
        attribution: instance.adapter.attribution, framing: instance.adapter.framing,
        renderer: 'Rive Canvas2D', runtimeVersion: '2.44.0', assetUrl: options.assetUrl ?? characterUrl,
        adapterId: instance.adapter.id, artboard: instance.adapter.artboard,
        stateMachine: definition ? instance.adapter.stateMachine : null, viewModel: null,
        ...discovered, inputs: activeInputs,
        capabilities: verifiedCapabilities(instance.adapter, activeInputs, discovered.animations),
        animationMappings: diagnoseAnimationMappings(instance.adapter, discovered.animations),
      };
      instance.diagnostics = diagnoseMappings(instance.adapter, activeInputs);
      instance.animationDiagnostics = instance.info.animationMappings;
      instance.animationMixer = new RiveAnimationMixer(runtime, instance.artboard, instance.adapter);
      instance.renderer = runtime.makeRenderer(canvas);
      instance.artboard.advance(0);
      instance.resize();
      return instance;
    } catch (error) {
      instance.dispose();
      throw error;
    }
  }

  getMappingDiagnostics(frame: AvatarFrame): MappingDiagnostic[] {
    return diagnoseMappings(this.adapter, this.info.inputs, frame, this.previousFrame);
  }

  getAnimationMappingDiagnostics(frame: AvatarFrame): AnimationMappingDiagnostic[] {
    return diagnoseAnimationMappings(this.adapter, this.info.animations, frame);
  }

  /** A local semantic reaction; callers never know the artwork's trigger name. */
  reactToClick(): void {
    if (this.disposed) return;
    for (const name of this.adapter.mapInteraction?.('click') ?? []) this.pendingTriggers.add(name);
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
    this.animationDiagnostics = this.getAnimationMappingDiagnostics(frame);
    this.animationMixer?.apply(this.animationDiagnostics, elapsed, 'baseline');
    this.machine?.advanceAndApply(elapsed);
    // Reassert deterministic authored baseline after native SM clocks. This also
    // resets any clip targets not driven by that native state's animation.
    this.animationMixer?.resetToRest();
    this.animationMixer?.apply(this.animationDiagnostics, 0, 'baseline');
    this.animationMixer?.apply(this.animationDiagnostics, elapsed, 'overlay');
    this.artboard.advance(elapsed);
    const advanced = performance.now();
    this.renderer.clear();
    if (frame.presence !== 'hidden') {
      this.renderer.save();
      this.renderer.align(
        this.runtime.Fit.contain,
        this.runtime.Alignment.center,
        { minX: 0, minY: 0, maxX: this.canvas.width, maxY: this.canvas.height },
        this.adapter.framing?.bounds ?? this.artboard.bounds,
      );
      this.artboard.draw(this.renderer);
      this.renderer.restore();
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
    this.inputs.clear();
    this.pendingTriggers.clear();
    this.previousFrame = undefined;
    this.animationMixer?.dispose();
    this.animationMixer = undefined;
    this.animationDiagnostics = [];
    this.machine?.delete();
    this.artboard?.delete();
    this.file?.unref();
    this.renderer?.delete();
    this.machine = undefined;
    this.artboard = undefined;
    this.file = undefined;
    this.renderer = undefined;
    this.runtime = undefined;
  }
}
