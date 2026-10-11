import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { RootStackParamList } from './src/types';
import { colors, fonts, fontFamily } from './src/theme';
import { useAuth } from './src/hooks/useAuth';
import LockScreen          from './src/screens/LockScreen';
import HomeScreen          from './src/screens/HomeScreen';
import LedgerScreen        from './src/screens/LedgerScreen';
import IncomeScreen        from './src/screens/IncomeScreen';
import AddExpenseScreen    from './src/screens/AddExpenseScreen';
import AddIncomeScreen     from './src/screens/AddIncomeScreen';
import StatisticsScreen    from './src/screens/StatisticsScreen';
import BudgetSettingsScreen from './src/screens/BudgetSettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

const sharedHeaderStyle = {
  backgroundColor: colors.parchment2,
  elevation: 0,
  shadowOpacity: 0,
  borderBottomWidth: 1,
  borderBottomColor: colors.rule,
} as const;

function CancelButton({ navigation }: { navigation: any }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{ marginLeft: 16 }}
    >
      <Text style={{
        fontFamily: fontFamily.sans,
        fontSize: 14,
        color: colors.ink2,
        letterSpacing: 0.5,
      }}>
        Cancel
      </Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const { isAuthenticated, isChecking, authenticate } = useAuth();

  const [fontsLoaded] = useFonts({
    [fontFamily.serif]:      PlayfairDisplay_700Bold,
    [fontFamily.serifItalic]: PlayfairDisplay_400Regular_Italic,
    [fontFamily.sans]:       DMSans_400Regular,
    [fontFamily.sansMedium]: DMSans_500Medium,
    [fontFamily.mono]:       DMMono_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.parchment }} />;
  }

  if (isChecking) {
    return <View style={{ flex: 1, backgroundColor: '#111118' }} />;
  }

  if (!isAuthenticated) {
    return <LockScreen onAuthenticate={authenticate} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: sharedHeaderStyle as any,
          headerTintColor: colors.ink,
          headerTitleStyle: {
            fontFamily: fontFamily.serif,
            fontSize: 20,
            color: colors.ink,
          },
          cardStyle: { backgroundColor: colors.parchment },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Steward' }}
        />
        <Stack.Screen
          name="Ledger"
          component={LedgerScreen}
          options={{ title: 'Expenses' }}
        />
        <Stack.Screen
          name="Income"
          component={IncomeScreen}
          options={{ title: 'Income' }}
        />
        <Stack.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{ title: 'Statistics' }}
        />
        <Stack.Screen
          name="BudgetSettings"
          component={BudgetSettingsScreen}
          options={{ title: 'Budget Limits' }}
        />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={({ navigation }) => ({
              title: 'New Entry',
              headerLeft: () => <CancelButton navigation={navigation} />,
            })}
          />
          <Stack.Screen
            name="AddIncome"
            component={AddIncomeScreen}
            options={({ navigation }) => ({
              title: 'New Income',
              headerLeft: () => <CancelButton navigation={navigation} />,
            })}
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}
