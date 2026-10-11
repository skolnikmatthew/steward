type PastEntry = { description: string; category: string };

function getSuggestions(
  input: string,
  pastEntries: PastEntry[],
  maxResults: number = 3
): PastEntry[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();
  const seen = new Set<string>();
  const results: PastEntry[] = [];
  for (const entry of pastEntries) {
    if (results.length >= maxResults) break;
    const key = `${entry.description}|${entry.category}`;
    if (entry.description.toLowerCase().startsWith(lower) && !seen.has(key)) {
      seen.add(key);
      results.push(entry);
    }
  }
  return results;
}

describe('Autocomplete suggestions', () => {
  const pastEntries: PastEntry[] = [
    { description: 'Groceries', category: 'Food' },
    { description: 'Groceries', category: 'Shopping' },
    { description: 'Gas station', category: 'Transit' },
    { description: 'Gym membership', category: 'Health' },
    { description: 'Netflix', category: 'Fun' },
    { description: 'Electric bill', category: 'Utilities' },
    { description: 'Ground coffee', category: 'Food' },
  ];

  test('returns empty array for input under 2 chars', () => {
    expect(getSuggestions('G', pastEntries)).toEqual([]);
  });

  test('returns empty array for empty input', () => {
    expect(getSuggestions('', pastEntries)).toEqual([]);
  });

  test('returns matching suggestions', () => {
    const results = getSuggestions('Gr', pastEntries);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.description.toLowerCase()).toMatch(/^gr/);
    });
  });

  test('is case insensitive', () => {
    const upper = getSuggestions('GR', pastEntries);
    const lower = getSuggestions('gr', pastEntries);
    expect(upper.length).toBe(lower.length);
  });

  test('returns max 3 results by default', () => {
    const results = getSuggestions('G', pastEntries);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  test('deduplicates same description + category', () => {
    const dupes: PastEntry[] = [
      { description: 'Groceries', category: 'Food' },
      { description: 'Groceries', category: 'Food' },
      { description: 'Groceries', category: 'Food' },
    ];
    const results = getSuggestions('Gr', dupes);
    expect(results).toHaveLength(1);
  });

  test('keeps same description with different categories as separate suggestions', () => {
    const results = getSuggestions('Gr', pastEntries);
    const groceries = results.filter((r) => r.description === 'Groceries');
    const categories = groceries.map((g) => g.category);
    const unique = new Set(categories);
    expect(unique.size).toBe(groceries.length);
  });

  test('returns no results when nothing matches', () => {
    expect(getSuggestions('xyz', pastEntries)).toHaveLength(0);
  });

  test('matches from start of string only', () => {
    const results = getSuggestions('station', pastEntries);
    expect(results).toHaveLength(0);
  });

  test('respects custom maxResults', () => {
    const results = getSuggestions('G', pastEntries, 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  test('handles empty pastEntries', () => {
    expect(getSuggestions('Gr', [])).toHaveLength(0);
  });

  test('handles exact match', () => {
    const results = getSuggestions('Groceries', pastEntries);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].description).toBe('Groceries');
  });
});
