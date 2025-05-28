import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, useColorScheme } from 'react-native';
import CalculatorScreen from './components/CalculatorScreen';
import { lightTheme, darkTheme } from './components/theme';

export default function App() {
  const colorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>((colorScheme === 'dark') ? 'dark' : 'light');
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <CalculatorScreen theme={theme} themeMode={themeMode} setThemeMode={setThemeMode} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
