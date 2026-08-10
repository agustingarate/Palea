import { themes, type ResolvedTheme } from '@palea/design-tokens';
import { useColorScheme } from 'nativewind';

export function useThemeColors(): ResolvedTheme {
  const { colorScheme } = useColorScheme();
  return themes[colorScheme === 'dark' ? 'dark' : 'light'];
}
