import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="capsule-btn-circle theme-toggle-btn"
      title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
      style={{
        width: 36,
        height: 36,
        position: 'relative',
        overflow: 'hidden',
        background: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        color: isDark ? '#fbbf24' : '#0284c7'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isDark ? 'rotate(360deg)' : 'rotate(0deg)'
        }}
      >
        {isDark ? (
          <Sun size={17} className="text-amber" style={{ filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))' }} />
        ) : (
          <Moon size={16} className="text-blue" style={{ filter: 'drop-shadow(0 0 4px rgba(2, 132, 199, 0.4))' }} />
        )}
      </div>
    </button>
  );
}
