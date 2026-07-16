import { useThemeContext } from '../providers/ThemeProvider';

/**
 * Custom Theme Hook for StartupOps UI
 */
export const useTheme = () => {
  return useThemeContext();
};

export default useTheme;
