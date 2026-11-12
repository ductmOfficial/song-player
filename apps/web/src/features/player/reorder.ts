/** Given a list before/after a single move, find where the item came from and went to. */
export function diffMove<T>(before: T[], after: T[]): { from: number; to: number } | null {
  let i = 0;
  while (i < before.length && before[i] === after[i]) i++;
  if (i === before.length) return null;
  let j = before.length - 1;
  while (j > i && before[j] === after[j]) j--;
  return after[i] === before[j] ? { from: j, to: i } : { from: i, to: j };
}
