/** Compares persisted skills with the current local selection without relying on UI order. */
export function sameIds(first: readonly string[], second: readonly string[]) {
  if (first.length !== second.length) return false;
  const sortedFirst = [...first].sort();
  const sortedSecond = [...second].sort();
  return sortedFirst.every((id, index) => id === sortedSecond[index]);
}
