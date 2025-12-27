import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ColorTheme = 
  | "default" 
  | "glacier" 
  | "harvest" 
  | "lavender" 
  | "brutalist" 
  | "obsidian" 
  | "orchid" 
  | "solar" 
  | "tide" 
  | "verdant";

export type Mode = "light" | "dark" | "system";

interface ThemeContextType {
  colorTheme: ColorTheme;
  mode: Mode;
  setColorTheme: (theme: ColorTheme) => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const stored = localStorage.getItem("color-theme");
    return (stored as ColorTheme) || "default";
  });

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem("theme-mode");
    return (stored as Mode) || "system";
  });

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem("color-theme", theme);
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem("theme-mode", newMode);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove(
      "theme-glacier",
      "theme-harvest",
      "theme-lavender",
      "theme-brutalist",
      "theme-obsidian",
      "theme-orchid",
      "theme-solar",
      "theme-tide",
      "theme-verdant"
    );

    // Add theme class if not default
    if (colorTheme !== "default") {
      root.classList.add(`theme-${colorTheme}`);
    }

    // Handle dark mode
    const applyDarkMode = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyDarkMode(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyDarkMode(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyDarkMode(mode === "dark");
    }
  }, [colorTheme, mode]);

  return (
    <ThemeContext.Provider value={{ colorTheme, mode, setColorTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}