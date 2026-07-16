import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'hive-theme',
}) => {
  const getStoredTheme = (): Theme => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(storageKey);
    return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : defaultTheme;
  };

  const resolveTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return currentTheme === 'dark' ? 'dark' : 'light';
  };

  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme();
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    return resolveTheme(getStoredTheme());
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (currentTheme: Theme) => {
      const computedTheme = resolveTheme(currentTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(computedTheme);
      root.style.colorScheme = computedTheme;
      root.dataset.theme = computedTheme;
      setResolvedTheme(computedTheme);
    };

    applyTheme(theme);

    // If set to system, register media listener to change instantly on OS changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    window.localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
