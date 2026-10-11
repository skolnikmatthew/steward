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
import { RootStackParamList, Income } from '../types';
import { colors, fonts, spacing } from '../theme';
import { loadIncome, deleteIncome } from '../storage';
import * as Haptics from 'expo-haptics';

type Props = StackScreenProps<RootStackParamList, 'Income'>;

type Section = {
  title: string;
  total: number;
  data: Income[];
};

function monthKey(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByMonth(items: Income[]): Section[] {
  const map = new Map<string, Income[]>();
  for (const item of items) {
    const key = monthKey(item.date);
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([title, data]) => ({
    title,
    data,
    total: data.reduce((sum, i) => sum + parseFloat(i.amount), 0),
  }));
}

export default function IncomeScreen({ navigation, route }: Props) {
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

  const fetchIncome = useCallback(async () => {
    const all = await loadIncome();
    const filtered = month ? all.filter((i) => i.date.startsWith(month)) : all;
    setSections(groupByMonth(filtered));
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      fetchIncome();
    }, [fetchIncome])
  );

  async function handleDelete(id: string) {
    await deleteIncome(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchIncome();
  }

  function renderRightActions(item: Income) {
    const close  = () => swipeableRefs.current.get(item.id)?.close();
    const label  = item.description || 'Income';
    const amount = parseFloat(item.amount).toFixed(2);
    return (
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.green2 }]}
          onPress={() => {
            close();
            (navigation as any).navigate('AddIncome', item);
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
    await fetchIncome();
    setRefreshing(false);
  }

  function renderSectionHeader({ section }: { section: Section }) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionTotal}>${section.total.toFixed(2)}</Text>
      </View>
    );
  }

  function renderItem({ item }: { item: Income }) {
    return (
      <Swipeable
        ref={(ref) => swipeableRefs.current.set(item.id, ref)}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <View style={styles.rowMiddle}>
            <Text style={styles.rowDescription} numberOfLines={1}>
              {item.description || 'Income'}
            </Text>
            <Text style={styles.rowMeta}>{formatShortDate(item.date)}</Text>
          </View>
          <Text style={styles.rowAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No income yet.</Text>
        <Text style={styles.emptySubtitle}>Tap + to record your first income entry.</Text>
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddIncome')}
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
    color: colors.green2,
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
    marginRight: spacing.md,
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
    color: colors.green2,
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
    marginLeft: spacing.lg,
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
    backgroundColor: colors.green2,
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
