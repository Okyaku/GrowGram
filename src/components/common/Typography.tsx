import React from "react";
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from "react-native";

const resolveFontFamily = (fontWeight: unknown) => {
  const normalized = String(fontWeight ?? "").toLowerCase();

  if (
    normalized === "bold" ||
    normalized === "700" ||
    normalized === "800" ||
    normalized === "900"
  ) {
    return "SpaceGrotesk_700Bold";
  }

  if (
    normalized === "500" ||
    normalized === "600" ||
    normalized === "medium" ||
    normalized === "semibold"
  ) {
    return "SpaceGrotesk_500Medium";
  }

  return "SpaceGrotesk_400Regular";
};

export const Text = React.forwardRef<
  React.ElementRef<typeof RNText>,
  TextProps
>(({ style, ...props }, ref) => {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const resolvedWeight =
    typeof flattened?.fontWeight === "string" ||
    typeof flattened?.fontWeight === "number"
      ? flattened.fontWeight
      : undefined;
  const { fontWeight: _unused, ...restStyle } = flattened ?? {};

  return (
    <RNText
      ref={ref}
      {...props}
      style={[restStyle, { fontFamily: resolveFontFamily(resolvedWeight) }]}
    />
  );
});

Text.displayName = "TypographyText";

export const TextInput = React.forwardRef<
  React.ElementRef<typeof RNTextInput>,
  TextInputProps
>(({ style, ...props }, ref) => {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const resolvedWeight =
    typeof flattened?.fontWeight === "string" ||
    typeof flattened?.fontWeight === "number"
      ? flattened.fontWeight
      : "500";
  const { fontWeight: _unused, ...restStyle } = flattened ?? {};

  return (
    <RNTextInput
      ref={ref}
      {...props}
      style={[restStyle, { fontFamily: resolveFontFamily(resolvedWeight) }]}
    />
  );
});

TextInput.displayName = "TypographyTextInput";
