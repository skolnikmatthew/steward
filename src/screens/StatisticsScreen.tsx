import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Expense, CategoryBudget } from '../types';
import { colors, fontFamily, fonts } from '../theme';
import { loadExpenses, loadBudgets } from '../storage';
import { CATEGORIES } from '../categories';

type Props = StackScreenProps<RootStackParamList, 'Statistics'>;

function toYYYYMM(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function StatisticsScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);

  const fetchData = useCallback(async () => {
    const [exp, bud] = await Promise.all([loadExpenses(), loadBudgets()]);
    setExpenses(exp);
    setBudgets(bud);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  function prevMonth() {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      return n;
    });
  }

  function nextMonth() {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
  }

  const selectedMonth = toYYYYMM(selectedDate);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const totalSpent = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const budgetMap: Record<string, number> = {};
  budgets.forEach((b) => { budgetMap[b.category] = b.limit; });

  const categoryData = CATEGORIES.map((cat) => {
    const spent = monthExpenses
      .filter((e) => e.category === cat.id)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const limit = budgetMap[cat.id];
    return { id: cat.id, label: cat.label, spent, limit };
  }).filter((cat) => cat.spent > 0 || cat.limit !== undefined);

  const allEmpty = categoryData.length === 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
            <Text style={styles.navArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthLabel(selectedDate)}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
            <Text style={styles.navArrowText}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL SPENT</Text>
          <Text style={styles.totalAmount}>${totalSpent.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {allEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses this month.</Text>
          </View>
        ) : (
          categoryData.map((cat) => {
            const hasLimit = cat.limit !== undefined;
            const pct = hasLimit ? Math.min((cat.spent / cat.limit!) * 100, 100) : 100;
            const isOver = hasLimit && cat.spent > cat.limit!;
            const fillColor = !hasLimit
              ? colors.ink4
              : isOver ? colors.destructive : colors.amber;
            const percentage = hasLimit ? Math.round((cat.spent / cat.limit!) * 100) : 0;

            return (
              <View key={cat.id} style={styles.catRow}>
                <View style={styles.catTopLine}>
                  <Text style={styles.catName}>{cat.label}</Text>
                  <Text style={styles.catAmount}>${cat.spent.toFixed(2)}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
                </View>
                <View style={styles.catBottomLine}>
                  {hasLimit ? (
                    <Text style={styles.catLimit}>
                      ${cat.spent.toFixed(2)} of ${cat.limit!.toFixed(2)} limit
                    </Text>
                  ) : (
                    <Text style={styles.catNoLimit}>No limit set</Text>
                  )}
                  {hasLimit && (
                    <Text style={styles.catPercent}>{percentage}%</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.manageBudgetsBtn}
          onPress={() => navigation.navigate('BudgetSettings')}
          activeOpacity={0.7}
        >
          <Text style={styles.manageBudgetsText}>Manage budgets</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  header: {
    backgroundColor: colors.parchment3,
    borderBottomWidth: 2,
    borderBottomColor: colors.rule,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navArrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontFamily: fonts.fellEnglish,
    fontSize: 20,
    color: colors.ink3,
    lineHeight: 24,
  },
  monthLabel: {
    fontFamily: fonts.fellEnglishItalic,
    fontSize: 15,
    color: colors.ink2,
  },
  totalRow: {
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 9,
    color: colors.ink4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  totalAmount: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    color: colors.amber,
    lineHeight: 38,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 14,
    paddingBottom: 24,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 14,
    color: colors.ink4,
    textAlign: 'center',
  },
  catRow: {
    marginBottom: 18,
  },
  catTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catName: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.ink,
  },
  catAmount: {
    fontFamily: fontFamily.serif,
    fontSize: 14,
    color: colors.amber,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.parchment3,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
  },
  catBottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLimit: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: colors.ink3,
  },
  catNoLimit: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: colors.ink4,
  },
  catPercent: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: colors.ink3,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  manageBudgetsBtn: {
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 4,
  },
  manageBudgetsText: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.ink3,
  },
});
