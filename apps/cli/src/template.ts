export function applyTemplate(
  input: string,
  variables: ReadonlyMap<string, string>,
): { ok: true; value: string } | { ok: false; message: string } {
  const missing: string[] = [];
  const value = input.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, raw: string) => {
    const name = raw.trim();
    if (!name || !variables.has(name)) {
      missing.push(name || match);
      return match;
    }
    return variables.get(name) ?? '';
  });

  const first = missing[0];
  if (first) return { ok: false, message: `Variable "${first}" is not set.` };
  return { ok: true, value };
}
