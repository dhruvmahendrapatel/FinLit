import { createContext, useContext, type ReactNode } from "react";

import { kidTheme, themes, type Theme, type ThemeMode } from "./tokens";

const ThemeContext = createContext<Theme>(kidTheme);

export function ThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  return <ThemeContext.Provider value={themes[mode]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useIsKidMode(): boolean {
  return useContext(ThemeContext).mode === "kid";
}
