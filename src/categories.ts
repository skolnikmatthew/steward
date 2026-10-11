export type Category = {
  id: string;
  label: string;
};

export const CATEGORIES: Category[] = [
  { id: 'food',          label: 'Food'      },
  { id: 'transport',     label: 'Transit'   },
  { id: 'housing',       label: 'Housing'   },
  { id: 'shopping',      label: 'Shopping'  },
  { id: 'entertainment', label: 'Fun'       },
  { id: 'health',        label: 'Health'    },
  { id: 'travel',        label: 'Travel'    },
  { id: 'other',         label: 'Other'     },
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
