import { type Gesture, type GestureFrame } from '@amyu/avatar-contract';
import { smoothstep } from './math';

export const gestureDurations: Record<Gesture, number> = {
  nod: 850, shake_head: 1000, head_tilt: 1100, wave: 1400, bounce: 900,
  celebrate: 1600, shrug: 1200,
};

export interface GesturePose {
  headX: number; headY: number; tilt: number; leanY: number; bounce: number; squash: number;
}

/** A zero-ended envelope prevents abrupt pose jumps on gesture entry and exit. */
export function gesturePose(gesture: GestureFrame | null): GesturePose {
  const pose: GesturePose = { headX: 0, headY: 0, tilt: 0, leanY: 0, bounce: 0, squash: 0 };
  if (!gesture) return pose;
  const p = gesture.progress;
  const envelope = smoothstep(Math.min(p * 5, (1 - p) * 5)) * gesture.intensity;
  switch (gesture.name) {
    case 'nod': pose.headY = Math.sin(p * Math.PI * 4) * 0.28 * envelope; break;
    case 'shake_head': pose.headX = Math.sin(p * Math.PI * 5) * 0.35 * envelope; break;
    case 'head_tilt': pose.tilt = 0.4 * envelope; break;
    case 'wave': pose.tilt = Math.sin(p * Math.PI * 2) * 0.1 * envelope; break;
    case 'bounce': pose.bounce = Math.sin(p * Math.PI * 4) * 0.65 * envelope; pose.squash = -pose.bounce * 0.3; break;
    case 'celebrate': pose.bounce = Math.abs(Math.sin(p * Math.PI * 5)) * 0.8 * envelope; pose.tilt = Math.sin(p * Math.PI * 4) * 0.16 * envelope; break;
    case 'shrug': pose.leanY = -0.14 * envelope; pose.tilt = -0.12 * envelope; break;
  }
  return pose;
}
