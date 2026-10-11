import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { colors, fontFamily } from '../theme';
import { loadBudgets, saveBudgets } from '../storage';
import { CATEGORIES } from '../categories';
import CategoryStamp from '../components/CategoryStamp';

type Props = StackScreenProps<RootStackParamList, 'BudgetSettings'>;

export default function BudgetSettingsScreen({ navigation }: Props) {
  const [limits, setLimits] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    const budgets = await loadBudgets();
    const map: Record<string, string> = {};
    budgets.forEach((b) => { map[b.category] = String(b.limit); });
    setLimits(map);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  async function handleSave() {
    const budgets = CATEGORIES
      .map((cat) => {
        const val = limits[cat.id];
        if (!val || val.trim() === '') return null;
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) return null;
        return { category: cat.id, limit: num };
      })
      .filter((b): b is { category: string; limit: number } => b !== null);

    await saveBudgets(budgets);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.catRow}>
            <View style={styles.catLeft}>
              <CategoryStamp category={cat.id} size={32} selected={false} />
              <Text style={styles.catName}>{cat.label}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={limits[cat.id] ?? ''}
              onChangeText={(text) =>
                setLimits((prev) => ({ ...prev, [cat.id]: text }))
              }
              keyboardType="decimal-pad"
              placeholder="No limit"
              placeholderTextColor={colors.ink4}
              returnKeyType="done"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save budget limits</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catName: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.parchment2,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 100,
    fontFamily: fontFamily.mono,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  saveBtn: {
    backgroundColor: colors.green,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: fontFamily.serif,
    fontSize: 15,
    color: colors.ink,
  },
});
