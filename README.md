# Steward — Personal Finance App

> Track it. Understand it. Own it.

Steward is a personal finance app for iOS built with React Native and Expo. 
Log expenses and income, track spending by category against monthly budgets, 
and visualize your financial habits — all stored locally on device with no 
accounts or cloud sync required.

## Features

- **Expense & income logging** — quickly log purchases with category stamps, 
  description autocomplete, and date selection
- **Monthly overview** — see income, expenses, and remaining balance at a glance
- **Category statistics** — visualize spending by category with progress bars 
  against budget limits
- **Budget limits** — set monthly limits per category with visual indicators
- **Face ID / Touch ID** — biometric authentication protects your financial data
- **Swipe to edit or delete** — native iOS swipe gestures on all entries
- **Dark premium design** — Playfair Display serif type, warm cream on ink black

## Tech Stack

- React Native + Expo (TypeScript)
- AsyncStorage for local persistence
- React Navigation (stack navigator)
- expo-local-authentication (Face ID / Touch ID)
- react-native-svg (category stamp icons)
- react-native-gesture-handler (swipe interactions)
- expo-haptics (haptic feedback)
- Lucide React Native (icons)
- Jest (109 unit tests)

## Project Structure

\`\`\`
src/
  theme.ts              — design tokens (colors, fonts, spacing)
  types.ts              — TypeScript types
  storage.ts            — AsyncStorage CRUD functions
  categories.ts         — category definitions and SVG paths
  screens/              — all app screens
  components/           — CategoryStamp component
  hooks/                — useAuth authentication hook
  __tests__/            — 109 unit tests
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

109 tests covering storage CRUD, financial calculations, 
input validation, date edge cases, and autocomplete logic.

## Design

The UI draws on editorial and heritage design — Playfair Display 
for amounts and headings, DM Sans for labels, warm cream text on 
a near-black background. Category stamps are custom SVG ink seal 
components. The app has no external design dependencies.

## Status

In active development. Currently running via Expo Go. 
App Store release planned.

## Author

Matthew Skolnik — [LinkedIn](https://linkedin.com/in/matthewskolnik)
