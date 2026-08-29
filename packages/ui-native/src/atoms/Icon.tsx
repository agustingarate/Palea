import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  CircleHelp,
  CircleDollarSign,
  Clock3,
  Download,
  Edit3,
  Eye,
  EyeOff,
  File,
  FilePlusCorner,
  FileText,
  FileUser,
  Filter,
  Folder,
  Grid2X2,
  HeartCrack,
  Home,
  Info,
  Link,
  List,
  LocationEdit,
  LockKeyhole,
  Mail,
  Menu,
  MoreVertical,
  MessagesSquare,
  NotebookPen,
  PartyPopper,
  Paperclip,
  PenLine,
  Plus,
  RefreshCw,
  Redo2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  StickyNoteCheck,
  Trash2,
  Upload,
  Undo2,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform, type AccessibilityProps } from 'react-native';
import { primitives } from '@palea/design-tokens';
import { useThemeColors } from '../internal/useThemeColors';

const icons = {
  add: Plus,
  arrowBack: ArrowLeft,
  arrowForward: ArrowRight,
  barChart: BarChart3,
  banknote: Banknote,
  bell: Bell,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  check: Check,
  checkCircle: CheckCircle2,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  circleDashed: CircleDashed,
  circleDollarSign: CircleDollarSign,
  close: X,
  download: Download,
  edit: Edit3,
  error: CircleAlert,
  eye: Eye,
  eyeOff: EyeOff,
  file: File,
  filePlusCorner: FilePlusCorner,
  fileText: FileText,
  fileUser: FileUser,
  filter: Filter,
  folder: Folder,
  grid: Grid2X2,
  heartCrack: HeartCrack,
  help: CircleHelp,
  home: Home,
  info: Info,
  link: Link,
  list: List,
  location: LocationEdit,
  lock: LockKeyhole,
  mail: Mail,
  menu: Menu,
  more: MoreVertical,
  messagesSquare: MessagesSquare,
  notes: NotebookPen,
  partyPopper: PartyPopper,
  paperclip: Paperclip,
  penLine: PenLine,
  refresh: RefreshCw,
  redo: Redo2,
  rotateCcw: RotateCcw,
  search: Search,
  slidersHorizontal: SlidersHorizontal,
  star: Star,
  stickyNoteCheck: StickyNoteCheck,
  time: Clock3,
  trash: Trash2,
  upload: Upload,
  undo: Undo2,
  user: UserRound,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconTone =
  | 'default'
  | 'muted'
  | 'inverse'
  | 'interaction'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const sizes: Record<IconSize, number> = {
  sm: primitives.size.iconSm,
  md: primitives.size.iconMd,
  lg: primitives.size.iconLg,
  xl: primitives.size.iconXl,
};

export interface IconProps extends AccessibilityProps {
  name: IconName;
  size?: IconSize | number;
  tone?: IconTone;
  strokeWidth?: number;
  /** Keeps a 2 px line perceptually crisp when the SVG is enlarged. */
  absoluteStrokeWidth?: boolean;
  accessibilityLabel?: string;
}

export function Icon({
  name,
  size = 'lg',
  tone = 'default',
  strokeWidth = 1,
  absoluteStrokeWidth = true,
  accessibilityLabel,
}: IconProps) {
  const theme = useThemeColors();
  const color = {
    default: theme.text,
    muted: theme.textMuted,
    inverse: theme.textInverse,
    interaction: theme.interaction,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
    info: theme.info,
  }[tone];
  const Component = icons[name];
  const accessibilityProps =
    Platform.OS === 'web'
      ? { accessibilityLabel }
      : {
          accessibilityElementsHidden: !accessibilityLabel,
          accessibilityLabel,
          accessible: Boolean(accessibilityLabel),
        };
  return (
    <Component
      {...accessibilityProps}
      absoluteStrokeWidth={absoluteStrokeWidth}
      color={color}
      focusable={false}
      size={typeof size === 'number' ? size : sizes[size]}
      strokeWidth={strokeWidth}
    />
  );
}
