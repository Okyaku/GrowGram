import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeMode } from "./theme";

export const THEME_MODE_STORAGE_KEY = "@growgram/theme-mode";

const isThemeMode = (value: unknown): value is ThemeMode => {
  return value === "dark" || value === "light";
};

export const readStoredThemeMode = async (): Promise<ThemeMode | null> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const writeStoredThemeMode = async (mode: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore persistence failures and keep in-memory theme mode.
  }
};
