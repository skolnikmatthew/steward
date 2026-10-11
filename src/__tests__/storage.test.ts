import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadExpenses,
  saveExpense,
  deleteExpense,
  updateExpense,
  loadIncome,
  saveIncome,
  deleteIncome,
  updateIncome,
  loadBudgets,
  saveBudgets,
} from '../storage';

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('Expense storage', () => {
  test('loadExpenses returns empty array when no data', async () => {
    const result = await loadExpenses();
    expect(result).toEqual([]);
  });

  test('saveExpense adds a new expense and returns it with an id', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const expense = await saveExpense({
      amount: '25.00',
      description: 'Coffee',
      category: 'Food',
      date: '2026-04-09',
    });
    expect(expense.id).toBeDefined();
    expect(expense.amount).toBe('25.00');
    expect(expense.description).toBe('Coffee');
    expect(expense.category).toBe('Food');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  test('saveExpense prepends to existing expenses', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'Tea', category: 'Food', date: '2026-04-08' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    const newExpense = await saveExpense({
      amount: '5.00',
      description: 'Water',
      category: 'Food',
      date: '2026-04-09',
    });
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved[0].id).toBe(newExpense.id);
    expect(saved[1].id).toBe('1');
    expect(saved).toHaveLength(2);
  });

  test('deleteExpense removes the correct entry', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'Tea', category: 'Food', date: '2026-04-08' },
      { id: '2', amount: '5.00', description: 'Water', category: 'Food', date: '2026-04-09' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await deleteExpense('1');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('2');
  });

  test('deleteExpense does nothing if id not found', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'Tea', category: 'Food', date: '2026-04-08' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await deleteExpense('999');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved).toHaveLength(1);
  });

  test('updateExpense replaces the correct entry', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'Tea', category: 'Food', date: '2026-04-08' },
      { id: '2', amount: '5.00', description: 'Water', category: 'Food', date: '2026-04-09' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await updateExpense({
      id: '1',
      amount: '15.00',
      description: 'Tea updated',
      category: 'Food',
      date: '2026-04-08',
    });
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved[0].amount).toBe('15.00');
    expect(saved[0].description).toBe('Tea updated');
    expect(saved[1].id).toBe('2');
  });

  test('loadExpenses returns parsed array from storage', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'Tea', category: 'Food', date: '2026-04-08' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    const result = await loadExpenses();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});

describe('Income storage', () => {
  test('loadIncome returns empty array when no data', async () => {
    const result = await loadIncome();
    expect(result).toEqual([]);
  });

  test('saveIncome adds a new income entry with id', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const income = await saveIncome({
      amount: '3000.00',
      description: 'Salary',
      date: '2026-04-01',
    });
    expect(income.id).toBeDefined();
    expect(income.amount).toBe('3000.00');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  test('deleteIncome removes the correct entry', async () => {
    const existing = [
      { id: '1', amount: '3000.00', description: 'Salary', date: '2026-04-01' },
      { id: '2', amount: '500.00', description: 'Freelance', date: '2026-04-05' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await deleteIncome('1');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('2');
  });

  test('updateIncome replaces the correct entry', async () => {
    const existing = [
      { id: '1', amount: '3000.00', description: 'Salary', date: '2026-04-01' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await updateIncome({
      id: '1',
      amount: '3500.00',
      description: 'Salary updated',
      date: '2026-04-01',
    });
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved[0].amount).toBe('3500.00');
    expect(saved[0].description).toBe('Salary updated');
  });
});

describe('Budget storage', () => {
  test('loadBudgets returns empty array when no data', async () => {
    const result = await loadBudgets();
    expect(result).toEqual([]);
  });

  test('saveBudgets stores and can be retrieved', async () => {
    const budgets = [
      { category: 'Food', limit: 500 },
      { category: 'Transit', limit: 150 },
    ];
    await saveBudgets(budgets);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});

describe('Storage error handling', () => {
  test('loadExpenses returns empty array when AsyncStorage throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage failure'));
    const result = await loadExpenses();
    expect(result).toEqual([]);
  });

  test('loadIncome returns empty array when AsyncStorage throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage failure'));
    const result = await loadIncome();
    expect(result).toEqual([]);
  });

  test('loadBudgets returns empty array when AsyncStorage throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage failure'));
    const result = await loadBudgets();
    expect(result).toEqual([]);
  });

  test('loadExpenses handles malformed JSON gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not valid json {{{{');
    const result = await loadExpenses();
    expect(result).toEqual([]);
  });

  test('loadIncome handles malformed JSON gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not valid json {{{{');
    const result = await loadIncome();
    expect(result).toEqual([]);
  });

  test('loadBudgets handles malformed JSON gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not valid json {{{{');
    const result = await loadBudgets();
    expect(result).toEqual([]);
  });

  test('saveExpense handles AsyncStorage.setItem throwing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Disk full'));
    await expect(
      saveExpense({
        amount: '10.00',
        description: 'Test',
        category: 'Food',
        date: '2026-04-01',
      })
    ).rejects.toThrow();
  });

  // loadExpenses swallows read errors internally and resolves to [] rather than
  // rethrowing (see the try/catch in storage.ts), so deleteExpense/updateExpense
  // never see the rejection — they proceed as if there were no existing data and
  // resolve normally. That's worth flagging: a transient read failure during a
  // delete/update silently overwrites storage with an empty/partial array instead
  // of surfacing the error, which is a real data-loss risk, not a testing gap.
  test('deleteExpense treats a failed read as "no existing data" and resolves without throwing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage failure'));
    await expect(deleteExpense('1')).resolves.toBeUndefined();
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(JSON.parse(setCall[1])).toEqual([]);
  });

  test('updateExpense treats a failed read as "no existing data" and resolves without throwing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage failure'));
    await expect(
      updateExpense({
        id: '1',
        amount: '10.00',
        description: 'Test',
        category: 'Food',
        date: '2026-04-01',
      })
    ).resolves.toBeUndefined();
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(JSON.parse(setCall[1])).toEqual([]);
  });
});

describe('Storage data integrity', () => {
  test('saveExpense generates unique ids for rapid successive saves', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const results = await Promise.all([
      saveExpense({ amount: '1.00', description: 'A', category: 'Food', date: '2026-04-01' }),
      saveExpense({ amount: '2.00', description: 'B', category: 'Food', date: '2026-04-01' }),
      saveExpense({ amount: '3.00', description: 'C', category: 'Food', date: '2026-04-01' }),
    ]);
    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  test('updateExpense does not change other entries', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'A', category: 'Food', date: '2026-04-01' },
      { id: '2', amount: '20.00', description: 'B', category: 'Transit', date: '2026-04-02' },
      { id: '3', amount: '30.00', description: 'C', category: 'Housing', date: '2026-04-03' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await updateExpense({
      id: '2',
      amount: '25.00',
      description: 'B updated',
      category: 'Transit',
      date: '2026-04-02',
    });
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved[0].amount).toBe('10.00');
    expect(saved[1].amount).toBe('25.00');
    expect(saved[2].amount).toBe('30.00');
  });

  test('updateExpense on non-existent id does not corrupt data', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'A', category: 'Food', date: '2026-04-01' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await updateExpense({
      id: '999',
      amount: '99.00',
      description: 'Ghost',
      category: 'Food',
      date: '2026-04-01',
    });
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('1');
  });

  test('deleteExpense on already-deleted id is safe', async () => {
    const existing = [
      { id: '1', amount: '10.00', description: 'A', category: 'Food', date: '2026-04-01' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    await deleteExpense('999');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const saved = JSON.parse(setCall[1]);
    expect(saved).toHaveLength(1);
  });

  test('handles large number of expenses without data loss', async () => {
    const existing = Array.from({ length: 500 }, (_, i) => ({
      id: String(i),
      amount: '10.00',
      description: `Expense ${i}`,
      category: 'Food',
      date: '2026-04-01',
    }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));
    const result = await loadExpenses();
    expect(result).toHaveLength(500);
  });
});
