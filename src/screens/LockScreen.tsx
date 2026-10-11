import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme';

type Props = {
  onAuthenticate: () => void;
};

export default function LockScreen({ onAuthenticate }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon} />
      <Text style={styles.title}>Steward</Text>
      <Text style={styles.subtitle}>Your financial companion</Text>
      <TouchableOpacity style={styles.button} onPress={onAuthenticate}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>Uses Face ID or passcode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: colors.parchment2,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  title: {
    marginTop: 16,
    fontFamily: fontFamily.serif,
    fontSize: 28,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.ink3,
  },
  button: {
    marginTop: 40,
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  buttonText: {
    fontFamily: fontFamily.serif,
    fontSize: 16,
    color: colors.ink,
  },
  hint: {
    marginTop: 12,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.ink4,
  },
});
