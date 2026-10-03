/**
 * Original AMYU development artwork, authored as Rive runtime objects.
 * This small deterministic writer targets Rive runtime file format 7.0.
 * Schema: https://github.com/rive-app/rive-runtime/tree/main/include/rive/generated
 * Header: https://github.com/rive-app/rive-runtime/blob/main/include/rive/runtime_header.hpp
 * No downloaded artwork, images, fonts, or editor export entitlement is required.
 * It is a development rig, not a general purpose Rive exporter.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const chunks = [];
const uint = (number) => {
  let value = number >>> 0;
  const bytes = [];
  do { const byte = value & 127; value >>>= 7; bytes.push(value ? byte | 128 : byte); } while (value);
  return Buffer.from(bytes);
};
const float = (value) => { const out = Buffer.alloc(4); out.writeFloatLE(value); return out; };
const color = (value) => { const out = Buffer.alloc(4); out.writeUInt32LE(value >>> 0); return out; };
const string = (value) => { const bytes = Buffer.from(value); return Buffer.concat([uint(bytes.length), bytes]); };
const U = (key, value) => [key, uint(value)];
const F = (key, value) => [key, float(value)];
const S = (key, value) => [key, string(value)];
const C = (key, value) => [key, color(value)];
const B = (key, value) => [key, Buffer.from([value ? 1 : 0])];
const object = (type, ...props) => {
  chunks.push(uint(type));
  for (const [key, bytes] of props) chunks.push(uint(key), bytes);
  chunks.push(uint(0));
};

chunks.push(Buffer.from('RIVE'), uint(7), uint(0), uint(0), uint(0));
object(23); // Backboard; establishes the file import scope.
let nextId = 0;
const components = [];
const component = (type, name, parent, ...props) => {
  const id = nextId++;
  components.push({ id, type, name, parent, props });
  return id;
};
const artboard = component(1, 'AMYU Developer', 0, F(7, 400), F(8, 440), U(236, 0));
const node = (name, parent, x = 0, y = 0, ...props) => component(2, name, parent, F(13, x), F(14, y), ...props);
const paint = (shape, name, colors) => {
  const fill = component(20, `${name}.fill`, shape);
  if (Array.isArray(colors)) {
    const gradient = component(22, `${name}.gradient`, fill, F(42, -100), F(33, -120), F(34, 100), F(35, 120));
    colors.forEach((value, index) => component(19, `${name}.stop${index}`, gradient, C(38, value), F(39, index / (colors.length - 1))));
  } else component(18, `${name}.color`, fill, C(37, colors));
};
const ellipse = (name, parent, x, y, width, height, colors, ...props) => {
  const shape = component(3, name, parent, F(13, x), F(14, y), ...props);
  component(4, `${name}.ellipse`, shape, F(20, width), F(21, height));
  paint(shape, name, colors);
  return shape;
};
const rect = (name, parent, x, y, width, height, radius, colors, ...props) => {
  const shape = component(3, name, parent, F(13, x), F(14, y), ...props);
  component(7, `${name}.rectangle`, shape, F(20, width), F(21, height), F(31, radius));
  paint(shape, name, colors);
  return shape;
};
const colors = {
  shell: [0xfffffcf1, 0xffefdfc5, 0xffc8b8a3],
  arm: [0xfff5ebd8, 0xffd0bfa7],
  dark: 0xff243333,
  mint: [0xffdcffdf, 0xffb6e3be],
};

// A compact pebble-shaped being. All visible elements are native Rive vectors.
const shadow = ellipse('shadow', artboard, 200, 383, 162, 19, 0x23101515);
const body = node('body', artboard, 200, 236);
const leftArm = node('leftArm', body, -103, 14, F(15, 0.15));
ellipse('leftHand', leftArm, -12, 24, 35, 64, colors.arm, F(15, 0.28));
const rightArm = node('rightArm', body, 103, 14, F(15, -0.15));
ellipse('rightHand', rightArm, 12, 24, 35, 64, colors.arm, F(15, -0.28));
const leftFoot = ellipse('leftFoot', body, -47, 125, 51, 29, colors.arm, F(15, -0.15));
const rightFoot = ellipse('rightFoot', body, 47, 125, 51, 29, colors.arm, F(15, 0.15));
ellipse('shellOutline', body, 0, 3, 232, 261, 0xffb2aa96);
ellipse('shell', body, 0, 0, 228, 257, colors.shell);
ellipse('bodyHighlight', body, -59, -63, 23, 51, 0x66ffffff, F(15, 0.49));

const head = node('head', body, 0, -28);
const antenna = node('antenna', head, 0, -105);
rect('antennaStem', antenna, 0, -8, 7, 25, 3, 0xffd5c8b1);
ellipse('antennaTip', antenna, 0, -23, 23, 23, colors.mint);
ellipse('antennaShine', antenna, -4, -27, 6, 6, 0xfff8fff4);

const face = node('face', head, 0, 0);
const leftEye = node('leftEye', face, -42, -11);
const rightEye = node('rightEye', face, 42, -11);
for (const [side, eye] of [['left', leftEye], ['right', rightEye]]) {
  ellipse(`${side}EyeShape`, eye, 0, 0, 29, 41, colors.dark);
  ellipse(`${side}EyeLight`, eye, -5, -9, 8, 10, 0xfffcfff0);
}
ellipse('leftCheek', face, -67, 21, 23, 11, 0x77e8a496);
ellipse('rightCheek', face, 67, 21, 23, 11, 0x77e8a496);
const leftBrow = rect('leftBrow', face, -42, -44, 29, 5, 2.5, colors.dark, F(18, 0.06));
const rightBrow = rect('rightBrow', face, 42, -44, 29, 5, 2.5, colors.dark, F(18, 0.06));

const mouth = node('mouth', face, 0, 38);
const mouthClosed = component(3, 'mouthClosed', mouth);
// PathFlags bit0 means HIDDEN. Closedness is the separate bool property32,
// inherited from PointsCommonPath (not the parametric ellipse/rectangle paths).
const mouthPath = component(16, 'mouthPath', mouthClosed, B(32, true));
// Four cubic vertices form a curved ribbon. Smile/Frown morph its centre.
const mouthVertices = [
  component(6, 'mouth.left', mouthPath, F(24, -21), F(25, -2), F(84, 0.35), F(85, 12), F(86, 0.6), F(87, 13)),
  component(6, 'mouth.bottom', mouthPath, F(24, 0), F(25, 10), F(84, Math.PI), F(85, 11), F(86, 0), F(87, 11)),
  component(6, 'mouth.right', mouthPath, F(24, 21), F(25, -2), F(84, 2.54), F(85, 13), F(86, 2.79), F(87, 12)),
  component(6, 'mouth.top', mouthPath, F(24, 0), F(25, 4), F(84, 0), F(85, 11), F(86, Math.PI), F(87, 11)),
];
paint(mouthClosed, 'mouthClosed', colors.dark);
const mouthOpen = ellipse('mouthOpen', mouth, 0, 3, 37, 34, colors.dark, F(17, 0.01));
ellipse('tongue', mouthOpen, 0, 9, 20, 9, 0xffd1a497);

ellipse('bellyInset', body, 0, 73, 25, 25, 0xffb5b4a3);
const belly = ellipse('belly', body, 0, 72, 18, 18, colors.mint);
ellipse('bellyShine', belly, -3, -3, 4, 4, 0xfff6fff1);

// Each numeric input is a real Rive 1D blend layer with two constant poses.
// Disjoint property ownership avoids layer conflicts and supports continuous values.
const controls = [];
const control = (name, min, max, initial, targets) => controls.push({ name, min, max, initial, targets });
const target = (id, property, min, max) => ({ id, property, min, max });
control('bodyX', -1, 1, 0, [target(body, 13, 187, 213)]);
control('bodyY', -1, 1, 0, [target(body, 14, 257, 215)]);
control('bodyRotate', -1, 1, 0, [target(body, 15, -0.17, 0.17)]);
control('bodyScaleX', 0, 2, 1, [target(body, 16, 0, 2)]);
control('bodyScaleY', 0, 2, 1, [target(body, 17, 0, 2)]);
control('headX', -1, 1, 0, [target(head, 13, -10, 10)]);
control('headY', -1, 1, 0, [target(head, 14, -36, -20)]);
control('headTilt', -1, 1, 0, [target(head, 15, -0.35, 0.35)]);
control('gazeX', -1, 1, 0, [target(face, 13, -12, 12)]);
control('gazeY', -1, 1, 0, [target(face, 14, -9, 9)]);
control('eyeOpen', 0, 1.5, 1, [target(leftEye, 17, 0.03, 1.5), target(rightEye, 17, 0.03, 1.5)]);
control('eyeScale', 0, 2, 1, [target(leftEye, 16, 0, 2), target(rightEye, 16, 0, 2)]);
control('browRaise', 0, 1, 0, [target(leftBrow, 18, 0.06, 0.82), target(rightBrow, 18, 0.06, 0.82)]);
control('browTilt', -1, 1, 0, [target(leftBrow, 15, -0.42, 0.42), target(rightBrow, 15, 0.42, -0.42)]);
control('mouthOpen', 0, 1, 0, [target(mouthOpen, 17, 0.01, 1), target(mouthClosed, 18, 1, 0)]);
control('mouthWidth', 0, 2, 1, [target(mouth, 16, 0, 2)]);
control('smile', -1, 1, 0.2, [
  target(mouthVertices[1], 25, -8, 14), target(mouthVertices[3], 25, -14, 8),
  target(mouthVertices[0], 84, -0.55, 0.3), target(mouthVertices[0], 86, -0.4, 0.65),
  target(mouthVertices[2], 84, Math.PI + 0.4, Math.PI - 0.65),
  target(mouthVertices[2], 86, Math.PI + 0.55, Math.PI - 0.3),
]);
control('leftArm', -1, 1, 0, [target(leftArm, 15, -1.45, 1.45)]);
control('rightArm', -1, 1, 0, [target(rightArm, 15, -1.45, 1.45)]);
control('armLift', 0, 1, 0, [target(leftArm, 14, 14, -31), target(rightArm, 14, 14, -31)]);
control('feet', -1, 1, 0, [target(leftFoot, 15, -0.4, 0.1), target(rightFoot, 15, -0.1, 0.4)]);
control('antenna', -1, 1, 0, [target(antenna, 15, -0.35, 0.35)]);
control('shadow', 0, 2, 1, [target(shadow, 16, 0, 2)]);

// Rive draws the object list in reverse. Serialize front-most artwork first
// (the artboard remains id0), and remap all hierarchy/animation references.
// Drawables reverse order; cubic vertex traversal must retain its authored
// sequence so incoming/outgoing handles remain on the correct side of edges.
const vertices = components.filter(({ type }) => type === 6);
let vertexIndex = 0;
const ordered = [components[0], ...components.slice(1).reverse().map((entry) => entry.type === 6 ? vertices[vertexIndex++] : entry)];
const ids = new Map(ordered.map(({ id }, index) => [id, index]));
// Reset each blend to its authored minimum before blending. Because the lower
// pose equals the reset value, the higher pose gives exact linear interpolation.
// Without this, Rive's sequential mixes would accumulate a biased neutral pose.
for (const channel of controls) {
  for (const item of channel.targets) {
    const entry = components[item.id];
    entry.props = entry.props.filter(([key]) => key !== item.property);
    entry.props.push(F(item.property, item.min));
  }
}
for (const entry of ordered) {
  object(entry.type, S(4, entry.name), U(5, ids.get(entry.parent)), ...entry.props);
}

let animationId = 0;
for (const channel of controls) {
  channel.animations = [];
  for (const endpoint of ['min', 'max']) {
    channel.animations.push(animationId++);
    object(31, S(55, `${channel.name}.${endpoint}`), U(56, 60), U(57, 60), U(59, 1));
    const grouped = new Map();
    for (const item of channel.targets) {
      if (!grouped.has(item.id)) grouped.set(item.id, []);
      grouped.get(item.id).push(item);
    }
    for (const [id, items] of grouped) {
      object(25, U(51, ids.get(id)));
      for (const item of items) {
        object(26, U(53, item.property));
        object(30, U(67, 0), F(70, item[endpoint]));
      }
    }
  }
}
object(53, S(55, 'AMYU Developer'));
for (const channel of controls) object(56, S(138, channel.name), F(140, channel.initial));
for (const [inputId, channel] of controls.entries()) {
  object(57, S(138, channel.name));
  object(63); // Entry, layer state index 0.
  object(65, U(151, 1)); // Unconditional transition into the continuous pose blend.
  object(76, U(167, inputId), U(536, 2)); // Blend state with reset, layer state index 1.
  object(75, U(165, channel.animations[0]), F(166, channel.min));
  object(75, U(165, channel.animations[1]), F(166, channel.max));
}

const destination = new URL('../assets/character/', import.meta.url);
await mkdir(destination, { recursive: true });
const bytes = Buffer.concat(chunks);
await writeFile(new URL('amyu-developer.riv', destination), bytes);
await writeFile(new URL('rig-manifest.json', destination), `${JSON.stringify({
  version: 1,
  rig: 'amyu-developer',
  artboard: 'AMYU Developer',
  stateMachine: 'AMYU Developer',
  format: 'Rive 7.0',
  provenance: 'Original vector character created by scripts/build-character.mjs. No external art, images, or fonts.',
  inputs: controls.map(({ name, min, max, initial }) => ({ name, min, max, initial })),
}, null, 2)}\n`);
console.log(`Authored ${bytes.length} bytes, ${nextId} Rive components, ${controls.length} numeric blend layers: ${fileURLToPath(new URL('amyu-developer.riv', destination))}`);
