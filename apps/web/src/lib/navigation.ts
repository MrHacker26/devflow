export function getSafeNextPath(next: string | null | undefined, fallback = '/workflows'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  return next;
}

export function loginHref(next?: string): string {
  if (!next) return '/login';
  return `/login?next=${encodeURIComponent(next)}`;
}
