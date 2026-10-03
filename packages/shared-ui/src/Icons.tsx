export type IconName = 'studio' | 'stream' | 'contract' | 'reset' | 'play' | 'pause' | 'arrow' | 'expand' | 'download' | 'spark' | 'cursor' | 'check' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'acting' | 'sleeping';

const paths: Record<IconName, React.ReactNode> = {
  studio: <><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M9 10v3m6-3v3m-6 4h6"/></>,
  stream: <><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="1"/></>,
  contract: <><path d="m8 5-5 7 5 7m8-14 5 7-5 7m-3-16-2 18"/></>,
  reset: <><path d="M4 10a8 8 0 1 1 1.5 7M4 4v6h6"/></>,
  play: <path d="m9 5 11 7-11 7Z"/>, pause: <><path d="M8 5v14m8-14v14"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, expand: <path d="M4 9V4h5m6 0h5v5m0 6v5h-5M9 20H4v-5"/>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>,
  spark: <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z"/>,
  cursor: <path d="m5 3 14 10-7 1-3 7Z"/>, check: <path d="m5 12 4 4L19 6"/>,
  idle: <><circle cx="12" cy="12" r="8"/><path d="M9 10v1m6-1v1m-6 4h6"/></>,
  listening: <><path d="M8 18c0-4-4-5-4-9a8 8 0 0 1 16 0c0 4-4 5-4 9M9 21h6M12 6v7"/></>,
  thinking: <><path d="M5 15a7 7 0 1 1 14 0l-4 4H9Z"/><path d="M9 22h6m-5-11 2-2 2 2"/></>,
  speaking: <><path d="m4 9 5-4v14l-5-4H2V9Zm9-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
  acting: <path d="m13 2-8 12h6l-1 8 9-13h-7Z"/>,
  sleeping: <path d="M19 15a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z"/>
};

export function Icon({name, size=18}: {name: IconName; size?: number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
