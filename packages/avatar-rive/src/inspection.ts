import type RiveCanvas from '@rive-app/canvas-advanced';
import type { AvatarCapabilities, ConversationState, Emotion } from '@amyu/avatar-contract';
import type { RiveViewModelBindingInfo } from './view-model';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type RiveFile = Awaited<ReturnType<Runtime['load']>>;

export type RiveInputType = 'number' | 'boolean' | 'trigger' | 'unknown';
export interface DiscoveredRiveInput { name: string; type: RiveInputType; typeId: number }
export interface DiscoveredViewModelProperty { name: string; type: string; enumName?: string }
export interface MappingDiagnostic {
  control: string;
  input: string;
  expectedType: RiveInputType;
  actualType: RiveInputType | null;
  status: 'MAPPED' | 'UNMAPPED';
  reason?: string;
  value?: number | boolean;
  applied?: boolean;
}
export interface DiscoveredRiveAnimationTiming {
  artboard: string; name: string; fps: number; durationFrames: number; durationSeconds: number;
  workAreaEnabled: boolean; workStartFrames: number | null; workEndFrames: number | null;
  startSeconds: number; endSeconds: number; loopValue: number; speed: number;
}
export interface RiveReviewSupport {
  states: Partial<Record<ConversationState, { status: 'supported' | 'partial' | 'unsupported'; note: string }>>;
  emotions: Partial<Record<Emotion, { status: 'supported' | 'partial' | 'unsupported'; note: string }>>;
}
export interface AnimationMappingDiagnostic {
  control: string;
  animation: string;
  status: 'MAPPED' | 'UNMAPPED';
  mix: number;
  progress?: number;
  speed?: number;
  reason?: string;
}
export interface RiveAssetAttribution {
  title: string; creator: string; sourceUrl: string; license: string; licenseUrl: string;
}
export interface RiveFraming {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  source: string;
}
export interface RiveAssetInfo {
  stateMachinePlayback: 'native' | 'authored-only';
  reviewSupport?: RiveReviewSupport;
  framing?: RiveFraming;
  attribution?: RiveAssetAttribution;
  renderer: 'Rive Canvas2D';
  runtimeVersion: string;
  assetUrl: string;
  adapterId: string;
  artboard: string;
  stateMachine: string | null;
  viewModel: string | null;
  viewModelBinding?: RiveViewModelBindingInfo;
  nativePointerEvents?: boolean;
  artboards: string[];
  stateMachines: Array<{ artboard: string; name: string; inputs: DiscoveredRiveInput[] }>;
  inputs: DiscoveredRiveInput[];
  animations: Array<{ artboard: string; name: string }>;
  animationTimings: DiscoveredRiveAnimationTiming[];
  animationMappings: AnimationMappingDiagnostic[];
  viewModels: Array<{ name: string; properties: DiscoveredViewModelProperty[]; instances: string[] }>;
  bindings: { status: 'unknown'; note: string };
  availableStates: { status: 'unknown'; names: string[]; note: string };
  capabilities: AvatarCapabilities;
}

export function inputType(typeId: number): RiveInputType {
  return typeId === 56 ? 'number' : typeId === 59 ? 'boolean' : typeId === 58 ? 'trigger' : 'unknown';
}

/** Inspect actual runtime objects. Never interpret animation names as SM states. */
export function inspectRiveFile(
  runtime: Runtime,
  file: RiveFile,
): Pick<RiveAssetInfo, 'artboards' | 'stateMachines' | 'animations' | 'animationTimings' | 'viewModels' | 'bindings' | 'availableStates'> {
  const artboards: string[] = [];
  const stateMachines: RiveAssetInfo['stateMachines'] = [];
  const animations: RiveAssetInfo['animations'] = [];
  const animationTimings: DiscoveredRiveAnimationTiming[] = [];
  for (let index = 0; index < file.artboardCount(); index++) {
    const artboard = file.artboardByIndex(index);
    try {
      artboards.push(artboard.name);
      for (let animationIndex = 0; animationIndex < artboard.animationCount(); animationIndex++) {
        const definition = artboard.animationByIndex(animationIndex);
        animations.push({ artboard: artboard.name, name: definition.name });
        // Actual 2.44.0 timing getters are on LinearAnimation, although its d.ts
        // assigns them to LinearAnimationInstance. Verified in the binary audit.
        const timing = definition as unknown as {
          fps: number; duration: number; enableWorkArea: boolean; workStart: number;
          workEnd: number; loopValue: number; speed: number;
        };
        animationTimings.push({
          artboard: artboard.name, name: definition.name, fps: timing.fps,
          durationFrames: timing.duration, durationSeconds: timing.duration / timing.fps,
          workAreaEnabled: timing.enableWorkArea,
          workStartFrames: timing.enableWorkArea ? timing.workStart : null,
          workEndFrames: timing.enableWorkArea ? timing.workEnd : null,
          startSeconds: timing.enableWorkArea ? timing.workStart / timing.fps : 0,
          endSeconds: (timing.enableWorkArea ? timing.workEnd : timing.duration) / timing.fps,
          loopValue: timing.loopValue, speed: timing.speed,
        });
      }
      for (let machineIndex = 0; machineIndex < artboard.stateMachineCount(); machineIndex++) {
        const definition = artboard.stateMachineByIndex(machineIndex);
        const instance = new runtime.StateMachineInstance(definition, artboard);
        try {
          const inputs: DiscoveredRiveInput[] = [];
          for (let inputIndex = 0; inputIndex < instance.inputCount(); inputIndex++) {
            const input = instance.input(inputIndex);
            inputs.push({ name: input.name, type: inputType(input.type), typeId: input.type });
          }
          stateMachines.push({ artboard: artboard.name, name: definition.name, inputs });
        } finally { instance.delete(); }
      }
    } finally { artboard.delete(); }
  }
  const viewModels: RiveAssetInfo['viewModels'] = [];
  for (let index = 0; index < file.viewModelCount(); index++) {
    const model = file.viewModelByIndex(index);
    viewModels.push({ name: model.name, properties: model.getProperties(), instances: model.getInstanceNames() });
  }
  return {
    artboards, stateMachines, animations, animationTimings, viewModels,
    bindings: { status: 'unknown', note: 'Rive 2.44.0 exposes ViewModel properties but cannot enumerate which artwork properties are bound to them.' },
    availableStates: { status: 'unknown', names: [], note: 'Rive 2.44.0 does not expose a complete state/layer enumeration. Animation names are listed separately.' },
  };
}
