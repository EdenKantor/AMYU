import type { AvatarFrame, ConversationState, Gesture } from '@amyu/avatar-contract';
import { EmbodimentDirector } from '@amyu/embodiment';

export interface PetSnapshot {
  state: ConversationState;
  composerOpen: boolean;
  draft: string;
  reply: string;
  busy: boolean;
}

const localReply = "I'm here. This is a local demo. Real conversations come later.";
const flow = { listen: 550, think: 1750, end: 5300 };

/** Product interaction state, independent of React, Rive and the developer lab. */
export class PetSession {
  readonly director = new EmbodimentDirector({ seed: 71421 });
  private state: ConversationState = 'idle';
  private composerOpen = true;
  private draft = '';
  private reply = '';
  private activity: 'conversation' | 'acting' | null = null;
  private elapsed = 0;
  private disposed = false;

  get snapshot(): PetSnapshot {
    return { state: this.state, composerOpen: this.composerOpen, draft: this.draft, reply: this.reply, busy: this.activity !== null };
  }
  get frame(): AvatarFrame { return this.director.getSnapshot(); }

  setComposer(open: boolean): void {
    if (this.disposed) return;
    this.composerOpen = open;
    if (!open && !this.activity && this.state === 'listening') this.setState('idle');
  }
  focusComposer(): void {
    if (this.disposed) return;
    this.composerOpen = true;
    if (!this.activity) this.setState('listening');
  }
  blurComposer(): void {
    if (!this.disposed && !this.activity && this.state === 'listening') this.setState('idle');
  }
  setDraft(value: string): void {
    if (this.disposed) return;
    this.draft = value.slice(0, 500);
    this.cancelActivity();
    this.reply = '';
    this.setState('listening');
  }
  submit(): boolean {
    if (this.disposed || !this.draft.trim()) return false;
    this.cancelActivity();
    this.draft = '';
    this.reply = '';
    this.activity = 'conversation';
    this.setState('listening');
    return true;
  }
  act(): void {
    if (this.disposed) return;
    this.cancelActivity();
    this.activity = 'acting';
    this.reply = 'A little movement demo. No task is being run.';
    this.setState('acting');
  }
  sleep(): void {
    if (this.disposed) return;
    this.cancelActivity();
    this.reply = '';
    this.setState('sleeping');
  }
  wake(): void {
    if (this.disposed) return;
    this.cancelActivity();
    this.setState('idle');
  }
  click(supportedGestures: readonly Gesture[]): void {
    if (this.disposed) return;
    this.cancelActivity();
    this.setState('idle');
    this.director.reactToClick(supportedGestures);
  }
  microphonePlaceholder(): void {
    if (this.disposed) return;
    this.reply = 'Voice is coming later. No microphone is connected.';
  }
  clearReply(): void { if (!this.disposed) this.reply = ''; }
  setReducedMotion(value: boolean): void { if (!this.disposed) this.director.setReducedMotion(value); }

  tick(deltaMs: number): AvatarFrame {
    if (this.disposed) return this.frame;
    const delta = Number.isFinite(deltaMs) ? Math.max(0, Math.min(64, deltaMs)) : 0;
    if (this.activity) {
      this.elapsed += delta;
      if (this.activity === 'acting') {
        if (this.elapsed >= 2600) { this.cancelActivity(); this.setState('idle'); }
      } else if (this.elapsed >= flow.end) {
        this.cancelActivity();
        this.setState('idle');
      } else if (this.elapsed >= flow.think) {
        // Publish once so dismissing the reply (or opening the mic notice) sticks.
        if (this.state !== 'speaking') this.reply = localReply;
        this.setState('speaking');
        // Local silent envelope: two short phrases, varied syllables and pauses.
        const t = this.elapsed - flow.think;
        const phrase = t % 1800;
        const syllable = Math.sin(phrase / 110) * Math.sin(phrase / 110);
        this.director.setSpeechEnergy(phrase < 1370 ? 0.18 + syllable * 0.72 : 0);
      } else if (this.elapsed >= flow.listen) this.setState('thinking');
    }
    return this.director.tick(delta);
  }

  dispose(): void {
    this.cancelActivity();
    this.setState('idle');
    this.disposed = true;
  }
  private setState(state: ConversationState): void {
    if (this.state === state) return;
    this.state = state;
    this.director.setConversationState(state);
  }
  private cancelActivity(): void {
    this.activity = null;
    this.elapsed = 0;
    this.director.cancelGestures();
    this.director.setSpeechEnergy(0);
  }
}
