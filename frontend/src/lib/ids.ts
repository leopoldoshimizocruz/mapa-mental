export function novoId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}
