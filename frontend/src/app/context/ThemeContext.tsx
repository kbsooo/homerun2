'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Direction = 'fromMJUtoGH' | 'fromGHtoMJU';

interface ThemeContextType {
    theme: string;
    darkMode: boolean;
    direction: Direction;
    setTheme: (theme: string) => void;
    toggleDarkMode: (value: boolean) => void;
    setDirection: (direction: Direction) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'blueTheme',
    darkMode: false,
    direction: 'fromGHtoMJU',
    setTheme: () => {},
    toggleDarkMode: () => {},
    setDirection: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState('blueTheme');
    const [darkMode, setDarkMode] = useState(false);
    const [direction, setDirection] = useState<Direction>('fromGHtoMJU');

    // Initialize theme, direction and dark mode from localStorage and system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'blueTheme';
        const savedDirection = localStorage.getItem('direction') as Direction || 'fromGHtoMJU';
        
        // Check system preference for dark mode if not saved in localStorage
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === null) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(prefersDark);
            localStorage.setItem('darkMode', String(prefersDark));
        } else {
            setDarkMode(savedDarkMode === 'true');
        }
        
        setTheme(savedTheme);
        setDirection(savedDirection);

        // Listen for system dark mode changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (localStorage.getItem('darkMode') === null) {
                setDarkMode(e.matches);
                localStorage.setItem('darkMode', String(e.matches));
            }
        };
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Update theme when direction changes
    useEffect(() => {
        const newTheme = direction === 'fromMJUtoGH' ? 'yellowTheme' : 'blueTheme';
        handleSetTheme(newTheme);
        localStorage.setItem('direction', direction);
    }, [direction]);

    // Update document body and html classes whenever theme or dark mode changes
    useEffect(() => {
        document.body.className = `${theme} ${darkMode ? 'darkMode' : ''}`;
        document.documentElement.classList.toggle('darkMode', darkMode);
    }, [theme, darkMode]);

    const toggleDarkMode = (value: boolean) => {
        setDarkMode(value);
        localStorage.setItem('darkMode', String(value));
    };

    const handleSetTheme = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleSetDirection = (newDirection: Direction) => {
        setDirection(newDirection);
        localStorage.setItem('direction', newDirection);
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                darkMode,
                direction,
                setTheme: handleSetTheme,
                toggleDarkMode,
                setDirection: handleSetDirection,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
} 