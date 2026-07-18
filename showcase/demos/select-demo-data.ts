import type { SelectOption } from '../../src/types';
import { filterOptions } from '../../src/select/select-utils';

export const COUNTRIES: SelectOption[] = [
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'cn', label: 'China' },
  { value: 'dk', label: 'Denmark' },
  { value: 'eg', label: 'Egypt' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'in', label: 'India' },
  { value: 'id', label: 'Indonesia' },
  { value: 'it', label: 'Italy' },
  { value: 'jp', label: 'Japan' },
  { value: 'ke', label: 'Kenya' },
  { value: 'mx', label: 'Mexico' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'nz', label: 'New Zealand' },
  { value: 'no', label: 'Norway' },
  { value: 'pt', label: 'Portugal' },
  { value: 'sg', label: 'Singapore' },
  { value: 'za', label: 'South Africa' },
  { value: 'es', label: 'Spain' },
  { value: 'lk', label: 'Sri Lanka' },
  { value: 'se', label: 'Sweden' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'th', label: 'Thailand' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'us', label: 'United States' },
  { value: 'vn', label: 'Vietnam' },
  { value: 'atlantis', label: 'Atlantis (disabled)', disabled: true },
];

/** Fake async source: resolves the filtered country list after ~600ms. */
export const searchCountries = (query: string): Promise<SelectOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(filterOptions(COUNTRIES, query)), 600);
  });
