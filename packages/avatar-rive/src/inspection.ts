import type RiveCanvas from '@rive-app/canvas-advanced';
import type { AvatarCapabilities } from '@amyu/avatar-contract';

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
}
export interface RiveAssetInfo {
  renderer: 'Rive Canvas2D';
  runtimeVersion: string;
  assetUrl: string;
  adapterId: string;
  artboard: string;
  stateMachine: string | null;
  viewModel: string | null;
  artboards: string[];
  stateMachines: Array<{ artboard: string; name: string; inputs: DiscoveredRiveInput[] }>;
  inputs: DiscoveredRiveInput[];
  animations: Array<{ artboard: string; name: string }>;
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
): Pick<RiveAssetInfo, 'artboards' | 'stateMachines' | 'animations' | 'viewModels' | 'bindings' | 'availableStates'> {
  const artboards: string[] = [];
  const stateMachines: RiveAssetInfo['stateMachines'] = [];
  const animations: RiveAssetInfo['animations'] = [];
  for (let index = 0; index < file.artboardCount(); index++) {
    const artboard = file.artboardByIndex(index);
    try {
      artboards.push(artboard.name);
      for (let animationIndex = 0; animationIndex < artboard.animationCount(); animationIndex++) {
        animations.push({ artboard: artboard.name, name: artboard.animationByIndex(animationIndex).name });
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
    artboards, stateMachines, animations, viewModels,
    bindings: { status: 'unknown', note: 'Rive 2.44.0 exposes ViewModel properties but cannot enumerate which artwork properties are bound to them.' },
    availableStates: { status: 'unknown', names: [], note: 'Rive 2.44.0 does not expose a complete state/layer enumeration. Animation names are listed separately.' },
  };
}
