/**
 * Supabase returns at most 1,000 rows per request, so long histories (years of daily logs) are read
 * in pages. `query(from, to)` must apply a stable order and `.range(from, to)`.
 */
export async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  max = 50000,
  pageSize = 1000,
): Promise<{ data: T[]; error?: string }> {
  const rows: T[] = [];
  for (let from = 0; from < max; from += pageSize) {
    const { data, error } = await query(from, Math.min(from + pageSize, max) - 1);
    if (error) return { data: rows, error: error.message };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows };
}
