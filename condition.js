/***************************************************************************************
 * condition.js
 * 
 * Modified to include a "frequency of use" factor when calculating the wear & tear
 * condition (in percent). 
 *
 * This is the ONLY FILE that changes. Everything else (index.html, style.css, data.js,
 * fabric.js, history.js, ui.js, script.js) remains the same as before.
 ***************************************************************************************/

// A quick helper: clamp a value between min and max.
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates wear & tear condition as % (0-100).
 *   100% = like new
 *   0%   = fully worn out
 *
 * Now includes a "frequency of use" factor, derived from usageCount vs. item age in months.
 */
window.calculateCondition = function (item) {
  const totalWashes = item.washHistory.length;
  const totalUses   = item.usageHistory.length;

  // Retrieve category-specific durability or default
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

  // Adjusted durability thresholds from category + fabric
  const maxUses   = catDur.maxUses   * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;
  const maxYears  = catDur.maxYears  * weightedMultiplier;

  // Age in years (decimal)
  const purchaseDate = new Date(item.purchaseDate);
  const now          = new Date();
  const yearsOwned   = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
  
  // Convert to months to measure usage frequency more granually
  const monthsOwned = yearsOwned * 12; 
  // Avoid division by zero
  if (monthsOwned < 0.01) {
    // If the item is extremely new, just treat frequency as 0 for now
    // (or you can short-circuit the formula and return near-100% condition)
    return 100;
  }

  // Base factors (range 0..1)
  const ageFactor  = clamp(yearsOwned / maxYears, 0, 1);
  const useFactor  = clamp(totalUses   / maxUses,  0, 1);
  const washFactor = clamp(totalWashes / maxWashes,0, 1);

  /**
   * 1) Compute usage FREQUENCY
   *    - usageFrequency = totalUses / monthsOwned
   *      e.g., 5 uses over 2 months = 2.5 uses per month
   * 
   * 2) Compare usageFrequency to a typical threshold for "high usage".
   *    Let's define 5 uses/month as "high usage" => so usageFrequency / 5 => scale 0..1
   */
  const usageFrequency = totalUses / monthsOwned;  // uses per month
  const freqThreshold  = 5;  // e.g., 5 uses/month is "high"
  let frequencyFactor  = usageFrequency / freqThreshold; // scale
  if (frequencyFactor > 1) {
    frequencyFactor = 1; // clamp
  }
  // Now frequencyFactor is 0..1 (0 = no use, 1 = very frequent use)

  // Combine everything into a "wearScore"
  // The higher the ageFactor/useFactor/washFactor/frequencyFactor,
  // the lower the final condition.
  // We'll incorporate frequencyFactor with a moderate weight, e.g., 0.2
  const wearScore = 1 - (
    0.3 * ageFactor +
    0.3 * useFactor +
    0.2 * washFactor +
    0.2 * frequencyFactor
  );

  // Convert to a 0..100 condition scale
  let conditionPercent = wearScore * 100;
  if (conditionPercent < 0)   conditionPercent = 0;
  if (conditionPercent > 100) conditionPercent = 100;

  return Math.round(conditionPercent);
};
