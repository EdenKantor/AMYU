import type { LabSession } from './session';
import { copy, type Language } from './i18n';
import { Icon } from './Icons';

export function DemoControls({ session, language, action, ready }: { session: LabSession; language: Language; action: (fn: () => void) => void; ready: boolean }) {
  const t = copy[language];
  const demo = session.demo;
  return <section className="demo-panel" aria-label={t.demoReady}>
    <div className="demo-buttons">
      <button className="button secondary" disabled={!ready} onClick={() => action(() => session.playStateDemo())}><Icon name="play"/>{t.tour}<small>15s</small></button>
      <button className="button primary" disabled={!ready} onClick={() => action(() => session.playSpeakingDemo())}><Icon name="speaking"/>{t.speakingDemo}<small>8s</small></button>
      {demo && <button className="button secondary" onClick={() => action(() => session.stopDemo())}><Icon name="pause"/>{t.stopTour}</button>}
    </div>
    <div className="demo-status">
      <strong>{t.states[session.state]}</strong>
      <span>{demo ? `${session.paused ? t.demoPaused : t.states[demo.phase]} · ${(demo.phaseRemainingMs / 1000).toFixed(1)}s` : t.demoReady}</span>
      <small>{t.demoHelp}</small>
    </div>
    {demo && <progress className="demo-progress" value={demo.progress} max="1" aria-label={language === 'he' ? 'התקדמות ההדגמה' : 'Demo progress'}/>}
  </section>;
}
