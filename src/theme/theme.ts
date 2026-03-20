import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#F97316',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#1F2937',
  textSub: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  border: '#E5E7EB',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  pill: 999,
};

export const typography = {
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  caption: 14,
  button: 18,
  subtitle: 13,
};

export const shadows = {
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }) as ViewStyle,
};

export const text = {
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '800',
  } as TextStyle,
  section: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
  } as TextStyle,
  body: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '500',
  } as TextStyle,
  caption: {
    color: colors.textSub,
    fontSize: typography.caption,
    fontWeight: '500',
  } as TextStyle,
};

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  text,
} as const;

export type AppTheme = typeof theme;
