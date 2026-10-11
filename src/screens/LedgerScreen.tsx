import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Alert,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Expense } from '../types';
import { colors, fonts, spacing } from '../theme';
import { loadExpenses, deleteExpense } from '../storage';
import * as Haptics from 'expo-haptics';
import { getCategoryLabel } from '../categories';
import CategoryStamp from '../components/CategoryStamp';

type Props = StackScreenProps<RootStackParamList, 'Ledger'>;

type Section = {
  title: string;
  total: number;
  data: Expense[];
};

function monthKey(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByMonth(expenses: Expense[]): Section[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const key = monthKey(e.date);
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([title, data]) => ({
    title,
    data,
    total: data.reduce((sum, e) => sum + parseFloat(e.amount), 0),
  }));
}

export default function LedgerScreen({ navigation, route }: Props) {
  const month = (route.params as { month?: string } | undefined)?.month;

  const [sections,   setSections]   = useState<Section[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  useEffect(() => {
    if (month) {
      const d = new Date(month + '-01T00:00:00');
      navigation.setOptions({
        title: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
    }
  }, [month, navigation]);

  const fetchExpenses = useCallback(async () => {
    const all = await loadExpenses();
    const filtered = month ? all.filter((e) => e.date.startsWith(month)) : all;
    setSections(groupByMonth(filtered));
  }, [month]);

  // Reload whenever the screen comes into focus (e.g. after adding an entry)
  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses])
  );

  async function handleDelete(id: string) {
    await deleteExpense(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchExpenses();
  }

  function renderRightActions(item: Expense) {
    const close = () => swipeableRefs.current.get(item.id)?.close();
    const label = item.description || getCategoryLabel(item.category);
    const amount = parseFloat(item.amount).toFixed(2);
    return (
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.green2 }]}
          onPress={() => {
            close();
            (navigation as any).navigate('AddExpense', item);
          }}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.destructive }]}
          onPress={() => {
            close();
            Alert.alert(
              'Remove entry?',
              `Remove '${label}' — $${amount} from your ledger?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => handleDelete(item.id) },
              ],
            );
          }}
        >
          <Text style={styles.actionText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  }

  function renderSectionHeader({ section }: { section: Section }) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionTotal}>
          ${section.total.toFixed(2)}
        </Text>
      </View>
    );
  }

  function renderItem({ item }: { item: Expense }) {
    return (
      <Swipeable
        ref={(ref) => swipeableRefs.current.set(item.id, ref)}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
        >
          <CategoryStamp category={item.category} size={40} />
          <View style={styles.rowMiddle}>
            <Text style={styles.rowDescription} numberOfLines={1}>
              {item.description || getCategoryLabel(item.category)}
            </Text>
            <Text style={styles.rowMeta}>
              {getCategoryLabel(item.category)}  ·  {formatShortDate(item.date)}
            </Text>
          </View>
          <Text style={styles.rowAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No entries yet.</Text>
        <Text style={styles.emptySubtitle}>
          Tap + to record your first expense.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.ink3}
          />
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        stickySectionHeadersEnabled
      />

      {/* Floating add button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  listContent: {
    paddingBottom: 96,
  },
  emptyContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: colors.parchment2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  sectionTitle: {
    fontFamily: fonts.fellEnglishItalic,
    fontSize: 16,
    color: colors.ink,
  },
  sectionTotal: {
    fontFamily: fonts.dmMono,
    fontSize: 13,
    color: colors.amberdim,
  },
  sectionGap: {
    height: spacing.md,
    backgroundColor: colors.parchment3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.parchment,
  },
  rowMiddle: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  rowDescription: {
    fontFamily: fonts.fellEnglish,
    fontSize: 15,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: colors.ink3,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  rowAmount: {
    fontFamily: fonts.fellEnglish,
    fontSize: 17,
    color: colors.amber,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: fonts.fellEnglish,
    fontSize: 14,
    color: colors.ink,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: colors.rule2,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontFamily: fonts.fellEnglishItalic,
    fontSize: 22,
    color: colors.ink3,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: fonts.dmMono,
    fontSize: 12,
    color: colors.ink4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    fontFamily: fonts.fellEnglish,
    fontSize: 32,
    color: colors.ink,
    lineHeight: 38,
  },
});
