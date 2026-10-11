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
import { loadIncome, saveIncome, updateIncome } from '../storage';
import * as Haptics from 'expo-haptics';

type Props = StackScreenProps<RootStackParamList, 'AddIncome'>;

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

export default function AddIncomeScreen({ navigation, route }: Props) {
  const params = route.params as
    { id?: string; amount?: string; description?: string; date?: string } | undefined;

  const isEditing = !!params?.id;

  const [amount,           setAmount]           = useState(params?.amount ?? '');
  const [description,      setDescription]      = useState(params?.description ?? '');
  const [date,             setDate]             = useState(params?.date ?? todayISO());
  const [saving,           setSaving]           = useState(false);
  const [amountError,      setAmountError]      = useState('');
  const [pastDescriptions, setPastDescriptions] = useState<string[]>([]);
  const [descFocused,      setDescFocused]      = useState(false);

  const amountRef      = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  // Screen title
  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Income' : 'New Income' });
  }, [isEditing, navigation]);

  // Auto-focus amount after screen transition completes
  useEffect(() => {
    const timer = setTimeout(() => amountRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load past descriptions for autocomplete (most-recent first)
  useEffect(() => {
    loadIncome().then((entries) => {
      const seen = new Set<string>();
      const unique: string[] = [];
      for (let i = entries.length - 1; i >= 0; i--) {
        const d = entries[i].description.trim();
        if (d && !seen.has(d.toLowerCase())) {
          seen.add(d.toLowerCase());
          unique.push(d);
        }
      }
      setPastDescriptions(unique);
    });
  }, []);

  // Autocomplete suggestions: starts-with match, min 2 chars, max 3
  const suggestions =
    descFocused && description.length >= 2
      ? pastDescriptions
          .filter((d) => d.toLowerCase().startsWith(description.toLowerCase()))
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

  function handleSuggestionSelect(value: string) {
    setDescription(value);
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
        await updateIncome({
          id: params!.id!,
          amount: parsed.toFixed(2),
          description: description.trim(),
          date,
        });
      } else {
        await saveIncome({
          amount: parsed.toFixed(2),
          description: description.trim(),
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
                    key={item}
                    style={[
                      styles.suggestionRow,
                      index < suggestions.length - 1 && styles.suggestionRowBorder,
                    ]}
                    onPress={() => handleSuggestionSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
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
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Record Income'}
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
    backgroundColor: colors.green2,
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
