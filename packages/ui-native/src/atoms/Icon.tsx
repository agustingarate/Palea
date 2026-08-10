import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock3,
  Download,
  Edit3,
  Eye,
  EyeOff,
  File,
  FileText,
  Filter,
  Folder,
  Grid2X2,
  Home,
  Info,
  Link,
  List,
  LocationEdit,
  LockKeyhole,
  Mail,
  Menu,
  MoreVertical,
  NotebookPen,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
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
  bell: Bell,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  check: Check,
  checkCircle: CheckCircle2,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  close: X,
  download: Download,
  edit: Edit3,
  error: CircleAlert,
  eye: Eye,
  eyeOff: EyeOff,
  file: File,
  fileText: FileText,
  filter: Filter,
  folder: Folder,
  grid: Grid2X2,
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
  notes: NotebookPen,
  paperclip: Paperclip,
  refresh: RefreshCw,
  search: Search,
  star: Star,
  time: Clock3,
  trash: Trash2,
  upload: Upload,
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
