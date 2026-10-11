import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Expense, Income } from '../types';
import { colors, fonts, radius } from '../theme';
import { loadExpenses, loadIncome } from '../storage';
import { getCategoryLabel } from '../categories';
import { HandCoins, Receipt, BarChart2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

function toYYYYMM(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HomeScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allIncome,   setAllIncome]   = useState<Income[]>([]);
  const [fabOpen,     setFabOpen]     = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    const [expenses, income] = await Promise.all([loadExpenses(), loadIncome()]);
    setAllExpenses(expenses);
    setAllIncome(income);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      return () => {
        fabAnim.setValue(0);
        setFabOpen(false);
      };
    }, [fetchData, fabAnim])
  );

  function openFab() {
    setFabOpen(true);
    Animated.timing(fabAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }

  function closeFab(then?: () => void) {
    Animated.timing(fabAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setFabOpen(false);
      then?.();
    });
  }

  function toggleFab() {
    if (fabOpen) {
      closeFab();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      openFab();
    }
  }

  function navigateFromFab(route: 'AddExpense' | 'AddIncome') {
    setFabOpen(false);
    fabAnim.setValue(0);
    navigation.navigate(route);
  }

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
  const expenseTotal  = allExpenses
    .filter((e) => e.date.startsWith(selectedMonth))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const incomeTotal   = allIncome
    .filter((i) => i.date.startsWith(selectedMonth))
    .reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const remaining     = incomeTotal - expenseTotal;

  const recentExpenses = allExpenses.slice(0, 5);

  const fabRotation = fabAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.screen}>

      {/* ════════════════════════════════════════
          HEADER  (parchment3, 2px border-bottom)
      ════════════════════════════════════════ */}
      <View style={styles.header}>

        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
            <Text style={styles.navArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthLabel(selectedDate)}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
            <Text style={styles.navArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Remaining — centered, full width */}
        <View style={styles.remainingRow}>
          <Text style={styles.remainingLabel}>Remaining</Text>
          <Text style={[
            styles.remainingAmount,
            { color: remaining >= 0 ? colors.green2 : colors.destructive },
          ]}>
            ${remaining.toFixed(2)}
          </Text>
        </View>

        {/* Income + Expenses side-by-side cards */}
        <View style={styles.miniCards}>
          <TouchableOpacity
            style={styles.miniCard}
            activeOpacity={0.6}
            onPress={() => navigation.navigate('Income', { month: selectedMonth })}
          >
            <Text style={styles.miniCardLabel}>Income</Text>
            <Text style={[styles.miniCardAmount, { color: colors.green2 }]}>
              ${incomeTotal.toFixed(2)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.miniCard}
            activeOpacity={0.6}
            onPress={() => navigation.navigate('Ledger', { month: selectedMonth })}
          >
            <Text style={styles.miniCardLabel}>Expenses</Text>
            <Text style={[styles.miniCardAmount, { color: colors.amber }]}>
              ${expenseTotal.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ════════════════════════════════════════
          BODY  (parchment, scrollable)
      ════════════════════════════════════════ */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ornamental divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Recent entries</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Recent entries list */}
        {recentExpenses.length === 0 ? (
          <View style={[styles.recentList, styles.recentEmpty]}>
            <Text style={styles.emptyText}>No entries yet.</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentExpenses.map((expense, index) => (
              <React.Fragment key={expense.id}>
                {index > 0 && <View style={styles.rowSeparator} />}
                <TouchableOpacity
                  style={[
                    styles.recentRow,
                    { backgroundColor: index % 2 === 0 ? colors.parchment2 : colors.parchment },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Ledger', {})}
                >
                  <View style={styles.recentRowLeft}>
                    <Text style={styles.recentDescription} numberOfLines={1}>
                      {expense.description || getCategoryLabel(expense.category)}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {getCategoryLabel(expense.category)}{'  ·  '}{formatShortDate(expense.date)}
                    </Text>
                  </View>
                  <Text style={styles.recentAmount}>
                    ${parseFloat(expense.amount).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ════════════════════════════════════════
          FAB SYSTEM  (absolutely positioned)
      ════════════════════════════════════════ */}

      {/* Dim overlay — tapping closes the FAB */}
      {fabOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => closeFab()}
        />
      )}

      {/* Option 2 — Income (140px above FAB) */}
      {fabOpen && (
        <Animated.View style={[styles.fabOption, { bottom: 32 + 140, opacity: fabAnim }]}>
          <Text style={styles.fabOptionLabel}>Income</Text>
          <TouchableOpacity
            style={[styles.fabOptionBtn, { backgroundColor: colors.green2 }]}
            activeOpacity={0.8}
            onPress={() => navigateFromFab('AddIncome')}
          >
            <HandCoins size={18} color={colors.ink} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Option 1 — Expense (70px above FAB) */}
      {fabOpen && (
        <Animated.View style={[styles.fabOption, { bottom: 32 + 70, opacity: fabAnim }]}>
          <Text style={styles.fabOptionLabel}>Expense</Text>
          <TouchableOpacity
            style={[styles.fabOptionBtn, { backgroundColor: colors.amber }]}
            activeOpacity={0.8}
            onPress={() => navigateFromFab('AddExpense')}
          >
            <Receipt size={18} color={colors.ink} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Stats FAB — bottom left */}
      <TouchableOpacity
        style={styles.statsFab}
        onPress={() => navigation.navigate('Statistics')}
        activeOpacity={0.85}
      >
        <BarChart2 size={22} color={colors.ink2} />
      </TouchableOpacity>

      {/* Main FAB */}
      <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
        <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
          <Text style={styles.fabIcon}>+</Text>
        </Animated.View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },

  // ── Header ──────────────────────────────────
  header: {
    backgroundColor: colors.parchment3,
    borderBottomWidth: 2,
    borderBottomColor: colors.rule,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
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

  // ── Remaining (centered) ─────────────────────
  remainingRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'center',
  },
  remainingLabel: {
    fontFamily: fonts.dmMono,
    fontSize: 8,
    color: colors.ink4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  remainingAmount: {
    fontFamily: fonts.fellEnglish,
    fontSize: 30,
    lineHeight: 36,
  },

  // ── Mini cards (Income / Expenses) ───────────
  miniCards: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
  },
  miniCard: {
    flex: 1,
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.small,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  miniCardLabel: {
    fontFamily: fonts.dmMono,
    fontSize: 7,
    color: colors.ink4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  miniCardAmount: {
    fontFamily: fonts.fellEnglish,
    fontSize: 14,
    lineHeight: 17,
  },

  // ── Body ─────────────────────────────────────
  body: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  bodyContent: {
    padding: 14,
    paddingBottom: 120,
  },

  // ── Ornamental divider ────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.rule,
  },
  dividerText: {
    fontFamily: fonts.dmMono,
    fontSize: 9,
    color: colors.ink3,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },

  // ── Recent entries list ───────────────────────
  recentList: {
    borderWidth: 1,
    borderColor: colors.rule2,
    borderRadius: radius.small,
    overflow: 'hidden',
  },
  recentEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.fellEnglishItalic,
    fontSize: 13,
    color: colors.ink4,
  },
  rowSeparator: {
    height: 1,
    backgroundColor: colors.rule2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  recentRowLeft: {
    flex: 1,
    marginRight: 8,
  },
  recentDescription: {
    fontFamily: fonts.fellEnglishItalic,
    fontSize: 13,
    color: colors.ink,
  },
  recentMeta: {
    fontFamily: fonts.dmMono,
    fontSize: 8,
    color: colors.ink3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  recentAmount: {
    fontFamily: fonts.fellEnglish,
    fontSize: 13,
    color: colors.amber,
  },

  // ── FAB system ───────────────────────────────
  statsFab: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.parchment2,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.green2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontFamily: fonts.fellEnglish,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 34,
  },
  fabOption: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabOptionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabOptionLabel: {
    fontFamily: fonts.dmMono,
    fontSize: 9,
    color: colors.ink2,
    marginRight: 10,
  },
});
