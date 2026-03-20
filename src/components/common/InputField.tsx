import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../../theme';

type Props = TextInputProps & {
  label?: string;
  errorText?: string;
};

export const InputField: React.FC<Props> = ({ label, errorText, style, ...rest }) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textSub}
        style={[styles.input, style]}
        {...rest}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    marginBottom: theme.spacing.xs,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body,
  },
  errorText: {
    marginTop: 6,
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});
