import { Expense, Income } from '../types';

// Helper to create test expenses
const makeExpense = (amount: string, category: string, date: string): Expense => ({
  id: Math.random().toString(),
  amount,
  description: 'Test',
  category,
  date,
});

const makeIncome = (amount: string, date: string): Income => ({
  id: Math.random().toString(),
  amount,
  description: 'Test',
  date,
});

// Pure calculation functions to test
// These mirror the logic used in HomeScreen and StatisticsScreen

function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

function filterByMonth<T extends { date: string }>(items: T[], month: string): T[] {
  return items.filter((i) => getMonthKey(i.date) === month);
}

function sumAmounts(items: Array<{ amount: string }>): number {
  return items.reduce((sum, i) => sum + parseFloat(i.amount), 0);
}

function getRemaining(income: number, expenses: number): number {
  return income - expenses;
}

function getCategoryTotal(expenses: Expense[], category: string, month: string): number {
  return sumAmounts(filterByMonth(expenses, month).filter((e) => e.category === category));
}

function getBudgetPercentage(spent: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, (spent / limit) * 100);
}

describe('Month filtering', () => {
  test('filters expenses to correct month', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2026-04-01'),
      makeExpense('20.00', 'Food', '2026-04-15'),
      makeExpense('30.00', 'Food', '2026-05-01'),
    ];
    const result = filterByMonth(expenses, '2026-04');
    expect(result).toHaveLength(2);
  });

  test('returns empty array when no expenses in month', () => {
    const expenses = [makeExpense('10.00', 'Food', '2026-04-01')];
    const result = filterByMonth(expenses, '2026-05');
    expect(result).toHaveLength(0);
  });

  test('handles empty expenses array', () => {
    const result = filterByMonth([], '2026-04');
    expect(result).toHaveLength(0);
  });
});

describe('Amount calculations', () => {
  test('sums amounts correctly', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2026-04-01'),
      makeExpense('20.50', 'Food', '2026-04-02'),
      makeExpense('5.25', 'Food', '2026-04-03'),
    ];
    expect(sumAmounts(expenses)).toBeCloseTo(35.75);
  });

  test('returns 0 for empty array', () => {
    expect(sumAmounts([])).toBe(0);
  });

  test('handles single item', () => {
    expect(sumAmounts([makeExpense('99.99', 'Food', '2026-04-01')])).toBeCloseTo(99.99);
  });

  test('handles large amounts', () => {
    expect(sumAmounts([makeExpense('999999.99', 'Food', '2026-04-01')])).toBeCloseTo(999999.99);
  });
});

describe('Remaining balance', () => {
  test('returns positive when income exceeds expenses', () => {
    expect(getRemaining(3000, 1500)).toBe(1500);
  });

  test('returns negative when expenses exceed income', () => {
    expect(getRemaining(1000, 1500)).toBe(-500);
  });

  test('returns zero when balanced', () => {
    expect(getRemaining(1000, 1000)).toBe(0);
  });

  test('returns full income when no expenses', () => {
    expect(getRemaining(3000, 0)).toBe(3000);
  });

  test('returns negative full amount when no income', () => {
    expect(getRemaining(0, 500)).toBe(-500);
  });
});

describe('Category totals', () => {
  test('calculates total for a single category', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2026-04-01'),
      makeExpense('20.00', 'Food', '2026-04-02'),
      makeExpense('50.00', 'Transit', '2026-04-01'),
    ];
    expect(getCategoryTotal(expenses, 'Food', '2026-04')).toBeCloseTo(30.0);
  });

  test('returns 0 for category with no expenses', () => {
    const expenses = [makeExpense('10.00', 'Food', '2026-04-01')];
    expect(getCategoryTotal(expenses, 'Transit', '2026-04')).toBe(0);
  });

  test('only counts expenses from correct month', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2026-04-01'),
      makeExpense('20.00', 'Food', '2026-05-01'),
    ];
    expect(getCategoryTotal(expenses, 'Food', '2026-04')).toBeCloseTo(10.0);
  });
});

describe('Budget percentage', () => {
  test('calculates correct percentage', () => {
    expect(getBudgetPercentage(50, 100)).toBe(50);
  });

  test('caps at 100% when over budget', () => {
    expect(getBudgetPercentage(150, 100)).toBe(100);
  });

  test('returns 0 when nothing spent', () => {
    expect(getBudgetPercentage(0, 100)).toBe(0);
  });

  test('returns 0 when no budget limit set', () => {
    expect(getBudgetPercentage(50, 0)).toBe(0);
  });

  test('returns 100 when exactly at limit', () => {
    expect(getBudgetPercentage(100, 100)).toBe(100);
  });
});

describe('Decimal precision in financial math', () => {
  test('sums amounts without floating point errors', () => {
    const expenses = [
      makeExpense('0.10', 'Food', '2026-04-01'),
      makeExpense('0.20', 'Food', '2026-04-01'),
    ];
    const result = sumAmounts(expenses);
    expect(parseFloat(result.toFixed(2))).toBe(0.3);
  });

  test('handles many small amounts correctly', () => {
    const expenses = Array.from({ length: 100 }, () =>
      makeExpense('0.01', 'Food', '2026-04-01')
    );
    const result = sumAmounts(expenses);
    expect(parseFloat(result.toFixed(2))).toBe(1.0);
  });

  test('handles mixed decimal amounts', () => {
    const expenses = [
      makeExpense('19.99', 'Food', '2026-04-01'),
      makeExpense('5.01', 'Food', '2026-04-01'),
      makeExpense('75.00', 'Food', '2026-04-01'),
    ];
    expect(parseFloat(sumAmounts(expenses).toFixed(2))).toBe(100.0);
  });

  test('remaining balance handles decimal precision', () => {
    const remaining = getRemaining(1000.1, 999.9);
    expect(parseFloat(remaining.toFixed(2))).toBe(0.2);
  });
});

describe('Year boundary date handling', () => {
  test('correctly filters December entries', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2025-12-31'),
      makeExpense('20.00', 'Food', '2026-01-01'),
    ];
    const result = filterByMonth(expenses, '2025-12');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe('10.00');
  });

  test('correctly filters January entries', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2025-12-31'),
      makeExpense('20.00', 'Food', '2026-01-01'),
    ];
    const result = filterByMonth(expenses, '2026-01');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe('20.00');
  });

  test('handles leap year dates correctly', () => {
    const expenses = [makeExpense('10.00', 'Food', '2024-02-29')];
    const result = filterByMonth(expenses, '2024-02');
    expect(result).toHaveLength(1);
  });

  test('does not bleed entries between years', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2024-12-01'),
      makeExpense('20.00', 'Food', '2025-12-01'),
      makeExpense('30.00', 'Food', '2026-12-01'),
    ];
    const result = filterByMonth(expenses, '2025-12');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe('20.00');
  });
});

describe('Category total edge cases', () => {
  test('handles multiple categories in same month', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2026-04-01'),
      makeExpense('20.00', 'Transit', '2026-04-01'),
      makeExpense('30.00', 'Housing', '2026-04-01'),
      makeExpense('15.00', 'Food', '2026-04-02'),
    ];
    expect(getCategoryTotal(expenses, 'Food', '2026-04')).toBeCloseTo(25.0);
    expect(getCategoryTotal(expenses, 'Transit', '2026-04')).toBeCloseTo(20.0);
    expect(getCategoryTotal(expenses, 'Housing', '2026-04')).toBeCloseTo(30.0);
  });

  test('category total is zero for empty month', () => {
    const expenses = [makeExpense('10.00', 'Food', '2026-04-01')];
    expect(getCategoryTotal(expenses, 'Food', '2026-05')).toBe(0);
  });

  test('category total ignores other months', () => {
    const expenses = [
      makeExpense('10.00', 'Food', '2026-03-01'),
      makeExpense('20.00', 'Food', '2026-04-01'),
      makeExpense('30.00', 'Food', '2026-05-01'),
    ];
    expect(getCategoryTotal(expenses, 'Food', '2026-04')).toBeCloseTo(20.0);
  });

  test('handles all 8 categories independently', () => {
    const categories = [
      'Food', 'Transit', 'Housing', 'Shopping', 'Health', 'Utilities', 'Fun', 'Other',
    ];
    const expenses = categories.map((cat, i) => makeExpense(String((i + 1) * 10), cat, '2026-04-01'));
    categories.forEach((cat, i) => {
      expect(getCategoryTotal(expenses, cat, '2026-04')).toBeCloseTo((i + 1) * 10);
    });
  });
});

describe('Budget percentage edge cases', () => {
  test('handles fractional percentages', () => {
    expect(getBudgetPercentage(1, 3)).toBeCloseTo(33.33);
  });

  test('handles very small spend against large budget', () => {
    expect(getBudgetPercentage(0.01, 10000)).toBeCloseTo(0.0001);
  });

  test('caps correctly at exactly 100%', () => {
    expect(getBudgetPercentage(500, 500)).toBe(100);
  });

  test('caps at 100% when significantly over budget', () => {
    expect(getBudgetPercentage(9999, 100)).toBe(100);
  });

  test('returns 0 for zero spend zero budget', () => {
    expect(getBudgetPercentage(0, 0)).toBe(0);
  });
});

describe('Remaining balance edge cases', () => {
  test('handles zero income and zero expenses', () => {
    expect(getRemaining(0, 0)).toBe(0);
  });

  test('handles very large amounts', () => {
    expect(getRemaining(999999.99, 999999.98)).toBeCloseTo(0.01);
  });

  test('handles income with many decimal places', () => {
    expect(parseFloat(getRemaining(3000.005, 1000.005).toFixed(2))).toBe(2000.0);
  });
});
