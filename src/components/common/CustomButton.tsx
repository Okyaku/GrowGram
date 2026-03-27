import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { theme } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const getVariantStyle = (variant: Variant) => {
  switch (variant) {
    case 'secondary':
      return {
        container: { backgroundColor: theme.colors.surface, borderColor: 'transparent' },
        text: { color: theme.colors.text },
      };
    case 'outline':
      return {
        container: { backgroundColor: theme.colors.white, borderColor: theme.colors.primary },
        text: { color: theme.colors.primary },
      };
    case 'success':
      return {
        container: { backgroundColor: theme.colors.success, borderColor: 'transparent' },
        text: { color: theme.colors.onPrimary },
      };
    case 'danger':
      return {
        container: { backgroundColor: theme.colors.danger, borderColor: 'transparent' },
        text: { color: theme.colors.onPrimary },
      };
    case 'primary':
    default:
      return {
        container: { backgroundColor: theme.colors.primary, borderColor: 'transparent' },
        text: { color: theme.colors.onPrimary },
      };
  }
};

export const CustomButton: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const variantStyle = getVariantStyle(variant);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        theme.shadows.soft,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'outline' ? theme.colors.primary : theme.colors.onPrimary}
        />
      ) : (
        <Text style={[styles.label, variantStyle.text, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: theme.typography.button,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
