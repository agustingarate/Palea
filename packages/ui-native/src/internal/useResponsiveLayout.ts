import { Platform, useWindowDimensions } from 'react-native';

export type ResponsiveBreakpoint = 'compact' | 'medium' | 'expanded';

export interface ResponsiveLayout {
  breakpoint: ResponsiveBreakpoint;
  isWeb: boolean;
  isCompact: boolean;
  isMedium: boolean;
  isExpanded: boolean;
  viewportWidth: number;
  contentMaxWidth?: number;
  formMaxWidth?: number;
  pageGutter: number;
  gridColumns: 1 | 2 | 3;
}

/**
 * Keeps universal React Native components intentional on wide Expo Web
 * viewports without creating a second web-only component library.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const isMedium = width >= 640 && !isExpanded;
  const breakpoint: ResponsiveBreakpoint = isExpanded
    ? 'expanded'
    : isMedium
      ? 'medium'
      : 'compact';

  return {
    breakpoint,
    isWeb: Platform.OS === 'web',
    isCompact: breakpoint === 'compact',
    isMedium,
    isExpanded,
    viewportWidth: width,
    contentMaxWidth: isExpanded ? 1184 : isMedium ? 840 : undefined,
    formMaxWidth: isExpanded ? 720 : isMedium ? 640 : undefined,
    pageGutter: isExpanded ? 40 : isMedium ? 32 : 16,
    gridColumns: isExpanded ? 3 : isMedium ? 2 : 1,
  };
}
