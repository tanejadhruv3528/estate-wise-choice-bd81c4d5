export type UrgencyBadge =
  | "high-demand"
  | "limited-inventory"
  | "appreciation"
  | null;

export function pickUrgencyBadge(
  localityScore: number,
  manualPriority: number,
): UrgencyBadge {
  if (manualPriority >= 0.8) return "limited-inventory";
  if (localityScore >= 0.85) return "high-demand";
  if (localityScore >= 0.7) return "appreciation";
  return null;
}

export function urgencyBadgeLabel(b: UrgencyBadge): string | null {
  switch (b) {
    case "high-demand":
      return "High demand area";
    case "limited-inventory":
      return "Limited inventory";
    case "appreciation":
      return "Price appreciation zone";
    default:
      return null;
  }
}
