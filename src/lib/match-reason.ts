import { formatPriceRange } from "./format";

interface MatchReasonInput {
  budgetScore: number;
  distanceKm: number;
  localityScore: number;
  localityName: string;
  prefBudgetMin: number;
  prefBudgetMax: number;
}

export function buildMatchReason(i: MatchReasonInput): string {
  const budgetGood = i.budgetScore >= 0.85;
  const closeBy = i.distanceKm <= 3;
  const goodLocality = i.localityScore >= 0.8;
  const budgetText = formatPriceRange(i.prefBudgetMin, i.prefBudgetMax);

  if (budgetGood && goodLocality) {
    return `Matches your ${budgetText} budget in ${i.localityName}`;
  }
  if (closeBy && goodLocality) {
    return `Just ${i.distanceKm.toFixed(1)} km away in highly-rated ${i.localityName}`;
  }
  if (budgetGood && closeBy) {
    return `Within your ${budgetText} budget, only ${i.distanceKm.toFixed(1)} km away`;
  }
  if (budgetGood) return `Fits your ${budgetText} budget`;
  if (closeBy) return `Closest to you (${i.distanceKm.toFixed(1)} km)`;
  if (goodLocality) return `Strong locality fit in ${i.localityName}`;
  return `Strong overall fit for your preferences`;
}
