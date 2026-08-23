import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { View } from 'react-native';
import {
  Snackbar,
  type SnackbarProps,
  type SnackbarVariant,
} from '../molecules/Snackbar';
export interface SnackbarOptions {
  message: string;
  variant?: SnackbarVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  dismissAccessibilityLabel?: string;
}
export interface SnackbarController {
  showSnackbar: (options: SnackbarOptions) => string;
  dismissSnackbar: (id?: string) => void;
}
interface Entry extends SnackbarOptions {
  id: string;
}
const SnackbarContext = createContext<SnackbarController | null>(null);
let sequence = 0;
export function SnackbarProvider({
  children,
  defaultDuration = 4500,
  maxVisible = 3,
}: PropsWithChildren<{ defaultDuration?: number; maxVisible?: number }>) {
  const [queue, setQueue] = useState<Entry[]>([]);
  const dismissSnackbar = useCallback(
    (id?: string) =>
      setQueue((items) =>
        id ? items.filter((item) => item.id !== id) : items.slice(1),
      ),
    [],
  );
  const showSnackbar = useCallback((options: SnackbarOptions) => {
    const id = `snackbar-${++sequence}`;
    setQueue((items) => [...items, { ...options, id }]);
    return id;
  }, []);
  const controller = useMemo(
    () => ({ showSnackbar, dismissSnackbar }),
    [showSnackbar, dismissSnackbar],
  );
  return (
    <SnackbarContext.Provider value={controller}>
      {children}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 bottom-0 items-center gap-2 p-4"
        style={{ zIndex: 1000 }}
      >
        {queue.slice(0, Math.max(1, maxVisible)).map((item) => (
          <QueueItem
            key={item.id}
            {...item}
            defaultDuration={defaultDuration}
            onDismiss={() => dismissSnackbar(item.id)}
          />
        ))}
      </View>
    </SnackbarContext.Provider>
  );
}
function QueueItem({
  duration,
  defaultDuration,
  onAction,
  onDismiss,
  ...props
}: Entry & {
  defaultDuration: number;
  onDismiss: NonNullable<SnackbarProps['onDismiss']>;
}) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const value = duration ?? defaultDuration;
    if (value <= 0) return;
    const timer = setTimeout(() => dismiss.current(), value);
    return () => clearTimeout(timer);
  }, [defaultDuration, duration]);
  return (
    <Snackbar
      {...props}
      onAction={
        onAction
          ? () => {
              onAction();
              onDismiss();
            }
          : undefined
      }
      onDismiss={onDismiss}
    />
  );
}
export function useSnackbar(): SnackbarController {
  const context = useContext(SnackbarContext);
  if (!context)
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  return context;
}
