// client/src/components/ThemeToggle.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useAuth();

  return (
    <button
      onClick={toggleDarkMode}
      aria-label="Toggle Dark Mode"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-parchment bg-cream-dark text-brown-700 hover:bg-parchment hover:text-terra transition-all duration-300 dark:border-dark-border dark:bg-dark-card dark:text-brown-300 dark:hover:bg-dark-surface dark:hover:text-terra-light"
    >
      {darkMode ? (
        <Sun className="h-5 w-5 text-gold" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
