import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Modal, Switch, Pressable, Platform, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightTheme, darkTheme } from './theme';
import Slider from '@react-native-community/slider';

const MIN_DISPLAY_FONT_SIZE = 16;
const MAX_DISPLAY_FONT_SIZE = 80;
const DISPLAY_FONT_SIZE_STEP = 4;
const DISPLAY_FONT_SHRINK_START = 7;
const MAX_DISPLAY_LENGTH = 12;
const ICON_FONT_SIZE = 44;
const MIN_FONT_SIZE = 24;
const MAX_FONT_SIZE = 42;

interface CalculatorScreenProps {
  theme: typeof lightTheme;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
}

const CalculatorScreen = ({ theme, themeMode, setThemeMode }: CalculatorScreenProps) => {
  const colorScheme = useColorScheme();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [fontSize, setFontSize] = useState(36);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showingHistory, setShowingHistory] = useState(false);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: settingsVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [settingsVisible, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Estado da calculadora
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [lastExpression, setLastExpression] = useState<string | null>(null);

  // Remover ajuste dinâmico do tamanho da fonte do display
  const displayFontSize = MAX_DISPLAY_FONT_SIZE;

  const isOperator = (char: string) => /[+\-×÷%]/.test(char);

  // Função para lidar com a entrada dos botões
  const handlePress = (value: string) => {
    if (showingHistory) setShowingHistory(false);
    if (value === 'AC') {
      setExpression('');
      setResult('0');
      setJustEvaluated(false);
      return;
    }
    if (value === '⌫') {
      if (justEvaluated) {
        setExpression('');
        setResult('0');
        setJustEvaluated(false);
      } else {
        setExpression((prev) => prev.slice(0, -1));
      }
      return;
    }
    if (value === '=') {
      let exp = expression;
      if (exp && isOperator(exp[exp.length - 1])) {
        exp += '0';
      }
      try {
        let jsExp = exp.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-').replace(/,/g, '.');
        let evalResult = eval(jsExp);
        setResult(evalResult.toString());
        setLastExpression(expression);
        setJustEvaluated(true);
      } catch {
        setResult('Erro');
        setJustEvaluated(true);
      }
      return;
    }
    if (justEvaluated && /[0-9.]/.test(value)) {
      setExpression(value);
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated && isOperator(value)) {
      setExpression(result + value);
      setJustEvaluated(false);
      return;
    }
    setExpression((prev) => {
      if (isOperator(value)) {
        let newPrev = prev;
        while (newPrev && isOperator(newPrev[newPrev.length - 1])) {
          if (newPrev[newPrev.length - 1] === value) {
            return newPrev;
          }
          newPrev = newPrev.slice(0, -1);
        }
        return newPrev + value;
      }
      return prev + value;
    });
  };

  const handleHistory = () => {
    if (lastExpression) {
      setShowingHistory(true);
    }
  };

  // Função para mostrar a operação completa
  const showDisplay = () => {
    if (showingHistory && lastExpression) {
      return lastExpression;
    }
    if (justEvaluated) {
      return result;
    }
    if (expression && isOperator(expression[expression.length - 1])) {
      return expression.slice(0, -1) + expression[expression.length - 1];
    }
    return expression.length > 0 ? expression : result;
  };

  // Bottom sheet content
  const renderSheet = () => (
    <Modal
      visible={settingsVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setSettingsVisible(false)}
    >
      {/* Backdrop instantâneo, não animado junto com a bandeja */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable style={styles.sheetOverlay} onPress={() => setSettingsVisible(false)} />
      </View>
      <View style={[styles.sheetContainer, { backgroundColor: themeMode === 'dark' ? theme.buttonBackground : theme.background }]}> 
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <View style={styles.sheetHandle} />
        </View>
        <Text style={{ color: theme.displayText, fontSize: 20, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>Configurações</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: theme.displayText, fontSize: 16, flex: 1 }}>Modo escuro</Text>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
            thumbColor={theme.icon}
            trackColor={{ false: '#ccc', true: themeMode === 'dark' ? '#f0f0' : theme.orangeButton }}
          />
        </View>
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: theme.displayText, fontSize: 16 }}>Tamanho da fonte</Text>
            <Text style={{ color: theme.displayText, fontSize: 16, marginLeft: 8, fontWeight: 'bold' }}>{fontSize}px</Text>
          </View>
          <Slider
            minimumValue={MIN_FONT_SIZE}
            maximumValue={MAX_FONT_SIZE}
            value={fontSize}
            onValueChange={setFontSize}
            step={1}
            minimumTrackTintColor={theme.orangeButton}
            maximumTrackTintColor={theme.grayButton}
            thumbTintColor={theme.icon}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* Ícone de configurações fixo no topo */}
        <TouchableOpacity style={styles.menuButtonAbsolute} onPress={() => setSettingsVisible(true)}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="settings-outline" size={fontSize} color={theme.icon} />
          </Animated.View>
        </TouchableOpacity>
        {/* Header e display */}
        <View style={styles.header}>
          <View style={styles.displayContainer}>
            <Text
              style={[styles.displayText, { color: theme.displayText, fontSize: fontSize * 2.2 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {showDisplay()}
            </Text>
          </View>
        </View>
        {/* Teclado da calculadora */}
        <View style={styles.keyboardContainer}>
          {/* Linha 1 */}
          <View style={styles.row}>
            <CalcButton label={<Ionicons name="backspace-outline" size={fontSize} color={theme.grayButtonText} />} style={{ backgroundColor: theme.grayButton }} fontSize={fontSize} onPress={() => handlePress('⌫')} />
            <CalcButton label="AC" style={{ backgroundColor: theme.grayButton }} textStyle={{ color: theme.grayButtonText, fontWeight: '500' }} fontSize={fontSize} onPress={() => handlePress('AC')} />
            <CalcButton label="%" style={{ backgroundColor: theme.grayButton }} textStyle={{ color: theme.grayButtonText, fontWeight: '500' }} fontSize={fontSize} onPress={() => handlePress('%')} />
            <CalcButton label="÷" style={{ backgroundColor: theme.orangeButton }} textStyle={{ color: theme.orangeButtonText, fontWeight: '500' }} fontSize={fontSize} onPress={() => handlePress('÷')} />
          </View>
          {/* Linha 2 */}
          <View style={styles.row}>
            <CalcButton label="7" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('7')} />
            <CalcButton label="8" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('8')} />
            <CalcButton label="9" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('9')} />
            <CalcButton label="×" style={{ backgroundColor: theme.orangeButton }} textStyle={{ color: theme.orangeButtonText, fontWeight: '500' }} fontSize={fontSize} onPress={() => handlePress('×')} />
          </View>
          {/* Linha 3 */}
          <View style={styles.row}>
            <CalcButton label="4" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('4')} />
            <CalcButton label="5" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('5')} />
            <CalcButton label="6" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('6')} />
            <CalcButton label="−" style={{ backgroundColor: theme.orangeButton }} textStyle={{ color: theme.orangeButtonText, fontWeight: '500' }} fontSize={fontSize} onPress={() => handlePress('−')} />
          </View>
          {/* Linha 4 */}
          <View style={styles.row}>
            <CalcButton label="1" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('1')} />
            <CalcButton label="2" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('2')} />
            <CalcButton label="3" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('3')} />
            <CalcButton label="+" style={{ backgroundColor: theme.orangeButton }} textStyle={{ color: theme.orangeButtonText, fontWeight: '500' }} fontSize={fontSize} onPress={() => handlePress('+')} />
          </View>
          {/* Linha 5 */}
          <View style={styles.row}>
            <CalcButton label={<Ionicons name="time-outline" size={fontSize} color={theme.buttonText} />} style={{ backgroundColor: theme.grayButton }} fontSize={fontSize} onPress={handleHistory} />
            <CalcButton label="0" style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress('0')} />
            <CalcButton label="," style={{ backgroundColor: theme.buttonBackground }} textStyle={{ color: theme.buttonText }} fontSize={fontSize} onPress={() => handlePress(',')} />
            <CalcButton label="=" style={{ backgroundColor: theme.orangeButton }} textStyle={{ color: theme.orangeButtonText, fontWeight: '500' }} fontSize={fontSize} onPress={() => handlePress('=')} />
          </View>
        </View>
        {renderSheet()}
      </SafeAreaView>
    </View>
  );
};

const CalcButton = ({ label, style, textStyle, fontSize, onPress }: { label: ReactNode, style?: any, textStyle?: any, fontSize: number, onPress?: () => void }) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    {typeof label === 'string' ? (
      <Text style={[styles.buttonText, textStyle, { fontSize }]}>{label}</Text>
    ) : (
      React.isValidElement(label) && label.type && (label.type as any).displayName === 'Ionicon' ?
        React.cloneElement(label as any, { size: fontSize }) :
        label
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  menuButtonAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    padding: 16,
  },
  displayContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingRight: 12,
    paddingTop: 8,
  },
  displayText: {
    fontWeight: '300',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginHorizontal: 12,
  },
  button: {
    width: 84,
    height: 84,
    borderRadius: 84/2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '400',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 54,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    padding: 24,
    paddingBottom: 32,
    minHeight: Platform.OS === 'ios' ? 220 : 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 100,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 16,
  },
});

export default CalculatorScreen; 