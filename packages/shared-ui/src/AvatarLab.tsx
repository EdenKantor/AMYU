import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { conversationStates, emotions, gestures, type AvatarFrame, type ConversationState } from '@amyu/avatar-contract';
import { RiveAvatarRenderer, type RiveAssetInfo, type MappingDiagnostic } from '@amyu/avatar-rive';
import { FrameMetrics, BoundedEventLog } from '@amyu/observability';
import { LabSession } from './session';
import { copy, type Language } from './i18n';
import { Icon, type IconName } from './Icons';
import { AssetInspector } from './AssetInspector';

type View = 'studio' | 'stream' | 'contract';
type Stage = 'mist' | 'dusk' | 'paper';
interface PerformanceStats { fps: number; frameMs: number; renderMs: number }

function saveJSON(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initialLanguage(): Language {
  try { return localStorage.getItem('amyu.lab.language') === 'en' ? 'en' : 'he'; } catch { return 'he'; }
}
function clock(ms: number) { return `${Math.floor(ms / 60000).toString().padStart(2, '0')}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}`; }
function heLabel(language: Language, hebrew: string, english: string) { return language === 'he' ? hebrew : english; }

export function AvatarLab() {
  const sessionRef = useRef<LabSession | null>(null);
  if (!sessionRef.current) sessionRef.current = new LabSession();
  const session = sessionRef.current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RiveAvatarRenderer | null>(null);
  const mappingInspectionRef = useRef<((frame: AvatarFrame) => MappingDiagnostic[]) | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [view, setView] = useState<View>('studio');
  const [stage, setStage] = useState<Stage>('mist');
  const [zoom, setZoom] = useState(100);
  const [inspector, setInspector] = useState(true);
  const [frame, setFrame] = useState<AvatarFrame>(() => session.frame);
  const [stats, setStats] = useState<PerformanceStats>({ fps: 0, frameMs: 0, renderMs: 0 });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [assetInfo, setAssetInfo] = useState<RiveAssetInfo | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [, setRevision] = useState(0);
  const t = copy[language];
  const refresh = () => { setFrame(session.frame); setRevision(value => value + 1); };
  const action = (fn: () => void) => { fn(); refresh(); };
  const clickCharacter = () => action(() => { session.click(); rendererRef.current?.reactToClick(); });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    try { localStorage.setItem('amyu.lab.language', language); } catch { /* Restricted storage keeps this session functional. */ }
  }, [language]);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    session.setReducedMotion(motion.matches);
    const update = () => { session.setReducedMotion(motion.matches); setRevision(v => v + 1); };
    motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, [session]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || view !== 'studio') return;
    let disposed = false;
    let renderer: RiveAvatarRenderer | null = null;
    const controller = new AbortController();
    setStatus('loading');
    const observer = new ResizeObserver(() => renderer?.resize());
    observer.observe(canvas);
    RiveAvatarRenderer.create(canvas, { signal: controller.signal }).then(value => {
      if (disposed) { value.dispose(); return; }
      renderer = value; rendererRef.current = value; renderer.resize();
      setAssetInfo(renderer.assetInfo);
      mappingInspectionRef.current = renderer.getMappingDiagnostics.bind(renderer);
      setStatus('ready');
      session.log('renderer.ready', 'Original Rive artboard · local WASM');
    }).catch((reason: unknown) => {
      if (disposed) return;
      const message = reason instanceof Error ? reason.message : String(reason);
      setStatus('error'); setError(message); session.log('renderer.error', message);
    });
    return () => { disposed = true; controller.abort(); observer.disconnect(); if (rendererRef.current === renderer) rendererRef.current = null; renderer?.dispose(); };
  }, [session, retry, view]);

  useEffect(() => {
    let raf = 0;
    let previous = 0;
    let lastUI = 0;
    const timing = new FrameMetrics(60);
    const renderTimes = new BoundedEventLog<number>(60);
    const animate = (now: number) => {
      const delta = previous ? now - previous : 16.67;
      previous = now;
      if (!document.hidden) {
        const next = session.tick(delta);
        const renderer = rendererRef.current;
        if (renderer) {
          try { renderTimes.push(renderer.render(next, session.paused ? 0 : Math.min(delta, 64)).frameTimeMs); }
          catch (reason: unknown) {
            const message = reason instanceof Error ? reason.message : String(reason);
            renderer.dispose(); rendererRef.current = null;
            setStatus('error'); setError(message); session.log('renderer.error', message);
          }
        }
        if (delta < 250) timing.record(delta);
        if (now - lastUI >= 100) {
          setFrame(next); setRevision(v => v + 1);
          const measured = timing.snapshot();
          const draws = renderTimes.snapshot();
          setStats({ fps: measured.fps, frameMs: measured.frameTimeMs, renderMs: draws.reduce((a, b) => a + b, 0) / (draws.length || 1) });
          lastUI = now;
        }
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [session]);

  useEffect(() => {
    const pointer = (event: globalThis.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      const distance = Math.hypot(x, y);
      session.pointer(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)), Math.max(0, 1 - distance / 2.5), distance < 0.48);
    };
    const leave = () => session.pointerLeave();
    window.addEventListener('pointermove', pointer);
    document.addEventListener('pointerleave', leave);
    return () => { window.removeEventListener('pointermove', pointer); document.removeEventListener('pointerleave', leave); };
  }, [session]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(event.target.tagName))) return;
      const stateKeys: Record<string, ConversationState> = { i: 'idle', l: 'listening', t: 'thinking', s: 'speaking', a: 'acting', z: 'sleeping' };
      const state = stateKeys[event.key.toLowerCase()];
      if (state) session.setState(state);
      else if (event.key.toLowerCase() === 'r') session.reset();
      else return;
      setRevision(v => v + 1);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [session]);

  function directGaze(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    session.gaze(Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)), Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)));
    refresh();
  }
  const stateOptions = conversationStates;
  const eventList = (compact: boolean) => <div className={`event-list ${compact ? 'compact' : ''}`}>
    {session.events.slice(0, compact ? 3 : 120).map(event => <div className="event-row" key={event.id}>
      <time dir="ltr">{clock(event.at)}</time><span className="event-dot"/><div><code>{event.type}</code><p>{event.detail}</p></div>
    </div>)}
    {session.events.length === 0 && <p className="empty-events">{t.noEvents}</p>}
  </div>;

  return <div className="lab-shell" dir={language === 'he' ? 'rtl' : 'ltr'} data-renderer={status}>
    <aside className="sidebar">
      <a className="brand" href="#studio" onClick={event => { event.preventDefault(); setView('studio'); }} aria-label="AMYU"><span className="brand-mark"><i/><i/><i/><i/></span><span>AMYU<span className="brand-period">.</span></span></a>
      <div className="workspace-label">{t.foundation}</div>
      <nav aria-label={t.lab}>
        {(['studio', 'stream', 'contract'] as View[]).map(item => <button key={item} className={`nav-item ${view === item ? 'active' : ''}`} onClick={() => setView(item)} aria-label={t[item]} aria-current={view === item ? 'page' : undefined}><Icon name={item}/><span>{t[item]}</span>{view === item && <span className="nav-active-dot"/>}</button>)}
      </nav>
      <div className="sidebar-note"><div className="note-symbol"><Icon name="spark" size={26}/></div><p>{t.noKeys}</p><span>AMYU / v0.1</span></div>
      <div className="runtime-status"><span className="status-dot"/><div><strong>{t.local}</strong><span>{t.build}</span></div><span className="runtime-icon">↗</span></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">AMYU <span>/</span> <strong>{t.lab}</strong></div><div className="topbar-actions"><span className="offline-badge"><span/>{t.offline}</span><select aria-label="Language / שפה" value={language} onChange={event => setLanguage(event.target.value as Language)}><option value="he">עברית</option><option value="en">English</option></select></div></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">EMBODIMENT STUDIO</div><h1>{t.lab}<span className="heading-dot">.</span></h1><p>{t.subtitle}</p></div><div className="heading-actions"><button className="button secondary" onClick={() => action(() => session.reset())}><Icon name="reset"/>{t.reset}</button><button className="button primary" onClick={() => action(() => session.toggleTour())}><Icon name={session.touring ? 'pause' : 'play'}/>{session.touring ? t.stopTour : t.tour}</button></div></div>

        {view === 'studio' && <div className={`studio-grid ${inspector ? '' : 'wide'}`}>
          <section className={`stage-panel stage-${stage}`} aria-label={t.stage}>
            <div className="stage-top"><button className="rig-label" onClick={() => setView('contract')}><span className="tiny-mark"/>{t.rig}<span className="version-pill">v0.1</span></button><button className="icon-button" title={inspector ? t.closeInspector : t.openInspector} aria-label={inspector ? t.closeInspector : t.openInspector} onClick={() => setInspector(value => !value)}><Icon name="expand"/></button></div>
            <div className="stage-grid"/><div className="stage-orbit orbit-one"/><div className="stage-orbit orbit-two"/>
            <div className="stage-caption"><span>{t.rigTag}</span><h2>{t.presence}</h2></div>
            <div className="canvas-wrap" style={{ transform: `scale(${zoom / 100})` }}>
              <canvas ref={canvasRef} className="avatar-canvas" role="button" tabIndex={0} aria-label={language === 'he' ? 'לחיצה על הדמות לתגובה מקומית' : 'Click the character for a local reaction'} onClick={clickCharacter} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clickCharacter(); } }}/>
            </div>
            {status !== 'ready' && <div className="renderer-overlay" role="status"><Icon name="spark" size={26}/><strong>{status === 'loading' ? t.loading : t.failed}</strong>{status === 'error' && <><p>{error}</p><button className="button secondary" onClick={() => setRetry(v => v + 1)}>{t.retry}</button></>}</div>}
            <p className="stage-hint"><Icon name="cursor" size={14}/>{t.stageHelp}</p>
            <div className="stage-bottom"><span className="life-indicator"><span className={`status-dot ${session.paused ? 'amber' : ''}`}/>{session.paused ? t.paused : t.alive}</span><div className="stage-tools"><button className="icon-button" aria-label={session.paused ? t.resume : t.pause} title={session.paused ? t.resume : t.pause} onClick={() => action(() => session.setPaused(!session.paused))}><Icon name={session.paused ? 'play' : 'pause'} size={16}/></button><span className="divider"/><button className="zoom-button" onClick={() => setZoom(v => v >= 130 ? 70 : v + 10)} aria-label="Zoom">{zoom}%</button><span className="divider"/><div className="stage-swatches">{(['mist', 'paper', 'dusk'] as Stage[]).map(value => <button key={value} className={`swatch swatch-${value} ${stage === value ? 'selected' : ''}`} title={t[value]} aria-label={t[value]} aria-pressed={stage === value} onClick={() => setStage(value)}/>)}</div></div></div>
          </section>

          {inspector && <aside className="inspector" aria-label={t.controls}>
            <div className="inspector-heading"><span><Icon name="studio" size={16}/>{t.controls}</span><span className="live-dot"/></div>
            <div className="inspector-body">
              <section className="control-section"><div className="section-title"><h3>{t.state}</h3><span className="section-number">01</span></div><p className="control-help">{t.stateHelp}</p><div className="state-grid">{stateOptions.map(state => <button key={state} className={`state-button ${session.state === state ? 'selected' : ''}`} onClick={() => action(() => session.setState(state))} aria-pressed={session.state === state}><Icon name={state as IconName} size={18}/><span>{t.states[state]}</span></button>)}</div></section>
              <section className="control-section"><div className="section-title"><h3>{t.emotion}</h3><span className="section-number">02</span></div><select className="emotion-select" aria-label={t.emotion} value={session.emotion} onChange={event => action(() => session.setEmotion(event.target.value as typeof session.emotion))}>{emotions.map(emotion => <option key={emotion} value={emotion}>{t.emotions[emotion]}</option>)}</select><label className="range-label"><span>{t.intensity}</span><output>{session.intensity.toFixed(2)}</output></label><input type="range" min="0" max="1" step="0.01" value={session.intensity} aria-label={t.intensity} onChange={event => action(() => session.setIntensity(Number(event.target.value)))}/><div className="range-endpoints"><span>0.0</span><span>1.0</span></div></section>
              <section className="control-section"><div className="section-title"><h3>{t.energy}</h3><output className="section-value">{session.speechEnergy.toFixed(2)}</output></div><input type="range" min="0" max="1" step="0.01" value={session.speechEnergy} aria-label={t.energy} onChange={event => action(() => { const value = Number(event.target.value); if (value > 0 && session.state !== 'speaking') session.setState('speaking'); session.setSpeechEnergy(value); })}/><p className="control-help compact-help">{t.energyHelp}</p></section>
              <section className="control-section"><div className="section-title"><h3>{t.gaze}</h3><span className="section-number">03</span></div><label className="toggle-row"><span>{t.track}</span><input type="checkbox" checked={session.pointerTracking} onChange={event => action(() => session.setTracking(event.target.checked))}/><span className="toggle-track"/></label><div className="gaze-layout"><div className="gaze-pad" role="slider" tabIndex={0} aria-label={t.gaze} aria-valuetext={`X ${frame.gaze.x.toFixed(2)}, Y ${frame.gaze.y.toFixed(2)}`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); directGaze(event); }} onPointerMove={event => { if (event.buttons === 1) directGaze(event); }} onKeyDown={event => { const d = 0.1; const map: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }; if (map[event.key]) { event.preventDefault(); const [x, y] = map[event.key]; action(() => session.gaze(frame.gaze.x + x, frame.gaze.y + y)); } }}><span className="gaze-axis axis-x"/><span className="gaze-axis axis-y"/><span className="gaze-target" style={{ left: `${(frame.gaze.x + 1) * 50}%`, top: `${(frame.gaze.y + 1) * 50}%` }}/></div><div className="gaze-values" dir="ltr"><span>X <output>{frame.gaze.x.toFixed(2)}</output></span><span>Y <output>{frame.gaze.y.toFixed(2)}</output></span><p dir={language === 'he' ? 'rtl' : 'ltr'}>{t.gazeHelp}</p></div></div></section>
              <section className="control-section gestures-section"><div className="section-title"><h3>{t.gesturesTitle}</h3><span className="section-number">04</span></div><div className="gesture-grid">{gestures.map(gesture => <button key={gesture} className={`gesture-button ${frame.gesture?.name === gesture ? 'active' : ''}`} onClick={() => action(() => session.gesture(gesture))}>{t.gestures[gesture]}</button>)}</div></section>
              <section className="control-section"><details className="pose-details"><summary>{t.pose}<span className="section-number">05</span></summary><p className="control-help">{t.poseHelp}</p>{(['headTilt', 'eyeOpenness', 'mouthOpen', 'smile', 'frown'] as const).map(field => <div className="pose-control" key={field}><label className="range-label"><span>{t[field]}</span><span>{session.poseOverrides[field] === undefined ? t.auto : t.manual} <output>{frame[field].toFixed(2)}</output></span></label><input type="range" min={field === 'headTilt' ? -1 : 0} max="1" step="0.01" value={frame[field]} aria-label={t[field]} onChange={event => action(() => session.setPoseOverride(field, Number(event.target.value)))}/></div>)}{(['x', 'y'] as const).map(axis => <div className="pose-control" key={axis}><label className="range-label"><span>{axis === 'x' ? t.gazeX : t.gazeY}</span><output>{frame.gaze[axis].toFixed(2)}</output></label><input type="range" min="-1" max="1" step="0.01" value={frame.gaze[axis]} aria-label={axis === 'x' ? t.gazeX : t.gazeY} onChange={event => action(() => session.gaze(axis === 'x' ? Number(event.target.value) : frame.gaze.x, axis === 'y' ? Number(event.target.value) : frame.gaze.y))}/></div>)}<button className="export-pose" onClick={() => action(() => session.clearPoseOverrides())}><Icon name="reset" size={13}/>{t.clearPose}</button></details></section>
              <section className="control-section last-section"><label className="toggle-row awake-row"><span>{t.awake}</span><input type="checkbox" checked={session.state !== 'sleeping'} onChange={event => action(() => session.setAwake(event.target.checked))}/><span className="toggle-track"/></label><label className="toggle-row"><span>{t.reduced}</span><input type="checkbox" checked={session.reducedMotion} onChange={event => action(() => session.setReducedMotion(event.target.checked))}/><span className="toggle-track"/></label><button className="export-pose" onClick={() => saveJSON('amyu-avatar-pose.json', frame)}><Icon name="download" size={14}/>{t.snapshot}</button></section>
            </div>
          </aside>}
          <section className="diagnostics-strip" aria-label={t.live}><div className="diagnostics-label"><span className="live-dot"/><span>{t.live}</span></div>{[[t.frames, stats.fps.toFixed(0), 'fps'], [t.frameTime, stats.frameMs.toFixed(1), 'ms'], [t.renderTime, stats.renderMs.toFixed(2), 'ms'], [t.uptime, clock(session.elapsedMs), '']].map(([label, value, unit]) => <div className="metric" key={label}><span>{label}</span><strong dir="ltr">{value}<small>{unit}</small></strong></div>)}<span className={`renderer-badge ${status}`}>{status === 'ready' && <Icon name="check" size={12}/>} {status === 'ready' ? t.ready : status === 'error' ? 'Rive error' : 'Loading'}</span></section>
          <section className="event-panel"><div className="event-heading"><h3>{t.latest}<span>{session.events.length}</span></h3><button className="text-button" onClick={() => setView('stream')}>{t.stream}<Icon name="arrow" size={14}/></button></div>{eventList(true)}</section>
        </div>}

        {view === 'stream' && <section className="detail-panel"><div className="detail-heading"><div className="eyebrow">LOCAL EVENT BUS</div><h2>{t.allEvents}</h2><p>{t.streamHelp}</p></div><div className="latency-metrics" dir="ltr">{session.metrics.snapshot().map(metric => <span key={metric.name}><code>{metric.name}</code><strong>{metric.lastMs.toFixed(2)} ms</strong></span>)}</div><div className="detail-toolbar"><span>{session.events.length} / 120</span><button className="button secondary" onClick={() => action(() => session.clearEvents())}>{t.clear}</button><button className="button secondary" onClick={() => saveJSON('amyu-avatar-events.json', { events: session.events, metrics: session.metrics.snapshot() })}><Icon name="download"/>{t.export}</button></div>{eventList(false)}</section>}
        {view === 'contract' && <section className="detail-panel"><div className="detail-heading"><div className="eyebrow">RENDERER-INDEPENDENT</div><h2>{t.rigTitle}</h2><p>{t.contractHelp}</p></div><div className="contract-flow" dir="ltr"><span>Semantic intent</span><Icon name="arrow"/><span>EmbodimentDirector</span><Icon name="arrow"/><span>AvatarController</span><Icon name="arrow"/><span className="flow-rive">Rive</span></div><AssetInspector info={assetInfo} frame={frame} language={language} diagnostics={mappingInspectionRef.current?.(frame) ?? []}/><details className="discovery-details"><summary>{heLabel(language, 'פלט Embodiment בזמן אמת', 'Live Embodiment output')}</summary><table className="contract-table"><thead><tr><th>{t.field}</th><th>{t.value}</th></tr></thead><tbody>{Object.entries(frame).filter(([key]) => !['stateWeights', 'emotionWeights'].includes(key)).map(([key, value]) => <tr key={key}><td><code>{key}</code></td><td dir="ltr"><code>{typeof value === 'number' ? value.toFixed(3) : JSON.stringify(value)}</code></td></tr>)}</tbody></table></details></section>}
        <footer className="page-footer"><span>{t.connection}<span className="footer-separator">·</span>Rive / Canvas</span><span>{t.keyboard}</span></footer>
      </main>
    </div>
  </div>;
}
