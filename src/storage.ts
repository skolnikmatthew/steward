import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Income, CategoryBudget } from './types';

const KEY = '@ledger:expenses';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export async function saveExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const expenses = await loadExpenses();
  const expense: Expense = { ...data, id: generateId() };
  await AsyncStorage.setItem(KEY, JSON.stringify([expense, ...expenses]));
  return expense;
}

export async function updateExpense(expense: Expense): Promise<void> {
  const expenses = await loadExpenses();
  const updated = expenses.map((e) => e.id === expense.id ? expense : e);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function deleteExpense(id: string): Promise<void> {
  const expenses = await loadExpenses();
  const updated = expenses.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

const INCOME_KEY = '@ledger:income';

export async function loadIncome(): Promise<Income[]> {
  try {
    const raw = await AsyncStorage.getItem(INCOME_KEY);
    return raw ? (JSON.parse(raw) as Income[]) : [];
  } catch {
    return [];
  }
}

export async function saveIncome(data: Omit<Income, 'id'>): Promise<Income> {
  const items = await loadIncome();
  const income: Income = { ...data, id: generateId() };
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify([income, ...items]));
  return income;
}

export async function updateIncome(income: Income): Promise<void> {
  const items = await loadIncome();
  const updated = items.map((i) => i.id === income.id ? income : i);
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(updated));
}

export async function deleteIncome(id: string): Promise<void> {
  const items = await loadIncome();
  const updated = items.filter((i) => i.id !== id);
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(updated));
}

const BUDGETS_KEY = '@ledger:budgets';

export async function loadBudgets(): Promise<CategoryBudget[]> {
  try {
    const raw = await AsyncStorage.getItem(BUDGETS_KEY);
    return raw ? (JSON.parse(raw) as CategoryBudget[]) : [];
  } catch {
    return [];
  }
}

export async function saveBudgets(budgets: CategoryBudget[]): Promise<void> {
  await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}
