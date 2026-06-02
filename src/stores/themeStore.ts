import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { Themes, ThemeKey, ThemeColors, ThemeGradients, setActiveThemeName } from '../constants/colors';

interface ThemeState {
  themeName: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeName: 'cyberpunk',
      setTheme: (themeName) => {
        setActiveThemeName(themeName);
        set({ themeName });
      },
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'friendlens-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          setActiveThemeName(state.themeName);
        }
      },
    }
  )
);

// Subscribe to store updates to keep activeThemeName in colors.ts synced
useThemeStore.subscribe((state) => {
  setActiveThemeName(state.themeName);
});

// Set initial value immediately
setActiveThemeName(useThemeStore.getState().themeName);

export const useTheme = () => {
  const themeName = useThemeStore((state) => state.themeName);
  const setTheme = useThemeStore((state) => state.setTheme);

  return useMemo(() => {
    const themeData = Themes[themeName] || Themes.cyberpunk;
    return {
      theme: themeName,
      colors: themeData.colors,
      gradients: themeData.gradients,
      setTheme,
    };
  }, [themeName, setTheme]);
};

export function useStyles<T>(factory: (colors: ThemeColors, gradients: ThemeGradients) => T): T {
  const { colors, gradients } = useTheme();
  return useMemo(() => factory(colors, gradients), [colors, gradients, factory]);
}
