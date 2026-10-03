import type { RiveAssetInfo, MappingDiagnostic } from '@amyu/avatar-rive';
import type { AvatarFrame } from '@amyu/avatar-contract';
import type { Language } from './i18n';

export function AssetInspector({ info, frame, language, diagnostics }: { info: RiveAssetInfo | null; frame: AvatarFrame; language: Language; diagnostics: MappingDiagnostic[] }) {
  const he = language === 'he';
  if (!info) return <div className="asset-info"><p>{he ? 'מידע על הקובץ יופיע לאחר טעינת הדמות בסטודיו.' : 'Asset information appears after the character loads in the studio.'}</p></div>;
  const unmapped = diagnostics.filter(item => item.status === 'UNMAPPED');
  const capabilityEntries = Object.entries(info.capabilities).filter(([name]) => name !== 'gestures');
  const assetName = info.assetUrl.split('/').pop()?.split('?')[0] ?? info.adapterId;
  return <div className="asset-inspector">
    <div className="asset-info-grid">
      {[[he ? 'מנוע ציור' : 'Active renderer', `${info.renderer} / ${info.runtimeVersion}`], [he ? 'קובץ פעיל' : 'Active asset', assetName], ['Artboard', info.artboard], ['State Machine', info.stateMachine ?? 'UNMAPPED'], ['ViewModel', info.viewModel ?? (he ? 'אין בקובץ הפעיל' : 'None in active asset')], [he ? 'מצב סמנטי' : 'Semantic state', frame.state]].map(([label, value]) => <div className="asset-info-cell" key={label}><span>{label}</span><strong dir="ltr">{value}</strong></div>)}
    </div>
    <h3 className="inspector-section-title">{he ? 'יכולות מאומתות' : 'Verified capability matrix'}</h3>
    <div className="capability-grid" dir="ltr">{[...capabilityEntries, ...Object.entries(info.capabilities.gestures).map(([name, value]) => [`gesture:${name}`, value])].map(([name, value]) => <div key={name}><code>{name}</code><span className={`support-badge ${value}`}>{String(value).toUpperCase()}</span></div>)}</div>
    <h3 className="inspector-section-title">{he ? 'מיפוי Rive נוכחי' : 'Current Rive mapping'}<span className={unmapped.length ? 'mapping-warning' : 'mapping-ok'}>{unmapped.length ? `${unmapped.length} UNMAPPED` : `${diagnostics.length} MAPPED`}</span></h3>
    <table className="contract-table mapping-table"><thead><tr><th>{he ? 'בקרה' : 'Control'}</th><th>{he ? 'קלט שנמצא' : 'Discovered input'}</th><th>{he ? 'ערך' : 'Value'}</th><th>{he ? 'מצב' : 'Status'}</th></tr></thead><tbody>{diagnostics.map(item => <tr key={`${item.control}:${item.input}`}><td><code>{item.control}</code></td><td><code>{item.input}</code><small>{item.actualType ?? 'missing'}{item.reason && ` · ${item.reason}`}</small></td><td dir="ltr"><code>{typeof item.value === 'number' ? item.value.toFixed(3) : String(item.value ?? '—')}</code></td><td><span className={`support-badge ${item.status === 'MAPPED' ? 'supported' : 'unsupported'}`}>{item.status}</span></td></tr>)}</tbody></table>
    <details className="discovery-details"><summary>{he ? 'פרטי הקובץ שנמצאו בפועל' : 'Actual file discovery'}</summary><div className="asset-notes"><p><strong>Artboards:</strong> {info.artboards.join(', ')}</p>{info.stateMachines.map(machine => <p key={`${machine.artboard}:${machine.name}`}><strong>{machine.artboard} / {machine.name}:</strong> {machine.inputs.filter(input => input.type === 'number').length} number · {machine.inputs.filter(input => input.type === 'boolean').length} boolean · {machine.inputs.filter(input => input.type === 'trigger').length} trigger</p>)}<p><strong>ViewModels:</strong> {info.viewModels.length ? JSON.stringify(info.viewModels) : '0 — no ViewModel properties present'}</p><p><strong>Data Binding targets:</strong> UNKNOWN — {info.bindings.note}</p><p><strong>State/layer names:</strong> UNKNOWN — {info.availableStates.note}</p><p><strong>Animations ({info.animations.length}):</strong> {info.animations.map(animation => animation.name).join(', ')}</p></div></details>
    <p className="identity-note">{he ? 'דמות הפיתוח הזמנית אינה הזהות של דמות AMYU הסופית.' : 'The temporary prototype mascot is not the AMYU production identity.'}</p>
  </div>;
}
