'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
    theme: string;
    darkMode: boolean;
    setTheme: (theme: string) => void;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'blueTheme',
    darkMode: false,
    setTheme: () => {},
    toggleDarkMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState('blueTheme');
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'blueTheme';
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setTheme(savedTheme);
        setDarkMode(savedDarkMode);
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', String(newDarkMode));
    };

    const handleSetTheme = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                darkMode,
                setTheme: handleSetTheme,
                toggleDarkMode,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
} 