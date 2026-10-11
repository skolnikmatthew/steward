export type Expense = {
  id: string;
  amount: string;
  description: string;
  category: string;
  date: string;
};

export type Income = {
  id: string;
  amount: string;
  description: string;
  date: string;
};

export type CategoryBudget = {
  category: string;
  limit: number;
};

export type RootStackParamList = {
  Home: undefined;
  Ledger: { month?: string } | undefined;
  AddExpense: { id?: string; amount?: string; description?: string; category?: string; date?: string } | undefined;
  Income: { month?: string } | undefined;
  AddIncome: { id?: string; amount?: string; description?: string; date?: string } | undefined;
  Statistics: undefined;
  BudgetSettings: undefined;
};
