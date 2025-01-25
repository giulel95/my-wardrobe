import { categoryDurability, fabricDurability } from './fabric.js';

/**
 * Calculates the wear & tear condition as a percentage (0-100).
 *  - 0% means "fully worn out"
 *  - 100% means "like new"
 */
export function calculateCondition(item) {
  const totalWashes = item.washHistory.length;
  const totalUses   = item.usageHistory.length;

  // Retrieve category-specific durability or default
  const catDur = categoryDurability[item.category] || { maxUses: 100, maxWashes: 50, maxYears: 2 };

  // Weighted fabric multiplier
  let weightedMultiplier = 0;
  if (Array.isArray(item.fabrics) && item.fabrics.length > 0) {
    item.fabrics.forEach((fab) => {
      const data = fabricDurability[fab.type] || { durabilityMultiplier: 1.0 };
      const fraction = (fab.percentage || 0) / 100;
      weightedMultiplier += data.durabilityMultiplier * fraction;
    });
  } else {
    weightedMultiplier = 1.0;
  }

  // Adjusted category thresholds
  const maxUses   = catDur.maxUses   * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;
  const maxYears  = catDur.maxYears  * weightedMultiplier;

  // Calculate age in years
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const yearsOwned = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365);

  // Factors from 0.0 to 1.0
  const ageFactor  = Math.min(yearsOwned / maxYears, 1);
  const useFactor  = Math.min(totalUses / maxUses, 1);
  const washFactor = Math.min(totalWashes / maxWashes, 1);

  // Weighted sum of wear influences
  const wearScore = 1 - (0.4 * ageFactor + 0.3 * useFactor + 0.3 * washFactor);

  // Convert to a percentage
  let conditionPercent = wearScore * 100;
  if (conditionPercent < 0) conditionPercent = 0;
  if (conditionPercent > 100) conditionPercent = 100;

  return Math.round(conditionPercent);
}
