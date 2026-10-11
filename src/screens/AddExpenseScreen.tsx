import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, fonts, fontFamily, spacing, radius } from '../theme';
import { CATEGORIES } from '../categories';
import CategoryStamp from '../components/CategoryStamp';
import { loadExpenses, saveExpense, updateExpense } from '../storage';
import * as Haptics from 'expo-haptics';

type Props = StackScreenProps<RootStackParamList, 'AddExpense'>;

const DESC_MAX = 55;
const DESC_WARN = 45;

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function AddExpenseScreen({ navigation, route }: Props) {
  const params = route.params as
    { id?: string; amount?: string; description?: string; category?: string; date?: string } | undefined;

  const isEditing = !!params?.id;

  const [amount,           setAmount]           = useState(params?.amount ?? '');
  const [description,      setDescription]      = useState(params?.description ?? '');
  const [category,         setCategory]         = useState(params?.category ?? CATEGORIES[0].id);
  const [date,             setDate]             = useState(params?.date ?? todayISO());
  const [saving,           setSaving]           = useState(false);
  const [amountError,      setAmountError]      = useState('');
  const [pastDescriptions, setPastDescriptions] = useState<{ description: string; category: string }[]>([]);
  const [descFocused,      setDescFocused]      = useState(false);

  const amountRef      = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  // Screen title
  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Entry' : 'New Entry' });
  }, [isEditing, navigation]);

  // Auto-focus amount after screen transition completes
  useEffect(() => {
    const timer = setTimeout(() => amountRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load past descriptions for autocomplete (most-recent first)
  useEffect(() => {
    loadExpenses().then((expenses) => {
      const seen = new Set<string>();
      const unique: { description: string; category: string }[] = [];
      for (let i = expenses.length - 1; i >= 0; i--) {
        const d = expenses[i].description.trim();
        const c = expenses[i].category;
        const key = `${d.toLowerCase()}|${c}`;
        if (d && !seen.has(key)) {
          seen.add(key);
          unique.push({ description: d, category: c });
        }
      }
      setPastDescriptions(unique);
    });
  }, []);

  // Autocomplete suggestions: starts-with match, min 2 chars, max 3
  const suggestions =
    descFocused && description.length >= 2
      ? pastDescriptions
          .filter((e) => e.description.toLowerCase().startsWith(description.toLowerCase()))
          .slice(0, 3)
      : [];

  function handleAmountChange(text: string) {
    setAmount(text);
    if (amountError) setAmountError('');
  }

  function handleDescriptionChange(text: string) {
    setDescription(text);
  }

  function handleDescBlur() {
    // Delay so a suggestion tap registers before the dropdown hides
    setTimeout(() => setDescFocused(false), 150);
  }

  function handleSuggestionSelect(entry: { description: string; category: string }) {
    setDescription(entry.description);
    setCategory(entry.category);
    setDescFocused(false);
    Keyboard.dismiss();
  }

  async function handleSave() {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed)) {
      setAmountError('Please enter a valid amount');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (parsed <= 0) {
      setAmountError('Amount must be greater than zero');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (parsed > 999999.99) {
      setAmountError('Amount is too large');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updateExpense({
          id: params!.id!,
          amount: parsed.toFixed(2),
          description: description.trim(),
          category,
          date,
        });
      } else {
        await saveExpense({
          amount: parsed.toFixed(2),
          description: description.trim(),
          category,
          date,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save entry. Try again.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.parchment }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Amount ── */}
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <View style={styles.amountInputWrapper}>
              {amount === '' && (
                <Text style={styles.amountPlaceholder} pointerEvents="none">0.00</Text>
              )}
              <TextInput
                ref={amountRef}
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder=""
                keyboardType="decimal-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => descriptionRef.current?.focus()}
              />
            </View>
          </View>

          {amountError !== '' && (
            <Text style={styles.amountError}>{amountError}</Text>
          )}

          <View style={styles.rule} />

          {/* ── Description ── */}
          <Text style={styles.label}>Description</Text>
          <View style={styles.descriptionSection}>
            <TextInput
              ref={descriptionRef}
              style={styles.textInput}
              value={description}
              onChangeText={handleDescriptionChange}
              onFocus={() => setDescFocused(true)}
              onBlur={handleDescBlur}
              placeholder="What was this for?"
              placeholderTextColor={colors.ink4}
              maxLength={DESC_MAX}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {suggestions.length > 0 && (
              <View style={styles.suggestionsDropdown}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.description}|${item.category}`}
                    style={[
                      styles.suggestionRow,
                      index < suggestions.length - 1 && styles.suggestionRowBorder,
                    ]}
                    onPress={() => handleSuggestionSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{item.description}</Text>
                    <View style={styles.suggestionCategoryWrap}>
                      <Text style={styles.suggestionDot}>·</Text>
                      <Text style={styles.suggestionCategory}>{item.category}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <Text style={[
            styles.charCounter,
            description.length > DESC_WARN && styles.charCounterOver,
          ]}>
            {description.length} / {DESC_MAX}
          </Text>

          <View style={styles.rule} />

          {/* ── Category ── */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.stampGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.stampCell}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.7}
              >
                <CategoryStamp
                  category={cat.id}
                  size={64}
                  selected={category === cat.id}
                />
                <Text style={[
                  styles.stampLabel,
                  category === cat.id && styles.stampLabelSelected,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rule} />

          {/* ── Date ── */}
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => setDate((d) => shiftDate(d, -1))}
            >
              <Text style={styles.dateArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => setDate((d) => shiftDate(d, 1))}
            >
              <Text style={styles.dateArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rule} />

          {/* ── Save ── */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
              amount === '' && styles.saveButtonNotReady,
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Record Entry'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // ── Amount ─────────────────────────────────────
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  currencySymbol: {
    fontFamily: fonts.fellEnglish,
    fontSize: 32,
    color: colors.amber,
    marginBottom: 6,
    marginRight: 4,
  },
  amountInputWrapper: {
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountPlaceholder: {
    position: 'absolute',
    fontSize: 56,
    color: colors.ink4,
  },
  amountInput: {
    fontFamily: fonts.fellEnglish,
    fontSize: 56,
    color: colors.amber,
    minWidth: 140,
    textAlign: 'center',
    padding: 0,
  },
  amountError: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: colors.destructive,
    textAlign: 'center',
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },

  rule: {
    height: 1,
    backgroundColor: colors.rule,
    marginVertical: spacing.lg,
  },
  label: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  // ── Description + autocomplete ─────────────────
  descriptionSection: {
    zIndex: 10,
  },
  textInput: {
    fontFamily: fonts.fellEnglish,
    fontSize: 18,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule2,
    paddingVertical: spacing.sm,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: colors.parchment2,
    borderWidth: 1,
    borderColor: colors.rule,
    zIndex: 999,
    elevation: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  suggestionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule2,
  },
  suggestionText: {
    fontFamily: fontFamily.serif,
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  suggestionCategoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },
  suggestionDot: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.ink3,
    marginRight: 4,
  },
  suggestionCategory: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.ink3,
  },
  charCounter: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: colors.ink4,
    textAlign: 'right',
    marginTop: 4,
  },
  charCounterOver: {
    color: colors.destructive,
  },

  // ── Category ───────────────────────────────────
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  stampCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  stampLabel: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: colors.ink2,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  stampLabelSelected: {
    color: colors.green,
    fontFamily: fonts.dmMono,
  },

  // ── Date ───────────────────────────────────────
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrow: {
    padding: spacing.md,
  },
  dateArrowText: {
    fontFamily: fonts.fellEnglish,
    fontSize: 32,
    color: colors.green,
    lineHeight: 36,
  },
  dateText: {
    fontFamily: fonts.fellEnglishItalic,
    fontSize: 18,
    color: colors.ink,
    flex: 1,
    textAlign: 'center',
  },

  // ── Save button ────────────────────────────────
  saveButton: {
    backgroundColor: colors.green,
    borderRadius: radius.medium,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: colors.greendim,
  },
  saveButtonNotReady: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: fonts.fellEnglish,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 0.5,
  },
});
