export interface RemarkWithKey {
  id?: string;
  user: string;
  date: Date | string;
  text: string;
}

export function remarkKey(remark: RemarkWithKey, index: number): string {
  return remark.id ?? String(index);
}

export function findRemarkIndex(remarks: RemarkWithKey[], key: string): number {
  if (/^\d+$/.test(key)) {
    const i = parseInt(key, 10);
    return i >= 0 && i < remarks.length ? i : -1;
  }
  return remarks.findIndex((r, idx) => (r.id ?? String(idx)) === key || r.id === key);
}

export function updateRemarkText(
  remarks: RemarkWithKey[],
  key: string,
  text: string,
): RemarkWithKey[] | null {
  const idx = findRemarkIndex(remarks, key);
  if (idx < 0) return null;
  return remarks.map((r, i) => (i === idx ? { ...r, text: text.trim() } : r));
}
