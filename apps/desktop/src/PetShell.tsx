import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react';
import { isTauri, invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { RiveAvatarRenderer } from '@amyu/avatar-rive';
import { gestures } from '@amyu/avatar-contract';
import { PetSession, type PetSnapshot } from './pet-session';

const initialSnapshot: PetSnapshot = { state: 'idle', composerOpen: true, draft: '', reply: '', busy: false };
const labels = { idle: 'Here with you', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking', acting: 'In motion', sleeping: 'Taking a nap' };
const sizes = { small: [300, 360], default: [360, 460], large: [480, 620] } as const;

function Glyph({ name }: { name: 'chat' | 'menu' | 'send' | 'mic' | 'close' | 'drag' | 'resize' }) {
  const paths = {
    chat: <><path d="M4 4.5h16v11H9l-5 4v-15Z"/><path d="M8 8.5h8M8 12h5"/></>,
    menu: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    send: <><path d="m6 12 6-6 6 6M12 6v13"/></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 10a6.5 6.5 0 0 0 13 0M12 16.5V21M9 21h6"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    drag: <><path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" strokeWidth="3"/></>,
    resize: <path d="m7 18 11-11M13 18l5-5"/>,
  };
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function PetShell() {
  const native = isTauri();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<PetSession | null>(null);
  const rendererRef = useRef<RiveAvatarRenderer | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [rendererStatus, setRendererStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [previewSize, setPreviewSize] = useState<readonly [number, number]>(sizes.default);
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const perform = (action: (session: PetSession) => void) => {
    const session = sessionRef.current;
    if (!session) return;
    action(session);
    setSnapshot(session.snapshot);
    setNotice('');
  };
  const nativeAction = async (action: () => Promise<unknown>) => {
    try { await action(); } catch { setNotice('That window action could not finish. Please try again.'); }
  };

  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.title = 'AMYU · Desktop Pet';
    document.documentElement.dataset.shell = native ? 'native-pet' : 'pet-preview';
    const session = new PetSession();
    sessionRef.current = session;
    setSnapshot(session.snapshot);
    setRendererStatus('loading');
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => session.setReducedMotion(media.matches);
    motion(); media.addEventListener('change', motion);
    const controller = new AbortController();
    let renderer: RiveAvatarRenderer | null = null;
    let disposed = false;
    let raf = 0;
    let last = performance.now();
    let lastSnapshot = JSON.stringify(session.snapshot);
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => renderer?.resize());
    if (canvas) {
      observer.observe(canvas);
      RiveAvatarRenderer.create(canvas, { signal: controller.signal }).then(value => {
        if (disposed) { value.dispose(); return; }
        renderer = value; rendererRef.current = value;
        value.resize(); setRendererStatus('ready');
      }).catch((error: unknown) => {
        if (disposed) return;
        console.error('AMYU pet renderer failed', error);
        setRendererStatus('error');
      });
    }
    const draw = (now: number) => {
      const delta = Math.max(0, Math.min(64, now - last)); last = now;
      const frame = session.tick(delta);
      try { renderer?.render(frame, delta); } catch (error) {
        console.error('AMYU pet render failed', error);
        renderer?.dispose(); renderer = null; rendererRef.current = null;
        setRendererStatus('error'); session.wake();
      }
      const next = session.snapshot;
      const key = JSON.stringify(next);
      if (key !== lastSnapshot) { lastSnapshot = key; setSnapshot(next); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      disposed = true; controller.abort(); cancelAnimationFrame(raf); observer.disconnect();
      media.removeEventListener('change', motion);
      renderer?.dispose(); session.dispose();
      if (sessionRef.current === session) sessionRef.current = null;
      if (rendererRef.current === renderer) rendererRef.current = null;
    };
  }, [native, retry]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: globalThis.PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [menuOpen]);

  function submit(event: FormEvent) {
    event.preventDefault();
    perform(session => session.submit());
  }
  function toggleComposer() {
    const open = !snapshot.composerOpen;
    perform(session => session.setComposer(open));
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }
  async function selectSize(size: readonly [number, number]) {
    if (native) await nativeAction(() => getCurrentWindow().setSize(new LogicalSize(...size)));
    else setPreviewSize(size);
  }
  function beginResize(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    if (native) { void nativeAction(() => getCurrentWindow().startResizeDragging('SouthEast')); return; }
    resizeStart.current = { x: event.clientX, y: event.clientY, width: previewSize[0], height: previewSize[1] };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function resizePreview(event: PointerEvent<HTMLButtonElement>) {
    const start = resizeStart.current;
    if (native || !start) return;
    setPreviewSize([Math.max(300, Math.min(560, start.width + event.clientX - start.x)), Math.max(360, Math.min(700, start.height + event.clientY - start.y))]);
  }
  async function openLab() {
    setMenuOpen(false);
    if (native) await nativeAction(() => invoke('open_avatar_lab'));
    else window.open(`${window.location.origin}/?mode=lab`, '_blank', 'noopener,noreferrer');
  }
  const ready = rendererStatus === 'ready';
  const noticeText = notice || snapshot.reply;
  const style = { '--preview-width': `${previewSize[0]}px`, '--preview-height': `${previewSize[1]}px` } as CSSProperties;

  return <main className={`pet-host ${native ? 'pet-native' : 'pet-browser'}`} style={style}>
    {!native && <div className="pet-preview-label"><span>AMYU</span> Desktop Pet · browser preview<small>Move, minimize and close are available in the Windows app.</small></div>}
    <section className="pet-shell" aria-label="AMYU Desktop Pet" data-state={snapshot.state} data-renderer={rendererStatus} onKeyDown={event => {
      if (event.key === 'Escape') { if (menuOpen) setMenuOpen(false); else perform(session => session.setComposer(false)); }
    }}>
      <header className="pet-toolbar">
        <button className="pet-drag" aria-label="Move pet window" title={native ? 'Drag to move AMYU' : 'Moving is available in the Windows app'} disabled={!native} onPointerDown={event => {
          if (!native || event.button !== 0) return;
          event.preventDefault(); void nativeAction(() => getCurrentWindow().startDragging());
        }}><Glyph name="drag"/><span>amyu<span className="pet-brand-dot">.</span></span></button>
        <div className="pet-toolbar-actions">
          <button className="pet-icon-button" aria-label={snapshot.composerOpen ? 'Hide chat bar' : 'Show chat bar'} aria-expanded={snapshot.composerOpen} onClick={toggleComposer}><Glyph name="chat"/></button>
          <div className="pet-menu-anchor" ref={menuRef}>
            <button className="pet-icon-button" aria-label="Pet options" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><Glyph name="menu"/></button>
            {menuOpen && <div className="pet-menu" aria-label="Pet options">
              <span className="pet-menu-heading">A little company</span>
              <button onClick={() => { perform(session => snapshot.state === 'sleeping' ? session.wake() : session.sleep()); setMenuOpen(false); }}>{snapshot.state === 'sleeping' ? 'Wake up' : 'Take a nap'}<span>☾</span></button>
              <button disabled={!ready} onClick={() => { perform(session => session.act()); setMenuOpen(false); }}>Try a little movement<span>↗</span></button>
              <div className="pet-size-control"><span>Pet size</span><div>{Object.entries(sizes).map(([name, size]) => <button key={name} aria-label={`${name} pet size`} title={name} onClick={() => void selectSize(size)}>{name === 'small' ? 'S' : name === 'large' ? 'L' : 'M'}</button>)}</div></div>
              <button onClick={() => void openLab()}>Avatar Lab<span className="pet-dev-label">DEV</span></button>
              <div className="pet-menu-window-actions"><button disabled={!native} onClick={() => void nativeAction(() => getCurrentWindow().minimize())}>Minimize</button><button disabled={!native} onClick={() => void nativeAction(() => getCurrentWindow().close())}>Close pet</button></div>
              <div className="pet-credits">Prototype robot by sukeycool · CC BY 4.0<a href="https://www.rive.app/marketplace/28071-53022-friendly-floating-bot/" target="_blank" rel="noreferrer">Friendly Floating Bot ↗</a></div>
            </div>}
          </div>
        </div>
      </header>

      <div className="pet-avatar-area">
        <canvas ref={canvasRef} className="pet-avatar" role="button" tabIndex={ready ? 0 : -1} aria-label={snapshot.state === 'sleeping' ? 'Wake AMYU' : 'Say hello to AMYU'} onClick={() => {
          if (!ready) return;
          perform(session => session.click(gestures.filter(gesture => rendererRef.current?.assetInfo.capabilities.gestures[gesture] === 'supported')));
        }} onKeyDown={event => {
          if (ready && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.currentTarget.click(); }
        }}/>
        {!ready && <div className="pet-renderer-message" role="status">{rendererStatus === 'error' ? <><strong>AMYU couldn't appear.</strong><button onClick={() => setRetry(value => value + 1)}>Try again</button></> : 'Waking up…'}</div>}
        <div className="pet-presence" role="status"><span className={`pet-presence-dot ${snapshot.busy ? 'is-busy' : ''}`}/>{labels[snapshot.state]}</div>
      </div>

      {noticeText && <div className="pet-reply" role="status"><span>{noticeText}</span><button className="pet-icon-button" aria-label="Dismiss reply" onClick={() => { setNotice(''); perform(session => session.clearReply()); }}><Glyph name="close"/></button></div>}

      <div className="pet-composer-region">
        {snapshot.composerOpen && <form className="pet-composer" onSubmit={submit}>
          <input ref={inputRef} type="text" dir="auto" aria-label="Message AMYU" placeholder="Say something…" maxLength={500} autoComplete="off" spellCheck value={snapshot.draft} disabled={!ready} onFocus={() => perform(session => session.focusComposer())} onBlur={() => perform(session => session.blurComposer())} onChange={event => perform(session => session.setDraft(event.target.value))}/>
          <button type="button" className="pet-icon-button pet-mic" aria-label="Voice coming later" title="Voice coming later" onClick={() => perform(session => session.microphonePlaceholder())}><Glyph name="mic"/></button>
          <button type="submit" className="pet-send" aria-label="Send local demo message" title="Send local demo message" disabled={!ready || !snapshot.draft.trim()}><Glyph name="send"/></button>
        </form>}
        <p className="pet-local-note">Local demo <span>·</span> No AI or audio connected</p>
      </div>
      <button className="pet-resize" aria-label={native ? 'Resize pet window' : 'Resize pet preview'} title="Drag to resize. Use Pet options for preset sizes." onPointerDown={beginResize} onPointerMove={resizePreview} onPointerUp={() => { resizeStart.current = null; }} onPointerCancel={() => { resizeStart.current = null; }} onLostPointerCapture={() => { resizeStart.current = null; }} onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setMenuOpen(true); }
      }}><Glyph name="resize"/></button>
    </section>
  </main>;
}
