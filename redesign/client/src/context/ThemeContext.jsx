import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('ipos5_theme');
      if (saved) return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  });

  const [transitionEffect, setTransitionEffect] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('ipos5_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback((e) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    
    // Get click position for ripple/particle animation origin
    let origin = { x: window.innerWidth - 120, y: 30 };
    if (e && e.clientX && e.clientY) {
      origin = { x: e.clientX, y: e.clientY };
    }

    // Trigger visual particle / wave transition effect
    setTransitionEffect({
      id: Date.now(),
      origin,
      toTheme: nextTheme
    });

    setTheme(nextTheme);
  }, [theme]);

  const clearTransitionEffect = useCallback(() => {
    setTransitionEffect(null);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, transitionEffect, clearTransitionEffect }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
