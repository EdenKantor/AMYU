import { reviewCandidates, type RiveAssetInfo, type AnimationMappingDiagnostic } from '@amyu/avatar-rive';
import { gestures } from '@amyu/avatar-contract';
import type { LabSession } from './session';
import { copy, type Language } from './i18n';
import { Icon } from './Icons';

/** Development review tools; only semantic intent enters the shared session. */
export function DemoControls({ session, language, action, ready, info, diagnostics, candidateId, onCandidate, reset }: {
  session: LabSession; language: Language; action: (fn: () => void) => void; ready: boolean;
  info: RiveAssetInfo | null; diagnostics: AnimationMappingDiagnostic[];
  candidateId: string; onCandidate: (id: string) => void; reset: () => void;
}) {
  const t = copy[language];
  const he = language === 'he';
  const demo = session.demo;
  const supportedGestures = gestures.filter(gesture => info?.capabilities.gestures[gesture] === 'supported');
  const unavailable = info ? [
    ...Object.entries(info.capabilities).filter(([name, value]) => name !== 'gestures' && value === 'unsupported').map(([name]) => name),
    ...gestures.filter(gesture => info.capabilities.gestures[gesture] === 'unsupported').map(gesture => `gesture:${gesture}`),
  ] : [];
  return <section className="demo-panel qa-panel" aria-label="Avatar QA">
    <div className="qa-heading"><strong>AVATAR QA</strong><span>{he ? 'בדיקה חזותית · כלי פיתוח' : 'Visual review · development tools'}</span><select aria-label="Review candidate" value={candidateId} onChange={event => onCandidate(event.target.value)}>{reviewCandidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select></div>
    <div className="demo-buttons">
      <button className="button secondary" disabled={!ready} onClick={() => action(() => session.playStateDemo())}><Icon name="play"/>{he ? 'הדגמת כל המצבים' : 'Full State Demo'}<small>38s</small></button>
      <button className="button primary" disabled={!ready} onClick={() => action(() => session.playSpeakingDemo())}><Icon name="speaking"/>{he ? 'הדגמת דיבור' : 'Speaking Demo'}<small>12s</small></button>
      <button className="button secondary" disabled={!ready} onClick={() => action(() => session.playEyeDemo())}>{he ? 'הדגמת עיניים ומצמוץ' : 'Eye/Blink Demo'}</button>
      <button className="button secondary" disabled={!ready} onClick={() => action(() => session.playTransitionStressDemo(supportedGestures))}>{he ? 'בדיקת מעברים' : 'Transition Stress Test'}</button>
      <button className="button secondary" disabled={!ready} onClick={() => action(() => session.playGestureDemo(supportedGestures))}>{he ? 'הדגמת מחוות' : 'Gesture Demo'}</button>
      <button className="button secondary" disabled={!ready} onClick={() => action(reset)}><Icon name="reset"/>{he ? 'איפוס' : 'Reset'}</button>
      {demo && <button className="button secondary" onClick={() => action(() => session.stopDemo())}><Icon name="pause"/>{t.stopTour}</button>}
    </div>
    <div className="demo-status" role="status">
      <strong>{t.states[session.state]}</strong>
      <span>{demo ? `${session.paused ? t.demoPaused : demo.label} · ${(demo.phaseRemainingMs / 1000).toFixed(1)}s · ${(demo.elapsedMs / 1000).toFixed(1)}/${demo.durationMs / 1000}s` : t.demoReady}</span>
      <small>{t.demoHelp}</small>
      {info?.reviewSupport?.states[session.state] && <small className="qa-warning">{info.reviewSupport.states[session.state]?.status.toUpperCase()} · {info.reviewSupport.states[session.state]?.note}</small>}
    </div>
    <details className="qa-diagnostics">
      <summary>{he ? 'אנימציות פעילות ומשקלי מיזוג' : 'Current native animations & blend weights'}</summary>
      <div className="qa-animation-list" dir="ltr">{diagnostics.filter(item => item.status === 'MAPPED' && item.mix > 0.005).map(item => <span key={`${item.control}:${item.animation}`}><code>{item.animation}</code><b>{item.mix.toFixed(3)}</b>{item.progress !== undefined && <small>phase {item.progress.toFixed(3)}</small>}</span>)}</div>
    </details>
    <p className="qa-warning qa-capabilities">{he ? 'יכולות שאינן נתמכות' : 'Unsupported capabilities'}: {unavailable.join(', ') || '—'}</p>
    {info?.capabilities.blink === 'unsupported' && <p className="qa-warning">{he ? 'הדגמת העיניים מציגה את האנימציה המקורית ומצבי שינה וערות; אין בקובץ שליטה נפרדת במצמוץ או בתזמון מצמוץ כפול.' : 'Eye/Blink Demo shows authored motion and sleep/wake poses. This asset cannot follow independent blink or double-blink timing.'}</p>}
    {demo && <progress className="demo-progress" value={demo.progress} max="1" aria-label={he ? 'התקדמות ההדגמה' : 'Demo progress'}/>}
  </section>;
}
