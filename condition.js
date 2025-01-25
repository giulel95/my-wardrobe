/**
 * Calculates wear & tear condition as % (0-100).
 *  100% = like new
 *  0%   = fully worn
 */
window.calculateCondition = function(item) {
  const totalWashes = item.washHistory.length;
  const totalUses = item.usageHistory.length;

  const catDur = window.categoryDurability[item.category] || { maxUses: 100, maxWashes: 50, maxYears: 2 };
  
  // Weighted multiplier from fabrics
  let weightedMultiplier = 0;
  if (Array.isArray(item.fabrics) && item.fabrics.length > 0) {
    item.fabrics.forEach((fab) => {
      const data = window.fabricDurability[fab.type] || { durabilityMultiplier: 1.0 };
      const fraction = (fab.percentage || 0) / 100;
      weightedMultiplier += data.durabilityMultiplier * fraction;
    });
  } else {
    weightedMultiplier = 1.0;
  }

  const maxUses   = catDur.maxUses   * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;
  const maxYears  = catDur.maxYears  * weightedMultiplier;

  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const yearsOwned = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365);

  // Normalize factors to 0..1
  const ageFactor  = Math.min(yearsOwned / maxYears, 1);
  const useFactor  = Math.min(totalUses / maxUses, 1);
  const washFactor = Math.min(totalWashes / maxWashes, 1);

  const wearScore = 1 - (0.4 * ageFactor + 0.3 * useFactor + 0.3 * washFactor);
  let conditionPercent = wearScore * 100;
  if (conditionPercent < 0) conditionPercent = 0;
  if (conditionPercent > 100) conditionPercent = 100;

  return Math.round(conditionPercent);
};
