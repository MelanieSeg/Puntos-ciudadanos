import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@app_theme_mode';

// Paleta Light (colores actuales)
const lightTheme = {
  // Colores base
  background: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  
  // Colores de acción
  primary: '#4CAF50',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Bordes y separadores
  border: '#E0E0E0',
  divider: '#EEEEEE',
  
  // Específicos
  sidebarBg: '#1a1f36',
  sidebarText: '#FFFFFF',
  inputBg: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Paleta Dark
const darkTheme = {
  // Colores base
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#808080',
  
  // Colores de acción (mantienen identidad)
  primary: '#66BB6A',
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FFA726',
  info: '#42A5F5',
  
  // Bordes y separadores
  border: '#3A3A3A',
  divider: '#2C2C2C',
  
  // Específicos
  sidebarBg: '#0D1117',
  sidebarText: '#C9D1D9',
  inputBg: '#2C2C2C',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencia guardada al iniciar
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Actualizar StatusBar cuando cambia el tema
  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    isDarkMode,
    toggleTheme,
    theme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar el tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export default ThemeContext;
