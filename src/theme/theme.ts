import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#FF7A00',
  background: '#0F0C0A',
  surface: '#171311',
  text: '#F5F2EE',
  textSub: '#A89E95',
  success: '#13C388',
  danger: '#FF5A5F',
  border: '#2B221E',
  white: '#1D1714',
  onPrimary: '#FFF8F2',
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
