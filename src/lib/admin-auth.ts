export function getAdminKey(): string | undefined {
  return process.env.ADMIN_KEY?.trim() || undefined;
}

export function isAdminAuthorized(request: Request): boolean {
  const key = getAdminKey();
  if (!key) return true;
  const header = request.headers.get("x-admin-key")?.trim();
  const url = new URL(request.url);
  const q = url.searchParams.get("key")?.trim();
  return header === key || q === key;
}
