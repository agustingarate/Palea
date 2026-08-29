export type IconName =
  | 'arrow'
  | 'menu'
  | 'close'
  | 'calendar'
  | 'file'
  | 'board'
  | 'chart'
  | 'check'
  | 'apple'
  | 'google-play';

const paths: Record<IconName, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  calendar:
    'M5 4v3M19 4v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  file: 'M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 13h6M8 17h6',
  board: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z',
  chart: 'M5 19V9M12 19V5M19 19v-7',
  check: 'M5 12l4 4L19 6',
  apple:
    'M16.7 12.8c0-2 1.7-3 1.8-3.1-1-1.4-2.5-1.5-3.1-1.5-1.3-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.1 2.6 2 .9 0 1.3-.6 2.5-.6 1.2 0 1.5.6 2.5.6 1 0 1.7-1 2.4-2 .8-1.1 1.1-2.3 1.1-2.4-.1 0-1.4-.6-1.4-2.7ZM14.5 6.8c.6-.8 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-1 2.7 1 0 2-.5 2.7-1.2Z',
  'google-play':
    'M4 3l11.5 9L4 21V3Zm11.5 9L20 9.5 15.5 7M15.5 14L20 16.5 15.5 19',
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
