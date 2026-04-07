export function formatUserDisplayName(user: { name?: string | null; email: string }) {
  if (user.name?.trim()) {
    return user.name.trim();
  }

  const base = user.email.split("@")[0] ?? "Warehouse User";

  return base
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
