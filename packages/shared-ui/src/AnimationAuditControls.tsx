import type { RiveAssetInfo } from '@amyu/avatar-rive';
import type { Language } from './i18n';

export interface AnimationPreview { name: string; progress: number; mix: number }

/** A generic solo inspector for timelines discovered in the actual file. */
export function AnimationAuditControls({ info, language, preview, onPreview, ready }: {
  info: RiveAssetInfo | null; language: Language; preview: AnimationPreview | null;
  ready: boolean;
  onPreview: (value: AnimationPreview | null) => void;
}) {
  const he = language === 'he';
  const animations = info?.animations.filter(item => item.artboard === info.artboard) ?? [];
  return <section className="control-section audit-controls">
    <details>
      <summary>{he ? 'בדיקת ציר זמן מקורי בנפרד' : 'Solo authored timeline audit'}</summary>
      <p className="control-help">{he ? 'בדיקה של האיור המקורי. הבקרות הסמנטיות מושהות עד היציאה.' : 'Inspects the original artwork. Semantic overlays are bypassed until exit.'}</p>
      <select aria-label="Authored timeline" value={preview?.name ?? ''} disabled={!info || !ready} onChange={event => onPreview(event.target.value ? { name: event.target.value, progress: 0, mix: 1 } : null)}>
        <option value="">{he ? 'הדמות הסמנטית' : 'Semantic avatar'}</option>
        {animations.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
      </select>
      {preview && <>
        <label className="range-label"><span>{he ? 'מיקום בטווח העבודה המקורי' : 'Authored work-range phase'}</span><output>{preview.progress.toFixed(2)}</output></label>
        <input type="range" aria-label="Authored timeline phase" min="0" max="1" step="0.01" value={preview.progress} onChange={event => onPreview({ ...preview, progress: Number(event.target.value) })}/>
        <div className="audit-phase-buttons">{[0, 0.25, 0.5, 0.75, 1].map(progress => <button key={progress} onClick={() => onPreview({ ...preview, progress })}>{progress * 100}%</button>)}</div>
        <label className="range-label"><span>Mix</span><output>{preview.mix.toFixed(2)}</output></label>
        <input type="range" aria-label="Authored timeline mix" min="0" max="1" step="0.01" value={preview.mix} onChange={event => onPreview({ ...preview, mix: Number(event.target.value) })}/>
        <button className="export-pose" onClick={() => onPreview(null)}>{he ? 'יציאה מבדיקת ציר הזמן' : 'Exit timeline audit'}</button>
      </>}
    </details>
  </section>;
}
