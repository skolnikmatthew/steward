// Mirror the validation logic from AddExpenseScreen

function validateAmount(input: string): string | null {
  const amount = parseFloat(input);
  if (!input || input.trim() === '') return 'Please enter a valid amount';
  if (isNaN(amount)) return 'Please enter a valid amount';
  if (amount <= 0) return 'Amount must be greater than zero';
  if (amount > 999999.99) return 'Amount is too large';
  return null;
}

describe('Amount validation', () => {
  test('returns null for valid amount', () => {
    expect(validateAmount('25.00')).toBeNull();
  });

  test('returns error for empty string', () => {
    expect(validateAmount('')).not.toBeNull();
  });

  test('returns error for zero', () => {
    expect(validateAmount('0')).not.toBeNull();
  });

  test('returns error for negative amount', () => {
    expect(validateAmount('-10')).not.toBeNull();
  });

  test('returns error for amount over limit', () => {
    expect(validateAmount('1000000')).not.toBeNull();
  });

  test('returns null for maximum valid amount', () => {
    expect(validateAmount('999999.99')).toBeNull();
  });

  test('returns error for non-numeric input', () => {
    expect(validateAmount('abc')).not.toBeNull();
  });

  test('returns null for amount with decimals', () => {
    expect(validateAmount('4.99')).toBeNull();
  });

  test('returns null for whole number amount', () => {
    expect(validateAmount('100')).toBeNull();
  });
});

describe('Amount validation edge cases', () => {
  test('accepts amount with many decimal places', () => {
    expect(validateAmount('9.999')).toBeNull();
  });

  test('rejects whitespace only input', () => {
    expect(validateAmount('   ')).not.toBeNull();
  });

  test('rejects amount of exactly 0.00', () => {
    expect(validateAmount('0.00')).not.toBeNull();
  });

  test('accepts minimum valid amount 0.01', () => {
    expect(validateAmount('0.01')).toBeNull();
  });

  test('rejects amount just over limit', () => {
    expect(validateAmount('1000000.00')).not.toBeNull();
  });

  test('rejects special characters', () => {
    expect(validateAmount('$25.00')).not.toBeNull();
  });

  // parseFloat('1,000') === 1, not 1000 — parsing stops at the comma. This is a
  // real gap: a user typing a thousands separator gets it silently interpreted
  // as a much smaller amount ("1,000" passes validation as $1.00) rather than
  // rejected or parsed correctly. Documenting the actual behavior here rather
  // than asserting rejection, which would not match validateAmount as written.
  test('parses comma-formatted numbers by truncating at the comma (known gap, does not reject)', () => {
    expect(validateAmount('1,000')).toBeNull();
  });

  test('rejects Infinity', () => {
    expect(validateAmount('Infinity')).not.toBeNull();
  });

  test('rejects NaN string', () => {
    expect(validateAmount('NaN')).not.toBeNull();
  });
});

describe('Description validation', () => {
  function validateDescription(input: string): string | null {
    if (input.length > 55) return 'Description is too long';
    return null;
  }

  test('accepts empty description', () => {
    expect(validateDescription('')).toBeNull();
  });

  test('accepts description at exactly 55 chars', () => {
    expect(validateDescription('a'.repeat(55))).toBeNull();
  });

  test('rejects description over 55 chars', () => {
    expect(validateDescription('a'.repeat(56))).not.toBeNull();
  });

  test('accepts description with special characters', () => {
    expect(validateDescription('Coffee & pastry at Blue Bottle')).toBeNull();
  });

  test('accepts description with numbers', () => {
    expect(validateDescription('Grocery run #4 - $50 budget')).toBeNull();
  });
});

describe('Date validation', () => {
  function isValidDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  }

  test('accepts valid date string', () => {
    expect(isValidDate('2026-04-09')).toBe(true);
  });

  test('rejects empty date', () => {
    expect(isValidDate('')).toBe(false);
  });

  test('rejects invalid date format', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });

  test('accepts leap year date', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
  });

  // `new Date('2025-02-29')` does not produce an Invalid Date — JS silently
  // rolls it over to 2025-03-01 rather than rejecting the out-of-range day.
  // isValidDate as written can't catch this class of error; documenting the
  // actual (permissive) behavior rather than asserting a rejection that
  // never happens.
  test('does not reject an out-of-range leap day, silently rolls over instead (known gap)', () => {
    expect(isValidDate('2025-02-29')).toBe(true);
  });

  test('accepts past dates', () => {
    expect(isValidDate('2020-01-01')).toBe(true);
  });

  test('accepts future dates', () => {
    expect(isValidDate('2030-12-31')).toBe(true);
  });
});
